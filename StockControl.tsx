import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import type { Box } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { Archive, Download, Trash2 } from 'lucide-react';

export default function StockControl() {
  const { warehouseId } = useWarehouseFilter();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (warehouseId) {
      loadBoxes();
    }
  }, [warehouseId]);

  const loadBoxes = async () => {
    if (!warehouseId) return;
    const { data } = await supabase.from('boxes').select('*').eq('warehouse_id', warehouseId).order('name');
    if (data) {
      setBoxes(data);
    }
  };

  const clearBox = async () => {
    if (!selectedBoxId) {
      alert('Veuillez d\'abord sélectionner un box');
      return;
    }

    const box = boxes.find((b) => b.id === selectedBoxId);
    if (!box) return;

    if (!confirm(`Êtes-vous sûr de vouloir vider tous les colis du box "${box.name}"? Ils seront archivés.`)) {
      return;
    }

    setLoading(true);

    const { data: parcels } = await supabase
      .from('parcels')
      .select('*')
      .eq('box_id', selectedBoxId);

    if (parcels && parcels.length > 0) {
      const archivedParcels = parcels.map((p) => ({
        tracking: p.tracking,
        boutique: p.boutique,
        box_name: box.name,
        warehouse_id: warehouseId,
        created_at: p.created_at,
      }));

      await supabase.from('archived_parcels').insert(archivedParcels);
      await supabase.from('parcels').delete().eq('box_id', selectedBoxId);

      alert(`${parcels.length} colis archivé(s) depuis "${box.name}"`);
    } else {
      alert('Aucun coli à archiver dans ce box');
    }

    setLoading(false);
  };

  const clearAllStock = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider TOUT le stock? Tous les colis seront archivés.')) {
      return;
    }

    if (!confirm('Cela archivera tous les colis de tous les boxes. Cette action ne peut pas être annulée. Continuer?')) {
      return;
    }

    setLoading(true);

    const { data: parcels } = await supabase.from('parcels').select('*, box:boxes(name)').eq('warehouse_id', warehouseId!);

    if (parcels && parcels.length > 0) {
      const archivedParcels = parcels.map((p: any) => ({
        tracking: p.tracking,
        boutique: p.boutique,
        box_name: p.box?.name || 'Unknown',
        warehouse_id: warehouseId!,
        created_at: p.created_at,
      }));

      await supabase.from('archived_parcels').insert(archivedParcels);
      await supabase.from('parcels').delete().eq('warehouse_id', warehouseId!);

      alert(`${parcels.length} colis archivé(s)`);
    } else {
      alert('Aucun coli à archiver');
    }

    setLoading(false);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colis');

    const wscols = Object.keys(data[0]).map(() => ({ wch: 20 }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, filename);
  };

  const exportActiveParcels = async () => {
    setLoading(true);
    const { data } = await supabase.from('parcels').select('*, box:boxes(name)');

    if (data) {
      const exportData = data.map((p: any) => ({
        tracking: p.tracking,
        boutique: p.boutique,
        wilaya_destinataire: p.wilaya_destinataire || '',
        commune: p.commune || '',
        id_vendeur: p.id_vendeur || '',
        bureau_destinataire: p.bureau_destinataire || '',
        sd_hd: p.sd_hd || '',
        centre_retour: p.centre_retour || '',
        phone_client: p.phone_client || '',
        box: p.box?.name || 'Unknown',
        is_missing: p.is_missing ? 'Oui' : 'Non',
        created_at: new Date(p.created_at).toLocaleString(),
      }));
      exportToExcel(exportData, `active_parcels_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    setLoading(false);
  };

  const exportArchivedParcels = async () => {
    setLoading(true);
    const { data } = await supabase.from('archived_parcels').select('*');

    if (data) {
      const exportData = data.map((p) => ({
        tracking: p.tracking,
        boutique: p.boutique,
        box: p.box_name,
        created_at: new Date(p.created_at).toLocaleString(),
        archived_at: new Date(p.archived_at).toLocaleString(),
      }));
      exportToExcel(exportData, `archived_parcels_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Contrôle de Stock</h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Vider le Stock
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un Box à Vider
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                >
                  <option value="">Sélectionner un box...</option>
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={clearBox}
                  disabled={!selectedBoxId || loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Vider le Box
                </button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={clearAllStock}
                disabled={loading}
                className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Vider Tout le Stock
              </button>
              <p className="mt-2 text-sm text-gray-500">
                Cela archivera tous les colis de tous les boxes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exporter les Données
        </h3>

        <div className="space-y-3">
          <button
            onClick={exportActiveParcels}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter les Colis Actifs Excel
          </button>

          <button
            onClick={exportArchivedParcels}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter les Colis Archivés Excel
          </button>
        </div>
      </div>
    </div>
  );
}
