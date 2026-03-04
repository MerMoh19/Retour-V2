import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box, Parcel } from '../types/database';
import { Trash2, AlertCircle, CheckCircle, Filter } from 'lucide-react';

interface ParcelWithBox extends Parcel {
  box_name: string;
}

type ClearMode = 'search' | 'confirm' | 'complete';

export default function ClearParcels() {
  const [mode, setMode] = useState<ClearMode>('search');
  const [filterTracking, setFilterTracking] = useState('');
  const [filterBoutique, setFilterBoutique] = useState('');
  const [boutiques, setBoutiques] = useState<string[]>([]);
  const [parcelsToDelete, setParcelsToDelete] = useState<ParcelWithBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);

  useEffect(() => {
    loadBoutiques();
  }, []);

  const loadBoutiques = async () => {
    const { data: allParcels } = await supabase.from('parcels').select('boutique');
    if (allParcels) {
      const uniqueBoutiques = [...new Set(allParcels.map((p) => p.boutique))].sort();
      setBoutiques(uniqueBoutiques);
    }
  };

  const searchParcels = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!filterTracking.trim() && !filterBoutique) {
      alert('Please enter a tracking number or select a boutique');
      return;
    }

    setLoading(true);

    let query = supabase.from('parcels').select('*');

    if (filterTracking.trim()) {
      query = query.ilike('tracking', `%${filterTracking}%`);
    }

    if (filterBoutique) {
      query = query.eq('boutique', filterBoutique);
    }

    const { data } = await query.order('created_at', { ascending: false });

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
      setParcelsToDelete(parcelsWithBox);
      setMode('confirm');
    } else {
      alert('No parcels found matching your criteria');
    }

    setLoading(false);
  };

  const confirmClear = async () => {
    if (parcelsToDelete.length === 0) return;

    if (!confirm(`Are you sure you want to clear ${parcelsToDelete.length} parcel(s)? They will be archived.`)) {
      return;
    }

    setLoading(true);

    const archivedData = parcelsToDelete.map((p) => ({
      tracking: p.tracking,
      boutique: p.boutique,
      box_name: p.box_name,
      created_at: p.created_at,
    }));

    const parcelIds = parcelsToDelete.map((p) => p.id);

    try {
      await supabase.from('archived_parcels').insert(archivedData);

      for (const id of parcelIds) {
        await supabase.from('parcels').delete().eq('id', id);
      }

      setArchivedCount(parcelsToDelete.length);
      setMode('complete');
      setParcelsToDelete([]);
      setFilterTracking('');
      setFilterBoutique('');
    } catch (error) {
      alert('Error clearing parcels. Please try again.');
    }

    setLoading(false);
  };

  const reset = () => {
    setMode('search');
    setParcelsToDelete([]);
    setFilterTracking('');
    setFilterBoutique('');
  };

  if (mode === 'complete') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcels Cleared Successfully</h2>
          <p className="text-lg text-gray-600 mb-6">
            {archivedCount} parcel(s) have been archived and removed from active stock.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear More Parcels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="w-8 h-8 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900">Clear Parcels</h2>
      </div>

      {mode === 'search' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Selected parcels will be archived and removed from active stock. This action cannot be undone.
              </p>
            </div>

            <form onSubmit={searchParcels} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number (optional)
                  </label>
                  <input
                    type="text"
                    value={filterTracking}
                    onChange={(e) => setFilterTracking(e.target.value)}
                    placeholder="Search by tracking..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Partial matches supported</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boutique (optional)
                  </label>
                  <select
                    value={filterBoutique}
                    onChange={(e) => setFilterBoutique(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select a boutique...</option>
                    {boutiques.map((boutique) => (
                      <option key={boutique} value={boutique}>
                        {boutique}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-gray-500">
                  Specify either a tracking number, boutique, or both to search.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || (!filterTracking.trim() && !filterBoutique)}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Filter className="w-5 h-5" />
                Search Parcels
              </button>
            </form>
          </div>
        </div>
      )}

      {mode === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Ready to Clear</h3>
              <p className="text-sm text-orange-800">
                {parcelsToDelete.length} parcel(s) will be archived. Review them below before confirming.
              </p>
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
                      Box
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parcelsToDelete.map((parcel) => (
                    <tr key={parcel.id} className="hover:bg-gray-50">
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
                          {new Date(parcel.created_at).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setMode('search')}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={confirmClear}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Confirm & Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
