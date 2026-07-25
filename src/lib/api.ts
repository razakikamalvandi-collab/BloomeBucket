import { supabase } from './supabase';
import type {
  Product, Category, Order, OrderItem, OrderStatus,
  Profile, Address, Review, AppNotification, CartItem
} from './types';

export async function getCustomerCount(): Promise<number> {
  const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer');
  if (error) throw error;
  return count || 0;
}

// ─────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────
export async function signUp(email: string, password: string, name: string, phone: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(): Promise<(Profile & { email: string }) | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  return { ...(data as Profile), email: user.email || '' };
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return `${data.publicUrl}?t=${Date.now()}`; // cache-bust supaya foto baru langsung tampil
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────────────────────────────────
export async function getBanners(): Promise<import('./types').Banner[]> {
  const { data, error } = await supabase.from('banners').select('*').eq('active', true).order('sort_order');
  if (error) throw error;
  return data as import('./types').Banner[];
}

export async function getAllBanners(): Promise<import('./types').Banner[]> {
  const { data, error } = await supabase.from('banners').select('*').order('sort_order');
  if (error) throw error;
  return data as import('./types').Banner[];
}

export async function createBanner(banner: { title: string; subtitle: string; image_url: string; sort_order?: number }) {
  const { error } = await supabase.from('banners').insert(banner);
  if (error) throw error;
}

export async function updateBanner(id: string, updates: Partial<import('./types').Banner>) {
  const { error } = await supabase.from('banners').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadBannerImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `banners/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return data as Category[];
}

// ─────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;

  // Ambil rata-rata rating & jumlah review per produk
  const { data: reviewData } = await supabase.from('reviews').select('product_id, rating');
  const ratingMap = new Map<string, { sum: number; count: number }>();
  (reviewData || []).forEach((r: any) => {
    const cur = ratingMap.get(r.product_id) || { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingMap.set(r.product_id, cur);
  });

  return (data as Product[]).map(p => {
    const stats = ratingMap.get(p.id);
    return {
      ...p,
      rating: stats ? Math.round((stats.sum / stats.count) * 10) / 10 : 0,
      reviewCount: stats ? stats.count : 0,
    };
  });
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const filePath = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
  return data.publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────
export async function getProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as any[]).map(r => ({ ...r, reviewer_name: r.profiles?.name || 'Pengguna' }));
}

export async function addReview(productId: string, userId: string, rating: number, comment: string) {
  const { error } = await supabase.from('reviews').insert({
    product_id: productId, user_id: userId, rating, comment,
  });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// WISHLIST
// ─────────────────────────────────────────────────────────────────────────
export async function getWishlist(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((d: any) => d.product_id);
}

export async function toggleWishlist(userId: string, productId: string, isWishlisted: boolean) {
  if (isWishlisted) {
    const { error } = await supabase.from('wishlist_items').delete().eq('user_id', userId).eq('product_id', productId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('wishlist_items').insert({ user_id: userId, product_id: productId });
    if (error) throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// ADDRESSES
// ─────────────────────────────────────────────────────────────────────────
export async function getAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at');
  if (error) throw error;
  return data as Address[];
}

export async function addAddress(address: Partial<Address>) {
  const { error } = await supabase.from('addresses').insert(address);
  if (error) throw error;
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────
export async function getOrders(userId: string, isAdmin: boolean): Promise<Order[]> {
  let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as any[]).map(o => ({ ...o, items: o.order_items }));
}

export async function createOrder(
  userId: string,
  cart: CartItem[],
  opts: {
    shippingFee: number; discount: number; grandTotal: number;
    paymentMethod: string; shippingAddress: string;
    recipientName: string; recipientPhone: string; note: string;
  }
): Promise<Order> {
  const orderCode = `ORD-${Date.now().toString().slice(-6)}`;
  const totalAmount = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const { data: order, error } = await supabase.from('orders').insert({
    order_code: orderCode,
    user_id: userId,
    status: 'pending',
    total_amount: totalAmount,
    shipping_fee: opts.shippingFee,
    discount: opts.discount,
    grand_total: opts.grandTotal,
    payment_method: opts.paymentMethod,
    shipping_address: opts.shippingAddress,
    recipient_name: opts.recipientName,
    recipient_phone: opts.recipientPhone,
    note: opts.note,
    delivery_date: null,
  }).select().single();
  if (error) throw error;

  const items = cart.map(c => ({
    order_id: order.id,
    product_id: c.product.id,
    product_name: c.product.name,
    product_price: c.product.price,
    product_image: c.product.image_url,
    quantity: c.quantity,
    note: c.note,
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(items);
  if (itemsError) throw itemsError;

  // kurangi stok produk
  for (const c of cart) {
    await supabase.from('products').update({
      stock: Math.max(0, c.product.stock - c.quantity),
      sold: c.product.sold + c.quantity,
    }).eq('id', c.product.id);
  }

  return order as Order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export function subscribeToNotifications(userId: string, onInsert: (n: AppNotification) => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`,
    }, (payload) => onInsert(payload.new as AppNotification))
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
