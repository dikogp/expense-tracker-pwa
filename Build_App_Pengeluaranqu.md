PT. Digi Nusa Sudibyo

> **Build** **App** **Pengeluaranqu**
>
> Business Requirement Document
>
> Created: 30 September 2025
>
> CONFIDENTIAL - INTERNAL USE ONLY

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**Table** **of** **Contents**

1\. Informasi Umum 3

2\. Tujuan Bisnis 4

3\. Ruang Lingkup 5

5\. Kebutuhan Bisnis 6

8\. Biaya & Sumber Daya 7

9\. Asumsi & Risiko 8

> Page 1 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**1.** **Informasi** **Umum**

**Ringkasan** **Eksekutif**

Di tengah meningkatnya kesadaran finansial di kalangan masyarakat
Indonesia, banyak individu masih menghadapi kesulitan dalam mengelola
keuangan pribadi. Hambatan utamanya adalah kurangnya alat yang
sederhana, mudah diakses, dan tidak mengintimidasi. Aplikasi keuangan
yang ada di pasaran seringkali terlalu kompleks, sarat dengan fitur yang
tidak relevan bagi pemula, atau memerlukan proses instalasi melalui toko
aplikasi (app store) yang menciptakan friksi bagi pengguna baru.

Sebagai solusi atas permasalahan tersebut, dokumen ini mengusulkan
pengembangan "Pengeluaranqu," sebuah Progressive Web App (PWA) yang
didedikasikan untuk pencatatan pengeluaran harian. Produk ini dirancang
dengan fokus utama pada kesederhanaan, kecepatan, dan pengalaman
pengguna yang tanpa hambatan. Sebagai PWA, "Pengeluaranqu" dapat diakses
secara instan di semua perangkat melalui browser web, dapat diinstal di
layar utama (home screen) layaknya aplikasi native, dan yang terpenting,
dapat berfungsi bahkan dengan koneksi internet yang tidak stabil atau
dalam mode offline.

**Latar** **Belakang**

> Page 2 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

Analisis Pasar dan Kebutuhan Pengguna

Pasar aplikasi keuangan pribadi di Indonesia menunjukkan tren
pertumbuhan yang signifikan, didorong oleh dua faktor utama: peningkatan
penetrasi digital dan kesadaran yang semakin tinggi akan pentingnya
literasi finansial. Semakin banyak orang mencari cara untuk
mengendalikan arus kas mereka, merencanakan masa depan, dan mencapai
tujuan keuangan.

Analisis kualitatif terhadap ulasan dan komentar pengguna aplikasi
sejenis menunjukkan motivasi fundamental di balik penggunaan alat
pencatat keuangan. Pengguna tidak hanya ingin mencatat transaksi, tetapi
juga mencari "kendali" atas keuangan mereka, kemampuan untuk "mengurangi
pengeluaran yang tidak perlu," dan sarana untuk "menabung demi masa
depan". Tujuan akhirnya adalah mencapai ketenangan pikiran finansial
(financial peace of mind).

Namun, terlepas dari motivasi yang kuat, banyak pengguna menghadapi
hambatan signifikan yang menyebabkan mereka berhenti menggunakan
aplikasi tersebut. Proses pencatatan sering dianggap "membosankan,"
"merepotkan," dan yang paling umum, mudah "lupa" untuk dilakukan secara
konsisten. Hal ini mengindikasikan bahwa kecepatan dan kemudahan input
data bukanlah sekadar fitur tambahan, melainkan faktor krusial yang
menentukan tingkat adopsi dan retensi pengguna. Sebuah aplikasi yang
dapat mengurangi friksi dalam proses pencatatan harian memiliki peluang
besar untuk berhasil.

Lanskap Kompetitif

Pasar saat ini didominasi oleh aplikasi native yang kaya fitur, seperti
Money Lover, Spendee, dan Wallet, yang telah berhasil menarik basis
pengguna yang signifikan di Indonesia. Aplikasi-aplikasi ini umumnya
menawarkan fungsionalitas canggih, termasuk sinkronisasi otomatis dengan
rekening bank, pelacakan portofolio investasi, dan manajemen
utang-piutang yang komprehensif.

Meskipun fitur-fitur canggih ini berharga bagi pengguna yang sudah
mahir, keberadaannya justru menciptakan celah pasar yang dapat
dieksploitasi. Fitur seperti sinkronisasi rekening bank, misalnya,
mengharuskan pengguna untuk membagikan kredensial perbankan mereka, yang
menimbulkan kekhawatiran privasi dan keamanan yang valid bagi sebagian
besar segmen pengguna. Selain itu, proses otorisasi dengan pihak bank
bisa jadi rumit dan tidak semua bank di Indonesia didukung secara penuh,
menciptakan pengalaman yang frustasi. Sebaliknya, aplikasi seperti
Monefy dipuji karena pendekatannya yang sederhana dan berfokus pada
input manual yang cepat. Dengan tidak memaksakan fitur kompleks pada
tahap awal, "Pengeluaranqu" dapat menarik segmen pengguna yang lebih
luas yang memprioritaskan privasi, kesederhanaan, dan kemudahan
penggunaan, sekaligus mengurangi kompleksitas dan biaya pengembangan
awal secara signifikan.

Justifikasi Teknologi: Progressive Web App (PWA)

Pemilihan teknologi Progressive Web App (PWA) untuk "Pengeluaranqu"
adalah keputusan strategis yang didasarkan pada analisis mendalam
terhadap kebutuhan pasar dan tujuan bisnis. PWA secara unik
menggabungkan jangkauan web yang universal dengan fungsionalitas canggih
yang biasanya hanya ditemukan pada aplikasi native.

Keunggulan strategis dari penggunaan PWA meliputi:

Biaya Pengembangan Lebih Rendah: Dengan PWA, pengembangan dilakukan pada
satu basis kode (codebase) yang dapat berjalan di semua platform (iOS,
Android, Desktop). Ini secara signifikan mengurangi biaya dan waktu
pengembangan dibandingkan dengan keharusan membangun dan memelihara dua
atau tiga aplikasi native yang terpisah.

Aksesibilitas Instan dan Akuisisi Tanpa Friksi: Pengguna dapat langsung
mengakses dan menggunakan "Dompet Cerdas" dari browser mereka hanya
dengan satu klik pada sebuah tautan. Tidak ada kebutuhan untuk
mengunjungi App Store atau Play Store, mencari aplikasi, dan menunggu
proses pengunduhan dan instalasi. Penghapusan langkah-langkah ini secara
drastis mengurangi friksi dalam proses akuisisi pengguna, sebuah faktor
kritis untuk menarik pengguna yang ragu-ragu mencoba aplikasi baru.

Kemampuan Offline yang Andal: Dengan implementasi service workers, PWA
dapat menyimpan data secara lokal di perangkat pengguna. Ini
memungkinkan pengguna untuk terus mencatat transaksi pengeluaran bahkan
ketika mereka tidak memiliki koneksi internet. Data tersebut akan secara
otomatis disinkronkan dengan server saat koneksi kembali tersedia. Fitur
ini sangat krusial untuk pasar seperti Indonesia, di mana kualitas dan
stabilitas koneksi internet dapat bervariasi.

Peningkatan Keterlibatan Pengguna: PWA mendukung fitur-fitur yang
mendorong keterlibatan,

seperti kemampuan "Tambah ke Layar Utama" yang menempatkan ikon aplikasi
langsung di home Page 3 of 10 screen pengguna, dan push notifications
untuk pengingat atau wawasan keuangan. Fitur-fitur ini

membuat PWA terasa dan berfungsi seperti aplikasi native, meningkatkan
retensi dan frekuensi

penggunaan.

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**2.** **Tujuan** **Bisnis**

> • Menjadi aplikasi keuangan pilihan utama bagi jutaan masyarakat
> Indonesia yang baru memulai perjalanan mereka menuju kesehatan
> finansial, dengan menyediakan alat yang paling mudah digunakan, paling
> memotivasi, dan paling tidak mengintimidasi di pasar.
>
> • Akuisisi Pengguna: Mencapai 100.000 Pengguna Aktif Bulanan (MAU)
> dalam 12 bulan pertama setelah peluncuran resmi.
>
> • Keterlibatan Pengguna: Mencapai rasio DAU/MAU (Stickiness Ratio)
> sebesar 25% atau lebih tinggi. Metrik ini mengindikasikan bahwa
> aplikasi telah berhasil menjadi bagian dari kebiasaan harian pengguna,
> bukan hanya aplikasi yang dibuka sesekali.
>
> • Retensi Pengguna: Mempertahankan tingkat retensi bulan pertama
> (Day-30 retention) di atas 40%. Ini menunjukkan bahwa pengguna baru
> menemukan nilai yang cukup dalam aplikasi untuk terus menggunakannya
> setelah periode coba-coba awal.
>
> • Monetisasi: Mengonversi 5% dari total pengguna gratis menjadi
> pelanggan premium dalam 18 bulan pertama, memvalidasi keberlanjutan
> model bisnis.
>
> • Versi Gratis (Freemium): Versi ini dirancang untuk menjadi sangat
> fungsional dan bermanfaat, dengan tujuan utama untuk membantu pengguna
> membangun kebiasaan mencatat keuangan dan menunjukkan nilai inti
> produk. Fitur yang termasuk adalah: Pencatatan transaksi pemasukan dan
> pengeluaran tanpa batas. Kustomisasi kategori pengeluaran (terbatas
> hingga 10 kategori). Laporan pengeluaran mingguan dan bulanan dalam
> bentuk ringkasan sederhana. Kemampuan untuk menetapkan satu anggaran
> (budget) bulanan aktif.
>
> • Versi Premium (Berlangganan): Versi ini ditujukan bagi pengguna yang
> telah merasakan manfaat dari versi gratis dan kini membutuhkan kontrol
> serta analisis yang lebih mendalam atas keuangan mereka. Fitur premium
> akan mencakup: Semua fitur yang tersedia di versi gratis. Kategori dan
> anggaran tanpa batas, memungkinkan pelacakan yang lebih granular.
> Laporan analitik lanjutan dengan grafik interaktif dan perbandingan
> periode. Fitur ekspor data ke format CSV atau PDF untuk analisis lebih
> lanjut atau pelaporan. Sinkronisasi data otomatis antar perangkat
> melalui akun pengguna yang terautentikasi. Opsi kustomisasi antarmuka,
> seperti mode gelap (dark mode) dan tema warna tambahan.
>
> Page 4 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**3.** **Ruang** **Lingkup**

**Yang** **Termasuk** **(In** **Scope)**

> • F1: Onboarding Pengguna: Proses pendaftaran dan login yang cepat dan
> sederhana menggunakan alamat email dan kata sandi, atau melalui
> otentikasi sekali klik dengan akun Google.
>
> • F2: Pencatatan Transaksi: Antarmuka input yang dioptimalkan untuk
> kecepatan, memungkinkan pengguna mencatat pengeluaran dan pemasukan
> dengan kolom esensial: jumlah, kategori, tanggal, dan catatan singkat.
>
> • F3: Manajemen Kategori: Pengguna dapat membuat, mengedit, dan
> menghapus kategori pengeluaran/pemasukan. Setiap kategori dapat
> dipersonalisasi dengan ikon dan warna untuk identifikasi visual yang
> mudah.
>
> • F4: Dasbor Utama: Halaman utama aplikasi yang menyajikan ringkasan
> informasi keuangan penting secara sekilas: saldo saat ini, total
> pemasukan, dan total pengeluaran untuk bulan berjalan. Disertai
> visualisasi sederhana (misalnya, diagram lingkaran) yang menunjukkan
> distribusi pengeluaran berdasarkan kategori.
>
> • F5: Riwayat Transaksi: Sebuah halaman yang menampilkan daftar
> kronologis semua transaksi yang pernah dicatat. Fitur pencarian dan
> filter dasar (berdasarkan tanggal atau kategori) akan disertakan.
>
> • F6: Pengaturan Anggaran (Budgeting): Fungsionalitas sederhana yang
> memungkinkan pengguna untuk menetapkan satu target anggaran bulanan
> secara keseluruhan. Progres terhadap anggaran ini akan ditampilkan
> secara visual di dasbor.
>
> • F7: Fungsionalitas PWA Inti: Implementasi web app manifest untuk
> memungkinkan pengguna "menambah ke layar utama" dan service worker
> untuk memastikan aplikasi dapat diakses dan digunakan dalam mode
> offline.

**Yang** **Tidak** **Termasuk** **(Out** **of** **Scope)**

> • Sinkronisasi otomatis dengan rekening bank, kartu kredit, atau
> e-wallet.
>
> • Fitur pengelolaan utang-piutang yang kompleks, seperti yang
> ditemukan di BukuWarung.
>
> Page 5 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

> • Fitur kolaboratif seperti berbagi dompet atau anggaran dengan
> pengguna lain, seperti yang ditawarkan Spendee.
>
> • Dukungan untuk berbagai mata uang (multi-currency).
>
> • Modul pelacakan investasi, saham, atau aset lainnya.
>
> • Teknologi pengenalan karakter optik (OCR) untuk pemindaian struk
> (receipt scanning).
>
> Page 6 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**5.** **Kebutuhan** **Bisnis**

**Kebutuhan** **Fungsional**

> • FR-001 (Otentikasi Pengguna): Sebagai pengguna, saya harus dapat
> mendaftar dan masuk ke aplikasi menggunakan kombinasi email dan kata
> sandi, atau melalui proses otentikasi yang disederhanakan menggunakan
> akun Google saya.
>
> • FR-002 (Input Transaksi Cepat): Sebagai pengguna, saya harus dapat
> menambahkan transaksi pengeluaran atau pemasukan baru dari dasbor
> utama dalam waktu kurang dari 10 detik, dari menekan tombol "tambah"
> hingga transaksi tersimpan.
>
> • FR-003 (Manajemen Kategori Fleksibel): Sebagai pengguna, saya harus
> dapat memilih kategori dari daftar default yang telah disediakan
> (misalnya, Makanan, Transportasi, Tagihan) atau membuat, mengedit, dan
> menghapus kategori kustom saya sendiri sesuai dengan gaya hidup saya.
>
> • FR-004 (Visualisasi Dasbor): Sebagai pengguna, saat membuka
> aplikasi, saya harus dapat melihat ringkasan visual (misalnya, diagram
> lingkaran atau batang) dari distribusi pengeluaran saya berdasarkan
> kategori untuk bulan berjalan.
>
> • FR-005 (Pelacakan Anggaran): Sebagai pengguna, saya harus dapat
> menetapkan satu jumlah anggaran bulanan dan melihat sisa anggaran saya
> secara real-time di dasbor, yang diperbarui setiap kali saya
> menambahkan transaksi pengeluaran baru.
>
> • FR-006 (Fungsionalitas Offline): Aplikasi harus dapat menyimpan data
> transaksi yang saya masukkan secara lokal di perangkat ketika tidak
> ada koneksi internet. Data ini harus secara otomatis disinkronkan ke
> server ketika koneksi internet kembali tersedia, tanpa memerlukan
> intervensi manual dari saya.

**Kebutuhan** **Non-Fungsional**

> • NFR-001 (Kinerja): Waktu muat awal aplikasi (cold load) harus kurang
> dari 3 detik pada koneksi jaringan 3G yang lambat. Semua interaksi
> antarmuka pengguna, seperti membuka halaman atau menyimpan transaksi,
> harus terasa instan dengan latensi di bawah 200 milidetik.
>
> Page 7 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

> • NFR-002 (Keamanan): Semua komunikasi data antara aplikasi klien
> (PWA) dan server backend harus dienkripsi menggunakan protokol HTTPS
> yang aman untuk mencegah penyadapan. Data pengguna yang sensitif,
> seperti informasi profil dan data keuangan, harus dienkripsi saat
> disimpan di database (encryption at rest).
>
> • NFR-003 (Skalabilitas): Arsitektur backend harus dirancang secara
> efisien untuk dapat menangani beban dari setidaknya 200.000 pengguna
> aktif secara bersamaan tanpa degradasi kinerja yang signifikan.
>
> • NFR-004 (Kompatibilitas): PWA harus berfungsi penuh dan memberikan
> pengalaman yang konsisten pada dua versi terbaru dari browser web
> utama, termasuk: Google Chrome (di Android dan Desktop), Safari (di
> iOS dan macOS), Mozilla Firefox, dan Microsoft Edge.
>
> • NFR-005 (Aksesibilitas): Aplikasi harus dirancang dan dikembangkan
> untuk memenuhi standar Web Content Accessibility Guidelines (WCAG) 2.1
> Level AA, memastikan bahwa aplikasi dapat digunakan oleh individu
> dengan berbagai jenis disabilitas, termasuk gangguan penglihatan dan
> motorik.
>
> Page 8 of 10

PT. Digi Nusa Sudibyo Build App Pengeluaranqu

**8.** **Biaya** **&** **Sumber** **Daya**

> Page 9 of 10
>
> **PT.** **Digi** **Nusa** **Sudibyo** **Build** **App**
> **Pengeluaranqu**
>
> **9.** **Asumsi** **&** **Risiko**
>
> **Asumsi**
>
> • Tim pengembangan yang dipilih memiliki pengalaman yang terbukti
> dalam membangun dan menerapkan PWA yang sukses.
>
> • Tidak akan ada perubahan besar pada ruang lingkup (scope creep) yang
> disetujui untuk MVP selama fase pengembangan.
>
> • API dari layanan pihak ketiga yang digunakan (misalnya, untuk
> otentikasi Google) akan tersedia, andal, dan memiliki dokumentasi yang
> jelas.
>
> • Ada kemauan dari target pasar untuk mengadopsi alat keuangan baru
> yang berfokus pada kesederhanaan.
>
> **Identifikasi** **Risiko**

||
||
||
||

> Page 10 of 10
