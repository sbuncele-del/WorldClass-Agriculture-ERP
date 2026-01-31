/**
 * Base Repository - Multi-Tenant ERP Pattern
 * 
 * Provides automatic tenant isolation for all database operations.
 * All module repositories extend this class to ensure data isolation.
 * 
 * Features:
 * - Automatic tenant_id filtering on all queries
 * - Type-safe operations with generics
 * - Audit trail support (created_by, updated_by)
 * - Soft delete support
 * - Pagination helpers
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { pool } from '../config/database';

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  includeDeleted?: boolean;
  client?: PoolClient;  // For transactions
}

export abstract class BaseRepository<T> {
  protected pool: Pool = pool;
  protected abstract tableName: string;
  protected abstract schema: string;
  protected primaryKey: string = 'id';
  protected softDelete: boolean = true;

  /**
   * Get the fully qualified table name (schema.table)
   */
  protected get fullTableName(): string {
    return `${this.schema}.${this.tableName}`;
  }

  /**
   * Execute a query with tenant isolation
   */
  protected async query<R = any>(
    sql: string,
    params: any[] = [],
    options?: QueryOptions
  ): Promise<QueryResult<R>> {
    const client = options?.client || this.pool;
    return client.query<R>(sql, params);
  }

  /**
   * Find all records for a tenant with optional filters
   */
  async findAll(
    ctx: TenantContext,
    filters: Record<string, any> = {},
    pagination?: PaginationOptions,
    options?: QueryOptions
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = pagination || {};
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [ctx.tenantId];
    let paramIndex = 2;

    // Add soft delete filter
    if (this.softDelete && !options?.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    // Add custom filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`${key} = ANY($${paramIndex})`);
        } else if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`${key} ILIKE $${paramIndex}`);
        } else {
          conditions.push(`${key} = $${paramIndex}`);
        }
        params.push(value);
        paramIndex++;
      }
    }

    const whereClause = conditions.join(' AND ');

    // Count total records
    const countQuery = `SELECT COUNT(*) FROM ${this.fullTableName} WHERE ${whereClause}`;
    const countResult = await this.query(countQuery, params, options);
    const total = parseInt(countResult.rows[0].count, 10);

    // Fetch paginated data
    const dataQuery = `
      SELECT * FROM ${this.fullTableName}
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const dataResult = await this.query<T>(dataQuery, params, options);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find a single record by ID with tenant isolation
   */
  async findById(
    ctx: TenantContext,
    id: string | number,
    options?: QueryOptions
  ): Promise<T | null> {
    const conditions = [`${this.primaryKey} = $1`, 'tenant_id = $2'];
    const params = [id, ctx.tenantId];

    if (this.softDelete && !options?.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.query<T>(query, params, options);
    return result.rows[0] || null;
  }

  /**
   * Find records by a specific field with tenant isolation
   */
  async findBy(
    ctx: TenantContext,
    field: string,
    value: any,
    options?: QueryOptions
  ): Promise<T[]> {
    const conditions = [`${field} = $1`, 'tenant_id = $2'];
    const params = [value, ctx.tenantId];

    if (this.softDelete && !options?.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.query<T>(query, params, options);
    return result.rows;
  }

  /**
   * Find one record by criteria with tenant isolation
   */
  async findOne(
    ctx: TenantContext,
    criteria: Record<string, any>,
    options?: QueryOptions
  ): Promise<T | null> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [ctx.tenantId];
    let paramIndex = 2;

    if (this.softDelete && !options?.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    for (const [key, value] of Object.entries(criteria)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    const query = `
      SELECT * FROM ${this.fullTableName}
      WHERE ${conditions.join(' AND ')}
      LIMIT 1
    `;

    const result = await this.query<T>(query, params, options);
    return result.rows[0] || null;
  }

  /**
   * Create a new record with tenant isolation
   */
  async create(
    ctx: TenantContext,
    data: Partial<T>,
    options?: QueryOptions
  ): Promise<T> {
    // Add tenant_id and audit fields
    const recordData: Record<string, any> = {
      ...data,
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      created_at: new Date()
    };

    const columns = Object.keys(recordData);
    const values = Object.values(recordData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    const query = `
      INSERT INTO ${this.fullTableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query<T>(query, values, options);
    return result.rows[0];
  }

  /**
   * Create multiple records with tenant isolation
   */
  async createMany(
    ctx: TenantContext,
    records: Partial<T>[],
    options?: QueryOptions
  ): Promise<T[]> {
    if (records.length === 0) return [];

    const results: T[] = [];
    const client = options?.client || await this.pool.connect();
    const useTransaction = !options?.client;

    try {
      if (useTransaction) await client.query('BEGIN');

      for (const record of records) {
        const created = await this.create(ctx, record, { client });
        results.push(created);
      }

      if (useTransaction) await client.query('COMMIT');
      return results;
    } catch (error) {
      if (useTransaction) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (useTransaction) client.release();
    }
  }

  /**
   * Update a record with tenant isolation
   */
  async update(
    ctx: TenantContext,
    id: string | number,
    data: Partial<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    // Add audit fields
    const updateData: Record<string, any> = {
      ...data,
      updated_by: ctx.userId,
      updated_at: new Date()
    };

    // Remove fields that shouldn't be updated
    delete updateData.tenant_id;
    delete updateData.created_at;
    delete updateData.created_by;
    delete updateData[this.primaryKey];

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);

    if (columns.length === 0) return this.findById(ctx, id, options);

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const paramIndex = columns.length + 1;

    const query = `
      UPDATE ${this.fullTableName}
      SET ${setClause}
      WHERE ${this.primaryKey} = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      ${this.softDelete ? 'AND deleted_at IS NULL' : ''}
      RETURNING *
    `;

    values.push(id, ctx.tenantId);
    const result = await this.query<T>(query, values, options);
    return result.rows[0] || null;
  }

  /**
   * Soft delete a record (if enabled) or hard delete
   */
  async delete(
    ctx: TenantContext,
    id: string | number,
    options?: QueryOptions
  ): Promise<boolean> {
    if (this.softDelete) {
      const query = `
        UPDATE ${this.fullTableName}
        SET deleted_at = NOW(), deleted_by = $1
        WHERE ${this.primaryKey} = $2 AND tenant_id = $3 AND deleted_at IS NULL
      `;
      const result = await this.query(query, [ctx.userId, id, ctx.tenantId], options);
      return (result.rowCount || 0) > 0;
    } else {
      const query = `
        DELETE FROM ${this.fullTableName}
        WHERE ${this.primaryKey} = $1 AND tenant_id = $2
      `;
      const result = await this.query(query, [id, ctx.tenantId], options);
      return (result.rowCount || 0) > 0;
    }
  }

  /**
   * Count records with tenant isolation
   */
  async count(
    ctx: TenantContext,
    filters: Record<string, any> = {},
    options?: QueryOptions
  ): Promise<number> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [ctx.tenantId];
    let paramIndex = 2;

    if (this.softDelete && !options?.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    const query = `SELECT COUNT(*) FROM ${this.fullTableName} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query(query, params, options);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if a record exists with tenant isolation
   */
  async exists(
    ctx: TenantContext,
    criteria: Record<string, any>,
    options?: QueryOptions
  ): Promise<boolean> {
    const record = await this.findOne(ctx, criteria, options);
    return record !== null;
  }

  /**
   * Execute a raw query with automatic tenant filtering
   * Use this for complex queries that can't be expressed with the other methods
   */
  async rawQuery<R = any>(
    ctx: TenantContext,
    sql: string,
    params: any[] = [],
    options?: QueryOptions
  ): Promise<R[]> {
    // Prepend tenant_id to params (assumes $1 is tenant_id in the query)
    const result = await this.query<R>(sql, [ctx.tenantId, ...params], options);
    return result.rows;
  }

  /**
   * Begin a transaction and return a client
   */
  async beginTransaction(): Promise<PoolClient> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
    client.release();
  }
}

export default BaseRepository;
