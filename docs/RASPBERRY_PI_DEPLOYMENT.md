# Deployment di Raspberry Pi (Raspbian/Debian)

Panduan lengkap untuk menginstall dan menjalankan Certify di Raspberry Pi dengan OS Raspbian atau Debian.

## Persyaratan Sistem

- Raspberry Pi (3B+ atau lebih baru direkomendasikan)
- **Raspbian** (Raspberry Pi OS) atau **Debian** OS
- Koneksi internet
- Minimal 2GB RAM (4GB+ direkomendasikan)
- Minimal 8GB storage (16GB+ direkomendasikan)

## Kompatibilitas OS

Script dan setup ini **100% kompatibel** dengan:

- ✅ **Raspbian** (Raspberry Pi OS) - Semua versi
- ✅ **Debian** - Versi 10 (Buster) atau lebih baru
- ✅ **Ubuntu** - Versi 20.04 atau lebih baru (untuk referensi)

Script akan otomatis mendeteksi OS yang digunakan dan memberikan konfirmasi kompatibilitas.

## Opsi Instalasi

Ada dua cara untuk menginstall Certify di Raspberry Pi:

### Opsi 1: Docker (Direkomendasikan)

**Keuntungan:**

- Isolasi dependencies
- Mudah update dan rollback
- Tidak mengotori sistem
- Konsisten di berbagai environment

**Kekurangan:**

- Membutuhkan lebih banyak RAM
- Perlu install Docker terlebih dahulu

**Catatan untuk Raspbian:**

- Docker secara otomatis mendeteksi architecture ARM (armv7/arm64) dan menggunakan image yang sesuai
- Build time mungkin lebih lama di Raspberry Pi karena architecture ARM
- Pastikan Raspberry Pi memiliki minimal 2GB RAM untuk Docker (4GB+ direkomendasikan)

### Opsi 2: Manual Setup (Tanpa Docker)

**Keuntungan:**

- Lebih ringan di resource
- Kontrol penuh atas konfigurasi
- Tidak perlu Docker

**Kekurangan:**

- Lebih kompleks untuk maintenance
- Dependencies terinstall langsung di sistem

---

## Opsi 1: Instalasi dengan Docker

### Langkah 1: Clone Repository

```bash
git clone https://github.com/RyanAprs/Certify.git
cd Certify
```

### Langkah 2: Jalankan Setup Script

```bash
chmod +x scripts/setup-docker.sh
sudo ./scripts/setup-docker.sh
```

Script ini akan:

- Install Docker dan Docker Compose (jika belum ada)
- Membuat file `.env` dengan session secret
- Build dan start container untuk backend dan frontend

### Langkah 3: Konfigurasi Environment Variables

Edit file `.env` di root project:

```bash
nano .env
```

Tambahkan konfigurasi yang diperlukan (lihat `backend/.env.example` dan `frontend/.env.example`).

### Langkah 4: Rebuild Container (jika perlu)

```bash
docker compose down
docker compose up -d --build
```

### Manajemen Container

```bash
# Lihat logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Lihat status
docker compose ps

# Update code dan rebuild
git pull
docker compose up -d --build
```

---

## Opsi 2: Instalasi Manual (Tanpa Docker)

### Langkah 1: Clone Repository

```bash
git clone https://github.com/RyanAprs/Certify.git
cd Certify
```

### Langkah 2: Jalankan Setup Script

```bash
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

Script ini akan:

- Update sistem packages
- Install Node.js 20.x
- Install build essentials (gcc, make, dll)
- Install PM2 untuk process management
- Install dan setup nginx
- Build backend dan frontend
- Setup PM2 ecosystem file

### Langkah 3: Deployment Contracts

```
cd contracts
cp .env.example .env
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

### Langkah 4: Konfigurasi Environment Variables

**Backend:**

```bash
cd backend
cp .env.example .env
nano .env
```

Isi dengan konfigurasi yang sesuai:

```env
PORT=4000
FRONTEND_URL=http://localhost:80
SESSION_SECRET=<generate-random-string>
NODE_ENV=production
```

**Frontend:**

```bash
cd ../frontend
cp .env.example .env
nano .env
```

Isi dengan konfigurasi yang sesuai:

```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_WALLETCONNECT_ID="wc_demo"
VITE_CONTRACT_ADDRESS="0xYourContract"
VITE_VERIFIER_ADDRESS="0xYourVerifier"
VITE_ZKEY_URL="/zk/certify.zkey"
VITE_WASM_URL="/zk/certify.wasm"
VITE_PINATA_JWT="YOUR_PINATA_JWT"
VITE_GATEWAY_URL="your-gateway.mypinata.cloud"
```

### Langkah 5: Run

**Contracts:**

```bash
cd contracts
npx hardhat node
```

Copy private key untuk login

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

buka di browser `http://localhost:5173/`
