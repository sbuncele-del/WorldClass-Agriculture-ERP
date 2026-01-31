-- Check constraint
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'valid_role';
-- Show current role
SELECT email, role FROM users;
