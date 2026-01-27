-- Update existing purchase orders to use new status workflow
-- Convert draft to rfq (Request for Quotation)
UPDATE purchase_orders SET status = 'rfq' WHERE status = 'draft';

-- Convert confirmed to po (Purchase Order)
UPDATE purchase_orders SET status = 'po' WHERE status = 'confirmed';