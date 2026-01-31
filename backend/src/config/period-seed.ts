/**
 * Period Management Seed Data
 * Creates a default fiscal year (2025) with 12 monthly periods
 */

import { query } from './database';

async function seedPeriodData() {
  console.log('🌱 Seeding period management data...');

  try {
    console.log('✅ Database connected');

    // Check if we already have fiscal years
    const checkQuery = 'SELECT COUNT(*) as count FROM fiscal_years';
    const checkResult = await query(checkQuery);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      console.log('⚠️  Fiscal years already exist. Skipping seed.');
      return;
    }

    console.log('📅 Creating fiscal year 2025...');

    // Create fiscal year 2025 (March to February - South African tax year)
    const fiscalYearQuery = `
      INSERT INTO fiscal_years (
        year_code, year_name, start_date, end_date, status, is_current, 
        number_of_periods, period_type, description, created_by
      ) VALUES (
        'FY2025', 
        'Fiscal Year 2025', 
        '2025-03-01', 
        '2026-02-28', 
        'OPEN', 
        true,
        12,
        'MONTHLY',
        'South African tax year 2025 (March 2025 - February 2026)',
        'system'
      )
      RETURNING id
    `;
    
    const fiscalYearResult = await query(fiscalYearQuery);
    const fiscalYearId = fiscalYearResult.rows[0].id;
    console.log('✅ Created fiscal year: FY2025');

    // Create 12 monthly periods
    console.log('📊 Creating 12 monthly periods...');

    const periods = [
      { num: 1, month: 'March', start: '2025-03-01', end: '2025-03-31' },
      { num: 2, month: 'April', start: '2025-04-01', end: '2025-04-30' },
      { num: 3, month: 'May', start: '2025-05-01', end: '2025-05-31' },
      { num: 4, month: 'June', start: '2025-06-01', end: '2025-06-30' },
      { num: 5, month: 'July', start: '2025-07-01', end: '2025-07-31' },
      { num: 6, month: 'August', start: '2025-08-01', end: '2025-08-31' },
      { num: 7, month: 'September', start: '2025-09-01', end: '2025-09-30' },
      { num: 8, month: 'October', start: '2025-10-01', end: '2025-10-31' },
      { num: 9, month: 'November', start: '2025-11-01', end: '2025-11-30', isCurrent: true },
      { num: 10, month: 'December', start: '2025-12-01', end: '2025-12-31' },
      { num: 11, month: 'January', start: '2026-01-01', end: '2026-01-31' },
      { num: 12, month: 'February', start: '2026-02-01', end: '2026-02-28' },
    ];

    for (const period of periods) {
      const periodQuery = `
        INSERT INTO accounting_periods (
          fiscal_year_id, period_number, period_code, period_name,
          start_date, end_date, status, is_current, is_adjustment_period,
          description, created_by, opened_at, opened_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
          ${period.isCurrent ? 'CURRENT_TIMESTAMP' : 'NULL'},
          ${period.isCurrent ? "'system'" : 'NULL'}
        )
      `;

      const status = period.num <= 9 ? 'OPEN' : 'FUTURE';
      
      await query(periodQuery, [
        fiscalYearId,
        period.num,
        `FY2025-P${period.num.toString().padStart(2, '0')}`,
        `${period.month} 2025`,
        period.start,
        period.end,
        status,
        period.isCurrent || false,
        false,
        `Period ${period.num} - ${period.month}`,
        'system'
      ]);

      console.log(`   ✅ P${period.num.toString().padStart(2, '0')} - ${period.month} (${status})`);
    }

    // Get summary
    const summaryQuery = `
      SELECT 
        fy.year_code,
        fy.year_name,
        COUNT(ap.id) as period_count,
        SUM(CASE WHEN ap.status = 'OPEN' THEN 1 ELSE 0 END) as open_periods,
        SUM(CASE WHEN ap.status = 'FUTURE' THEN 1 ELSE 0 END) as future_periods
      FROM fiscal_years fy
      LEFT JOIN accounting_periods ap ON fy.id = ap.fiscal_year_id
      WHERE fy.id = $1
      GROUP BY fy.year_code, fy.year_name
    `;
    
    const summary = await query(summaryQuery, [fiscalYearId]);
    const summaryRow = summary.rows[0];

    console.log('\n✅ Period Management Seed Complete!');
    console.log('📊 Summary:');
    console.log(`   - Fiscal Year: ${summaryRow.year_code} (${summaryRow.year_name})`);
    console.log(`   - Total Periods: ${summaryRow.period_count}`);
    console.log(`   - Open Periods: ${summaryRow.open_periods}`);
    console.log(`   - Future Periods: ${summaryRow.future_periods}`);
    console.log(`   - Current Period: November 2025 (P09)`);

  } catch (error) {
    console.error('❌ Error seeding period data:', error);
    throw error;
  }
}

// Run seed
seedPeriodData()
  .then(() => {
    console.log('\n🎉 Period management seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed failed:', error);
    process.exit(1);
  });
