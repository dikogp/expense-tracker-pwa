// Untuk menampilkan tips sesuai dengan jenis pengguna
function showWelcomeTips() {
  if (this.tipsShown) return;

  // Tips yang ditampilkan berdasarkan jenis pengguna
  let welcomeMessage = "";
  let tipsList = [];

  if (this.currentUser.provider === "google") {
    welcomeMessage = `Selamat datang, ${
      this.currentUser.name || "Pengguna Google"
    }!`;
    tipsList = [
      "Profil Anda terhubung dengan akun Google",
      "Data Anda disimpan secara lokal di perangkat ini",
      "Tambahkan transaksi untuk mulai melacak keuangan Anda",
    ];
  } else if (this.currentUser.isGuest) {
    welcomeMessage = "Selamat datang, Pengguna Tamu!";
    tipsList = [
      "Anda menggunakan mode tamu, data Anda hanya disimpan di perangkat ini",
      "Daftar atau login untuk menyimpan data secara permanen",
      "Tambahkan transaksi untuk mulai melacak keuangan Anda",
    ];
  } else {
    welcomeMessage = `Selamat datang, ${this.currentUser.name || "Pengguna"}!`;
    tipsList = [
      "Data Anda disimpan secara lokal di perangkat ini",
      "Tetapkan anggaran bulanan Anda di menu Profil",
      "Tambahkan transaksi untuk mulai melacak keuangan Anda",
    ];
  }

  // Buat elemen tips
  const tipsElement = document.createElement("div");
  tipsElement.className = "welcome-tips";

  tipsElement.innerHTML = `
    <div class="tips-header">
      <h3>${welcomeMessage}</h3>
      <button class="btn-close" id="closeTips">×</button>
    </div>
    <div class="tips-content">
      <ul>
        ${tipsList.map((tip) => `<li>${tip}</li>`).join("")}
      </ul>
    </div>
    <div class="tips-footer">
      <button class="btn-primary" id="startUsingApp">Mulai Menggunakan Aplikasi</button>
    </div>
  `;

  document.body.appendChild(tipsElement);

  // Animasi tampilkan tips
  setTimeout(() => {
    tipsElement.classList.add("show");
  }, 100);

  // Event listeners untuk tombol-tombol
  document.getElementById("closeTips").addEventListener("click", () => {
    tipsElement.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(tipsElement);
    }, 300);
  });

  document.getElementById("startUsingApp").addEventListener("click", () => {
    tipsElement.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(tipsElement);
    }, 300);
  });

  this.tipsShown = true;
}
