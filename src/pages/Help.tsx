import { Link } from 'react-router-dom';

export default function Help() {
  return (
    <section>
      <h1>Bantuan</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <article className="card">
          <h2>Cara membuat kuis</h2>
          <ol className="steps">
            <li><span>Buka <Link to="/studio/new">Buat Kuis Baru</Link>, isi judul, mata pelajaran, dan kelas.</span></li>
            <li><span>Tambah soal; pilih jenis, isi opsi, dan tandai kunci jawaban.</span></li>
            <li><span>Atur poin dan waktu per soal, lalu tekan <b>Simpan</b>.</span></li>
          </ol>
        </article>
        <article className="card">
          <h2>Menyiapkan kamera & posisi berdiri</h2>
          <ul>
            <li>Pasang kamera setinggi dada dan arahkan ke area berdiri siswa.</li>
            <li>Pastikan tubuh terlihat dari bahu hingga pinggul dengan pencahayaan merata.</li>
            <li>Jalankan <Link to="/calibrate">Kalibrasi Kamera</Link>, uji tiap zona, lalu simpan.</li>
            <li>Zona dihitung dari posisi di gambar kamera, bukan lantai sebenarnya.</li>
          </ul>
        </article>
        <article className="card">
          <h2>Cara jawaban dinilai</h2>
          <p>Selama waktu berjalan, posisi siswa hanya pilihan sementara dan boleh berpindah. Jawaban dinilai saat waktu habis (atau saat guru menekan Selesaikan sekarang): zona benar hijau, zona lain merah.</p>
        </article>
        <article className="card">
          <h2>Pemecahan masalah</h2>
          <ul>
            <li><b>Izin kamera ditolak:</b> izinkan lewat ikon gembok di browser lalu muat ulang.</li>
            <li><b>Model pose belum tersedia:</b> jalankan <code>npm run prepare:assets</code> sekali (butuh internet).</li>
            <li><b>Kamera tidak ditemukan:</b> tutup aplikasi lain yang memakai kamera, pilih perangkat di Kalibrasi.</li>
            <li><b>Penyimpanan penuh:</b> ekspor di <Link to="/backup">Backup</Link>, lalu hapus kuis/hasil lama.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
