import type { Product as DbProduct, Order as DbOrder, Category as DbCategory, Profile } from './types';

// Bentuk data ini SENGAJA meniru interface asli di components/florist/data.ts
// supaya semua komponen UI yang sudah ada tidak perlu diubah.

export function adaptProduct(p: DbProduct): any {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    originalPrice: p.original_price || undefined,
    category: p.category_id,
    image: p.image_url,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    sold: p.sold,
    stock: p.stock,
    tags: p.tags || [],
    isNew: p.is_new,
    isFlashSale: p.is_flash_sale,
  };
}

export function adaptCategory(c: DbCategory): any {
  return { id: c.id, label: c.label, emoji: c.emoji, color: c.color };
}

export function adaptOrder(o: DbOrder): any {
  return {
    id: o.order_code,
    dbId: o.id,
    items: (o.items || []).map(it => ({
      product: {
        id: it.product_id || it.id,
        name: it.product_name,
        image: it.product_image,
        price: it.product_price,
        description: '', category: '', rating: 0, reviewCount: 0, sold: 0, stock: 0, tags: [],
      },
      quantity: it.quantity,
      note: it.note,
    })),
    status: o.status,
    totalAmount: o.total_amount,
    shippingFee: o.shipping_fee,
    discount: o.discount,
    grandTotal: o.grand_total,
    paymentMethod: o.payment_method,
    shippingAddress: o.shipping_address,
    recipientName: o.recipient_name,
    recipientPhone: o.recipient_phone,
    note: o.note,
    createdAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at),
    deliveryDate: o.delivery_date || undefined,
  };
}

export function adaptUser(p: Profile, email: string): any {
  return {
    id: p.id,
    name: p.name || email.split('@')[0],
    email,
    phone: p.phone || '',
    avatarUrl: p.avatar_url || '',
    avatar: (p.name || email)[0]?.toUpperCase() || 'U',
    themeColor: p.theme_color || '#f43f5e',
    address: '',
    joinedAt: new Date(p.created_at),
  };
}
