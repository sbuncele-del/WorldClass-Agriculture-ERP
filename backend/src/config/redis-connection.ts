import Redis from 'ioredis';
import { redisConfig } from './redis.config';

// Allow test environments to swap in an in-memory Redis mock
const useMock = process.env.USE_REDIS_MOCK === 'true';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RedisCtor: typeof Redis = useMock ? require('ioredis-mock') : Redis;

export type RedisClient = InstanceType<typeof Redis>;

/**
 * Redis Connection Pooling & Management
 * 
 * We maintain two primary persistent connections:
 * 1. defaultClient: For general commands (SET, GET), caching, rate limiting, and publishing events.
 * 2. subscriberClient: Dedicated connection for subscribing to channels (Redis blocks this connection).
 * 
 * Bull queues will create their own connections using the 'createClient' factory.
 */

// Singleton instance for general operations
let defaultClient: RedisClient | null = null;

// Singleton instance for subscriptions
let subscriberClient: RedisClient | null = null;

export const getRedisClient = (): RedisClient => {
  if (!defaultClient) {
    console.log('🔌 Initializing Redis Default Client...');
    defaultClient = new RedisCtor(redisConfig as any);
    
    defaultClient.on('error', (err) => {
      console.error('❌ Redis Default Client Error:', err);
    });

    defaultClient.on('connect', () => {
      console.log('✅ Redis Default Client Connected');
    });
  }
  return defaultClient;
};

export const getRedisSubscriber = (): RedisClient => {
  if (!subscriberClient) {
    console.log('🔌 Initializing Redis Subscriber Client...');
    subscriberClient = new RedisCtor({
      ...redisConfig,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    } as any);
    
    subscriberClient.on('error', (err) => {
      console.error('❌ Redis Subscriber Client Error:', err);
    });

    subscriberClient.on('connect', () => {
      console.log('✅ Redis Subscriber Client Connected');
    });
  }
  return subscriberClient;
};

/**
 * Factory function for libraries that need new connections (e.g., Bull)
 */
export const createRedisClient = (type: 'client' | 'subscriber' | 'bclient'): RedisClient => {
  const options = { ...redisConfig } as any;

  // Bull does not allow enableReadyCheck/maxRetriesPerRequest for subscriber/bclient
  if (type === 'subscriber' || type === 'bclient') {
    options.enableReadyCheck = false;
    options.maxRetriesPerRequest = null;
  }

  switch (type) {
    case 'client':
      return getRedisClient(); // Reuse default for 'client' type if possible, or create new if library demands
    case 'subscriber':
      return getRedisSubscriber(); // Reuse subscriber? Bull usually wants its own.
    case 'bclient':
      return new RedisCtor(options);
    default:
      return new RedisCtor(options);
  }
};

// Graceful shutdown
export const closeRedisConnections = async () => {
  if (defaultClient) {
    await defaultClient.quit();
    defaultClient = null;
  }
  if (subscriberClient) {
    await subscriberClient.quit();
    subscriberClient = null;
  }
};
