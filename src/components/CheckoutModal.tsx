import { useState } from 'react';
import { X, Check, FileSpreadsheet, Copy, CheckCircle, User, Phone, StickyNote } from 'lucide-react';
import { CartItem } from '../types';
import { formatNumber, formatRupiah } from '../utils/helpers';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  cart: CartItem[];
  total: number;
  onDownloadExcel: () => void;
  onCopyAndSave: (onSuccess: () => void) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  customerNote,
  cart,
  total,
  onDownloadExcel,
  onCopyAndSave
}: CheckoutModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopyAndSave(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 2000);
    });
  };

  const getItemPrice = (item: CartItem): number => {
    if (item.priceTier === 'custom') {
      return item.customPrice;
    }
    return item.product.harga[item.priceTier] || 0;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] transform transition-transform scale-100">
        <div className="bg-gradient-to-br from-primary-300 to-primary-500 p-6 text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-primary-200/50">
            <CheckCircle className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <Check className="text-primary-500 w-8 h-8 font-bold" />
            </div>
            <h2 className="text-2xl font-black text-primary-900">Pesanan Siap!</h2>
            <p className="text-primary-800 text-sm font-medium mt-1">Satu langkah lagi untuk menyelesaikan</p>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="mb-5 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="w-4 h-4 text-primary-500" />
              <span className="text-gray-500 font-medium">Pemesan:</span>
              <strong className="text-gray-800 ml-auto">{customerName || 'Pelanggan'}</strong>
            </div>
            {customerPhone && (
              <div className="flex items-center gap-2 mb-1.5">
                <Phone className="w-4 h-4 text-primary-500" />
                <span className="text-gray-500 font-medium">No. HP:</span>
                <strong className="text-gray-800 ml-auto">{customerPhone}</strong>
              </div>
            )}
            {customerNote && (
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 text-primary-500 mt-0.5" />
                <span className="text-gray-500 font-medium whitespace-nowrap">Catatan:</span>
                <strong className="text-gray-800 ml-auto text-right">{customerNote}</strong>
              </div>
            )}
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Ringkasan Barang</h3>
          <div className="space-y-3 mb-6 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
            {cart.map((item, idx) => {
              const price = getItemPrice(item);
              return (
                <div key={item.product.id} className={`flex justify-between items-start text-sm ${idx !== cart.length - 1 ? 'border-b border-gray-200/60 pb-2 mb-2' : ''}`}>
                  <div className="pr-3 flex-1">
                    <p className="font-bold text-gray-800 leading-tight">{item.qty}x {item.product.nama}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.priceTier.toUpperCase()} @ {formatNumber(price)}</p>
                    {item.note && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        <span className="italic">Catatan:</span> {item.note}
                      </p>
                    )}
                  </div>
                  <div className="font-black text-gray-800 whitespace-nowrap mt-0.5">
                    {formatNumber(item.qty * price)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-lg font-black border-t-2 border-dashed border-gray-200 pt-5 mt-2 px-1">
            <span className="text-gray-600">Grand Total</span>
            <span className="text-2xl text-primary-600">{formatRupiah(total)}</span>
          </div>
        </div>

        <div className="p-5 bg-white flex flex-col gap-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDownloadExcel}
              className="active-tap py-3 bg-primary-50 text-primary-600 border border-primary-200 rounded-xl font-bold hover:bg-primary-100 transition-colors flex flex-col items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-xs">Download Excel</span>
            </button>
            <button
              onClick={handleCopy}
              className={`active-tap py-3 text-white rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-md ${
                copied ? 'bg-[#1DA851]' : 'bg-[#25D366] hover:bg-[#1DA851] shadow-[#25D366]/20'
              }`}
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs">{copied ? 'Tersalin & Tersimpan' : 'Salin & Save'}</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="active-tap w-full py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors mt-2"
          >
            Tutup Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
