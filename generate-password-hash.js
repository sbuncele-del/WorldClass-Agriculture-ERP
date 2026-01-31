// Generate proper bcrypt hash for login
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'Masaphokati2025!';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash:', hash);
        
        // Test the hash
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash validation:', isValid);
        
        // Generate SQL update statement
        console.log('\nSQL Update Statement:');
        console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = 'Sibusiso@sgbsgroup.co.za';`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

generateHash();