// Adım mantığı:
//
// step = 0 → kilit açıldı, müzik için ilk deneme yapılmadı
// step = 1 → (gerekirse kullanılabilir, şu an yok)
// step = 2 → müzik oynuyor / “başlatıldı” sayıyoruz, bir sonraki tık süs takacak
// step = 3 → süs takıldı, hediye kutusu açılabilir

let step = 0;
let unlocked = false;
let currentPerson = null;

// Şifre deneme mantığı
let attempts = 0;                 // Yapılan yanlış sayısı
const maxAttempts = 3;            // İlk hak: 3 yanlış
let quizExtraGiven = false;       // Quiz ile +1 hak verildi mi?
let permanentlyLocked = false;    // Artık tamamen kilitli mi?

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

// Quiz elemanları
const quizPanel = document.getElementById("quiz-panel");
const quizSubmit = document.getElementById("quiz-submit");
const quizMessage = document.getElementById("quiz-message");

// KOD -> KİŞİ HARİTASI
const codeMap = {
  SARISINMEGAN: { className: "ornament-red", name: "Burak" },
  ZEYNEPCIGARA: { className: "ornament-gold", name: "Zeynep" },
  ESRABETUL: { className: "ornament-blue", name: "Esra" },
  HIRA26: { className: "ornament-green", name: "Hira" },
  BECHOSENNDAYI: { className: "ornament-purple", name: "Sanem" },
  YUSUFIR12: { className: "ornament-pink", name: "Yusufi" },
  AYSE2026: { className: "ornament-teal", name: "Ayşenur" },
  IPEKNAZ26: { className: "ornament-silver", name: "İpek" }
};

/* ========== KİLİT AÇMA ========== */

if (unlockBtn && codeInput) {
  unlockBtn.addEventListener("click", handleUnlock);
  codeInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleUnlock();
  });
}

function handleUnlock() {
  if (permanentlyLocked) {
    lockMessage.textContent =
      "Tüm haklar kullanıldı. Bu cihaz için kilit kalıcı olarak kapandı.";
    return;
  }

  const rawCode = codeInput.value.trim().toUpperCase();
// GİZLİ KOD (AEZAKMI)
if (rawCode === "AEZAKMI") {
  window.location.href = "secret.html";
  return;
}
  if (!rawCode) {
    showWrongCode("Kod boş olamaz.");
    return;
  }

  // Yanlış şifre
  if (!codeMap[rawCode]) {
    attempts++;

    const maxTotal = quizExtraGiven ? maxAttempts + 1 : maxAttempts;
    const kalan = maxTotal - attempts;

    if (attempts >= maxTotal) {
      if (!quizExtraGiven) {
        // İlk 3 yanlış → quiz aç
        showWrongCode("3 kez yanlış girdin. Mini quiz az sonra açılıyor.");
        openQuiz();
        return;
      } else {
        // Quiz sonrası da bitti → kalıcı kilit
        showWrongCode(
          "Tüm haklarını kullandın. Bu cihaz için kilit kalıcı olarak kapandı."
        );
        permanentlyLocked = true;
        codeInput.disabled = true;
        unlockBtn.disabled = true;
        return;
      }
    }

    showWrongCode(
      "Yanlış kod! Kalan hakkın: " +
        kalan +
        (quizExtraGiven ? " (quiz sonrası ekstra hak dahil)" : "")
    );
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

  lockBox.classList.remove("shake", "flash-red");
  boomCircle.classList.remove("explode");
  // Reflow ile animasyonu resetle
  void lockBox.offsetWidth;

  lockBox.classList.add("shake", "flash-red");
  boomCircle.classList.add("explode");

  codeInput.value = "";
  codeInput.focus();
}

/* ========== QUIZ ========== */

function openQuiz() {
  if (!quizPanel) return;

  quizPanel.classList.remove("hidden");
  quizMessage.textContent = "";
  codeInput.disabled = true;
  unlockBtn.disabled = true;

  lockMessage.textContent =
    "3 yanlış deneme yaptın. 3 soruluk mini quiz’i tam doğru bilirsen 1 deneme hakkı daha kazanacaksın.";
}

if (quizSubmit) {
  quizSubmit.addEventListener("click", () => {
    const questions = document.querySelectorAll(".quiz-question");
    let correct = 0;

    questions.forEach((q) => {
      const answer = q.getAttribute("data-answer");
      const checked = q.querySelector("input[type='radio']:checked");
      if (checked && checked.value === answer) {
        correct++;
      }
    });

    if (correct === questions.length) {
      // Quiz başarıyla geçildi
      quizExtraGiven = true;
      quizPanel.classList.add("hidden");
      quizMessage.textContent = "";
      codeInput.disabled = false;
      unlockBtn.disabled = false;

      lockMessage.textContent =
        "Quiz’i geçtin! 1 kez daha şifre deneme hakkın açıldı. Dikkatli kullan 🙂";
      codeInput.focus();
    } else {
      // Quizde başarısız → kalıcı kilit
      quizMessage.textContent =
        "Maalesef tüm sorular doğru değil. Bu cihaz için kilit artık açılamayacak.";
      permanentlyLocked = true;
      codeInput.disabled = true;
      unlockBtn.disabled = true;
    }
  });
}

/* ========== SAYFA GENEL TIKLAMA (MÜZİK + SÜS) ========== */

document.body.addEventListener("click", (e) => {
  if (!unlocked) return;

  // hediye kutusuna tıklama burada işlenmiyor
  if (e.target === giftBox || (giftBox && giftBox.contains(e.target))) return;

  if (step === 0 || step === 1) {
    startMusic();
    return;
  }

  if (step === 2) {
    attachPersonOrnament();
  }
});

/* ========== MÜZİK BAŞLATMA ========== */

function startMusic() {
  if (!audio) {
    step = 2;
    instruction.textContent =
      "Müzik başlatılamadı ama sorun değil. Şimdi tekrar dokun, süsünü takalım.";
    return;
  }

  audio
    .play()
    .then(() => {
      step = 2;
      instruction.textContent =
        "Müzik başladı! Şimdi ağaca senin süsünü takmak için tekrar dokun.";
    })
    .catch((err) => {
      console.warn("Müzik çalınamadı:", err);
      step = 2; // akışı kilitleme
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

if (giftBox) {
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
}
