import Redis from 'ioredis';

// Allow test environments to swap in an in-memory Redis mock
const useMock = process.env.USE_REDIS_MOCK === 'true';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RedisCtor: typeof Redis = useMock ? require('ioredis-mock') : Redis;

/**
 * Redis Configuration
 * 
 * Provides Redis connection for:
 * - Job queues (Bull)
 * - Caching
 * - Session storage
 * - Rate limiting
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_TLS = process.env.REDIS_TLS === 'true';

export const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('❌ Redis connection failed after 10 retries');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    console.log(`⏳ Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  ...(REDIS_TLS && {
    tls: {
      rejectUnauthorized: false, // For self-signed certificates in dev
    },
  }),
};

// Create Redis client instance
export const redisClient = new RedisCtor(redisConfig as any);

// Connection event handlers
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (error) => {
  console.error('❌ Redis client error:', error);
});

redisClient.on('close', () => {
  console.log('⚠️ Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏳ Closing Redis connection...');
  await redisClient.quit();
  console.log('✅ Redis connection closed');
});

export default redisClient;
