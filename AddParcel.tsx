import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Box } from '../types/database';
import { useWarehouseFilter } from '../hooks/useWarehouseFilter';
import { AlertCircle, CheckCircle, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { useSound } from '../hooks/useSound';

export default function AddParcel() {
  const { warehouseId } = useWarehouseFilter();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [boutiques, setBoutiques] = useState<string[]>([]);
  const [manualTracking, setManualTracking] = useState('');
  const [selectedBoutique, setSelectedBoutique] = useState('');
  const [formatValid, setFormatValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const { playSuccess, playError } = useSound();

  useEffect(() => {
    if (warehouseId) {
      loadBoxes();
      loadBoutiques();
    }
    if (!manualMode) {
      inputRef.current?.focus();
    }
  }, [manualMode, warehouseId]);

  const loadBoxes = async () => {
    if (!warehouseId) return;
    const { data } = await supabase.from('boxes').select('*').eq('warehouse_id', warehouseId).order('name');
    if (data) {
      setBoxes(data);
      if (data.length > 0 && !selectedBoxId) {
        setSelectedBoxId(data[0].id);
      }
    }
  };

  const loadBoutiques = async () => {
    if (!warehouseId) return;
    const { data: activeBoutiques } = await supabase
      .from('parcels')
      .select('boutique', { count: 'exact' })
      .eq('warehouse_id', warehouseId)
      .not('boutique', 'is', null);

    const { data: archivedBoutiques } = await supabase
      .from('archived_parcels')
      .select('boutique', { count: 'exact' })
      .eq('warehouse_id', warehouseId)
      .not('boutique', 'is', null);

    const allBoutiques = new Set<string>();
    if (activeBoutiques) {
      activeBoutiques.forEach((p) => {
        if (p.boutique) allBoutiques.add(p.boutique);
      });
    }
    if (archivedBoutiques) {
      archivedBoutiques.forEach((p) => {
        if (p.boutique) allBoutiques.add(p.boutique);
      });
    }

    const sortedBoutiques = Array.from(allBoutiques).sort();
    setBoutiques(sortedBoutiques);
    if (sortedBoutiques.length > 0 && !selectedBoutique) {
      setSelectedBoutique(sortedBoutiques[0]);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBoxId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un box d\'abord' });
      playError();
      return;
    }

    if (!qrInput.trim()) {
      return;
    }

    const parts = qrInput.split(',');

    if (parts.length < 4) {
      setMessage({ type: 'error', text: 'Format de code QR invalide' });
      playError();
      return;
    }

    // QR data structure: wilaya(0), tracking(1), commune(2), boutique(3), id_boutique(4), centre_retour(5), sd_hd(6), desk_destinataire(7), phone_client(8)
    const wilayaDestinataire = parts[0]?.trim() || null;
    const tracking = parts[1].trim();
    const commune = parts[2]?.trim() || null;
    const boutique = parts[3].trim();
    const idVendeur = parts[4]?.trim() || null;
    const centreRetour = parts[5]?.trim() || null;
    const sdHd = parts[6]?.trim() ? parseInt(parts[6].trim()) : null;
    const bureauDestinataire = parts[7]?.trim() || null;
    const phoneClient = parts[8]?.trim() || null;

    if (!tracking || !boutique) {
      setMessage({ type: 'error', text: 'Impossible d\'extraire le suivi ou la boutique' });
      playError();
      return;
    }

    const { data: existing } = await supabase
      .from('parcels')
      .select('id')
      .eq('tracking', tracking)
      .maybeSingle();

    if (existing) {
      setMessage({ type: 'error', text: `Le suivi ${tracking} existe déjà` });
      playError();
      return;
    }

    const { count } = await supabase
      .from('parcels')
      .select('*', { count: 'exact', head: true })
      .eq('box_id', selectedBoxId);

    const box = boxes.find((b) => b.id === selectedBoxId);
    if (box && count !== null && count >= box.quota) {
      setMessage({ type: 'error', text: `Le box ${box.name} a atteint sa limite (${box.quota})` });
      playError();
      return;
    }

    const { error} = await supabase.from('parcels').insert({
      tracking,
      boutique,
      box_id: selectedBoxId,
      warehouse_id: warehouseId!,
      wilaya_destinataire: wilayaDestinataire,
      commune,
      id_vendeur: idVendeur,
      bureau_destinataire: bureauDestinataire,
      sd_hd: sdHd,
      centre_retour: centreRetour,
      phone_client: phoneClient,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout du colis: ' + error.message });
      playError();
    } else {
      setMessage({ type: 'success', text: `Colis ${tracking} ajouté avec succès` });
      playSuccess();
      setTimeout(() => setMessage(null), 3000);
    }

    setQrInput('');
    inputRef.current?.focus();
  };

  const validateTrackingFormat = (tracking: string): boolean => {
    const trackingRegex = /^(YAL|ECH|ACC|RCC)-[A-Z0-9]{6}$/i;
    return trackingRegex.test(tracking.trim());
  };

  const handleManualTrackingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualTracking(value);
    
    if (value.trim().length > 0) {
      const isValid = validateTrackingFormat(value);
      setFormatValid(isValid);
    } else {
      setFormatValid(null);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBoxId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un box d\'abord' });
      playError();
      return;
    }

    if (!manualTracking.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un numéro de suivi' });
      playError();
      return;
    }

    if (!validateTrackingFormat(manualTracking)) {
      setMessage({ 
        type: 'error', 
        text: 'Format de suivi invalide. Attendu: YAL-A12BCD, ECH-A12BCD, ACC-A12BCD, ou RCC-A12BCD' 
      });
      playError();
      return;
    }

    if (!selectedBoutique) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une boutique' });
      playError();
      return;
    }

    const { data: existing } = await supabase
      .from('parcels')
      .select('id')
      .eq('tracking', manualTracking.trim())
      .maybeSingle();

    if (existing) {
      setMessage({ type: 'error', text: `Le suivi ${manualTracking} existe déjà` });
      playError();
      setManualTracking('');
      return;
    }

    const { count } = await supabase
      .from('parcels')
      .select('*', { count: 'exact', head: true })
      .eq('box_id', selectedBoxId);

    const box = boxes.find((b) => b.id === selectedBoxId);
    if (box && count !== null && count >= box.quota) {
      setMessage({ type: 'error', text: `Le box ${box.name} a atteint sa limite (${box.quota})` });
      playError();
      return;
    }

    const { error } = await supabase.from('parcels').insert({
      tracking: manualTracking.trim(),
      boutique: selectedBoutique,
      box_id: selectedBoxId,
      warehouse_id: warehouseId!,
    });

    if (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout du coli: ' + error.message });
      playError();
    } else {
      setMessage({ type: 'success', text: `Coli ${manualTracking} ajouté avec succès` });
      playSuccess();
      setTimeout(() => setMessage(null), 3000);
    }

    setManualTracking('');
    manualInputRef.current?.focus();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-red-700" />
            <h2 className="text-2xl font-bold text-gray-900">Ajouter un colis</h2>
          </div>
          <button
            onClick={() => setManualMode(!manualMode)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
            title={manualMode ? 'Passer au mode scanner' : 'Passer à la saisie manuelle'}
          >
            {manualMode ? (
              <>
                <ToggleRight className="w-5 h-5" />
                Scanner
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                Saisie manuelle
              </>
            )}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {manualMode ? (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un box
              </label>
              <select
                value={selectedBoxId}
                onChange={(e) => setSelectedBoxId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.name} (Quota: {box.quota})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking
              </label>
              <input
                ref={manualInputRef}
                type="text"
                value={manualTracking}
                onChange={handleManualTrackingChange}
                placeholder="Saisir le tracking (ex: YAL-A12BCD)"
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 text-lg transition-colors ${
                  formatValid === null
                    ? 'border-gray-300'
                    : formatValid
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                }`}
                autoFocus
                required
              />
              {formatValid === false && manualTracking.trim() && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  Format invalide. Format attendu: YAL-A12BCD, ECH-A12BCD, ACC-A12BCD, ou RCC-A12BCD
                </p>
              )}
              {formatValid === true && manualTracking.trim() && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Format valide ✓
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boutique
              </label>
              <select
                value={selectedBoutique}
                onChange={(e) => setSelectedBoutique(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Sélectionner une boutique</option>
                {boutiques.map((boutique) => (
                  <option key={boutique} value={boutique}>
                    {boutique}
                  </option>
                ))}
              </select>
            </div>

              <button
                type="submit"
                className="w-full bg-red-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors"
              >
                Ajouter le colis
              </button>
          </form>
        ) : (
          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un box
              </label>
              <select
                value={selectedBoxId}
                onChange={(e) => setSelectedBoxId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              >
                {boxes.map((box) => (
                  <option key={box.id} value={box.id}>
                    {box.name} (Quota: {box.quota})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scanner QR Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scanner le code-barres..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                autoFocus
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Format: value1,tracking,value3,boutique,...
              </p>
            </div>

              <button
                type="submit"
                className="w-full bg-red-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors"
              >
                Ajouter le colis
              </button>
          </form>
        )}
      </div>
    </div>
  );
}
