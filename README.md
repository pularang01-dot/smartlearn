# SmartLearn Motion

Media pembelajaran interaktif untuk Smartboard/proyektor: guru membuat kuis sendiri, lalu siswa menjawab dengan **posisi tubuh** yang dibaca kamera (MediaPipe Pose Landmarker), atau lewat sentuh/keyboard. Offline-first, tanpa akun, data tersimpan di IndexedDB.

> **Status jujur:** kode ini ditulis tanpa akses internet, sehingga `npm install`, `typecheck`, `build`, dan `vitest` **belum pernah dijalankan** oleh pembuatnya. Lihat bagian "Status verifikasi" di bawah.

## Fitur yang ada
- Dashboard (data nyata, empty state, kuis contoh berlabel "(Contoh)").
- Quiz Studio: buat/edit/duplikat/hapus kuis dan soal, urutkan soal, validasi, indikator belum-tersimpan.
- Tipe soal: Benar/Salah, pilihan ganda, soal bergambar (gambar disimpan sebagai Blob di IndexedDB, maks 2 MB).
- Game Arena: state machine (countdown → soal → feedback → selesai, jeda/lanjut), timer tunggal, jawaban dikunci sekali per soal, giliran individu/tim, layar penuh, fallback sentuh & keyboard (1–4, Spasi, Enter).
- Kamera nyata: MediaPipe pose → titik pinggul (fallback bahu) → EMA smoothing → zona strip vertikal → tahan N ms → kunci → **re-arm** (harus kembali ke posisi netral).
- Kalibrasi: pilih kamera, mirror, jumlah zona, area netral, waktu tahan, batas confidence; disimpan lokal.
- Hasil: riwayat sesi, detail per soal, ekspor CSV/JSON.
- Backup: ekspor/impor paket JSON (kuis + soal + gambar base64), validasi zod, pratinjau, mode "salinan" atau "timpa".
- Tema terang/gelap/sistem, reset data dengan konfirmasi.

## Desain (Stitch "Kinetic Classroom")
Tema, warna, tipografi, bentuk, dan tata letak Dashboard, Bank Kuis, Arena, Kalibrasi diterapkan dari desain Stitch. Tambahan dari desain yang kini ada: timer ring, poin berjalan per tim, zona berhuruf A–D dengan badge "Terpilih", simulasi posisi & uji gerak 5 detik di Kalibrasi, filter kelas/tampilan grid-list/statistik di Bank Kuis, pintasan keyboard 1–5 di Dashboard, toggle tema, halaman Pengembang dan Bantuan.
Data karangan dari mockup (mis. "85% Tuntas", "60 FPS", "Tersertifikasi Offline", foto stok) sengaja **tidak** dipakai; semua angka di UI berasal dari data nyata.
Font (Plus Jakarta Sans, Inter) dimuat dari Google Fonts bila online; offline memakai font sistem. Untuk font offline penuh, pasang `@fontsource/*`.
Isi data pengembang (peran, foto, email, tautan) di `src/lib/developer.ts`.

## Segera hadir (tampil berlabel di UI atau dicatat di sini)
Editor Soal Cepat (panel samping di Bank Kuis), halaman onboarding/Selamat Datang, rangka tubuh (skeleton) di preview kamera, indikator FPS/latensi.

## Belum diimplementasikan (jangan diasumsikan ada)
Supabase/login/sync cloud, PWA/service worker (offline penuh setelah reload), ESLint, Tailwind & Framer Motion (memakai CSS biasa), Playwright e2e, tes komponen React, tes IndexedDB/export-import, tipe soal lanjutan (isian, urutan, dll.), mode "seluruh kelas" simultan (hanya giliran), ekspor ZIP (ekspor memakai JSON), suara, migrasi skema IndexedDB (baru versi 1).

## Menjalankan
Butuh Node.js 20+.
```bash
npm install
npm run prepare:assets   # sekali, butuh internet: salin WASM MediaPipe + unduh model pose lite (~6 MB)
npm run dev              # buka http://localhost:5173 (kamera hanya jalan di localhost/HTTPS)
```
Perintah lain: `npm run typecheck`, `npm test`, `npm run build`, `npm run preview`, `npm run package:zip`.
Tanpa `prepare:assets`, aplikasi tetap berfungsi (sentuh/keyboard) dan mode kamera menampilkan "Model pose belum tersedia".
Model dari Google MediaPipe (lisensi Apache-2.0) — periksa lisensi sebelum redistribusi.

## Cara pakai singkat
1. Dashboard → "Muat kuis contoh" atau "Buat Kuis" → Simpan.
2. Kamera → nyalakan, atur zona, tes berdiri di tiap zona, Simpan kalibrasi.
3. Main → pilih kuis, isi nama pemain/tim → Mulai.

## Catatan kamera
- Zona dihitung dari posisi di **gambar kamera**, bukan lantai sebenarnya; sudut dan jarak kamera memengaruhi hasil.
- Zona = jumlah opsi (2–4). Soal >4 opsi otomatis memakai sentuh/keyboard (tidak dipetakan diam-diam).
- Video tidak direkam/diunggah; tidak ada pengenalan wajah.

## Troubleshooting
- **Izin kamera ditolak:** izinkan di ikon gembok browser, muat ulang.
- **Model tidak dimuat:** jalankan `npm run prepare:assets`; pastikan `public/models/pose_landmarker_lite.task` ada.
- **Kamera tidak terdeteksi:** cek kabel/aplikasi lain yang memakai kamera, pilih perangkat di Kalibrasi.
- **Penyimpanan penuh:** ekspor backup di halaman Backup lalu hapus kuis/hasil lama.

## Checklist uji manual (kamera fisik/Smartboard)
- [ ] Zona sesuai posisi berdiri (uji mirror on/off).
- [ ] Berdiri diam di zona tidak memicu jawaban berulang.
- [ ] Tubuh terpotong → status "tracking tidak stabil", tidak ada jawaban.
- [ ] Jeda menghentikan timer & input kamera.
- [ ] Ekspor lalu impor kuis bergambar di browser lain.

## Status verifikasi
Lihat laporan akhir pembuat. Singkatnya: 21 tes logika murni (game engine, scoring, shuffle, zona kamera, format waktu, statistik) dijalankan lewat shim Node; tes skema, seluruh UI, dan build belum dijalankan.
