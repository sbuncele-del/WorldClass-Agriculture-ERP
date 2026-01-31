    async getTrialBalance(_fiscalYear, _fiscalPeriod) {
        const result = await (0, database_1.query)(`
      SELECT 
        a.account_id,
        a.account_code,
        a.account_name,
        a.account_type,
        COALESCE(SUM(jel.debit_amount), 0) as total_debits,
        COALESCE(SUM(jel.credit_amount), 0) as total_credits,
        COALESCE(SUM(jel.debit_amount), 0) - COALESCE(SUM(jel.credit_amount), 0) as balance
      FROM chart_of_accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.account_id
      LEFT JOIN journal_entries je ON je.entry_id = jel.entry_id
      WHERE (je.status = 'posted' OR je.entry_id IS NULL)
        AND a.is_active = true
      GROUP BY a.account_id, a.account_code, a.account_name, a.account_type
      HAVING COALESCE(SUM(jel.debit_amount), 0) <> 0 OR COALESCE(SUM(jel.credit_amount), 0) <> 0
      ORDER BY a.account_code
    `);
        return result.rows;
    }
