/**
 * Payslip Service
 * Generates professional payslips for employees
 */

import pool from '../../../config/database';

export interface PayslipData {
  employee: {
    employee_number: string;
    full_name: string;
    id_number: string;
    tax_number: string;
    department: string;
    position: string;
    bank_name: string;
    bank_account_number: string;
  };
  period: {
    period_name: string;
    start_date: string;
    end_date: string;
    payment_date: string;
  };
  earnings: Array<{
    description: string;
    amount: number;
  }>;
  deductions: Array<{
    description: string;
    amount: number;
  }>;
  totals: {
    gross_pay: number;
    total_deductions: number;
    net_pay: number;
  };
  ytd: {
    gross_pay: number;
    paye: number;
    uif: number;
    net_pay: number;
  };
  company: {
    name: string;
    registration_number: string;
    tax_number: string;
    address: string;
    uif_number: string;
    sdl_number: string;
  };
}

/**
 * Get payslip data for an employee and payroll run
 */
export async function getPayslipData(
  employeeId: number,
  runId: number,
  tenantId: string
): Promise<PayslipData | null> {
  const client = await pool.connect();

  try {
    // Get employee details
    const empResult = await client.query(`
      SELECT 
        e.employee_number,
        e.first_name || ' ' || e.last_name as full_name,
        e.id_number,
        e.tax_number,
        d.department_name,
        p.position_title,
        e.bank_name,
        e.bank_account_number
      FROM hr.employees e
      LEFT JOIN hr.departments d ON e.department_id = d.department_id
      LEFT JOIN hr.positions p ON e.position_id = p.position_id
      WHERE e.tenant_id = $1 AND e.employee_id = $2
    `, [tenantId, employeeId]);

    if (empResult.rows.length === 0) {
      return null;
    }

    // Get payroll run details
    const runResult = await client.query(`
      SELECT 
        prd.*,
        pp.period_name,
        pp.period_start_date as start_date,
        pp.period_end_date as end_date,
        pp.payment_date
      FROM hr.payroll_run_details prd
      JOIN hr.payroll_runs pr ON prd.run_id = pr.run_id
      JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
      WHERE prd.tenant_id = $1 AND prd.run_id = $2 AND prd.employee_id = $3
    `, [tenantId, runId, employeeId]);

    if (runResult.rows.length === 0) {
      return null;
    }

    const runDetails = runResult.rows[0];

    // Get earnings lines
    const earningsResult = await client.query(`
      SELECT 
        COALESCE(pc.component_name, prl.description, 'Basic Salary') as description,
        prl.amount
      FROM hr.payroll_run_lines prl
      LEFT JOIN hr.payroll_components pc ON prl.component_id = pc.component_id AND pc.tenant_id = $1
      WHERE prl.tenant_id = $1 AND prl.detail_id = $2 AND prl.line_type = 'Earning'
      ORDER BY prl.line_id
    `, [tenantId, runDetails.detail_id]);

    // Add basic salary as first earning
    const earnings = [
      { description: 'Basic Salary', amount: parseFloat(runDetails.basic_salary) },
      ...earningsResult.rows.map(r => ({
        description: r.description,
        amount: parseFloat(r.amount)
      }))
    ];

    // Get deductions lines
    const deductionsResult = await client.query(`
      SELECT 
        COALESCE(pc.component_name, prl.description, 'Deduction') as description,
        prl.amount
      FROM hr.payroll_run_lines prl
      LEFT JOIN hr.payroll_components pc ON prl.component_id = pc.component_id AND pc.tenant_id = $1
      WHERE prl.tenant_id = $1 AND prl.detail_id = $2 AND prl.line_type = 'Deduction'
      ORDER BY prl.line_id
    `, [tenantId, runDetails.detail_id]);

    const deductions = [
      { description: 'PAYE Income Tax', amount: parseFloat(runDetails.paye_tax) },
      { description: 'UIF', amount: parseFloat(runDetails.uif_deduction) },
      ...deductionsResult.rows.map(r => ({
        description: r.description,
        amount: parseFloat(r.amount)
      }))
    ];

    // Get YTD totals
    const ytdResult = await client.query(`
      SELECT 
        SUM(prd.gross_pay) as gross_pay,
        SUM(prd.paye_tax) as paye,
        SUM(prd.uif_deduction) as uif,
        SUM(prd.net_pay) as net_pay
      FROM hr.payroll_run_details prd
      JOIN hr.payroll_runs pr ON prd.run_id = pr.run_id
      JOIN hr.payroll_periods pp ON pr.period_id = pp.period_id
      WHERE prd.tenant_id = $1 AND prd.employee_id = $2
        AND EXTRACT(YEAR FROM pp.period_end_date) = EXTRACT(YEAR FROM $3::DATE)
        AND pp.period_end_date <= $3
    `, [tenantId, employeeId, runDetails.end_date]);

    // Get company details (from tenant settings)
    const company = {
      name: 'WorldClass ERP Demo Company',
      registration_number: '2024/123456/07',
      tax_number: '9123456789',
      address: '123 Business Park, Sandton, Johannesburg, 2196',
      uif_number: 'U123456789',
      sdl_number: 'L123456789'
    };

    return {
      employee: {
        employee_number: empResult.rows[0].employee_number,
        full_name: empResult.rows[0].full_name,
        id_number: empResult.rows[0].id_number,
        tax_number: empResult.rows[0].tax_number || 'Not provided',
        department: empResult.rows[0].department_name || 'Unassigned',
        position: empResult.rows[0].position_title || 'Unassigned',
        bank_name: empResult.rows[0].bank_name || 'Not provided',
        bank_account_number: empResult.rows[0].bank_account_number 
          ? '****' + empResult.rows[0].bank_account_number.slice(-4)
          : 'Not provided'
      },
      period: {
        period_name: runDetails.period_name,
        start_date: runDetails.start_date,
        end_date: runDetails.end_date,
        payment_date: runDetails.payment_date
      },
      earnings,
      deductions,
      totals: {
        gross_pay: parseFloat(runDetails.gross_pay),
        total_deductions: parseFloat(runDetails.total_deductions),
        net_pay: parseFloat(runDetails.net_pay)
      },
      ytd: {
        gross_pay: parseFloat(ytdResult.rows[0]?.gross_pay || 0),
        paye: parseFloat(ytdResult.rows[0]?.paye || 0),
        uif: parseFloat(ytdResult.rows[0]?.uif || 0),
        net_pay: parseFloat(ytdResult.rows[0]?.net_pay || 0)
      },
      company
    };
  } finally {
    client.release();
  }
}

/**
 * Generate HTML payslip
 */
export function generatePayslipHTML(data: PayslipData): string {
  const formatCurrency = (amount: number) => 
    `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${data.employee.full_name} - ${data.period.period_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }
    .payslip { max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
    .header { background: #1890ff; color: white; padding: 20px; display: flex; justify-content: space-between; }
    .header h1 { font-size: 24px; }
    .header .company-info { text-align: right; font-size: 11px; }
    .section { padding: 15px 20px; border-bottom: 1px solid #eee; }
    .section-title { font-weight: bold; color: #1890ff; margin-bottom: 10px; text-transform: uppercase; font-size: 11px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .info-row { display: flex; justify-content: space-between; }
    .info-label { color: #666; }
    .info-value { font-weight: 500; }
    .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .column { }
    .line-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #eee; }
    .totals { background: #f5f5f5; padding: 15px 20px; }
    .totals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; }
    .total-box { padding: 10px; background: white; border-radius: 4px; }
    .total-label { font-size: 10px; color: #666; text-transform: uppercase; }
    .total-value { font-size: 18px; font-weight: bold; color: #1890ff; }
    .net-pay .total-value { color: #52c41a; font-size: 24px; }
    .ytd { background: #fafafa; }
    .ytd-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .ytd-item { text-align: center; }
    .ytd-label { font-size: 10px; color: #666; }
    .ytd-value { font-weight: bold; }
    .footer { padding: 15px 20px; font-size: 10px; color: #666; text-align: center; background: #f9f9f9; }
    @media print {
      body { padding: 0; }
      .payslip { border: none; }
    }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <div>
        <h1>PAYSLIP</h1>
        <p>${data.period.period_name}</p>
      </div>
      <div class="company-info">
        <strong>${data.company.name}</strong><br>
        Reg: ${data.company.registration_number}<br>
        Tax: ${data.company.tax_number}<br>
        ${data.company.address}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Employee Information</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Employee Number:</span>
          <span class="info-value">${data.employee.employee_number}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department:</span>
          <span class="info-value">${data.employee.department}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${data.employee.full_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Position:</span>
          <span class="info-value">${data.employee.position}</span>
        </div>
        <div class="info-row">
          <span class="info-label">ID Number:</span>
          <span class="info-value">${data.employee.id_number}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tax Number:</span>
          <span class="info-value">${data.employee.tax_number}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Pay Period</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Period:</span>
          <span class="info-value">${formatDate(data.period.start_date)} - ${formatDate(data.period.end_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Date:</span>
          <span class="info-value">${formatDate(data.period.payment_date)}</span>
        </div>
      </div>
    </div>

    <div class="section earnings-deductions">
      <div class="column">
        <div class="section-title">Earnings</div>
        ${data.earnings.map(e => `
          <div class="line-item">
            <span>${e.description}</span>
            <span>${formatCurrency(e.amount)}</span>
          </div>
        `).join('')}
        <div class="line-item" style="font-weight: bold; border-top: 2px solid #1890ff; margin-top: 10px; padding-top: 10px;">
          <span>Total Earnings</span>
          <span>${formatCurrency(data.totals.gross_pay)}</span>
        </div>
      </div>

      <div class="column">
        <div class="section-title">Deductions</div>
        ${data.deductions.map(d => `
          <div class="line-item">
            <span>${d.description}</span>
            <span>${formatCurrency(d.amount)}</span>
          </div>
        `).join('')}
        <div class="line-item" style="font-weight: bold; border-top: 2px solid #ff4d4f; margin-top: 10px; padding-top: 10px;">
          <span>Total Deductions</span>
          <span>${formatCurrency(data.totals.total_deductions)}</span>
        </div>
      </div>
    </div>

    <div class="totals">
      <div class="totals-grid">
        <div class="total-box">
          <div class="total-label">Gross Pay</div>
          <div class="total-value">${formatCurrency(data.totals.gross_pay)}</div>
        </div>
        <div class="total-box">
          <div class="total-label">Total Deductions</div>
          <div class="total-value" style="color: #ff4d4f;">${formatCurrency(data.totals.total_deductions)}</div>
        </div>
        <div class="total-box net-pay">
          <div class="total-label">Net Pay</div>
          <div class="total-value">${formatCurrency(data.totals.net_pay)}</div>
        </div>
      </div>
    </div>

    <div class="section ytd">
      <div class="section-title">Year-to-Date Totals</div>
      <div class="ytd-grid">
        <div class="ytd-item">
          <div class="ytd-label">Gross Pay</div>
          <div class="ytd-value">${formatCurrency(data.ytd.gross_pay)}</div>
        </div>
        <div class="ytd-item">
          <div class="ytd-label">PAYE Tax</div>
          <div class="ytd-value">${formatCurrency(data.ytd.paye)}</div>
        </div>
        <div class="ytd-item">
          <div class="ytd-label">UIF</div>
          <div class="ytd-value">${formatCurrency(data.ytd.uif)}</div>
        </div>
        <div class="ytd-item">
          <div class="ytd-label">Net Pay</div>
          <div class="ytd-value">${formatCurrency(data.ytd.net_pay)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">Bank:</span>
          <span class="info-value">${data.employee.bank_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Account:</span>
          <span class="info-value">${data.employee.bank_account_number}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated document. No signature required.<br>
      Generated on ${new Date().toLocaleString('en-ZA')}<br>
      UIF Number: ${data.company.uif_number} | SDL Number: ${data.company.sdl_number}
    </div>
  </div>
</body>
</html>
  `;
}

export default {
  getPayslipData,
  generatePayslipHTML
};
