export interface Product {
  id: string;
  nama: string;
  sku: string;
  kategori: string;
  merk: string;
  gambarStoryId: string | null;
  lastUpdateStory: string;
  fotoProdukId: string | null;
  lastUpdateFoto: string;
  unit: string;
  stok: {
    gudang: number;
    toko: number;
  };
  harga: {
    hpp: number;
    eceran: number;
    grosir: number;
    partai: number;
  };
}

export interface CartItem {
  product: Product;
  qty: number;
  priceTier: 'eceran' | 'grosir' | 'partai' | 'custom';
  customPrice: number;
  note: string;
}

export interface HistoryItem {
  id: string;
  date: string;
  isDraft: boolean;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  cart: CartItem[];
  total: number;
}
