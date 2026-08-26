-- ==============================================================================
-- PostgreSQL Trigger: Automatically Sync Invoice Totals & Status on Payment Changes
-- Description:
--   Whenever a record in `payment_allocations` is inserted, updated, or deleted,
--   this trigger automatically recalculates `paid_amount`, `outstanding_amount`,
--   and `status` ('paid', 'partial', 'pending', 'overdue') for the associated invoice.
-- ==============================================================================

CREATE OR REPLACE FUNCTION sync_invoice_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id INT;
  v_total_paid NUMERIC(12, 2);
  v_net_payable NUMERIC(12, 2);
  v_due_date DATE;
BEGIN
  -- Handle both INSERT/UPDATE (NEW) and DELETE (OLD)
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF v_invoice_id IS NOT NULL THEN
    -- 1. Calculate sum of all allocated payments for this invoice
    SELECT COALESCE(SUM(allocated_amount), 0)
    INTO v_total_paid
    FROM payment_allocations
    WHERE invoice_id = v_invoice_id;

    -- 2. Get invoice net payable and due date
    SELECT COALESCE(net_payable_amount, invoice_amount, 0), due_date
    INTO v_net_payable, v_due_date
    FROM invoices
    WHERE id = v_invoice_id;

    -- 3. Update the invoice totals and status automatically
    UPDATE invoices
    SET 
      paid_amount = v_total_paid,
      outstanding_amount = GREATEST(v_net_payable - v_total_paid, 0),
      status = CASE
        -- Retain special terminal statuses
        WHEN status IN ('cancelled', 'disputed') THEN status
        -- Fully paid
        WHEN v_total_paid >= v_net_payable AND v_net_payable > 0 THEN 'paid'
        -- Partially paid
        WHEN v_total_paid > 0 THEN 'partial'
        -- Overdue (if unpaid and past due date)
        WHEN v_due_date < CURRENT_DATE THEN 'overdue'
        -- Default pending
        ELSE 'pending'
      END,
      updated_at = NOW()
    WHERE id = v_invoice_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove older trigger instance if present
DROP TRIGGER IF EXISTS trg_sync_invoice_totals ON payment_allocations;

-- Attach trigger to payment_allocations
CREATE TRIGGER trg_sync_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
FOR EACH ROW EXECUTE FUNCTION sync_invoice_payment_totals();

-- ==============================================================================
-- ONE-TIME RECONCILIATION QUERY
-- (Run this to sync existing invoices with current payment allocations)
-- ==============================================================================
UPDATE invoices i
SET 
  paid_amount = COALESCE(pa.total_allocated, 0),
  outstanding_amount = GREATEST(
    COALESCE(i.net_payable_amount, i.invoice_amount, 0) - COALESCE(pa.total_allocated, 0), 
    0
  ),
  status = CASE 
    WHEN i.status IN ('cancelled', 'disputed') THEN i.status
    WHEN COALESCE(pa.total_allocated, 0) >= COALESCE(i.net_payable_amount, i.invoice_amount, 0) AND COALESCE(i.net_payable_amount, i.invoice_amount, 0) > 0 THEN 'paid'
    WHEN COALESCE(pa.total_allocated, 0) > 0 THEN 'partial'
    WHEN i.due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END,
  updated_at = NOW()
FROM (
  SELECT 
    invoice_id, 
    SUM(allocated_amount) AS total_allocated
  FROM payment_allocations
  WHERE invoice_id IS NOT NULL
  GROUP BY invoice_id
) pa
WHERE i.id = pa.invoice_id;

-- Reset invoices that have zero allocations
UPDATE invoices
SET 
  paid_amount = 0,
  outstanding_amount = COALESCE(net_payable_amount, invoice_amount, 0),
  status = CASE 
    WHEN status IN ('cancelled', 'disputed') THEN status
    WHEN due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END,
  updated_at = NOW()
WHERE id NOT IN (SELECT DISTINCT invoice_id FROM payment_allocations WHERE invoice_id IS NOT NULL);
