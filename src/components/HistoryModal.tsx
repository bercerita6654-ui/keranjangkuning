import { X, History, Trash2, Upload, Inbox } from 'lucide-react';
import { HistoryItem } from '../types';
import { formatRupiah } from '../utils/helpers';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoadHistoryItem: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
}

export default function HistoryModal({
  isOpen,
  onClose,
  history,
  onLoadHistoryItem,
  onDeleteHistoryItem
}: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] transform transition-transform scale-100">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            Riwayat & Draft
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors active-tap">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-3 bg-gray-50/30">
          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-400 flex flex-col items-center justify-center">
              <Inbox className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium">Belum ada riwayat pesanan atau draft.</p>
            </div>
          ) : (
            history.map(item => {
              const dateObj = new Date(item.date);
              const dateStr = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{item.customerName || 'Tanpa Nama'}</span>
                        {item.isDraft ? (
                          <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Draft
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Selesai
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{dateStr}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary-600">{formatRupiah(item.total)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.cart.length} SKU</p>
                    </div>
                  </div>
                  {item.customerNote && (
                    <p className="text-xs text-gray-600 italic mb-3 line-clamp-1">" {item.customerNote} "</p>
                  )}
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => onLoadHistoryItem(item.id)}
                      className="flex-1 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold text-xs rounded-lg flex justify-center items-center gap-1.5 transition-colors active-tap"
                    >
                      <Upload className="w-3.5 h-3.5" /> Muat Data
                    </button>
                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="px-3 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors active-tap border border-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
