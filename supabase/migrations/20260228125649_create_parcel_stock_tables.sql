/*
  # Create Parcel Stock Management Tables

  1. New Tables
    - `boxes`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null) - Box name/identifier
      - `quota` (integer, not null, default 100) - Maximum parcels per box
      - `created_at` (timestamptz, default now())
    
    - `parcels`
      - `id` (uuid, primary key)
      - `tracking` (text, unique, not null) - Tracking number from QR code
      - `boutique` (text, not null) - Boutique name from QR code
      - `box_id` (uuid, foreign key to boxes)
      - `created_at` (timestamptz, default now())
    
    - `archived_parcels`
      - `id` (uuid, primary key)
      - `tracking` (text, not null) - Original tracking number
      - `boutique` (text, not null) - Boutique name
      - `box_name` (text, not null) - Box name at time of archiving
      - `created_at` (timestamptz, not null) - Original creation date
      - `archived_at` (timestamptz, default now()) - When it was archived

  2. Security
    - Enable RLS on all tables
    - Add public access policies (no authentication required)
    - Allow all operations for public users
*/

-- Create boxes table
CREATE TABLE IF NOT EXISTS boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  quota integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Create parcels table
CREATE TABLE IF NOT EXISTS parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking text UNIQUE NOT NULL,
  boutique text NOT NULL,
  box_id uuid REFERENCES boxes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create archived_parcels table
CREATE TABLE IF NOT EXISTS archived_parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking text NOT NULL,
  boutique text NOT NULL,
  box_name text NOT NULL,
  created_at timestamptz NOT NULL,
  archived_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_parcels ENABLE ROW LEVEL SECURITY;

-- Public access policies for boxes
CREATE POLICY "Public can view boxes"
  ON boxes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert boxes"
  ON boxes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update boxes"
  ON boxes FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete boxes"
  ON boxes FOR DELETE
  TO anon
  USING (true);

-- Public access policies for parcels
CREATE POLICY "Public can view parcels"
  ON parcels FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert parcels"
  ON parcels FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update parcels"
  ON parcels FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete parcels"
  ON parcels FOR DELETE
  TO anon
  USING (true);

-- Public access policies for archived_parcels
CREATE POLICY "Public can view archived parcels"
  ON archived_parcels FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert archived parcels"
  ON archived_parcels FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can update archived parcels"
  ON archived_parcels FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete archived parcels"
  ON archived_parcels FOR DELETE
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_box_id ON parcels(box_id);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON parcels(created_at);
CREATE INDEX IF NOT EXISTS idx_archived_parcels_tracking ON archived_parcels(tracking);
CREATE INDEX IF NOT EXISTS idx_archived_parcels_created_at ON archived_parcels(created_at);
