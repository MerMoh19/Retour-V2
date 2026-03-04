# Yalidine Retour Management System V2

A comprehensive parcel return management system for Yalidine Express with multi-warehouse support, user authentication, and role-based access control.

## Features

- Multi-warehouse data isolation with Row Level Security
- User authentication with role-based permissions (Operations, Chef d'agence, Regional, Super Admin)
- Real-time parcel tracking and management
- QR code scanner and manual entry modes
- Box management with quota tracking
- Missing parcel alerts and reporting
- Bulk operations for giving parcels to boutiques
- Statistical dashboards and reporting
- Excel export functionality
- Print-friendly box lists

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Project Structure

```
.
├── docs/                          # Documentation
│   ├── IMPLEMENTATION_SUMMARY.md  # Complete implementation details
│   └── SETUP_GUIDE.md            # Setup and deployment guide
├── public/                        # Static assets
│   ├── sounds/                   # Sound effects
│   └── yalidine-logo.svg         # Yalidine branding
├── src/
│   ├── components/               # React components
│   │   ├── admin/               # Admin-only components
│   │   │   ├── Users.tsx        # User management
│   │   │   └── Warehouses.tsx   # Warehouse management
│   │   ├── AddParcel.tsx        # Add parcel functionality
│   │   ├── Boxes.tsx            # Box management
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── DonnerRetours.tsx    # Return parcels to boutiques
│   │   ├── Login.tsx            # Authentication
│   │   ├── PrintBox.tsx         # Print box contents
│   │   ├── Search.tsx           # Search parcels
│   │   ├── Statistics.tsx       # Statistics and charts
│   │   ├── StockControl.tsx     # Stock management
│   │   └── WarehouseSelector.tsx # Warehouse switcher
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── WarehouseContext.tsx # Warehouse selection state
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSound.ts          # Sound effects
│   │   └── useWarehouseFilter.ts # Warehouse filtering
│   ├── lib/                      # Third-party integrations
│   │   └── supabase.ts          # Supabase client
│   ├── types/                    # TypeScript types
│   │   └── database.ts          # Database schema types
│   ├── utils/                    # Utility functions
│   │   └── wilaya.ts            # Algerian wilaya mapping
│   ├── App.tsx                   # Main app component
│   ├── index.css                 # Global styles
│   ├── main.tsx                  # App entry point
│   └── vite-env.d.ts            # Vite type declarations
├── supabase/
│   └── migrations/               # Database migrations
└── package.json                  # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run database migrations in your Supabase project (via SQL Editor)

5. Start the development server:
   ```bash
   npm run dev
   ```

### Initial Setup

After deploying, you need to create the first super admin user:

1. Create a user via Supabase Auth dashboard
2. Run the setup function in SQL Editor:
   ```sql
   SELECT setup_super_admin('user_uuid_here');
   ```

For detailed setup instructions, see [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## User Roles

- **Operations**: Basic warehouse worker - add parcels, view dashboards, mark missing
- **Chef d'agence**: Warehouse manager - all operations + manage boxes, stock control
- **Regional**: Multi-warehouse manager - same as chef d'agence across multiple warehouses
- **Super Admin**: Full system access - manage users, warehouses, all data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Documentation

- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Complete technical details
- [Setup Guide](docs/SETUP_GUIDE.md) - Deployment and configuration

## Security

- All tables protected with Row Level Security (RLS)
- Warehouse-scoped data isolation
- Role-based access control
- Authentication required for all operations

## License

Proprietary - Yalidine Express

## Support

For issues or questions, contact your system administrator.