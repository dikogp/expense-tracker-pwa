# 🚀 Panduan Deploy Pengeluaranqu ke GitHub Pages

## 📋 Prerequisites

- [x] Git sudah terinstall
- [x] Akun GitHub aktif
- [x] Repository sudah dibuat
- [x] Aplikasi sudah siap untuk production

## 🔧 Persiapan Repository

### 1. Inisialisasi Git Repository (jika belum)

```bash
cd /Users/dikogigih/Library/CloudStorage/OneDrive-Pribadi/StudioProjects/Pengeluaranqu
git init
git branch -M main
```

### 2. Buat Repository di GitHub

1. Buka https://github.com
2. Klik tombol "New repository" (hijau)
3. Nama repository: `pengeluaranqu` atau `expense-tracker-pwa`
4. **Centang "Public"** (GitHub Pages gratis hanya untuk public repo)
5. **JANGAN** centang "Initialize with README" (karena sudah ada file lokal)
6. Klik "Create repository"

### 3. Hubungkan Repository Lokal dengan GitHub

```bash
# Ganti [USERNAME] dengan username GitHub Anda
git remote add origin https://github.com/[USERNAME]/pengeluaranqu.git

# Contoh:
# git remote add origin https://github.com/dikogigih/pengeluaranqu.git
```

## 📁 Optimisasi untuk Production

### 4. Buat file `.gitignore`

Mari kita buat file .gitignore untuk mengecualikan file yang tidak perlu:

```bash
# Buat file .gitignore
touch .gitignore
```

Isi file `.gitignore`:

```
# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
*.temp

# Node modules (jika ada)
node_modules/

# Build files (jika ada)
dist/
build/

# Cache
.cache/

# Environment files
.env
.env.local
.env.production
```

### 5. Optimisasi file `manifest.json`

Pastikan URL di manifest menggunakan relative path:

```json
{
  "name": "Pengeluaranqu - Kelola Keuangan Harian",
  "short_name": "Pengeluaranqu",
  "description": "Aplikasi PWA untuk mengelola keuangan harian dengan mudah",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#2196F3",
  "theme_color": "#2196F3",
  "orientation": "portrait",
  "scope": "./",
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 6. Pastikan Service Worker menggunakan relative paths

Cek file `sw.js` dan pastikan semua cache URLs menggunakan relative paths.

## 🚀 Deploy ke GitHub Pages

### 7. Commit dan Push semua file

```bash
# Add semua file
git add .

# Commit dengan pesan yang jelas
git commit -m "Initial commit: Pengeluaranqu PWA ready for production"

# Push ke GitHub
git push -u origin main
```

### 8. Aktifkan GitHub Pages

1. Buka repository di GitHub: `https://github.com/[USERNAME]/pengeluaranqu`
2. Klik tab **"Settings"** (di menu horizontal atas)
3. Scroll ke bawah ke bagian **"Pages"** (di menu sidebar kiri)
4. Di bagian **"Source"**:
   - Pilih: **"Deploy from a branch"**
   - Branch: **"main"**
   - Folder: **"/ (root)"**
5. Klik **"Save"**

### 9. Tunggu Deploy Process

- GitHub akan memproses deployment (biasanya 1-5 menit)
- Akan muncul notifikasi di bagian atas halaman Settings
- URL aplikasi akan muncul: `https://[USERNAME].github.io/pengeluaranqu`

## 🔍 Verifikasi Deployment

### 10. Test Aplikasi Live

```bash
# URL aplikasi Anda akan menjadi:
https://[USERNAME].github.io/pengeluaranqu

# Contoh:
# https://dikogigih.github.io/pengeluaranqu
```

### 11. Test PWA Features

1. **Buka di mobile browser** (Chrome/Safari)
2. **Test "Add to Home Screen"**
3. **Test offline functionality** (matikan internet)
4. **Test semua fitur utama**:
   - Login sebagai tamu
   - Tambah transaksi
   - Lihat dashboard
   - Navigation works

## 🔧 Custom Domain (Opsional)

### 12. Gunakan Custom Domain

Jika punya domain sendiri (misal: `pengeluaranqu.com`):

1. Buat file `CNAME` di root repository:

```bash
echo "pengeluaranqu.com" > CNAME
```

2. Setting DNS di domain provider:

```
Type: CNAME
Name: www (atau @)
Value: [USERNAME].github.io
```

3. Commit dan push file CNAME:

```bash
git add CNAME
git commit -m "Add custom domain"
git push origin main
```

## 🛠️ Maintenance & Updates

### 13. Update Aplikasi

Untuk update aplikasi di masa depan:

```bash
# Lakukan perubahan pada kode
# ...

# Commit changes
git add .
git commit -m "Update: [deskripsi perubahan]"

# Push ke GitHub
git push origin main
```

GitHub Pages akan otomatis deploy ulang (1-5 menit).

### 14. Monitor Performance

- **Google PageSpeed Insights**: Test performance
- **Chrome DevTools**: Test PWA features
- **GitHub Actions**: Setup CI/CD (advanced)

## 📊 Analytics & Monitoring

### 15. Add Google Analytics (Opsional)

Tambahkan di `<head>` section file `index.html`:

```html
<!-- Google Analytics -->
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", "GA_MEASUREMENT_ID");
</script>
```

## 🔒 Security Best Practices

### 16. HTTPS & Security Headers

GitHub Pages otomatis menggunakan HTTPS, tapi untuk keamanan extra:

1. **Pastikan semua resources menggunakan HTTPS**
2. **Update Content Security Policy** (jika ada)
3. **Regular dependency updates**

## 📝 Documentation

### 17. Update README.md

Buat README yang informatif dengan:

- Deskripsi aplikasi
- Features list
- Live demo link
- Installation instructions
- Screenshots

## 🎉 Final Checklist

- [ ] Repository dibuat dan public
- [ ] Semua file sudah di push ke GitHub
- [ ] GitHub Pages sudah diaktifkan
- [ ] Aplikasi dapat diakses via URL GitHub Pages
- [ ] PWA features berfungsi (Add to Home Screen)
- [ ] Offline functionality works
- [ ] Semua fitur utama tested
- [ ] Mobile responsive
- [ ] Performance optimal

## 🔗 Useful Links

- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **PWA Checklist**: https://web.dev/pwa-checklist/
- **Lighthouse PWA Audit**: Chrome DevTools > Lighthouse
- **Web App Manifest Generator**: https://app-manifest.firebaseapp.com/

---

**🚀 Selamat! Aplikasi Pengeluaranqu Anda sudah live di internet!**

URL Aplikasi: `https://[USERNAME].github.io/pengeluaranqu`
