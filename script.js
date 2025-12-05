// Adımlar:
// 0 -> kilit açıldı ama müzik henüz başlamadı
// 2 -> müzik başladı, ikinci tık süs takacak
// 3 -> süs takıldı, hediye kutusu aktif

let step = 0;
let unlocked = false;
let currentPerson = null;

const audio = document.getElementById("bg-music");
const instruction = document.getElementById("instruction");
const ornament = document.getElementById("ornament");
const ornamentText = document.getElementById("ornament-text");
const giftBox = document.getElementById("giftBox");
const giftText = document.getElementById("gift-text");

// Kilit ekranı elemanları
const lockScreen = document.getElementById("lock-screen");
const mainContent = document.getElementById("main-content");
const lockBox = document.getElementById("lock-box");
const lockMessage = document.getElementById("lock-message");
const codeInput = document.getElementById("code-input");
const unlockBtn = document.getElementById("unlock-btn");
const boomCircle = document.getElementById("boom-circle");

// KOD -> KİŞİ HARİTASI
// Kodları ve isimleri burada kendine göre düzenle
const codeMap = {
  BURA2025: { className: "ornament-red", name: "Burak" },
  ZEYN2025: { className: "ornament-gold", name: "Zeynep" },
  ESRA2025: { className: "ornament-blue", name: "Esra" },
  HIRA2025: { className: "ornament-green", name: "Hira" },
  SANM2025: { className: "ornament-purple", name: "Sanem" },
  YUSU2025: { className: "ornament-pink", name: "Yusufi" },
  AYSE2025: { className: "ornament-teal", name: "Ayşenur" },
  IPEK2025: { className: "ornament-silver", name: "İpek" }
};

// Kilidi açma butonu
unlockBtn.addEventListener("click", () => {
  const rawCode = codeInput.value.trim().toUpperCase();

  if (!rawCode) {
    showWrongCode("Kod boş olamaz.");
    return;
  }

  if (!codeMap[rawCode]) {
    showWrongCode("Yanlış kod! Patladı, tekrar dene.");
    return;
  }

  // DOĞRU KOD
  currentPerson = codeMap[rawCode];
  unlocked = true;
  step = 0;

  lockMessage.textContent = "Kilidiniz açıldı, iyi eğlenceler!";
  lockBox.classList.remove("shake", "flash-red");
  boomCircle.classList.remove("explode");

  setTimeout(() => {
    lockScreen.classList.add("hidden");
    mainContent.classList.remove("hidden");

    instruction.textContent =
      "Hoş geldin " +
      currentPerson.name +
      "! İlk tıklamada müzik başlayacak.";
    giftText.textContent =
      "Müzik ve süs için ekrana tıklamayı kullan, sonra hediye kutusunu açabilirsin.";
  }, 400);
});

// Enter ile kilidi aç
codeInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    unlockBtn.click();
  }
});

// Yanlış kod için patlama + sarsılma
function showWrongCode(message) {
  lockMessage.textContent = message;

  lockBox.classList.remove("shake", "flash-red");
  boomCircle.classList.remove("explode");
  void lockBox.offsetWidth; // animasyonu resetlemek için

  lockBox.classList.add("shake", "flash-red");
  boomCircle.classList.add("explode");

  codeInput.value = "";
  codeInput.focus();
}

// Sayfaya genel tıklama (sadece kilit açıldıktan sonra)
document.body.addEventListener("click", (e) => {
  if (!unlocked) return;

  // Hediye kutusuna özel handler var, burada sayma
  if (e.target === giftBox || giftBox.contains(e.target)) return;

  if (step === 0) {
    startMusic();
  } else if (step === 2) {
    attachPersonOrnament();
  }
});

function startMusic() {
  audio
    .play()
    .then(() => {
      step = 2;
      instruction.textContent =
        "Müzik başladı. Şimdi ağaca senin için hazırlanmış süsü takmak için tekrar tıkla.";
    })
    .catch(() => {
      instruction.textContent =
        "Tarayıcı müziği engelledi. Müzik için ekrana tekrar dokunmayı dene.";
    });
}

// KODA GÖRE SABİT SÜS
function attachPersonOrnament() {
  if (!currentPerson) {
    ornamentText.textContent =
      "Bir şeyler ters gitti. Lütfen sayfayı yenileyip kodu tekrar gir.";
    return;
  }

  step = 3;

  ornament.className = "ornament";
  ornament.classList.add(currentPerson.className);
  ornament.classList.remove("hidden");

  ornamentText.textContent =
    "Bu süs, " + currentPerson.name + " için hazırlanmış özel yılbaşı sürprizi.";

  giftBox.classList.add("active");
  giftText.textContent =
    "Artık hazırsın " +
    currentPerson.name +
    "! Aşağıdaki hediye kutusuna tıklayıp sürprizini açabilirsin.";
  instruction.textContent = "Hediye kutusuna tıkla ve hediyeni aç.";
}

// Hediye kutusuna tıklama -> sadece step >= 3 iken geçiş
giftBox.addEventListener("click", (e) => {
  e.stopPropagation();

  if (!unlocked) return;

  if (step < 3) {
    giftText.textContent =
      "Önce müziği başlat ve ağaca senin süsünü tak, sonra hediye kutusu açılacak.";
    return;
  }

  window.location.href = "hediye.html";
});
