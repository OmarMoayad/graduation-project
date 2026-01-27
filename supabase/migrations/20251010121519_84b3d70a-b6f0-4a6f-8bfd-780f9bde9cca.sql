-- Add new purchase order status values to enum
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'rfq';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'po';
ALTER TYPE purchase_order_status ADD VALUE IF NOT EXISTS 'receiving';