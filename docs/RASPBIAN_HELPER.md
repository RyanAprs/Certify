### Out of memory during build

```bash
# Add swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Change CONF_SWAPSIZE=100 to 2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Permission denied for Docker

```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

## Recommendations for Raspbian

1. **Use a Raspberry Pi 4** (4GB+ RAM) for the best performance
2. **Use a Class 10 SD card** or, even better, an **SSD via USB**
3. **Enable SSH** for remote access
4. **Set up a static IP** for consistent access

## Differences from regular Debian

There are no significant differences in the setup. All commands and scripts work the same way.
