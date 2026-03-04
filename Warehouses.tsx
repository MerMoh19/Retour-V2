import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Warehouse, WarehouseType } from '../../types/database';
import { Warehouse as WarehouseIcon, Plus, CreditCard as Edit2, X, Check } from 'lucide-react';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<WarehouseType>('agence');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<WarehouseType>('agence');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    const { data } = await supabase.from('warehouses').select('*').order('name');
    if (data) {
      setWarehouses(data);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('warehouses').insert({
      code: newCode.trim(),
      name: newName.trim(),
      type: newType,
    });

    if (!error) {
      setNewCode('');
      setNewName('');
      setNewType('agence');
      setShowCreateForm(false);
      loadWarehouses();
    } else {
      alert('Erreur lors de la création de l\'entrepôt');
    }

    setLoading(false);
  };

  const handleUpdateWarehouse = async (warehouseId: string) => {
    setLoading(true);

    const { error } = await supabase
      .from('warehouses')
      .update({ name: editName, type: editType })
      .eq('id', warehouseId);

    if (!error) {
      setEditingWarehouse(null);
      setEditName('');
      setEditType('agence');
      loadWarehouses();
    } else {
      alert('Erreur lors de la mise à jour de l\'entrepôt');
    }

    setLoading(false);
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse.id);
    setEditName(warehouse.name);
    setEditType(warehouse.type || 'agence');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des entrepôts</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          Créer un entrepôt
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateWarehouse} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="ex: 195503"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex: Centre de tri de Sétif"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as WarehouseType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                >
                  <option value="centre_tri">Centre de tri</option>
                  <option value="agence">Agence</option>
                  <option value="desk">Desk</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                disabled={loading}
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCode('');
                  setNewName('');
                  setNewType('agence');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {warehouses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <WarehouseIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Aucun entrepôt trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {warehouses.map((warehouse) => (
                  <tr key={warehouse.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{warehouse.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingWarehouse === warehouse.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded"
                          disabled={loading}
                        />
                      ) : (
                        <span className="text-gray-700">{warehouse.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingWarehouse === warehouse.id ? (
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as WarehouseType)}
                          className="px-2 py-1 border border-gray-300 rounded"
                          disabled={loading}
                        >
                          <option value="centre_tri">Centre de tri</option>
                          <option value="agence">Agence</option>
                          <option value="desk">Desk</option>
                        </select>
                      ) : (
                        <span className="text-gray-700">{warehouse.type || 'Non spécifié'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingWarehouse === warehouse.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateWarehouse(warehouse.id)}
                              className="text-green-600 hover:text-green-700"
                              disabled={loading}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingWarehouse(null);
                                setEditName('');
                                setEditType('agence');
                              }}
                              className="text-red-600 hover:text-red-700"
                              disabled={loading}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(warehouse)}
                            className="text-blue-600 hover:text-blue-700"
                            disabled={loading}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
