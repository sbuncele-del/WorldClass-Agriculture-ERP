/**
 * Audit Logging Middleware
 * Enterprise-grade audit trail for SOX, GDPR, and regulatory compliance
 * 
 * Tracks all data modifications with:
 * - Who made the change (user ID, email)
 * - What changed (entity, field, old/new values)
 * - When it happened (timestamp)
 * - Where from (IP address, user agent)
 * - Why (action type: CREATE, UPDATE, DELETE)
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// Database connection for audit logging
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Audit action types
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SUBMIT = 'SUBMIT',
}

// Audit log entry interface
export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  tenantId?: number;
  action: AuditAction;
  entityType: string;
  entityId?: string | number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an audit entry to the database
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_log (
        user_id, user_email, tenant_id, action, entity_type, entity_id,
        old_values, new_values, changed_fields, ip_address, user_agent,
        request_method, request_path, status_code, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())`,
      [
        entry.userId || null,
        entry.userEmail || null,
        entry.tenantId || null,
        entry.action,
        entry.entityType,
        entry.entityId?.toString() || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.changedFields || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.requestMethod || null,
        entry.requestPath || null,
        entry.statusCode || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
  } catch (error) {
    // Log error but don't fail the request
    console.error('[AUDIT] Failed to log audit entry:', error);
  }
}

/**
 * Calculate changed fields between old and new values
 */
export function getChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): string[] {
  const changedFields: string[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
  
  for (const key of allKeys) {
    // Skip internal fields
    if (['updated_at', 'created_at', 'password', 'password_hash'].includes(key)) continue;
    
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

/**
 * Sanitize sensitive fields from audit log
 */
export function sanitizeForAudit(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password', 'password_hash', 'token', 'refresh_token', 
    'api_key', 'secret', 'credit_card', 'ssn', 'tax_id'
  ];
  
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Determine entity type from request path
 */
export function getEntityTypeFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  // Skip 'api' prefix and return the module/entity name
  if (segments[0] === 'api' && segments.length > 1) {
    return segments[1]; // e.g., 'logistics', 'financial', 'hr'
  }
  return segments[0] || 'unknown';
}

/**
 * Determine action from HTTP method
 */
export function getActionFromMethod(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditAction.CREATE;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    case 'GET':
      return AuditAction.READ;
    default:
      return AuditAction.READ;
  }
}

/**
 * Middleware to automatically log audit trail for all modifying requests
 */
export function auditMiddleware(options?: {
  logReads?: boolean;
  entityType?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    
    // Skip GET requests unless explicitly enabled
    if (method === 'GET' && !options?.logReads) {
      return next();
    }
    
    // Skip health checks and static files
    if (req.path === '/health' || req.path.startsWith('/static')) {
      return next();
    }
    
    const startTime = Date.now();
    const user = (req as any).user;
    
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseBody: any;
    
    // Override response methods to capture response
    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };
    
    // Log after response is sent
    res.on('finish', async () => {
      // Only log successful modifications (2xx status codes)
      const isModification = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      if (isModification && isSuccess) {
        const entry: AuditLogEntry = {
          userId: user?.userId || user?.id,
          userEmail: user?.email,
          tenantId: user?.tenantId,
          action: getActionFromMethod(method),
          entityType: options?.entityType || getEntityTypeFromPath(req.path),
          entityId: req.params?.id,
          newValues: method !== 'DELETE' ? sanitizeForAudit(req.body) : undefined,
          ipAddress: getClientIP(req),
          userAgent: req.headers['user-agent'],
          requestMethod: method,
          requestPath: req.path,
          statusCode: res.statusCode,
          metadata: {
            duration: Date.now() - startTime,
            query: req.query,
          },
        };
        
        await logAuditEntry(entry);
      }
    });
    
    next();
  };
}

/**
 * Manual audit logging function for custom events
 */
export async function audit(
  req: Request,
  action: AuditAction,
  entityType: string,
  entityId?: string | number,
  details?: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  const user = (req as any).user;
  
  const entry: AuditLogEntry = {
    userId: user?.userId || user?.id,
    userEmail: user?.email,
    tenantId: user?.tenantId,
    action,
    entityType,
    entityId,
    oldValues: details?.oldValues ? sanitizeForAudit(details.oldValues) : undefined,
    newValues: details?.newValues ? sanitizeForAudit(details.newValues) : undefined,
    changedFields: details?.oldValues && details?.newValues 
      ? getChangedFields(details.oldValues, details.newValues)
      : undefined,
    ipAddress: getClientIP(req),
    userAgent: req.headers['user-agent'],
    requestMethod: req.method,
    requestPath: req.path,
    metadata: details?.metadata,
  };
  
  await logAuditEntry(entry);
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: number;
  tenantId?: number;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (filters.userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(filters.userId);
  }
  if (filters.tenantId) {
    conditions.push(`tenant_id = $${paramIndex++}`);
    params.push(filters.tenantId);
  }
  if (filters.entityType) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(filters.entityType);
  }
  if (filters.entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(filters.entityId);
  }
  if (filters.action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(filters.action);
  }
  if (filters.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(filters.endDate);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM audit_log ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);
  
  // Get paginated results
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  const logsResult = await pool.query(
    `SELECT * FROM audit_log ${whereClause} 
     ORDER BY created_at DESC 
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limit, offset]
  );
  
  return {
    logs: logsResult.rows,
    total,
  };
}

export default {
  auditMiddleware,
  audit,
  logAuditEntry,
  queryAuditLogs,
  AuditAction,
  sanitizeForAudit,
  getChangedFields,
};
