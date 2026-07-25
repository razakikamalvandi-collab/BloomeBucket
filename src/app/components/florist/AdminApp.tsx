import { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, Package, Tag, ClipboardList, BarChart3,
  Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  TrendingUp, ShoppingBag, DollarSign, Users, Search,
  CheckCircle, Truck, Clock, AlertCircle, Star, Eye, Upload, Image as ImageIcon
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  formatPrice, ORDER_STATUS_CFG,
  type Product, type Order, type OrderStatus, type CategoryId
} from './data';
import { useAuth } from '../../../lib/AuthContext';
import * as api from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { adaptProduct, adaptCategory, adaptOrder } from '../../../lib/adapters';

const PIE_COLORS = ['#fde68a', '#fca5a5', '#c4b5fd', '#6ee7b7', '#fbcfe8', '#a5f3fc', '#fed7aa'];

type AdminTab = 'dashboard' | 'products' | 'categories' | 'banners' | 'orders' | 'stats';

interface AdminAppProps {
  onGoCustomer: () => void;
}

export default function AdminApp({ onGoCustomer }: AdminAppProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([{ id: 'all', label: 'Semua', emoji: '🌸', color: '#f9a8d4' }]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');

  const loadAll = async () => {
    const [cats, prods, ords, custCount, bnrs] = await Promise.all([
      api.getCategories(),
      api.getProducts(),
      profile ? api.getOrders(profile.id, true) : Promise.resolve([]),
      api.getCustomerCount().catch(() => 0),
      api.getAllBanners().catch(() => []),
    ]);
    setCategories([{ id: 'all', label: 'Semua', emoji: '🌸', color: '#f9a8d4' }, ...cats.map(adaptCategory)]);
    setProducts(prods.map(adaptProduct));
    setOrders(ords.map(adaptOrder));
    setCustomerCount(custCount);
    setBanners(bnrs);
  };

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  // ── Statistik dihitung dari data pesanan yang sungguhan ──
  const WEEKLY_REVENUE = useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const buckets = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toDateString(), day: days[d.getDay()], revenue: 0, orders: 0 };
    });
    orders.forEach(o => {
      const key = new Date(o.createdAt).toDateString();
      const bucket = buckets.find(b => b.key === key);
      if (bucket) { bucket.revenue += o.grandTotal; bucket.orders += 1; }
    });
    return buckets;
  }, [orders]);

  const CATEGORY_SALES = useMemo(() => {
    const catMap = new Map<string, number>();
    orders.forEach(o => o.items.forEach((it: any) => {
      const prod = products.find(p => p.id === it.product.id);
      const catId = prod?.category || 'lainnya';
      catMap.set(catId, (catMap.get(catId) || 0) + it.product.price * it.quantity);
    }));
    const total = [...catMap.values()].reduce((s, v) => s + v, 0) || 1;
    return [...catMap.entries()].map(([catId, val], i) => ({
      name: categories.find(c => c.id === catId)?.label || catId,
      value: Math.round((val / total) * 100),
      color: PIE_COLORS[i % PIE_COLORS.length],
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [orders, products, categories]);

  const totalRevenue = WEEKLY_REVENUE.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = WEEKLY_REVENUE.reduce((s, d) => s + d.orders, 0);
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock), [products]);
  const needsActionOrders = useMemo(() => orders.filter(o => o.status === 'pending' || o.status === 'confirmed'), [orders]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
  }, [products, searchQuery]);

  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    const dbId = (order as any).dbId;
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status } : o));
    if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, status } : prev);
    try { await api.updateOrderStatus(dbId, status); }
    catch (err) { console.error(err); alert('Gagal update status pesanan.'); loadAll(); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    try { await api.deleteProduct(id); }
    catch (err) { console.error(err); alert('Gagal menghapus produk.'); loadAll(); }
  };

  const TABS: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard',  icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'products',   icon: <Package size={18} />,         label: 'Produk' },
    { id: 'categories', icon: <Tag size={18} />,             label: 'Kategori' },
    { id: 'banners',    icon: <ImageIcon size={18} />,       label: 'Banner' },
    { id: 'orders',     icon: <ClipboardList size={18} />,   label: 'Pesanan' },
    { id: 'stats',      icon: <BarChart3 size={18} />,       label: 'Statistik' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 max-w-sm mx-auto flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat data admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 max-w-sm mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 px-4 pt-10 pb-4 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-pink-200 text-xs">Admin Panel</p>
            <h1 className="text-white font-black text-lg">Bloome Bucket</h1>
          </div>
          <button onClick={onGoCustomer} className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full font-medium hover:bg-white/30 transition-all">
            ← Toko
          </button>
        </div>
        {/* Tab Bar */}
        <div className="flex gap-1 mt-3 overflow-x-auto scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-rose-500 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="px-4 py-5 space-y-5">
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setShowAddProduct(true)} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Plus size={16} /></div>
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">Tambah Produk</span>
              </button>
              <button onClick={() => setActiveTab('orders')} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><ClipboardList size={16} /></div>
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">Kelola Pesanan</span>
              </button>
              <button onClick={() => setActiveTab('categories')} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Tag size={16} /></div>
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">Kelola Kategori</span>
              </button>
              <button onClick={() => setActiveTab('banners')} className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center gap-1.5 text-center">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500"><ImageIcon size={16} /></div>
                <span className="text-[11px] font-semibold text-gray-700 leading-tight">Kelola Banner</span>
              </button>
            </div>

            {/* Alert: Pesanan perlu diproses */}
            {needsActionOrders.length > 0 && (
              <button onClick={() => setActiveTab('orders')} className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3 text-left">
                <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-white flex-none"><AlertCircle size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-700">{needsActionOrders.length} pesanan perlu diproses</p>
                  <p className="text-xs text-amber-600">Ada pesanan menunggu konfirmasi/diproses</p>
                </div>
                <ChevronRight size={16} className="text-amber-500 flex-none" />
              </button>
            )}

            {/* Alert: Stok menipis */}
            {lowStockProducts.length > 0 && (
              <button onClick={() => setActiveTab('products')} className="w-full bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center gap-3 text-left">
                <div className="w-9 h-9 bg-red-400 rounded-xl flex items-center justify-center text-white flex-none"><Package size={16} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700">{lowStockProducts.length} produk stoknya menipis</p>
                  <p className="text-xs text-red-500 truncate">{lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}</p>
                </div>
                <ChevronRight size={16} className="text-red-400 flex-none" />
              </button>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Revenue Minggu Ini', value: formatPrice(totalRevenue), icon: <DollarSign size={16} />, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Total Pesanan', value: totalOrders, icon: <ShoppingBag size={16} />, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Rata-rata Order', value: formatPrice(avgOrder), icon: <TrendingUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Total Produk', value: products.length, icon: <Package size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Total Customer', value: customerCount, icon: <Users size={16} />, color: 'text-sky-500', bg: 'bg-sky-50' },
                { label: 'Pesanan Perlu Aksi', value: needsActionOrders.length, icon: <Clock size={16} />, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map(kpi => (
                <div key={kpi.label} className={`bg-white rounded-2xl p-4 shadow-sm`}>
                  <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} mb-3`}>{kpi.icon}</div>
                  <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-1 text-sm">Revenue 7 Hari</h3>
              <p className="text-xs text-gray-400 mb-4">{formatPrice(totalRevenue)} total minggu ini</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={WEEKLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #fce7f3', fontSize: 12 }} formatter={(v: number) => [formatPrice(v), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: '#f43f5e', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between border-b border-rose-50">
                <h3 className="font-bold text-gray-800 text-sm">Pesanan Terbaru</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-rose-500 font-semibold">Lihat Semua</button>
              </div>
              {orders.slice(0, 3).map(order => {
                const cfg = ORDER_STATUS_CFG[order.status];
                return (
                  <div key={order.id} className="flex items-center gap-3 px-4 py-3 border-b border-rose-50 last:border-0">
                    <img src={order.items[0].product.image} alt="" className="w-10 h-10 object-cover rounded-xl flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">#{order.id}</p>
                      <p className="text-xs text-gray-400">{order.recipientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-rose-500">{formatPrice(order.grandTotal)}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-rose-50">
                <h3 className="font-bold text-gray-800 text-sm">Produk Terlaris</h3>
              </div>
              {[...products].sort((a, b) => b.sold - a.sold).slice(0, 4).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-rose-50 last:border-0">
                  <span className={`w-5 text-sm font-black ${idx === 0 ? 'text-amber-400' : 'text-gray-300'}`}>#{idx + 1}</span>
                  <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sold.toLocaleString('id-ID')} terjual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-500">{formatPrice(p.price)}</p>
                    <div className="flex items-center gap-0.5 justify-end">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-gray-400">{p.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Products ── */}
        {activeTab === 'products' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-white border border-rose-100 rounded-2xl px-3 py-2.5">
                <Search size={15} className="text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari produk..." className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-300" />
              </div>
              <button onClick={() => setShowAddProduct(true)} className="bg-rose-500 text-white px-4 py-2.5 rounded-2xl flex items-center gap-1.5 font-semibold text-sm shadow-md shadow-rose-200">
                <Plus size={16} /> Tambah
              </button>
            </div>

            <p className="text-xs text-gray-400">{filteredProducts.length} produk</p>

            <div className="space-y-3">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
                  <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-xl flex-none" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400">{categories.find(c => c.id === product.category)?.emoji} {categories.find(c => c.id === product.category)?.label}</p>
                    <p className="text-rose-500 font-black text-sm mt-1">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${product.stock > 10 ? 'bg-emerald-50 text-emerald-600' : product.stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                        Stok: {product.stock}
                      </span>
                      <span className="text-[10px] text-gray-400">{product.sold} terjual</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-none">
                    <button onClick={() => setEditProduct(product)} className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Edit2 size={14} className="text-blue-500" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Categories ── */}
        {activeTab === 'categories' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500">{categories.length - 1} kategori aktif</p>
              <button
                onClick={async () => {
                  const label = prompt('Nama kategori baru:');
                  if (!label) return;
                  const emoji = prompt('Emoji untuk kategori ini (contoh: 🌷):', '🌷') || '🌷';
                  const id = label.toLowerCase().trim().replace(/\s+/g, '-');
                  try {
                    const { error } = await supabase.from('categories').insert({
                      id, label, emoji, color: '#fbcfe8', sort_order: categories.length,
                    });
                    if (error) throw error;
                    await loadAll();
                  } catch (err) { console.error(err); alert('Gagal menambah kategori.'); }
                }}
                className="bg-rose-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold shadow-sm"
              >
                <Plus size={13} /> Tambah
              </button>
            </div>
            {categories.slice(1).map(cat => {
              const count = products.filter(p => p.category === cat.id).length;
              return (
                <div key={cat.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: cat.color + '50' }}>
                    {cat.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{cat.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{count} produk</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Edit2 size={14} className="text-blue-500" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Hapus kategori "${cat.label}"? Produk di kategori ini tidak akan terhapus, tapi jadi tanpa kategori.`)) return;
                        try {
                          const { error } = await supabase.from('categories').delete().eq('id', cat.id);
                          if (error) throw error;
                          await loadAll();
                        } catch (err) { console.error(err); alert('Gagal menghapus kategori.'); }
                      }}
                      className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Banners ── */}
        {activeTab === 'banners' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500">{banners.length} banner{banners.length === 0 && ' — belum ada, tidak tampil di beranda'}</p>
              <button
                onClick={() => setShowAddBanner(true)}
                className="bg-rose-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold shadow-sm"
              >
                <Plus size={13} /> Tambah
              </button>
            </div>
            {banners.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <ImageIcon size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada banner. Banner promo baru akan muncul di beranda customer setelah kamu tambahkan di sini.</p>
              </div>
            )}
            {banners.map((b: any) => (
              <div key={b.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={b.image_url} alt={b.title} className="w-full h-28 object-cover" />
                <div className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{b.title}</p>
                    {b.subtitle && <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>}
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${b.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {b.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      try { await api.updateBanner(b.id, { active: !b.active }); await loadAll(); }
                      catch (err) { console.error(err); alert('Gagal mengubah status banner.'); }
                    }}
                    className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-none"
                  >
                    <Eye size={14} className="text-amber-500" />
                  </button>
                  <button onClick={() => setEditBanner(b)} className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-none">
                    <Edit2 size={14} className="text-blue-500" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Hapus banner ini?')) return;
                      try { await api.deleteBanner(b.id); await loadAll(); }
                      catch (err) { console.error(err); alert('Gagal menghapus banner.'); }
                    }}
                    className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-none"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Orders ── */}
        {activeTab === 'orders' && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {(['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const).map(f => (
                <button key={f} onClick={() => setOrderFilter(f)} className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-all ${orderFilter === f ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-rose-100 text-gray-600'}`}>
                  {f === 'all' ? 'Semua' : ORDER_STATUS_CFG[f]?.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">{filteredOrders.length} pesanan</p>
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const cfg = ORDER_STATUS_CFG[order.status];
                const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
                  pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered',
                };
                const nextStatus = nextStatusMap[order.status];
                const nextLabel: Partial<Record<OrderStatus, string>> = {
                  pending: 'Konfirmasi', confirmed: 'Proses', processing: 'Kirim', shipped: 'Selesai',
                };

                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gray-600">#{order.id}</span>
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex gap-3 mb-3">
                        <img src={order.items[0].product.image} alt="" className="w-14 h-14 object-cover rounded-xl" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{order.items[0].product.name}</p>
                          {order.items.length > 1 && <p className="text-xs text-gray-400">+{order.items.length - 1} lainnya</p>}
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Users size={11} /> {order.recipientName}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-rose-50">
                        <div>
                          <p className="text-xs text-gray-400">{order.paymentMethod}</p>
                          <p className="font-black text-rose-500">{formatPrice(order.grandTotal)}</p>
                        </div>
                        {nextStatus && (
                          <button
                            onClick={() => updateOrderStatus(order, nextStatus)}
                            className="bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-rose-600 transition-all"
                          >
                            {nextLabel[order.status]}
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <CheckCircle size={14} /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Statistics ── */}
        {activeTab === 'stats' && (
          <div className="px-4 py-4 space-y-4">
            {/* Orders Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-1 text-sm">Pesanan per Hari</h3>
              <p className="text-xs text-gray-400 mb-4">{totalOrders} total pesanan minggu ini</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={WEEKLY_REVENUE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #fce7f3', fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Pie */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Penjualan per Kategori</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={CATEGORY_SALES} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
                      {CATEGORY_SALES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {CATEGORY_SALES.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: item.color }} />
                      <span className="text-xs text-gray-600 flex-1">{item.name}</span>
                      <span className="text-xs font-bold text-gray-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Pendapatan', value: formatPrice(totalRevenue), sub: 'Minggu ini', color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Rata-rata Harian', value: formatPrice(Math.round(totalRevenue / 7)), sub: 'Per hari', color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Produk Terlaris', value: [...products].sort((a, b) => b.sold - a.sold)[0]?.name.split(' ').slice(0, 2).join(' '), sub: `${[...products].sort((a, b) => b.sold - a.sold)[0]?.sold.toLocaleString('id-ID')} terjual`, color: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'Rating Rata-rata', value: (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1) + ' ⭐', sub: 'Dari semua produk', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map(card => (
                <div key={card.label} className={`bg-white rounded-2xl p-4 shadow-sm`}>
                  <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                  <p className={`font-black text-sm ${card.color} leading-tight`}>{card.value}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Top performers */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-rose-50">
                <h3 className="font-bold text-gray-800 text-sm">Produk Performa Terbaik</h3>
              </div>
              {[...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-rose-50 last:border-0">
                  <span className={`w-5 text-sm font-black ${idx < 3 ? 'text-rose-400' : 'text-gray-300'}`}>#{idx + 1}</span>
                  <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-xl" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-gray-400">{p.rating} · {p.reviewCount} ulasan</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-rose-500">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit/Add Product Modal */}
      {(editProduct || showAddProduct) && (
        <ProductFormModal
          product={editProduct}
          categories={categories}
          onClose={() => { setEditProduct(null); setShowAddProduct(false); }}
          onSaved={async () => { setEditProduct(null); setShowAddProduct(false); await loadAll(); }}
        />
      )}

      {/* Edit/Add Banner Modal */}
      {(editBanner || showAddBanner) && (
        <BannerFormModal
          banner={editBanner}
          onClose={() => { setEditBanner(null); setShowAddBanner(false); }}
          onSaved={async () => { setEditBanner(null); setShowAddBanner(false); await loadAll(); }}
        />
      )}
    </div>
  );
}

// ─── Banner Add/Edit Form Modal ─────────────────────────────────────────────────
function BannerFormModal({ banner, onClose, onSaved }: any) {
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [imagePreview, setImagePreview] = useState(banner?.image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title.trim() || (!imageFile && !imagePreview)) { alert('Judul dan foto banner wajib diisi.'); return; }
    setSaving(true);
    try {
      let imageUrl = banner?.image_url || '';
      if (imageFile) imageUrl = await api.uploadBannerImage(imageFile);
      const payload = { title: title.trim(), subtitle: subtitle.trim(), image_url: imageUrl };
      if (banner) await api.updateBanner(banner.id, payload);
      else await api.createBanner({ ...payload, sort_order: 0 });
      await onSaved();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">{banner ? 'Edit Banner' : 'Tambah Banner'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-rose-50">
            <X size={18} className="text-gray-600" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Foto Banner</p>
            <label className="relative h-32 rounded-2xl overflow-hidden bg-rose-50 flex items-center justify-center cursor-pointer block">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload size={20} />
                  <span className="text-xs mt-1">Pilih foto</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {imagePreview ? 'Ganti Foto' : 'Upload'}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Judul Banner</p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Promo Wisuda 2026" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Subjudul (opsional)</p>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Contoh: Diskon hingga 30%" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-rose-500 text-white font-bold rounded-2xl py-4 shadow-lg shadow-rose-200 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : banner ? 'Simpan Perubahan' : 'Tambah Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
function ProductFormModal({ product, categories, onClose, onSaved }: any) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice?.toString() || '');
  const [stock, setStock] = useState(product?.stock?.toString() || '');
  const [category, setCategory] = useState(product?.category || categories[1]?.id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price || !category) { alert('Nama, harga, dan kategori wajib diisi.'); return; }
    setSaving(true);
    try {
      let imageUrl = product?.image || '';
      if (imageFile) {
        imageUrl = await api.uploadProductImage(imageFile);
      }
      const payload = {
        name: name.trim(),
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        stock: Number(stock) || 0,
        category_id: category,
        description,
        image_url: imageUrl,
      };
      if (product) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct({ ...payload, tags: [], is_new: true, is_flash_sale: false, sold: 0 });
      }
      await onSaved();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan produk. Pastikan storage bucket "product-images" sudah dibuat di Supabase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-rose-50">
            <X size={18} className="text-gray-600" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Foto Produk</p>
            <label className="relative h-32 rounded-2xl overflow-hidden bg-rose-50 flex items-center justify-center cursor-pointer block">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Upload size={20} />
                  <span className="text-xs mt-1">Pilih foto</span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {imagePreview ? 'Ganti Foto' : 'Upload'}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Nama Produk</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Produk" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Harga</p>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Harga" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Harga Asli (opsional, untuk diskon)</p>
            <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="Harga Asli" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Stok</p>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Stok" className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(1).map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${category === cat.id ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-100 text-gray-600'}`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Deskripsi</p>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Deskripsi produk..." rows={3} className="w-full border border-rose-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 resize-none" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-rose-500 text-white font-bold rounded-2xl py-4 shadow-lg shadow-rose-200 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </div>
    </div>
  );
}
