-- Normalize demo tenant/data to the canonical demo tenant UUID
-- Canonical demo tenant UUID (used by demo user + demo reset service)
\set demo_uuid '00000000-0000-0000-0000-000000000001'

-- Ensure tenant record exists
INSERT INTO tenants (id, name, slug, status, subscription_plan, subscription_status, max_users)
VALUES (:'demo_uuid', 'AetherOS Demo Company', 'demo', 'active', 'enterprise', 'active', 9999)
ON CONFLICT (id) DO NOTHING;

-- Ensure demo user belongs to the canonical demo tenant
UPDATE users
SET tenant_id = :'demo_uuid'
WHERE email = 'demo@aetheros.co.za';

-- Force all rows with a tenant_id column to use the canonical demo tenant (demo-only environment)
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT table_schema, table_name
        FROM information_schema.columns
        WHERE column_name = 'tenant_id'
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format('UPDATE %I.%I SET tenant_id = $1', r.table_schema, r.table_name)
        USING :'demo_uuid';
    END LOOP;
END$$;

-- Helpful verification
SELECT tenant_id, COUNT(*) AS row_count
FROM (
    SELECT table_name, tenant_id FROM tenants WHERE id = :'demo_uuid'
    UNION ALL
    SELECT 'users'::text, tenant_id FROM users WHERE tenant_id = :'demo_uuid'
) t
GROUP BY tenant_id;
