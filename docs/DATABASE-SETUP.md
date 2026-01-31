# Database Setup Guide

## Prerequisites

1. **Install PostgreSQL 16+**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@16
   brew services start postgresql@16
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-16
   sudo systemctl start postgresql
   
   # Windows - Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create database
   CREATE DATABASE worldclass_erp;
   
   # Create user (optional)
   CREATE USER erp_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE worldclass_erp TO erp_user;
   
   # Exit
   \q
   ```

## Configuration

1. **Copy environment file**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Update `.env` with your database credentials**
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=worldclass_erp
   DB_USER=postgres          # or erp_user
   DB_PASSWORD=postgres      # your password
   ```

## Setup Database

Run migrations and seed data:

```bash
# Option 1: Run both migration and seed
npm run db:setup

# Option 2: Run separately
npm run db:migrate    # Create tables
npm run db:seed       # Populate Chart of Accounts
```

## What Gets Created

### Tables

1. **chart_of_accounts** - GL account master data
   - 30+ predefined South African accounts
   - Hierarchical structure (parent-child)
   - Account types: Asset, Liability, Equity, Revenue, Expense
   - Configuration flags (manual entry, reconciliation, tax relevance)

2. **journal_entries** - Journal entry headers
   - Auto-generated journal numbers (JV-2025-00001)
   - Status workflow (DRAFT → APPROVED → POSTED → REVERSED)
   - Multi-currency support
   - Source document linking
   - Balanced entry enforcement (CHECK constraint)

3. **journal_entry_lines** - Journal entry line items
   - Debit/Credit amounts
   - Account linking
   - Dimensional analysis (cost center, department, project)
   - Tax tracking
   - Reconciliation status

4. **account_balances** - Period-level account balances
   - Opening/closing balances per period
   - Period locking mechanism
   - Audit trail

### Indexes

- Optimized for common queries (date ranges, status, account lookups)
- Foreign key relationships with cascade deletes
- Unique constraints on journal numbers and account codes

## Verify Setup

```bash
# Connect to database
psql -d worldclass_erp

# Check tables
\dt

# Check account count
SELECT COUNT(*) FROM chart_of_accounts;
# Should show ~30 accounts

# View accounts by type
SELECT account_type, COUNT(*) 
FROM chart_of_accounts 
GROUP BY account_type;

# Exit
\q
```

## Troubleshooting

### Connection Issues

**Error: `ECONNREFUSED`**
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL if not running
brew services start postgresql@16  # macOS
sudo systemctl start postgresql    # Linux
```

**Error: `authentication failed`**
- Check username/password in `.env`
- Verify user has correct privileges
- Check `pg_hba.conf` for authentication method

### Migration Issues

**Error: `relation already exists`**
- Tables already created - safe to ignore
- To reset: Drop database and recreate
  ```sql
  DROP DATABASE worldclass_erp;
  CREATE DATABASE worldclass_erp;
  ```

**Error: `undefined reading 'rows'`**
- Check database connection in `.env`
- Verify PostgreSQL is running
- Test connection: `psql -d worldclass_erp`

## Development Workflow

1. **Start dev server** (auto-connects to database)
   ```bash
   npm run dev
   ```

2. **Create journal entry**
   - Navigate to http://localhost:5173/financial/journal-entry/new
   - Create a balanced entry
   - Post to ledger
   - Check database:
     ```sql
     SELECT * FROM journal_entries;
     SELECT * FROM journal_entry_lines;
     ```

3. **View trial balance**
   - GET http://localhost:3000/api/financial/reports/trial-balance
   - Should show all accounts with balances
   - Verify debits = credits

## Database Backup

```bash
# Backup database
pg_dump worldclass_erp > backup.sql

# Restore database
psql worldclass_erp < backup.sql
```

## Production Deployment

### Render.com / Heroku

1. Add PostgreSQL add-on
2. Get `DATABASE_URL` from dashboard
3. Set environment variable:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   ```
4. Run migrations on deploy:
   ```json
   {
     "scripts": {
       "postinstall": "npm run db:migrate"
     }
   }
   ```

### Docker

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: worldclass_erp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

```bash
docker-compose up -d
npm run db:setup
```

## Next Steps

- ✅ Database setup complete
- ✅ Tables created
- ✅ Chart of Accounts seeded
- 🔄 Test journal entry creation
- 🔄 Implement posting engine
- 🔄 Build trial balance report

Ready to process transactions! 🚀
