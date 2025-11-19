### Out of memory saat build

```bash
# Tambah swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Ubah CONF_SWAPSIZE=100 menjadi 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Permission denied untuk Docker

```bash
sudo usermod -aG docker $USER
# Log out dan log in kembali
```

## Rekomendasi untuk Raspbian

1. **Gunakan Raspberry Pi 4** (4GB+ RAM) untuk performa terbaik
2. **Gunakan SD card kelas 10** atau lebih baik lagi **SSD via USB**
3. **Enable SSH** untuk remote access
4. **Setup static IP** untuk akses yang konsisten

## Perbedaan dengan Debian biasa

Tidak ada perbedaan signifikan dalam setup. Semua command dan script bekerja sama.
