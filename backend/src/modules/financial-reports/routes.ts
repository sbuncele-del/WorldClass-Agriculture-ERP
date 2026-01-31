import { Router } from 'express';
import { FinancialReportsController } from './controller';

const router = Router();
const controller = new FinancialReportsController();

// Trial Balance - Shows all accounts with debits, credits, and balances
router.get('/trial-balance', controller.getTrialBalance);

// Balance Sheet - Assets, Liabilities, Equity
router.get('/balance-sheet', controller.getBalanceSheet);

// Profit & Loss Statement (Income Statement) - Revenue and Expenses
router.get('/profit-loss', controller.getProfitAndLoss);

// Account Transactions - All GL transactions for a specific account
router.get('/account-transactions/:accountId', controller.getAccountTransactions);

// Cash Flow Statement - Cash movements
router.get('/cash-flow', controller.getCashFlow);

export default router;
