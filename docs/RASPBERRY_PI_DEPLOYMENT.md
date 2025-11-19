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

### Langkah 3: Konfigurasi Environment Variables

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
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_CONTRACT_ADDRESS=0x...
VITE_VERIFIER_ADDRESS=0x...
VITE_IPFS_PROJECT_ID=YOUR_ID
VITE_IPFS_PROJECT_SECRET=YOUR_SECRET
VITE_API_BASE_URL=http://localhost:4000
VITE_WALLETCONNECT_ID=wc_demo
```

### Langkah 4: Rebuild Frontend (jika env berubah)

```bash
cd frontend
npm run build
```

### Langkah 5: Start Services dengan PM2

```bash
cd ~/Certify
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Perintah terakhir akan memberikan instruksi untuk enable PM2 pada boot.

### Manajemen Services

```bash
# Lihat status
pm2 status

# Lihat logs
pm2 logs certify-backend

# Restart
pm2 restart certify-backend

# Stop
pm2 stop certify-backend

# Monitor
pm2 monit
```

### Update Nginx Config (jika perlu)

```bash
sudo nano /etc/nginx/sites-available/certify
sudo nginx -t
sudo systemctl restart nginx
```

---

## Konfigurasi Network

### Akses dari Jaringan Lokal

Setelah instalasi, aplikasi dapat diakses dari perangkat lain di jaringan yang sama:

```
http://<raspberry-pi-ip-address>
```

Untuk mengetahui IP address Raspberry Pi:

```bash
hostname -I
```

### Akses dari Internet (Opsional)

Jika ingin mengakses dari internet, perlu setup:

1. Port forwarding di router (port 80)
2. Dynamic DNS (jika IP dinamis)
3. SSL certificate (Let's Encrypt) untuk HTTPS

**Setup HTTPS dengan Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

### Port 80 sudah digunakan

```bash
# Cek proses yang menggunakan port 80
sudo lsof -i :80

# Atau ubah port di nginx config
sudo nano /etc/nginx/sites-available/certify
# Ubah listen 80 menjadi listen 8080
```

### Backend tidak bisa start

```bash
# Cek logs
pm2 logs certify-backend
# atau
docker compose logs backend

# Cek apakah port 4000 tersedia
sudo lsof -i :4000
```

### Frontend tidak load

```bash
# Cek nginx status
sudo systemctl status nginx

# Cek nginx logs
sudo tail -f /var/log/nginx/error.log

# Pastikan build folder ada
ls -la frontend/dist
```

### Memory issues

Raspberry Pi dengan RAM terbatas mungkin perlu swap:

```bash
# Cek swap
free -h

# Tambah swap (jika perlu)
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Ubah CONF_SWAPSIZE=100 menjadi 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Docker permission denied

```bash
sudo usermod -aG docker $USER
# Log out dan log in kembali
```

---

## Monitoring & Maintenance

### Auto-restart on Reboot

**Docker:**

```bash
# Docker Compose sudah auto-restart dengan restart: unless-stopped
# Pastikan Docker service enabled
sudo systemctl enable docker
```

**PM2:**

```bash
pm2 startup
# Ikuti instruksi yang diberikan
```

### Backup

```bash
# Backup database/config (jika ada)
# Backup .env files
tar -czf certify-backup-$(date +%Y%m%d).tar.gz \
  backend/.env \
  frontend/.env \
  ecosystem.config.js
```

### Update

**Docker:**

```bash
git pull
docker compose down
docker compose up -d --build
```

**Manual:**

```bash
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart certify-backend
sudo systemctl restart nginx
```

---

## Performance Tips

1. **Gunakan SSD** untuk storage (jika memungkinkan)
2. **Overclock** Raspberry Pi (dengan cooling yang memadai)
3. **Disable services** yang tidak diperlukan
4. **Monitor resource** dengan `htop` atau `pm2 monit`
5. **Gunakan reverse proxy** (nginx) untuk caching static files

---

## Keamanan

1. **Ubah default password** Raspberry Pi
2. **Setup firewall** (ufw):
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```
3. **Gunakan HTTPS** untuk production
4. **Rotate SESSION_SECRET** secara berkala
5. **Update sistem** secara rutin:
   ```bash
   sudo apt-get update && sudo apt-get upgrade
   ```

---

## Support

Jika mengalami masalah:

1. Cek logs (PM2 atau Docker)
2. Cek dokumentasi di `docs/`
3. Cek GitHub issues (jika ada)
