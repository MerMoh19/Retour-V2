/*
  # Multi-Warehouse System with Authentication
  
  1. New Tables
    - `warehouses` - Stores warehouse information (centres de tri, agences, desks)
    - `profiles` - Extends auth.users with role and user metadata
    - `user_warehouses` - Many-to-many relationship between users and warehouses
  
  2. Modifications to Existing Tables
    - Add `warehouse_id` to `boxes`, `parcels`, `archived_parcels`
    - Add unique constraints for warehouse-scoped data
  
  3. Helper Functions
    - `user_warehouse_ids()` - Returns warehouse IDs accessible to current user
    - `user_role()` - Returns role of current user
  
  4. Security
    - Enable RLS on all tables
    - Create policies based on role and warehouse assignment
*/

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('centre_tri', 'agence', 'desk')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('operations', 'chef_agence', 'regional', 'super_admin')) DEFAULT 'operations',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_warehouses junction table
CREATE TABLE IF NOT EXISTS user_warehouses (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, warehouse_id)
);

-- Add warehouse_id to boxes (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boxes' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE boxes ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);
  END IF;
END $$;

-- Add warehouse_id to parcels (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'parcels' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE parcels ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);
  END IF;
END $$;

-- Add warehouse_id to archived_parcels (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archived_parcels' AND column_name = 'warehouse_id'
  ) THEN
    ALTER TABLE archived_parcels ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);
  END IF;
END $$;

-- Seed warehouses data
INSERT INTO warehouses (code, name, type) VALUES
  ('195503', 'Centre de tri de Sétif', 'centre_tri'),
  ('195501', 'Agence Maabouda', 'agence'),
  ('193201', 'Centre de tri El Eulma', 'centre_tri'),
  ('193202', 'Desk El Eulma', 'desk'),
  ('340602', 'Centre de tri BBA', 'centre_tri'),
  ('340601', 'Agence BBA', 'agence'),
  ('282801', 'Centre de tri M''sila', 'centre_tri'),
  ('282802', 'Agence de M''sila', 'agence'),
  ('281201', 'Agence de Boussada', 'agence'),
  ('430801', 'Agence de Chelghoum Laid', 'agence'),
  ('431601', 'Centre de tri de Mila', 'centre_tri'),
  ('431602', 'Agence de Mila', 'agence'),
  ('181401', 'Centre de tri de Jijel - Kaous', 'centre_tri'),
  ('180101', 'Agence de Jijel', 'agence')
ON CONFLICT (code) DO NOTHING;

-- Helper function: Get warehouse IDs accessible to current user
CREATE OR REPLACE FUNCTION user_warehouse_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT warehouse_id 
  FROM user_warehouses 
  WHERE user_id = auth.uid()
$$;

-- Helper function: Get role of current user
CREATE OR REPLACE FUNCTION user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role 
  FROM profiles 
  WHERE id = auth.uid()
$$;

-- Helper function: Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- Enable RLS on all tables
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_parcels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouses
CREATE POLICY "Authenticated users can view warehouses"
  ON warehouses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage warehouses"
  ON warehouses FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_warehouses
CREATE POLICY "Users can view their own warehouse assignments"
  ON user_warehouses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all warehouse assignments"
  ON user_warehouses FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admin can manage warehouse assignments"
  ON user_warehouses FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- RLS Policies for boxes
CREATE POLICY "Users can view boxes in their warehouses"
  ON boxes FOR SELECT
  TO authenticated
  USING (
    is_super_admin() OR
    warehouse_id IN (SELECT user_warehouse_ids())
  );

CREATE POLICY "Managers can insert boxes in their warehouses"
  ON boxes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

CREATE POLICY "Managers can update boxes in their warehouses"
  ON boxes FOR UPDATE
  TO authenticated
  USING (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  )
  WITH CHECK (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

CREATE POLICY "Managers can delete boxes in their warehouses"
  ON boxes FOR DELETE
  TO authenticated
  USING (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

-- RLS Policies for parcels
CREATE POLICY "Users can view parcels in their warehouses"
  ON parcels FOR SELECT
  TO authenticated
  USING (
    is_super_admin() OR
    warehouse_id IN (SELECT user_warehouse_ids())
  );

CREATE POLICY "Users can insert parcels in their warehouses"
  ON parcels FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin() OR
    warehouse_id IN (SELECT user_warehouse_ids())
  );

CREATE POLICY "Managers can update parcels in their warehouses"
  ON parcels FOR UPDATE
  TO authenticated
  USING (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  )
  WITH CHECK (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

CREATE POLICY "Managers can delete parcels in their warehouses"
  ON parcels FOR DELETE
  TO authenticated
  USING (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

-- RLS Policies for archived_parcels
CREATE POLICY "Users can view archived parcels in their warehouses"
  ON archived_parcels FOR SELECT
  TO authenticated
  USING (
    is_super_admin() OR
    warehouse_id IN (SELECT user_warehouse_ids())
  );

CREATE POLICY "Managers can insert archived parcels in their warehouses"
  ON archived_parcels FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin() OR
    (user_role() IN ('chef_agence', 'regional') AND warehouse_id IN (SELECT user_warehouse_ids()))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boxes_warehouse_id ON boxes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_parcels_warehouse_id ON parcels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_archived_parcels_warehouse_id ON archived_parcels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_user_warehouses_user_id ON user_warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warehouses_warehouse_id ON user_warehouses(warehouse_id);

-- Add unique constraint for box names per warehouse
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'boxes_warehouse_name_unique'
  ) THEN
    ALTER TABLE boxes ADD CONSTRAINT boxes_warehouse_name_unique UNIQUE (warehouse_id, name);
  END IF;
END $$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'operations');
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
