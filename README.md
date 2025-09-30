# 💰 Pengeluaranqu - PWA Expense Tracker

<div align="center">
  <img src="icons/icon-192x192.png" alt="Pengeluaranqu Logo" width="120" height="120">
  
  **Kelola keuangan harian dengan mudah dan praktis**
  
  [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](#)
  [![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/pwa-checklist/)
  [![Responsive](https://img.shields.io/badge/Design-Responsive-orange)](#)
  [![License](https://img.shields.io/badge/License-MIT-green)](#)
</div>

Aplikasi Progressive Web App (PWA) untuk mencatat dan mengelola keuangan harian dengan fitur lengkap dan modern.

## 🚀 Fitur Utama

### 📊 Dashboard

- Ringkasan pengeluaran harian, mingguan, dan bulanan
- Kartu statistik yang informatif
- Daftar pengeluaran terkini
- Quick action button untuk menambah pengeluaran

### ➕ Tambah Pengeluaran

- Form yang mudah digunakan
- 8 kategori pengeluaran yang umum
- Input jumlah dengan format mata uang Indonesia
- Pilihan tanggal dan waktu
- Deskripsi opsional

### 📋 Riwayat

- Daftar lengkap semua pengeluaran
- Filter berdasarkan bulan dan kategori
- Total pengeluaran terfilter
- Edit dan hapus pengeluaran
- Pencarian dan sorting

### 📈 Analisis

- Grafik pie untuk pengeluaran per kategori
- Grafik trend pengeluaran harian/bulanan
- Statistik rata-rata harian
- Kategori dengan pengeluaran tertinggi
- Total transaksi

## 🔧 Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Storage**: LocalStorage + IndexedDB
- **PWA**: Service Worker, Web App Manifest
- **Responsive**: Mobile-first design
- **Offline**: Full offline functionality

## 📱 Fitur PWA

- **Installable**: Dapat diinstall di perangkat
- **Offline Support**: Bekerja tanpa koneksi internet
- **Responsive**: Optimized untuk semua ukuran layar
- **Fast Loading**: Service worker caching
- **Push Notifications**: Reminder pengeluaran
- **Background Sync**: Sinkronisasi data otomatis

## 🏗️ Struktur Proyek

```
Pengeluaranqu/
├── index.html              # Halaman utama
├── manifest.json           # Web App Manifest
├── sw.js                   # Service Worker
├── css/
│   └── style.css          # Stylesheet utama
├── js/
│   ├── app.js             # Logika aplikasi utama
│   ├── storage.js         # Manajemen penyimpanan
│   ├── ui.js              # Interaksi UI
│   └── charts.js          # Grafik dan visualisasi
├── icons/                 # Icon PWA (berbagai ukuran)
└── README.md              # Dokumentasi
```

## 🚀 Cara Menjalankan

### 1. Development Server

```bash
# Gunakan server HTTP sederhana
python -m http.server 8000
# atau
npx serve .
# atau
php -S localhost:8000
```

### 2. Akses Aplikasi

Buka browser dan kunjungi:

```
http://localhost:8000
```

### 3. Install sebagai PWA

- Di Chrome: Klik ikon "Install" di address bar
- Di Firefox: Menu > Install This Site as App
- Di Safari: Share > Add to Home Screen

## 📊 Kategori Pengeluaran

1. 🍽️ **Makanan & Minuman** - Pengeluaran untuk makanan sehari-hari
2. 🚗 **Transportasi** - Ongkos perjalanan, bensin, parkir
3. 🛒 **Belanja** - Kebutuhan rumah tangga, pakaian
4. 🎬 **Hiburan** - Film, game, rekreasi
5. 🏥 **Kesehatan** - Obat, dokter, medical checkup
6. 📚 **Pendidikan** - Buku, kursus, sekolah
7. 💳 **Tagihan** - Listrik, air, internet, cicilan
8. 📝 **Lainnya** - Pengeluaran yang tidak masuk kategori lain

## 💾 Penyimpanan Data

### LocalStorage

- Data pengeluaran utama
- Pengaturan aplikasi
- Backup otomatis

### IndexedDB (Opsional)

- Untuk dataset yang lebih besar
- Pencarian yang lebih cepat
- Sinkronisasi offline

## 🎨 Desain & UI/UX

### Tema

- **Primary Color**: #2196F3 (Material Blue)
- **Secondary Color**: #FFC107 (Amber)
- **Success**: #4CAF50 (Green)
- **Danger**: #F44336 (Red)

### Responsiveness

- **Mobile First**: Optimized untuk smartphone
- **Tablet**: Layout yang disesuaikan
- **Desktop**: Full features dengan grid layout

### Accessibility

- Keyboard navigation
- Screen reader support
- High contrast support
- Focus indicators

## 📱 Kompatibilitas

### Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Platform Support

- Android 6.0+
- iOS 13+
- Windows 10+
- macOS 10.15+

## 🔐 Keamanan & Privacy

- **Data Lokal**: Semua data disimpan di device pengguna
- **No Tracking**: Tidak ada pelacakan pengguna
- **Offline First**: Tidak memerlukan koneksi internet
- **Open Source**: Code terbuka dan dapat diaudit

## 🚀 Deployment

### GitHub Pages

```bash
# Push ke repository GitHub
git add .
git commit -m "Deploy PWA"
git push origin main

# Enable GitHub Pages di settings repository
```

### Netlify

```bash
# Drag & drop folder ke Netlify dashboard
# atau gunakan Netlify CLI
netlify deploy --prod --dir .
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🛠️ Development

### Prerequisites

- Modern web browser
- HTTP server (untuk testing PWA features)
- Text editor (VS Code recommended)

### Setup Development

```bash
# Clone repository
git clone <repository-url>
cd pengeluaranqu

# Start development server
python -m http.server 8000

# Open browser
open http://localhost:8000
```

### Code Structure

#### JavaScript Modules

- **app.js**: Main application logic, state management
- **storage.js**: LocalStorage and IndexedDB operations
- **ui.js**: UI interactions, form validation, animations
- **charts.js**: Chart.js integration and data visualization

#### CSS Organization

- CSS Custom Properties untuk theming
- Mobile-first responsive design
- Component-based styling
- Dark mode support

## 🧪 Testing

### Manual Testing

- [ ] Tambah pengeluaran
- [ ] Edit pengeluaran
- [ ] Hapus pengeluaran
- [ ] Filter riwayat
- [ ] View analytics
- [ ] Offline functionality
- [ ] PWA installation

### Browser Testing

- [ ] Chrome (Android & Desktop)
- [ ] Firefox (Mobile & Desktop)
- [ ] Safari (iOS & macOS)
- [ ] Edge (Windows)

## 📈 Roadmap

### v1.1

- [ ] Export data ke CSV/PDF
- [ ] Import data dari file
- [ ] Multiple currencies
- [ ] Budget planning
- [ ] Recurring expenses

### v1.2

- [ ] Cloud sync (optional)
- [ ] Multi-user support
- [ ] Advanced analytics
- [ ] Receipt photo capture
- [ ] Voice input

### v2.0

- [ ] Income tracking
- [ ] Financial goals
- [ ] Bill reminders
- [ ] Category customization
- [ ] Advanced reporting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) untuk visualisasi data
- [Material Design](https://material.io/) untuk design inspiration
- [PWA Builder](https://www.pwabuilder.com/) untuk PWA best practices
- Indonesian community developers

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:

1. Check existing [Issues](https://github.com/yourusername/pengeluaranqu/issues)
2. Create new issue dengan detail yang lengkap
3. Join discussion di [Discussions](https://github.com/yourusername/pengeluaranqu/discussions)

---

**Made with ❤️ in Indonesia**
