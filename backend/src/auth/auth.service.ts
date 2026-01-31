import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  SignupData,
  LoginCredentials,
  AuthResponse,
  AuthTokens,
  JWTPayload,
  UnauthorizedError,
  ValidationError,
  ConflictError,
  NotFoundError
} from '../types';
import TenantService from '../services/tenant.service';
import ProvisioningService from '../services/provisioning.service';
import { pool as sharedPool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export class AuthService {
  /**
   * Company Signup (creates tenant + admin user)
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const client = await sharedPool.connect();

    try {
      await client.query('BEGIN');

      // Validate email not already used
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [data.email]
      );

      if (emailCheck.rows.length > 0) {
        throw new ConflictError('Email already registered');
      }

      // Generate slug if not provided
      let slug = data.companySlug;
      if (!slug) {
        slug = await TenantService.generateSlug(data.companyName);
      } else {
        // Validate slug is available
        const isAvailable = await TenantService.isSlugAvailable(slug);
        if (!isAvailable) {
          throw new ConflictError('Company slug already taken');
        }
      }

      console.log('=== SIGNUP DEBUG ===');
      console.log('Company name:', data.companyName);
      console.log('Generated slug:', slug, 'Type:', typeof slug);
      console.log('=== END SIGNUP DEBUG ===');

      // Determine plan features
      const features = this.getPlanFeatures(data.plan);
      const limits = this.getPlanLimits(data.plan);

      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (
          name, slug, status, subscription_plan, subscription_status,
          trial_ends_at, billing_email, billing_cycle, 
          max_users, max_storage_gb, features, settings
        ) VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::timestamp, $7::text, $8::text, $9::int, $10::int, $11::jsonb, $12::jsonb)
        RETURNING *`,
        [
          data.companyName,
          slug,
          'trial',
          data.plan,
          'trialing',
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          data.email,
          data.billingCycle,
          limits.maxUsers,
          limits.maxStorageGb,
          JSON.stringify(features),
          JSON.stringify({
            currency: 'ZAR',
            date_format: 'DD/MM/YYYY',
            timezone: 'Africa/Johannesburg',
            financial_year_end: '02-28'
          })
        ]
      );

      const tenant = tenantResult.rows[0];

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create admin user
      const userResult = await client.query(
        `INSERT INTO users (
          tenant_id, email, password_hash, first_name, last_name,
          role, status, email_verified, password_changed_at
        ) VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text, $7::text, $8::boolean, NOW())
        RETURNING id, tenant_id, email, first_name, last_name, role, status`,
        [
          tenant.id,
          data.email,
          passwordHash,
          data.firstName,
          data.lastName,
          'admin',
          'active',
          true // Auto-verify for now, add email verification later
        ]
      );

      const user = userResult.rows[0];

      // Generate tokens
      const tokens = await this.generateTokens(user.id, tenant.id, user.email, user.role);

      // Store refresh token
      await this.storeRefreshToken(
        client,
        user.id,
        tenant.id,
        tokens.refreshToken,
        {} // device info can be added from request
      );

      await client.query('COMMIT');

      // Provision tenant with chart of accounts (async, don't block signup)
      ProvisioningService.provisionNewTenant({
        tenantId: tenant.id,
        country: 'ZA',
        industry: data.industry || 'general',
        currency: 'ZAR'
      }).catch(err => {
        console.error('Tenant provisioning failed (non-blocking):', err);
      });

      // Log signup
      await client.query(
        `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id)
         VALUES ($1::uuid, $2::uuid, $3::text, $4::text, $5::uuid)`,
        [tenant.id, user.id, 'user_signup', 'user', user.id]
      );

      return {
        tokens,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          status: tenant.status,
          trialEndsAt: tenant.trial_ends_at
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * User Login
   */
  static async login(credentials: LoginCredentials, deviceInfo?: any): Promise<AuthResponse> {
    const { email, password, tenantSlug } = credentials;

    // Find user by email - use correct column names (id, name not tenant_id, tenant_name)
    let query = `
      SELECT u.*, t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name, 
             t.status as tenant_status, t.trial_ends_at, t.subscription_plan,
             t.settings as onboarding_data
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    const params: any[] = [email];

    // If tenant slug provided, filter by it (useful for multi-tenant login)
    if (tenantSlug) {
      query += ' AND t.slug = $2';
      params.push(tenantSlug);
    }

    const result = await sharedPool.query(query, params);

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (result.rows.length > 1 && !tenantSlug) {
      // User exists in multiple tenants, need to specify tenant
      throw new ValidationError('Email exists in multiple accounts. Please specify company.');
    }

    const user = result.rows[0];

    // Check user status
    if (user.status === 'suspended') {
      throw new UnauthorizedError('Account is suspended. Contact support.');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedError('Account is inactive');
    }

    // Check if locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked. Try again later.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed login attempts
      await sharedPool.query(
        `UPDATE users 
         SET failed_login_attempts = failed_login_attempts + 1,
             locked_until = CASE 
               WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
               ELSE locked_until
             END
         WHERE id = $1`,
        [user.id]
      );

      throw new UnauthorizedError('Invalid email or password');
    }

    // Check tenant status
    if (user.tenant_status === 'suspended') {
      throw new UnauthorizedError('Company account is suspended. Contact support.');
    }

    if (user.tenant_status === 'cancelled') {
      throw new UnauthorizedError('Company account has been cancelled');
    }

    // Reset failed login attempts and update last login
    await sharedPool.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           locked_until = NULL,
           last_login_at = NOW(),
           last_login_ip = $2
       WHERE id = $1`,
      [user.id, deviceInfo?.ip_address || null]
    );

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.tenant_id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(
      sharedPool,
      user.id,
      user.tenant_id,
      tokens.refreshToken,
      deviceInfo || {}
    );

    // Log login
    await sharedPool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, ip_address)
       VALUES ($1, $2, 'user_login', $3)`,
      [user.tenant_id, user.id, deviceInfo?.ip_address || null]
    );

    return {
      tokens,
      tenant: {
        id: user.tenant_id,
        slug: user.tenant_slug,
        name: user.tenant_name,
        status: user.tenant_status,
        trialEndsAt: user.trial_ends_at,
        onboarding_data: user.onboarding_data || {}
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    };
  }

  /**
   * Refresh Access Token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as JWTPayload;

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }

      // Check if refresh token exists and not revoked
      const tokenCheck = await sharedPool.query(
        `SELECT user_id, tenant_id, revoked 
         FROM refresh_tokens 
         WHERE token = $1 AND expires_at > NOW()`,
        [refreshToken]
      );

      if (tokenCheck.rows.length === 0 || tokenCheck.rows[0].revoked) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const { user_id, tenant_id } = tokenCheck.rows[0];

      // Get user info
      const userResult = await sharedPool.query(
        'SELECT email, role FROM users WHERE id = $1 AND deleted_at IS NULL',
        [user_id]
      );

      if (userResult.rows.length === 0) {
        throw new UnauthorizedError('User not found');
      }

      const user = userResult.rows[0];

      // Generate new access token (keep same refresh token)
      const accessToken = jwt.sign(
        {
          userId: user_id,
          tenantId: tenant_id,
          email: user.email,
          role: user.role,
          type: 'access'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY } as any
      );

      return {
        accessToken,
        refreshToken, // Return same refresh token
        expiresIn: 3600 // 1 hour in seconds
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  /**
   * Logout (revoke refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    await sharedPool.query(
      `UPDATE refresh_tokens 
       SET revoked = true, revoked_at = NOW() 
       WHERE token = $1`,
      [refreshToken]
    );
  }

  /**
   * Forgot Password (generate reset token)
   */
  static async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const userResult = await sharedPool.query(
      'SELECT id, tenant_id FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      return { resetToken: '' };
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sharedPool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expires_at = $2 
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // TODO: Send email with reset link
    // await EmailService.sendPasswordReset(email, resetToken);

    return { resetToken };
  }

  /**
   * Reset Password
   */
  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const userResult = await sharedPool.query(
      `SELECT id FROM users 
       WHERE reset_token = $1 
         AND reset_token_expires_at > NOW() 
         AND deleted_at IS NULL`,
      [resetToken]
    );

    if (userResult.rows.length === 0) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const userId = userResult.rows[0].id;

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await sharedPool.query(
      `UPDATE users 
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires_at = NULL,
           password_changed_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  /**
   * Get Current User Info
   */
  static async me(userId: string, tenantId: string): Promise<any> {
    const result = await sharedPool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status,
              u.phone, u.avatar_url, u.preferences, u.last_login_at,
              t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug,
              t.subscription_plan, t.trial_ends_at
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1 AND u.tenant_id = $2 AND u.deleted_at IS NULL`,
      [userId, tenantId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  /**
   * Helper: Generate Access + Refresh Tokens
   */
  private static async generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string
  ): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        userId,
        tenantId,
        email,
        role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as any
    );

    const refreshToken = jwt.sign(
      {
        userId,
        tenantId,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY } as any
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }

  /**
   * Helper: Store Refresh Token
   */
  private static async storeRefreshToken(
    client: any,
    userId: string,
    tenantId: string,
    token: string,
    deviceInfo: any
  ): Promise<void> {
    const decoded = jwt.decode(token) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    await client.query(
      `INSERT INTO refresh_tokens (user_id, tenant_id, token, expires_at, device_info)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, tenantId, token, expiresAt, deviceInfo]
    );
  }

  /**
   * Helper: Get Plan Features
   */
  private static getPlanFeatures(plan: string): any {
    const features = {
      starter: {
        ai_automation: false,
        multi_currency: false,
        advanced_reporting: false,
        api_access: false,
        custom_branding: false
      },
      professional: {
        ai_automation: true,
        multi_currency: true,
        advanced_reporting: true,
        api_access: false,
        custom_branding: false
      },
      enterprise: {
        ai_automation: true,
        multi_currency: true,
        advanced_reporting: true,
        api_access: true,
        custom_branding: true
      }
    };

    return features[plan as keyof typeof features] || features.starter;
  }

  /**
   * Helper: Get Plan Limits
   */
  private static getPlanLimits(plan: string): { maxUsers: number; maxStorageGb: number } {
    const limits = {
      starter: { maxUsers: 5, maxStorageGb: 5 },
      professional: { maxUsers: 25, maxStorageGb: 50 },
      enterprise: { maxUsers: 9999, maxStorageGb: 9999 }
    };

    return limits[plan as keyof typeof limits] || limits.starter;
  }
}

export default AuthService;
