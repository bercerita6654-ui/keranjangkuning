import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Palette,
  History,
  User,
  Phone,
  Package,
  RefreshCw,
  Search,
  ScanLine,
  Store,
  Warehouse,
  Plus,
  Minus,
  PlusCircle,
  MinusCircle,
  Trash2,
  PenLine,
  Download,
  Image as ImageIcon,
  Maximize2,
  X,
  StickyNote,
  Save,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  Printer,
  AlertTriangle,
  AlertCircle,
  Upload,
  Check,
  Share2,
  Copy
} from 'lucide-react';
import { jsPDF } from 'jspdf';

// Types & Helpers
import { Product, CartItem, HistoryItem } from './types';
import {
  parseCSV,
  parsePrice,
  formatNumber,
  formatRupiah,
  hexToRgb,
  rgbToValuesString,
  mixColor,
  getFormattedDate,
  isNewUpdate
} from './utils/helpers';

// Components
import BarcodeScanner from './components/BarcodeScanner';
import CheckoutModal from './components/CheckoutModal';
import HistoryModal from './components/HistoryModal';
import ProductDetailModal from './components/ProductDetailModal';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTCxz1GPm7QU9IS1yBiSjvIdNTLUsvvplOCyT_R3XH4O-LuVbHoY_bXn1LTH5lpnlolJ29BhUgEdnFm/pub?gid=240870130&single=true&output=csv';
const REF_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTCxz1GPm7QU9IS1yBiSjvIdNTLUsvvplOCyT_R3XH4O-LuVbHoY_bXn1LTH5lpnlolJ29BhUgEdnFm/pub?gid=1564332470&single=true&output=csv';
const STORAGE_KEY = 'keranjangKuning_history';

// Helper to convert Image to Base64
const loadImageBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject(new Error("Gagal membuat 2D context"));
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

const CatalogImage = ({ src, alt, className, onError }: { src: string; alt: string; className: string; onError: (e: any) => void }) => {
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-300 animate-bounce" />
        </div>
      )}
      <img
        src={currentSrc}
        loading="lazy"
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          onError(e);
        }}
        className={`${className} transition-all duration-700 ease-out ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      />
    </div>
  );
};

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<'shop' | 'catalog'>('shop');
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Memuat Produk Utama...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Core Data Lists
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Filters & Search (Belanja)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filters & Search (Katalog)
  const [searchTermCatalog, setSearchTermCatalog] = useState('');
  const [currentPageCatalog, setCurrentPageCatalog] = useState(1);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [catalogBrands, setCatalogBrands] = useState<string[]>([]);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [windowCatalogSource, setWindowCatalogSource] = useState<'story' | 'foto'>('story');
  const [catalogCart, setCatalogCart] = useState<string[]>([]);

  // Dropdowns Lists populated dynamically
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  // Prices State (Tiers, Custom pricing)
  const [globalPriceTier, setGlobalPriceTier] = useState<'eceran' | 'grosir' | 'partai'>('eceran');
  const [catalogTiers, setCatalogTiers] = useState<Record<string, 'eceran' | 'grosir' | 'partai' | 'custom'>>({});
  const [catalogCustomPrices, setCatalogCustomPrices] = useState<Record<string, number>>({});
  const [catalogPromoType, setCatalogPromoType] = useState<Record<string, 'none' | 'percent' | 'strikethrough'>>(() => {
    try {
      const saved = localStorage.getItem('gm_catalog_promo_type');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [catalogPromoValue, setCatalogPromoValue] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('gm_catalog_promo_val');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gm_catalog_promo_type', JSON.stringify(catalogPromoType));
    } catch (e) {
      console.error(e);
    }
  }, [catalogPromoType]);

  useEffect(() => {
    try {
      localStorage.setItem('gm_catalog_promo_val', JSON.stringify(catalogPromoValue));
    } catch (e) {
      console.error(e);
    }
  }, [catalogPromoValue]);

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // PDF Export States
  const [pdfGrid, setPdfGrid] = useState(() => {
    try {
      return localStorage.getItem('gm_pdf_grid') || '2x2';
    } catch (e) {
      return '2x2';
    }
  });
  const [pdfPrice, setPdfPrice] = useState(() => {
    try {
      return localStorage.getItem('gm_pdf_price') || 'active';
    } catch (e) {
      return 'active';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gm_pdf_grid', pdfGrid);
    } catch (e) {
      console.error(e);
    }
  }, [pdfGrid]);

  useEffect(() => {
    try {
      localStorage.setItem('gm_pdf_price', pdfPrice);
    } catch (e) {
      console.error(e);
    }
  }, [pdfPrice]);

  // Themes
  const [theme, setTheme] = useState<'yellow' | 'blue' | 'emerald' | 'rose' | 'purple' | 'custom'>('yellow');
  const [customHexColor, setCustomHexColor] = useState('#facc15');
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [shareProductData, setShareProductData] = useState<{
    product: Product;
    imgUrl: string;
    shareText: string;
  } | null>(null);
  const [pdfNameModalOpen, setPdfNameModalOpen] = useState(false);
  const [pdfCustomName, setPdfCustomName] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  // Load Initial Data & History
  useEffect(() => {
    fetchData();
    // Load local history
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
    // Check if running in iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Sync theme to root element and custom variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'custom' && customHexColor) {
      const rgb = hexToRgb(customHexColor);
      if (rgb) {
        const shades = {
          50: mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.95),
          100: mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.85),
          200: mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.70),
          300: mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.50),
          400: mixColor(rgb, { r: 255, g: 255, b: 255 }, 0.25),
          500: rgb,
          600: mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.15),
          700: mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.35),
          800: mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.55),
          900: mixColor(rgb, { r: 0, g: 0, b: 0 }, 0.75),
        };
        
        Object.entries(shades).forEach(([sh, color]) => {
          root.style.setProperty(`--theme-${sh}`, rgbToValuesString(color.r, color.g, color.b));
        });
        root.removeAttribute('data-theme');
      }
    } else {
      root.setAttribute('data-theme', theme);
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].forEach(sh => {
        root.style.removeProperty(`--theme-${sh}`);
      });
    }
  }, [theme, customHexColor]);

  // Adjust PDF grid option when source changes
  useEffect(() => {
    if (windowCatalogSource === 'story') {
      setPdfGrid('2x2');
    } else {
      setPdfGrid('4x4');
    }
    setCatalogCart([]);
    currentPageCatalog && setCurrentPageCatalog(1);
  }, [windowCatalogSource]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const fetchData = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
      setLoading(true);
      setLoadingText('Memperbarui Data...');
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      const mainRes = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
      if (!mainRes.ok) throw new Error('Gagal mengambil data produk utama');
      const mainText = await mainRes.text();
      const parsed = parseCSV(mainText);

      let initialProducts: Product[] = [];

      if (parsed.length > 0) {
        const headers = parsed[0].map(h => h.toLowerCase().trim());
        const colIdx = {
          nama: headers.findIndex(h => h.includes('nama')),
          sku: headers.findIndex(h => h === 'sku' || h.includes('sku')),
          unit: headers.findIndex(h => h.includes('unit')),
          stokGudang: headers.findIndex(h => h.includes('gudang')),
          stokToko: headers.findIndex(h => h.includes('toko')),
          hpp: headers.findIndex(h => h.includes('hpp')),
          eceran: headers.findIndex(h => h.includes('eceran')),
          grosir: headers.findIndex(h => h.includes('grosir')),
          partai: headers.findIndex(h => h.includes('partai')),
        };

        initialProducts = parsed.slice(1).map((row, index) => {
          if (!row[colIdx.nama]) return null;
          const skuValue = colIdx.sku !== -1 && row[colIdx.sku] ? row[colIdx.sku].toString().trim() : '-';
          return {
            id: skuValue !== '-' ? skuValue : `PROD-${index}`,
            nama: colIdx.nama !== -1 ? row[colIdx.nama] : '-',
            sku: skuValue,
            kategori: '-',
            merk: '-',
            gambarStoryId: null,
            lastUpdateStory: '-',
            fotoProdukId: null,
            lastUpdateFoto: '-',
            unit: colIdx.unit !== -1 ? row[colIdx.unit] : '-',
            stok: {
              gudang: colIdx.stokGudang !== -1 ? parseInt(row[colIdx.stokGudang] || '0') : 0,
              toko: colIdx.stokToko !== -1 ? parseInt(row[colIdx.stokToko] || '0') : 0,
            },
            harga: {
              hpp: colIdx.hpp !== -1 ? parsePrice(row[colIdx.hpp]) : 0,
              eceran: colIdx.eceran !== -1 ? parsePrice(row[colIdx.eceran]) : 0,
              grosir: colIdx.grosir !== -1 ? parsePrice(row[colIdx.grosir]) : 0,
              partai: colIdx.partai !== -1 ? parsePrice(row[colIdx.partai]) : 0,
            }
          };
        }).filter((p): p is Product => p !== null);
      }

      setProducts(initialProducts);
      setLoading(false);
      setIsRefreshing(false);
      if (refresh) showToast("Data produk berhasil diperbarui!", "success");

      // Load reference data in background
      fetch(`${REF_CSV_URL}&t=${new Date().getTime()}`)
        .then(res => {
          if (res.ok) return res.text();
          throw new Error('Gagal memuat ref');
        })
        .then(refText => {
          const refParsed = parseCSV(refText);
          const refMap: Record<string, any> = {};

          if (refParsed.length > 0) {
            const refHeaders = refParsed[0].map(h => h.toLowerCase().trim());
            const refSkuIdx = refHeaders.findIndex(h => h === 'sku' || h.includes('sku') || h.includes('kode'));

            for (let i = 1; i < refParsed.length; i++) {
              const row = refParsed[i];
              const sku = refSkuIdx !== -1 && row[refSkuIdx]
                ? row[refSkuIdx].toString().trim().toUpperCase()
                : (row[0] ? row[0].toString().trim().toUpperCase() : null);

              if (sku) {
                const gambarStoryVal = row.length > 19 && row[19] ? row[19].toString().trim() : null;
                const lastUpdateStoryVal = row.length > 20 && row[20] ? row[20].toString().trim() : '-';
                const fotoProdukVal = row.length > 21 && row[21] ? row[21].toString().trim() : null;
                const lastUpdateFotoVal = row.length > 22 && row[22] ? row[22].toString().trim() : '-';

                const extractId = (val: string | null) => {
                  if (!val || val === '-') return null;
                  const match = val.match(/[-\w]{25,}/);
                  return match ? match[0] : null;
                };

                refMap[sku] = {
                  kategori: row.length > 4 && row[4] ? row[4].trim() : '-',
                  merk: row.length > 6 && row[6] ? row[6].trim() : '-',
                  gambarStoryId: extractId(gambarStoryVal),
                  lastUpdateStory: lastUpdateStoryVal,
                  fotoProdukId: extractId(fotoProdukVal),
                  lastUpdateFoto: lastUpdateFotoVal
                };
              }
            }
          }

          setProducts(prev => {
            const updated = prev.map(p => {
              const skuKey = p.sku.toUpperCase();
              if (refMap[skuKey]) {
                return {
                  ...p,
                  kategori: refMap[skuKey].kategori,
                  merk: refMap[skuKey].merk,
                  gambarStoryId: refMap[skuKey].gambarStoryId,
                  lastUpdateStory: refMap[skuKey].lastUpdateStory,
                  fotoProdukId: refMap[skuKey].fotoProdukId,
                  lastUpdateFoto: refMap[skuKey].lastUpdateFoto
                };
              }
              return p;
            });

            const cats = new Set<string>();
            const brs = new Set<string>();
            updated.forEach(p => {
              if (p.kategori && p.kategori !== '-') cats.add(p.kategori);
              if (p.merk && p.merk !== '-') brs.add(p.merk);
            });
            setAvailableCategories(Array.from(cats).sort());
            setAvailableBrands(Array.from(brs).sort());

            return updated;
          });
        })
        .catch(err => console.error("Error loading references in bg", err));

    } catch (err: any) {
      setLoading(false);
      setIsRefreshing(false);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memuat data');
    }
  };

  // Filters (Belanja)
  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    return products.filter(p => {
      const matchSearch = query.length === 0 || query.every(w => p.nama.toLowerCase().includes(w) || p.sku.toLowerCase().includes(w));
      const matchCat = !selectedCategory || p.kategori === selectedCategory;
      const matchBrand = !selectedBrand || p.merk === selectedBrand;
      return matchSearch && matchCat && matchBrand;
    });
  }, [products, searchTerm, selectedCategory, selectedBrand]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Filters (Katalog)
  const filteredCatalogProducts = useMemo(() => {
    const catalogOnly = products.filter(p => windowCatalogSource === 'story' ? p.gambarStoryId : p.fotoProdukId);
    const query = searchTermCatalog.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    return catalogOnly.filter(p => {
      const matchSearch = query.length === 0 || query.every(w => p.nama.toLowerCase().includes(w) || p.sku.toLowerCase().includes(w));
      const matchCat = catalogCategories.length === 0 || catalogCategories.includes(p.kategori);
      const matchBrand = catalogBrands.length === 0 || catalogBrands.includes(p.merk);
      return matchSearch && matchCat && matchBrand;
    });
  }, [products, searchTermCatalog, catalogCategories, catalogBrands, windowCatalogSource]);

  const paginatedCatalogProducts = useMemo(() => {
    const start = (currentPageCatalog - 1) * itemsPerPage;
    return filteredCatalogProducts.slice(start, start + itemsPerPage);
  }, [filteredCatalogProducts, currentPageCatalog, itemsPerPage]);

  const totalCatalogPages = Math.ceil(filteredCatalogProducts.length / itemsPerPage);

  // Cart Functions
  const getItemPrice = (item: CartItem): number => {
    if (item.priceTier === 'custom') return item.customPrice;
    return item.product.harga[item.priceTier] || 0;
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (getItemPrice(item) * item.qty), 0);
  }, [cart]);

  const cartQty = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.product.id === productId);
    const selectedTier = catalogTiers[productId] || globalPriceTier;
    const selectedCustomPrice = catalogCustomPrices[productId] !== undefined
      ? catalogCustomPrices[productId]
      : (product.harga[selectedTier] || product.harga.eceran || 0);

    if (existing) {
      setCart(cart.map(item => item.product.id === productId ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product, qty: 1, priceTier: selectedTier, customPrice: selectedCustomPrice, note: '' }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (item) {
      const newQty = item.qty + delta;
      if (newQty > 0) {
        setCart(cart.map(i => i.product.id === productId ? { ...i, qty: newQty } : i));
      } else {
        removeCartItem(productId);
      }
    }
  };

  const updateCartQtyManual = (productId: string, val: number) => {
    if (val > 0) {
      setCart(cart.map(i => i.product.id === productId ? { ...i, qty: val } : i));
    } else if (val === 0) {
      removeCartItem(productId);
    }
  };

  const removeCartItem = (productId: string) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const updateCartPriceTier = (productId: string, newTier: 'eceran' | 'grosir' | 'partai' | 'custom') => {
    setCart(cart.map(i => {
      if (i.product.id === productId) {
        const customPrice = newTier === 'custom' ? (i.customPrice || i.product.harga.eceran || 0) : i.customPrice;
        return { ...i, priceTier: newTier, customPrice };
      }
      return i;
    }));
  };

  const updateCartCustomPrice = (productId: string, val: number) => {
    setCart(cart.map(i => i.product.id === productId ? { ...i, customPrice: Math.max(0, val) } : i));
  };

  const updateCartItemNote = (productId: string, note: string) => {
    setCart(cart.map(i => i.product.id === productId ? { ...i, note } : i));
  };

  const handleProductPriceTierChange = (productId: string, tier: 'eceran' | 'grosir' | 'partai' | 'custom') => {
    // If already in cart, update cart
    const inCart = cart.some(i => i.product.id === productId);
    if (inCart) {
      updateCartPriceTier(productId, tier);
    } else {
      setCatalogTiers(prev => ({ ...prev, [productId]: tier }));
      if (tier === 'custom' && catalogCustomPrices[productId] === undefined) {
        const p = products.find(prod => prod.id === productId);
        setCatalogCustomPrices(prev => ({ ...prev, [productId]: p?.harga.eceran || 0 }));
      }
    }
  };

  const handleProductCustomPriceChange = (productId: string, val: number) => {
    const inCart = cart.some(i => i.product.id === productId);
    if (inCart) {
      updateCartCustomPrice(productId, val);
    } else {
      setCatalogCustomPrices(prev => ({ ...prev, [productId]: val }));
    }
  };

  // Mobile cart drawer state
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Catalog PDF selection Functions
  const toggleCatalogCart = (productId: string) => {
    if (catalogCart.includes(productId)) {
      setCatalogCart(catalogCart.filter(id => id !== productId));
    } else {
      setCatalogCart([...catalogCart, productId]);
    }
  };

  const clearCatalogCart = () => {
    setCatalogCart([]);
    showToast("Keranjang PDF telah dikosongkan.", "success");
  };

  const selectAllCatalogFiltered = () => {
    const filteredIds = filteredCatalogProducts.map(p => p.id);
    const nextList = Array.from(new Set([...catalogCart, ...filteredIds]));
    setCatalogCart(nextList);
    showToast(`${filteredIds.length} produk terpilih ke PDF`, "success");
  };

  const handleShareProduct = async (
    product: Product,
    imgUrl: string,
    tier: 'eceran' | 'grosir' | 'partai' | 'custom',
    customPrice?: number
  ) => {
    const activePrice = tier === 'eceran' ? product.harga.eceran
                      : tier === 'grosir' ? product.harga.grosir
                      : tier === 'partai' ? product.harga.partai
                      : (customPrice || 0);
    const priceStr = formatRupiah(activePrice);
    
    // WhatsApp formatted text with bold styling
    const shareText = `🛍️ *${product.nama}*\n📌 *SKU:* ${product.sku}\n💰 *Harga:* ${priceStr}\n\nGlobal Mart - Alat Tulis Kantor & Sekolah`;

    if (navigator.share && !isInIframe) {
      try {
        // Coba download gambarnya dulu agar bisa di-share sebagai file (sangat optimal di WhatsApp / Instagram)
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const file = new File([blob], `${product.sku}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: product.nama,
            text: shareText,
          });
          showToast("Berhasil membagikan katalog!", "success");
          return;
        }
      } catch (shareFileError) {
        if ((shareFileError as Error).name === 'AbortError') {
          return; // User cancelled, do not open fallback
        }
        console.warn("Gagal share file gambar, mencoba share text+URL:", shareFileError);
      }

      try {
        // Fallback share teks + URL gambar
        await navigator.share({
          title: product.nama,
          text: shareText,
          url: imgUrl,
        });
        showToast("Berhasil membagikan katalog!", "success");
        return;
      } catch (shareTextError) {
        // Jika user mencancel share, abaikan saja
        if ((shareTextError as Error).name === 'AbortError') {
          return;
        }
        console.warn("Gagal navigator.share:", shareTextError);
      }
    }

    // Jika Web Share API tidak didukung, dibatalkan karena hal lain, atau sedang di dalam iframe:
    // tampilkan modal fallback buatan kita yang sangat interaktif dan lengkap.
    setShareProductData({
      product,
      imgUrl,
      shareText,
    });
  };

  // History Actions
  const saveToHistory = (isDraft = false) => {
    if (cart.length === 0) return;
    const dateStr = new Date().toISOString();
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: dateStr,
      isDraft,
      customerName: customerName || 'Tanpa Nama',
      customerPhone,
      customerNote,
      cart: JSON.parse(JSON.stringify(cart)),
      total: cartTotal
    };

    const nextHistory = [newItem, ...history];
    setHistory(nextHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    } catch (e) {
      console.error(e);
    }

    if (isDraft) {
      showToast("Berhasil menyimpan keranjang sebagai Draft!", "success");
    }
  };

  const loadHistoryItem = (id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      setCustomerName(item.customerName !== 'Tanpa Nama' ? item.customerName : '');
      setCustomerPhone(item.customerPhone || '');
      setCustomerNote(item.customerNote || '');
      setCart(item.cart);
      setHistoryOpen(false);
      showToast("Data berhasil dimuat kembali ke keranjang!", "success");
    }
  };

  const deleteHistoryItem = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      const nextHistory = history.filter(h => h.id !== id);
      setHistory(nextHistory);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Export functions
  const handleDownloadExcel = () => {
    const name = customerName || 'Pelanggan';
    let csvContent = "SKU,Nama Produk,Unit,Qty,Harga,Total,Catatan\n";
    
    cart.forEach(item => {
      const price = getItemPrice(item);
      const total = price * item.qty;
      const safeName = `"${item.product.nama.replace(/"/g, '""')}"`;
      const safeNote = item.note ? `"${item.note.replace(/"/g, '""')}"` : '""';
      csvContent += `"${item.product.sku}",${safeName},"${item.product.unit}",${item.qty},${price},${total},${safeNote}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Pesanan_${name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAndSave = (onSuccess: () => void) => {
    const name = customerName || 'Pelanggan';
    let orderText = `${getFormattedDate()}\n\n`;
    orderText += `Nama Customer : ${name}\n\n`;
    orderText += `List Orderan :\n`;
    
    cart.forEach((item, index) => {
      const price = getItemPrice(item);
      const subtotal = price * item.qty;
      orderText += `${index + 1}. (${item.product.sku}) ${item.product.nama} = ${item.qty} ${item.product.unit} (${formatNumber(price)}) = ${formatNumber(subtotal)}\n`;
      if (item.note) {
        orderText += `    *Catatan: ${item.note}*\n`;
      }
    });

    orderText += `\nTotal SKU : ${cart.length}\n`;
    orderText += `Total Transaksi : ${formatNumber(cartTotal)}\n`;

    if (customerNote) {
      orderText += `\nCatatan Umum Pesanan : ${customerNote}`;
    }

    // Save as completed
    saveToHistory(false);

    // Copy to clipboard
    const textArea = document.createElement("textarea");
    textArea.value = orderText;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (err) {
      console.error('Gagal menyalin:', err);
      showToast("Gagal menyalin teks pesanan.", "error");
    }
    document.body.removeChild(textArea);
  };

  const generatePDF = async (customFilename?: string | any) => {
    if (catalogCart.length === 0) {
      showToast("Pilih minimal 1 produk ke keranjang PDF terlebih dahulu.", "error");
      return;
    }

    const targetProducts = products.filter(p => catalogCart.includes(p.id));
    if (targetProducts.length === 0) {
      showToast("Tidak ada produk valid yang terpilih.", "error");
      return;
    }

    if (typeof customFilename !== 'string' || !customFilename.trim()) {
      const dateStr = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      setPdfCustomName(`Katalog_GlobalMart_${dateStr}`);
      setPdfNameModalOpen(true);
      return;
    }

    setLoading(true);
    setLoadingText("Mengekstrak Gambar & Membuat PDF... Mohon tunggu.");

    try {
      let templateBgBase64: string | null = null;
      try {
        templateBgBase64 = await loadImageBase64('https://lh3.googleusercontent.com/d/1snbWuLd5T2u1YAtvpX9Sc_kcR2FMItt2');
      } catch (e) {
        console.warn("Gagal meload template dari Google Drive. Mencoba file lokal...");
        try {
          templateBgBase64 = await loadImageBase64('/Katalog Produk.jpg');
        } catch (localError) {
          console.warn("Gagal meload template Katalog Produk.jpg. Melanjutkan dengan background vektor.");
        }
      }

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      
      const cols = parseInt(pdfGrid.charAt(0)); 
      const rows = parseInt(pdfGrid.charAt(2)); 
      
      const headerH = 30; 
      const footerH = 25; 
      
      const baseMarginSide = 12;
      const spacingX = cols <= 4 ? 6 : 4; 
      const spacingY = cols <= 4 ? 8 : 5; 
      
      const usableWidth = pageWidth - (baseMarginSide * 2);
      const usableHeight = pageHeight - headerH - footerH;

      const maxCellW = (usableWidth - (spacingX * (cols - 1))) / cols;
      const maxCellH = (usableHeight - (spacingY * (rows - 1))) / rows;

      const ratio = windowCatalogSource === 'story' ? (5 / 4) : 1; 
      const textReserveArea = cols <= 2 ? 22 : (cols <= 4 ? 16 : 12);
      
      const imageBoxWidth = Math.min(maxCellW, (maxCellH - textReserveArea) / ratio);
      const imageBoxHeight = imageBoxWidth * ratio;

      const cellWidth = imageBoxWidth;
      const cellHeight = imageBoxHeight + textReserveArea;

      const totalGridW = (cols * cellWidth) + (spacingX * (cols - 1));
      const totalGridH = (rows * cellHeight) + (spacingY * (rows - 1));

      const marginSide = (pageWidth - totalGridW) / 2;
      const marginTop = headerH + (usableHeight - totalGridH) / 2;

      let currentX = marginSide;
      let currentY = marginTop;
      let currentCol = 0;
      let currentRow = 0;

      const drawTemplate = () => {
        if (templateBgBase64) {
          doc.addImage(templateBgBase64, 'JPEG', 0, 0, pageWidth, pageHeight);
        } else {
          // 1. White Page Background
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          
          // 2. Deep Blue Header Bar
          doc.setFillColor(12, 76, 163);
          doc.rect(0, 0, pageWidth, 16, 'F');
          
          // 3. Spaced "K A T A L O G   P R O D U K" Text
          doc.setFont("helvetica", "bold");
          doc.setFontSize(19);
          doc.setTextColor(255, 255, 255);
          doc.text("K A T A L O G   P R O D U K", 135, 11.5, { align: "center" });
          
          // 4. Yellow Badge on Left
          doc.setFillColor(255, 224, 0);
          doc.roundedRect(0, 0, 55, 17, 3, 3, 'F');
          doc.rect(0, 0, 52, 14, 'F'); // keep top-left sharp
          
          // Mascot Logo drawing (cute stylized book/pencil icon)
          doc.setFillColor(220, 20, 60); // red bag/book
          doc.rect(4, 3.5, 5, 6, 'F');
          doc.setFillColor(255, 255, 255);
          doc.rect(5, 4.5, 3, 4, 'F');
          doc.setFillColor(220, 20, 60);
          doc.rect(6, 5.5, 1, 2, 'F');
          // small yellow accent pencil
          doc.setFillColor(255, 224, 0);
          doc.rect(10, 4.5, 1.5, 4, 'F');
          
          // Global Mart Title Texts
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(220, 20, 60); // Red
          doc.text("GLOBAL MART", 12.5, 8.5);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(4.2);
          doc.setTextColor(12, 76, 163); // Blue
          doc.text("ALAT TULIS KANTOR & SEKOLAH", 12.5, 12.5);
          
          // 5. Footer Layout (Height = 19mm, starts at y = 278)
          const footerY = 278;
          
          // Yellow Footer Part (width = 135)
          doc.setFillColor(255, 224, 0);
          doc.rect(0, footerY, 135, 19, 'F');
          
          // Blue Footer Part (width = 75)
          doc.setFillColor(12, 76, 163);
          doc.rect(135, footerY, 75, 19, 'F');
          
          // Yellow Footer Content (3 Columns)
          const col1X = 22.5;
          const col2X = 67.5;
          const col3X = 112.5;
          
          // Column 1: Produk Original
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.6);
          doc.circle(col1X - 15, footerY + 9.5, 2.5);
          doc.line(col1X - 16.2, footerY + 9.5, col1X - 15, footerY + 10.7);
          doc.line(col1X - 15, footerY + 10.7, col1X - 13.5, footerY + 8);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text("PRODUK\nORIGINAL", col1X - 10, footerY + 8);
          
          // Column 2: Harga Bersahabat
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.6);
          doc.line(col2X - 17, footerY + 11, col2X - 14, footerY + 8);
          doc.line(col2X - 14, footerY + 8, col2X - 11, footerY + 11);
          doc.line(col2X - 11, footerY + 11, col2X - 14, footerY + 14);
          doc.line(col2X - 14, footerY + 14, col2X - 17, footerY + 11);
          doc.circle(col2X - 14.5, footerY + 10.5, 0.4, 'F');
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text("HARGA\nBERSAHABAT", col2X - 9, footerY + 8);
          
          // Column 3: Lengkap & Terpercaya
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.6);
          doc.line(col3X - 17, footerY + 9, col3X - 17, footerY + 13);
          doc.line(col3X - 17, footerY + 13, col3X - 13, footerY + 13);
          doc.line(col3X - 13, footerY + 13, col3X - 12, footerY + 10);
          doc.line(col3X - 12, footerY + 10, col3X - 14, footerY + 10);
          doc.line(col3X - 14, footerY + 10, col3X - 14, footerY + 6);
          doc.line(col3X - 14, footerY + 6, col3X - 16, footerY + 6);
          doc.line(col3X - 16, footerY + 6, col3X - 16, footerY + 9);
          doc.line(col3X - 16, footerY + 9, col3X - 17, footerY + 9);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0);
          doc.text("LENGKAP\n& TERPERCAYA", col3X - 9, footerY + 8);
          
          // Blue Footer Content
          doc.setFont("helvetica", "bolditalic");
          doc.setFontSize(13.5);
          doc.setTextColor(255, 255, 255);
          doc.text("#PASTILEBIHPUAS", 172.5, footerY + 6.5, { align: "center" });
          
          // Social circles and text
          doc.setFillColor(255, 255, 255);
          doc.circle(146, footerY + 13, 1.8, 'F');
          doc.circle(151.5, footerY + 13, 1.8, 'F');
          doc.circle(157, footerY + 13, 1.8, 'F');
          
          doc.setTextColor(12, 76, 163);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(4.5);
          doc.text("d", 146, footerY + 14.2, { align: "center" });
          doc.text("f", 151.5, footerY + 14.2, { align: "center" });
          doc.text("i", 157, footerY + 14.2, { align: "center" });
          
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text("globalmart.id", 182, footerY + 13.7, { align: "center" });
        }
      };

      drawTemplate();

      for (let i = 0; i < targetProducts.length; i++) {
        const progressPercent = Math.round((i / targetProducts.length) * 100);
        setLoadingText(`Memproses produk ${i + 1} dari ${targetProducts.length} (${progressPercent}%)...`);

        const p = targetProducts[i];
        const imgId = windowCatalogSource === 'story' ? p.gambarStoryId : p.fotoProdukId;
        
        let imgB64: string | null = null;
        if (imgId && imgId !== '-') {
          try {
            // Menggunakan ukuran =w800 untuk PDF agar proses kompilasi PDF 10x lebih cepat & anti-crash di HP, 
            // dengan kualitas cetak gambar yang tetap sangat tajam.
            imgB64 = await loadImageBase64(`https://lh3.googleusercontent.com/d/${imgId}=w800`);
          } catch (err) {
            console.warn(`Gagal meload gambar produk ${p.sku}:`, err);
          }
        }

        try {
          doc.setDrawColor(15, 85, 200); 
          doc.setLineWidth(0.8);
          doc.rect(currentX, currentY, cellWidth, imageBoxHeight);
          
          const pad = 1;
          if (imgB64) {
            try {
              doc.addImage(imgB64, 'JPEG', currentX + pad, currentY + pad, cellWidth - (pad * 2), imageBoxHeight - (pad * 2));
            } catch (addImgErr) {
              console.warn("Gagal menggambar image ke canvas PDF, menggunakan placeholder:", p.sku, addImgErr);
              imgB64 = null; // fallback to placeholder drawing below
            }
          }
          
          if (!imgB64) {
            // Gambar placeholder abu-abu jika gambar tidak ada atau gagal dimuat
            doc.setFillColor(245, 247, 250);
            doc.rect(currentX + pad, currentY + pad, cellWidth - (pad * 2), imageBoxHeight - (pad * 2), 'F');
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(cols <= 2 ? 10 : (cols <= 4 ? 7 : 5));
            doc.setTextColor(150, 150, 150);
            doc.text("No Image", currentX + (cellWidth / 2), currentY + (imageBoxHeight / 2), { align: "center" });
          }
          
          doc.setFontSize(cols <= 2 ? 10 : (cols <= 4 ? 8 : 6));
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          
          const fullTextName = `[${p.sku}] ${p.nama}`;
          const splitText = doc.splitTextToSize(fullTextName, cellWidth) as string[];
          
          const maxLines = windowCatalogSource === 'foto' ? 4 : 2;
          let textToPrint = splitText.slice(0, maxLines);
          if (splitText.length > maxLines) {
            textToPrint[maxLines - 1] = textToPrint[maxLines - 1].substring(0, textToPrint[maxLines - 1].length - 3) + '...';
          }

          const textStartY = currentY + imageBoxHeight + (cols <= 4 ? 4 : 3);
          doc.text(textToPrint, currentX, textStartY);

          const lineHeightPx = doc.getLineHeight() * 0.3527; 
          const priceStartY = textStartY + (textToPrint.length * lineHeightPx) + 0.5;

          if (pdfPrice !== 'none') {
            let priceVal = 0;
            if (pdfPrice === 'active') {
              const activeTier = catalogTiers[p.id] || globalPriceTier;
              priceVal = activeTier === 'custom' ? (catalogCustomPrices[p.id] || 0) : (p.harga ? p.harga[activeTier] : 0);
            } else {
              priceVal = (p.harga ? p.harga[pdfPrice as 'eceran' | 'grosir' | 'partai'] : 0) || 0;
            }

            const promoType = catalogPromoType[p.id] || 'none';
            const promoValue = catalogPromoValue[p.id] || 0;

            let hasPromo = false;
            let finalPrice = priceVal;
            let originalPrice = 0;
            let promoText = '';

            if (promoType === 'percent' && promoValue > 0) {
              hasPromo = true;
              originalPrice = priceVal;
              finalPrice = Math.round(priceVal * (1 - promoValue / 100));
              promoText = `-${promoValue}%`;
            } else if (promoType === 'strikethrough' && promoValue > 0) {
              hasPromo = true;
              originalPrice = priceVal;
              finalPrice = promoValue;
              promoText = 'PROMO';
            }

            if (hasPromo) {
              // Draw original price (crossed out) in gray
              doc.setFontSize(cols <= 2 ? 7.5 : (cols <= 4 ? 6.5 : 5));
              doc.setFont("helvetica", "normal");
              doc.setTextColor(140, 140, 140);
              const origText = `Rp ${formatNumber(originalPrice)}`;
              doc.text(origText, currentX + 1, priceStartY);
              
              // Draw line over origText
              const textWidth = doc.getTextWidth(origText);
              doc.setDrawColor(140, 140, 140);
              doc.setLineWidth(0.25);
              const lineY = priceStartY - (cols <= 2 ? 0.7 : (cols <= 4 ? 0.5 : 0.4));
              doc.line(currentX + 1, lineY, currentX + 1 + textWidth, lineY);
              
              // Draw promo label
              if (promoText) {
                doc.setFontSize(cols <= 2 ? 6.5 : (cols <= 4 ? 5.5 : 4.5));
                doc.setFont("helvetica", "bold");
                doc.setTextColor(220, 30, 30);
                doc.text(` (${promoText})`, currentX + 1 + textWidth + 1, priceStartY);
              }
              
              // Draw final price below it
              const nextLineY = priceStartY + (cols <= 2 ? 3.3 : (cols <= 4 ? 2.6 : 2.0));
              doc.setFontSize(cols <= 2 ? 9 : (cols <= 4 ? 8 : 6));
              doc.setFont("helvetica", "bold");
              doc.setTextColor(180, 40, 40);
              const unitText = (p.unit || '').toUpperCase();
              doc.text(`Rp ${formatNumber(finalPrice)}${unitText ? ' /' + unitText : ''}`, currentX + 1, nextLineY);
            } else {
              // Draw normal price
              doc.setFontSize(cols <= 2 ? 9 : (cols <= 4 ? 8 : 6));
              doc.setFont("helvetica", "normal");
              doc.setTextColor(180, 40, 40); 
              const unitText = (p.unit || '').toUpperCase();
              doc.text(`Rp ${formatNumber(priceVal)}${unitText ? ' /' + unitText : ''}`, currentX + 1, priceStartY);
            }
          }
          
          currentCol++;
          if (currentCol >= cols) {
            currentCol = 0;
            currentRow++;
            currentX = marginSide;
            currentY += cellHeight + spacingY;
          } else {
            currentX += cellWidth + spacingX;
          }

          if (currentRow >= rows) {
            if (i < targetProducts.length - 1) {
              doc.addPage();
              drawTemplate(); 
              currentX = marginSide;
              currentY = marginTop;
              currentCol = 0;
              currentRow = 0;
            }
          }

        } catch (cardErr) {
          console.error("Gagal menggambar card produk:", p.sku, cardErr);
        }
      }

      setLoadingText("Menyimpan file PDF (100%)...");

      // Selalu gunakan doc.save() agar jsPDF menangani download asli secara optimal di PC maupun Mobile.
      let finalName = customFilename.trim();
      if (!finalName.toLowerCase().endsWith('.pdf')) {
        finalName += '.pdf';
      }
      doc.save(finalName);
      
      if (isInIframe) {
        showToast("PDF siap! Jika tidak terdownload otomatis, silakan klik ikon 'Buka di Tab Baru' di kanan atas layar.", "success");
      } else {
        showToast("PDF Katalog berhasil diunduh!", "success");
      }

    } catch (err) {
      console.error("PDF Error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast(`Terjadi kesalahan sistem saat memproses PDF: ${errMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] text-gray-800 font-sans min-h-screen pb-32 lg:pb-8 relative">
      
      {/* Iframe warning banner */}
      {isInIframe && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-center text-xs md:text-sm font-bold flex flex-wrap items-center justify-center gap-2 shadow-md relative z-[100] animate-fadeIn">
          <span>⚠️ <b>Perhatian (Mode Preview IFrame):</b> Download file di handphone dibatasi oleh browser di dalam frame ini.</span>
          <span className="underline bg-amber-600 px-2 py-0.5 rounded text-white">
            Silakan klik ikon "Buka di Tab Baru" di kanan atas layar Anda
          </span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-primary-500"></div>
            <p className="text-primary-700 font-semibold animate-pulse">{loadingText}</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && (
        <div className="fixed inset-0 bg-gray-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl shadow-lg max-w-md w-full text-center">
            <AlertTriangle className="mx-auto w-12 h-12 mb-3 text-red-500" />
            <h2 className="font-bold text-lg mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Custom Toast Popup */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 opacity-100 translate-y-0">
          <div className={`px-5 py-3 rounded-full shadow-xl flex items-center gap-2.5 font-semibold text-sm bg-white border ${toast.type === 'success' ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200'}`}>
            <AlertCircle className="w-5 h-5" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-[90] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-400 p-2 rounded-xl">
              <ShoppingCart className="text-primary-900 w-6 h-6" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight hidden sm:block">Keranjang Kuning</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Dropdown */}
            <div className="relative">
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="flex items-center gap-1 font-bold bg-white text-gray-700 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors active-tap cursor-pointer"
              >
                <Palette className="w-4 h-4 text-primary-500" />
                <span className="hidden sm:inline text-sm">Tema</span>
              </button>
              
              {themeMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 flex flex-col gap-1 z-[10000]">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Pilih Tema Warna</h3>
                  
                  <button onClick={() => { setTheme('yellow'); setThemeMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-[#facc15] shadow-sm border border-gray-200"></span> Kuning
                  </button>
                  <button onClick={() => { setTheme('blue'); setThemeMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-[#3b82f6] shadow-sm border border-gray-200"></span> Biru
                  </button>
                  <button onClick={() => { setTheme('emerald'); setThemeMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-[#10b981] shadow-sm border border-gray-200"></span> Hijau
                  </button>
                  <button onClick={() => { setTheme('rose'); setThemeMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-[#f43f5e] shadow-sm border border-gray-200"></span> Merah
                  </button>
                  <button onClick={() => { setTheme('purple'); setThemeMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer">
                    <span className="w-4 h-4 rounded-full bg-[#a855f7] shadow-sm border border-gray-200"></span> Ungu
                  </button>
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group">
                      <span className="text-sm font-semibold text-gray-700">Custom...</span>
                      <input
                        type="color"
                        value={customHexColor}
                        onChange={(e) => {
                          setCustomHexColor(e.target.value);
                          setTheme('custom');
                        }}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1 font-bold bg-white text-gray-700 px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors active-tap cursor-pointer"
            >
              <History className="w-4 h-4 text-primary-500" />
              <span className="hidden sm:inline text-sm">Riwayat</span>
            </button>
            <div className="flex items-center gap-1.5 font-bold bg-primary-100 px-3 sm:px-4 py-1.5 rounded-full text-primary-800">
              <span>{cartQty}</span> <span className="text-sm font-medium">Items</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative">
        
        {/* Left Column: Products & Catalog */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active-tap cursor-pointer ${
                activeTab === 'shop'
                  ? 'bg-primary-400 text-primary-900 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" /> Belanja
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all active-tap cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-primary-400 text-primary-900 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Katalog Gambar
            </button>
          </div>

          {/* Tab View: Belanja (Shop) */}
          {activeTab === 'shop' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Customer Info Card */}
              <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
                  <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
                    <User className="w-5 h-5" />
                  </div>
                  Data Pelanggan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                      Nama Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <User className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="Nama Lengkap Pemesan"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                      No. WhatsApp <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-primary-500 transition-colors">
                        <Phone className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="Contoh: 08123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Product List */}
              <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
                <div className="flex flex-col mb-6 gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
                        <Package className="w-5 h-5" />
                      </div>
                      Daftar Produk
                    </h2>
                    
                    <button
                      onClick={() => fetchData(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors border border-primary-200 shadow-sm active-tap cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'spin-slow' : ''}`} />
                      <span className="hidden sm:inline">Refresh Data</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-gray-50/50 text-sm transition-all"
                          placeholder="Cari nama produk / SKU acak..."
                        />
                      </div>
                      <button
                        onClick={() => setScannerOpen(true)}
                        className="active-tap p-2.5 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-xl transition-colors flex-shrink-0 shadow-sm border border-primary-200 h-full aspect-square flex items-center justify-center cursor-pointer"
                        title="Scan Barcode"
                      >
                        <ScanLine className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex gap-2 flex-col sm:flex-row w-full xl:w-auto">
                      <select
                        value={globalPriceTier}
                        onChange={(e) => setGlobalPriceTier(e.target.value as any)}
                        className="w-full sm:w-auto text-sm border border-gray-200 rounded-xl py-2.5 px-3 bg-white text-primary-700 font-bold focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors cursor-pointer outline-none shadow-sm flex-shrink-0"
                      >
                        <option value="eceran">Semua: Eceran</option>
                        <option value="grosir">Semua: Grosir</option>
                        <option value="partai">Semua: Partai</option>
                      </select>

                      {availableCategories.length > 0 && (
                        <div className="relative w-full sm:w-44 flex-shrink-0">
                          <select
                            value={selectedCategory}
                            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                            className="w-full text-sm border border-gray-200 rounded-xl py-2.5 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors cursor-pointer outline-none shadow-sm"
                          >
                            <option value="">Semua Kategori</option>
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {availableBrands.length > 0 && (
                        <div className="relative w-full sm:w-44 flex-shrink-0">
                          <select
                            value={selectedBrand}
                            onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
                            className="w-full text-sm border border-gray-200 rounded-xl py-2.5 px-3 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors cursor-pointer outline-none shadow-sm"
                          >
                            <option value="">Semua Merk</option>
                            {availableBrands.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Grid */}
                <div className="flex flex-col gap-4">
                  {paginatedProducts.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <Package className="w-16 h-16 mb-3 text-gray-300" />
                      <p className="font-medium">Produk tidak ditemukan.</p>
                    </div>
                  ) : (
                    paginatedProducts.map(product => {
                      const cartItem = cart.find(i => i.product.id === product.id);
                      const isInCart = !!cartItem;
                      
                      const activeTier = isInCart ? cartItem.priceTier : (catalogTiers[product.id] || globalPriceTier);
                      const activeCustomPrice = isInCart ? cartItem.customPrice : (catalogCustomPrices[product.id] || 0);

                      return (
                        <div key={product.id} className="border border-gray-100 bg-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 hover:shadow-lg transition-all duration-300 group">
                          <div className="flex-1 flex flex-col justify-start">
                            <div className="flex items-center mb-2 flex-wrap gap-1">
                              <span className="text-[11px] font-bold text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md tracking-wider">
                                {product.sku}
                              </span>
                              {product.merk && product.merk !== '-' && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 ml-2">
                                  {product.merk}
                                </span>
                              )}
                            </div>
                            
                            <h3
                              onClick={() => setSelectedProductDetail(product)}
                              className="font-bold text-gray-800 leading-snug mb-3 hover:text-primary-600 cursor-pointer hover:underline transition-colors flex items-start gap-1.5"
                              title="Klik untuk lihat rincian & foto produk"
                            >
                              <span>{product.nama}</span>
                              <ImageIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            </h3>
                            
                            <div className="flex gap-2.5 mt-auto text-[11px] font-semibold">
                              <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                <Store className="w-3.5 h-3.5" /> Toko: {product.stok.toko}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                <Warehouse className="w-3.5 h-3.5" /> Gudang: {product.stok.gudang}
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-72 flex flex-col justify-end sm:border-l sm:border-gray-100 sm:pl-5">
                            <select
                              value={activeTier}
                              onChange={(e) => handleProductPriceTierChange(product.id, e.target.value as any)}
                              className="w-full text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2.5 mb-2 appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary-400 transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_10px_center]"
                            >
                              <option value="eceran">Eceran: {formatRupiah(product.harga.eceran)} /{product.unit}</option>
                              <option value="grosir">Grosir: {formatRupiah(product.harga.grosir)} /{product.unit}</option>
                              <option value="partai">Partai: {formatRupiah(product.harga.partai)} /{product.unit}</option>
                              <option value="custom">Harga Custom</option>
                            </select>
                            
                            {activeTier === 'custom' && (
                              <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-400 shadow-sm mb-2">
                                <span className="bg-gray-100 text-gray-500 px-3 py-2 text-xs font-bold border-r border-gray-300">Rp</span>
                                <input
                                  type="number"
                                  value={activeCustomPrice || ''}
                                  onChange={(e) => handleProductCustomPriceChange(product.id, parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 text-sm font-bold text-gray-800 outline-none"
                                  placeholder="0"
                                />
                              </div>
                            )}

                            <div className="transition-transform duration-150">
                              {isInCart ? (
                                <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-xl p-1 shadow-sm mt-1">
                                  <button
                                    onClick={() => updateCartQty(product.id, -1)}
                                    className={`active-tap w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm border cursor-pointer ${
                                      cartItem.qty === 1 ? 'text-red-500 hover:bg-red-50 border-red-100' : 'text-primary-600 hover:bg-primary-100 border-primary-100'
                                    }`}
                                  >
                                    {cartItem.qty === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                  </button>
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] font-bold text-primary-600 uppercase tracking-wider mb-[-2px]">Qty</span>
                                    <input
                                      type="number"
                                      value={cartItem.qty}
                                      onChange={(e) => updateCartQtyManual(product.id, parseInt(e.target.value) || 0)}
                                      className="text-sm font-black w-12 text-center bg-transparent outline-none text-primary-800 focus:bg-white focus:ring-2 focus:ring-primary-400 rounded-md transition-all"
                                      min="0"
                                    />
                                  </div>
                                  <button
                                    onClick={() => updateCartQty(product.id, 1)}
                                    className="active-tap w-10 h-10 flex items-center justify-center bg-white rounded-lg text-primary-600 hover:bg-primary-100 shadow-sm border border-primary-100 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product.id)}
                                  className="active-tap w-full py-2.5 bg-primary-400 hover:bg-primary-500 text-primary-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-primary-200 text-sm mt-1 cursor-pointer"
                                >
                                  <PlusCircle className="w-4.5 h-4.5" />
                                  <span>Tambah Keranjang</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {filteredProducts.length > 0 && (
                  <div className="mt-8 border-t border-gray-100 pt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">Tampilkan:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none bg-white font-medium shadow-sm"
                      >
                        <option value="20">20 / Hal</option>
                        <option value="50">50 / Hal</option>
                        <option value="100">100 / Hal</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                      <button
                        onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg text-gray-600 disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all active-tap cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-bold text-gray-700 px-3">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg text-gray-600 disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all active-tap cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab View: Katalog Gambar (Catalog Images) */}
          {activeTab === 'catalog' && (
            <div className="flex flex-col gap-6 bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-gray-100 animate-fadeIn">
              
              <div className="flex flex-col mb-1 gap-4 border-b border-gray-100 pb-5">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      Katalog Gambar
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Pilih produk ke dalam keranjang PDF untuk diekspor.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={searchTermCatalog}
                      onChange={(e) => { setSearchTermCatalog(e.target.value); setCurrentPageCatalog(1); }}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-gray-50/50 text-sm transition-all"
                      placeholder="Cari berdasar SKU/Nama acak..."
                    />
                  </div>
                </div>

                <div className="mt-2 flex flex-col sm:flex-row gap-4 relative z-30">
                  {/* Custom Multi-select Category Dropdown */}
                  <div className="relative w-full sm:w-1/2">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 pl-1">Tag Kategori</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCatDropdownOpen(!isCatDropdownOpen);
                        setIsBrandDropdownOpen(false);
                      }}
                      className="w-full text-sm border border-gray-200 rounded-xl py-2.5 px-3.5 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 flex justify-between items-center transition-all cursor-pointer outline-none shadow-sm font-semibold"
                    >
                      <span className="truncate">
                        {catalogCategories.length === 0
                          ? 'Semua Kategori (Katalog)'
                          : catalogCategories.join(', ')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCatDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsCatDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2 animate-fadeIn">
                          <div className="flex justify-between items-center p-1.5 border-b border-gray-100 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Pilih Kategori</span>
                            {catalogCategories.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCatalogCategories([]);
                                  setCurrentPageCatalog(1);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogCategories([]);
                                setCurrentPageCatalog(1);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                                catalogCategories.length === 0 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>Semua Kategori</span>
                              {catalogCategories.length === 0 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            {availableCategories.map(cat => {
                              const isSelected = catalogCategories.includes(cat);
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setCatalogCategories(prev => prev.filter(c => c !== cat));
                                    } else {
                                      setCatalogCategories(prev => [...prev, cat]);
                                    }
                                    setCurrentPageCatalog(1);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                                    isSelected 
                                      ? 'bg-blue-50/70 text-blue-700 font-bold' 
                                      : 'hover:bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  <span className="truncate">{cat}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Multi-select Brand Dropdown */}
                  <div className="relative w-full sm:w-1/2">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 pl-1">Tag Merk</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBrandDropdownOpen(!isBrandDropdownOpen);
                        setIsCatDropdownOpen(false);
                      }}
                      className="w-full text-sm border border-gray-200 rounded-xl py-2.5 px-3.5 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 flex justify-between items-center transition-all cursor-pointer outline-none shadow-sm font-semibold"
                    >
                      <span className="truncate">
                        {catalogBrands.length === 0
                          ? 'Semua Merk (Katalog)'
                          : catalogBrands.join(', ')}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isBrandDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsBrandDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2 animate-fadeIn">
                          <div className="flex justify-between items-center p-1.5 border-b border-gray-100 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Pilih Merk</span>
                            {catalogBrands.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCatalogBrands([]);
                                  setCurrentPageCatalog(1);
                                }}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogBrands([]);
                                  setCurrentPageCatalog(1);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                                catalogBrands.length === 0 
                                  ? 'bg-indigo-50 text-indigo-700' 
                                  : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span>Semua Merk</span>
                              {catalogBrands.length === 0 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            {availableBrands.map(b => {
                              const isSelected = catalogBrands.includes(b);
                              return (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setCatalogBrands(prev => prev.filter(brand => brand !== b));
                                    } else {
                                      setCatalogBrands(prev => [...prev, b]);
                                    }
                                    setCurrentPageCatalog(1);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                                    isSelected 
                                      ? 'bg-indigo-50/70 text-indigo-700 font-bold' 
                                      : 'hover:bg-gray-50 text-gray-600'
                                  }`}
                                >
                                  <span className="truncate">{b}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* PDF Export Panel */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-100/60 pb-3">
                  <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Ekspor PDF Katalog
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5">
                      <span className="text-sm">{catalogCart.length}</span> Terpilih
                    </span>
                    <button
                      onClick={selectAllCatalogFiltered}
                      className="active-tap bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <button
                      onClick={clearCatalogCart}
                      className="active-tap bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-red-100 cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Sumber Gambar</label>
                    <select
                      value={windowCatalogSource}
                      onChange={(e) => setWindowCatalogSource(e.target.value as any)}
                      className="w-full text-xs font-bold text-gray-700 border border-blue-200 rounded-lg py-2 px-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
                    >
                      <option value="story">Gambar Story (Portrait 4:5)</option>
                      <option value="foto">Foto Produk (Portrait 1:1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Layout Grid (A4)</label>
                    <select
                      value={pdfGrid}
                      onChange={(e) => setPdfGrid(e.target.value)}
                      className="w-full text-xs font-bold text-gray-700 border border-blue-200 rounded-lg py-2 px-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
                    >
                      {windowCatalogSource === 'story' ? (
                        <>
                          <option value="2x2">2 Baris & 2 Kolom (4 Gbr)</option>
                          <option value="4x4">4 Baris & 4 Kolom (16 Gbr)</option>
                        </>
                      ) : (
                        <>
                          <option value="4x4">4 Baris & 4 Kolom (16 Gbr)</option>
                          <option value="6x6">6 Baris & 6 Kolom (36 Gbr)</option>
                          <option value="8x8">8 Baris & 8 Kolom (64 Gbr)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Tampilkan Harga</label>
                    <select
                      value={pdfPrice}
                      onChange={(e) => setPdfPrice(e.target.value)}
                      className="w-full text-xs font-bold text-gray-700 border border-blue-200 rounded-lg py-2 px-2.5 bg-white focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
                    >
                      <option value="active">Harga Aktif (Sesuai Pilihan)</option>
                      <option value="none">Tanpa Harga</option>
                      <option value="eceran">Harga Eceran</option>
                      <option value="grosir">Harga Grosir</option>
                      <option value="partai">Harga Partai</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generatePDF}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md shadow-blue-500/30 flex items-center justify-center gap-1.5 transition-colors active-tap cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Buat PDF Katalog
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Catalog Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {paginatedCatalogProducts.length === 0 ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <ImageIcon className="w-16 h-16 mb-3 text-gray-300" />
                    <p className="font-medium">Gambar tidak ditemukan berdasarkan filter.</p>
                  </div>
                ) : (
                  paginatedCatalogProducts.map(p => {
                    const imgId = windowCatalogSource === 'story' ? p.gambarStoryId : p.fotoProdukId;
                    const imgUrl = `https://lh3.googleusercontent.com/d/${imgId}`;
                    // Menggunakan image resize Google Drive (=w320) untuk thumbnail agar loading instan dan hemat kuota
                    const thumbnailUrl = imgId ? `${imgUrl}=w320` : '';
                    const isSelected = catalogCart.includes(p.id);
                    
                    const activeTier = catalogTiers[p.id] || globalPriceTier;
                    const activeCustomPrice = catalogCustomPrices[p.id] || 0;
                    
                    const targetDate = windowCatalogSource === 'story' ? p.lastUpdateStory : p.lastUpdateFoto;
                    const isNew = isNewUpdate(targetDate);

                     return (
                      <div
                        key={p.id}
                        className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-all relative ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-md z-10">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        
                        <div
                          className="relative aspect-square bg-gray-50 flex items-center justify-center p-2 cursor-zoom-in"
                          onClick={() => {
                            setLightboxUrl(imgUrl);
                            setLightboxProduct(p);
                          }}
                          title="Klik untuk memperbesar gambar"
                        >
                          {isNew && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-xl z-20 shadow-md animate-pulse-fast tracking-wider">
                              NEW UPDATE
                            </div>
                          )}
                          
                          <CatalogImage
                            src={thumbnailUrl}
                            alt={p.nama}
                            className="w-full h-full object-contain rounded-xl group-hover:scale-[1.02]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/94a3b8?text=Gambar+Rusak';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-gray-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-gray-100">
                            {p.sku}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md pointer-events-none">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                        
                        <div className="p-3 flex flex-col flex-1 border-t border-gray-100">
                          <h3 className="text-[11px] font-semibold text-gray-800 line-clamp-2 mb-1 flex-1 leading-tight" title={p.nama}>
                            {p.nama}
                          </h3>
                          {targetDate && targetDate !== '-' && (
                            <p className="text-[9px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                              Update: {targetDate}
                            </p>
                          )}

                          {(() => {
                            const basePrice = activeTier === 'custom' ? (catalogCustomPrices[p.id] || 0) : (p.harga ? p.harga[activeTier] : 0);
                            const promoType = catalogPromoType[p.id] || 'none';
                            const promoValue = catalogPromoValue[p.id] || 0;

                            let hasPromo = false;
                            let finalPrice = basePrice;
                            let originalPrice = 0;
                            let promoLabel = '';

                            if (promoType === 'percent' && promoValue > 0) {
                              hasPromo = true;
                              originalPrice = basePrice;
                              finalPrice = Math.round(basePrice * (1 - promoValue / 100));
                              promoLabel = `-${promoValue}%`;
                            } else if (promoType === 'strikethrough' && promoValue > 0) {
                              hasPromo = true;
                              originalPrice = basePrice;
                              finalPrice = promoValue;
                              promoLabel = 'PROMO';
                            }

                            return (
                              <div className="mb-2 bg-red-50/20 p-2 rounded-xl border border-red-100/50 flex flex-col justify-center min-h-[48px]">
                                {hasPromo ? (
                                  <>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-400 line-through font-bold leading-none">
                                        {formatRupiah(originalPrice)}
                                      </span>
                                      <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-wide">
                                        {promoLabel}
                                      </span>
                                    </div>
                                    <span className="text-base font-extrabold text-red-600 mt-1 leading-none tracking-tight animate-pulse">
                                      {formatRupiah(finalPrice)}
                                    </span>
                                  </>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Harga Normal</span>
                                    <span className="text-sm font-black text-blue-600 leading-none">
                                      {formatRupiah(basePrice)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          
                          <select
                            value={activeTier}
                            onChange={(e) => handleProductPriceTierChange(p.id, e.target.value as any)}
                            className="w-full text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded p-1.5 mb-1.5 appearance-none outline-none focus:ring-1 focus:ring-blue-400 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-no-repeat bg-[position:right_8px_center] cursor-pointer"
                          >
                            <option value="eceran">Eceran: {formatRupiah(p.harga.eceran)}</option>
                            <option value="grosir">Grosir: {formatRupiah(p.harga.grosir)}</option>
                            <option value="partai">Partai: {formatRupiah(p.harga.partai)}</option>
                            <option value="custom">Harga Custom</option>
                          </select>
                          
                          {activeTier === 'custom' && (
                            <div className="flex items-center bg-white border border-gray-300 rounded overflow-hidden shadow-sm mb-1.5">
                              <span className="bg-gray-100 text-gray-500 px-2 py-1 text-[10px] font-bold border-r border-gray-300">Rp</span>
                              <input
                                type="number"
                                value={activeCustomPrice || ''}
                                onChange={(e) => handleProductCustomPriceChange(p.id, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-[10px] font-bold text-gray-800 outline-none"
                                placeholder="0"
                              />
                            </div>
                          )}

                          {/* Promo / Diskon Settings */}
                          <div className="mt-1 pb-2 mb-2 border-b border-dashed border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-gray-500 uppercase">Promo / Diskon</span>
                              {catalogPromoType[p.id] && catalogPromoType[p.id] !== 'none' && (
                                <span className="text-[9px] px-1 bg-red-100 text-red-600 rounded font-bold">Aktif</span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <select
                                value={catalogPromoType[p.id] || 'none'}
                                onChange={(e) => {
                                  const type = e.target.value as 'none' | 'percent' | 'strikethrough';
                                  setCatalogPromoType(prev => ({ ...prev, [p.id]: type }));
                                  if (type === 'none') {
                                    setCatalogPromoValue(prev => {
                                      const copy = { ...prev };
                                      delete copy[p.id];
                                      return copy;
                                    });
                                  } else if (catalogPromoValue[p.id] === undefined) {
                                    setCatalogPromoValue(prev => ({ ...prev, [p.id]: type === 'percent' ? 10 : 0 }));
                                  }
                                }}
                                className="text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded p-1 outline-none cursor-pointer"
                              >
                                <option value="none">Tanpa Promo</option>
                                <option value="percent">Diskon %</option>
                                <option value="strikethrough">Harga Coret</option>
                              </select>

                              {catalogPromoType[p.id] && catalogPromoType[p.id] !== 'none' && (
                                <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden">
                                  <input
                                    type="number"
                                    value={catalogPromoValue[p.id] || ''}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      setCatalogPromoValue(prev => ({ ...prev, [p.id]: val }));
                                    }}
                                    className="w-full text-right px-1 py-0.5 text-[10px] font-bold text-gray-800 outline-none"
                                    placeholder={catalogPromoType[p.id] === 'percent' ? "10" : "0"}
                                    min="0"
                                  />
                                  <span className="bg-gray-50 text-gray-400 px-1 py-0.5 text-[9px] font-bold border-l border-gray-100">
                                    {catalogPromoType[p.id] === 'percent' ? "%" : "Rp"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 mt-auto">
                            <button
                              onClick={() => toggleCatalogCart(p.id)}
                              className={`w-full py-1.5 rounded-lg flex justify-center items-center gap-1.5 font-bold text-xs transition-colors active-tap shadow-sm cursor-pointer ${
                                isSelected ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {isSelected ? <MinusCircle className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                              <span>{isSelected ? 'Hapus Pilihan' : 'Pilih ke PDF'}</span>
                            </button>

                            <button
                              onClick={async () => {
                                showToast("Sedang memproses gambar...", "success");
                                try {
                                  const response = await fetch(imgUrl);
                                  const blob = await response.blob();
                                  const objectUrl = window.URL.createObjectURL(blob);
                                  
                                  const a = document.createElement('a');
                                  a.href = objectUrl;
                                  a.download = `${p.sku}.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  
                                  if (isInIframe) {
                                    showToast("Gambar diunduh! Jika tidak tersimpan otomatis, silakan klik ikon 'Buka di Tab Baru' di kanan atas.", "success");
                                  } else {
                                    showToast("Gambar berhasil diunduh!", "success");
                                  }
                                  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                                } catch (err) {
                                  console.error("Gagal download:", err);
                                  showToast("Gagal mendownload gambar. Coba lagi nanti.", "error");
                                }
                              }}
                              className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg flex justify-center items-center gap-1.5 font-semibold text-xs transition-colors active-tap shadow-sm cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Download Gambar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Catalog Pagination Controls */}
              {filteredCatalogProducts.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPageCatalog(1); }}
                      className="border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-medium shadow-sm cursor-pointer"
                    >
                      <option value="20">20 / Hal</option>
                      <option value="50">50 / Hal</option>
                      <option value="100">100 / Hal</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                    <button
                      onClick={() => { if (currentPageCatalog > 1) { setCurrentPageCatalog(currentPageCatalog - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                      disabled={currentPageCatalog === 1}
                      className="p-2 rounded-lg text-gray-600 disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all active-tap cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-gray-700 px-3">
                      {currentPageCatalog} / {totalCatalogPages}
                    </span>
                    <button
                      onClick={() => { if (currentPageCatalog < totalCatalogPages) { setCurrentPageCatalog(currentPageCatalog + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                      disabled={currentPageCatalog === totalCatalogPages}
                      className="p-2 rounded-lg text-gray-600 disabled:opacity-30 hover:bg-white hover:shadow-sm transition-all active-tap cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Column / Mobile Cart Drawer */}
        <div
          className={`fixed inset-0 z-[80] lg:z-auto bg-gray-900/60 p-4 flex items-center justify-center lg:static lg:bg-transparent lg:p-0 lg:col-span-5 xl:col-span-4 lg:block transition-all ${
            mobileCartOpen
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'
          }`}
          onClick={(e) => { if (e.target === e.currentTarget) setMobileCartOpen(false); }}
        >
          <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col transform transition-transform duration-300 lg:rounded-2xl lg:shadow-sm lg:sticky lg:top-24 lg:max-w-none lg:max-h-[calc(100vh-6.5rem)] lg:scale-100 lg:transform-none ${
            mobileCartOpen ? 'scale-100' : 'scale-95 lg:scale-100'
          }`}>
            <div className="p-4 lg:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl lg:rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <div className="bg-primary-100 text-primary-600 p-1.5 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                Rincian Pesanan
              </h2>
              <div className="flex items-center gap-3">
                {cartQty > 0 && (
                  <span className="bg-primary-400 text-primary-900 text-xs font-bold px-2 py-1 rounded-md">
                    {cartQty} Barang
                  </span>
                )}
                <button
                  className="lg:hidden text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200 shadow-sm active-tap cursor-pointer"
                  onClick={() => setMobileCartOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-white custom-scrollbar space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center h-full">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                  <p className="text-xs mt-1 text-gray-400">Silakan tambah produk dulu</p>
                </div>
              ) : (
                cart.map(item => {
                  const price = getItemPrice(item);
                  const subtotal = price * item.qty;
                  return (
                    <div key={item.product.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative group animate-fadeIn">
                      <button
                        onClick={() => removeCartItem(item.product.id)}
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors active-tap cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <h4 className="font-bold text-sm text-gray-800 pr-8 leading-snug mb-3">
                        {item.product.nama}
                      </h4>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mt-2">
                        <div className="flex-1 w-full space-y-2">
                          <select
                            value={item.priceTier}
                            onChange={(e) => updateCartPriceTier(item.product.id, e.target.value as any)}
                            className="w-full text-xs font-semibold border border-gray-200 rounded-lg py-2 px-2.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_10px_center]"
                          >
                            <option value="eceran">Harga Eceran ({formatRupiah(item.product.harga.eceran)})</option>
                            <option value="grosir">Harga Grosir ({formatRupiah(item.product.harga.grosir)})</option>
                            <option value="partai">Harga Partai ({formatRupiah(item.product.harga.partai)})</option>
                            <option value="custom">Harga Custom</option>
                          </select>
                          
                          {item.priceTier === 'custom' && (
                            <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400 shadow-sm mt-1">
                              <span className="bg-gray-100 text-gray-500 px-3 py-1.5 text-xs font-bold border-r border-gray-300">Rp</span>
                              <input
                                type="number"
                                value={item.customPrice || ''}
                                onChange={(e) => updateCartCustomPrice(item.product.id, parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm font-bold text-gray-800 outline-none"
                                placeholder="0"
                              />
                            </div>
                          )}

                          <div className="text-sm font-black text-primary-600 pt-1 block sm:hidden">
                            Subtotal: {formatRupiah(subtotal)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-sm font-black text-primary-600 pt-1 hidden sm:block mr-2">
                            {formatRupiah(subtotal)}
                          </div>
                          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner">
                            <button
                              onClick={() => updateCartQty(item.product.id, -1)}
                              className="active-tap w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gray-600 hover:text-gray-900 shadow-sm border border-gray-200/50 cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateCartQtyManual(item.product.id, parseInt(e.target.value) || 0)}
                              className="text-sm font-bold w-12 text-center bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 rounded-md py-1 transition-all"
                              min="0"
                            />
                            <button
                              onClick={() => updateCartQty(item.product.id, 1)}
                              className="active-tap w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gray-600 hover:text-gray-900 shadow-sm border border-gray-200/50 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 bg-primary-50/50 border border-primary-100 rounded-lg p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary-400 focus-within:border-primary-400 transition-all">
                        <PenLine className="w-4 h-4 text-primary-500" />
                        <input
                          type="text"
                          value={item.note}
                          onChange={(e) => updateCartItemNote(item.product.id, e.target.value)}
                          className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder-gray-400"
                          placeholder="Catatan khusus item ini (opsional)..."
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-3xl lg:rounded-b-2xl">
              <div className="flex flex-col gap-1 mb-4">
                <span className="text-sm font-semibold text-gray-500">Total Pembayaran</span>
                <span className="text-2xl font-black text-gray-800 tracking-tight">
                  {formatRupiah(cartTotal)}
                </span>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Catatan Umum Pesanan <span className="font-normal normal-case">(Opsional)</span>
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 group-focus-within:text-primary-500 transition-colors">
                    <StickyNote className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm font-medium bg-white"
                    placeholder="Contoh: Kirim sebelum jam 4 sore"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={cart.length === 0}
                  onClick={() => saveToHistory(true)}
                  className={`active-tap w-1/3 py-3.5 rounded-xl font-bold text-sm flex justify-center items-center gap-1.5 transition-all border ${
                    cart.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200 cursor-pointer shadow-sm'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Draft</span>
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={() => {
                    const name = customerName.trim();
                    if (!name) {
                      showToast("Mohon isi Nama Customer terlebih dahulu!", "error");
                      return;
                    }
                    setCheckoutOpen(true);
                  }}
                  className={`active-tap w-2/3 py-3.5 rounded-xl font-bold text-lg flex justify-center items-center gap-2 transition-all ${
                    cart.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-none'
                      : 'bg-primary-400 hover:bg-primary-500 text-primary-900 shadow-lg shadow-primary-400/30 cursor-pointer'
                  }`}
                >
                  Checkout Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Cart Bar (Hidden on Desktop) */}
      {cartQty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] p-4 lg:hidden z-30 animate-fadeIn">
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-500">Total Belanja</span>
              <span className="text-lg font-black text-gray-800">{formatRupiah(cartTotal)}</span>
            </div>
            <button
              onClick={() => setMobileCartOpen(true)}
              className="active-tap bg-primary-400 text-primary-900 px-6 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2.5 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              Lihat Keranjang
              <span className="bg-white text-primary-900 rounded-md px-2 py-0.5 text-xs">
                {cartQty}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Mobile Catalog Print Button (Floating FAB) */}
      {activeTab === 'catalog' && catalogCart.length > 0 && (
        <div 
          className={`fixed right-5 z-40 sm:hidden animate-fadeIn transition-all duration-300 ${
            cartQty > 0 ? 'bottom-24' : 'bottom-6'
          }`}
        >
          <button
            onClick={generatePDF}
            className="active-tap flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-4 rounded-full shadow-2xl shadow-blue-500/40 border border-blue-500/50 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            <span className="text-xs uppercase tracking-wider">Buat PDF ({catalogCart.length})</span>
          </button>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[99999] bg-black/95 flex flex-col justify-between p-4 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxUrl(null);
              setLightboxProduct(null);
            }
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center w-full max-w-4xl mx-auto text-white py-2 z-10">
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[200px] md:max-w-[400px]">
                {lightboxProduct ? lightboxProduct.nama : 'Pratinjau Gambar'}
              </span>
              <span className="text-xs text-gray-400">
                {lightboxProduct ? `SKU: ${lightboxProduct.sku}` : ''}
              </span>
            </div>
            <button
              onClick={() => {
                setLightboxUrl(null);
                setLightboxProduct(null);
              }}
              className="bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 transition-colors active-tap cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image Container */}
          <div className="flex-1 max-w-4xl w-full mx-auto flex items-center justify-center p-2">
            <img
              src={lightboxUrl}
              alt="Katalog Full Size"
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl z-10 transition-transform duration-300"
            />
          </div>

          {/* Action Bar */}
          <div className="w-full max-w-md mx-auto bg-gray-900/90 backdrop-blur-md rounded-2xl border border-gray-800 p-4 flex justify-center z-10 shadow-2xl mb-4">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!lightboxProduct) return;
                showToast("Sedang mengunduh gambar...", "success");
                try {
                  const response = await fetch(lightboxUrl);
                  const blob = await response.blob();
                  const objectUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = objectUrl;
                  a.download = `${lightboxProduct.sku}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                  showToast("Gambar berhasil diunduh!", "success");
                } catch (err) {
                  console.error(err);
                  showToast("Gagal mengunduh gambar", "error");
                }
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-extrabold text-xs transition-all active-tap shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download JPG
            </button>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(text) => {
          setSearchTerm(text);
          setCurrentPage(1);
          showToast("Barcode berhasil dipindai!", "success");
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        customerName={customerName}
        customerPhone={customerPhone}
        customerNote={customerNote}
        cart={cart}
        total={cartTotal}
        onDownloadExcel={handleDownloadExcel}
        onCopyAndSave={handleCopyAndSave}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onLoadHistoryItem={loadHistoryItem}
        onDeleteHistoryItem={deleteHistoryItem}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={(id) => {
          addToCart(id);
          showToast("Berhasil ditambahkan ke keranjang!", "success");
        }}
      />

      {/* Custom PDF Naming Modal */}
      {pdfNameModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-900/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                Nama File PDF Katalog
              </h3>
              <button
                onClick={() => setPdfNameModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors active-tap cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pdfCustomName.trim()) {
                  showToast("Nama file tidak boleh kosong.", "error");
                  return;
                }
                setPdfNameModalOpen(false);
                generatePDF(pdfCustomName);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  Berikan Nama File PDF
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="text"
                    required
                    value={pdfCustomName}
                    onChange={(e) => setPdfCustomName(e.target.value)}
                    placeholder="Contoh: Katalog_GlobalMart"
                    autoFocus
                    onFocus={(e) => e.target.select()}
                    className="w-full text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-gray-400">.pdf</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  Silakan sesuaikan nama file di atas sesuai keinginan Anda sebelum disimpan ke perangkat.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPdfNameModalOpen(false)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors active-tap cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-colors active-tap cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Unduh PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Share Modal */}
      {shareProductData && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-900/70 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] border border-gray-100 animate-slideUp">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                Bagikan Produk
              </h3>
              <button
                onClick={() => setShareProductData(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors active-tap cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
              
              {/* Product Info Card */}
              <div className="bg-gray-50 rounded-2xl p-4 flex gap-4 border border-gray-200">
                <img
                  src={shareProductData.imgUrl}
                  alt={shareProductData.product.nama}
                  className="w-16 h-16 object-contain rounded-xl bg-white border border-gray-100 p-1 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f8fafc/94a3b8?text=Gambar';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">
                    {shareProductData.product.nama}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wide">
                    SKU: {shareProductData.product.sku}
                  </p>
                </div>
              </div>

              {/* Share Options */}
              <div className="space-y-3">
                
                {/* 1. Share via WhatsApp status or chat */}
                <button
                  onClick={async () => {
                    // 1. Salin Teks ke Clipboard
                    try {
                      await navigator.clipboard.writeText(shareProductData.shareText);
                    } catch (e) {
                      console.warn(e);
                    }
                    
                    // 2. Download Gambar otomatis ke galeri
                    try {
                      const response = await fetch(shareProductData.imgUrl);
                      const blob = await response.blob();
                      const objectUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = objectUrl;
                      a.download = `${shareProductData.product.sku}.jpg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                    } catch (err) {
                      console.error("Gagal download:", err);
                    }

                    showToast("Gambar terunduh & teks disalin! Membuka WhatsApp...", "success");
                    
                    // 3. Buka WhatsApp
                    setTimeout(() => {
                      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareProductData.shareText + "\n" + shareProductData.imgUrl)}`;
                      window.open(waUrl, '_blank');
                    }, 800);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 transition-all text-left w-full cursor-pointer group active-tap"
                >
                  <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                    {/* SVG WhatsApp Icon */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.265 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.388 2.008 13.916.989 11.996.989c-5.442 0-9.87 4.372-9.874 9.802-.001 1.968.514 3.89 1.493 5.582l-.978 3.57 3.677-.954zm13.013-11.37c-.36-.18-.2.13-1.54-.542-.36-.18-.62-.27-.88-.27-.26 0-.68.1-.96.38-.28.3-.96.94-.96 2.3s1 2.67 1.14 2.85c.14.18 1.96 3 4.74 4.2 2.78 1.2 2.78.8 3.28.75.5-.05 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.1-.26-.18-.62-.36z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-gray-800">WhatsApp (Chat & Status)</span>
                    <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">Otomatis download gambar ke galeri, salin teks harga, dan buka WhatsApp.</span>
                  </div>
                </button>

                {/* 2. Instagram (Feed or Stories instructions) */}
                <button
                  onClick={async () => {
                    // 1. Salin Teks ke Clipboard
                    try {
                      await navigator.clipboard.writeText(shareProductData.shareText);
                    } catch (e) {
                      console.warn(e);
                    }
                    
                    // 2. Download Gambar otomatis ke galeri
                    try {
                      const response = await fetch(shareProductData.imgUrl);
                      const blob = await response.blob();
                      const objectUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = objectUrl;
                      a.download = `${shareProductData.product.sku}.jpg`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
                    } catch (err) {
                      console.error("Gagal download:", err);
                    }

                    showToast("Gambar terunduh & caption disalin! Membuka Instagram...", "success");
                    
                    // 3. Buka Instagram
                    setTimeout(() => {
                      window.open('https://www.instagram.com/', '_blank');
                    }, 800);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-100 transition-all text-left w-full cursor-pointer group active-tap"
                >
                  <div className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white p-3 rounded-xl shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                    {/* Instagram Custom Icon */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-gray-800">Bagikan ke Instagram</span>
                    <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">Otomatis download gambar ke galeri, salin caption, dan buka Instagram.</span>
                  </div>
                </button>

                {/* 3. Copy Text */}
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${shareProductData.shareText}\n${shareProductData.imgUrl}`);
                      showToast("Teks & Link Gambar disalin!", "success");
                    } catch (e) {
                      showToast("Gagal menyalin", "error");
                    }
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all text-left w-full cursor-pointer group active-tap"
                >
                  <div className="bg-gray-500 text-white p-3 rounded-xl shadow-md shadow-gray-500/10 group-hover:scale-105 transition-transform flex items-center justify-center">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-gray-800">Salin Teks & Link</span>
                    <span className="block text-[10px] text-gray-500 leading-tight mt-0.5">Salin detail produk lengkap serta link foto ke clipboard.</span>
                  </div>
                </button>

              </div>

              {/* Instagram/WhatsApp Help Note */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-[10px] text-blue-700 font-medium leading-relaxed">
                💡 <b>Cara Mudah Membuat Status / Postingan:</b><br/>
                Cukup klik opsi <b>WhatsApp</b> atau <b>Instagram</b> di atas. Gambar produk otomatis tersimpan ke folder Download/Galeri HP Anda dan teks deskripsi harganya disalin. Setelah aplikasi terbuka, pilih buat postingan, pilih gambar teratas di galeri Anda, lalu <b>tempel (paste)</b> caption-nya!
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
