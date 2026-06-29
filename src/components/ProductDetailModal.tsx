import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah, getGoogleDriveThumbnail } from '../utils/helpers';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (id: string) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart
}: ProductDetailModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [product]);

  if (!product) return null;

  const imgId = product.fotoProdukId || product.gambarStoryId;
  const imgUrl = getGoogleDriveThumbnail(imgId, 640);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] transform transition-transform scale-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            Detail & Foto Produk
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors active-tap">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Frame Foto Produk */}
          <div className="bg-gray-50 rounded-2xl overflow-hidden relative aspect-square flex items-center justify-center border border-gray-100 shadow-inner">
            {!imgLoaded && !imgError && (
              <div className="absolute animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-500 z-10"></div>
            )}
            <img
              src={imgError ? 'https://placehold.co/600x600/f8fafc/94a3b8?text=Gambar+Tidak+Ada' : imgUrl}
              alt="Foto Produk"
              className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true);
                setImgLoaded(true);
              }}
            />
          </div>

          <div>
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md tracking-wider">
              {product.sku}
            </span>
            <h3 className="font-black text-xl text-gray-800 mt-2.5 leading-snug">
              {product.nama}
            </h3>
            <p className="text-xs text-gray-400 font-semibold mt-1.5 uppercase tracking-wide">
              {product.kategori || '-'} | {product.merk || '-'}
            </p>
          </div>

          {/* Detail List Harga */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Eceran</span>
              <p className="text-sm font-black text-gray-800 mt-0.5">{formatRupiah(product.harga.eceran)}</p>
            </div>
            <div className="text-center border-x border-gray-200/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grosir</span>
              <p className="text-sm font-black text-gray-800 mt-0.5">{formatRupiah(product.harga.grosir)}</p>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Partai</span>
              <p className="text-sm font-black text-gray-800 mt-0.5">{formatRupiah(product.harga.partai)}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border-t border-gray-100 flex gap-3">
          <button
            onClick={() => {
              onAddToCart(product.id);
              onClose();
            }}
            className="active-tap flex-1 py-3.5 bg-primary-400 hover:bg-primary-500 text-primary-900 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary-400/30 text-sm"
          >
            <PlusCircle className="w-5 h-5" /> Tambah Keranjang
          </button>
          <button
            onClick={onClose}
            className="active-tap px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
