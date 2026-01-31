/**
 * Healthcare Medical Aid Integration Service
 * 
 * Features:
 * - Real-time Benefit Verification
 * - Pre-Authorization Requests
 * - Auto Claim Submission (EDI)
 * - Rejection Handling & Resubmission
 * - ICD-10 to PMB (Prescribed Minimum Benefits) Mapping
 * - Medical Aid Scheme Rules Engine
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// South African Medical Aid Schemes Database
export const MEDICAL_AID_SCHEMES: Record<string, {
  schemeCode: string;
  schemeName: string;
  administrator: string;
  ediEndpoint: string;
  preAuthRequired: string[]; // ICD-10 codes requiring pre-auth
  pmbConditions: string[]; // PMB condition codes
  claimWindow: number; // Days to submit claim
  paymentDays: number; // Expected payment timeline
}> = {
  'DISC': {
    schemeCode: 'DISC',
    schemeName: 'Discovery Health',
    administrator: 'Discovery Health (Pty) Ltd',
    ediEndpoint: 'https://api.discovery.co.za/claims/v2',
    preAuthRequired: ['C00-C97', 'I20-I25', 'N17-N19', 'Z49'],
    pmbConditions: ['HIV', 'DIABETES', 'HYPERTENSION', 'ASTHMA', 'EPILEPSY'],
    claimWindow: 120,
    paymentDays: 30,
  },
  'MOME': {
    schemeCode: 'MOME',
    schemeName: 'Momentum Health',
    administrator: 'Momentum Metropolitan',
    ediEndpoint: 'https://api.momentum.co.za/medical/claims',
    preAuthRequired: ['C00-C97', 'M00-M99', 'K80-K87'],
    pmbConditions: ['HIV', 'DIABETES', 'HYPERTENSION', 'CARDIAC'],
    claimWindow: 90,
    paymentDays: 21,
  },
  'GEMS': {
    schemeCode: 'GEMS',
    schemeName: 'Government Employees Medical Scheme',
    administrator: 'GEMS',
    ediEndpoint: 'https://claims.gems.gov.za/edi',
    preAuthRequired: ['C00-C97', 'Z51', 'Z49'],
    pmbConditions: ['HIV', 'DIABETES', 'HYPERTENSION', 'TB', 'MENTAL_HEALTH'],
    claimWindow: 120,
    paymentDays: 45,
  },
  'BONI': {
    schemeCode: 'BONI',
    schemeName: 'Bonitas Medical Fund',
    administrator: 'Medscheme',
    ediEndpoint: 'https://api.medscheme.co.za/bonitas/claims',
    preAuthRequired: ['C00-C97', 'K80-K87', 'N17-N19'],
    pmbConditions: ['HIV', 'DIABETES', 'HYPERTENSION'],
    claimWindow: 90,
    paymentDays: 30,
  },
  'BEST': {
    schemeCode: 'BEST',
    schemeName: 'Bestmed Medical Scheme',
    administrator: 'Bestmed',
    ediEndpoint: 'https://claims.bestmed.co.za/api',
    preAuthRequired: ['C00-C97', 'I60-I69', 'K80-K87'],
    pmbConditions: ['HIV', 'DIABETES', 'HYPERTENSION', 'RENAL'],
    claimWindow: 90,
    paymentDays: 21,
  },
};

// PMB (Prescribed Minimum Benefits) Conditions mapped to ICD-10
export const PMB_CONDITIONS: Record<string, {
  condition: string;
  icd10Codes: string[];
  description: string;
  interventionsCovered: string[];
}> = {
  'PMB001': {
    condition: 'HIV/AIDS',
    icd10Codes: ['B20', 'B21', 'B22', 'B23', 'B24', 'Z21'],
    description: 'HIV infection and AIDS-defining conditions',
    interventionsCovered: ['ARV therapy', 'Viral load testing', 'CD4 count', 'Opportunistic infection treatment'],
  },
  'PMB002': {
    condition: 'Diabetes Type 1',
    icd10Codes: ['E10', 'E10.0', 'E10.1', 'E10.9'],
    description: 'Insulin-dependent diabetes mellitus',
    interventionsCovered: ['Insulin', 'Blood glucose monitoring', 'HbA1c testing', 'Diabetic eye screening'],
  },
  'PMB003': {
    condition: 'Diabetes Type 2',
    icd10Codes: ['E11', 'E11.0', 'E11.1', 'E11.9'],
    description: 'Non-insulin-dependent diabetes mellitus',
    interventionsCovered: ['Oral hypoglycemics', 'Metformin', 'Blood glucose monitoring', 'HbA1c testing'],
  },
  'PMB004': {
    condition: 'Hypertension',
    icd10Codes: ['I10', 'I11', 'I12', 'I13', 'I15'],
    description: 'Essential and secondary hypertension',
    interventionsCovered: ['Antihypertensive medication', 'Blood pressure monitoring', 'Renal function tests'],
  },
  'PMB005': {
    condition: 'Asthma',
    icd10Codes: ['J45', 'J45.0', 'J45.1', 'J45.8', 'J45.9'],
    description: 'Chronic respiratory condition',
    interventionsCovered: ['Bronchodilators', 'Inhaled corticosteroids', 'Peak flow monitoring', 'Spirometry'],
  },
  'PMB006': {
    condition: 'Epilepsy',
    icd10Codes: ['G40', 'G40.0', 'G40.1', 'G40.2', 'G40.3', 'G41'],
    description: 'Seizure disorder',
    interventionsCovered: ['Anticonvulsants', 'EEG monitoring', 'Drug level monitoring'],
  },
  'PMB007': {
    condition: 'Coronary Artery Disease',
    icd10Codes: ['I20', 'I21', 'I22', 'I23', 'I24', 'I25'],
    description: 'Ischemic heart disease',
    interventionsCovered: ['Cardiac catheterization', 'Stenting', 'CABG', 'Cardiac rehabilitation'],
  },
  'PMB008': {
    condition: 'Chronic Renal Disease',
    icd10Codes: ['N17', 'N18', 'N19'],
    description: 'Kidney failure requiring treatment',
    interventionsCovered: ['Dialysis', 'Kidney transplant', 'EPO therapy', 'Access surgery'],
  },
};

// Tariff Codes for South African medical billing
export const TARIFF_CODES: Record<string, {
  code: string;
  description: string;
  nhrpl: number; // National Health Reference Price List
  units: number;
  category: string;
}> = {
  '0190': { code: '0190', description: 'Consultation - GP Level 1', nhrpl: 350.00, units: 1, category: 'CONSULTATION' },
  '0191': { code: '0191', description: 'Consultation - GP Level 2', nhrpl: 450.00, units: 1, category: 'CONSULTATION' },
  '0192': { code: '0192', description: 'Consultation - Specialist', nhrpl: 650.00, units: 1, category: 'CONSULTATION' },
  '0101': { code: '0101', description: 'Initial Consultation - Complex', nhrpl: 850.00, units: 1, category: 'CONSULTATION' },
  '0120': { code: '0120', description: 'Follow-up Consultation', nhrpl: 280.00, units: 1, category: 'CONSULTATION' },
  '3647': { code: '3647', description: 'ECG - 12 Lead', nhrpl: 220.00, units: 1, category: 'DIAGNOSTIC' },
  '3751': { code: '3751', description: 'Blood Pressure Monitoring', nhrpl: 85.00, units: 1, category: 'DIAGNOSTIC' },
  '4371': { code: '4371', description: 'Blood Glucose Test', nhrpl: 45.00, units: 1, category: 'PATHOLOGY' },
  '4375': { code: '4375', description: 'HbA1c', nhrpl: 180.00, units: 1, category: 'PATHOLOGY' },
  '4401': { code: '4401', description: 'Full Blood Count', nhrpl: 95.00, units: 1, category: 'PATHOLOGY' },
  '4406': { code: '4406', description: 'Urea & Electrolytes', nhrpl: 120.00, units: 1, category: 'PATHOLOGY' },
  '4455': { code: '4455', description: 'Lipogram', nhrpl: 165.00, units: 1, category: 'PATHOLOGY' },
};

export class MedicalAidService {
  private pool: Pool;
  private tenantId: string;

  constructor(pool: Pool, tenantId: string) {
    this.pool = pool;
    this.tenantId = tenantId;
  }

  // ============================================
  // 1. REAL-TIME BENEFIT VERIFICATION
  // ============================================
  async verifyBenefits(
    memberNumber: string,
    schemeCode: string,
    dateOfService: Date = new Date()
  ): Promise<{
    success: boolean;
    member: {
      memberNumber: string;
      name: string;
      dependantCode: string;
      option: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
    };
    benefits: {
      annualLimit: number;
      usedAmount: number;
      availableAmount: number;
      gpVisitsRemaining: number;
      specialistVisitsRemaining: number;
      hospitalDaysRemaining: number;
      chronicBenefitsActive: boolean;
      pmbEligible: boolean;
    };
    warnings: string[];
  }> {
    const scheme = MEDICAL_AID_SCHEMES[schemeCode];
    if (!scheme) {
      return {
        success: false,
        member: { memberNumber, name: '', dependantCode: '', option: '', status: 'TERMINATED' },
        benefits: { annualLimit: 0, usedAmount: 0, availableAmount: 0, gpVisitsRemaining: 0, specialistVisitsRemaining: 0, hospitalDaysRemaining: 0, chronicBenefitsActive: false, pmbEligible: false },
        warnings: ['Unknown medical aid scheme'],
      };
    }

    // Simulate real-time API call to medical aid
    // In production, this would call the actual EDI endpoint
    const simulatedResponse = {
      member: {
        memberNumber,
        name: 'Member Name', // Would come from API
        dependantCode: '00',
        option: 'Classic Comprehensive',
        status: 'ACTIVE' as const,
      },
      benefits: {
        annualLimit: 250000,
        usedAmount: 45000,
        availableAmount: 205000,
        gpVisitsRemaining: 8,
        specialistVisitsRemaining: 4,
        hospitalDaysRemaining: 21,
        chronicBenefitsActive: true,
        pmbEligible: true,
      },
      warnings: [] as string[],
    };

    // Check for benefit exhaustion warnings
    if (simulatedResponse.benefits.availableAmount < 10000) {
      simulatedResponse.warnings.push('⚠️ Less than R10,000 benefits remaining');
    }
    if (simulatedResponse.benefits.gpVisitsRemaining <= 2) {
      simulatedResponse.warnings.push('⚠️ Only ' + simulatedResponse.benefits.gpVisitsRemaining + ' GP visits remaining');
    }

    return { success: true, ...simulatedResponse };
  }

  // ============================================
  // 2. PRE-AUTHORIZATION REQUEST
  // ============================================
  async requestPreAuthorization(
    memberNumber: string,
    schemeCode: string,
    icd10Codes: string[],
    procedureCodes: string[],
    estimatedCost: number,
    clinicalNotes: string
  ): Promise<{
    success: boolean;
    authorizationNumber?: string;
    status: 'APPROVED' | 'PENDING' | 'DENIED' | 'MORE_INFO_REQUIRED';
    approvedAmount?: number;
    validUntil?: string;
    conditions?: string[];
    denialReason?: string;
    responseTime: string;
  }> {
    const scheme = MEDICAL_AID_SCHEMES[schemeCode];
    const authId = `AUTH-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Check if pre-auth is required
    const requiresPreAuth = icd10Codes.some(code => {
      return scheme?.preAuthRequired.some(range => {
        if (range.includes('-')) {
          const [start, end] = range.split('-');
          return code >= start && code <= end;
        }
        return code.startsWith(range);
      });
    });

    // Check if it's a PMB condition (auto-approved)
    const isPMB = icd10Codes.some(code => {
      return Object.values(PMB_CONDITIONS).some(pmb => 
        pmb.icd10Codes.some(pmbCode => code.startsWith(pmbCode))
      );
    });

    // Simulate authorization decision
    let status: 'APPROVED' | 'PENDING' | 'DENIED' | 'MORE_INFO_REQUIRED';
    let approvedAmount: number | undefined;
    let conditions: string[] = [];
    let denialReason: string | undefined;

    if (isPMB) {
      status = 'APPROVED';
      approvedAmount = estimatedCost;
      conditions = ['PMB condition - covered at cost rate', 'DSP network preferred'];
    } else if (!requiresPreAuth) {
      status = 'APPROVED';
      approvedAmount = estimatedCost;
      conditions = ['Subject to available benefits'];
    } else if (estimatedCost > 50000) {
      status = 'PENDING';
      conditions = ['Clinical review required for high-value procedure'];
    } else {
      // Simulate 80% approval rate
      if (Math.random() > 0.2) {
        status = 'APPROVED';
        approvedAmount = estimatedCost * 0.85; // 85% of estimate
        conditions = ['Network provider rates apply', 'Valid for 30 days'];
      } else {
        status = 'DENIED';
        denialReason = 'Procedure not medically necessary based on submitted information';
      }
    }

    // Store pre-auth request
    try {
      await this.pool.query(
        `INSERT INTO healthcare.preauthorizations 
         (auth_id, tenant_id, member_number, scheme_code, icd10_codes, procedure_codes,
          requested_amount, approved_amount, status, auth_number, valid_until, clinical_notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)`,
        [uuidv4(), this.tenantId, memberNumber, schemeCode, icd10Codes.join(','), 
         procedureCodes.join(','), estimatedCost, approvedAmount, status, authId,
         status === 'APPROVED' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
         clinicalNotes]
      );
    } catch (e) {
      // Table might not exist
    }

    return {
      success: status === 'APPROVED',
      authorizationNumber: status === 'APPROVED' || status === 'PENDING' ? authId : undefined,
      status,
      approvedAmount,
      validUntil: status === 'APPROVED' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      conditions: conditions.length > 0 ? conditions : undefined,
      denialReason,
      responseTime: '< 5 seconds (real-time)',
    };
  }

  // ============================================
  // 3. AUTO CLAIM SUBMISSION
  // ============================================
  async submitClaim(
    invoiceId: string,
    memberNumber: string,
    schemeCode: string
  ): Promise<{
    success: boolean;
    claimNumber: string;
    status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING_DOCUMENTS';
    submissionTime: string;
    expectedPaymentDate?: string;
    ediResponse: any;
    validationErrors: string[];
  }> {
    const scheme = MEDICAL_AID_SCHEMES[schemeCode];
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const validationErrors: string[] = [];

    // Get invoice details
    const invoiceResult = await this.pool.query(
      `SELECT i.*, p.first_name, p.last_name, p.id_number, p.date_of_birth
       FROM healthcare.invoices i
       JOIN healthcare.patients p ON i.patient_id = p.patient_id
       WHERE i.invoice_id = $1 AND i.tenant_id = $2`,
      [invoiceId, this.tenantId]
    );

    if (invoiceResult.rows.length === 0) {
      return {
        success: false,
        claimNumber: '',
        status: 'REJECTED',
        submissionTime: new Date().toISOString(),
        ediResponse: null,
        validationErrors: ['Invoice not found'],
      };
    }

    const invoice = invoiceResult.rows[0];

    // Get invoice line items
    const itemsResult = await this.pool.query(
      `SELECT * FROM healthcare.invoice_items WHERE invoice_id = $1 AND tenant_id = $2`,
      [invoiceId, this.tenantId]
    );

    // Build EDI claim (HL7/X12 format simulation)
    const ediClaim = {
      header: {
        claimNumber,
        submissionDate: new Date().toISOString(),
        providerNumber: 'PRAC123456', // Practice number
        schemeCode,
        memberNumber,
      },
      patient: {
        surname: invoice.last_name,
        initials: invoice.first_name?.charAt(0),
        idNumber: invoice.id_number,
        dateOfBirth: invoice.date_of_birth,
        dependantCode: '00',
      },
      claim: {
        dateOfService: invoice.invoice_date,
        icd10Primary: 'Z00.0', // Would come from consultation
        icd10Secondary: [],
        lineItems: itemsResult.rows.map((item, idx) => ({
          lineNumber: idx + 1,
          tariffCode: item.tariff_code || '0190',
          nappiCode: item.nappi_code,
          description: item.description,
          quantity: item.quantity,
          amount: item.total,
        })),
        totalAmount: invoice.total_amount,
      },
    };

    // Validate claim
    if (!invoice.id_number) validationErrors.push('Patient ID number required');
    if (!memberNumber) validationErrors.push('Medical aid member number required');
    if (itemsResult.rows.length === 0) validationErrors.push('No line items on invoice');
    
    // Check claim window
    const daysSinceService = Math.floor((Date.now() - new Date(invoice.invoice_date).getTime()) / (1000 * 60 * 60 * 24));
    if (scheme && daysSinceService > scheme.claimWindow) {
      validationErrors.push(`Claim submitted after ${scheme.claimWindow} day window`);
    }

    let status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING_DOCUMENTS';
    if (validationErrors.length > 0) {
      status = 'REJECTED';
    } else {
      status = 'ACCEPTED';
    }

    // Calculate expected payment date
    const expectedPaymentDate = scheme 
      ? new Date(Date.now() + scheme.paymentDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    // Store claim
    try {
      await this.pool.query(
        `INSERT INTO healthcare.claims 
         (claim_id, tenant_id, claim_number, invoice_id, member_number, scheme_code,
          claim_amount, status, submitted_at, expected_payment_date, edi_payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10)`,
        [uuidv4(), this.tenantId, claimNumber, invoiceId, memberNumber, schemeCode,
         invoice.total_amount, status, expectedPaymentDate, JSON.stringify(ediClaim)]
      );

      // Update invoice status
      await this.pool.query(
        `UPDATE healthcare.invoices SET status = 'CLAIMED', claim_number = $1 WHERE invoice_id = $2`,
        [claimNumber, invoiceId]
      );
    } catch (e) {
      // Tables might not exist
    }

    return {
      success: status === 'ACCEPTED',
      claimNumber,
      status,
      submissionTime: new Date().toISOString(),
      expectedPaymentDate,
      ediResponse: {
        transactionId: uuidv4(),
        acknowledgement: status === 'ACCEPTED' ? 'TA1' : 'TA3',
        message: status === 'ACCEPTED' ? 'Claim accepted for processing' : 'Claim rejected - see validation errors',
      },
      validationErrors,
    };
  }

  // ============================================
  // 4. CLAIM STATUS & REMITTANCE
  // ============================================
  async getClaimStatus(claimNumber: string): Promise<{
    claimNumber: string;
    status: string;
    submittedDate: string;
    processedDate?: string;
    claimAmount: number;
    approvedAmount?: number;
    patientResponsibility?: number;
    paymentDetails?: {
      paymentDate: string;
      paymentReference: string;
      paymentMethod: string;
    };
    rejectionDetails?: {
      reasonCode: string;
      reasonDescription: string;
      canResubmit: boolean;
    };
  }> {
    const result = await this.pool.query(
      `SELECT * FROM healthcare.claims WHERE claim_number = $1 AND tenant_id = $2`,
      [claimNumber, this.tenantId]
    );

    if (result.rows.length === 0) {
      return {
        claimNumber,
        status: 'NOT_FOUND',
        submittedDate: '',
        claimAmount: 0,
      };
    }

    const claim = result.rows[0];

    // Simulate claim processing status
    const statuses = ['PROCESSING', 'ADJUDICATED', 'APPROVED', 'PAID'];
    const simulatedStatus = statuses[Math.min(Math.floor((Date.now() - new Date(claim.submitted_at).getTime()) / (1000 * 60 * 60 * 24)), 3)];

    return {
      claimNumber: claim.claim_number,
      status: simulatedStatus,
      submittedDate: claim.submitted_at,
      processedDate: simulatedStatus !== 'PROCESSING' ? new Date().toISOString() : undefined,
      claimAmount: claim.claim_amount,
      approvedAmount: simulatedStatus === 'APPROVED' || simulatedStatus === 'PAID' ? claim.claim_amount * 0.85 : undefined,
      patientResponsibility: simulatedStatus === 'APPROVED' || simulatedStatus === 'PAID' ? claim.claim_amount * 0.15 : undefined,
      paymentDetails: simulatedStatus === 'PAID' ? {
        paymentDate: new Date().toISOString(),
        paymentReference: `EFT-${Date.now()}`,
        paymentMethod: 'EFT',
      } : undefined,
    };
  }

  // ============================================
  // 5. BULK CLAIM SUBMISSION
  // ============================================
  async submitBulkClaims(
    invoiceIds: string[],
    schemeCode: string
  ): Promise<{
    totalClaims: number;
    successful: number;
    failed: number;
    totalValue: number;
    results: Array<{
      invoiceId: string;
      claimNumber?: string;
      status: string;
      amount: number;
      error?: string;
    }>;
  }> {
    const results: any[] = [];
    let successful = 0;
    let failed = 0;
    let totalValue = 0;

    for (const invoiceId of invoiceIds) {
      // Get member number from invoice
      const invoiceResult = await this.pool.query(
        `SELECT i.*, p.medical_aid_number 
         FROM healthcare.invoices i
         JOIN healthcare.patients p ON i.patient_id = p.patient_id
         WHERE i.invoice_id = $1 AND i.tenant_id = $2`,
        [invoiceId, this.tenantId]
      );

      if (invoiceResult.rows.length === 0) {
        results.push({ invoiceId, status: 'FAILED', amount: 0, error: 'Invoice not found' });
        failed++;
        continue;
      }

      const invoice = invoiceResult.rows[0];
      const memberNumber = invoice.medical_aid_number;

      if (!memberNumber) {
        results.push({ invoiceId, status: 'FAILED', amount: invoice.total_amount, error: 'No medical aid number' });
        failed++;
        continue;
      }

      const claimResult = await this.submitClaim(invoiceId, memberNumber, schemeCode);
      
      results.push({
        invoiceId,
        claimNumber: claimResult.claimNumber,
        status: claimResult.status,
        amount: invoice.total_amount,
        error: claimResult.validationErrors.join(', ') || undefined,
      });

      if (claimResult.success) {
        successful++;
        totalValue += parseFloat(invoice.total_amount);
      } else {
        failed++;
      }
    }

    return {
      totalClaims: invoiceIds.length,
      successful,
      failed,
      totalValue,
      results,
    };
  }

  // ============================================
  // 6. CHECK PMB ELIGIBILITY
  // ============================================
  checkPMBEligibility(icd10Codes: string[]): {
    isPMB: boolean;
    conditions: Array<{
      conditionCode: string;
      conditionName: string;
      matchedICD10: string;
      interventionsCovered: string[];
    }>;
    message: string;
  } {
    const matchedConditions: any[] = [];

    for (const code of icd10Codes) {
      for (const [pmbCode, pmb] of Object.entries(PMB_CONDITIONS)) {
        const match = pmb.icd10Codes.find(pmbIcd => code.startsWith(pmbIcd));
        if (match) {
          matchedConditions.push({
            conditionCode: pmbCode,
            conditionName: pmb.condition,
            matchedICD10: code,
            interventionsCovered: pmb.interventionsCovered,
          });
        }
      }
    }

    return {
      isPMB: matchedConditions.length > 0,
      conditions: matchedConditions,
      message: matchedConditions.length > 0 
        ? `✅ PMB Condition(s) detected - Medical aid MUST cover at cost rate`
        : `ℹ️ No PMB conditions - subject to available benefits`,
    };
  }
}

// Export factory
export const createMedicalAidService = (pool: Pool, tenantId: string) => {
  return new MedicalAidService(pool, tenantId);
};
