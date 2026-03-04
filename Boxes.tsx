import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { Box as BoxIcon, Plus, CreditCard as Edit2, Trash2, X, Check } from 'lucide-react';

interface BoxWithCount extends Box {
  parcel_count: number;
}

export default function Boxes() {
  const { warehouseId } = useWarehouseFilter();
  const [boxes, setBoxes] = useState<BoxWithCount[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBox, setEditingBox] = useState<string | null>(null);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxQuota, setNewBoxQuota] = useState('100');
  const [editQuota, setEditQuota] = useState('');

  useEffect(() => {
    if (warehouseId) {
      loadBoxes();

      const channel = supabase
        .channel('boxes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'boxes' }, loadBoxes)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, loadBoxes)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [warehouseId]);

  const loadBoxes = async () => {
    if (!warehouseId) return;
    const { data } = await supabase.from('boxes').select('*').eq('warehouse_id', warehouseId).order('name');

    if (data) {
      const boxesWithCount = await Promise.all(
        data.map(async (box) => {
          const { count } = await supabase
            .from('parcels')
            .select('*', { count: 'exact', head: true })
            .eq('box_id', box.id);
          return { ...box, parcel_count: count || 0 };
        })
      );
      setBoxes(boxesWithCount);
    }
  };

  const handleCreateBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const quota = parseInt(newBoxQuota);

    if (!newBoxName.trim() || isNaN(quota) || quota <= 0 || !warehouseId) {
      return;
    }

    const { error } = await supabase.from('boxes').insert({
      name: newBoxName.trim(),
      quota,
      warehouse_id: warehouseId,
    });

    if (!error) {
      setNewBoxName('');
      setNewBoxQuota('100');
      setShowCreateForm(false);
      loadBoxes();
    }
  };

  const handleUpdateQuota = async (boxId: string) => {
    const quota = parseInt(editQuota);

    if (isNaN(quota) || quota <= 0) {
      return;
    }

    const { error } = await supabase
      .from('boxes')
      .update({ quota })
      .eq('id', boxId);

    if (!error) {
      setEditingBox(null);
      setEditQuota('');
      loadBoxes();
    }
  };

  const handleDeleteBox = async (box: BoxWithCount) => {
    if (box.parcel_count > 0) {
      alert(`Impossible de supprimer le box "${box.name}" car il contient ${box.parcel_count} colis`);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le box "${box.name}"?`)) {
      const { error } = await supabase.from('boxes').delete().eq('id', box.id);
      if (!error) {
        loadBoxes();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gérer les Boxes</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Créer un Box
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateBox} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Box
                </label>
                <input
                  type="text"
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  placeholder="ex: Box A1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quota
                </label>
                <input
                  type="number"
                  value={newBoxQuota}
                  onChange={(e) => setNewBoxQuota(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewBoxName('');
                  setNewBoxQuota('100');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {boxes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <BoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Aucun box créé pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du Box
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {boxes.map((box) => (
                  <tr key={box.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BoxIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{box.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{box.parcel_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingBox === box.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editQuota}
                            onChange={(e) => setEditQuota(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                          <button
                            onClick={() => handleUpdateQuota(box.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBox(null);
                              setEditQuota('');
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-700">{box.quota}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingBox(box.id);
                            setEditQuota(box.quota.toString());
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title="Modifier le quota"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box)}
                          className="text-red-600 hover:text-red-700"
                          title="Supprimer le box"
                          disabled={box.parcel_count > 0}
                        >
                          <Trash2 className={`w-5 h-5 ${box.parcel_count > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
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
