import { useAuth } from '../contexts/AuthContext';
import { useWarehouse } from '../contexts/WarehouseContext';
import { Warehouse } from 'lucide-react';

export default function WarehouseSelector() {
  const { warehouses } = useAuth();
  const { currentWarehouse, setCurrentWarehouse } = useWarehouse();

  if (warehouses.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Warehouse className="w-5 h-5 text-gray-600" />
      <select
        value={currentWarehouse?.id || ''}
        onChange={(e) => {
          const warehouse = warehouses.find((w) => w.id === e.target.value);
          if (warehouse) {
            setCurrentWarehouse(warehouse);
          }
        }}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-700 focus:border-red-700"
      >
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name} ({warehouse.code})
          </option>
        ))}
      </select>
    </div>
  );
}
