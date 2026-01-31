-- Update user password with proper bcrypt hash
-- Date: December 30, 2025
-- Password: Masaphokati2025!

UPDATE users 
SET password_hash = '$2b$10$IIG1uvvyeZ2wuEHywcfyEe6NfofCK55jadhcKfs6B6SNhS0sdwczC'
WHERE email = 'Sibusiso@sgbsgroup.co.za';

-- Verify the update
SELECT id, email, LEFT(password_hash, 30) || '...' as hash_preview, full_name 
FROM users 
WHERE email = 'Sibusiso@sgbsgroup.co.za';