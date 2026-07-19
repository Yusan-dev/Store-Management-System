# GT MASTER DASHBOARD - Tomcat Deployment Guide

## Quick Deploy ke Tomcat

### Langkah 1: Siapkan File WAR
1. Copy isi folder `GT_MASTER_DASHBOARD`
2. Buat file baru `META-INF/context.xml` dengan isi:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context path="/dashboard" />
```

3. Zip semua file → ubah nama jadi `dashboard.war`

### Langkah 2: Deploy ke Tomcat
1. Copy `dashboard.war` ke folder `tomcat/webapps/`
2. Restart Tomcat (atau tunggu auto-deploy)
3. Akses: `http://localhost:8080/dashboard`

### Langkah 3: Akses di Komputer Toko
Buka browser → `http://IP_TOMCAT_SERVER:8080/dashboard`

---

## Alternatif: Hot Deployment (Tanpa WAR)

1. Buat folder `dashboard` di `tomcat/webapps/`
2. Copy semua file website ke `tomcat/webapps/dashboard/`
3. Akses: `http://localhost:8080/dashboard`

---

## Troubleshooting

### Error 404
- Pastikan folder `dashboard` ada di `tomcat/webapps/`
- Restart Tomcat service

### Port 8080 conflict
- Edit `tomcat/conf/server.xml`
- Ganti `<Connector port="8080" ... />` ke port lain

---

## Keuntungan Tomcat

✅ Tidak diblock firewall (normal HTTP)
✅ Bisa akses dari komputer lain via IP
✅ Stabil & production-ready
✅ Tidak perlu install tambahan
✅ Bisa setting auto-start dengan Windows Service
