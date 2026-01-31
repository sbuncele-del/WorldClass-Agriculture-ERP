import { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * 
 * Adds additional security headers beyond helmet defaults
 */

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // CSP disabled - not needed for API-only backend
  // CSP is for HTML pages served to browsers, our backend only serves JSON

  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

/**
 * IP Whitelist Middleware
 * For super sensitive endpoints (optional)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.socket.remoteAddress || '';

    if (!allowedIPs.includes(clientIP)) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
      return;
    }

    next();
  };
};

/**
 * SQL Injection Prevention Helper
 * Validates that strings don't contain SQL injection patterns
 */
export const sanitizeSqlInput = (input: string): string => {
  // Remove common SQL injection patterns
  const dangerous = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi;
  
  if (dangerous.test(input)) {
    throw new Error('Invalid input detected');
  }

  return input.trim();
};

/**
 * XSS Prevention Helper
 * Escapes HTML special characters
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Request Logging for Security Audit
 */
export const securityLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const sensitiveEndpoints = ['/api/auth', '/api/admin', '/api/payment'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));

  if (isSensitive) {
    console.log('[Security] Request:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Honeypot Field Detector
 * Detects bot submissions by checking for honeypot fields
 */
export const honeypotDetector = (honeypotFieldName: string = 'website') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If honeypot field is filled, it's likely a bot
    if (req.body[honeypotFieldName]) {
      res.status(400).json({
        success: false,
        message: 'Validation failed'
      });
      return;
    }

    next();
  };
};

export default {
  securityHeaders,
  ipWhitelist,
  sanitizeSqlInput,
  escapeHtml,
  securityLogger,
  honeypotDetector,
};
