import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box, Parcel } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { Package, Box as BoxIcon, AlertTriangle, Clock, Printer, X } from 'lucide-react';

interface BoxWithCount extends Box {
  parcel_count: number;
}

interface ParcelWithBox extends Parcel {
  box_name: string;
}

export default function Dashboard() {
  const { warehouseId } = useWarehouseFilter();
  const [boxes, setBoxes] = useState<BoxWithCount[]>([]);
  const [totalParcels, setTotalParcels] = useState(0);
  const [oldParcels, setOldParcels] = useState(0);
  const [missingParcels, setMissingParcels] = useState<ParcelWithBox[]>([]);
  const [missingCount, setMissingCount] = useState(0);
  const [showMissingList, setShowMissingList] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!warehouseId) return;

    const { data: boxesData } = await supabase
      .from('boxes')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('name');

    const { count } = await supabase
      .from('parcels')
      .select('*', { count: 'exact', head: true })
      .eq('warehouse_id', warehouseId);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: oldCount } = await supabase
      .from('parcels')
      .select('*', { count: 'exact', head: true })
      .eq('warehouse_id', warehouseId)
      .lt('created_at', sevenDaysAgo.toISOString());

    const { data: missingData, count: missingCount } = await supabase
      .from('parcels')
      .select('*', { count: 'exact' })
      .eq('warehouse_id', warehouseId)
      .eq('is_missing', true)
      .order('missing_reported_at', { ascending: false });

    if (missingData) {
      const missingWithBox = await Promise.all(
        missingData.map(async (parcel) => {
          const { data: box } = await supabase
            .from('boxes')
            .select('name')
            .eq('id', parcel.box_id)
            .single();
          return { ...parcel, box_name: box?.name || 'Unknown' };
        })
      );
      setMissingParcels(missingWithBox);
    }

    setMissingCount(missingCount || 0);

    if (boxesData) {
      const boxesWithCount = await Promise.all(
        boxesData.map(async (box) => {
          const { count } = await supabase
            .from('parcels')
            .select('*', { count: 'exact', head: true })
            .eq('box_id', box.id);
          return { ...box, parcel_count: count || 0 };
        })
      );
      setBoxes(boxesWithCount);
    }

    setTotalParcels(count || 0);
    setOldParcels(oldCount || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (warehouseId) {
      loadData();

      const channel = supabase
        .channel('dashboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parcels' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'boxes' }, loadData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [warehouseId]);

  if (loading || !warehouseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {missingCount > 0 && (
        <div
          onClick={() => setShowMissingList(!showMissingList)}
          className="bg-red-50 border-2 border-red-300 p-6 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-700 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Alerte Colis Manquants</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{missingCount} colis manquant(s)</p>
              </div>
            </div>
            <p className="text-sm text-red-700">Cliquez pour voir la liste</p>
          </div>
        </div>
      )}

      {showMissingList && missingCount > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-red-50 flex items-center justify-between">
            <h3 className="font-semibold text-red-900">Colis Manquants</h3>
            <button
              onClick={() => setShowMissingList(false)}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-red-700" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boutique
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boîte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signalé Manquant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {missingParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-gray-50 bg-red-50">
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
                      <span className="text-sm text-gray-500">
                        {parcel.missing_reported_at
                          ? new Date(parcel.missing_reported_at).toLocaleString()
                          : 'Not specified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Colis</p>
              <p className="text-3xl font-bold text-gray-900">{totalParcels}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Boxes</p>
              <p className="text-3xl font-bold text-gray-900">{boxes.length}</p>
            </div>
            <BoxIcon className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Colis &gt; 7 Jours</p>
              <p className="text-3xl font-bold text-gray-900">{oldParcels}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Colis par Box</h2>
        </div>
        <div className="p-6">
          {boxes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun box créé pour le moment</p>
          ) : (
            <div className="space-y-3">
              {boxes.map((box) => {
                const percentage = (box.parcel_count / box.quota) * 100;
                const isNearQuota = percentage >= 90;
                return (
                  <div
                    key={box.id}
                    className={`p-4 rounded-lg border-2 ${
                      isNearQuota ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{box.name}</span>
                        {isNearQuota && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${isNearQuota ? 'text-red-700' : 'text-gray-700'}`}>
                          {box.parcel_count} / {box.quota}
                        </span>
                        <button
                          onClick={() => window.open(`/print/box/${box.id}`, '_blank')}
                          className="p-2 hover:bg-white rounded transition-colors text-gray-600 hover:text-blue-600"
                          title="Imprimer la liste des colis"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isNearQuota ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
