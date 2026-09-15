# Certify — Verifikasi Kredensial yang Tepercaya & Menjaga Privasi

*Dokumen penjelasan (non-teknis) — latar belakang, masalah, solusi, dan cara kerja.*

---

## Ringkasan Singkat

**Certify** adalah sistem penerbitan dan verifikasi kredensial akademik & kompetensi
(ijazah, sertifikat kompetensi, lisensi profesi) yang **tidak bisa dipalsukan** dan
**menjaga privasi pemiliknya**. Institusi menerbitkan kredensial secara digital,
pemilik menyimpannya sendiri, dan pihak mana pun (perusahaan, kampus, panitia
seleksi) dapat memverifikasinya dalam hitungan detik — **tanpa perlu menelепon
kampus** dan **tanpa memaksa pemilik membuka seluruh data pribadinya**.

---

## 1. Latar Belakang

Ijazah dan sertifikat adalah "tiket" penting dalam hidup: melamar kerja, mendaftar
beasiswa, mengikuti seleksi jabatan publik, hingga membuka praktik profesi. Karena
nilainya tinggi, dokumen ini juga menjadi **sasaran pemalsuan** yang masif.

Beberapa fenomena yang berulang kali menjadi sorotan media dan pemerintah:

- **Maraknya jual-beli dan pemalsuan ijazah.** Praktik "ijazah tembak", joki, dan
  jasa cetak ijazah palsu mudah ditemукan, bahkan terang-terangan ditawarkan secara
  daring. Kasusnya kerap muncul menjelang musim rekrutmen dan pemilihan umum
  (mis. temuan ijazah palsu pada calon pejabat/legislatif).
- **Sulit dan lambatnya proses verifikasi.** Bagian SDM perusahaan sering harus
  menghubungi kampus satu per satu untuk memastikan keaslian ijazah pelamar —
  proses manual yang lambat, tidak konsisten, dan mudah "dikadali" dengan dokumen
  palsu yang rapi.
- **Pemerintah sudah menyadari masalah ini.** Kemendikbudristek membangun sistem
  seperti **SIVIL** (Sistem Verifikasi Ijazah secara Elektronik) dan **PIN**
  (Penomoran Ijazah Nasional) untuk mengecek keaslian ijazah. Ini bukti nyata bahwa
  masalahnya diakui secara nasional — namun cakupan, ketergantungan pada satu
  otoritas pusat, dan aspek privasi masih menyisakan ruang perbaikan.
- **Sertifikat kompetensi & pelatihan pun rawan.** Bukan hanya ijazah; sertifikat
  keahlian (misalnya di bidang konstruksi, K3, IT, atau lisensi profesi) juga bisa
  dipalsukan, padahal taruhannya menyangkut keselamatan dan kualitas kerja.

> 📌 *Catatan: daftar tautan berita spesifik untuk mendukung poin-poin di atas ada
> pada bagian [Referensi](#referensi) di akhir dokumen — silakan lengkapi dengan
> sumber terkini yang relevan.*

---

## 2. Masalah yang Terjadi

Dari latar belakang di atas, ada empat masalah inti:

1. **Mudah dipalsukan.** Ijazah/sertifikat berupa kertas atau PDF gampang diedit,
   dicetak ulang, atau dibuat dari nol. Mata awam sulit membedакan asli dan palsu.
2. **Verifikasi mahal & lambat.** Memastikan keaslian butuh kontak manual ke
   penerbit, memakan waktu berhari-hari, dan tidak selalu tersedia (kampus tutup,
   arsip hilang, penerbit sudah tidak beroperasi).
3. **Terlalu banyak data pribadi terbuka.** Untuk membuktikan satu hal kecil
   (misal "IPK minimal 3,5" atau "punya sertifikat K3"), orang sering harus
   menyerahkan **seluruh** transkrip/ijazah — membuka data yang sebenarnya tidak
   perlu diketahui pihak lain.
4. **Ketergantungan pada satu pihak.** Bila verifikasi hanya bergantung pada satu
   server/otoritas, ada risiko: server mati, data diubah, atau akses dibatasi.

---

## 3. Dampak / Kerugian

- **Perusahaan & institusi** salah merekrut orang dengan kualifikasi palsu →
  kerugian biaya, risiko hukum, dan turunnya kualitas layanan.
- **Pemilik ijazah asli** dirugikan karena kredensialnya "disamакан" dengan yang
  palsu, dan privasinya terekspos saat melamar.
- **Masyarakat luas** menanggung risiko ketika profesi kritis (kesehatan,
  konstruksi, keuangan) diisi oleh pemegang sertifikat abal-abal.
- **Kepercayaan publik** terhadap gelar dan sertifikat menurun secara keseluruhan.

---

## 4. Solusi: Certify

Certify menjawab keempat masalah itu dengan tiga prinsip:

1. **Anti-palsu.** Setiap kredensial "disegel" secara digital dan dicatat pada
   **buku besar bersama (blockchain)** yang tidak bisa diubah diam-diam. Sekali
   diterbitkan, tidak seorang pun — termasuk penerbitnya — bisa memalsukan atau
   mengubahnya tanpa ketahuan.
2. **Verifikasi instan & mandiri.** Siapa pun bisa memeriksa keaslian sebuah
   kredensial langsung, dalam hitungan detik, tanpa perlu menghubungi kampus.
3. **Menjaga privasi (selective disclosure).** Pemilik bisa **membuktikan sebuah
   fakta tanpa membuka data aslinya**. Contoh: membuktikan "IPK saya ≥ 3,5" tanpa
   memberi tahu angka pastinya — mirip menunjukkan ke satpam bahwa Anda "sudah 17+"
   tanpa menyebutkan tanggal lahir.

Certify **melengkapi**, bukan menggantikan, upaya seperti SIVIL/PIN: idenya adalah
verifikasi yang **terdistribusi** (tidak bergantung satu server), **seketika**, dan
**hemat data pribadi**.

---

## 5. Bagaimana Cara Kerjanya (tanpa istilah teknis)

Ada tiga peran, dengan alur yang sederhana:

**① Penerbit (Issuer)** — misalnya kampus atau lembaga sertifikasi.
Menerbitkan kredensial untuk seseorang. Yang dicatat di buku besar bersama
hanyalah **"sidik jari digital"** (bukti keaslian) — bukan seluruh isi dokumen.
Jadi data pribadi tidak diumbar ke publik.

**② Pemilik (Holder)** — misalnya mahasiswa/pekerja.
Menyimpan kredensialnya sendiri di dompet digital. Ia yang **memutuskan** kapan dan
kepada siapa membagikannya, serta **bagian mana** yang dibuka.

**③ Pemverifikasi (Verifier)** — misalnya perusahaan atau panitia seleksi.
Meminta bukti atas hal spesifik ("apakah IPK ≥ 3,5?", "apakah keahliannya termasuk
salah satu dari {A, B, C}?", "apakah lisensinya belum kedaluwarsa?"). Sistem
memeriksa buktinya ke buku besar bersama dan menjawab **valid / tidak valid** —
**tanpa** pemverifikasi pernah melihat angka atau data aslinya.

Analogi inti: **"membuktikan tanpa memperlihatkan."** Seperti menunjukkan bahwa
kunci Anda cocok dengan gembok tertentu, tanpa harus menyerahkan kuncinya.

---

## 6. Apa yang Membuat Certify Berbeda

- **Buku besar bersama (blockchain):** catatan keaslian tersebar dan permanen — sulit
  dipalsukan atau dihapus diam-diam, tidak bergantung pada satu server.
- **Bukti tanpa buka data (zero-knowledge proof):** membuktikan fakta (ambang nilai,
  kepemilikan keahlian, masa berlaku) **tanpa** membocorkan data mentah.
- **Pemilik yang memegang kendali:** kredensial ada di tangan pemiliknya, bukan
  terkunci di satu institusi.
- **Fleksibel untuk banyak jenis kredensial:** tidak hanya ijazah/IPK, tapi juga
  sertifikat kompetensi (skor/level/keahlian) dan lisensi profesi (masa berlaku).

---

## 7. Manfaat untuk Setiap Pihak

| Pihak | Manfaat |
|---|---|
| **Kampus / Lembaga sertifikasi** | Reputasi terlindungi dari pemalsuan; beban layanan verifikasi manual berkurang drastis. |
| **Pemilik (mahasiswa/pekerja)** | Melamar lebih cepat & aman; hanya membuka data seperlunya. |
| **Perusahaan / Panitia seleksi** | Verifikasi instan, tepercaya, tanpa repot menghubungi penerbit. |
| **Masyarakat & regulator** | Ekosistem kredensial lebih jujur; profesi kritis lebih aman. |

---

## 8. Skenario Penggunaan (contoh)

> **Rina** lulus dengan IPK 3,8. Ia melamar kerja di perusahaan **Nusantara Tech**
> yang mensyaratkan IPK minimal 3,5.
>
> Alih-alih mengirim scan ijazah dan transkrip lengkap (yang memuat semua nilai,
> tanggal lahir, dan data lain), Rina cukup mengirim **bukti** bahwa "IPK ≥ 3,5".
> HRD Nusantara Tech memverifikasinya dalam hitungan detik: **valid**. Mereka yakin
> ijazah itu asli (tercatat di buku besar bersama) dan tahu Rina memenuhi syarat —
> **tanpa** pernah melihat angka IPK persisnya maupun data pribadi lain.
>
> Jika ada pelamar lain yang memakai ijazah palsu, buktinya **tidak akan cocok**
> dengan catatan penerbit, sehingga langsung ketahuan.

---

## 9. Keterbatasan & Rencana ke Depan

Certify saat ini adalah **prototипe kerja (proof of concept)** untuk membuktikan
konsep secara utuh — dari penerbitan, penyimpanan, hingga verifikasi yang menjaga
privasi. Untuk penggunaan nyata, langkah lanjutan mencakup:

- **Adopsi oleh penerbit resmi** (kampus/lembaga) dan integrasi dengan sistem yang
  sudah ada seperti SIVIL/PIN.
- **Enkripsi penuh** atas data pemilik agar hanya bisa dibaca oleh dirinya.
- **Tata kelola & aspek hukum** (siapa berhak menjadi penerbit, penanganan pencabutan
  kredensial, kepatuhan pada regulasi perlindungan data).
- **Kemudahan pakai** bagi pengguna awam (tanpa perlu paham teknologi di baliknya).

---

## 10. Penutup

Pemalsuan ijazah dan sertifikat adalah masalah nyata yang merugikan banyak pihak dan
menggerus kepercayaan publik. Certify menawarkan pendekatan yang **anti-palsu**,
**cepat diverifikasi**, dan **menghormati privasi** — menggeser verifikasi dari
"percaya pada selembar kertas" menjadi "percaya pada bukti yang tak bisa dipalsukan".

---

## Referensi

> Lengkapi dengan tautan berita/sumber terkini yang relevan. Beberapa jenis sumber
> yang mendukung dokumen ini:

1. Pemberitaan media nasional tentang **jual-beli / pemalsuan ijazah** —
   *[judul, media, tahun, tautan]*
2. Pemberitaan tentang **temuan ijazah palsu pada seleksi jabatan publik / rekrutmen** —
   *[judul, media, tahun, tautan]*
3. **Kemendikbudristek — SIVIL (Sistem Verifikasi Ijazah secara Elektronik)** —
   *https://ijazah.kemdikbud.go.id* (verifikasi keaslian ijazah nasional)
4. **Kemendikbudristek — PIN (Penomoran Ijazah Nasional)** — kebijakan penomoran
   ijazah untuk mencegah pemalsuan *[tautan resmi]*
5. Data/laporan tentang **kerugian akibat kredensial palsu** dalam rekrutmen —
   *[sumber, tahun, tautan]*

*(Tautan bertanda placeholder di atas perlu diisi/diverifikasi dengan sumber aktual
sebelum dipublikasikan.)*
