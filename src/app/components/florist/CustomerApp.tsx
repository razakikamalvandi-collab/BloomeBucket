import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, Heart, ShoppingCart, ChevronLeft, Star, Plus, Minus,
  Home, Compass, ClipboardList, User, Trash2, MapPin, Phone,
  ChevronRight, CheckCircle, Package, Truck, Gift, Bell,
  Edit3, LogOut, X, SlidersHorizontal, Flame, Sparkles, Clock,
  BadgeCheck
} from 'lucide-react';
import {
  PAYMENT_METHODS,
  formatPrice, ORDER_STATUS_CFG,
  type Product, type CartItem, type Order, type OrderStatus, type CategoryId
} from './data';
import { useAuth } from '../../../lib/AuthContext';
import * as api from '../../../lib/api';
import { adaptProduct, adaptCategory, adaptOrder, adaptUser } from '../../../lib/adapters';
import { PaymentIcon } from './PaymentIcons';
import { themeToCssVars, THEME_PRESETS } from '../../../lib/theme';
import MapPicker from './MapPicker';

type Screen =
  | 'home' | 'explore' | 'cart' | 'orders' | 'profile'
  | 'product' | 'checkout' | 'orderDetail' | 'editProfile' | 'theme' | 'login' | 'register';

interface CustomerAppProps {}

const DEFAULT_CATEGORIES = [{ id: 'all', label: 'Semua', emoji: '🌸', color: '#f9a8d4' }];

export default function CustomerApp({}: CustomerAppProps) {
  const { profile, isLoggedIn, loading: authLoading, refreshProfile } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [prevScreen, setPrevScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'cart' | 'orders' | 'profile'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [banners, setBanners] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [selectedPayment, setSelectedPayment] = useState('gopay');
  const [shippingAddress, setShippingAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const user = profile ? adaptUser(profile, profile.email) : null;

  // Terapkan warna tema pilihan user ke seluruh app via CSS variable (default rose kalau belum login)
  useEffect(() => {
    const vars = themeToCssVars(user?.themeColor || '#f43f5e');
    Object.entries(vars).forEach(([key, val]) => document.documentElement.style.setProperty(key, val));
  }, [user?.themeColor]);

  // Arahkan ke layar login/home begitu status auth diketahui
  useEffect(() => {
    if (!authLoading) {
      setScreen(isLoggedIn ? 'home' : 'login');
      setActiveTab('home');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Muat produk & kategori dari Supabase
  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts(), api.getBanners()])
      .then(([cats, prods, bnrs]) => {
        setCategories([...DEFAULT_CATEGORIES, ...cats.map(adaptCategory)]);
        setProducts(prods.map(adaptProduct));
        setBanners(bnrs);
      })
      .catch(err => console.error('Gagal memuat data:', err))
      .finally(() => setDataLoading(false));
  }, []);

  // Muat data spesifik user (pesanan, wishlist, notifikasi) saat login
  useEffect(() => {
    if (!profile) { setOrders([]); setWishlist(new Set()); setNotifications([]); return; }
    setRecipientName(profile.name);
    setRecipientPhone(profile.phone);
    api.getOrders(profile.id, false).then(os => setOrders(os.map(adaptOrder))).catch(console.error);
    api.getWishlist(profile.id).then(ids => setWishlist(new Set(ids))).catch(console.error);
    api.getNotifications(profile.id).then(setNotifications).catch(console.error);
    const unsubscribe = api.subscribeToNotifications(profile.id, (n) => setNotifications(prev => [n, ...prev]));
    return unsubscribe;
  }, [profile?.id]);

  const goTo = useCallback((s: Screen) => {
    setPrevScreen(screen);
    setScreen(s);
    if (['home', 'explore', 'cart', 'orders', 'profile'].includes(s)) {
      setActiveTab(s as any);
    }
  }, [screen]);

  const goBack = useCallback(() => goTo(prevScreen), [goTo, prevScreen]);

  const openProduct = (p: Product) => { setSelectedProduct(p); goTo('product'); };
  const openOrder = (o: Order) => { setSelectedOrder(o); goTo('orderDetail'); };

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.product.price * i.quantity, 0), [cart]);
  const shipping = cart.length > 0 ? 20000 : 0;
  const discount = promoApplied ? Math.round(cartSubtotal * 0.1) : 0;
  const grandTotal = cartSubtotal + shipping - discount;

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty, note: '' }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const toggleWishlist = (id: string) => {
    if (!profile) { goTo('login'); return; }
    const wasWishlisted = wishlist.has(id);
    setWishlist(prev => { const n = new Set(prev); wasWishlisted ? n.delete(id) : n.add(id); return n; });
    api.toggleWishlist(profile.id, id, wasWishlisted).catch(err => {
      console.error(err);
      setWishlist(prev => { const n = new Set(prev); wasWishlisted ? n.add(id) : n.delete(id); return n; }); // rollback
    });
  };

  const applyPromo = () => {
    if (promoCode.toLowerCase() === 'florist10') { setPromoApplied(true); }
  };

  const [placingOrder, setPlacingOrder] = useState(false);
  const placeOrder = async () => {
    if (!profile || cart.length === 0 || placingOrder) return;
    setPlacingOrder(true);
    try {
      // format cart supaya cocok dengan tipe yang diharapkan createOrder (product.id, product.price, dst)
      const dbCart = cart.map(c => ({
        product: { id: c.product.id, name: c.product.name, price: c.product.price, image_url: c.product.image, stock: c.product.stock, sold: c.product.sold } as any,
        quantity: c.quantity,
        note: c.note,
      }));
      await api.createOrder(profile.id, dbCart, {
        shippingFee: shipping,
        discount,
        grandTotal,
        paymentMethod: PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label || selectedPayment,
        shippingAddress,
        recipientName,
        recipientPhone,
        note: orderNote,
      });
      const freshOrders = (await api.getOrders(profile.id, false)).map(adaptOrder);
      setOrders(freshOrders);
      setCart([]);
      setPromoApplied(false);
      setPromoCode('');
      setSelectedOrder(freshOrders[0]);
      goTo('orderDetail');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat pesanan, silakan coba lagi.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let p = products;
    if (selectedCategory !== 'all') p = p.filter(x => x.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      p = p.filter(x => x.name.toLowerCase().includes(q) || x.tags.some(t => t.includes(q)));
    }
    return p;
  }, [products, selectedCategory, searchQuery]);

  const featuredProducts = products.filter(p => p.isFlashSale);
  const newProducts = products.filter(p => p.isNew);
  const popularProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const wishlistProducts = products.filter(p => wishlist.has(p.id));

  // ─── Screens ───────────────────────────────────────────────────────────────

  if (screen === 'product' && selectedProduct) {
    return <ProductScreen product={selectedProduct} inCart={cart.find(i => i.product.id === selectedProduct.id)?.quantity || 0} isWishlisted={wishlist.has(selectedProduct.id)} onBack={goBack} onAddCart={addToCart} onToggleWishlist={() => toggleWishlist(selectedProduct.id)} onGoCart={() => goTo('cart')} userId={profile?.id} />;
  }
  if (screen === 'checkout') {
    return <CheckoutScreen cart={cart} subtotal={cartSubtotal} shipping={shipping} discount={discount} grandTotal={grandTotal} selectedPayment={selectedPayment} shippingAddress={shippingAddress} recipientName={recipientName} recipientPhone={recipientPhone} orderNote={orderNote} promoCode={promoCode} promoApplied={promoApplied} onBack={goBack} onSelectPayment={setSelectedPayment} onChangeAddress={setShippingAddress} onChangeRecipient={setRecipientName} onChangePhone={setRecipientPhone} onChangeNote={setOrderNote} onChangePromo={setPromoCode} onApplyPromo={applyPromo} onPlaceOrder={placeOrder} />;
  }
  if (screen === 'orderDetail' && selectedOrder) {
    return <OrderDetailScreen order={selectedOrder} onBack={() => goTo('orders')} />;
  }
  if (screen === 'editProfile' && user) {
    return <EditProfileScreen user={user} userId={profile!.id} onBack={goBack} onSave={async (u: any) => {
      try {
        await api.updateProfile(profile!.id, { name: u.name, phone: u.phone, avatar_url: u.avatarUrl });
        await refreshProfile();
        goBack();
      } catch (err) { console.error(err); alert('Gagal menyimpan profil.'); }
    }} />;
  }
  if (screen === 'theme' && user) {
    return <ThemeScreen currentColor={user.themeColor} onBack={goBack} onSelect={async (hex: string) => {
      try { await api.updateProfile(profile!.id, { theme_color: hex }); await refreshProfile(); }
      catch (err) { console.error(err); alert('Gagal menyimpan tema.'); }
    }} />;
  }
  if (screen === 'login') {
    return <LoginScreen
      error={authError}
      onLogin={async (email: string, password: string) => {
        setAuthError('');
        try { await api.signIn(email, password); goTo('home'); }
        catch (err: any) { setAuthError(err.message || 'Email atau password salah.'); }
      }}
      onRegister={() => { setAuthError(''); goTo('register'); }}
    />;
  }
  if (screen === 'register') {
    return <RegisterScreen
      error={authError}
      onRegister={async (name: string, email: string, phone: string, password: string, confirm: string) => {
        setAuthError('');
        if (password !== confirm) { setAuthError('Konfirmasi password tidak cocok.'); return; }
        if (password.length < 6) { setAuthError('Password minimal 6 karakter.'); return; }
        try { await api.signUp(email, password, name, phone); goTo('home'); }
        catch (err: any) { setAuthError(err.message || 'Gagal mendaftar.'); }
      }}
      onLogin={() => { setAuthError(''); goTo('login'); }}
    />;
  }

  if (dataLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--accent-50)] flex items-center justify-center max-w-sm mx-auto">
        <div className="text-gray-400 text-sm">Memuat...</div>
      </div>
    );
  }

  // ─── Main Tab Shell ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--accent-50)] flex flex-col max-w-sm mx-auto relative">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'home' && (
          <HomeTab
            user={user}
            categories={categories}
            banners={banners}
            featuredProducts={featuredProducts}
            newProducts={newProducts}
            popularProducts={popularProducts}
            wishlist={wishlist}
            notifications={notifications}
            onOpenProduct={openProduct}
            onToggleWishlist={toggleWishlist}
            onGoExplore={() => { setActiveTab('explore'); setScreen('explore'); }}
            onMarkNotifRead={(id: string) => {
              api.markNotificationRead(id).catch(console.error);
              setNotifications((prev: any[]) => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }}
          />
        )}
        {activeTab === 'explore' && (
          <ExploreTab
            products={filteredProducts}
            categories={categories}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            wishlist={wishlist}
            onSearch={setSearchQuery}
            onSelectCategory={setSelectedCategory}
            onOpenProduct={openProduct}
            onToggleWishlist={toggleWishlist}
          />
        )}
        {activeTab === 'cart' && (
          <CartTab
            cart={cart}
            subtotal={cartSubtotal}
            shipping={shipping}
            discount={discount}
            grandTotal={grandTotal}
            wishlistProducts={wishlistProducts}
            promoCode={promoCode}
            promoApplied={promoApplied}
            onUpdateQty={updateQty}
            onChangePromo={setPromoCode}
            onApplyPromo={applyPromo}
            onCheckout={() => goTo('checkout')}
            onOpenProduct={openProduct}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} onOpenOrder={openOrder} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            orders={orders}
            wishlistCount={wishlist.size}
            onEditProfile={() => goTo('editProfile')}
            onLogout={async () => { await api.signOut(); goTo('login'); }}
            onGoOrders={() => { setActiveTab('orders'); setScreen('orders'); }}
            onGoWishlist={() => { setActiveTab('cart'); setScreen('cart'); }}
            onGoTheme={() => goTo('theme')}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-[var(--accent-100)] z-30">
        <div className="flex">
          {([
            { tab: 'home', icon: Home, label: 'Beranda' },
            { tab: 'explore', icon: Compass, label: 'Jelajah' },
            { tab: 'cart', icon: ShoppingCart, label: 'Keranjang', badge: cartCount },
            { tab: 'orders', icon: ClipboardList, label: 'Pesanan' },
            { tab: 'profile', icon: User, label: 'Profil' },
          ] as const).map(({ tab, icon: Icon, label, badge }) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setScreen(tab); }}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all relative ${
                activeTab === tab ? 'text-[var(--accent-500)]' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={activeTab === tab ? 2.5 : 1.8} />
                {badge ? (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[var(--accent-500)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] font-medium ${activeTab === tab ? 'text-[var(--accent-500)]' : 'text-gray-400'}`}>{label}</span>
              {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--accent-500)] rounded-full" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ─── Home Tab ─────────────────────────────────────────────────────────────────
function HomeTab({ user, categories, banners, featuredProducts, newProducts, popularProducts, wishlist, notifications, onOpenProduct, onToggleWishlist, onGoExplore, onMarkNotifRead }: any) {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const unreadCount = (notifications || []).filter((n: any) => !n.is_read).length;

  return (
    <div className="bg-[var(--accent-50)]">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-4 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Halo, Selamat datang 👋</p>
            <h1 className="font-bold text-gray-800 text-base">{user.name.split(' ')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotif(v => !v)} className="relative p-2 rounded-full bg-[var(--accent-50)]">
                <Bell size={18} className="text-gray-600" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-500)] rounded-full" />}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-11 w-72 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-xl border border-[var(--accent-100)] z-50">
                  <div className="p-3 border-b border-[var(--accent-50)] font-semibold text-sm text-gray-700">Notifikasi</div>
                  {(!notifications || notifications.length === 0) ? (
                    <p className="text-xs text-gray-400 p-4 text-center">Belum ada notifikasi</p>
                  ) : notifications.map((n: any) => (
                    <button
                      key={n.id}
                      onClick={() => onMarkNotifRead(n.id)}
                      className={`w-full text-left p-3 border-b border-[var(--accent-50)] last:border-0 ${!n.is_read ? 'bg-[var(--accent-50)]/60' : ''}`}
                    >
                      <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 bg-[var(--accent-50)] border border-[var(--accent-100)] rounded-2xl px-4 py-2.5" onClick={onGoExplore}>
          <Search size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Cari bunga kesukaanmu...</span>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6 mt-4">
        {/* Banner Carousel — hanya tampil kalau admin sudah menambahkan banner */}
        {banners && banners.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden h-44 shadow-lg">
            {banners.map((b: any, i: number) => (
              <div key={b.id} className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIdx ? 'opacity-100' : 'opacity-0'}`}>
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                  <p className="text-xs font-medium opacity-80 mb-1">🌸 Bloome Bucket</p>
                  <h2 className="font-bold text-xl leading-tight">{b.title}</h2>
                  {b.subtitle && <p className="text-sm opacity-80 mt-1">{b.subtitle}</p>}
                </div>
              </div>
            ))}
            {banners.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-1">
                {banners.map((_: any, i: number) => (
                  <button key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        <div>
          <SectionHeader title="Kategori" onSeeAll={onGoExplore} />
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none mt-3">
            {categories.slice(1).map((cat: any) => (
              <button key={cat.id} onClick={onGoExplore} className="flex-none flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: cat.color + '40' }}>
                  {cat.emoji}
                </div>
                <span className="text-xs text-gray-600 text-center w-14 leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Popular */}
        <div>
          <SectionHeader title="Terpopuler" onSeeAll={onGoExplore} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            {popularProducts.map((p: Product) => (
              <ProductCardV key={p.id} product={p} isWishlisted={wishlist.has(p.id)} onOpen={() => onOpenProduct(p)} onToggleWishlist={() => onToggleWishlist(p.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Explore Tab ──────────────────────────────────────────────────────────────
function ExploreTab({ products, categories, searchQuery, selectedCategory, wishlist, onSearch, onSelectCategory, onOpenProduct, onToggleWishlist }: any) {
  return (
    <div className="bg-[var(--accent-50)]">
      <div className="bg-white px-4 pt-10 pb-4 sticky top-0 z-20 shadow-sm">
        <h1 className="font-bold text-gray-800 text-lg mb-3">Jelajahi Produk</h1>
        <div className="flex items-center gap-2 bg-[var(--accent-50)] border border-[var(--accent-100)] rounded-2xl px-4 py-2.5">
          <Search size={16} className="text-gray-400 flex-none" />
          <input
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Cari buket, bunga, hampers..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && <button onClick={() => onSearch('')}><X size={14} className="text-gray-400" /></button>}
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent-500)] text-white shadow-md'
                  : 'bg-white border border-[var(--accent-100)] text-gray-600'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-xs text-gray-400 mb-3">{products.length} produk ditemukan</p>
        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p: Product) => (
              <ProductCardV key={p.id} product={p} isWishlisted={wishlist.has(p.id)} onOpen={() => onOpenProduct(p)} onToggleWishlist={() => onToggleWishlist(p.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cart Tab ─────────────────────────────────────────────────────────────────
function CartTab({ cart, subtotal, shipping, discount, grandTotal, wishlistProducts, promoCode, promoApplied, onUpdateQty, onChangePromo, onApplyPromo, onCheckout, onOpenProduct }: any) {
  if (cart.length === 0) {
    return (
      <div className="bg-[var(--accent-50)] min-h-screen">
        <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
          <h1 className="font-bold text-gray-800 text-lg">Keranjang</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-24 h-24 bg-[var(--accent-100)] rounded-full flex items-center justify-center mb-5">
            <ShoppingCart size={36} className="text-[var(--accent-300)]" />
          </div>
          <h2 className="font-bold text-gray-700 text-lg mb-1">Keranjang Kosong</h2>
          <p className="text-sm text-gray-400 mb-6">Tambahkan bunga favoritmu ke keranjang</p>
        </div>
        {wishlistProducts.length > 0 && (
          <div className="px-4">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Heart size={16} className="text-[var(--accent-500)]" /> Wishlist Kamu</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {wishlistProducts.map((p: Product) => (
                <button key={p.id} onClick={() => onOpenProduct(p)} className="flex-none w-32 bg-white rounded-2xl overflow-hidden shadow-sm">
                  <img src={p.image} alt={p.name} className="w-full h-24 object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-700 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-[var(--accent-500)] font-bold mt-0.5">{formatPrice(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[var(--accent-50)] min-h-screen">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm sticky top-0 z-20">
        <h1 className="font-bold text-gray-800 text-lg">Keranjang ({cart.length})</h1>
      </div>
      <div className="px-4 py-4 space-y-3 pb-44">
        {cart.map((item: CartItem) => (
          <div key={item.product.id} className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm">
            <img src={item.product.image} alt={item.product.name} className="w-20 h-20 object-cover rounded-xl flex-none" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm line-clamp-2">{item.product.name}</p>
              <p className="text-[var(--accent-500)] font-bold text-sm mt-1">{formatPrice(item.product.price)}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 bg-[var(--accent-50)] rounded-xl p-0.5">
                  <button onClick={() => onUpdateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <Minus size={12} className="text-gray-600" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-[var(--accent-500)] shadow-sm flex items-center justify-center">
                    <Plus size={12} className="text-white" />
                  </button>
                </div>
                <button onClick={() => onUpdateQty(item.product.id, -item.quantity)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Promo Code */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-2">Kode Promo</p>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={e => onChangePromo(e.target.value.toUpperCase())}
              placeholder="Masukkan kode (FLORIST10)"
              className="flex-1 border border-[var(--accent-100)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-400)]"
              disabled={promoApplied}
            />
            <button onClick={onApplyPromo} disabled={promoApplied} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${promoApplied ? 'bg-emerald-100 text-emerald-600' : 'bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)]'}`}>
              {promoApplied ? '✓ OK' : 'Pakai'}
            </button>
          </div>
          {promoApplied && <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1"><CheckCircle size={12} /> Promo berhasil diterapkan! Hemat 10%</p>}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-semibold text-gray-800 mb-3">Ringkasan</p>
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>Ongkos Kirim</span><span>{formatPrice(shipping)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Diskon Promo</span><span>-{formatPrice(discount)}</span></div>}
          <div className="h-px bg-[var(--accent-50)] my-1" />
          <div className="flex justify-between font-bold text-gray-800 text-base">
            <span>Total</span>
            <span className="text-[var(--accent-500)]">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-[60px] left-1/2 -translate-x-1/2 w-full max-w-sm p-4 bg-gradient-to-t from-[var(--accent-50)] to-transparent">
        <button onClick={onCheckout} className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-bold rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-200)] transition-all active:scale-98">
          <ShoppingCart size={18} />
          Checkout · {formatPrice(grandTotal)}
        </button>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ orders, onOpenOrder }: { orders: Order[]; onOpenOrder: (o: Order) => void }) {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="bg-[var(--accent-50)] min-h-screen">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm sticky top-0 z-20">
        <h1 className="font-bold text-gray-800 text-lg mb-3">Pesanan Saya</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {([['all', 'Semua'], ['pending', 'Menunggu'], ['processing', 'Diproses'], ['shipped', 'Dikirim'], ['delivered', 'Selesai']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)} className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === key ? 'bg-[var(--accent-500)] text-white' : 'bg-white border border-[var(--accent-100)] text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada pesanan</p>
          </div>
        ) : filtered.map(order => {
          const cfg = ORDER_STATUS_CFG[order.status];
          return (
            <button key={order.id} onClick={() => onOpenOrder(order)} className="w-full bg-white rounded-2xl p-4 shadow-sm text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-500">#{order.id}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              </div>
              <div className="flex gap-3 mb-3">
                <img src={order.items[0].product.image} alt="" className="w-16 h-16 object-cover rounded-xl" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{order.items[0].product.name}</p>
                  {order.items.length > 1 && <p className="text-xs text-gray-400">+{order.items.length - 1} produk lainnya</p>}
                  <p className="text-xs text-gray-400 mt-1">{order.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--accent-50)]">
                <span className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.quantity, 0)} item</span>
                <span className="font-bold text-[var(--accent-500)] text-sm">{formatPrice(order.grandTotal)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, orders, wishlistCount, onEditProfile, onLogout, onGoOrders, onGoWishlist, onGoTheme }: any) {
  const delivered = orders.filter((o: Order) => o.status === 'delivered').length;
  const total = orders.reduce((s: number, o: Order) => s + o.grandTotal, 0);

  return (
    <div className="bg-[var(--accent-50)] min-h-screen">
      <div className="bg-gradient-to-br from-[var(--accent-400)] to-pink-500 px-4 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[var(--accent-500)] font-black text-xl shadow-lg overflow-hidden">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.avatar}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">{user.name}</h2>
            <p className="text-pink-100 text-sm">{user.email}</p>
            <p className="text-pink-100 text-xs mt-0.5 flex items-center gap-1"><Phone size={11} />{user.phone}</p>
          </div>
          <button onClick={onEditProfile} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all">
            <Edit3 size={16} className="text-white" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Pesanan', value: orders.length },
            { label: 'Selesai', value: delivered },
            { label: 'Wishlist', value: wishlistCount },
          ].map(s => (
            <div key={s.label} className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center">
              <p className="font-black text-white text-xl">{s.value}</p>
              <p className="text-pink-100 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {[
            { icon: MapPin, label: 'Alamat Pengiriman', value: user.address || 'Belum diatur', onClick: onEditProfile },
            { icon: ClipboardList, label: 'Riwayat Transaksi', value: `${orders.length} transaksi · ${formatPrice(total)}`, onClick: onGoOrders },
            { icon: Heart, label: 'Wishlist Saya', value: `${wishlistCount} produk`, onClick: onGoWishlist },
            { icon: SlidersHorizontal, label: 'Tema Warna', value: 'Ubah tampilan warna aplikasi', onClick: onGoTheme },
          ].map(({ icon: Icon, label, value, onClick }, idx, arr) => (
            <button key={label} onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-[var(--accent-50)] transition-colors text-left ${idx < arr.length - 1 ? 'border-b border-[var(--accent-50)]' : ''}`}>
              <div className="w-10 h-10 bg-[var(--accent-100)] rounded-xl flex items-center justify-center"><Icon size={18} className="text-[var(--accent-500)]" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{value}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button onClick={onLogout} className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:bg-red-50 transition-colors">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><LogOut size={18} className="text-red-500" /></div>
          <span className="font-semibold text-red-500">Keluar</span>
        </button>

        <p className="text-center text-xs text-gray-300 py-2">Bloome Bucket v1.0.0 · Bergabung {user.joinedAt.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

// ─── Product Screen ───────────────────────────────────────────────────────────
function ProductScreen({ product, inCart, isWishlisted, onBack, onAddCart, onToggleWishlist, onGoCart, userId }: any) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const imgs = [product.image, product.image, product.image];

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    api.getProductReviews(product.id).then(setReviews).catch(console.error);
  }, [product.id]);

  const submitReview = async () => {
    if (!userId || !reviewText.trim() || submittingReview) return;
    setSubmittingReview(true);
    try {
      await api.addReview(product.id, userId, reviewRating, reviewText.trim());
      setReviewText('');
      setReviewRating(5);
      const fresh = await api.getProductReviews(product.id);
      setReviews(fresh);
    } catch (err) { console.error(err); alert('Gagal mengirim ulasan.'); }
    finally { setSubmittingReview(false); }
  };

  return (
    <div className="min-h-screen bg-white max-w-sm mx-auto">
      <div className="relative">
        <div className="relative h-80 overflow-hidden">
          <img src={imgs[activeImg]} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <button onClick={onBack} className="absolute top-10 left-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <button onClick={onToggleWishlist} className="absolute top-10 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
          <Heart size={18} className={isWishlisted ? 'text-[var(--accent-500)] fill-[var(--accent-500)]' : 'text-gray-400'} />
        </button>
        {product.isFlashSale && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-[var(--accent-500)] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Flame size={11} /> Flash Sale
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex gap-1.5">
          {imgs.map((_, i) => <button key={i} onClick={() => setActiveImg(i)} className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />)}
        </div>
      </div>

      <div className="px-4 pt-5 pb-36">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-bold text-gray-800 text-lg leading-tight flex-1">{product.name}</h1>
          {product.isNew && <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-0.5 rounded-full flex-none">Baru</span>}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-[var(--accent-500)] font-black text-2xl">{formatPrice(product.price)}</span>
          {product.originalPrice && <span className="text-gray-300 line-through text-sm">{formatPrice(product.originalPrice)}</span>}
          {product.originalPrice && <span className="bg-[var(--accent-100)] text-[var(--accent-600)] text-xs font-bold px-2 py-0.5 rounded-full">{Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-gray-700">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviewCount} ulasan)</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <BadgeCheck size={13} className="text-emerald-500" />
            <span className="text-xs">{product.sold.toLocaleString('id-ID')} terjual</span>
          </div>
        </div>

        <div className="h-px bg-[var(--accent-50)] my-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Deskripsi</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {product.tags.map((t: string) => (
            <span key={t} className="bg-[var(--accent-50)] text-[var(--accent-400)] text-xs px-2.5 py-1 rounded-full">{t}</span>
          ))}
        </div>

        <div className="h-px bg-[var(--accent-50)] my-4" />
        <h3 className="font-semibold text-gray-700 mb-2">Ulasan ({reviews.length})</h3>
        {userId && (
          <div className="bg-[var(--accent-50)] rounded-2xl p-3 mb-3 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)}>
                  <Star size={18} className={n <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                </button>
              ))}
            </div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Bagikan pendapatmu tentang produk ini..." rows={2} className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--accent-300)] resize-none" />
            <button onClick={submitReview} disabled={submittingReview || !reviewText.trim()} className="text-xs font-bold text-white bg-[var(--accent-500)] px-4 py-2 rounded-full disabled:opacity-50">
              {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </div>
        )}
        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada ulasan untuk produk ini.</p>
        ) : reviews.map(r => (
          <div key={r.id} className="py-2 border-b border-[var(--accent-50)] last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">{r.reviewer_name}</span>
              <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}</div>
            </div>
            {r.comment && <p className="text-xs text-gray-500 mt-1">{r.comment}</p>}
          </div>
        ))}

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-2">Catatan Pesanan</p>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Contoh: Warna pink tua, tambah pita merah..." rows={2} className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[var(--accent-300)] resize-none" />
        </div>

        <div className="mt-4 bg-[var(--accent-50)] rounded-2xl p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Stok tersedia</span><span className="text-emerald-600 font-medium">{product.stock} buah</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Estimasi</span><span>Siap dalam 1-2 hari kerja</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-[var(--accent-100)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-[var(--accent-50)] rounded-xl p-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <Minus size={14} className="text-gray-600" />
            </button>
            <span className="w-8 text-center font-bold text-gray-800">{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-8 h-8 rounded-lg bg-[var(--accent-500)] shadow-sm flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </button>
          </div>
          <span className="text-[var(--accent-500)] font-black text-lg">{formatPrice(product.price * qty)}</span>
        </div>
        <div className="flex gap-2">
          {inCart > 0 && (
            <button onClick={onGoCart} className="flex-none px-4 py-3 rounded-2xl border-2 border-[var(--accent-500)] text-[var(--accent-500)] font-bold text-sm">
              Keranjang ({inCart})
            </button>
          )}
          <button
            onClick={() => { onAddCart(product, qty); }}
            className="flex-1 bg-[var(--accent-500)] text-white font-bold rounded-2xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-[var(--accent-200)] hover:bg-[var(--accent-600)] transition-all"
          >
            <ShoppingCart size={16} />
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout Screen ──────────────────────────────────────────────────────────
function CheckoutScreen({ cart, subtotal, shipping, discount, grandTotal, selectedPayment, shippingAddress, recipientName, recipientPhone, orderNote, promoCode, promoApplied, onBack, onSelectPayment, onChangeAddress, onChangeRecipient, onChangePhone, onChangeNote, onChangePromo, onApplyPromo, onPlaceOrder }: any) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--accent-50)] max-w-sm mx-auto">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-[var(--accent-50)]"><ChevronLeft size={20} className="text-gray-700" /></button>
        <h1 className="font-bold text-gray-800 text-lg">Checkout</h1>
      </div>

      <div className="px-4 py-4 pb-36 space-y-4">
        {/* Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Produk ({cart.length})</p>
          <div className="space-y-3">
            {cart.map((item: CartItem) => (
              <div key={item.product.id} className="flex gap-3">
                <img src={item.product.image} alt="" className="w-14 h-14 object-cover rounded-xl flex-none" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-gray-400">×{item.quantity}</p>
                  <p className="text-[var(--accent-500)] font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-semibold text-gray-700 text-sm">Data Penerima</p>
          <input value={recipientName} onChange={e => onChangeRecipient(e.target.value)} placeholder="Nama penerima" className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-400)]" />
          <input value={recipientPhone} onChange={e => onChangePhone(e.target.value)} placeholder="No. HP penerima" className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-400)]" />
          <textarea value={shippingAddress} onChange={e => onChangeAddress(e.target.value)} placeholder="Alamat lengkap pengiriman" rows={2} className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-400)] resize-none" />
          <button
            onClick={() => setShowMapPicker(true)}
            className="w-full flex items-center justify-center gap-2 border border-[var(--accent-300)] text-[var(--accent-500)] rounded-xl py-2.5 text-sm font-semibold"
          >
            <MapPin size={15} /> Pilih Lokasi di Peta
          </button>
        </div>

        {showMapPicker && (
          <MapPicker
            onClose={() => setShowMapPicker(false)}
            onSelect={(address: string) => { onChangeAddress(address); setShowMapPicker(false); }}
          />
        )}

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.id} onClick={() => onSelectPayment(pm.id)} className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${selectedPayment === pm.id ? 'border-[var(--accent-500)] bg-[var(--accent-50)] text-[var(--accent-600)]' : 'border-gray-100 text-gray-600 hover:border-[var(--accent-200)]'}`}>
                <PaymentIcon id={pm.id} />
                <span className="font-medium text-xs">{pm.label}</span>
                {selectedPayment === pm.id && <CheckCircle size={12} className="text-[var(--accent-500)] ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-700 mb-2 text-sm">Catatan Pesanan</p>
          <textarea value={orderNote} onChange={e => onChangeNote(e.target.value)} placeholder="Catatan untuk penjual..." rows={2} className="w-full border border-[var(--accent-100)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-400)] resize-none" />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-semibold text-gray-700 mb-2 text-sm">Rincian Harga</p>
          <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-gray-600"><span>Ongkos Kirim</span><span>{formatPrice(shipping)}</span></div>
          {discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Diskon</span><span>-{formatPrice(discount)}</span></div>}
          <div className="h-px bg-[var(--accent-50)]" />
          <div className="flex justify-between font-bold text-base">
            <span>Total Bayar</span><span className="text-[var(--accent-500)]">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm p-4 bg-white border-t border-[var(--accent-100)]">
        <button onClick={onPlaceOrder} className="w-full bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-bold rounded-2xl py-4 shadow-lg shadow-[var(--accent-200)] transition-all active:scale-98">
          Buat Pesanan · {formatPrice(grandTotal)}
        </button>
      </div>
    </div>
  );
}

// ─── Order Detail Screen ──────────────────────────────────────────────────────
function OrderDetailScreen({ order, onBack }: { order: Order; onBack: () => void }) {
  const cfg = ORDER_STATUS_CFG[order.status];
  const steps: Array<{ key: OrderStatus; icon: React.ReactNode; label: string }> = [
    { key: 'pending',    icon: <Clock size={14} />,      label: 'Menunggu' },
    { key: 'confirmed',  icon: <CheckCircle size={14} />, label: 'Dikonfirmasi' },
    { key: 'processing', icon: <Package size={14} />,    label: 'Diproses' },
    { key: 'shipped',    icon: <Truck size={14} />,      label: 'Dikirim' },
    { key: 'delivered',  icon: <Gift size={14} />,       label: 'Terkirim' },
  ];
  const currentStep = ORDER_STATUS_CFG[order.status]?.step || 0;

  return (
    <div className="min-h-screen bg-[var(--accent-50)] max-w-sm mx-auto">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm sticky top-0 z-20 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-[var(--accent-50)]"><ChevronLeft size={20} className="text-gray-700" /></button>
        <h1 className="font-bold text-gray-800 text-lg">Detail Pesanan</h1>
      </div>

      <div className="px-4 py-4 space-y-4 pb-10">
        {/* Status */}
        <div className={`rounded-2xl p-4 ${cfg.bg} flex items-center justify-between`}>
          <div>
            <p className="text-xs text-gray-500">#{order.id}</p>
            <p className={`font-bold text-base mt-0.5 ${cfg.color}`}>{cfg.label}</p>
            {order.deliveryDate && <p className="text-xs text-gray-400 mt-0.5">Estimasi: {order.deliveryDate}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${cfg.bg} border-2 flex items-center justify-center ${cfg.color}`}>
            {order.status === 'delivered' ? <CheckCircle size={20} /> : order.status === 'shipped' ? <Truck size={20} /> : <Package size={20} />}
          </div>
        </div>

        {/* Progress */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold text-gray-700 mb-4 text-sm">Tracking Pesanan</p>
            <div className="flex items-start justify-between">
              {steps.map((step, idx) => {
                const done = currentStep >= step.key === 'pending' ? 1 : ORDER_STATUS_CFG[step.key]?.step <= currentStep;
                const active = ORDER_STATUS_CFG[step.key]?.step === currentStep;
                const isDone = ORDER_STATUS_CFG[step.key]?.step < currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {idx < steps.length - 1 && (
                      <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(50%-16px)] h-0.5 ${isDone || active ? 'bg-[var(--accent-400)]' : 'bg-gray-100'}`} style={{ width: 'calc(100% - 32px)', left: '50%' }} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                      isDone ? 'bg-[var(--accent-500)] text-white' :
                      active ? 'bg-[var(--accent-100)] border-2 border-[var(--accent-500)] text-[var(--accent-500)]' :
                      'bg-gray-100 text-gray-300'
                    }`}>
                      {step.icon}
                    </div>
                    <span className={`text-[9px] text-center mt-1 font-medium leading-tight ${active ? 'text-[var(--accent-500)]' : isDone ? 'text-gray-600' : 'text-gray-300'}`}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Produk Dipesan</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3 py-2 border-b border-[var(--accent-50)] last:border-0">
              <img src={item.product.image} alt="" className="w-14 h-14 object-cover rounded-xl" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.product.name}</p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
                {item.note && <p className="text-xs text-[var(--accent-400)] italic mt-0.5">"{item.note}"</p>}
                <p className="text-[var(--accent-500)] font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="font-semibold text-gray-700 mb-2 text-sm">Info Pengiriman</p>
          <div className="flex gap-2"><User size={14} className="text-[var(--accent-400)] flex-none mt-0.5" /><p className="text-sm text-gray-600">{order.recipientName}</p></div>
          <div className="flex gap-2"><Phone size={14} className="text-[var(--accent-400)] flex-none mt-0.5" /><p className="text-sm text-gray-600">{order.recipientPhone}</p></div>
          <div className="flex gap-2"><MapPin size={14} className="text-[var(--accent-400)] flex-none mt-0.5" /><p className="text-sm text-gray-600">{order.shippingAddress}</p></div>
          {order.note && <div className="flex gap-2"><Edit3 size={14} className="text-[var(--accent-400)] flex-none mt-0.5" /><p className="text-sm text-gray-600 italic">{order.note}</p></div>}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-gray-700 mb-3 text-sm">Rincian Pembayaran</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatPrice(order.totalAmount)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Ongkos Kirim</span><span>{formatPrice(order.shippingFee)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Diskon</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="h-px bg-[var(--accent-50)]" />
            <div className="flex justify-between font-bold"><span>Total</span><span className="text-[var(--accent-500)]">{formatPrice(order.grandTotal)}</span></div>
            <p className="text-xs text-gray-400">via {order.paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile Screen ──────────────────────────────────────────────────────
function EditProfileScreen({ user, userId, onBack, onSave }: any) {
  const [form, setForm] = useState(user);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        avatarUrl = await api.uploadAvatar(avatarFile, userId);
      }
      await onSave({ ...form, avatarUrl });
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload foto profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--accent-50)] max-w-sm mx-auto">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-[var(--accent-50)]"><ChevronLeft size={20} className="text-gray-700" /></button>
        <h1 className="font-bold text-gray-800 text-lg">Edit Profil</h1>
        <button onClick={handleSave} disabled={saving} className="ml-auto text-sm font-bold text-[var(--accent-500)] disabled:opacity-50">{saving ? '...' : 'Simpan'}</button>
      </div>
      <div className="px-4 py-6 space-y-4">
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <div className="w-24 h-24 bg-[var(--accent-100)] rounded-full flex items-center justify-center text-[var(--accent-500)] font-black text-2xl overflow-hidden">
              {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : form.avatar}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <Edit3 size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-[var(--accent-500)] rounded-full flex items-center justify-center border-2 border-white">
              <Edit3 size={12} className="text-white" />
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
        <p className="text-center text-xs text-gray-400 -mt-2">Ketuk foto untuk mengganti</p>
        {[
          { label: 'Nama Lengkap', key: 'name', type: 'text' },
          { label: 'Email', key: 'email', type: 'email' },
          { label: 'No. HP', key: 'phone', type: 'tel' },
          { label: 'Alamat', key: 'address', type: 'text' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
            <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full bg-white border border-[var(--accent-100)] rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-[var(--accent-400)]" />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="w-full bg-[var(--accent-500)] text-white font-bold rounded-2xl py-4 mt-4 shadow-lg shadow-[var(--accent-200)] disabled:opacity-60">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
}

// ─── Theme Picker Screen ───────────────────────────────────────────────────────
function ThemeScreen({ currentColor, onBack, onSelect }: any) {
  const [selected, setSelected] = useState(currentColor);
  return (
    <div className="min-h-screen bg-[var(--accent-50)] max-w-sm mx-auto">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl bg-[var(--accent-50)]"><ChevronLeft size={20} className="text-gray-700" /></button>
        <h1 className="font-bold text-gray-800 text-lg">Tema Warna</h1>
      </div>
      <div className="px-4 py-6">
        <p className="text-sm text-gray-500 mb-4">Pilih warna favoritmu, seluruh tampilan aplikasi akan menyesuaikan.</p>
        <div className="grid grid-cols-4 gap-4">
          {THEME_PRESETS.map((t: { name: string; hex: string }) => (
            <button
              key={t.hex}
              onClick={async () => { setSelected(t.hex); await onSelect(t.hex); }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all"
                style={{ background: t.hex, borderColor: selected === t.hex ? t.hex : 'transparent', boxShadow: selected === t.hex ? `0 0 0 2px white, 0 0 0 4px ${t.hex}` : 'none' }}
              >
                {selected === t.hex && <CheckCircle size={20} className="text-white" />}
              </div>
              <span className="text-xs text-gray-600 font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onRegister, error }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || submitting) return;
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white max-w-sm mx-auto flex flex-col">
      <div className="flex-1 px-6 pt-16 pb-8 flex flex-col">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[var(--accent-100)] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🌸</span>
          </div>
          <h1 className="font-black text-2xl text-gray-800">Bloome Bucket</h1>
          <p className="text-gray-400 text-sm mt-1">Marketplace Bunga Terbaik</p>
        </div>
        <div className="space-y-4 flex-1">
          {error && <div className="bg-red-50 text-red-500 text-xs font-medium rounded-xl px-3 py-2.5">{error}</div>}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Email</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" className="w-full border border-[var(--accent-100)] rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent-400)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">Password</p>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" className="w-full border border-[var(--accent-100)] rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent-400)]" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[var(--accent-500)] text-white font-bold rounded-2xl py-4 shadow-lg shadow-[var(--accent-200)] mt-2 disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">Belum punya akun? <button onClick={onRegister} className="text-[var(--accent-500)] font-bold">Daftar</button></p>
      </div>
    </div>
  );
}

// ─── Register Screen ──────────────────────────────────────────────────────────
function RegisterScreen({ onRegister, onLogin, error }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password || submitting) return;
    setSubmitting(true);
    await onRegister(name, email, phone, password, confirm);
    setSubmitting(false);
  };

  const fields = [
    { label: 'Nama Lengkap', value: name, setter: setName, type: 'text' },
    { label: 'Email', value: email, setter: setEmail, type: 'email' },
    { label: 'No. HP', value: phone, setter: setPhone, type: 'tel' },
    { label: 'Password', value: password, setter: setPassword, type: 'password' },
    { label: 'Konfirmasi Password', value: confirm, setter: setConfirm, type: 'password' },
  ];

  return (
    <div className="min-h-screen bg-white max-w-sm mx-auto flex flex-col px-6 pt-16 pb-8">
      <div className="text-center mb-8">
        <span className="text-4xl">🌸</span>
        <h1 className="font-black text-2xl text-gray-800 mt-3">Buat Akun</h1>
        <p className="text-gray-400 text-sm mt-1">Bergabung dengan Bloome Bucket</p>
      </div>
      <div className="space-y-4 flex-1">
        {error && <div className="bg-red-50 text-red-500 text-xs font-medium rounded-xl px-3 py-2.5">{error}</div>}
        {fields.map(({ label, value, setter, type }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">{label}</p>
            <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={label} className="w-full border border-[var(--accent-100)] rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-[var(--accent-400)]" />
          </div>
        ))}
        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-[var(--accent-500)] text-white font-bold rounded-2xl py-4 shadow-lg shadow-[var(--accent-200)] mt-2 disabled:opacity-60">
          {submitting ? 'Memproses...' : 'Daftar Sekarang'}
        </button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-6">Sudah punya akun? <button onClick={onLogin} className="text-[var(--accent-500)] font-bold">Masuk</button></p>
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-bold text-gray-800">{title}</h2>
      <button onClick={onSeeAll} className="text-xs text-[var(--accent-500)] font-semibold flex items-center gap-0.5">
        Lihat Semua <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ProductCardH({ product, isWishlisted, onOpen, onToggleWishlist }: { product: Product; isWishlisted: boolean; onOpen: () => void; onToggleWishlist: () => void }) {
  const disc = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  return (
    <div className="flex-none w-44 bg-white rounded-2xl overflow-hidden shadow-sm" onClick={onOpen}>
      <div className="relative h-36 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); onToggleWishlist(); }} className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Heart size={13} className={isWishlisted ? 'text-[var(--accent-500)] fill-[var(--accent-500)]' : 'text-gray-300'} />
        </button>
        {disc > 0 && <span className="absolute top-2 left-2 bg-[var(--accent-500)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{disc}%</span>}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-gray-500">{product.rating}</span>
        </div>
        <p className="text-[var(--accent-500)] font-black text-sm mt-1">{formatPrice(product.price)}</p>
      </div>
    </div>
  );
}

function ProductCardV({ product, isWishlisted, onOpen, onToggleWishlist }: { product: Product; isWishlisted: boolean; onOpen: () => void; onToggleWishlist: () => void }) {
  const disc = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm" onClick={onOpen}>
      <div className="relative h-40 overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        <button onClick={e => { e.stopPropagation(); onToggleWishlist(); }} className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Heart size={13} className={isWishlisted ? 'text-[var(--accent-500)] fill-[var(--accent-500)]' : 'text-gray-300'} />
        </button>
        {product.isNew && <span className="absolute top-2 left-2 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Baru</span>}
        {disc > 0 && <span className="absolute bottom-2 left-2 bg-[var(--accent-500)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">-{disc}%</span>}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-gray-500">{product.rating} · {product.sold.toLocaleString('id-ID')} terjual</span>
        </div>
        <p className="text-[var(--accent-500)] font-black text-sm mt-1.5">{formatPrice(product.price)}</p>
        {product.originalPrice && <p className="text-gray-300 line-through text-[10px]">{formatPrice(product.originalPrice)}</p>}
      </div>
    </div>
  );
}
