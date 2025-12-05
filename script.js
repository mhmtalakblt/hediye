// Adım mantığı:
//
// step = 0 → kilit açıldı, müzik için ilk deneme yapılmadı
// step = 1 → tarayıcı müziği engelledi, tekrar deneme gerekiyor (artık sadece bilgi)
// step = 2 → müzik oynuyor / oynayamasa da "başlatıldı" sayıyoruz, bir sonraki tık süs takacak
// step = 3 → süs takıldı, hediye kutusu açılabilir

let step = 0;
let unlocked = false;
let currentPerson = null;

// Genel elemanlar
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
const codeMap = {
  BUROCKKK: { className: "ornament-red", name: "Burak" },
  OSIMIDIASER: { className: "ornament-gold", name: "Zeynep" },
  ESRA2026: { className: "ornament-blue", name: "Esra" },
  HIRA2026: { className: "ornament-green", name: "Hira" },
  BECHOSENN: { className: "ornament-purple", name: "Sanem" },
  YUSUFIR12: { className: "ornament-pink", name: "Yusufi" },
  AYSE2026: { className: "ornament-teal", name: "Ayşenur" },
  IPEK2026: { className: "ornament-silver", name: "İpek" }
};

/* ========== KİLİT AÇMA ========== */

unlockBtn.addEventListener("click", handleUnlock);
codeInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") handleUnlock();
});

function handleUnlock() {
  const rawCode = codeInput.value.trim().toUpperCase();

  if (!rawCode) {
    showWrongCode("Kod boş olamaz.");
    return;
  }

  if (!codeMap[rawCode]) {
    showWrongCode("Yanlış kod! Patladı, tekrar dene.");
    return;
  }

  // Doğru kod
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
      "! İlk dokunuşta müzik başlayacak.";
    giftText.textContent =
      "Müzik ve süs için ekrana tıklamayı kullan, sonra hediye kutusunu açabilirsin.";
  }, 350);
}

function showWrongCode(message) {
  lockMessage.textContent = message;

  // Animasyonu resetlemek için önce sınıfları kaldır
  lockBox.classList.remove("shake", "flash-red");
  boomCircle.classList.remove("explode");
  void lockBox.offsetWidth;

  lockBox.classList.add("shake", "flash-red");
  boomCircle.classList.add("explode");

  codeInput.value = "";
  codeInput.focus();
}

/* ========== SAYFA GENEL TIKLAMA (MÜZİK + SÜS) ========== */

document.body.addEventListener("click", (e) => {
  // Kilit açılmadan hiçbir şey yapma
  if (!unlocked) return;

  // Hediye kutusuna tıklama burada değil, kendi handler'ı var
  if (e.target === giftBox || giftBox.contains(e.target)) return;

  // step 0 veya 1 → müzik denemesi
  if (step === 0 || step === 1) {
    startMusic();
    return;
  }

  // step 2 → süs tak
  if (step === 2) {
    attachPersonOrnament();
  }
});

/* ========== MÜZİK BAŞLATMA (DÜZELTİLMİŞ) ========== */

function startMusic() {
  // Audio elementi yoksa bile akışı durdurmayalım
  if (!audio) {
    step = 2;
    instruction.textContent =
      "Müzik başlatılamadı ama sorun değil. Şimdi tekrar dokun, süsünü takalım.";
    return;
  }

  audio
    .play()
    .then(() => {
      // Müzik başarıyla başladı
      step = 2;
      instruction.textContent =
        "Müzik başladı! Şimdi ağaca senin süsünü takmak için tekrar dokun.";
    })
    .catch((err) => {
      // Tarayıcı veya dosya hatası
      console.warn("Müzik çalınamadı:", err);

      // ÖNEMLİ: Akışı kilitlememek için yine step = 2 yapıyoruz
      step = 2;
      instruction.textContent =
        "Tarayıcı müziği engelledi ama sorun değil. Şimdi tekrar dokun, süsünü takalım.";
    });
}

/* ========== SÜS TAKMA ========== */

function attachPersonOrnament() {
  if (!currentPerson) {
    ornamentText.textContent =
      "Bir şeyler ters gitti. Lütfen sayfayı yenileyip kodu tekrar gir.";
    return;
  }

  step = 3;

  // Eski sınıfları sıfırla, sadece süs sınıflarını ekle
  ornament.className = "ornament";
  ornament.classList.add(currentPerson.className);
  ornament.classList.remove("hidden");

  ornamentText.textContent =
    "Bu süs, " +
    currentPerson.name +
    " için hazırlanmış özel yılbaşı sürprizi.";

  giftBox.classList.add("active");
  giftText.textContent =
    "Artık hazırsın " +
    currentPerson.name +
    "! Aşağıdaki hediye kutusuna tıklayıp sürprizini açabilirsin.";
  instruction.textContent = "Hediye kutusuna tıkla ve hediyeni aç.";
}

/* ========== HEDİYE KUTUSU ========== */

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
