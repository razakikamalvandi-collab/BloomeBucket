import { useEffect, useRef, useState } from 'react';
import { X, MapPin, Search, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ikon marker default Leaflet butuh path manual saat dipakai lewat bundler
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  onClose: () => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const DEFAULT_CENTER: [number, number] = [-0.9471, 100.4172]; // Padang, Sumatra Barat sebagai default

export default function MapPicker({ onClose, onSelect, initialLat, initialLng }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [address, setAddress] = useState('Menentukan alamat...');
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [coords, setCoords] = useState<[number, number]>([initialLat || DEFAULT_CENTER[0], initialLng || DEFAULT_CENTER[1]]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setLoadingAddress(false);
    }
  };

  const moveMarker = (lat: number, lng: number) => {
    setCoords([lat, lng]);
    if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current).setView(coords, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker(coords, { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      moveMarker(pos.lat, pos.lng);
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      moveMarker(e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = map;
    markerRef.current = marker;
    reverseGeocode(coords[0], coords[1]);

    // Coba pakai lokasi HP/laptop user kalau diizinkan
    if (!initialLat && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 16);
          moveMarker(latitude, longitude);
        },
        () => {}, // kalau ditolak, tetap pakai default center
        { timeout: 5000 }
      );
    }

    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.setView([lat, lng], 16);
        moveMarker(lat, lng);
      } else {
        alert('Lokasi tidak ditemukan, coba kata kunci lain.');
      }
    } catch {
      alert('Gagal mencari lokasi, coba lagi.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white max-w-sm mx-auto">
      <div className="px-4 pt-10 pb-3 shadow-sm flex items-center gap-3 flex-none">
        <button onClick={onClose} className="p-2 rounded-xl bg-[var(--accent-50)]"><X size={18} className="text-gray-700" /></button>
        <h1 className="font-bold text-gray-800 text-base">Pilih Lokasi Pengiriman</h1>
      </div>

      <div className="px-4 py-2 flex-none flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--accent-50)] rounded-xl px-3">
          <Search size={14} className="text-gray-400 flex-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Cari alamat, jalan, atau tempat..."
            className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
          />
        </div>
        <button onClick={handleSearch} disabled={searching} className="px-4 bg-[var(--accent-500)] rounded-xl text-white text-sm font-semibold disabled:opacity-60">
          {searching ? <Loader2 size={14} className="animate-spin" /> : 'Cari'}
        </button>
      </div>

      <div ref={mapContainerRef} className="flex-1 min-h-0" />

      <div className="p-4 border-t border-[var(--accent-100)] flex-none space-y-3">
        <div className="flex gap-2 items-start">
          <MapPin size={16} className="text-[var(--accent-500)] flex-none mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">{loadingAddress ? 'Menentukan alamat...' : address}</p>
        </div>
        <button
          onClick={() => onSelect(address, coords[0], coords[1])}
          disabled={loadingAddress}
          className="w-full bg-[var(--accent-500)] text-white font-bold rounded-2xl py-3.5 disabled:opacity-60"
        >
          Gunakan Lokasi Ini
        </button>
        <p className="text-center text-[10px] text-gray-300">Peta oleh OpenStreetMap contributors</p>
      </div>
    </div>
  );
}
