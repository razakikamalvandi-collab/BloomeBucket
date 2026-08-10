import { useState, useEffect } from 'react';
import CustomerApp from './components/florist/CustomerApp';
import AdminApp from './components/florist/AdminApp';
import { useAuth } from '../lib/AuthContext';

type AppMode = 'customer' | 'admin';

export default function App() {
  const [mode, setMode] = useState<AppMode>('customer');
  const { loading, isLoggedIn, isAdmin } = useAuth();

  // Begitu login dan terdeteksi sebagai admin, otomatis arahkan ke panel admin.
  // Tidak ada tombol/akses manual — hanya akun dengan role admin yang bisa masuk ke sini.
  useEffect(() => {
    if (!loading) setMode(isLoggedIn && isAdmin ? 'admin' : 'customer');
  }, [loading, isLoggedIn, isAdmin]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-0 sm:py-6">
      {/* Phone frame on larger screens */}
      <div
        className="w-full sm:max-w-sm sm:rounded-[2.5rem] sm:overflow-hidden sm:shadow-2xl min-h-screen sm:min-h-0 sm:h-[812px] sm:overflow-y-auto bg-white relative"
      >
        {mode === 'admin' && isAdmin ? (
          <AdminApp onGoCustomer={() => setMode('customer')} />
        ) : (
          <CustomerApp />
        )}


      </div>
    </div>
  );
}
