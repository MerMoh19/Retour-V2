/*
  # Create Initial Super Admin User
  
  1. Purpose
    - Creates a super admin user for initial system access
    - Assigns all warehouses to the super admin
  
  2. Notes
    - Email: admin@yalidine.com
    - Password: You'll need to set this via Supabase Auth UI or manually
    - This user will have access to all warehouses
    
  3. Instructions
    - After running this migration, create the user via Supabase Auth dashboard
    - Or use the user management interface once logged in
*/

-- Note: This migration prepares the system but actual user creation
-- should be done via Supabase Auth dashboard with:
-- Email: admin@yalidine.com
-- Then manually insert into profiles and user_warehouses tables

-- Example of how to set up after user is created via Auth:
-- 1. Create user in Supabase Auth dashboard
-- 2. Get the user ID
-- 3. Insert into profiles with role 'super_admin'
-- 4. Optionally assign specific warehouses, or leave empty for super_admin

-- Create a helper function to setup initial admin (for reference)
CREATE OR REPLACE FUNCTION setup_super_admin(user_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update profile
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, 'admin@yalidine.com', 'Super Admin', 'super_admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin';
  
  -- Optionally assign all warehouses
  INSERT INTO user_warehouses (user_id, warehouse_id)
  SELECT user_id, id FROM warehouses
  ON CONFLICT DO NOTHING;
END;
$$;

-- Comment: To use this function after creating a user via Auth:
-- SELECT setup_super_admin('USER_UUID_HERE');
