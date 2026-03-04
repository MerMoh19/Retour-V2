import { useWarehouse } from '../contexts/WarehouseContext';
import { useAuth } from '../contexts/AuthContext';

export function useWarehouseFilter() {
  const { currentWarehouse } = useWarehouse();
  const { profile } = useAuth();

  const getWarehouseId = (): string | null => {
    if (profile?.role === 'super_admin' && currentWarehouse) {
      return currentWarehouse.id;
    }
    return currentWarehouse?.id || null;
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const canManage = profile?.role === 'chef_agence' || profile?.role === 'regional' || isSuperAdmin;

  return {
    warehouseId: getWarehouseId(),
    currentWarehouse,
    profile,
    isSuperAdmin,
    canManage,
  };
}
