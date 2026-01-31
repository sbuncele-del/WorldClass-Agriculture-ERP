import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { TenantRequest } from '../types';

// Get tenant settings
export const getTenantSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Support both AuthRequest.user.tenantId and TenantRequest.tenant.id
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      `SELECT 
        id,
        company_name,
        company_email,
        company_phone,
        address,
        city,
        province,
        postal_code,
        country,
        tax_number,
        registration_number,
        industry,
        timezone,
        currency,
        fiscal_year_end,
        logo_url,
        created_at,
        updated_at
      FROM tenants
      WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const tenant = result.rows[0];
    
    // Convert snake_case to camelCase for frontend
    const settings = {
      id: tenant.id,
      companyName: tenant.company_name,
      companyEmail: tenant.company_email,
      companyPhone: tenant.company_phone,
      address: tenant.address,
      city: tenant.city,
      province: tenant.province,
      postalCode: tenant.postal_code,
      country: tenant.country,
      taxNumber: tenant.tax_number,
      registrationNumber: tenant.registration_number,
      industry: tenant.industry,
      timezone: tenant.timezone,
      currency: tenant.currency,
      fiscalYearEnd: tenant.fiscal_year_end,
      logoUrl: tenant.logo_url,
      createdAt: tenant.created_at,
      updatedAt: tenant.updated_at,
    };

    res.json(settings);
  } catch (error) {
    console.error('Get tenant settings error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant settings' });
  }
};

// Update tenant settings
export const updateTenantSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;
    const userId = req.user?.userId || (req as unknown as TenantRequest).user?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      address,
      city,
      province,
      postalCode,
      country,
      taxNumber,
      registrationNumber,
      industry,
      timezone,
      currency,
      fiscalYearEnd,
      logoUrl,
    } = req.body;

    // Validate required fields
    if (!companyName || !companyEmail) {
      res.status(400).json({ error: 'Company name and email are required' });
      return;
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (companyName !== undefined) {
      updates.push(`company_name = $${paramCount++}`);
      values.push(companyName.trim());
    }
    if (companyEmail !== undefined) {
      updates.push(`company_email = $${paramCount++}`);
      values.push(companyEmail.trim().toLowerCase());
    }
    if (companyPhone !== undefined) {
      updates.push(`company_phone = $${paramCount++}`);
      values.push(companyPhone || null);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address || null);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city || null);
    }
    if (province !== undefined) {
      updates.push(`province = $${paramCount++}`);
      values.push(province || null);
    }
    if (postalCode !== undefined) {
      updates.push(`postal_code = $${paramCount++}`);
      values.push(postalCode || null);
    }
    if (country !== undefined) {
      updates.push(`country = $${paramCount++}`);
      values.push(country || null);
    }
    if (taxNumber !== undefined) {
      updates.push(`tax_number = $${paramCount++}`);
      values.push(taxNumber || null);
    }
    if (registrationNumber !== undefined) {
      updates.push(`registration_number = $${paramCount++}`);
      values.push(registrationNumber || null);
    }
    if (industry !== undefined) {
      updates.push(`industry = $${paramCount++}`);
      values.push(industry || null);
    }
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(timezone);
    }
    if (currency !== undefined) {
      updates.push(`currency = $${paramCount++}`);
      values.push(currency);
    }
    if (fiscalYearEnd !== undefined) {
      updates.push(`fiscal_year_end = $${paramCount++}`);
      values.push(fiscalYearEnd);
    }
    if (logoUrl !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logoUrl);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tenantId);

    const query = `
      UPDATE tenants 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, 'update', 'tenant', tenantId, JSON.stringify({ companyName, companyEmail })]
    );

    res.json({ message: 'Tenant settings updated successfully', tenant: result.rows[0] });
  } catch (error) {
    console.error('Update tenant settings error:', error);
    res.status(500).json({ error: 'Failed to update tenant settings' });
  }
};

// Get module configuration
export const getModuleConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      `SELECT 
        module_sales,
        module_purchase,
        module_inventory,
        module_financial,
        module_hr,
        module_manufacturing,
        module_warehouse,
        module_assets,
        module_practice
      FROM tenants
      WHERE id = $1`,
      [tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const modules = {
      sales: result.rows[0].module_sales,
      purchase: result.rows[0].module_purchase,
      inventory: result.rows[0].module_inventory,
      financial: result.rows[0].module_financial,
      hr: result.rows[0].module_hr,
      manufacturing: result.rows[0].module_manufacturing,
      warehouse: result.rows[0].module_warehouse,
      assets: result.rows[0].module_assets,
      practice: result.rows[0].module_practice,
    };

    res.json(modules);
  } catch (error) {
    console.error('Get module config error:', error);
    res.status(500).json({ error: 'Failed to fetch module configuration' });
  }
};

// Update module configuration
export const updateModuleConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;
    const userId = req.user?.userId || (req as unknown as TenantRequest).user?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const {
      sales,
      purchase,
      inventory,
      financial,
      hr,
      manufacturing,
      warehouse,
      assets,
      practice,
    } = req.body;

    await pool.query(
      `UPDATE tenants 
       SET 
         module_sales = COALESCE($1, module_sales),
         module_purchase = COALESCE($2, module_purchase),
         module_inventory = COALESCE($3, module_inventory),
         module_financial = COALESCE($4, module_financial),
         module_hr = COALESCE($5, module_hr),
         module_manufacturing = COALESCE($6, module_manufacturing),
         module_warehouse = COALESCE($7, module_warehouse),
         module_assets = COALESCE($8, module_assets),
         module_practice = COALESCE($9, module_practice),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10`,
      [sales, purchase, inventory, financial, hr, manufacturing, warehouse, assets, practice, tenantId]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, 'update', 'module_config', tenantId, JSON.stringify(req.body)]
    );

    res.json({ message: 'Module configuration updated successfully' });
  } catch (error) {
    console.error('Update module config error:', error);
    res.status(500).json({ error: 'Failed to update module configuration' });
  }
};

// Get team members
export const getTeamMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      `SELECT 
        id,
        name,
        email,
        role,
        status,
        last_login_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at ASC`,
      [tenantId]
    );

    const teamMembers = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      lastActive: user.last_login_at,
    }));

    res.json(teamMembers);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

// Invite team member
export const inviteTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;
    const userId = req.user?.userId || (req as unknown as TenantRequest).user?.id;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ error: 'Email and role are required' });
      return;
    }

    // Check if user already exists in this tenant
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User already exists in this organization' });
      return;
    }

    // Create invitation token
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store invitation
    await pool.query(
      `INSERT INTO invitations (tenant_id, email, role, token, expires_at, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, email.toLowerCase(), role, invitationToken, expiresAt, userId]
    );

    // TODO: Send invitation email
    // await emailService.sendInvitation(email, invitationToken);

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, userId, 'invite', 'user', JSON.stringify({ email, role })]
    );

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Invite team member error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

// Remove team member
export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId || (req as unknown as TenantRequest).tenant?.id;
    const userId = req.user?.userId || (req as unknown as TenantRequest).user?.id;
    const { memberId } = req.params;

    if (!tenantId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Cannot remove yourself
    if (parseInt(memberId) === userId) {
      res.status(400).json({ error: 'Cannot remove yourself' });
      return;
    }

    // Check if user exists and belongs to this tenant
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2',
      [memberId, tenantId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Soft delete - set status to suspended
    await pool.query(
      `UPDATE users 
       SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2`,
      [memberId, tenantId]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, 'remove', 'user', memberId, JSON.stringify({ memberId })]
    );

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};
