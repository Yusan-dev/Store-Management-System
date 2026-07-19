# GT MASTER DASHBOARD - Setup Guide

## Quick Start (30 detik)

### Di Komputer Toko:
1. Buka folder `GT_MASTER_DASHBOARD`
2. Double-click `start-server.bat`
3. Buka browser → `http://localhost:8080`
4. Done! ✅

---

## Cara Kerja

Script `start-server.bat` akan:
- Start HTTP server di port 8080 menggunakan `http-server` (Node.js)
- Buka website di `http://localhost:8080`
- Website akan berjalan **tanpa internet** di toko

---

## Troubleshooting

### Error: "npx is not recognized"
Install Node.js dari: https://nodejs.org (download LTS version)

### Error: "Port 8080 already in use"
1. Tutup browser lain
2. Atau edit `start-server.bat` ganti `8080` jadi `8081`

### Error: "Cannot find module"
Jalankan command ini dulu di folder project:
```
npm install -g http-server
```

---

## Tips

- ✅ Pilih "Keep this window open" saat script running
- ✅ Browser bisa dibuka di komputer lain dengan IP: `http://192.168.x.x:8080`
- ✅ Server tetap jalan sampai Ctrl+C atau close terminal
