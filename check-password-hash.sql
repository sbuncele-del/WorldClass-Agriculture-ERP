-- Check and fix user password
-- Date: December 30, 2025

-- Check current user data
SELECT id, email, password_hash, full_name, role FROM users WHERE email = 'Sibusiso@sgbsgroup.co.za';

-- The current hash looks incomplete. Let's generate a proper bcrypt hash for 'Masaphokati2025!'
-- Using bcrypt with salt rounds 10 (standard)

-- First, let's see what we have
\echo 'Current user data:';
SELECT id, email, LEFT(password_hash, 20) || '...' as hash_preview, full_name 
FROM users 
WHERE email = 'Sibusiso@sgbsgroup.co.za';