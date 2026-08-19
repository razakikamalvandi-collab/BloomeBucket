import * as React from 'react';
import CustomerApp from './components/florist/CustomerApp';
import AdminApp from './components/florist/AdminApp';
import { useAuth } from '../lib/AuthContext';

type AppMode = 'customer' | 'admin';

export default function App() {
  const [mode, setMode] = React.useState<AppMode>('customer');
  const { loading, isLoggedIn, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const touchStartY = React.useRef<number | null>(null);
  const touchStartScrollTop = React.useRef(0);

  // Begitu login dan terdeteksi sebagai admin,
  // otomatis arahkan ke panel admin.
  // Hanya akun dengan role admin yang bisa masuk ke sini.
  React.useEffect(() => {
    if (!loading) {
      setMode(isLoggedIn && isAdmin ? 'admin' : 'customer');
    }
  }, [loading, isLoggedIn, isAdmin]);

  // Refresh halaman
  // Tetap digunakan oleh fitur pull-to-refresh.
  const refreshPage = () => {
    if (refreshing) return;

    setRefreshing(true);

    // Beri sedikit waktu sebelum halaman dimuat ulang.
    window.setTimeout(() => {
      window.location.reload();
    }, 350);
  };

  // Pull-to-refresh:
  // tarik dari posisi paling atas ke bawah pada HP.
  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const scrollContainer = (
      e.target as HTMLElement
    ).closest('[data-refresh-scroll]') as HTMLElement | null;

    if (!scrollContainer) return;

    touchStartY.current = e.touches[0].clientY;
    touchStartScrollTop.current = scrollContainer.scrollTop;
  };

  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    if (touchStartY.current === null) return;

    const scrollContainer = (
      e.target as HTMLElement
    ).closest('[data-refresh-scroll]') as HTMLElement | null;

    if (!scrollContainer) return;

    // Hanya aktif ketika pengguna benar-benar berada di paling atas.
    if (
      touchStartScrollTop.current > 2 ||
      scrollContainer.scrollTop > 2
    ) {
      touchStartY.current = null;
      return;
    }
  };

  const handleTouchEnd = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    if (touchStartY.current === null) return;

    const scrollContainer = (
      e.target as HTMLElement
    ).closest('[data-refresh-scroll]') as HTMLElement | null;

    const endY =
      e.changedTouches[0]?.clientY ?? touchStartY.current;

    const distance = endY - touchStartY.current;

    touchStartY.current = null;

    // Jika ditarik minimal 90px dari posisi paling atas,
    // halaman akan direfresh.
    if (
      scrollContainer &&
      scrollContainer.scrollTop <= 2 &&
      distance >= 90
    ) {
      refreshPage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">
          Memuat...
        </div>
      </div>
    );
  }

  return (
    <div
      className="bloome-app min-h-screen h-screen bg-gray-100 flex flex-col overflow-y-auto overscroll-y-contain"
      data-refresh-scroll
    >
      <div
        className="w-full mx-auto min-h-screen bg-white relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mode === 'admin' && isAdmin ? (
          <AdminApp
            onGoCustomer={() => setMode('customer')}
          />
        ) : (
          <CustomerApp />
        )}
      </div>
    </div>
  );
}