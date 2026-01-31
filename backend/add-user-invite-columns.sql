-- Add missing columns for user invitation feature
-- Run on production database

-- Add invitation_token column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255);

-- Add invitation_expires_at column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP;

-- Add created_by column if not exists (references the admin who created/invited the user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add display_name column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Add is_active column if not exists (default true for existing users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Ensure status column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token) WHERE invitation_token IS NOT NULL;

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('invitation_token', 'invitation_expires_at', 'created_by', 'display_name', 'is_active', 'status')
ORDER BY column_name;
