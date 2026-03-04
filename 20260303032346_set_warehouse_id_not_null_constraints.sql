/*
  # Set warehouse_id constraints and defaults
  
  1. Updates
    - Ensure warehouse_id columns are properly set as NOT NULL where appropriate
    - Set default warehouse for existing data (first warehouse)
  
  2. Notes
    - For production, you would need to properly assign warehouses based on actual data
    - This migration sets a safe default for development
*/

-- Get the first warehouse ID to use as default
DO $$
DECLARE
  first_warehouse_id UUID;
BEGIN
  SELECT id INTO first_warehouse_id
  FROM warehouses
  ORDER BY created_at
  LIMIT 1;

  -- Update boxes that don't have warehouse_id
  IF first_warehouse_id IS NOT NULL THEN
    UPDATE boxes
    SET warehouse_id = first_warehouse_id
    WHERE warehouse_id IS NULL;

    UPDATE parcels
    SET warehouse_id = first_warehouse_id
    WHERE warehouse_id IS NULL;

    UPDATE archived_parcels
    SET warehouse_id = first_warehouse_id
    WHERE warehouse_id IS NULL;
  END IF;
END $$;

-- Now set NOT NULL constraints
ALTER TABLE boxes ALTER COLUMN warehouse_id SET NOT NULL;
ALTER TABLE parcels ALTER COLUMN warehouse_id SET NOT NULL;
ALTER TABLE archived_parcels ALTER COLUMN warehouse_id SET NOT NULL;
