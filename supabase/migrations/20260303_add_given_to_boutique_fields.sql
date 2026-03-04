/*
  # Add given_to_boutique and given_at fields to archived_parcels

  1. New Fields
    - `given_to_boutique` (boolean, default false) - Flag to indicate if parcel was given to boutique
    - `given_at` (timestamptz) - Timestamp when parcel was given to boutique

  2. Notes
    - All new fields are optional (nullable) to support backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archived_parcels' AND column_name = 'given_to_boutique'
  ) THEN
    ALTER TABLE archived_parcels ADD COLUMN given_to_boutique boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archived_parcels' AND column_name = 'given_at'
  ) THEN
    ALTER TABLE archived_parcels ADD COLUMN given_at timestamptz;
  END IF;
END $$;
