import Redis from 'ioredis';
import { createRedisClient, RedisClient } from '../config/redis-connection';

/**
 * RedisService
 * Shared Redis utilities for caching, health, and pub/sub helpers.
 * 
 * MULTI-TENANCY:
 * - Use tenant-prefixed methods (getTenant, setTenant, etc.) for tenant-specific data
 * - Regular methods (get, set, etc.) are for global/system data only
 * - Tenant keys follow format: tenant:{tenantId}:{key}
 */
export class RedisService {
  private client: RedisClient;

  constructor(client?: RedisClient) {
    this.client = client ?? createRedisClient('client');
  }

  getClient(): RedisClient {
    return this.client;
  }

  async ping(): Promise<boolean> {
    const result = await this.client.ping();
    return result === 'PONG';
  }

  // ============================================
  // TENANT-SCOPED METHODS (Use for tenant data)
  // ============================================

  /**
   * Build a tenant-scoped key
   */
  private tenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  /**
   * Get a tenant-scoped value
   */
  async getTenant<T = unknown>(tenantId: string, key: string): Promise<T | null> {
    const fullKey = this.tenantKey(tenantId, key);
    const value = await this.client.get(fullKey);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set a tenant-scoped value
   */
  async setTenant<T = unknown>(tenantId: string, key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
    const fullKey = this.tenantKey(tenantId, key);
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(fullKey, payload, 'EX', ttlSeconds);
    }
    return this.client.set(fullKey, payload);
  }

  /**
   * Delete a tenant-scoped key
   */
  async delTenant(tenantId: string, key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) 
      ? key.map(k => this.tenantKey(tenantId, k))
      : [this.tenantKey(tenantId, key)];
    return this.client.del(keys);
  }

  /**
   * Get TTL for a tenant-scoped key
   */
  async ttlTenant(tenantId: string, key: string): Promise<number> {
    return this.client.ttl(this.tenantKey(tenantId, key));
  }

  /**
   * Flush all keys for a specific tenant
   */
  async flushTenant(tenantId: string): Promise<number> {
    const prefix = `tenant:${tenantId}:`;
    const keys = await this.client.keys(`${prefix}*`);
    if (!keys.length) return 0;
    const pipeline = this.client.pipeline();
    keys.forEach((k) => pipeline.del(k));
    const results = await pipeline.exec();
    return results?.length || 0;
  }

  /**
   * Get all keys for a tenant matching a pattern
   */
  async keysTenant(tenantId: string, pattern: string = '*'): Promise<string[]> {
    const prefix = `tenant:${tenantId}:`;
    const keys = await this.client.keys(`${prefix}${pattern}`);
    // Strip tenant prefix for cleaner return
    return keys.map(k => k.substring(prefix.length));
  }

  // ============================================
  // GLOBAL METHODS (Use for system/config data)
  // ============================================

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(key, payload, 'EX', ttlSeconds);
    }
    return this.client.set(key, payload);
  }

  async del(key: string | string[]): Promise<number> {
    return this.client.del(Array.isArray(key) ? key : [key]);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async flushPrefix(prefix: string): Promise<number> {
    const keys = await this.client.keys(`${prefix}*`);
    if (!keys.length) return 0;
    const pipeline = this.client.pipeline();
    keys.forEach((k) => pipeline.del(k));
    const results = await pipeline.exec();
    return results?.length || 0;
  }
}

export async function redisHealthCheck(): Promise<{ status: 'up' | 'down'; latencyMs: number }> {
  const client: RedisClient = createRedisClient('client');
  const start = Date.now();
  try {
    await client.ping();
    const latencyMs = Date.now() - start;
    await client.quit();
    return { status: 'up', latencyMs };
  } catch (error) {
    console.error('Redis health check failed:', error);
    await client.quit();
    return { status: 'down', latencyMs: -1 };
  }
}

export const redisService = new RedisService();

/**
 * Helper to build new pub/sub clients (Socket.IO adapter)
 */
export const buildPubSubClients = (): { pubClient: RedisClient; subClient: RedisClient } => {
  const pubClient = createRedisClient('client');
  const subClient = createRedisClient('subscriber');
  return { pubClient, subClient };
};
