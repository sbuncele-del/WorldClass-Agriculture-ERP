/**
 * Modules Controller
 * Provides module discovery and availability information
 * Backend informs frontend which modules are available and active
 */

import { Request, Response } from 'express';

interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming_soon' | 'disabled';
  category: 'core' | 'industry' | 'compliance' | 'advanced' | 'platform';
  industries?: string[]; // Which industries can see this module
  hasWorkspace?: boolean;
  workspaceCount?: number;
  controllerLines?: number; // For development visibility
}

/**
 * Master module registry
 * THIS IS THE SOURCE OF TRUTH - Backend defines what frontend can access
 */
const MODULE_REGISTRY: ModuleDefinition[] = [
  // ============================================================================
  // CORE ERP MODULES (Available to all industries)
  // ============================================================================
  {
    id: 'financial',
    name: 'Financial Management',
    description: 'General Ledger, Chart of Accounts, Journal Entries',
    icon: 'DollarSign',
    route: '/financial',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 2000 // Multiple sub-modules
  },
  {
    id: 'cash-management',
    name: 'Cash Management',
    description: 'Bank Reconciliation, Cash Flow, Treasury',
    icon: 'Wallet',
    route: '/cash-management',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 433
  },
  {
    id: 'sales',
    name: 'Sales & CRM',
    description: 'Leads, Opportunities, Quotations, Sales Orders',
    icon: 'TrendingUp',
    route: '/sales',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 2020
  },
  {
    id: 'purchase',
    name: 'Purchase Management',
    description: 'Suppliers, Requisitions, Purchase Orders, Invoices',
    icon: 'ShoppingCart',
    route: '/purchase',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 1822
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Stock Levels, Movements, Adjustments, Warehouses',
    icon: 'Package',
    route: '/inventory',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 1196
  },
  {
    id: 'hr',
    name: 'HR & Payroll',
    description: 'Employees, Payroll, Leave Management, Attendance',
    icon: 'Users',
    route: '/hr',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 1593
  },
  {
    id: 'assets',
    name: 'Asset Management',
    description: 'Fixed Assets, Depreciation, Disposals, Maintenance',
    icon: 'Briefcase',
    route: '/assets',
    status: 'active',
    category: 'core',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 624
  },

  // ============================================================================
  // INDUSTRY-SPECIFIC MODULES
  // ============================================================================
  {
    id: 'healthcare',
    name: 'Healthcare Operations',
    description: 'Patient Management, Clinical Workflows, Resources',
    icon: 'Heart',
    route: '/healthcare',
    status: 'active',
    category: 'industry',
    industries: ['healthcare', 'medical', 'clinic'],
    hasWorkspace: true,
    workspaceCount: 4, // Patient, Clinical, Resource, Analytics
    controllerLines: 2768
  },
  {
    id: 'logistics',
    name: 'Logistics Management',
    description: 'Fleet Management, Route Planning, Fuel Management',
    icon: 'Truck',
    route: '/logistics',
    status: 'active',
    category: 'industry',
    industries: ['logistics', 'transport', 'distribution'],
    hasWorkspace: true,
    controllerLines: 1359
  },
  {
    id: 'practice',
    name: 'Practice Management',
    description: 'Professional Services, Projects, Time Tracking',
    icon: 'Briefcase',
    route: '/practice',
    status: 'active',
    category: 'industry',
    industries: ['professional-services', 'consulting', 'legal', 'accounting'],
    hasWorkspace: false,
    controllerLines: 500 // Multiple sub-controllers
  },

  // ============================================================================
  // COMPLIANCE & REGULATORY MODULES
  // ============================================================================
  {
    id: 'compliance',
    name: 'Compliance & Governance',
    description: 'Compliance Framework, Risk Management, Policies',
    icon: 'Shield',
    route: '/compliance',
    status: 'active',
    category: 'compliance',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 958
  },
  {
    id: 'audit-ready',
    name: 'Audit-Ready Suite',
    description: 'Audit Preparation, Trail Reports, Documentation',
    icon: 'FileCheck',
    route: '/audit',
    status: 'active',
    category: 'compliance',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 806
  },
  {
    id: 'sars-sentinel',
    name: 'SARS Tax Compliance',
    description: 'South African Revenue Service Tax Compliance',
    icon: 'Calculator',
    route: '/sars-sentinel',
    status: 'active',
    category: 'compliance',
    industries: ['south-africa'], // Geographic specific
    hasWorkspace: false,
    controllerLines: 737
  },

  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================
  {
    id: 'ai-assistant',
    name: 'AI Agents & Assistants',
    description: 'AI-powered insights and automation',
    icon: 'Sparkles',
    route: '/ai',
    status: 'active',
    category: 'advanced',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 205
  },
  {
    id: 'multi-entity',
    name: 'Multi-Entity Management',
    description: 'Manage multiple companies and entities',
    icon: 'Building',
    route: '/entities',
    status: 'active',
    category: 'advanced',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 115
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Custom reports and business intelligence',
    icon: 'BarChart',
    route: '/reports',
    status: 'active',
    category: 'advanced',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 118
  },

  // ============================================================================
  // PLATFORM & ADMINISTRATION
  // ============================================================================
  {
    id: 'admin',
    name: 'Admin Portal',
    description: 'User Management, Roles, Permissions, Settings',
    icon: 'Settings',
    route: '/admin',
    status: 'active',
    category: 'platform',
    industries: ['all'],
    hasWorkspace: false,
    controllerLines: 958
  },
  {
    id: 'dashboard',
    name: 'Executive Dashboard',
    description: 'Key metrics and business insights',
    icon: 'LayoutDashboard',
    route: '/dashboard',
    status: 'active',
    category: 'platform',
    industries: ['all'],
    hasWorkspace: true,
    controllerLines: 599
  },

  // ============================================================================
  // COMING SOON (Route exists but no controller)
  // ============================================================================
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production Orders, Bill of Materials, Work Centers',
    icon: 'Factory',
    route: '/manufacturing',
    status: 'coming_soon',
    category: 'core',
    industries: ['manufacturing', 'production'],
    hasWorkspace: false,
    controllerLines: 0
  },
  {
    id: 'warehouse',
    name: 'Warehouse Management',
    description: 'Advanced warehouse operations, pick/pack/ship',
    icon: 'Warehouse',
    route: '/warehouse',
    status: 'coming_soon',
    category: 'core',
    industries: ['distribution', 'logistics', 'retail'],
    hasWorkspace: false,
    controllerLines: 0
  },
];

/**
 * GET /api/modules/available
 * Returns modules available to the current tenant based on their industry
 * 
 * Query params:
 *   - industry: Filter by industry (optional, defaults to tenant's industry)
 *   - status: Filter by status (active, coming_soon, disabled)
 *   - category: Filter by category (core, industry, compliance, advanced, platform)
 */
export const getAvailableModules = async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry, status, category } = req.query;
    const tenantId = (req as any).tenant?.id;
    const tenantIndustry = (req as any).tenant?.industry_type || 'general'; // From tenant record

    // Determine which industry to filter by
    const filterIndustry = (industry as string) || tenantIndustry;

    // Filter modules based on criteria
    let filteredModules = MODULE_REGISTRY.filter(module => {
      // Filter by status
      if (status && module.status !== status) {
        return false;
      }

      // Filter by category
      if (category && module.category !== category) {
        return false;
      }

      // Filter by industry
      // 'all' means available to everyone
      // Otherwise, check if tenant's industry is in the module's industry list
      if (!module.industries?.includes('all')) {
        if (!module.industries?.includes(filterIndustry)) {
          return false;
        }
      }

      return true;
    });

    // Group by category for easier frontend consumption
    const groupedModules = {
      core: filteredModules.filter(m => m.category === 'core' && m.status === 'active'),
      industry: filteredModules.filter(m => m.category === 'industry' && m.status === 'active'),
      compliance: filteredModules.filter(m => m.category === 'compliance' && m.status === 'active'),
      advanced: filteredModules.filter(m => m.category === 'advanced' && m.status === 'active'),
      platform: filteredModules.filter(m => m.category === 'platform' && m.status === 'active'),
      coming_soon: filteredModules.filter(m => m.status === 'coming_soon'),
    };

    // Summary statistics
    const summary = {
      total_active: filteredModules.filter(m => m.status === 'active').length,
      total_coming_soon: filteredModules.filter(m => m.status === 'coming_soon').length,
      has_workspace: filteredModules.filter(m => m.hasWorkspace).length,
      tenant_industry: filterIndustry,
      tenant_id: tenantId,
    };

    res.json({
      success: true,
      data: {
        modules: groupedModules,
        summary,
        // Include flat list for simpler consumption if needed
        all_modules: filteredModules,
      },
    });
  } catch (error: any) {
    console.error('Error fetching available modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available modules',
      message: error.message,
    });
  }
};

/**
 * GET /api/modules/:moduleId
 * Get detailed information about a specific module
 */
export const getModuleDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { moduleId } = req.params;
    
    const module = MODULE_REGISTRY.find(m => m.id === moduleId);

    if (!module) {
      res.status(404).json({
        success: false,
        error: 'Module not found',
      });
      return;
    }

    res.json({
      success: true,
      data: module,
    });
  } catch (error: any) {
    console.error('Error fetching module details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module details',
      message: error.message,
    });
  }
};

/**
 * GET /api/modules/categories
 * Get list of all module categories
 */
export const getModuleCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = [
      {
        id: 'core',
        name: 'Core ERP',
        description: 'Essential business management modules',
        count: MODULE_REGISTRY.filter(m => m.category === 'core' && m.status === 'active').length,
      },
      {
        id: 'industry',
        name: 'Industry Solutions',
        description: 'Specialized modules for specific industries',
        count: MODULE_REGISTRY.filter(m => m.category === 'industry' && m.status === 'active').length,
      },
      {
        id: 'compliance',
        name: 'Compliance & Regulatory',
        description: 'Compliance, audit, and regulatory modules',
        count: MODULE_REGISTRY.filter(m => m.category === 'compliance' && m.status === 'active').length,
      },
      {
        id: 'advanced',
        name: 'Advanced Features',
        description: 'AI, analytics, and advanced capabilities',
        count: MODULE_REGISTRY.filter(m => m.category === 'advanced' && m.status === 'active').length,
      },
      {
        id: 'platform',
        name: 'Platform & Administration',
        description: 'System administration and platform features',
        count: MODULE_REGISTRY.filter(m => m.category === 'platform' && m.status === 'active').length,
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Error fetching module categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module categories',
      message: error.message,
    });
  }
};

/**
 * GET /api/modules/industries
 * Get list of supported industries
 */
export const getSupportedIndustries = async (_req: Request, res: Response): Promise<void> => {
  try {
    const industries = [
      {
        id: 'general',
        name: 'General Business',
        description: 'Standard ERP for all businesses',
        module_count: MODULE_REGISTRY.filter(m => m.industries?.includes('all')).length,
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Hospitals, clinics, medical practices',
        module_count: MODULE_REGISTRY.filter(m => 
          m.industries?.includes('healthcare') || m.industries?.includes('all')
        ).length,
      },
      {
        id: 'logistics',
        name: 'Logistics & Transport',
        description: 'Fleet management, distribution, transport',
        module_count: MODULE_REGISTRY.filter(m => 
          m.industries?.includes('logistics') || m.industries?.includes('all')
        ).length,
      },
      {
        id: 'professional-services',
        name: 'Professional Services',
        description: 'Consulting, legal, accounting firms',
        module_count: MODULE_REGISTRY.filter(m => 
          m.industries?.includes('professional-services') || m.industries?.includes('all')
        ).length,
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        description: 'Production and manufacturing operations',
        module_count: MODULE_REGISTRY.filter(m => 
          m.industries?.includes('manufacturing') || m.industries?.includes('all')
        ).length,
      },
      {
        id: 'retail',
        name: 'Retail & Distribution',
        description: 'Retail stores and distribution centers',
        module_count: MODULE_REGISTRY.filter(m => 
          m.industries?.includes('retail') || m.industries?.includes('all')
        ).length,
      },
    ];

    res.json({
      success: true,
      data: industries,
    });
  } catch (error: any) {
    console.error('Error fetching supported industries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported industries',
      message: error.message,
    });
  }
};
