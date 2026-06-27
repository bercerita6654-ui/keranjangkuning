import { useEffect } from 'react';
import { X, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (text: string) => void;
}

export default function BarcodeScanner({ isOpen, onClose, onScanSuccess }: BarcodeScannerProps) {
  useEffect(() => {
    if (isOpen) {
      const html5QrCode = new Html5Qrcode("reader");
      const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };
      
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
          onClose();
          html5QrCode.stop().catch(err => console.error("Error stopping scanner", err));
        },
        () => {
          // Failure callback
        }
      ).catch(err => {
        console.error(err);
        onClose();
      });

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().catch(err => console.error("Error stopping scanner in cleanup", err));
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/85 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-transform scale-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
            <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
              <ScanLine className="w-5 h-5" />
            </div>
            Scan Barcode SKU
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors active-tap">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-black w-full relative flex items-center justify-center min-h-[300px]">
          <div id="reader" className="w-full h-full text-center text-white flex items-center justify-center font-medium">
            Memuat kamera...
          </div>
        </div>
        <div className="p-4 bg-white text-center text-sm text-gray-500 font-medium border-t border-gray-100">
          Arahkan kamera HP Anda ke barcode produk
        </div>
      </div>
    </div>
  );
}
