/**
 * Period Management Controller
 * REST API endpoints for fiscal years and accounting periods
 */

import { Request, Response } from 'express';
import { PeriodService } from '../services/period.service';

const periodService = new PeriodService();

// ===== FISCAL YEARS =====

export const getAllFiscalYears = async (_req: Request, res: Response): Promise<void> => {
  try {
    const fiscalYears = await periodService.getAllFiscalYears();
    res.json({
      success: true,
      data: fiscalYears,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getFiscalYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fiscalYear = await periodService.getFiscalYearById(id);
    
    if (!fiscalYear) {
      res.status(404).json({
        success: false,
        error: 'Fiscal year not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: fiscalYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getCurrentFiscalYear = async (_req: Request, res: Response): Promise<void> => {
  try {
    const fiscalYear = await periodService.getCurrentFiscalYear();
    
    if (!fiscalYear) {
      res.status(404).json({
        success: false,
        error: 'No current fiscal year set',
      });
      return;
    }
    
    res.json({
      success: true,
      data: fiscalYear,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createFiscalYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.user_id || 'system';
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
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const setCurrentFiscalYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await periodService.setCurrentFiscalYear(id, userId);
    
    res.json({
      success: true,
      message: 'Current fiscal year updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const closeFiscalYear = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await periodService.closeFiscalYear(id, userId);
    
    res.json({
      success: true,
      message: 'Fiscal year closed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getFiscalYearWithPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fiscalYearWithPeriods = await periodService.getFiscalYearWithPeriods(id);
    
    if (!fiscalYearWithPeriods) {
      res.status(404).json({
        success: false,
        error: 'Fiscal year not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: fiscalYearWithPeriods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ===== ACCOUNTING PERIODS =====

export const getAllPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fiscal_year_id } = req.query;
    const periods = await periodService.getAllPeriods(fiscal_year_id as string);
    
    res.json({
      success: true,
      data: periods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const period = await periodService.getPeriodById(id);
    
    if (!period) {
      res.status(404).json({
        success: false,
        error: 'Period not found',
      });
      return;
    }
    
    res.json({
      success: true,
      data: period,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getCurrentPeriod = async (_req: Request, res: Response): Promise<void> => {
  try {
    const period = await periodService.getCurrentPeriod();
    
    if (!period) {
      res.status(404).json({
        success: false,
        error: 'No current period set',
      });
      return;
    }
    
    res.json({
      success: true,
      data: period,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getOpenPeriods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fiscal_year_id } = req.query;
    const periods = await periodService.getOpenPeriods(fiscal_year_id as string);
    
    res.json({
      success: true,
      data: periods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.body.user_id || 'system';
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
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const openPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await periodService.openPeriod(id, userId);
    
    res.json({
      success: true,
      message: 'Period opened successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const closePeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    const force = req.body.force || false;
    
    await periodService.closePeriod(id, userId, force);
    
    res.json({
      success: true,
      message: 'Period closed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const lockPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await periodService.lockPeriod(id, userId);
    
    res.json({
      success: true,
      message: 'Period locked successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const setCurrentPeriod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.body.user_id || 'system';
    
    await periodService.setCurrentPeriod(id, userId);
    
    res.json({
      success: true,
      message: 'Current period updated successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const validatePeriodClose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validation = await periodService.validatePeriodClose(id);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ===== SUMMARY & UTILITIES =====

export const getPeriodSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const summary = await periodService.getPeriodSummary();
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};
