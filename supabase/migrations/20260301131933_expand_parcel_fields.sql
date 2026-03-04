/*
  # Expand Parcel Fields to Store Complete QR Data

  1. Modified Tables
    - `parcels`
      - Added fields to store complete QR code data:
        - `wilaya_destinataire` (text) - Destination state/province
        - `commune` (text) - Destination commune
        - `id_vendeur` (text) - Vendor ID
        - `bureau_destinataire` (text) - Destination office
        - `sd_hd` (integer, 0 or 1) - SD or HD indicator
        - `centre_retour` (text) - Return center
        - `phone_client` (text) - Customer phone number
        - `is_missing` (boolean, default false) - Mark parcel as missing
        - `missing_reported_at` (timestamptz) - When missing was reported

  2. Notes
    - All new fields are optional (nullable) to support backward compatibility
    - The `is_missing` field enables warning system for missing parcels
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'wilaya_destinataire'
  ) THEN
    ALTER TABLE parcels ADD COLUMN wilaya_destinataire text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'commune'
  ) THEN
    ALTER TABLE parcels ADD COLUMN commune text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'id_vendeur'
  ) THEN
    ALTER TABLE parcels ADD COLUMN id_vendeur text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'bureau_destinataire'
  ) THEN
    ALTER TABLE parcels ADD COLUMN bureau_destinataire text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'sd_hd'
  ) THEN
    ALTER TABLE parcels ADD COLUMN sd_hd integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'centre_retour'
  ) THEN
    ALTER TABLE parcels ADD COLUMN centre_retour text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'phone_client'
  ) THEN
    ALTER TABLE parcels ADD COLUMN phone_client text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'is_missing'
  ) THEN
    ALTER TABLE parcels ADD COLUMN is_missing boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'missing_reported_at'
  ) THEN
    ALTER TABLE parcels ADD COLUMN missing_reported_at timestamptz;
  END IF;
END $$;
