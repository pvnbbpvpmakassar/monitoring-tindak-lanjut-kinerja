PATCH TAMBAHAN: HAPUS PER LAPORAN TINDAK LANJUT

Salin folder src dari ZIP ini ke proyek Anda dan izinkan penggantian hanya untuk tiga file berikut:

1. src/actions/tindak-lanjut.ts
   Action lama tetap disertakan, ditambah deleteTindakLanjutAction.

2. src/components/tindak-lanjut/HapusTindakLanjutButton.tsx
   Komponen baru: tombol Hapus dengan modal konfirmasi.

3. src/app/(dashboard)/tindak-lanjut/page.tsx
   Menambahkan tombol Hapus pada setiap laporan tindak lanjut.

Tidak ada perubahan skema database.

Penghapusan menghapus satu laporan yang dipilih, metadata semua bukti dukung yang terkait, dan file terkait di Vercel Blob. Laporan lain pada temuan yang sama tetap aman. Status verifikasi milik laporan yang dihapus ikut hilang.
