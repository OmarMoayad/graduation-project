-- Add location coordinates to products for heatmap visualization
ALTER TABLE products 
ADD COLUMN location_x numeric,
ADD COLUMN location_y numeric;

COMMENT ON COLUMN products.location_x IS 'X coordinate on floor plan for heatmap visualization';
COMMENT ON COLUMN products.location_y IS 'Y coordinate on floor plan for heatmap visualization';