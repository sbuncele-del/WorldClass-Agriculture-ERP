/**
 * South African Tax Calculation Service
 * SARS-compliant PAYE, UIF, SDL calculations
 * Updated for 2024/2025 tax year
 */

import pool from '../../../config/database';

// 2024/2025 SARS Tax Brackets
export const SARS_TAX_BRACKETS_2024 = [
  { min: 0, max: 237100, rate: 18, base: 0 },
  { min: 237101, max: 370500, rate: 26, base: 42678 },
  { min: 370501, max: 512800, rate: 31, base: 77362 },
  { min: 512801, max: 673000, rate: 36, base: 121475 },
  { min: 673001, max: 857900, rate: 39, base: 179147 },
  { min: 857901, max: 1817000, rate: 41, base: 251258 },
  { min: 1817001, max: Infinity, rate: 45, base: 644489 },
];

// Tax Rebates for 2024/2025
export const TAX_REBATES_2024 = {
  primary: 17235,      // All taxpayers
  secondary: 9444,     // Age 65+
  tertiary: 3145,      // Age 75+
};

// Tax Thresholds for 2024/2025
export const TAX_THRESHOLDS_2024 = {
  under65: 95750,
  age65to74: 148217,
  age75plus: 165689,
};

// UIF Rates
export const UIF_RATE = 0.01; // 1% employee, 1% employer
export const UIF_CEILING_MONTHLY = 17712; // Max earnings for UIF

// SDL Rate (employer only)
export const SDL_RATE = 0.01; // 1% of total remuneration

export interface TaxCalculationInput {
  annualGrossIncome: number;
  employeeAge: number;
  medicalAidMembers?: number;
  retirementContributions?: number;
  travelAllowance?: number;
  commissionsIncluded?: boolean;
}

export interface TaxCalculationResult {
  annualTax: number;
  monthlyPAYE: number;
  annualRebate: number;
  effectiveTaxRate: number;
  taxBracket: number;
  uifEmployee: number;
  uifEmployer: number;
  sdlEmployer: number;
  medicalCredits: number;
  taxableIncome: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}

/**
 * Calculate PAYE tax based on annual taxable income
 */
export function calculatePAYE(annualTaxableIncome: number): number {
  let tax = 0;
  
  for (const bracket of SARS_TAX_BRACKETS_2024) {
    if (annualTaxableIncome > bracket.min) {
      const taxableInBracket = bracket.max === Infinity
        ? annualTaxableIncome - bracket.min
        : Math.min(annualTaxableIncome - bracket.min, bracket.max - bracket.min);
      
      if (bracket.min === 0) {
        tax = taxableInBracket * (bracket.rate / 100);
      } else if (annualTaxableIncome > bracket.min) {
        tax = bracket.base + (annualTaxableIncome - bracket.min) * (bracket.rate / 100);
      }
    }
  }

  return tax;
}

/**
 * Get applicable tax rebate based on age
 */
export function getTaxRebate(age: number): number {
  let rebate = TAX_REBATES_2024.primary;
  
  if (age >= 65) {
    rebate += TAX_REBATES_2024.secondary;
  }
  
  if (age >= 75) {
    rebate += TAX_REBATES_2024.tertiary;
  }
  
  return rebate;
}

/**
 * Calculate medical tax credits
 * Main member + first dependent: R364/month each
 * Additional dependents: R246/month each
 */
export function calculateMedicalCredits(members: number): number {
  if (members <= 0) return 0;
  
  const mainMemberCredit = 364;
  const firstDependentCredit = 364;
  const additionalDependentCredit = 246;
  
  let monthlyCredit = mainMemberCredit;
  
  if (members >= 2) {
    monthlyCredit += firstDependentCredit;
  }
  
  if (members > 2) {
    monthlyCredit += (members - 2) * additionalDependentCredit;
  }
  
  return monthlyCredit * 12; // Annual credits
}

/**
 * Calculate UIF (Unemployment Insurance Fund)
 */
export function calculateUIF(monthlyGross: number): { employee: number; employer: number } {
  const cappedEarnings = Math.min(monthlyGross, UIF_CEILING_MONTHLY);
  const uifAmount = cappedEarnings * UIF_RATE;
  
  return {
    employee: uifAmount,
    employer: uifAmount,
  };
}

/**
 * Calculate SDL (Skills Development Levy)
 */
export function calculateSDL(monthlyGross: number): number {
  return monthlyGross * SDL_RATE;
}

/**
 * Full tax calculation with all components
 */
export function calculateFullTax(input: TaxCalculationInput): TaxCalculationResult {
  const breakdown: { description: string; amount: number }[] = [];
  
  let taxableIncome = input.annualGrossIncome;
  breakdown.push({ description: 'Annual Gross Income', amount: input.annualGrossIncome });
  
  // Deduct retirement contributions (limited to 27.5% of income, max R350,000)
  if (input.retirementContributions && input.retirementContributions > 0) {
    const maxRetirementDeduction = Math.min(
      input.retirementContributions,
      input.annualGrossIncome * 0.275,
      350000
    );
    taxableIncome -= maxRetirementDeduction;
    breakdown.push({ description: 'Retirement Deduction', amount: -maxRetirementDeduction });
  }
  
  // Travel allowance (80% taxable if no logbook, or calculated portion)
  if (input.travelAllowance && input.travelAllowance > 0) {
    const taxableTravelAllowance = input.travelAllowance * 0.80;
    taxableIncome += taxableTravelAllowance;
    breakdown.push({ description: 'Taxable Travel Allowance (80%)', amount: taxableTravelAllowance });
  }
  
  breakdown.push({ description: 'Taxable Income', amount: taxableIncome });
  
  // Calculate base tax
  const baseTax = calculatePAYE(taxableIncome);
  breakdown.push({ description: 'Tax on Taxable Income', amount: baseTax });
  
  // Get tax rebate
  const rebate = getTaxRebate(input.employeeAge);
  breakdown.push({ description: 'Tax Rebate', amount: -rebate });
  
  // Get medical credits
  const medicalCredits = calculateMedicalCredits(input.medicalAidMembers || 0);
  breakdown.push({ description: 'Medical Tax Credits', amount: -medicalCredits });
  
  // Final tax calculation
  const annualTax = Math.max(0, baseTax - rebate - medicalCredits);
  const monthlyPAYE = annualTax / 12;
  
  // Calculate UIF
  const monthlyGross = input.annualGrossIncome / 12;
  const uif = calculateUIF(monthlyGross);
  
  // Calculate SDL
  const sdl = calculateSDL(monthlyGross);
  
  // Determine tax bracket
  let taxBracket = 18;
  for (const bracket of SARS_TAX_BRACKETS_2024) {
    if (taxableIncome > bracket.min) {
      taxBracket = bracket.rate;
    }
  }
  
  return {
    annualTax,
    monthlyPAYE,
    annualRebate: rebate,
    effectiveTaxRate: (annualTax / input.annualGrossIncome) * 100,
    taxBracket,
    uifEmployee: uif.employee,
    uifEmployer: uif.employer,
    sdlEmployer: sdl,
    medicalCredits,
    taxableIncome,
    breakdown,
  };
}

/**
 * Generate IRP5/IT3(a) data for an employee for the tax year
 */
export async function generateIRP5Data(employeeId: number, taxYear: number, tenantId: string) {
  const client = await pool.connect();
  
  try {
    // Get employee details
    const empResult = await client.query(`
      SELECT 
        e.*,
        EXTRACT(YEAR FROM AGE(e.date_of_birth)) as age
      FROM hr.employees e
      WHERE e.tenant_id = $1 AND e.employee_id = $2
    `, [tenantId, employeeId]);

    if (empResult.rows.length === 0) {
      throw new Error('Employee not found');
    }

    const employee = empResult.rows[0];

    // Get all payroll data for the tax year (March to February)
    const payrollData = await client.query(`
      SELECT 
        SUM(prd.gross_pay) as total_gross,
        SUM(prd.paye_tax) as total_paye,
        SUM(prd.uif_deduction) as total_uif,
        SUM(prd.net_pay) as total_net,
        COUNT(DISTINCT pr.run_id) as periods_paid
      FROM hr.payroll_run_details prd
      JOIN hr.payroll_runs pr ON prd.run_id = pr.run_id
      JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
      WHERE prd.tenant_id = $1 AND prd.employee_id = $2
        AND pr.status = 'Posted'
        AND (
          (EXTRACT(MONTH FROM pp.period_end_date) >= 3 AND EXTRACT(YEAR FROM pp.period_end_date) = $3)
          OR
          (EXTRACT(MONTH FROM pp.period_end_date) <= 2 AND EXTRACT(YEAR FROM pp.period_end_date) = $3 + 1)
        )
    `, [tenantId, employeeId, taxYear]);

    const totals = payrollData.rows[0];

    // IRP5 Source Codes
    const sourceCodes = [
      { code: '3601', description: 'Income from Employment', amount: parseFloat(totals.total_gross || 0) },
      { code: '4102', description: 'Medical Aid Contributions (Employer)', amount: 0 },
      { code: '4115', description: 'Retirement Annuity Contributions', amount: 0 },
      { code: '4001', description: 'PAYE Tax Deducted', amount: parseFloat(totals.total_paye || 0) },
      { code: '4141', description: 'UIF Contributions (Employee)', amount: parseFloat(totals.total_uif || 0) },
    ];

    return {
      certificate_number: `IRP5-${taxYear}-${employee.employee_number}`,
      tax_year: `${taxYear}/${taxYear + 1}`,
      employee: {
        employee_number: employee.employee_number,
        id_number: employee.id_number,
        tax_number: employee.tax_number,
        first_name: employee.first_name,
        last_name: employee.last_name,
        date_of_birth: employee.date_of_birth,
        physical_address: [
          employee.address_line1,
          employee.address_line2,
          employee.city,
          employee.province,
          employee.postal_code
        ].filter(Boolean).join(', '),
      },
      employer: {
        trading_name: 'WorldClass ERP Demo Company',
        paye_reference: '7000000000',
        sdl_reference: 'L000000000',
        uif_reference: 'U000000000',
        physical_address: '123 Business Park, Sandton, 2196',
      },
      employment: {
        start_date: employee.hire_date,
        end_date: employee.termination_date || null,
        periods_paid: parseInt(totals.periods_paid || 0),
        nature_of_person: 'A', // A = Employee (standard)
      },
      source_codes: sourceCodes,
      totals: {
        gross_remuneration: parseFloat(totals.total_gross || 0),
        total_paye: parseFloat(totals.total_paye || 0),
        total_uif: parseFloat(totals.total_uif || 0),
        nett_remuneration: parseFloat(totals.total_net || 0),
      },
      generated_at: new Date().toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Generate EMP501 reconciliation data
 */
export async function generateEMP501Data(taxYear: number, tenantId: string) {
  const client = await pool.connect();
  
  try {
    // Get all employees who were paid during the tax year
    const employeesData = await client.query(`
      SELECT 
        e.employee_id,
        e.employee_number,
        e.id_number,
        e.first_name,
        e.last_name,
        SUM(prd.gross_pay) as total_gross,
        SUM(prd.paye_tax) as total_paye,
        SUM(prd.uif_deduction) as total_uif
      FROM hr.employees e
      JOIN hr.payroll_run_details prd ON e.employee_id = prd.employee_id
      JOIN hr.payroll_runs pr ON prd.run_id = pr.run_id
      JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
      WHERE pr.tenant_id = $1 AND e.tenant_id = $1 AND pr.status = 'Posted'
        AND (
          (EXTRACT(MONTH FROM pp.period_end_date) >= 3 AND EXTRACT(YEAR FROM pp.period_end_date) = $2)
          OR
          (EXTRACT(MONTH FROM pp.period_end_date) <= 2 AND EXTRACT(YEAR FROM pp.period_end_date) = $2 + 1)
        )
      GROUP BY e.employee_id, e.employee_number, e.id_number, e.first_name, e.last_name
      ORDER BY e.employee_number
    `, [tenantId, taxYear]);

    // Calculate totals
    const totals = employeesData.rows.reduce((acc, emp) => ({
      total_gross: acc.total_gross + parseFloat(emp.total_gross || 0),
      total_paye: acc.total_paye + parseFloat(emp.total_paye || 0),
      total_uif_employee: acc.total_uif_employee + parseFloat(emp.total_uif || 0),
      total_uif_employer: acc.total_uif_employer + parseFloat(emp.total_uif || 0),
      employee_count: acc.employee_count + 1,
    }), {
      total_gross: 0,
      total_paye: 0,
      total_uif_employee: 0,
      total_uif_employer: 0,
      employee_count: 0,
    });

    // Calculate SDL
    totals.total_sdl = totals.total_gross * SDL_RATE;

    return {
      reconciliation_type: 'EMP501',
      tax_year: `${taxYear}/${taxYear + 1}`,
      submission_period: 'Annual',
      employer: {
        trading_name: 'WorldClass ERP Demo Company',
        paye_reference: '7000000000',
        sdl_reference: 'L000000000',
        uif_reference: 'U000000000',
      },
      summary: {
        total_employees: totals.employee_count,
        total_gross_remuneration: totals.total_gross,
        total_paye_deducted: totals.total_paye,
        total_uif_employee: totals.total_uif_employee,
        total_uif_employer: totals.total_uif_employer,
        total_sdl: totals.total_sdl,
      },
      employees: employeesData.rows.map(emp => ({
        employee_number: emp.employee_number,
        id_number: emp.id_number,
        name: `${emp.first_name} ${emp.last_name}`,
        gross_remuneration: parseFloat(emp.total_gross || 0),
        paye_deducted: parseFloat(emp.total_paye || 0),
        uif_contribution: parseFloat(emp.total_uif || 0),
      })),
      declaration: {
        certified_correct: false,
        signature_required: true,
        submission_deadline: `${taxYear + 1}-05-31`,
      },
      generated_at: new Date().toISOString(),
    };
  } finally {
    client.release();
  }
}

export default {
  calculatePAYE,
  getTaxRebate,
  calculateMedicalCredits,
  calculateUIF,
  calculateSDL,
  calculateFullTax,
  generateIRP5Data,
  generateEMP501Data,
  SARS_TAX_BRACKETS_2024,
  TAX_REBATES_2024,
  TAX_THRESHOLDS_2024,
};
