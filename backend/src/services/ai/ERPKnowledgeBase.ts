/**
 * SiyaBusa ERP Knowledge Base
 * 
 * Comprehensive knowledge about the ERP system for the AI Assistant.
 * This makes the AI truly understand the system and help users effectively.
 */

export interface ModuleKnowledge {
  name: string;
  description: string;
  capabilities: string[];
  commonQuestions: { question: string; answer: string }[];
  navigation: string;
  relatedModules: string[];
}

export interface ERPKnowledge {
  systemOverview: string;
  modules: Record<string, ModuleKnowledge>;
  glossary: Record<string, string>;
  workflows: Record<string, string[]>;
  compliance: Record<string, string>;
  troubleshooting: Record<string, string>;
}

export const ERP_KNOWLEDGE: ERPKnowledge = {
  systemOverview: `
SiyaBusa ERP is a comprehensive Enterprise Resource Planning system designed for South African businesses.
It provides end-to-end business management across finance, operations, HR, and industry-specific modules.

KEY FEATURES:
- Multi-tenant architecture (each company has isolated data)
- Real-time financial reporting and dashboards
- South African compliance built-in (SARS, VAT, PAYE, UIF)
- 25+ integrated modules for complete business management
- Role-based access control for security

CORE PHILOSOPHY:
- Simple enough for business owners, powerful enough for accountants
- Everything audit-ready from day one
- AI-first approach - ask questions in plain English
`,

  modules: {
    // FINANCIAL MODULES
    financial: {
      name: 'Financial Hub',
      description: 'Complete general ledger, chart of accounts, and financial management',
      capabilities: [
        'Create and manage chart of accounts',
        'Record journal entries (manual and automated)',
        'Run trial balance, income statement, balance sheet',
        'Manage fiscal periods and year-end close',
        'Multi-currency transactions',
        'Dimension tracking (cost centers, projects, departments)',
        'Financial forecasting and budgeting'
      ],
      commonQuestions: [
        { question: 'How do I create a journal entry?', answer: 'Go to Financial Hub → Journal Entries → New Entry. Select accounts, enter debits/credits ensuring they balance, add description and post.' },
        { question: 'How do I run a trial balance?', answer: 'Financial Hub → Reports → Trial Balance. Select the period and click Generate.' },
        { question: 'What is a chart of accounts?', answer: 'A chart of accounts is the list of all accounts used to record transactions. It includes Assets, Liabilities, Equity, Revenue, and Expenses. Go to Financial Hub → Chart of Accounts to view or edit.' }
      ],
      navigation: '/app/financial-hub',
      relatedModules: ['banking', 'sales', 'purchase', 'tax']
    },

    banking: {
      name: 'Banking Hub',
      description: 'Bank reconciliation, cash management, and treasury',
      capabilities: [
        'Import bank statements (CSV, OFX, MT940)',
        'Automatic transaction matching',
        'Bank reconciliation',
        'Cash flow forecasting',
        'Multiple bank accounts',
        'Payment processing and scheduling'
      ],
      commonQuestions: [
        { question: 'How do I reconcile my bank account?', answer: 'Go to Banking Hub → Reconciliation. Import your bank statement, match transactions, and confirm the reconciliation.' },
        { question: 'How do I import a bank statement?', answer: 'Banking Hub → Import Statement. Upload CSV or OFX file from your bank.' }
      ],
      navigation: '/app/banking-hub',
      relatedModules: ['financial', 'cashManagement']
    },

    cashManagement: {
      name: 'Cash Management',
      description: 'Daily cash position, forecasting, and liquidity management',
      capabilities: [
        'Real-time cash position',
        'Cash flow forecasting',
        'Petty cash management',
        'Cash requirements planning',
        'Bank balance monitoring'
      ],
      commonQuestions: [
        { question: 'What is my cash position?', answer: 'Go to Cash Management to see real-time balances across all accounts, pending receivables, and payables.' },
        { question: 'How do I forecast cash flow?', answer: 'Cash Management → Forecasting shows projected cash based on outstanding invoices and bills.' }
      ],
      navigation: '/app/cash-management',
      relatedModules: ['banking', 'financial']
    },

    treasury: {
      name: 'Treasury',
      description: 'Investment management, forex, and treasury operations',
      capabilities: [
        'Investment tracking',
        'Foreign exchange management',
        'Interest calculations',
        'Treasury reports'
      ],
      commonQuestions: [
        { question: 'How do I track investments?', answer: 'Treasury → Investments allows you to record and track company investments.' }
      ],
      navigation: '/app/treasury',
      relatedModules: ['financial', 'cashManagement']
    },

    // SALES & CRM
    sales: {
      name: 'Sales Hub',
      description: 'Quotes, invoices, customers, and CRM',
      capabilities: [
        'Create and send quotes/estimates',
        'Generate sales invoices',
        'Record customer payments',
        'Manage customer accounts',
        'Track sales pipeline',
        'Credit management',
        'Sales reports and analytics'
      ],
      commonQuestions: [
        { question: 'How do I create an invoice?', answer: 'Sales Hub → New Invoice. Select customer, add line items, review totals including VAT, and save/send.' },
        { question: 'How do I record a payment?', answer: 'Sales Hub → Payments → Record Payment. Select invoice, enter amount and payment method.' },
        { question: 'How do I check customer balance?', answer: 'Sales Hub → Customers → Select customer → View statement showing all transactions and balance.' }
      ],
      navigation: '/app/sales-hub',
      relatedModules: ['financial', 'inventory', 'delivery']
    },

    // PURCHASING
    purchase: {
      name: 'Purchase Hub',
      description: 'Purchase orders, supplier invoices, and procurement',
      capabilities: [
        'Create purchase orders',
        'Receive goods',
        'Record supplier invoices',
        'Make supplier payments',
        'Manage supplier accounts',
        'Track purchase history',
        'Purchase reports'
      ],
      commonQuestions: [
        { question: 'How do I create a purchase order?', answer: 'Purchase Hub → New PO. Select supplier, add items, quantities, prices, and send to supplier.' },
        { question: 'How do I receive goods?', answer: 'Purchase Hub → Receive Goods. Select the PO and confirm quantities received.' }
      ],
      navigation: '/app/purchase-hub',
      relatedModules: ['inventory', 'financial', 'warehouse']
    },

    // INVENTORY
    inventory: {
      name: 'Inventory Hub',
      description: 'Stock management, products, and inventory control',
      capabilities: [
        'Product/SKU management',
        'Stock levels and locations',
        'Stock adjustments',
        'Reorder point alerts',
        'Inventory valuation (FIFO, weighted average)',
        'Barcode support',
        'Stock take/counts'
      ],
      commonQuestions: [
        { question: 'How do I check stock levels?', answer: 'Inventory Hub shows all products with current stock. Use filters to find specific items.' },
        { question: 'How do I do a stock take?', answer: 'Inventory Hub → Stock Count → New Count. Enter actual quantities and system calculates adjustments.' },
        { question: 'How do I adjust stock?', answer: 'Inventory Hub → Adjustments → New Adjustment. Select item, reason, and quantity change.' }
      ],
      navigation: '/app/inventory-hub',
      relatedModules: ['sales', 'purchase', 'warehouse', 'manufacturing']
    },

    // WAREHOUSE
    warehouse: {
      name: 'Warehouse Hub',
      description: 'Warehouse management, locations, and transfers',
      capabilities: [
        'Multiple warehouse management',
        'Location/bin management',
        'Stock transfers between warehouses',
        'Picking and packing',
        'Receiving and put-away',
        'Warehouse reports'
      ],
      commonQuestions: [
        { question: 'How do I transfer stock between warehouses?', answer: 'Warehouse Hub → Transfers → New Transfer. Select source, destination, items, and quantities.' }
      ],
      navigation: '/app/warehouse-hub',
      relatedModules: ['inventory', 'logistics']
    },

    // HR & PAYROLL
    hr: {
      name: 'HR Hub',
      description: 'Employee management, payroll, and HR administration',
      capabilities: [
        'Employee records and contracts',
        'Leave management',
        'Payroll processing (PAYE, UIF, SDL)',
        'Payslip generation',
        'Time and attendance',
        'Performance management',
        'Training records',
        'IRP5 generation'
      ],
      commonQuestions: [
        { question: 'How do I process payroll?', answer: 'HR Hub → Payroll → Run Payroll. Select period, review calculations, approve and process.' },
        { question: 'How do I add an employee?', answer: 'HR Hub → Employees → Add Employee. Enter personal details, tax info, salary, and bank details.' },
        { question: 'How do I approve leave?', answer: 'HR Hub → Leave → Pending Approvals shows all leave requests to approve or reject.' }
      ],
      navigation: '/app/hr-hub',
      relatedModules: ['financial', 'projects']
    },

    // ASSETS
    assets: {
      name: 'Assets Hub',
      description: 'Fixed asset management and depreciation (IAS 16 compliant)',
      capabilities: [
        'Asset register',
        'Depreciation calculation (straight-line, reducing balance)',
        'Asset revaluation',
        'Disposal and write-offs',
        'Asset location tracking',
        'Maintenance scheduling',
        'IAS 16 compliance'
      ],
      commonQuestions: [
        { question: 'How do I add a new asset?', answer: 'Assets Hub → Add Asset. Enter details, cost, useful life, and depreciation method.' },
        { question: 'How do I run depreciation?', answer: 'Assets Hub → Run Depreciation. Select period and system calculates depreciation entries.' }
      ],
      navigation: '/app/assets-hub',
      relatedModules: ['financial']
    },

    // PROJECTS
    projects: {
      name: 'Projects Hub',
      description: 'Project management, time tracking, and billing',
      capabilities: [
        'Project setup and planning',
        'Task management',
        'Time tracking',
        'Project costing',
        'Progress billing',
        'Resource allocation',
        'Project reports'
      ],
      commonQuestions: [
        { question: 'How do I create a project?', answer: 'Projects Hub → New Project. Enter name, client, budget, dates, and team members.' },
        { question: 'How do I log time?', answer: 'Projects Hub → Time Entry. Select project, task, enter hours and description.' }
      ],
      navigation: '/app/projects-hub',
      relatedModules: ['hr', 'sales', 'financial']
    },

    // COMPLIANCE & TAX
    sarsSentinel: {
      name: 'SARS Sentinel',
      description: 'South African tax compliance and SARS submissions',
      capabilities: [
        'VAT calculation and returns',
        'VAT201 preparation',
        'PAYE/EMP201 submissions',
        'Tax calendar and deadlines',
        'Audit file generation',
        'Tax certificates'
      ],
      commonQuestions: [
        { question: 'When is VAT due?', answer: 'VAT returns are due by the 25th of the month following the VAT period. SARS Sentinel shows upcoming deadlines.' },
        { question: 'How do I prepare a VAT return?', answer: 'SARS Sentinel → VAT → Prepare Return. System calculates from your transactions. Review and submit.' }
      ],
      navigation: '/app/sars',
      relatedModules: ['financial', 'sales', 'purchase']
    },

    auditReady: {
      name: 'Audit-Ready Hub',
      description: 'Audit preparation and compliance documentation',
      capabilities: [
        'Audit checklist',
        'Document management',
        'Supporting schedules',
        'Audit trail',
        'Compliance tracking'
      ],
      commonQuestions: [
        { question: 'How do I prepare for an audit?', answer: 'Audit-Ready Hub provides checklists, generates required schedules, and ensures all documentation is in order.' }
      ],
      navigation: '/app/audit-ready',
      relatedModules: ['financial', 'sarsSentinel']
    },

    // LOGISTICS
    logistics: {
      name: 'Logistics Hub',
      description: 'Fleet management, deliveries, and transportation',
      capabilities: [
        'Fleet management',
        'Delivery scheduling',
        'Route optimization',
        'Driver management',
        'Fuel tracking',
        'Vehicle maintenance',
        'Delivery tracking'
      ],
      commonQuestions: [
        { question: 'How do I schedule a delivery?', answer: 'Logistics Hub → Deliveries → New Delivery. Select order, vehicle, driver, and route.' }
      ],
      navigation: '/app/logistics-hub',
      relatedModules: ['sales', 'warehouse', 'inventory']
    },

    // MANUFACTURING
    manufacturing: {
      name: 'Manufacturing Hub',
      description: 'Production planning, BOM, and work orders',
      capabilities: [
        'Bill of Materials (BOM)',
        'Work orders',
        'Production scheduling',
        'Material requirements planning',
        'Shop floor control',
        'Quality control'
      ],
      commonQuestions: [
        { question: 'How do I create a work order?', answer: 'Manufacturing Hub → Work Orders → New. Select product, quantity, and schedule production.' }
      ],
      navigation: '/app/manufacturing-hub',
      relatedModules: ['inventory', 'purchase']
    },

    // COMMUNICATIONS
    communications: {
      name: 'Communications Hub',
      description: 'Internal messaging, announcements, and video meetings',
      capabilities: [
        'Internal messaging',
        'Team announcements',
        'Video conferencing',
        'Document sharing',
        'Email integration'
      ],
      commonQuestions: [
        { question: 'How do I send a message?', answer: 'Communications Hub → Messages → New Message. Select recipient and compose your message.' },
        { question: 'How do I start a video call?', answer: 'Communications Hub → Meetings → New Meeting. Invite participants and start the call.' }
      ],
      navigation: '/app/communications-hub',
      relatedModules: []
    },

    // ADMIN
    admin: {
      name: 'Admin Hub',
      description: 'System configuration, users, and settings',
      capabilities: [
        'User management',
        'Role and permissions',
        'Company settings',
        'Integrations',
        'Audit logs',
        'System configuration',
        'Billing and subscription'
      ],
      commonQuestions: [
        { question: 'How do I add a user?', answer: 'Admin Hub → Users → Invite User. Enter email and select role.' },
        { question: 'How do I change permissions?', answer: 'Admin Hub → Roles → Edit role to configure permissions.' }
      ],
      navigation: '/app/admin-hub',
      relatedModules: []
    },

    // INDUSTRY SPECIFIC
    healthcare: {
      name: 'Healthcare Module',
      description: 'Patient management and medical practice operations',
      capabilities: [
        'Patient records',
        'Appointment scheduling',
        'Medical billing (ICD-10)',
        'Medical aid claims',
        'Prescription tracking',
        'Clinical notes'
      ],
      commonQuestions: [
        { question: 'How do I register a patient?', answer: 'Healthcare → Patients → New Patient. Enter demographics, medical aid info, and medical history.' }
      ],
      navigation: '/app/healthcare-hub',
      relatedModules: ['sales', 'financial']
    },

    construction: {
      name: 'Construction Module',
      description: 'Construction project management and costing',
      capabilities: [
        'Project costing',
        'Progress billing',
        'Retention tracking',
        'Subcontractor management',
        'Variation orders',
        'Site management'
      ],
      commonQuestions: [
        { question: 'How do I create a progress claim?', answer: 'Construction → Projects → Select project → Progress Billing to create a claim.' }
      ],
      navigation: '/app/construction-hub',
      relatedModules: ['projects', 'financial', 'purchase']
    },

    property: {
      name: 'Property Management',
      description: 'Rental property management and tenant billing',
      capabilities: [
        'Property portfolio',
        'Tenant management',
        'Lease agreements',
        'Rent billing',
        'Maintenance requests',
        'Property inspections'
      ],
      commonQuestions: [
        { question: 'How do I add a tenant?', answer: 'Property → Tenants → Add Tenant. Enter details, assign property, and create lease.' }
      ],
      navigation: '/app/property-hub',
      relatedModules: ['financial', 'sales']
    },

    agriculture: {
      name: 'Agriculture Module',
      description: 'Farm management and agricultural operations',
      capabilities: [
        'Crop management',
        'Livestock tracking',
        'Field management',
        'Harvest recording',
        'Input tracking',
        'Weather integration'
      ],
      commonQuestions: [
        { question: 'How do I record a harvest?', answer: 'Agriculture → Crops → Select crop → Record Harvest with yield and quality data.' }
      ],
      navigation: '/app/agriculture-hub',
      relatedModules: ['inventory', 'financial']
    },

    mining: {
      name: 'Mining Module',
      description: 'Mining operations and mineral tracking',
      capabilities: [
        'Mineral tracking',
        'Safety compliance',
        'Equipment management',
        'Production reporting',
        'Environmental compliance'
      ],
      commonQuestions: [
        { question: 'How do I record production?', answer: 'Mining → Production → New Entry. Record extracted quantities and quality metrics.' }
      ],
      navigation: '/app/mining-hub',
      relatedModules: ['assets', 'financial', 'hr']
    }
  },

  glossary: {
    'GL': 'General Ledger - The master accounting record containing all financial transactions',
    'COA': 'Chart of Accounts - The complete list of accounts used in your accounting system',
    'AP': 'Accounts Payable - Money owed to suppliers',
    'AR': 'Accounts Receivable - Money owed by customers',
    'VAT': 'Value Added Tax - 15% tax on goods and services in South Africa',
    'PAYE': 'Pay As You Earn - Tax deducted from employee salaries',
    'UIF': 'Unemployment Insurance Fund - Contributions for unemployment benefits',
    'SDL': 'Skills Development Levy - 1% levy for skills development',
    'IRP5': 'Income tax certificate issued to employees annually',
    'BOM': 'Bill of Materials - List of raw materials needed to manufacture a product',
    'PO': 'Purchase Order - Document requesting goods from a supplier',
    'WO': 'Work Order - Instruction to manufacture products',
    'FIFO': 'First In First Out - Inventory valuation method',
    'Depreciation': 'Reduction in asset value over time due to wear and tear',
    'Reconciliation': 'Matching your records with bank statements to ensure accuracy',
    'Journal Entry': 'A record of a financial transaction with debits and credits',
    'Trial Balance': 'A report showing all account balances to verify debits equal credits',
    'Fiscal Period': 'An accounting period, typically monthly or annually',
    'Multi-tenant': 'Each company has completely separate, secure data'
  },

  workflows: {
    'Sales Cycle': [
      '1. Create customer (if new)',
      '2. Create quote/estimate',
      '3. Customer accepts quote',
      '4. Convert quote to sales order',
      '5. Pick and pack items (if physical goods)',
      '6. Ship/deliver to customer',
      '7. Create invoice',
      '8. Receive payment',
      '9. Payment allocated to invoice'
    ],
    'Purchase Cycle': [
      '1. Create supplier (if new)',
      '2. Create purchase requisition (optional)',
      '3. Create purchase order',
      '4. Send PO to supplier',
      '5. Receive goods',
      '6. Receive supplier invoice',
      '7. Match invoice to PO and receipt',
      '8. Approve invoice',
      '9. Make payment'
    ],
    'Month-end Close': [
      '1. Ensure all transactions are recorded',
      '2. Import and reconcile bank statements',
      '3. Run depreciation',
      '4. Review accruals and prepayments',
      '5. Run trial balance and review',
      '6. Fix any errors',
      '7. Generate financial statements',
      '8. Close the period'
    ],
    'Payroll Processing': [
      '1. Capture time and attendance',
      '2. Enter overtime, bonuses, deductions',
      '3. Run payroll calculation',
      '4. Review payslips',
      '5. Approve payroll',
      '6. Generate bank file for salaries',
      '7. Submit EMP201 to SARS',
      '8. Generate payslips'
    ]
  },

  compliance: {
    'VAT': 'Businesses with turnover > R1 million must register for VAT. Returns due by 25th of following month. Standard rate is 15%.',
    'PAYE': 'Employers must deduct income tax from salaries and pay to SARS monthly via EMP201.',
    'UIF': 'Both employer and employee contribute 1% of salary (2% total). Report and pay monthly.',
    'SDL': 'Employers with payroll > R500,000 must pay 1% Skills Development Levy.',
    'POPIA': 'Protection of Personal Information Act - Ensure customer and employee data is protected.',
    'CIPC': 'Annual returns must be filed with CIPC to keep company in good standing.',
    'Tax Year': 'Company financial year can be any 12-month period. Individual tax year is March to February.'
  },

  troubleshooting: {
    'Trial balance not balancing': 'Check for: unposted entries, suspended entries, opening balance errors, or rounding issues.',
    'Cannot post journal entry': 'Ensure debits equal credits, all required fields are filled, and the period is open.',
    'Invoice not appearing': 'Check if it was saved as draft. Go to Invoices and filter by Draft status.',
    'Payment not allocated': 'Go to Payments, find the payment, and manually allocate to the correct invoice.',
    'Stock quantity wrong': 'Do a stock take to identify discrepancies, then create an adjustment.',
    'Report shows wrong figures': 'Check the date range, ensure all transactions are posted, and verify account mappings.',
    'Cannot close period': 'Ensure all entries are posted and bank reconciliations are complete.',
    'User cannot access module': 'Check user role permissions in Admin Hub.'
  }
};

/**
 * Get knowledge for a specific module
 */
export function getModuleKnowledge(moduleName: string): ModuleKnowledge | undefined {
  return ERP_KNOWLEDGE.modules[moduleName];
}

/**
 * Search knowledge base for relevant information
 */
export function searchKnowledge(query: string): { category: string; content: string }[] {
  const results: { category: string; content: string }[] = [];
  const lowerQuery = query.toLowerCase();

  // Search modules
  for (const [key, module] of Object.entries(ERP_KNOWLEDGE.modules)) {
    if (
      module.name.toLowerCase().includes(lowerQuery) ||
      module.description.toLowerCase().includes(lowerQuery) ||
      module.capabilities.some(c => c.toLowerCase().includes(lowerQuery))
    ) {
      results.push({
        category: 'Module',
        content: `${module.name}: ${module.description}\nCapabilities: ${module.capabilities.join(', ')}`
      });
    }

    // Search common questions
    for (const qa of module.commonQuestions) {
      if (qa.question.toLowerCase().includes(lowerQuery) || qa.answer.toLowerCase().includes(lowerQuery)) {
        results.push({
          category: 'FAQ',
          content: `Q: ${qa.question}\nA: ${qa.answer}`
        });
      }
    }
  }

  // Search glossary
  for (const [term, definition] of Object.entries(ERP_KNOWLEDGE.glossary)) {
    if (term.toLowerCase().includes(lowerQuery) || definition.toLowerCase().includes(lowerQuery)) {
      results.push({
        category: 'Glossary',
        content: `${term}: ${definition}`
      });
    }
  }

  // Search workflows
  for (const [workflow, steps] of Object.entries(ERP_KNOWLEDGE.workflows)) {
    if (workflow.toLowerCase().includes(lowerQuery) || steps.some(s => s.toLowerCase().includes(lowerQuery))) {
      results.push({
        category: 'Workflow',
        content: `${workflow}:\n${steps.join('\n')}`
      });
    }
  }

  // Search troubleshooting
  for (const [problem, solution] of Object.entries(ERP_KNOWLEDGE.troubleshooting)) {
    if (problem.toLowerCase().includes(lowerQuery) || solution.toLowerCase().includes(lowerQuery)) {
      results.push({
        category: 'Troubleshooting',
        content: `Problem: ${problem}\nSolution: ${solution}`
      });
    }
  }

  return results;
}

/**
 * Generate context for AI about the ERP system
 */
export function generateERPContext(): string {
  return `
SIYABUSA ERP SYSTEM KNOWLEDGE:

${ERP_KNOWLEDGE.systemOverview}

AVAILABLE MODULES:
${Object.entries(ERP_KNOWLEDGE.modules).map(([key, m]) => `- ${m.name}: ${m.description}`).join('\n')}

KEY ACCOUNTING TERMS:
${Object.entries(ERP_KNOWLEDGE.glossary).slice(0, 10).map(([term, def]) => `- ${term}: ${def}`).join('\n')}

SOUTH AFRICAN COMPLIANCE:
${Object.entries(ERP_KNOWLEDGE.compliance).map(([area, info]) => `- ${area}: ${info}`).join('\n')}

When users ask questions:
1. First check if it's about a specific module and guide them to it
2. Explain concepts in simple business terms, not accounting jargon
3. Provide step-by-step guidance when asked how to do something
4. Alert them to compliance requirements when relevant
5. Suggest related features they might find useful
`;
}

export default ERP_KNOWLEDGE;
