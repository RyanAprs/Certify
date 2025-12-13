# Certify

Sistem verifikasi sertifikat akademik berbasis blockchain yang menggabungkan Solidity (Hardhat), React + Wagmi, IPFS, Zero-Knowledge Proof (ZKP), serta autentikasi SIWE (Sign-In with Ethereum).

## Monorepo Struktur

```
Certify
├─ contracts/        # Hardhat + Solidity
├─ frontend/         # React + Vite + RainbowKit
└─ backend/          # Express API untuk autentikasi SIWE
```

## Fitur Utama

- **Issuer**: kelola anggota, terbitkan sertifikat dengan metadata/IPFS image, simpan komitmen hash on-chain
- **Holder**: ajukan join, lihat koleksi, berbagi sertifikat dengan selective disclosure + signature proof
- **Verifier**: cari sertifikat per ID, cek daftar disclosure, jalankan verifikasi proof melalui kontrak
- **ZKP**: integrasi Circom/snarkjs untuk selective disclosure, mock verifier menggunakan signature (siap diganti Groth16/Plonk)
- **Autentikasi**: Sign-In with Ethereum (SIWE) dengan backend Express + cookie session

## Kontrak Solidity

- `CertifyRegistry` – registry utama (issuer, holder, certificates, disclosures, ZK verification)
- `ZKMockVerifier` – placeholder verifier berbasis signature

### Deploy

```
cd contracts
cp .env.example .env
npm install
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

## Backend (SIWE Auth)

```
cd backend
cp .env.example .env
npm install
npm run dev
```

Env penting:

- `PORT` – default 4000
- `SESSION_SECRET` – minimal 32 char acak

Endpoint:

- `GET /api/auth/nonce`
- `POST /api/auth/verify`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Frontend

```
cd frontend
cp .env.example .env  # tambahkan VITE_API_BASE_URL untuk pointing ke backend
npm install
npm run dev
```

### Routing Per Peran

Frontend kini memakai React Router dengan halaman terpisah:

- `/Landing`
- `/issuer`
- `/holder`
- `/verifier`

Setiap page dibungkus `AuthGuard` → wajib SIWE login sebelum akses dashboard.

### IPFS & Upload Image

Issuer dapat mengunggah gambar sertifikat (PNG/JPG). Flow:

1. File diunggah ke IPFS → menghasilkan `imageCid`
2. Metadata JSON berisi detail akademik + `imageCid` diunggah ke IPFS → `metadataCid`
3. Komitmen = hash (`keccak256`) dari metadata JSON → disimpan on-chain
4. Holder/Verifier dapat melihat preview image dari IPFS langsung di UI

### Env vars

- `VITE_RPC_URL`, `VITE_CONTRACT_ADDRESS`, `VITE_VERIFIER_ADDRESS`
- `VITE_IPFS_PROJECT_ID`, `VITE_IPFS_PROJECT_SECRET`
- `VITE_WASM_URL`, `VITE_ZKEY_URL`
- `VITE_API_BASE_URL` → `http://localhost:4000`

### Flow ZKP

1. Holder memilih field → dihitung `queryHash`
2. Holder menghasilkan proof + signature (mock) sebelum share
3. Proof + payload terenkripsi diunggah ke IPFS dan dicatat sebagai disclosure
4. Verifier mengambil signature proof + menjalankan `verifySelectiveProof`

## Selective Disclosure

- `metadataCommitment`: komitmen hash ke metadata lengkap
- Holder membuka subset data → hash subset (`queryHash`). Event `CertificateShared` menyimpan `queryHash` + CID payload terenkripsi

## Pengembangan

- Tailwind untuk styling, React Query untuk data, React Router untuk halaman
- Wagmi + RainbowKit untuk koneksi wallet, AuthContext + SIWE untuk session
- IPFS helper (`src/lib/ipfs.ts`) menangani upload JSON + file
- snarkjs helper (`src/lib/zkp.ts`) siap pakai untuk integrasi Groth16

## Deployment di Raspberry Pi

Untuk instalasi di Raspberry Pi dengan OS **Raspbian** (Raspberry Pi OS) atau **Debian**, tersedia dua opsi:

### Opsi 1: Docker (Direkomendasikan)

```bash
chmod +x scripts/setup-docker.sh
sudo ./scripts/setup-docker.sh
```

Script akan install Docker, build container, dan start services. Lihat `docs/RASPBERRY_PI_DEPLOYMENT.md` untuk detail lengkap.

### Opsi 2: Manual Setup

```bash
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

Script akan install Node.js, PM2, nginx, dan setup semua dependencies. Lihat `docs/RASPBERRY_PI_DEPLOYMENT.md` untuk panduan lengkap.

**Dokumentasi lengkap:** `docs/RASPBERRY_PI_DEPLOYMENT.md`

## Langkah Berikutnya

- Ganti `ZKMockVerifier` dengan kontrak verifier hasil `snarkjs zkey export solidityverifier`
- Tambahkan penyimpanan terdistribusi untuk payload disclosure (misal Lit Protocol)
- Hardening backend session store (Redis) + rate limiting
- Tambah notifikasi (Push Protocol / XMTP) saat disclosure dibuat
