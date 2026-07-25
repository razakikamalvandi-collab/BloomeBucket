export interface Profile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string;
  theme_color: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  full_address: string;
  is_default: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  image_url: string;
  stock: number;
  sold: number;
  tags: string[];
  is_new: boolean;
  is_flash_sale: boolean;
  created_at: string;
  updated_at: string;
  // computed client-side from reviews
  rating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  note: string;
}

export interface Order {
  id: string;
  order_code: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_fee: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  shipping_address: string;
  recipient_name: string;
  recipient_phone: string;
  note: string;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

export const ORDER_STATUS_CFG: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: 'Menunggu Konfirmasi', color: '#f59e0b' },
  confirmed:  { label: 'Dikonfirmasi',        color: '#3b82f6' },
  processing: { label: 'Diproses',            color: '#8b5cf6' },
  shipped:    { label: 'Dikirim',             color: '#06b6d4' },
  delivered:  { label: 'Selesai',             color: '#22c55e' },
  cancelled:  { label: 'Dibatalkan',          color: '#ef4444' },
};

export function formatPrice(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}
