import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Middleware Configuration
 * 
 * Protects against brute force attacks and API abuse
 * Different limits for different endpoint types
 * 
 * Uses in-memory store by default, Redis can be enabled when available.
 */

// Try to use Redis store if available, otherwise use default memory store
let createStore: ((prefix: string) => any) | null = null;

try {
  // Dynamically require to avoid crashes when Redis is not available
  const RedisStore = require('rate-limit-redis').default;
  const { getRedisClient } = require('../config/redis-connection');
  const redisClient = getRedisClient();
  
  if (redisClient) {
    createStore = (prefix: string) => {
      return new RedisStore({
        sendCommand: (...args: string[]) => (redisClient as any).call(...args),
        prefix: `rl:${prefix}:`,
      });
    };
    console.log('📊 Rate limiter using Redis store');
  }
} catch (e) {
  console.log('📊 Rate limiter using memory store (Redis not available)');
}

// General API rate limiter - 1000 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('api') } : {}),
});

// Strict rate limiter for authentication endpoints - High limit for E2E testing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for E2E testing - reduce to 10-20 in production
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for E2E test requests
  skip: (req) => req.headers['x-test-source'] === 'playwright-e2e',
  ...(createStore ? { store: createStore('auth') } : {}),
});

// Moderate rate limiter for password reset - 3 requests per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('pwd_reset') } : {}),
});

// Demo access rate limiter - 10 demo accesses per hour per IP
export const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    message: 'Too many demo access attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('demo') } : {}),
});

// Payment webhook rate limiter - More generous for payment gateways
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    message: 'Too many webhook requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('webhook') } : {}),
});

// Super admin endpoints - More generous for administrative tasks
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('admin') } : {}),
});

// File upload rate limiter - 20 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  ...(createStore ? { store: createStore('upload') } : {}),
});
