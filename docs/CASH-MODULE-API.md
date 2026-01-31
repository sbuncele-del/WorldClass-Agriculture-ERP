# Cash Management Module - API Integration

## Overview
The Cash Management module is now integrated with real backend data via REST API.

## API Configuration

### Environment Variables
The frontend uses the following environment variable for API connectivity:

**Development** (`.env`):
```
VITE_API_URL=http://localhost:3000
```

**Production** (`.env.production`):
```
VITE_API_URL=http://51.21.219.35:3000
```

## API Endpoints

### GET `/api/cash/dashboard`
Returns real-time cash management dashboard data.

**Response Format:**
```json
{
  "current_period": {
    "fiscal_year": 2025,
    "period_number": 11,
    "period_name": "November 2025",
    "status": "OPEN"
  },
  "cash_summary": {
    "total_cash_balance": 2847320,
    "available_balance": 1923150,
    "pending_reconciliation": 324180,
    "monthly_transactions": 428
  },
  "bank_accounts": {
    "standard_bank": 1245670,
    "fnb": 892450,
    "nedbank": 709200
  }
}
```

**Status Codes:**
- `200 OK` - Successful response with data
- `500 Internal Server Error` - Server error (falls back to mock data)
- Network errors fall back to mock data

## Backend Implementation

### Required Route
Add this route to your backend Express app:

```typescript
// backend/src/routes/cash.routes.ts
import { Router } from 'express';
import pool from '../db/connection';

const router = Router();

router.get('/dashboard', async (req, res) => {
  try {
    // Query current fiscal period
    const periodQuery = await pool.query(
      `SELECT fiscal_year, period_number, period_name, status 
       FROM financial_periods 
       WHERE status = 'OPEN' 
       ORDER BY fiscal_year DESC, period_number DESC 
       LIMIT 1`
    );

    // Query cash balances from bank accounts
    const bankQuery = await pool.query(
      `SELECT 
        SUM(balance) as total_cash_balance,
        SUM(CASE WHEN account_type = 'CHECKING' THEN balance ELSE 0 END) as available_balance
       FROM bank_accounts 
       WHERE is_active = true`
    );

    // Query pending reconciliation items
    const reconQuery = await pool.query(
      `SELECT COUNT(*) as pending_count, 
       COALESCE(SUM(amount), 0) as pending_amount 
       FROM bank_reconciliation 
       WHERE status = 'PENDING'`
    );

    // Query monthly transactions
    const transQuery = await pool.query(
      `SELECT COUNT(*) as transaction_count 
       FROM cash_transactions 
       WHERE EXTRACT(MONTH FROM transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM transaction_date) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    // Query individual bank account balances
    const accountsQuery = await pool.query(
      `SELECT bank_name, balance 
       FROM bank_accounts 
       WHERE is_active = true 
       ORDER BY balance DESC`
    );

    const response = {
      current_period: periodQuery.rows[0] || {
        fiscal_year: 2025,
        period_number: 11,
        period_name: 'November 2025',
        status: 'OPEN'
      },
      cash_summary: {
        total_cash_balance: bankQuery.rows[0]?.total_cash_balance || 0,
        available_balance: bankQuery.rows[0]?.available_balance || 0,
        pending_reconciliation: reconQuery.rows[0]?.pending_amount || 0,
        monthly_transactions: transQuery.rows[0]?.transaction_count || 0
      },
      bank_accounts: {
        standard_bank: accountsQuery.rows.find(a => a.bank_name === 'Standard Bank')?.balance || 0,
        fnb: accountsQuery.rows.find(a => a.bank_name === 'FNB')?.balance || 0,
        nedbank: accountsQuery.rows.find(a => a.bank_name === 'Nedbank')?.balance || 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cash dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch cash dashboard data' });
  }
});

export default router;
```

### Mount the Route
In your main backend file:

```typescript
// backend/src/index.ts or backend/src/server.ts
import cashRoutes from './routes/cash.routes';

app.use('/api/cash', cashRoutes);
```

## Database Schema

### Required Tables

**financial_periods**
```sql
CREATE TABLE financial_periods (
  id SERIAL PRIMARY KEY,
  fiscal_year INTEGER NOT NULL,
  period_number INTEGER NOT NULL,
  period_name VARCHAR(50),
  status VARCHAR(20) DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**bank_accounts**
```sql
CREATE TABLE bank_accounts (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),
  account_type VARCHAR(20),
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**bank_reconciliation**
```sql
CREATE TABLE bank_reconciliation (
  id SERIAL PRIMARY KEY,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  amount DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'PENDING',
  reconciliation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**cash_transactions**
```sql
CREATE TABLE cash_transactions (
  id SERIAL PRIMARY KEY,
  bank_account_id INTEGER REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  transaction_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Seed Data (Optional)

```sql
-- Insert sample financial period
INSERT INTO financial_periods (fiscal_year, period_number, period_name, status)
VALUES (2025, 11, 'November 2025', 'OPEN');

-- Insert sample bank accounts
INSERT INTO bank_accounts (bank_name, account_number, account_type, balance, is_active)
VALUES 
  ('Standard Bank', '1234567890', 'CHECKING', 1245670, true),
  ('FNB', '0987654321', 'CHECKING', 892450, true),
  ('Nedbank', '5555555555', 'CHECKING', 709200, true);

-- Insert sample transactions
INSERT INTO cash_transactions (bank_account_id, transaction_date, amount, description, transaction_type)
VALUES 
  (1, CURRENT_DATE, 50000, 'Customer Payment', 'INFLOW'),
  (2, CURRENT_DATE, -15000, 'Supplier Payment', 'OUTFLOW');

-- Insert sample reconciliation items
INSERT INTO bank_reconciliation (bank_account_id, amount, status, reconciliation_date)
VALUES 
  (1, 100000, 'PENDING', CURRENT_DATE),
  (2, 224180, 'PENDING', CURRENT_DATE);
```

## Testing the Integration

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Verify API Call
Open browser dev tools (F12) and check Network tab when visiting the Cash Management dashboard. You should see a request to `/api/cash/dashboard`.

### 4. Fallback Behavior
If the backend is offline, the frontend will automatically fall back to mock data so the UI remains functional.

## UI Changes Applied

The Cash Management module now matches the Financial module layout:

✅ **EnterpriseLayout Wrapper** - SAP horizontal tabs + Oracle vertical sidebar  
✅ **Horizontal Tabs** - Dashboard, Bank Accounts, Reconciliation, Cash Flow, Forecasting, Reports  
✅ **Secondary Navigation** - Quick Actions (New Transaction, Reconcile, Add Bank) + Reports sidebar  
✅ **Action Buttons** - "Reconcile" (secondary), "New Transaction" (primary)  
✅ **Typography** - Consistent system fonts (`-apple-system, Segoe UI, Roboto`)  
✅ **Real Data Integration** - Fetches from `VITE_API_URL/api/cash/dashboard`  
✅ **Link Components** - Replaced `<a href>` with `<Link to>` for proper routing

## Production Deployment

The frontend will automatically use the production API URL (`http://51.21.219.35:3000`) when built for production:

```bash
npm run build
```

Ensure your backend server is running on the production server and accessible at the configured URL.
