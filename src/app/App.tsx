import { useState, useEffect, useRef } from 'react';
import CustomerApp from './components/florist/CustomerApp';
import AdminApp from './components/florist/AdminApp';
import { useAuth } from '../lib/AuthContext';
import { RefreshCw } from 'lucide-react';

type AppMode = 'customer' | 'admin';

export default function App() {
  const [mode, setMode] = useState<AppMode>('customer');
  const { loading, isLoggedIn, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartScrollTop = useRef(0);

  // Begitu login dan terdeteksi sebagai admin, otomatis arahkan ke panel admin.
  // Tidak ada tombol/akses manual — hanya akun dengan role admin yang bisa masuk ke sini.
  useEffect(() => {
    if (!loading) setMode(isLoggedIn && isAdmin ? 'admin' : 'customer');
  }, [loading, isLoggedIn, isAdmin]);

  const refreshPage = () => {
    if (refreshing) return;
    setRefreshing(true);
    // Beri sedikit waktu agar animasi tombol terlihat sebelum halaman dimuat ulang.
    window.setTimeout(() => window.location.reload(), 350);
  };

  // Pull-to-refresh: tarik dari posisi paling atas ke bawah pada HP.
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const scrollContainer = (e.target as HTMLElement).closest('[data-refresh-scroll]') as HTMLElement | null;
    if (!scrollContainer) return;

    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = scrollContainer.scrollTop;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;

    const scrollContainer = (e.target as HTMLElement).closest('[data-refresh-scroll]') as HTMLElement | null;
    if (!scrollContainer) return;

    // Hanya aktif ketika pengguna benar-benar berada di paling atas.
    if (touchStartScrollTop.current > 2 || scrollContainer.scrollTop > 2) {
      touchStartY.current = null;
      return;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;

    const scrollContainer = (e.target as HTMLElement).closest('[data-refresh-scroll]') as HTMLElement | null;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const distance = endY - touchStartY.current;

    touchStartY.current = null;

    if (scrollContainer && scrollContainer.scrollTop <= 2 && distance >= 90) {
      refreshPage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="bloome-app min-h-screen h-screen bg-gray-100 flex flex-col overflow-y-auto overscroll-y-contain">
      <div
        className="w-full w-full min-h-screen bg-white relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mode === 'admin' && isAdmin ? (
          <AdminApp onGoCustomer={() => setMode('customer')} />
        ) : (
          <CustomerApp />
        )}

        {/* Tombol refresh manual */}
        <button
          type="button"
          onClick={refreshPage}
          disabled={refreshing}
          aria-label="Refresh halaman"
          title="Refresh halaman"
          className="fixed bottom-24 right-4 z-[9999] flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-lg ring-1 ring-black/5 backdrop-blur transition-all hover:scale-105 active:scale-95 disabled:opacity-70 sm:absolute sm:right-4"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Indikator pull-to-refresh */}
        {refreshing && (
          <div className="fixed left-1/2 top-4 z-[10000] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-lg sm:absolute">
            Menyegarkan...
          </div>
        )}
      </div>
    </div>
  );
}
