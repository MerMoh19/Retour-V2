import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { Warehouse } from '../types/database';

interface WarehouseContextType {
  currentWarehouse: Warehouse | null;
  setCurrentWarehouse: (warehouse: Warehouse) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { warehouses, profile } = useAuth();
  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(null);

  useEffect(() => {
    if (warehouses.length > 0 && !currentWarehouse) {
      const stored = localStorage.getItem('selectedWarehouseId');
      if (stored) {
        const warehouse = warehouses.find((w) => w.id === stored);
        if (warehouse) {
          setCurrentWarehouse(warehouse);
          return;
        }
      }
      setCurrentWarehouse(warehouses[0]);
    } else if (warehouses.length === 0) {
      setCurrentWarehouse(null);
    }
  }, [warehouses, profile]);

  const handleSetWarehouse = (warehouse: Warehouse) => {
    setCurrentWarehouse(warehouse);
    localStorage.setItem('selectedWarehouseId', warehouse.id);
  };

  return (
    <WarehouseContext.Provider
      value={{
        currentWarehouse,
        setCurrentWarehouse: handleSetWarehouse,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
