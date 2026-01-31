const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🚀 Running Fuel Transactions Migration...\n');
  
  const client = await pool.connect();
  
  try {
    console.log('✓ Connected to database');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS logistics_fuel_transactions (
        transaction_id SERIAL PRIMARY KEY,
        transaction_date DATE NOT NULL,
        vehicle VARCHAR(100) NOT NULL,
        driver VARCHAR(200) NOT NULL,
        litres DECIMAL(10, 2) NOT NULL,
        price_per_litre DECIMAL(10, 2) NOT NULL,
        total_cost DECIMAL(12, 2) NOT NULL,
        odometer_reading INTEGER NOT NULL,
        supplier VARCHAR(200) NOT NULL,
        invoice_number VARCHAR(100) NOT NULL,
        journal_entry_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE SET NULL
      );
    `);
    console.log('✓ Table created: logistics_fuel_transactions');
    
    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON logistics_fuel_transactions(transaction_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON logistics_fuel_transactions(vehicle);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fuel_transactions_supplier ON logistics_fuel_transactions(supplier);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_fuel_transactions_journal ON logistics_fuel_transactions(journal_entry_id);`);
    console.log('✓ Indexes created');
    
    // Add comment
    await client.query(`COMMENT ON TABLE logistics_fuel_transactions IS 'Stores fuel purchase transactions linked to financial journal entries';`);
    console.log('✓ Table comment added');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'logistics_fuel_transactions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Table Structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n🎉 Fuel Management is now LIVE with real database!');
    console.log('\n🔗 Test it at:');
    console.log('http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/logistics/fuel');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
