import { apiGet, apiPost, apiDelete } from './api.service';
import type {
  BankStatementLine,
  JournalEntryLine,
  MultiLineMatchGroup,
  MultiLineMatchCombination,
  PartialMatchRequest,
  PartialMatchSuggestion,
  ToleranceSettings,
  DuplicateCheck,
  DuplicatePair,
  BulkAutoMatchRequest,
  BulkOperationResult,
  BulkStats,
  BankAccount,
  BankStatement
} from '../types/cash-management.types';

const BASE_PATH = '/api/cash-management';

/**
 * Cash Management API Service
 * All 18 endpoints for advanced reconciliation features
 */
export const cashManagementApi = {
  // ============================================
  // MULTI-LINE MATCHING (4 endpoints)
  // ============================================
  
  multiLineMatch: {
    /**
     * Find possible combinations of journal entries that match bank lines
     */
    findCombinations: async (data: {
      bankLineIds: number[];
      maxCombinationSize?: number;
      toleranceAmount?: number;
      dateRange?: number;
    }): Promise<{ success: boolean; combinations: MultiLineMatchCombination[] }> => {
      return apiPost(`${BASE_PATH}/multi-line-matching/find`, data);
    },

    /**
     * Create a multi-line match group
     */
    createMatch: async (data: {
      bankLineIds: number[];
      journalLineIds: number[];
      matchType: 'ONE_TO_MANY' | 'MANY_TO_ONE';
      notes?: string;
    }): Promise<{ success: boolean; matchGroup: MultiLineMatchGroup }> => {
      return apiPost(`${BASE_PATH}/multi-line-matching/create`, data);
    },

    /**
     * Unmatch a multi-line match group
     */
    unmatch: async (groupId: number): Promise<{ success: boolean; message: string }> => {
      return apiDelete(`${BASE_PATH}/multi-line-matching/${groupId}`);
    },

    /**
     * Get all multi-line match groups for a statement
     */
    getGroups: async (params: {
      statementId?: number;
      status?: string;
    }): Promise<{ success: boolean; groups: MultiLineMatchGroup[] }> => {
      return apiGet(`${BASE_PATH}/multi-line-matching/groups`, params);
    }
  },

  // ============================================
  // PARTIAL RECONCILIATION (4 endpoints)
  // ============================================
  
  partialMatch: {
    /**
     * Accept a match with a difference amount
     */
    acceptWithDifference: async (data: PartialMatchRequest): Promise<{
      success: boolean;
      match: { matchId: number; differenceJournalId: number };
      message: string;
    }> => {
      return apiPost(`${BASE_PATH}/partial-matching/accept`, data);
    },

    /**
     * Get suggested partial matches for a bank line
     */
    getSuggestions: async (bankLineId: number): Promise<{
      success: boolean;
      suggestions: PartialMatchSuggestion[];
    }> => {
      return apiGet(`${BASE_PATH}/partial-matching/${bankLineId}/suggestions`);
    },

    /**
     * Check if a difference is within tolerance
     */
    checkTolerance: async (data: {
      bankAmount: number;
      journalAmount: number;
    }): Promise<{
      success: boolean;
      withinTolerance: boolean;
      differenceAmount: number;
      percentageDifference: number;
      toleranceSettings: ToleranceSettings;
    }> => {
      return apiPost(`${BASE_PATH}/partial-matching/check-tolerance`, data);
    },

    /**
     * Get tenant tolerance settings
     */
    getToleranceSettings: async (): Promise<{
      success: boolean;
      settings: ToleranceSettings;
    }> => {
      return apiGet(`${BASE_PATH}/partial-matching/tolerance-settings`);
    }
  },

  // ============================================
  // DUPLICATE DETECTION (2 endpoints)
  // ============================================
  
  duplicates: {
    /**
     * Check if a specific match would create a duplicate
     */
    check: async (data: {
      bankLineId: number;
      journalLineId: number;
    }): Promise<{ success: boolean } & DuplicateCheck> => {
      return apiPost(`${BASE_PATH}/duplicates/check`, data);
    },

    /**
     * Find all potential duplicate transactions
     */
    findAll: async (params: {
      statementId?: number;
      daysRange?: number;
    }): Promise<{ success: boolean; duplicates: DuplicatePair[] }> => {
      return apiGet(`${BASE_PATH}/duplicates/find`, params);
    }
  },

  // ============================================
  // BULK OPERATIONS (4 endpoints)
  // ============================================
  
  bulk: {
    /**
     * Auto-match multiple lines with filters
     */
    autoMatch: async (data: BulkAutoMatchRequest): Promise<{
      success: boolean;
      results: BulkOperationResult;
    }> => {
      return apiPost(`${BASE_PATH}/bulk/auto-match`, data);
    },

    /**
     * Bulk accept match suggestions
     */
    acceptSuggestions: async (data: {
      suggestionIds: number[];
      minConfidence?: number;
    }): Promise<{
      success: boolean;
      accepted: number;
      skipped: number;
      errors: string[];
    }> => {
      return apiPost(`${BASE_PATH}/bulk/accept-suggestions`, data);
    },

    /**
     * Bulk unmatch transactions
     */
    unmatch: async (data: {
      lineIds?: number[];
      statementId?: number;
      dateFrom?: string;
      dateTo?: string;
    }): Promise<{
      success: boolean;
      unmatched: number;
      errors: string[];
    }> => {
      return apiPost(`${BASE_PATH}/bulk/unmatch`, data);
    },

    /**
     * Get statistics for bulk operations
     */
    getStats: async (statementId: number): Promise<{
      success: boolean;
      stats: BulkStats;
    }> => {
      return apiGet(`${BASE_PATH}/bulk/stats/${statementId}`);
    }
  },

  // ============================================
  // STANDARD ENDPOINTS (existing)
  // ============================================
  
  /**
   * Get bank accounts
   */
  getBankAccounts: async (): Promise<BankAccount[]> => {
    return apiGet(`${BASE_PATH}/bank-accounts`);
  },

  /**
   * Get bank statements
   */
  getStatements: async (params?: {
    bankAccountId?: number;
    status?: string;
  }): Promise<BankStatement[]> => {
    return apiGet(`${BASE_PATH}/statements`, params);
  },

  /**
   * Get statement lines
   */
  getStatementLines: async (params: {
    statementId: number;
    matched?: boolean;
  }): Promise<BankStatementLine[]> => {
    return apiGet(`${BASE_PATH}/statement-lines`, params);
  },

  /**
   * Get journal entries for reconciliation
   */
  getJournalEntries: async (params?: {
    accountId?: number;
    dateFrom?: string;
    dateTo?: string;
    matched?: boolean;
  }): Promise<JournalEntryLine[]> => {
    return apiGet(`${BASE_PATH}/journal-entries`, params);
  },

  /**
   * Create a simple 1:1 match
   */
  createSimpleMatch: async (data: {
    bankLineId: number;
    journalLineId: number;
  }): Promise<{ success: boolean; matchId: number }> => {
    return apiPost(`${BASE_PATH}/matches`, data);
  },

  /**
   * Unmatch a simple 1:1 match
   */
  unmatchSimple: async (matchId: number): Promise<{ success: boolean }> => {
    return apiDelete(`${BASE_PATH}/matches/${matchId}`);
  }
};
