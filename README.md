# Worldclass ERP Software

A comprehensive Enterprise Resource Planning (ERP) system built with modern technologies for managing all aspects of your business operations.

## 🚀 Features

### Core Modules
- **Inventory Management**: Track stock levels, manage warehouses, and monitor inventory movements
- **Sales & CRM**: Manage customers, sales orders, and customer relationships
- **Purchase Management**: Handle purchase orders, supplier management, and procurement
- **Financial Accounting**: Complete accounting system with ledgers, transactions, and reports
- **HR & Payroll**: Employee management, attendance, and payroll processing
- **Manufacturing**: Production planning, work orders, and bills of materials
- **Warehouse Management**: Multi-warehouse support with location tracking

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcryptjs

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: CSS3 with CSS Variables

### DevOps
- **Containerization**: Docker & Docker Compose
- **Package Manager**: npm with workspaces

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20 or higher)
- **npm** (v10 or higher)
- **Docker** and **Docker Compose** (optional, for containerized setup)
- **PostgreSQL** (if running without Docker)

## 🚦 Getting Started

### Option 1: Local Development (Without Docker)

1. **Clone the repository**
   ```bash
   cd "Worldclass ERP Software"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

4. **Start PostgreSQL** (if not running)
   ```bash
   # Make sure PostgreSQL is running on localhost:5432
   ```

5. **Run the application**
   ```bash
   # Start both backend and frontend concurrently
   npm run dev

   # Or start them separately:
   npm run dev:backend  # Backend: http://localhost:3000
   npm run dev:frontend # Frontend: http://localhost:5173
   ```

### Option 2: Docker Development

1. **Start all services**
   ```bash
   docker-compose up -d
   ```

2. **Access the applications**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432

3. **Stop all services**
   ```bash
   docker-compose down
   ```

## 📁 Project Structure

```
worldclass-erp/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Database models
│   │   ├── modules/           # ERP modules
│   │   │   ├── inventory/
│   │   │   ├── sales/
│   │   │   ├── purchase/
│   │   │   ├── financial/
│   │   │   ├── hr/
│   │   │   ├── manufacturing/
│   │   │   └── warehouse/
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── index.ts           # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── modules/           # Module-specific components
│   │   ├── services/          # API services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React contexts
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # Main App component
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── package.json                # Root package.json
└── README.md
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Check server status

### Inventory Management
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get specific item
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item

### Sales & CRM
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale

### Purchase Management
- `GET /api/purchase` - Get all purchases
- `POST /api/purchase` - Create new purchase

### Financial Accounting
- **Complete Chart of Accounts** - Multi-level account hierarchy
- **Journal Entry System** - Manual entries with auto-posting engine
- **Multi-Dimensional Tracking** - Cost Centers, Departments, Projects, Products, Locations
- **Period Management** - Fiscal year and period control with lock mechanisms
- **Trial Balance** - Real-time trial balance with dimension filtering
- **Account Ledger** - Detailed transaction history per account
- **Executive Dashboard** - Real-time financial metrics and analytics
- `GET /api/financial/accounts` - Get all accounts
- `POST /api/financial/journal-entries` - Create journal entry
- `GET /api/financial/trial-balance` - Get trial balance
- `GET /api/financial/dimensions/*` - Manage dimensions (5 types)
- `GET /api/financial/periods` - Manage fiscal periods
- `GET /api/financial/dashboard/*` - Dashboard analytics

### HR & Payroll
- `GET /api/hr/employees` - Get all employees
- `POST /api/hr/employees` - Create new employee
- `GET /api/hr/payroll` - Get payroll data

### Manufacturing
- `GET /api/manufacturing/work-orders` - Get work orders
- `POST /api/manufacturing/work-orders` - Create work order

### Warehouse Management
- `GET /api/warehouse/locations` - Get warehouse locations
- `POST /api/warehouse/locations` - Create new location

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

## 🏗️ Building for Production

```bash
# Build all projects
npm run build

# Build backend only
npm run build --workspace=backend

# Build frontend only
npm run build --workspace=frontend
```

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Helmet.js for security headers
- CORS configuration
- Environment variables for sensitive data

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/worldclass_erp
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

## 🗺️ Roadmap

### ✅ Completed
- [x] Financial Module Foundation (Chart of Accounts, Journal Entries, Posting Engine)
- [x] Multi-Dimensional Tracking (5 dimensions with full CRUD operations)
- [x] Period Management (Fiscal years, periods, lock controls)
- [x] Trial Balance with Dimension Filtering
- [x] Account Ledger with Dimension Analytics
- [x] Executive Financial Dashboard

### 🔄 In Progress
- [ ] Approval Workflows (Multi-level approval for journal entries)
- [ ] Budget Management (Budget vs Actual reporting by dimension)

### 📅 Planned
- [ ] User authentication and authorization
- [ ] Role-based access control (RBAC)
- [ ] Advanced reporting and analytics
- [ ] Mobile responsive design improvements
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Real-time notifications
- [ ] Data import/export functionality
- [ ] Multi-language support
- [ ] Advanced search and filtering
- [ ] Audit logging
- [ ] SARS Sentinel AI (South African tax compliance automation)

## 👥 Team

Built with ❤️ by the Worldclass ERP development team.
