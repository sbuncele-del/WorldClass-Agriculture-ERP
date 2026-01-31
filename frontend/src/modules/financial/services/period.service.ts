/**
 * Period Management Service
 * API calls for fiscal years and accounting periods
 */

import axios from 'axios';
import { API_BASE_URL } from '../../../services/api.service';
import type {
  FiscalYear,
  AccountingPeriod,
  FiscalYearWithPeriods,
  PeriodSummary,
  PeriodValidation,
  CreateFiscalYearDTO,
  CreatePeriodDTO
} from '../types/period.types';

const API_BASE = `${API_BASE_URL}/api/financial/periods`;

export class PeriodService {
  // ===== FISCAL YEARS =====

  static async getAllFiscalYears(): Promise<FiscalYear[]> {
    const response = await axios.get(`${API_BASE}/fiscal-years`);
    return response.data.data;
  }

  static async getFiscalYearById(id: string): Promise<FiscalYear> {
    const response = await axios.get(`${API_BASE}/fiscal-years/${id}`);
    return response.data.data;
  }

  static async getCurrentFiscalYear(): Promise<FiscalYear> {
    const response = await axios.get(`${API_BASE}/fiscal-years/current`);
    return response.data.data;
  }

  static async getFiscalYearWithPeriods(id: string): Promise<FiscalYearWithPeriods> {
    const response = await axios.get(`${API_BASE}/fiscal-years/${id}/with-periods`);
    return response.data.data;
  }

  static async createFiscalYear(data: CreateFiscalYearDTO): Promise<string> {
    const response = await axios.post(`${API_BASE}/fiscal-years`, data);
    return response.data.data.id;
  }

  static async setCurrentFiscalYear(id: string, userId: string): Promise<void> {
    await axios.put(`${API_BASE}/fiscal-years/${id}/set-current`, { user_id: userId });
  }

  static async closeFiscalYear(id: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE}/fiscal-years/${id}/close`, { user_id: userId });
  }

  // ===== ACCOUNTING PERIODS =====

  static async getAllPeriods(fiscalYearId?: string): Promise<AccountingPeriod[]> {
    const params = fiscalYearId ? { fiscal_year_id: fiscalYearId } : {};
    const response = await axios.get(`${API_BASE}`, { params });
    return response.data.data;
  }

  static async getPeriodById(id: string): Promise<AccountingPeriod> {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data.data;
  }

  static async getCurrentPeriod(): Promise<AccountingPeriod> {
    const response = await axios.get(`${API_BASE}/current`);
    return response.data.data;
  }

  static async getOpenPeriods(fiscalYearId?: string): Promise<AccountingPeriod[]> {
    const params = fiscalYearId ? { fiscal_year_id: fiscalYearId } : {};
    const response = await axios.get(`${API_BASE}/open`, { params });
    return response.data.data;
  }

  static async createPeriod(data: CreatePeriodDTO): Promise<string> {
    const response = await axios.post(`${API_BASE}`, data);
    return response.data.data.id;
  }

  static async openPeriod(id: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE}/${id}/open`, { user_id: userId });
  }

  static async closePeriod(id: string, userId: string, force: boolean = false): Promise<void> {
    await axios.post(`${API_BASE}/${id}/close`, { user_id: userId, force });
  }

  static async lockPeriod(id: string, userId: string): Promise<void> {
    await axios.post(`${API_BASE}/${id}/lock`, { user_id: userId });
  }

  static async setCurrentPeriod(id: string, userId: string): Promise<void> {
    await axios.put(`${API_BASE}/${id}/set-current`, { user_id: userId });
  }

  static async validatePeriodClose(id: string): Promise<PeriodValidation> {
    const response = await axios.get(`${API_BASE}/${id}/validate-close`);
    return response.data.data;
  }

  // ===== SUMMARY =====

  static async getPeriodSummary(): Promise<PeriodSummary> {
    const response = await axios.get(`${API_BASE}/summary`);
    return response.data.data;
  }
}
