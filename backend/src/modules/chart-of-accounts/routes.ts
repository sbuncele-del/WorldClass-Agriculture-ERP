import { Router } from 'express';
import { ChartOfAccountsController } from './controller';

const router = Router();
const controller = new ChartOfAccountsController();

// Chart of Accounts routes
router.get('/accounts', controller.getAllAccounts);
router.get('/accounts/:id', controller.getAccountById);
router.post('/accounts', controller.createAccount);
router.put('/accounts/:id', controller.updateAccount);
router.delete('/accounts/:id', controller.deleteAccount);

// Account hierarchy
router.get('/accounts/:id/children', controller.getChildAccounts);
router.get('/tree', controller.getAccountTree);

// Utilities
router.get('/types', controller.getAccountTypes);
router.post('/seed-default', controller.seedDefaultAccounts);

export default router;
