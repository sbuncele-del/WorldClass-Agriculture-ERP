-- Purchase module tenant patch
-- Adds tenant_id to legacy purchase tables used by v2 repositories

ALTER TABLE IF EXISTS purchase.suppliers
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.purchase_orders
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.po_line_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.purchase_requisitions
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.requisition_line_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.goods_receipts
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.gr_line_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.vendor_invoices
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.invoice_line_items
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;

ALTER TABLE IF EXISTS purchase.vendor_payments
  ADD COLUMN IF NOT EXISTS tenant_id uuid DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL;
