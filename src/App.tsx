import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WarehouseProvider, useWarehouse } from './contexts/WarehouseContext';
import Dashboard from './components/Dashboard';
import AddParcel from './components/AddParcel';
import Boxes from './components/Boxes';
import DonnerRetours from './components/DonnerRetours';
import StockControl from './components/StockControl';
import Statistics from './components/Statistics';
import PrintBox from './components/PrintBox';
import Login from './components/Login';
import Users from './components/admin/Users';
import Warehouses from './components/admin/Warehouses';
import WarehouseSelector from './components/WarehouseSelector';
import { LayoutDashboard, PackagePlus, Box, Undo2, Settings, BarChart3, Users as UsersIcon, Warehouse as WarehouseIcon, LogOut } from 'lucide-react';

type Page = 'dashboard' | 'add' | 'boxes' | 'retours' | 'control' | 'statistics' | 'admin-users' | 'admin-warehouses';

function AppContent() {
  const { user, profile, signOut, loading } = useAuth();
  const { currentWarehouse } = useWarehouse();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [printBoxId, setPrintBoxId] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const printMatch = path.match(/^\/print\/box\/(.+)$/);
    if (printMatch) {
      setPrintBoxId(printMatch[1]);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (!currentWarehouse && !printBoxId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <WarehouseIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun entrepôt assigné</h2>
          <p className="text-gray-600 mb-4">Veuillez contacter un administrateur pour vous assigner un entrepôt.</p>
          <button
            onClick={signOut}
            className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const canManageBoxes = profile.role === 'chef_agence' || profile.role === 'regional' || profile.role === 'super_admin';
  const canAccessStockControl = canManageBoxes;
  const isAdmin = profile.role === 'super_admin';

  const navigation = [
    { id: 'dashboard' as Page, label: 'Tableau de bord', icon: LayoutDashboard, roles: ['operations', 'chef_agence', 'regional', 'super_admin'] },
    { id: 'add' as Page, label: 'Ajouter un colis', icon: PackagePlus, roles: ['operations', 'chef_agence', 'regional', 'super_admin'] },
    { id: 'boxes' as Page, label: 'Boxes', icon: Box, roles: ['chef_agence', 'regional', 'super_admin'] },
    { id: 'retours' as Page, label: 'Donner des retours', icon: Undo2, color: 'text-red-700', roles: ['operations', 'chef_agence', 'regional', 'super_admin'] },
    { id: 'statistics' as Page, label: 'Statistiques', icon: BarChart3, roles: ['operations', 'chef_agence', 'regional', 'super_admin'] },
    { id: 'control' as Page, label: 'Contrôle de stock', icon: Settings, roles: ['chef_agence', 'regional', 'super_admin'] },
  ];

  const adminNavigation = [
    { id: 'admin-users' as Page, label: 'Utilisateurs', icon: UsersIcon },
    { id: 'admin-warehouses' as Page, label: 'Entrepôts', icon: WarehouseIcon },
  ];

  if (printBoxId) {
    return <PrintBox boxId={printBoxId} />;
  }

  const visibleNavigation = navigation.filter((item) => item.roles.includes(profile.role));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-2 shadow-sm border-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src="/yalidine-logo.svg" alt="Yalidine Express" className="h-12" />
              <div>
                <h1 className="text-2xl font-bold text-red-700">Gestion des retours</h1>
                <p className="text-xs text-gray-500">Yalidine Express</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <WarehouseSelector />
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{profile.full_name || profile.email}</div>
                <div className="text-xs text-gray-500">{profile.role}</div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-red-700 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const isRetours = item.id === 'retours';
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? `border-red-700 ${isRetours ? 'text-white bg-red-700' : 'text-red-700 bg-red-50'}`
                      : `border-transparent text-gray-600 ${isRetours ? 'hover:text-red-700 hover:bg-red-50' : 'hover:text-gray-900 hover:bg-gray-50'}`
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isRetours && currentPage === 'retours' ? 'text-white' : ''}`} />
                  {item.label}
                </button>
              );
            })}
            {isAdmin && adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? 'border-red-700 text-red-700 bg-red-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main>
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'add' && <AddParcel />}
          {currentPage === 'boxes' && canManageBoxes && <Boxes />}
          {currentPage === 'retours' && <DonnerRetours />}
          {currentPage === 'statistics' && <Statistics />}
          {currentPage === 'control' && canAccessStockControl && <StockControl />}
          {currentPage === 'admin-users' && isAdmin && <Users />}
          {currentPage === 'admin-warehouses' && isAdmin && <Warehouses />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <WarehouseProvider>
        <AppContent />
      </WarehouseProvider>
    </AuthProvider>
  );
}

export default App;
