import 'dotenv/config';
import { pool } from '../src/config/database';

async function main() {
  try {
    const { rows } = await pool.query('SELECT NOW() AS current_time');
    console.log('✅ Database reachable at:', rows[0].current_time);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connectivity failed:', error);
    process.exit(1);
  }
}

main();
