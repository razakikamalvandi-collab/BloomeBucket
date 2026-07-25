export type CategoryId =
  | 'wisuda' | 'ultah' | 'pernikahan' | 'segar' | 'artificial' | 'standing' | 'hampers' | 'all';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: CategoryId;
  image: string;
  rating: number;
  reviewCount: number;
  sold: number;
  stock: number;
  tags: string[];
  isNew?: boolean;
  isFlashSale?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  address: string;
  joinedAt: Date;
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  { id: 'all',        label: 'Semua',      emoji: '🌸', color: '#f9a8d4' },
  { id: 'wisuda',     label: 'Wisuda',     emoji: '🎓', color: '#fde68a' },
  { id: 'ultah',      label: 'Ulang Tahun',emoji: '🎂', color: '#fca5a5' },
  { id: 'pernikahan', label: 'Pernikahan', emoji: '💍', color: '#c4b5fd' },
  { id: 'segar',      label: 'Bunga Segar',emoji: '🌹', color: '#6ee7b7' },
  { id: 'artificial', label: 'Artificial', emoji: '🌺', color: '#fbcfe8' },
  { id: 'standing',   label: 'Standing',   emoji: '🏵️', color: '#a5f3fc' },
  { id: 'hampers',    label: 'Hampers',    emoji: '🎁', color: '#fed7aa' },
];

// ─── Products ─────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Buket Wisuda Elegance',
    description: 'Buket wisuda mewah dengan kombinasi mawar pink dan baby breath, dibungkus kertas kraft premium dengan pita satin. Cocok untuk momen wisuda yang berkesan.',
    price: 185000,
    originalPrice: 230000,
    category: 'wisuda',
    image: 'https://images.unsplash.com/photo-1775541398083-4e2ff8d50eab?w=500&q=80',
    rating: 4.9,
    reviewCount: 312,
    sold: 1840,
    stock: 25,
    tags: ['mawar', 'pink', 'wisuda', 'premium'],
    isFlashSale: true,
  },
  {
    id: 'p2',
    name: 'Buket Wisuda Sunflower',
    description: 'Buket cerah dengan bunga matahari dan mawar kuning, penuh semangat dan kebahagiaan. Memberikan kesan hangat dan ceria di hari wisuda.',
    price: 155000,
    category: 'wisuda',
    image: 'https://images.unsplash.com/photo-1718960757629-255334117e2c?w=500&q=80',
    rating: 4.8,
    reviewCount: 198,
    sold: 920,
    stock: 18,
    tags: ['sunflower', 'wisuda', 'ceria'],
    isNew: true,
  },
  {
    id: 'p3',
    name: 'Buket Ulang Tahun Sweet Pink',
    description: 'Buket cantik dengan mawar pink, spray rose, dan eustoma putih. Sempurna untuk hadiah ulang tahun orang tersayang.',
    price: 125000,
    originalPrice: 160000,
    category: 'ultah',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=500&q=80',
    rating: 4.9,
    reviewCount: 425,
    sold: 2310,
    stock: 30,
    tags: ['mawar pink', 'ulang tahun', 'sweet'],
    isFlashSale: true,
  },
  {
    id: 'p4',
    name: 'Buket Birthday Pastel Dream',
    description: 'Koleksi bunga pastel soft dengan carnation, ranunculus, dan baby breath. Tampilan dreamy dan feminine yang memukau.',
    price: 175000,
    category: 'ultah',
    image: 'https://images.unsplash.com/photo-1562158756-c9667871dba2?w=500&q=80',
    rating: 4.7,
    reviewCount: 156,
    sold: 740,
    stock: 20,
    tags: ['pastel', 'carnation', 'ulang tahun'],
  },
  {
    id: 'p5',
    name: 'Buket Pernikahan Bridal White',
    description: 'Buket pengantin eksklusif dengan mawar putih dan peony, sentuhan hijau eucalyptus dan baby breath. Klasik dan elegan untuk hari pernikahan.',
    price: 350000,
    originalPrice: 420000,
    category: 'pernikahan',
    image: 'https://images.unsplash.com/photo-1706741921974-967b3590743c?w=500&q=80',
    rating: 5.0,
    reviewCount: 89,
    sold: 320,
    stock: 10,
    tags: ['pengantin', 'putih', 'mewah', 'pernikahan'],
  },
  {
    id: 'p6',
    name: 'Buket Bridal Romantic Rose',
    description: 'Buket pernikahan romantis dengan mawar merah dan pink, dipadukan dengan ribbon satin putih yang anggun.',
    price: 285000,
    category: 'pernikahan',
    image: 'https://images.unsplash.com/photo-1667555150959-3e881131b9e4?w=500&q=80',
    rating: 4.8,
    reviewCount: 67,
    sold: 215,
    stock: 12,
    tags: ['pernikahan', 'mawar', 'romantis'],
    isNew: true,
  },
  {
    id: 'p7',
    name: 'Fresh Rose Pink Garden',
    description: 'Bunga mawar segar pilihan langsung dari kebun, dipotong pagi hari untuk memastikan kesegaran maksimal. Tersedia dalam berbagai warna.',
    price: 95000,
    category: 'segar',
    image: 'https://images.unsplash.com/photo-1615182787503-08365d1e7fae?w=500&q=80',
    rating: 4.7,
    reviewCount: 531,
    sold: 3200,
    stock: 50,
    tags: ['segar', 'mawar', 'pink', 'fresh'],
  },
  {
    id: 'p8',
    name: 'Fresh Bouquet Mixed Flowers',
    description: 'Rangkaian bunga segar campuran dengan mawar, tulip, dan carnation. Harum alami dan warna yang memukau.',
    price: 145000,
    originalPrice: 175000,
    category: 'segar',
    image: 'https://images.unsplash.com/photo-1644248423203-80e317d78aee?w=500&q=80',
    rating: 4.8,
    reviewCount: 278,
    sold: 1560,
    stock: 35,
    tags: ['segar', 'campuran', 'tulip'],
    isFlashSale: true,
  },
  {
    id: 'p9',
    name: 'Standing Flower Grand',
    description: 'Standing flower besar untuk acara pembukaan usaha, ulang tahun perusahaan, atau acara pernikahan. Tinggi 120cm dengan bunga premium.',
    price: 650000,
    category: 'standing',
    image: 'https://images.unsplash.com/photo-1624417329537-ad5710dfe4bf?w=500&q=80',
    rating: 4.9,
    reviewCount: 44,
    sold: 180,
    stock: 8,
    tags: ['standing', 'grand', 'acara', 'premium'],
  },
  {
    id: 'p10',
    name: 'Standing Flower Colorful',
    description: 'Standing flower meriah dengan kombinasi warna merah, pink, dan kuning. Cocok untuk acara ulang tahun dan perayaan.',
    price: 480000,
    originalPrice: 560000,
    category: 'standing',
    image: 'https://images.unsplash.com/photo-1763984266819-3e1a00382631?w=500&q=80',
    rating: 4.7,
    reviewCount: 33,
    sold: 145,
    stock: 10,
    tags: ['standing', 'colorful', 'perayaan'],
    isNew: true,
  },
  {
    id: 'p11',
    name: 'Hampers Bunga & Coklat',
    description: 'Paket hampers spesial dengan buket mawar, coklat premium, dan kartu ucapan. Hadiah sempurna untuk orang istimewa.',
    price: 320000,
    originalPrice: 380000,
    category: 'hampers',
    image: 'https://images.unsplash.com/photo-1641970963562-912cf0ace893?w=500&q=80',
    rating: 4.8,
    reviewCount: 112,
    sold: 590,
    stock: 15,
    tags: ['hampers', 'coklat', 'gift', 'spesial'],
    isFlashSale: true,
  },
  {
    id: 'p12',
    name: 'Hampers Premium Flower Box',
    description: 'Flower box mewah dengan bunga pilihan tersusun rapi dalam kotak premium. Disertai lilin aromaterapi dan parfum bunga.',
    price: 425000,
    category: 'hampers',
    image: 'https://images.unsplash.com/photo-1721113919517-771bbc8d331d?w=500&q=80',
    rating: 4.9,
    reviewCount: 78,
    sold: 310,
    stock: 12,
    tags: ['hampers', 'flower box', 'mewah', 'premium'],
    isNew: true,
  },
  {
    id: 'p13',
    name: 'Bunga Artificial Eternal Rose',
    description: 'Mawar artificial berkualitas tinggi yang tidak layu. Tahan lama hingga bertahun-tahun, tampak seperti asli dengan sentuhan realistis.',
    price: 225000,
    category: 'artificial',
    image: 'https://images.unsplash.com/photo-1706741921206-837f9e326ecd?w=500&q=80',
    rating: 4.6,
    reviewCount: 189,
    sold: 870,
    stock: 40,
    tags: ['artificial', 'eternal', 'tahan lama'],
  },
  {
    id: 'p14',
    name: 'Artificial Flower Vase Set',
    description: 'Set vas bunga artificial lengkap, cocok untuk dekorasi rumah atau kantor. Tersedia dalam berbagai warna dan ukuran.',
    price: 195000,
    originalPrice: 245000,
    category: 'artificial',
    image: 'https://images.unsplash.com/photo-1677653943284-34919235eb9a?w=500&q=80',
    rating: 4.5,
    reviewCount: 143,
    sold: 650,
    stock: 28,
    tags: ['artificial', 'vas', 'dekorasi', 'set'],
  },
];

// ─── Sample orders ─────────────────────────────────────────────────────────────
export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    items: [{ product: PRODUCTS[0], quantity: 1, note: 'Tolong tambahkan kartu ucapan "Selamat Wisuda"' }],
    status: 'delivered',
    totalAmount: 185000,
    shippingFee: 15000,
    discount: 18500,
    grandTotal: 181500,
    paymentMethod: 'Transfer Bank BCA',
    shippingAddress: 'Jl. Merdeka No. 12, Jakarta Pusat',
    recipientName: 'Siti Rahayu',
    recipientPhone: '08123456789',
    note: 'Tolong tambahkan kartu ucapan',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    deliveryDate: '18 Juli 2026',
  },
  {
    id: 'ORD-002',
    items: [
      { product: PRODUCTS[2], quantity: 2, note: '' },
      { product: PRODUCTS[6], quantity: 1, note: 'Pilih warna pink tua' },
    ],
    status: 'shipped',
    totalAmount: 345000,
    shippingFee: 20000,
    discount: 0,
    grandTotal: 365000,
    paymentMethod: 'GoPay',
    shippingAddress: 'Jl. Sudirman No. 45, Jakarta Selatan',
    recipientName: 'Dewi Lestari',
    recipientPhone: '08234567890',
    note: '',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    deliveryDate: '20 Juli 2026',
  },
  {
    id: 'ORD-003',
    items: [{ product: PRODUCTS[10], quantity: 1, note: '' }],
    status: 'processing',
    totalAmount: 320000,
    shippingFee: 25000,
    discount: 32000,
    grandTotal: 313000,
    paymentMethod: 'QRIS',
    shippingAddress: 'Jl. Gatot Subroto No. 88, Jakarta',
    recipientName: 'Budi Santoso',
    recipientPhone: '08345678901',
    note: 'Pengiriman pagi hari sebelum jam 10',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    deliveryDate: '21 Juli 2026',
  },
  {
    id: 'ORD-004',
    items: [{ product: PRODUCTS[4], quantity: 1, note: '' }],
    status: 'confirmed',
    totalAmount: 350000,
    shippingFee: 30000,
    discount: 0,
    grandTotal: 380000,
    paymentMethod: 'OVO',
    shippingAddress: 'Jl. Thamrin No. 5, Jakarta Pusat',
    recipientName: 'Anisa Putri',
    recipientPhone: '08456789012',
    note: '',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    deliveryDate: '22 Juli 2026',
  },
];

export const DEMO_USER: User = {
  id: 'u1',
  name: 'Rina Amelia',
  email: 'rina.amelia@email.com',
  phone: '08123456789',
  avatar: 'RA',
  address: 'Jl. Kebon Jeruk No. 7, Jakarta Barat',
  joinedAt: new Date('2025-01-15'),
};

export const formatPrice = (p: number) =>
  'Rp ' + p.toLocaleString('id-ID');

export const ORDER_STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: 'Menunggu Pembayaran', color: 'text-amber-600',  bg: 'bg-amber-50',   step: 1 },
  confirmed:  { label: 'Dikonfirmasi',        color: 'text-blue-600',   bg: 'bg-blue-50',    step: 2 },
  processing: { label: 'Sedang Diproses',     color: 'text-purple-600', bg: 'bg-purple-50',  step: 3 },
  shipped:    { label: 'Dikirim',             color: 'text-orange-600', bg: 'bg-orange-50',  step: 4 },
  delivered:  { label: 'Terkirim',            color: 'text-emerald-600',bg: 'bg-emerald-50', step: 5 },
  cancelled:  { label: 'Dibatalkan',          color: 'text-red-600',    bg: 'bg-red-50',     step: 0 },
};

export const PAYMENT_METHODS = [
  { id: 'bca',      label: 'Transfer BCA',     icon: '🏦' },
  { id: 'mandiri',  label: 'Transfer Mandiri',  icon: '🏦' },
  { id: 'gopay',    label: 'GoPay',             icon: '💚' },
  { id: 'ovo',      label: 'OVO',               icon: '💜' },
  { id: 'shopeepay',label: 'ShopeePay',         icon: '🧡' },
  { id: 'qris',     label: 'QRIS',              icon: '📱' },
  { id: 'dana',     label: 'DANA',              icon: '💙' },
  { id: 'cod',      label: 'Bayar di Tempat',   icon: '💵' },
];
