# Project Structure

This document provides a complete overview of the project organization.

## Directory Structure

```
yalidine-retour-v2/
├── docs/                          # Documentation
│   ├── IMPLEMENTATION_SUMMARY.md  # Complete implementation details
│   └── SETUP_GUIDE.md            # Setup and deployment guide
│
├── public/                        # Static assets
│   ├── sounds/                   # Sound effects for UI feedback
│   │   ├── success.mp3
│   │   └── error.mp3
│   └── yalidine-logo.svg         # Company branding
│
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── admin/               # Admin-only components
│   │   │   ├── Users.tsx        # User management interface
│   │   │   └── Warehouses.tsx   # Warehouse management interface
│   │   ├── AddParcel.tsx        # Add parcel with QR/manual modes
│   │   ├── Boxes.tsx            # Box CRUD operations
│   │   ├── ClearParcels.tsx     # Clear/archive parcels (unused)
│   │   ├── Dashboard.tsx        # Main dashboard with stats
│   │   ├── DonnerRetours.tsx    # Return parcels to boutiques
│   │   ├── Login.tsx            # Authentication page
│   │   ├── PrintBox.tsx         # Print-friendly box list
│   │   ├── Search.tsx           # Search parcels (unused)
│   │   ├── Statistics.tsx       # Charts and statistics
│   │   ├── StockControl.tsx     # Stock management & export
│   │   └── WarehouseSelector.tsx # Warehouse switcher dropdown
│   │
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx      # Authentication state management
│   │   └── WarehouseContext.tsx # Warehouse selection state
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSound.ts          # Sound effects (success/error)
│   │   └── useWarehouseFilter.ts # Warehouse filtering logic
│   │
│   ├── lib/                      # Third-party integrations
│   │   └── supabase.ts          # Supabase client configuration
│   │
│   ├── types/                    # TypeScript type definitions
│   │   └── database.ts          # Database schema types
│   │
│   ├── utils/                    # Utility functions
│   │   └── wilaya.ts            # Algerian wilaya code mapping
│   │
│   ├── App.tsx                   # Main application component
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # Application entry point
│   └── vite-env.d.ts            # Vite environment type declarations
│
├── supabase/
│   └── migrations/               # Database migrations (SQL)
│       ├── 20260228125649_create_parcel_stock_tables.sql
│       ├── 20260301131933_expand_parcel_fields.sql
│       ├── 20260303031849_create_warehouse_multitenancy_system.sql
│       ├── 20260303032346_set_warehouse_id_not_null_constraints.sql
│       ├── 20260303032511_create_initial_super_admin.sql
│       ├── 20260303_add_given_to_boutique_fields.sql
│       └── 20260304_add_utf8mb4_support.sql
│
├── .env                          # Environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── README.md                     # Project overview
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.app.json             # TypeScript config for app
├── tsconfig.json                 # TypeScript root config
├── tsconfig.node.json            # TypeScript config for Node
└── vite.config.ts                # Vite build configuration
```

## Component Breakdown

### Core Components

| Component | Purpose | Access Level |
|-----------|---------|--------------|
| Dashboard | Overview stats, missing alerts, box list | All roles |
| AddParcel | Add parcels via QR or manual entry | All roles |
| DonnerRetours | Bulk give parcels to boutiques | All roles |
| Statistics | Charts and reporting | All roles |
| Boxes | CRUD operations for boxes | Manager+ |
| StockControl | Clear stock, export data | Manager+ |
| Login | Authentication | Public |

### Admin Components

| Component | Purpose | Access Level |
|-----------|---------|--------------|
| Users | Create/manage users and roles | Super Admin only |
| Warehouses | Create/manage warehouses | Super Admin only |

### Context Providers

| Context | Purpose |
|---------|---------|
| AuthContext | User session, profile, warehouses |
| WarehouseContext | Current warehouse selection |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| useWarehouseFilter | Get current warehouse ID and permissions |
| useSound | Play success/error sound effects |

## Database Schema

### Tables

- **warehouses**: Warehouse definitions (code, name, type)
- **profiles**: User profiles extending auth.users (role, metadata)
- **user_warehouses**: Many-to-many user-warehouse assignments
- **boxes**: Box definitions with quotas (per warehouse)
- **parcels**: Active parcels in boxes (per warehouse)
- **archived_parcels**: Historical parcel records (per warehouse)

### Security

All tables protected with Row Level Security (RLS):
- Users can only access data from their assigned warehouses
- Super admins have unrestricted access
- Role-based permissions enforced at database level

## Key Files

### Configuration

- **vite.config.ts**: Vite bundler configuration
- **tailwind.config.js**: Tailwind CSS customization
- **tsconfig.*.json**: TypeScript compiler options
- **eslint.config.js**: Code linting rules

### Environment

- **.env**: Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### Documentation

- **README.md**: Project overview and quick start
- **docs/SETUP_GUIDE.md**: Detailed setup instructions
- **docs/IMPLEMENTATION_SUMMARY.md**: Complete technical documentation

## Development Workflow

1. Make changes in `src/`
2. Test with `npm run dev`
3. Type check with `npm run typecheck`
4. Lint with `npm run lint`
5. Build with `npm run build`
6. Test production build with `npm run preview`

## File Naming Conventions

- **Components**: PascalCase with `.tsx` extension
- **Hooks**: camelCase with `use` prefix and `.ts` extension
- **Contexts**: PascalCase with `Context` suffix and `.tsx` extension
- **Utils**: camelCase with `.ts` extension
- **Types**: camelCase with `.ts` extension

## Import Paths

All imports use relative paths:
```typescript
// Components
import Dashboard from '../components/Dashboard';

// Hooks
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';

// Contexts
import { useAuth } from '../contexts/AuthContext';

// Lib
import { supabase } from '../lib/supabase';

// Types
import type { Warehouse } from '../types/database';

// Utils
import { getWilayaName } from '../utils/wilaya';
```

## Notes

- **ClearParcels.tsx** and **Search.tsx** are not currently used in the navigation
- All warehouse filtering is done via `useWarehouseFilter` hook
- Sound effects are optional and fail gracefully if files missing
- Print functionality opens in new window for clean printing
