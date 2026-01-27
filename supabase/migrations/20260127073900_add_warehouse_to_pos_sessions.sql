-- Add warehouse_id column to pos_sessions table
ALTER TABLE pos_sessions
ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

-- Add index for better query performance
CREATE INDEX idx_pos_sessions_warehouse_id ON pos_sessions(warehouse_id);
