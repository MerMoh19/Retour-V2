# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-03-04

### Project Reorganization

#### Added
- Comprehensive README.md with project overview and quick start guide
- PROJECT_STRUCTURE.md documenting complete file organization
- Enhanced .gitignore with standard Node.js patterns
- docs/ directory for documentation
- Proper src/ directory structure with organized subdirectories

#### Changed
- Moved all TypeScript files from root to src/ directory
- Organized components into src/components/ and src/components/admin/
- Moved contexts to src/contexts/
- Moved hooks to src/hooks/
- Moved library files to src/lib/
- Moved type definitions to src/types/
- Moved utilities to src/utils/
- Moved CSS file to src/
- Organized SQL migrations into supabase/migrations/
- Moved documentation to docs/ directory

#### File Movements

**Components** (root → src/components/):
- AddParcel.tsx
- Boxes.tsx
- ClearParcels.tsx
- Dashboard.tsx
- DonnerRetours.tsx
- Login.tsx
- PrintBox.tsx
- Search.tsx
- Statistics.tsx
- StockControl.tsx
- WarehouseSelector.tsx

**Admin Components** (root → src/components/admin/):
- Users.tsx
- Warehouses.tsx

**Contexts** (root → src/contexts/):
- AuthContext.tsx
- WarehouseContext.tsx

**Hooks** (root → src/hooks/):
- useSound.ts
- useWarehouseFilter.ts

**Library** (root → src/lib/):
- supabase.ts

**Types** (root → src/types/):
- database.ts

**Utils** (root → src/utils/):
- wilaya.ts

**Main Files** (root → src/):
- App.tsx
- main.tsx
- index.css
- vite-env.d.ts

**Documentation** (root → docs/):
- IMPLEMENTATION_SUMMARY.md
- SETUP_GUIDE.md

**Migrations** (root → supabase/migrations/):
- 20260228125649_create_parcel_stock_tables.sql
- 20260301131933_expand_parcel_fields.sql
- 20260303031849_create_warehouse_multitenancy_system.sql
- 20260303032346_set_warehouse_id_not_null_constraints.sql
- 20260303032511_create_initial_super_admin.sql
- 20260303_add_given_to_boutique_fields.sql
- 20260304_add_utf8mb4_support.sql

### Build System
- Verified build passes after reorganization
- All import paths remain relative and functional
- Production bundle: 639.01 kB (gzipped: 193.35 kB)

### Benefits
- Cleaner root directory
- Better code organization and discoverability
- Follows React/Vite best practices
- Easier to navigate for new developers
- Proper separation of concerns
- Documentation centralized in docs/
- Database migrations clearly organized

## [1.0.0] - 2026-03-03

### Initial Release
- Multi-warehouse system with RLS
- User authentication and role-based access
- Parcel management with QR scanning
- Box management with quotas
- Missing parcel tracking
- Statistics and reporting
- Excel export functionality
