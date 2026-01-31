/**
 * Period Controller V2
 * Tenant-aware REST API endpoints for fiscal years and accounting periods
 * 
 * NOTE: This v2 controller enforces tenant context at the controller level.
 * The underlying PeriodService will need to be updated to accept tenantId
 * for full multi-tenant isolation.
 */

import { Request, Response } from 'express';
import { PeriodService } from '../services/period.service';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

const periodService = new PeriodService();

// ============================================================================
// FISCAL YEARS
// ============================================================================

export const getAllFiscalYears = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    
    const fiscalYears = await periodService.getAllFiscalYears();
    
    res.json({ success: true, data: fiscalYears });
  } catch (error) {
    console.error('[PeriodV2] Get fiscal years error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getFiscalYear = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { id } = req.params;
    
    const fiscalYear = await periodService.getFiscalYearById(id);
    
    if (!fiscalYear) {
      res.status(404).json({ success: false, error: 'Fiscal year not found' });
      return;
    }
    
    res.json({ success: true, data: fiscalYear });
  } catch (error) {
    console.error('[PeriodV2] Get fiscal year error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getCurrentFiscalYear = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    
    const fiscalYear = await periodService.getCurrentFiscalYear();
    
    if (!fiscalYear) {
      res.status(404).json({ success: false, error: 'No current fiscal year set' });
      return;
    }
    
    res.json({ success: true, data: fiscalYear });
  } catch (error) {
    console.error('[PeriodV2] Get current fiscal year error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createFiscalYear = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const data = {
      ...req.body,
      user_id: userId,
    };
    
    const id = await periodService.createFiscalYear(data);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Fiscal year created successfully',
    });
  } catch (error) {
    console.error('[PeriodV2] Create fiscal year error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const setCurrentFiscalYear = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    
    await periodService.setCurrentFiscalYear(id, userId);
    
    res.json({ success: true, message: 'Current fiscal year updated successfully' });
  } catch (error) {
    console.error('[PeriodV2] Set current fiscal year error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const closeFiscalYear = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    
    await periodService.closeFiscalYear(id, userId);
    
    res.json({ success: true, message: 'Fiscal year closed successfully' });
  } catch (error) {
    console.error('[PeriodV2] Close fiscal year error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getFiscalYearWithPeriods = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { id } = req.params;
    
    const fiscalYearWithPeriods = await periodService.getFiscalYearWithPeriods(id);
    
    if (!fiscalYearWithPeriods) {
      res.status(404).json({ success: false, error: 'Fiscal year not found' });
      return;
    }
    
    res.json({ success: true, data: fiscalYearWithPeriods });
  } catch (error) {
    console.error('[PeriodV2] Get fiscal year with periods error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// ACCOUNTING PERIODS
// ============================================================================

export const getAllPeriods = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { fiscal_year_id } = req.query;
    
    const periods = await periodService.getAllPeriods(fiscal_year_id as string);
    
    res.json({ success: true, data: periods });
  } catch (error) {
    console.error('[PeriodV2] Get periods error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { id } = req.params;
    
    const period = await periodService.getPeriodById(id);
    
    if (!period) {
      res.status(404).json({ success: false, error: 'Period not found' });
      return;
    }
    
    res.json({ success: true, data: period });
  } catch (error) {
    console.error('[PeriodV2] Get period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getCurrentPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    
    const period = await periodService.getCurrentPeriod();
    
    if (!period) {
      res.status(404).json({ success: false, error: 'No current period set' });
      return;
    }
    
    res.json({ success: true, data: period });
  } catch (error) {
    console.error('[PeriodV2] Get current period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getOpenPeriods = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { fiscal_year_id } = req.query;
    
    const periods = await periodService.getOpenPeriods(fiscal_year_id as string);
    
    res.json({ success: true, data: periods });
  } catch (error) {
    console.error('[PeriodV2] Get open periods error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const data = {
      ...req.body,
      user_id: userId,
    };
    
    const id = await periodService.createPeriod(data);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Period created successfully',
    });
  } catch (error) {
    console.error('[PeriodV2] Create period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const openPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    
    await periodService.openPeriod(id, userId);
    
    res.json({ success: true, message: 'Period opened successfully' });
  } catch (error) {
    console.error('[PeriodV2] Open period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const closePeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    const force = req.body.force || false;
    
    await periodService.closePeriod(id, userId, force);
    
    res.json({ success: true, message: 'Period closed successfully' });
  } catch (error) {
    console.error('[PeriodV2] Close period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const lockPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    
    await periodService.lockPeriod(id, userId);
    
    res.json({ success: true, message: 'Period locked successfully' });
  } catch (error) {
    console.error('[PeriodV2] Lock period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const setCurrentPeriod = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { id } = req.params;
    
    await periodService.setCurrentPeriod(id, userId);
    
    res.json({ success: true, message: 'Current period updated successfully' });
  } catch (error) {
    console.error('[PeriodV2] Set current period error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const validatePeriodClose = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { id } = req.params;
    
    const validation = await periodService.validatePeriodClose(id);
    
    res.json({ success: true, data: validation });
  } catch (error) {
    console.error('[PeriodV2] Validate period close error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// SUMMARY
// ============================================================================

export const getPeriodSummary = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    
    const summary = await periodService.getPeriodSummary();
    
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[PeriodV2] Get period summary error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};
