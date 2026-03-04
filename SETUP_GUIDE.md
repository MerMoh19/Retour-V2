# Yalidine Multi-Warehouse Retour Hub - Setup Guide

## Overview

This is a comprehensive parcel management system for Yalidine Express with multi-warehouse support, user authentication, and role-based access control.

## Features Implemented

### Authentication & Authorization
- Email/password authentication via Supabase Auth
- Four user roles with distinct permissions:
  - **Operations**: Basic warehouse worker - can add parcels, view dashboards, mark missing
  - **Chef d'agence**: Warehouse manager - all operations permissions + manage boxes, stock control
  - **Regional**: Regional manager - same as chef d'agence but across multiple warehouses
  - **Super Admin**: Full system access - manage users, warehouses, all data

### Multi-Warehouse Support
- 14 pre-configured warehouses (centres de tri, agences, desks)
- Warehouse-scoped data isolation via Row Level Security (RLS)
- Warehouse selector for users with multiple warehouse access
- All data (boxes, parcels, archived parcels) tied to specific warehouses

### Core Features (All Preserved)
- Dashboard with real-time stats and missing parcels alerts
- Add parcels via QR scanner or manual entry with tracking validation
- Box management (CRUD operations with quota tracking)
- Donner des retours (bulk give to boutique with missing marking)
- Stock control (clear boxes, export to Excel)
- Statistics (charts, top boutiques/wilayas)
- Print box lists

### Admin Panel (Super Admin Only)
- User management: create, edit roles, assign warehouses
- Warehouse management: add, edit warehouse details

## Initial Setup

### 1. Create Your First Super Admin User

After deployment, you need to create an initial super admin user:

#### Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add user** > **Create new user**
4. Enter:
   - Email: `admin@yalidine.com` (or your preferred email)
   - Password: Create a secure password
   - Check **Auto Confirm User**
5. Click **Create user**
6. Copy the User ID (UUID) from the users list

#### Set Super Admin Role:
1. Navigate to **SQL Editor** in Supabase Dashboard
2. Run this query (replace USER_UUID with the ID you copied):

```sql
SELECT setup_super_admin('USER_UUID_HERE');
```

This will:
- Set the user's role to 'super_admin'
- Assign all warehouses to this user

### 2. Login and Start Using

1. Visit your application URL
2. Login with the credentials you created
3. You should see the full navigation including **Utilisateurs** and **Entrepôts** tabs

### 3. Create Additional Users

As super admin:

1. Go to **Utilisateurs** tab
2. Click **Créer un utilisateur**
3. Fill in:
   - Email
   - Password (minimum 6 characters)
   - Full name
   - Role (operations, chef_agence, regional, or super_admin)
   - Assign warehouses (select one or multiple)
4. Click **Créer**

## User Roles & Permissions

### Operations (Warehouse Worker)
**Can:**
- View dashboard for assigned warehouse
- Add parcels (QR scanner + manual mode)
- View and mark missing parcels in "Donner des retours"
- View statistics

**Cannot:**
- Create/edit/delete boxes
- Perform stock control operations
- Access admin panels
- Access multiple warehouses

### Chef d'Agence (Warehouse Manager)
**All Operations permissions PLUS:**
- Create, edit, delete boxes in their warehouse
- Clear boxes and export data (Stock Control)
- Typically assigned to one warehouse

### Regional Manager
**Same as Chef d'Agence but:**
- Can be assigned to multiple warehouses
- Can switch between warehouses using the warehouse selector
- Manages all assigned warehouses

### Super Admin
**Full system access:**
- All features across all warehouses
- Create and manage users
- Create and manage warehouses
- Assign roles and warehouse access

## Warehouse List

The system comes pre-configured with 14 warehouses:

| Code | Name | Type |
|------|------|------|
| 195503 | Centre de tri de Sétif | centre_tri |
| 195501 | Agence Maabouda | agence |
| 193201 | Centre de tri El Eulma | centre_tri |
| 193202 | Desk El Eulma | desk |
| 340602 | Centre de tri BBA | centre_tri |
| 340601 | Agence BBA | agence |
| 282801 | Centre de tri M'sila | centre_tri |
| 282802 | Agence de M'sila | agence |
| 281201 | Agence de Boussada | agence |
| 430801 | Agence de Chelghoum Laid | agence |
| 431601 | Centre de tri de Mila | centre_tri |
| 431602 | Agence de Mila | agence |
| 181401 | Centre de tri de Jijel - Kaous | centre_tri |
| 180101 | Agence de Jijel | agence |

## Warehouse Selector

Users assigned to multiple warehouses will see a warehouse selector in the header (next to their name). This allows them to:
- Switch between assigned warehouses
- View data specific to each warehouse
- Perform operations in the context of the selected warehouse

## Data Isolation & Security

All data is protected with Row Level Security (RLS) policies:

- Users can only access data from their assigned warehouses
- Super admins have unrestricted access
- Policies enforce role-based permissions (e.g., only managers can delete boxes)
- Warehouse filtering is enforced at the database level

## Common Workflows

### For Operations Staff
1. Login to your account
2. Add parcels using QR scanner or manual entry
3. View missing parcels and mark them in "Donner des retours"
4. Check dashboard for warehouse stats

### For Chef d'Agence
1. All operations staff tasks
2. Manage boxes (create, edit quotas, delete empty boxes)
3. Clear stock and export reports
4. Monitor warehouse performance via statistics

### For Regional Managers
1. Select warehouse from dropdown in header
2. Perform all chef d'agence tasks for selected warehouse
3. Switch between warehouses to manage multiple locations
4. View comparative statistics across warehouses

### For Super Admin
1. Create and manage users via "Utilisateurs" tab
2. Assign roles and warehouse access
3. Add new warehouses via "Entrepôts" tab
4. Access all features across all warehouses

## Troubleshooting

### User has no warehouse assigned
- Users without assigned warehouses will see "Aucun entrepôt assigné" message
- Super admin should assign at least one warehouse via the Utilisateurs page

### Cannot create boxes or parcels
- Check that user role has appropriate permissions (chef_agence or above)
- Verify warehouse is selected
- Check browser console for detailed error messages

### RLS policy errors
- Ensure user profile exists in the profiles table
- Verify warehouse assignments in user_warehouses table
- Check that warehouse_id is set on all data

## Database Schema

### New Tables
- `warehouses`: Warehouse information
- `profiles`: User profiles extending auth.users
- `user_warehouses`: Many-to-many user-warehouse assignments

### Modified Tables
- `boxes`: Added `warehouse_id` (NOT NULL)
- `parcels`: Added `warehouse_id` (NOT NULL)
- `archived_parcels`: Added `warehouse_id` (NOT NULL)

## Security Features

- All tables protected with RLS
- Authentication required for all operations
- Role-based access control
- Warehouse-scoped data isolation
- Password strength requirements (min 6 characters)
- Automatic profile creation on user signup

## Support

For issues or questions, contact your system administrator or refer to the Supabase documentation for database-related queries.
