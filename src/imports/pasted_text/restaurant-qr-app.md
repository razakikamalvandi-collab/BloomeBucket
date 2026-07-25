Buatkan saya sebuah **Web App / Aplikasi Restaurant Smart Ordering berbasis QR Code** dengan desain modern, mewah, profesional, responsif, dan mirip sistem restoran internasional premium.
Sistem harus lengkap dari sisi pelanggan, kasir, admin, dapur/koki, dan manajemen meja.

# KONSEP UTAMA

Pelanggan datang ke restoran lalu mencari meja kosong.
Di setiap meja terdapat QR Code unik sesuai nomor meja.
Contoh:

* Meja 1 → QR berbeda
* Meja 2 → QR berbeda
* Meja 5 → QR berbeda
* Meja 1234 → QR berbeda

Saat pelanggan scan QR:

* Sistem otomatis mengetahui nomor meja pelanggan
* Pelanggan langsung masuk ke dashboard pemesanan sesuai nomor meja
* Tidak perlu login
* Nomor meja tampil otomatis di dashboard pelanggan

---

# FITUR DASHBOARD PELANGGAN

Buat tampilan sangat modern seperti aplikasi restoran premium.

Dashboard pelanggan harus memiliki:

## Header

* Logo restoran
* Nomor meja
* Status restoran buka/tutup
* Tombol panggil pelayan
* Tombol wishlist/favorit
* Tombol keranjang

---

# KATEGORI MENU

Buat kategori menu profesional seperti:

* Makanan
* Minuman
* Dessert
* Es Krim
* Snack
* Paket Hemat
* Menu Spesial
* Promo Hari Ini

---

# FITUR MENU MAKANAN

Setiap menu harus memiliki:

* Foto menu HD
* Nama makanan
* Deskripsi
* Harga
* Status stok
* Rating
* Badge best seller/promo/pedas

---

# FITUR STOCK OTOMATIS

Jika stok habis:

* Tombol menu otomatis disable
* Tidak bisa diklik
* Ada tulisan:
  “Stok Habis”
* Warna card berubah sedikit abu abu
* Tidak bisa masuk keranjang

Jika stok tersedia:

* Tombol aktif kembali otomatis

---

# FITUR CUSTOM PESANAN

Saat pelanggan memilih menu/minuman:
Harus bisa custom seperti restoran profesional.

Contoh:

## Es Teh

Pilihan:

* Es banyak
* Es sedang
* Es sedikit
* Tanpa es

Pilihan gula:

* Normal
* Sedikit gula
* Tanpa gula

Level pedas:

* Tidak pedas
* Sedang
* Pedas
* Extra pedas

Tambahan topping:

* Keju
* Telur
* Sosis
* Sambal
* Saus

Tambahan catatan:
Contoh:

* “Jangan pakai bawang”
* “Nasi dipisah”
* “Ayam crispy”

---

# FITUR KERANJANG

Keranjang harus modern dan realtime.

Di keranjang:

* Bisa tambah jumlah
* Bisa kurang jumlah
* Bisa hapus menu
* Bisa edit catatan
* Bisa edit topping
* Ada subtotal
* Pajak
* Biaya layanan
* Total akhir

Keranjang floating di bawah seperti aplikasi modern.

---

# FITUR TOTAL HARGA REALTIME

Saat pelanggan memilih menu:

* Total harga berubah otomatis realtime
* Jika tambah topping harga ikut bertambah
* Jika jumlah dikurangi total ikut berubah

---

# FITUR WISHLIST

Pelanggan bisa:

* Menyimpan menu favorit
* Menambahkan ke wishlist
* Menghapus wishlist

---

# FITUR CHECKOUT

Saat checkout:
Tampilkan:

* Nomor meja
* Semua pesanan
* Jumlah item
* Catatan pesanan
* Total harga

---

# METODE PEMBAYARAN

Buat banyak metode pembayaran:

## Cash

Jika pilih cash:

* Pelanggan bayar ke kasir
* Status:
  “Menunggu Pembayaran Kasir”

## Digital Payment

Tambahkan:

* QRIS
* Dana
* GoPay
* OVO
* ShopeePay
* Transfer Bank
* Debit
* Kredit Card

Jika pembayaran online:

* Ada QR pembayaran
* Ada upload bukti pembayaran
* Atau auto payment gateway

---

# FITUR STATUS PESANAN

Status pesanan realtime:

* Menunggu pembayaran
* Diproses dapur
* Sedang dimasak
* Siap diantar
* Selesai

Gunakan animasi realtime modern.

---

# DASHBOARD DAPUR / KOKI

Buat dashboard khusus koki.

Di dashboard dapur:

* Pesanan masuk realtime
* Ada suara notifikasi
* Ada nomor meja
* Ada detail makanan
* Ada catatan khusus pelanggan
* Ada timer memasak
* Bisa ubah status:

  * Diproses
  * Dimasak
  * Selesai

Pesanan baru tampil otomatis tanpa refresh.

---

# DASHBOARD KASIR

Kasir harus bisa:

* Melihat semua meja
* Melihat meja aktif
* Melihat total tagihan
* Melihat status pembayaran

Jika pelanggan bayar cash:
Kasir tinggal klik nomor meja lalu muncul:

* Semua menu yang dibeli
* Jumlah
* Harga
* Pajak
* Total bayar

Kasir bisa:

* Konfirmasi pembayaran
* Cetak struk
* Kirim struk WhatsApp
* Tutup transaksi

---

# DASHBOARD ADMIN

Admin memiliki akses penuh:

* Kelola menu
* Tambah/edit/hapus menu
* Upload foto makanan
* Atur harga
* Atur stok
* Atur kategori
* Atur promo
* Atur meja
* Generate QR tiap meja
* Kelola user pegawai
* Kelola koki
* Kelola kasir
* Laporan penjualan
* Grafik penghasilan
* Statistik menu terlaris
* Riwayat transaksi

---

# FITUR QR CODE

Setiap meja memiliki:

* QR unik
* Nomor meja otomatis
* Bisa generate otomatis
* Bisa download QR
* Bisa print QR

Saat QR discan:
Langsung membuka:
restaurant.com/meja/5

---

# FITUR REALTIME

Gunakan teknologi realtime:

* Pesanan realtime
* Status realtime
* Notifikasi realtime
* Tanpa refresh halaman

---

# DESAIN UI/UX

Desain harus:

* Modern
* Elegan
* Minimalis
* Mewah
* Responsive mobile & desktop
* Animasi halus
* Mirip aplikasi restoran premium internasional

Gunakan:

* Glassmorphism
* Shadow modern
* Gradient elegan
* Dark mode & light mode
* Icon modern
* Loading animation
* Smooth transition

---

# HALAMAN YANG HARUS ADA

## Pelanggan

* Landing page
* Dashboard menu
* Detail menu
* Keranjang
* Checkout
* Status pesanan

## Admin

* Dashboard admin
* Manajemen menu
* Manajemen meja
* Manajemen pegawai
* Statistik

## Kasir

* Dashboard kasir
* Pembayaran
* Cetak struk

## Dapur

* Dashboard koki
* Pesanan realtime

---

# FITUR TAMBAHAN PROFESIONAL

Tambahkan juga:

* Search menu
* Filter kategori
* Promo banner slider
* Voucher diskon
* Estimasi waktu masak
* Notifikasi suara
* Riwayat pesanan pelanggan
* Multi bahasa
* Sistem antrian
* Dark mode
* PWA/mobile friendly
* Offline mode sederhana
* Auto refresh stok
* Auto logout admin
* Role permission

---

# TEKNOLOGI YANG DIGUNAKAN

Gunakan teknologi modern:

* Frontend: React / Next.js
* Backend: Node.js / Laravel
* Database: MySQL / PostgreSQL
* Realtime: Socket.io / WebSocket
* Authentication JWT
* Payment Gateway
* QR Generator
* Responsive Tailwind CSS

---

# OUTPUT YANG DIINGINKAN

Buat:

1. Struktur folder project lengkap
2. Database lengkap
3. ERD database
4. Semua halaman UI
5. API backend lengkap
6. Sistem realtime
7. Sistem QR meja
8. Dashboard admin/kasir/dapur
9. Source code lengkap
10. Responsive mobile
11. Desain profesional siap production

Buat aplikasi ini seperti gabungan:

* McDonald self ordering
* Sushi Tei digital menu
* Cafe modern premium
* Sistem restoran hotel bintang 5

Dengan tampilan sangat elegan dan profesional.