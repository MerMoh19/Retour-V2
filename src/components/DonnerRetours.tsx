import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box, Parcel } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { AlertTriangle, X, Filter, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useSound } from '../hooks/useSound';

interface ParcelWithBox extends Parcel {
  box_name: string;
}

export default function DonnerRetours() {
  const { warehouseId } = useWarehouseFilter();
  const [parcels, setParcels] = useState<ParcelWithBox[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [searchTracking, setSearchTracking] = useState('');
  const [filterBoutique, setFilterBoutique] = useState('');
  const [filterBoxId, setFilterBoxId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterMissing, setFilterMissing] = useState(false);
  const [boutiques, setBoutiques] = useState<string[]>([]);
  const [selectedBoutiqueBulk, setSelectedBoutiqueBulk] = useState('');
  const [bulkParcels, setBulkParcels] = useState<ParcelWithBox[]>([]);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { playSuccess, playError } = useSound();

  useEffect(() => {
    if (warehouseId) {
      loadBoxes();
      loadParcels();

      const channel = supabase
        .channel('donner-retours-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, loadParcels)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [warehouseId]);

  useEffect(() => {
    if (warehouseId) {
      loadParcels();
    }
  }, [searchTracking, filterBoutique, filterBoxId, filterDateFrom, filterDateTo, filterMissing, warehouseId]);

  const loadBoxes = async () => {
    if (!warehouseId) return;
    const { data } = await supabase.from('boxes').select('*').eq('warehouse_id', warehouseId).order('name');
    if (data) {
      setBoxes(data);
    }
  };

  const loadParcels = async () => {
    if (!warehouseId) return;
    let query = supabase.from('parcels').select('*').eq('warehouse_id', warehouseId);

    if (searchTracking) {
      query = query.ilike('tracking', `%${searchTracking}%`);
    }

    if (filterBoutique) {
      query = query.eq('boutique', filterBoutique);
    }

    if (filterBoxId) {
      query = query.eq('box_id', filterBoxId);
    }

    if (filterDateFrom) {
      query = query.gte('created_at', new Date(filterDateFrom).toISOString());
    }

    if (filterDateTo) {
      const dateTo = new Date(filterDateTo);
      dateTo.setHours(23, 59, 59, 999);
      query = query.lte('created_at', dateTo.toISOString());
    }

    if (filterMissing) {
      query = query.eq('is_missing', true);
    }

    const { data } = await query.order('created_at', { ascending: false });

    if (data) {
      const { data: allParcels } = await supabase.from('parcels').select('boutique').eq('warehouse_id', warehouseId);
      if (allParcels) {
        const uniqueBoutiques = [...new Set(allParcels.map((p) => p.boutique))].sort();
        setBoutiques(uniqueBoutiques);
      }

      const parcelsWithBox = await Promise.all(
        data.map(async (parcel) => {
          const { data: box } = await supabase
            .from('boxes')
            .select('name')
            .eq('id', parcel.box_id)
            .single();
          return { ...parcel, box_name: box?.name || 'Unknown' };
        })
      );
      setParcels(parcelsWithBox);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleMissing = async (parcelId: string, currentMissing: boolean) => {
    const { error } = await supabase
      .from('parcels')
      .update({
        is_missing: !currentMissing,
        missing_reported_at: !currentMissing ? new Date().toISOString() : null,
      })
      .eq('id', parcelId);

    if (!error) {
      loadParcels();
    }
  };



  const toggleBulkSelect = (parcelId: string) => {
    const newSelected = new Set(bulkSelected);
    if (newSelected.has(parcelId)) {
      newSelected.delete(parcelId);
    } else {
      newSelected.add(parcelId);
    }
    setBulkSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === bulkParcels.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(bulkParcels.map((p) => p.id)));
    }
  };

  const startBulkGive = async () => {
    if (!selectedBoutiqueBulk) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une boutique' });
      playError();
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from('parcels')
      .select('*')
      .eq('boutique', selectedBoutiqueBulk)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const parcelsWithBox = await Promise.all(
        data.map(async (parcel) => {
          const { data: box } = await supabase
            .from('boxes')
            .select('name')
            .eq('id', parcel.box_id)
            .single();
          return { ...parcel, box_name: box?.name || 'Unknown' };
        })
      );
      setBulkParcels(parcelsWithBox);
      setBulkSelected(new Set());
      setShowBulkModal(true);
      setMessage({ type: 'success', text: `${parcelsWithBox.length} coli(s) trouvé(s)` });
      playSuccess();
    } else {
      setMessage({ type: 'error', text: 'Aucun coli trouvé pour cette boutique' });
      playError();
    }

    setLoading(false);
  };



  const confirmBulkGive = async () => {
    const unselected = bulkParcels.filter((p) => !bulkSelected.has(p.id));

    const confirmMessage = `
Vous êtes sur le point de:
- Donner ${bulkSelected.size} coli(s) sélectionné(s) à la boutique
- Marquer ${unselected.length} coli(s) comme manquant(s)

Cette action ne peut pas être annulée. Continuer?
    `;

    if (!confirm(confirmMessage.trim())) {
      return;
    }

    setLoading(true);

    try {
      // Archive selected parcels with given_to_boutique = true
      const now = new Date().toISOString();
      const archivedData = Array.from(bulkSelected).map((id) => {
        const parcel = bulkParcels.find((p) => p.id === id);
        if (!parcel) return null;
        return {
          tracking: parcel.tracking,
          boutique: parcel.boutique,
          box_name: parcel.box_name,
          created_at: parcel.created_at,
          given_to_boutique: true,
          given_at: now,
        };
      }).filter(Boolean);

      if (archivedData.length > 0) {
        await supabase.from('archived_parcels').insert(archivedData);
      }

      // Delete archived parcels from active parcels
      for (const id of bulkSelected) {
        await supabase.from('parcels').delete().eq('id', id);
      }

      // Mark unselected parcels as missing
      for (const parcel of unselected) {
        await supabase
          .from('parcels')
          .update({
            is_missing: true,
            missing_reported_at: new Date().toISOString(),
          })
          .eq('id', parcel.id);
      }

      setMessage({ type: 'success', text: `${bulkSelected.size} coli(s) donné(s) à la boutique avec succès` });
      playSuccess();
      setBulkParcels([]);
      setBulkSelected(new Set());
      setSelectedBoutiqueBulk('');
      await loadParcels();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du traitement des colis' });
      playError();
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="w-8 h-8 text-red-700" />
        <h2 className="text-2xl font-bold text-gray-900">Donner des retours</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Donner à la boutique</h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Sélectionnez une boutique pour voir tous ses colis. Marquez ceux donnés, les autres seront marqués comme manquants.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner une boutique
            </label>
            <select
              value={selectedBoutiqueBulk}
              onChange={(e) => setSelectedBoutiqueBulk(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
            >
              <option value="">Sélectionner une boutique...</option>
              {boutiques.map((boutique) => (
                <option key={boutique} value={boutique}>
                  {boutique}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={startBulkGive}
            disabled={loading || !selectedBoutiqueBulk}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Voir les colis de la boutique
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechercher les colis</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de suivi
              </label>
              <input
                type="text"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boutique
              </label>
              <select
                value={filterBoutique}
                onChange={(e) => setFilterBoutique(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              >
                <option value="">Toutes les boutiques</option>
                {boutiques.map((boutique) => (
                  <option key={boutique} value={boutique}>
                    {boutique}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boîte
              </label>
              <select
                value={filterBoxId}
                onChange={(e) => setFilterBoxId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              >
                <option value="">Tous les boxes</option>
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date à
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Afficher les colis manquants
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMissing}
                  onChange={(e) => setFilterMissing(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-red-700"
                />
                <span className="text-sm text-gray-700">Uniquement les colis manquants</span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTracking('');
                  setFilterBoutique('');
                  setFilterBoxId('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterMissing(false);
                }}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">
            Trouvé <span className="font-semibold">{parcels.length}</span> coli(s)
          </p>
        </div>

        {parcels.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Aucun coli trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suivi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boîte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manquant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parcels.map((parcel) => (
                  <tr key={parcel.id} className={`hover:bg-gray-50 ${parcel.is_missing ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{parcel.tracking}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{parcel.boutique}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-700">{parcel.box_name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(parcel.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleMissing(parcel.id, parcel.is_missing)}
                        className={`p-2 rounded transition-colors ${
                          parcel.is_missing
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={parcel.is_missing ? 'Marquer comme trouvé' : 'Marquer comme manquant'}
                      >
                        {parcel.is_missing ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <X className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBulkModal && bulkParcels.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sélectionner les colis à donner à {selectedBoutiqueBulk}
              </h3>
              <p className="text-sm text-gray-600">
                {bulkSelected.size} / {bulkParcels.length} coli(s) sélectionné(s)
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={bulkSelected.size === bulkParcels.length && bulkParcels.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded"
                />
                <span className="font-medium text-blue-900">
                  {bulkSelected.size === bulkParcels.length && bulkParcels.length > 0
                    ? 'Désélectionner tout'
                    : 'Sélectionner tout'}
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bulkParcels.map((parcel) => (
                  <div
                    key={parcel.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(parcel.id)}
                      onChange={() => toggleBulkSelect(parcel.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{parcel.tracking}</p>
                      <p className="text-sm text-gray-500">
                        Boîte: {parcel.box_name} | {formatDate(parcel.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkSelected(new Set());
                }}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmBulkGive}
                disabled={loading || bulkSelected.size === 0}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Confirmer et donner à la boutique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
