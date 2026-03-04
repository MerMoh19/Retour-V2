import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Parcel } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { BarChart3, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { getWilayaName } from '../utils/wilaya';

interface Stats {
  totalParcels: number;
  missingParcels: number;
  boutiques: string[];
  parcelsByBoutique: Record<string, number>;
  parcelsByWilaya: Record<string, number>;
  parcelsByBox: Record<string, number>;
  parcelsByCentreRetour: Record<string, number>;
  averageParcelAge: number;
  sdHdDistribution: Record<number, number>;
}

export default function Statistics() {
  const { warehouseId } = useWarehouseFilter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7);

  useEffect(() => {
    if (warehouseId) {
      loadStats();
    }
  }, [dateRange, warehouseId]);

  const loadStats = async () => {
    if (!warehouseId) return;
    setLoading(true);

    const { data: parcels } = await supabase.from('parcels').select('*').eq('warehouse_id', warehouseId);

    if (!parcels) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - dateRange);

    const filteredParcels = parcels.filter((p) => new Date(p.created_at) >= filterDate);

    const missingCount = filteredParcels.filter((p) => p.is_missing).length;
    const boutiquesSet = new Set(filteredParcels.map((p) => p.boutique).filter(Boolean));
    const parcelsByBoutique: Record<string, number> = {};
    const parcelsByWilaya: Record<string, number> = {};
    const parcelsByBox: Record<string, number> = {};
    const parcelsByCentreRetour: Record<string, number> = {};
    const sdHdDistribution: Record<number, number> = { 0: 0, 1: 0 };

    let totalAge = 0;
    let countWithAge = 0;

    for (const parcel of filteredParcels) {
      if (parcel.boutique) {
        parcelsByBoutique[parcel.boutique] = (parcelsByBoutique[parcel.boutique] || 0) + 1;
      }
      if (parcel.wilaya_destinataire) {
        parcelsByWilaya[parcel.wilaya_destinataire] =
          (parcelsByWilaya[parcel.wilaya_destinataire] || 0) + 1;
      }
      parcelsByBox[parcel.box_id] = (parcelsByBox[parcel.box_id] || 0) + 1;

      if (parcel.centre_retour) {
        parcelsByCentreRetour[parcel.centre_retour] = (parcelsByCentreRetour[parcel.centre_retour] || 0) + 1;
      }

      if (parcel.sd_hd !== null && parcel.sd_hd !== undefined) {
        sdHdDistribution[parcel.sd_hd] = (sdHdDistribution[parcel.sd_hd] || 0) + 1;
      }

      const createdDate = new Date(parcel.created_at);
      const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      totalAge += ageInDays;
      countWithAge++;
    }

    const averageAge = countWithAge > 0 ? Math.round(totalAge / countWithAge) : 0;

    setStats({
      totalParcels: filteredParcels.length,
      missingParcels: missingCount,
      boutiques: Array.from(boutiquesSet).sort(),
      parcelsByBoutique,
      parcelsByWilaya,
      parcelsByBox,
      parcelsByCentreRetour,
      averageParcelAge: averageAge,
      sdHdDistribution,
    });

    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const topBoutiques = Object.entries(stats.parcelsByBoutique)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topWilayas = Object.entries(stats.parcelsByWilaya)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-red-700" />
          <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Derniers</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-red-700"
          >
            <option value={1}>1 Jour</option>
            <option value={7}>7 Jours</option>
            <option value={30}>30 Jours</option>
            <option value={90}>90 Jours</option>
            <option value={365}>1 Année</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Colis</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalParcels}</p>
            </div>
            <Package className="w-12 h-12 text-red-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Colis Manquants</p>
              <p className="text-3xl font-bold text-red-600">{stats.missingParcels}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Boutiques Uniques</p>
              <p className="text-3xl font-bold text-gray-900">{stats.boutiques.length}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-700" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Âge Moyen (jours)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageParcelAge}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-red-700" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Boutiques</h3>
          <div className="space-y-3">
            {topBoutiques.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune donnée</p>
            ) : (
              topBoutiques.map(([boutique, count]) => (
                <div key={boutique} className="flex items-center justify-between">
                  <span className="text-gray-700">{boutique}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-red-700"
                        style={{
                          width: `${(count / stats.totalParcels) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Wilayas de Destination</h3>
          <div className="space-y-3">
            {topWilayas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune donnée</p>
            ) : (
              topWilayas.map(([wilaya, count]) => (
                <div key={wilaya} className="flex items-center justify-between">
                  <span className="text-gray-700">{getWilayaName(wilaya)}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-red-700"
                        style={{
                          width: `${(count / stats.totalParcels) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Colis par Centre de Retour</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.entries(stats.parcelsByCentreRetour).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucune donnée</p>
          ) : (
            Object.entries(stats.parcelsByCentreRetour)
              .sort(([, a], [, b]) => b - a)
              .map(([centre, count]) => (
                <div key={centre} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{centre || 'Non spécifié'}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-purple-600"
                        style={{
                          width: `${(count / stats.totalParcels) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution SD/HD</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">SD (SD)</span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{
                      width: `${
                        stats.totalParcels > 0
                          ? ((stats.sdHdDistribution[0] || 0) / stats.totalParcels) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="font-medium text-gray-900 w-12 text-right">
                  {stats.sdHdDistribution[0] || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">HD (HD)</span>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{
                      width: `${
                        stats.totalParcels > 0
                          ? ((stats.sdHdDistribution[1] || 0) / stats.totalParcels) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="font-medium text-gray-900 w-12 text-right">
                  {stats.sdHdDistribution[1] || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Toutes les Boutiques</h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {stats.boutiques.map((boutique) => (
              <div key={boutique} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700 truncate">{boutique}</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.parcelsByBoutique[boutique]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
