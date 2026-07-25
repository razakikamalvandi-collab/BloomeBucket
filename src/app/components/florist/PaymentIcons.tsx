// Ikon metode pembayaran bergaya "logo": memakai warna & inisial khas tiap brand.
// Catatan: ini BUKAN file logo resmi hasil download (itu dilindungi hak cipta/merek dagang
// dan tidak bisa direproduksi persis), melainkan lencana buatan sendiri yang meniru warna &
// nuansa brand supaya mudah dikenali penggunanya — pola yang umum dipakai di banyak aplikasi.

function Badge({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-none font-black text-[10px] text-white shadow-sm"
      style={{ background: bg }}
    >
      {children}
    </div>
  );
}

export function PaymentIcon({ id }: { id: string }) {
  switch (id) {
    case 'bca':
      return <Badge bg="linear-gradient(135deg,#1565C0,#0D47A1)">BCA</Badge>;
    case 'mandiri':
      return <Badge bg="linear-gradient(135deg,#003D79,#F9A825)">M</Badge>;
    case 'gopay':
      return <Badge bg="linear-gradient(135deg,#00AA5B,#00C566)">Go</Badge>;
    case 'ovo':
      return <Badge bg="linear-gradient(135deg,#4C2A86,#6B3FA0)">OVO</Badge>;
    case 'shopeepay':
      return <Badge bg="linear-gradient(135deg,#EE4D2D,#FF6B3D)">SP</Badge>;
    case 'qris':
      return <Badge bg="linear-gradient(135deg,#111827,#374151)">QR</Badge>;
    case 'dana':
      return <Badge bg="linear-gradient(135deg,#118EEA,#0D6EFD)">DANA</Badge>;
    case 'cod':
      return <Badge bg="linear-gradient(135deg,#16A34A,#15803D)">Rp</Badge>;
    default:
      return <Badge bg="#9CA3AF">?</Badge>;
  }
}
