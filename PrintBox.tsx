import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Box, Parcel } from '../types/database';

interface PrintBoxProps {
  boxId: string;
}

interface PrintableParcel extends Parcel {
  index: number;
}

export default function PrintBox({ boxId }: PrintBoxProps) {
  const [box, setBox] = useState<Box | null>(null);
  const [parcels, setParcels] = useState<PrintableParcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [boxId]);

  useEffect(() => {
    if (box && parcels.length > 0) {
      window.print();
    }
  }, [box, parcels]);

  const loadData = async () => {
    const { data: boxData } = await supabase
      .from('boxes')
      .select('*')
      .eq('id', boxId)
      .single();

    const { data: parcelsData } = await supabase
      .from('parcels')
      .select('*')
      .eq('box_id', boxId)
      .order('created_at', { ascending: true });

    setBox(boxData);
    if (parcelsData) {
      const indexedParcels = parcelsData.map((p, idx) => ({
        ...p,
        index: idx + 1,
      }));
      setParcels(indexedParcels);
    }
    setLoading(false);
  };

  if (loading || !box) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleString();

  return (
    <div className="print-container bg-white">
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print-container {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
          .print-page {
            page-break-after: auto;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="text-center space-y-2 print-page">
          <h1 className="text-5xl font-bold text-gray-900">{box.name}</h1>
          <p className="text-sm text-gray-600">Printed on: {formattedDate}</p>
        </div>

        <div className="print-page">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  #
                </th>
                <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Tracking
                </th>
                <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Boutique
                </th>
                <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Entry Date
                </th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((parcel) => (
                <tr key={parcel.id} className="border-b border-gray-300">
                  <td className="border px-4 py-2 text-sm text-gray-900">{parcel.index}</td>
                  <td className="border px-4 py-2 text-sm text-gray-900 font-medium">{parcel.tracking}</td>
                  <td className="border px-4 py-2 text-sm text-gray-700">{parcel.boutique}</td>
                  <td className="border px-4 py-2 text-sm text-gray-700">
                    {new Date(parcel.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center pt-6 print-page border-t-2 border-gray-300 mt-8">
          <p className="text-sm font-semibold text-gray-900">
            Total Parcels: <span className="text-2xl">{parcels.length}</span>
          </p>
        </div>

        <div className="text-center pt-4 no-print">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="ml-2 px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
