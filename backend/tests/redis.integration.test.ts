/**
 * Integration-style tests using ioredis-mock to validate Redis plumbing.
 */
import { Request, Response } from 'express';
import { redisService } from '../src/services/redis.service';
import { createCacheMiddleware } from '../src/middleware/cache.middleware';
import { createRedisClient } from '../src/config/redis-connection';

// Environment for Redis mock
process.env.USE_REDIS_MOCK = 'true';
process.env.EMAIL_QUEUE_CONCURRENCY = '2';

// Mock Bull to avoid requiring a real Redis server in tests
jest.mock('bull', () => {
  class FakeJob {
    id: number;
    data: any;
    opts: any;
    attemptsMade = 0;
    private resolveFn?: (value: any) => void;
    private promise: Promise<any>;
    constructor(data: any, opts: any, private processor: (job: any) => Promise<any>) {
      this.id = Date.now();
      this.data = data;
      this.opts = opts;
      this.promise = new Promise((resolve) => {
        this.resolveFn = resolve;
      });
      setImmediate(async () => {
        const result = await this.processor(this);
        this.resolveFn?.(result);
      });
    }
    finished() {
      return this.promise;
    }
  }

  class FakeQueue {
    private processor: any;
    constructor(public name: string, public opts: any) {}
    process(_concurrency: number, handler: any) {
      this.processor = handler;
    }
    add(data: any, opts: any) {
      return new FakeJob(data, opts, this.processor);
    }
    on() { return this; }
    isPaused() { return Promise.resolve(false); }
    pause() { return Promise.resolve(); }
    resume() { return Promise.resolve(); }
    getWaitingCount() { return Promise.resolve(0); }
    getActiveCount() { return Promise.resolve(0); }
    getCompletedCount() { return Promise.resolve(0); }
    getFailedCount() { return Promise.resolve(0); }
    getDelayedCount() { return Promise.resolve(0); }
    getFailed() { return Promise.resolve([]); }
    getJob() { return Promise.resolve(null); }
    clean() { return Promise.resolve([]); }
    close() { return Promise.resolve(); }
  }

  return { __esModule: true, default: FakeQueue };
});

jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

let emailQueue: any;
let queueEmail: any;
let logSpy: jest.SpyInstance;

describe('Redis integration', () => {
  beforeAll(async () => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const emailModule = await import('../src/queues/email.queue');
    emailQueue = emailModule.emailQueue;
    queueEmail = emailModule.queueEmail;
  });

  afterAll(async () => {
    await emailQueue.close();
    await redisService.getClient().quit();
    logSpy.mockRestore();
  });

  test('redis health/ping works', async () => {
    const client = createRedisClient('client');
    const start = Date.now();
    const pong = await client.ping();
    const latency = Date.now() - start;
    expect(pong).toBe('PONG');
    expect(latency).toBeGreaterThanOrEqual(0);
    await client.quit();
  });

  test('cache middleware caches and serves hits', async () => {
    const middleware = createCacheMiddleware({ prefix: 'test-cache', ttlSeconds: 30 });
    const req = { originalUrl: '/foo', query: { id: 1 } } as unknown as Request;

    const res: Partial<Response> & { body?: any } = {
      json(payload: any) {
        this.body = payload;
        return payload as any;
      },
    };

    const next = jest.fn(() => res.json!({ data: 'fresh' }));

    // First call should miss and invoke next
    await middleware(req, res as Response, next as any);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ data: 'fresh' });

    // Second call should be served from cache and not call next again
    next.mockClear();
    res.body = undefined;
    await middleware(req, res as Response, next as any);
    expect(next).not.toHaveBeenCalled();
    expect(res.body?._cache?.hit).toBe(true);
  });

  test('email queue processes jobs with mock redis', async () => {
    const job = await queueEmail({
      to: 'test@example.com',
      subject: 'Hello',
      template: 'welcome',
      variables: { name: 'Test' },
    });

    const result = await job.finished();
    expect(result).toHaveProperty('success', true);
  });
});
