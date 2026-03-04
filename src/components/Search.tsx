import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box, Parcel } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { Search as SearchIcon, Filter, AlertTriangle, X } from 'lucide-react';

interface ParcelWithBox extends Parcel {
  box_name: string;
}

export default function Search() {
  const { warehouseId } = useWarehouseFilter();
  const [parcels, setParcels] = useState<ParcelWithBox[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [searchTracking, setSearchTracking] = useState('');
  const [filterBoutique, setFilterBoutique] = useState('');
  const [filterBoxId, setFilterBoxId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [boutiques, setBoutiques] = useState<string[]>([]);

  useEffect(() => {
    if (warehouseId) {
      loadBoxes();
      loadParcels();

      const channel = supabase
        .channel('search-changes')
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
  }, [searchTracking, filterBoutique, filterBoxId, filterDateFrom, filterDateTo, warehouseId]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SearchIcon className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-900">Search Parcels</h2>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Number
            </label>
            <input
              type="text"
              value={searchTracking}
              onChange={(e) => setSearchTracking(e.target.value)}
              placeholder="Search tracking..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Boutique
            </label>
            <select
              value={filterBoutique}
              onChange={(e) => setFilterBoutique(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Boutiques</option>
              {boutiques.map((boutique) => (
                <option key={boutique} value={boutique}>
                  {boutique}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Box
            </label>
            <select
              value={filterBoxId}
              onChange={(e) => setFilterBoxId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Boxes</option>
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTracking('');
                setFilterBoutique('');
                setFilterBoxId('');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm text-gray-600">
            Found <span className="font-semibold">{parcels.length}</span> parcel(s)
          </p>
        </div>

        {parcels.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No parcels found</p>
          </div>
        ) : (
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
                    Box
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Missing
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
                        title={parcel.is_missing ? 'Mark as found' : 'Mark as missing'}
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
    </div>
  );
}
