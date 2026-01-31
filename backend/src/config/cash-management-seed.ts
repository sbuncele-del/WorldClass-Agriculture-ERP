/**
 * Cash Management Module - Seed Data
 * 
 * Seeds the database with:
 * - South African banks
 * - Sample bank accounts (for testing)
 * - Sample reconciliation rules
 */

import pool from './database';

export async function seedCashManagement() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting Cash Management seed...');
    
    await client.query('BEGIN');

    // ============================================================
    // SEED: South African Banks
    // ============================================================
    console.log('  🏦 Seeding South African banks...');
    
    const banks = [
      {
        code: 'ABSA',
        name: 'Absa Bank Limited',
        short_name: 'Absa',
        branch_code: '632005',
        swift_code: 'ABSAZAJJ',
        logo_url: '/assets/banks/absa.png',
        website: 'https://www.absa.co.za',
        phone: '0860 000 111',
        format: 'CSV'
      },
      {
        code: 'FNB',
        name: 'First National Bank',
        short_name: 'FNB',
        branch_code: '250655',
        swift_code: 'FIRNZAJJ',
        logo_url: '/assets/banks/fnb.png',
        website: 'https://www.fnb.co.za',
        phone: '087 575 9404',
        format: 'CSV'
      },
      {
        code: 'NEDBANK',
        name: 'Nedbank Limited',
        short_name: 'Nedbank',
        branch_code: '198765',
        swift_code: 'NEDSZAJJ',
        logo_url: '/assets/banks/nedbank.png',
        website: 'https://www.nedbank.co.za',
        phone: '0860 555 111',
        format: 'CSV'
      },
      {
        code: 'STDBANK',
        name: 'Standard Bank of South Africa',
        short_name: 'Standard Bank',
        branch_code: '051001',
        swift_code: 'SBZAZAJJ',
        logo_url: '/assets/banks/standardbank.png',
        website: 'https://www.standardbank.co.za',
        phone: '0860 123 000',
        format: 'CSV'
      },
      {
        code: 'CAPITEC',
        name: 'Capitec Bank Limited',
        short_name: 'Capitec',
        branch_code: '470010',
        swift_code: 'CABLZAJJ',
        logo_url: '/assets/banks/capitec.png',
        website: 'https://www.capitecbank.co.za',
        phone: '0860 102 043',
        format: 'CSV'
      },
      {
        code: 'INVESTEC',
        name: 'Investec Bank Limited',
        short_name: 'Investec',
        branch_code: '580105',
        swift_code: 'IVESZAJJ',
        logo_url: '/assets/banks/investec.png',
        website: 'https://www.investec.com/en_za',
        phone: '0860 500 100',
        format: 'CSV'
      },
      {
        code: 'DISCOVERY',
        name: 'Discovery Bank',
        short_name: 'Discovery',
        branch_code: '679000',
        swift_code: 'DISCZAJJ',
        logo_url: '/assets/banks/discovery.png',
        website: 'https://www.discovery.co.za/bank',
        phone: '0800 07 06 05',
        format: 'CSV'
      },
      {
        code: 'TYME',
        name: 'TymeBank',
        short_name: 'TymeBank',
        branch_code: '678910',
        swift_code: 'TYMEZAJJ',
        logo_url: '/assets/banks/tymebank.png',
        website: 'https://www.tymebank.co.za',
        phone: '0860 999 119',
        format: 'CSV'
      },
      {
        code: 'BIDVEST',
        name: 'Bidvest Bank Limited',
        short_name: 'Bidvest Bank',
        branch_code: '462005',
        swift_code: 'BIDVZAJJ',
        logo_url: '/assets/banks/bidvest.png',
        website: 'https://www.bidvestbank.co.za',
        phone: '011 286 9000',
        format: 'CSV'
      },
      {
        code: 'AFRICAN',
        name: 'African Bank Limited',
        short_name: 'African Bank',
        branch_code: '430000',
        swift_code: 'AFRCZAJJ',
        logo_url: '/assets/banks/africanbank.png',
        website: 'https://www.africanbank.co.za',
        phone: '0860 000 222',
        format: 'CSV'
      }
    ];

    for (const bank of banks) {
      await client.query(`
        INSERT INTO banks (
          bank_code, bank_name, short_name, branch_code, swift_code,
          logo_url, website_url, support_phone, statement_format, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (bank_code) DO NOTHING
      `, [
        bank.code, bank.name, bank.short_name, bank.branch_code, bank.swift_code,
        bank.logo_url, bank.website, bank.phone, bank.format, true
      ]);
    }

    console.log(`   ✅ Seeded ${banks.length} South African banks`);

    // ============================================================
    // SEED: Sample Reconciliation Rules
    // ============================================================
    console.log('  🎯 Seeding default reconciliation rules...');
    
    const rules = [
      {
        name: 'Exact Amount Match',
        description: 'Matches transactions with exact amount within ±1 cent',
        rule_type: 'EXACT_AMOUNT',
        priority: 90,
        match_field: 'amount',
        match_operator: 'equals',
        amount_tolerance: 0.01,
        date_offset_days: 3,
        action_type: 'AUTO_MATCH',
        confidence_score: 95.00
      },
      {
        name: 'Reference Number Match',
        description: 'Matches by bank reference or transaction reference',
        rule_type: 'REFERENCE_MATCH',
        priority: 85,
        match_field: 'reference',
        match_operator: 'equals',
        amount_tolerance: 0.01,
        date_offset_days: 5,
        action_type: 'AUTO_MATCH',
        confidence_score: 90.00
      },
      {
        name: 'Payee/Payer Name Match',
        description: 'Matches by payee or payer name (fuzzy matching)',
        rule_type: 'PAYEE_MATCH',
        priority: 70,
        match_field: 'payee',
        match_operator: 'contains',
        amount_tolerance: 0.01,
        date_offset_days: 7,
        action_type: 'SUGGEST_MATCH',
        confidence_score: 75.00
      },
      {
        name: 'Description Keyword - Salary',
        description: 'Auto-create journal for salary payments',
        rule_type: 'KEYWORD',
        priority: 60,
        match_field: 'description',
        match_operator: 'contains',
        match_value: 'SALARY|PAYROLL|WAGES',
        transaction_type_filter: 'DEBIT',
        action_type: 'CREATE_JOURNAL',
        auto_create_journal: true,
        default_account_code: '6200',
        confidence_score: 85.00
      },
      {
        name: 'Description Keyword - Bank Fees',
        description: 'Auto-create journal for bank fees',
        rule_type: 'KEYWORD',
        priority: 65,
        match_field: 'description',
        match_operator: 'contains',
        match_value: 'BANK CHARGES|SERVICE FEE|ACCOUNT FEE|MONTHLY FEE',
        transaction_type_filter: 'DEBIT',
        action_type: 'CREATE_JOURNAL',
        auto_create_journal: true,
        default_account_code: '6350',
        confidence_score: 90.00
      },
      {
        name: 'Interest Received',
        description: 'Auto-create journal for interest income',
        rule_type: 'KEYWORD',
        priority: 65,
        match_field: 'description',
        match_operator: 'contains',
        match_value: 'INTEREST RECEIVED|INTEREST CREDIT|INT CREDIT',
        transaction_type_filter: 'CREDIT',
        action_type: 'CREATE_JOURNAL',
        auto_create_journal: true,
        default_account_code: '5200',
        confidence_score: 95.00
      },
      {
        name: 'Large Transactions - Manual Review',
        description: 'Flag large transactions (>R100,000) for manual review',
        rule_type: 'COMBINED',
        priority: 95,
        min_amount: 100000.00,
        action_type: 'FLAG_REVIEW',
        confidence_score: 100.00
      }
    ];

    for (const rule of rules) {
      await client.query(`
        INSERT INTO bank_reconciliation_rules (
          rule_name, description, rule_type, priority,
          match_field, match_operator, match_value,
          amount_tolerance, date_offset_days, transaction_type_filter,
          action_type, auto_create_journal, default_account_code,
          confidence_score, is_active, apply_to_all_accounts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        rule.name, rule.description, rule.rule_type, rule.priority,
        rule.match_field || null, rule.match_operator || null, rule.match_value || null,
        rule.amount_tolerance || 0.01, rule.date_offset_days || 0, rule.transaction_type_filter || null,
        rule.action_type, rule.auto_create_journal || false, rule.default_account_code || null,
        rule.confidence_score, true, true
      ]);
    }

    console.log(`   ✅ Seeded ${rules.length} default reconciliation rules`);

    await client.query('COMMIT');
    
    console.log('✅ Cash Management seed complete!');
    console.log(`   🏦 ${banks.length} banks`);
    console.log(`   🎯 ${rules.length} reconciliation rules`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cash Management seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedCashManagement()
    .then(() => {
      console.log('🎉 Seed successful!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error);
      process.exit(1);
    });
}
