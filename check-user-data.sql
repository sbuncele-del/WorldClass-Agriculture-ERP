-- Check user data in production
SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.status,
       t.id as tenant_id, t.name as tenant_name, t.slug as tenant_slug
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 10;
