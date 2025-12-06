document.addEventListener("DOMContentLoaded", () => {
  // Adım mantığı:
  //
  // step = 0 → kilit açıldı, müzik için ilk deneme yapılmadı
  // step = 1 → (gerekirse kullanılabilir)
  // step = 2 → müzik oynuyor / başlatıldı sayılıyor, bir sonraki tık süs takacak
  // step = 3 → süs takıldı, hediye kutusu açılabilir

  let step = 0;
  let unlocked = false;
  let currentPerson = null;

  // Şifre deneme mantığı
  let attempts = 0; // Yapılan yanlış sayısı
  const maxAttempts = 3; // İlk hak: 3 yanlış
  let quizExtraGiven = false; // Quiz ile +1 hak verildi mi?
  let permanentlyLocked = false; // Artık tamamen kilitli mi?

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
    BURA2025: { className: "ornament-red", name: "Burak" },
    ZEYN2025: { className: "ornament-gold", name: "Zeynep" },
    ESRA2025: { className: "ornament-blue", name: "Esra" },
    HIRA2025: { className: "ornament-green", name: "Hira" },
    SANM2025: { className: "ornament-purple", name: "Sanem" },
    YUSU2025: { className: "ornament-pink", name: "Yusufi" },
    AYSE2025: { className: "ornament-teal", name: "Ayşenur" },
    IPEK2025: { className: "ornament-silver", name: "İpek" }
  };
   // GİZLİ KOD -> SAYFA HARİTASI
  const secretMap = {
    DOLANDIRICI: "dolandirici.html",
    CIGARA: "cigara.html",
    MONEY: "money.html",
    KARAAMBAR: "karaambar.html"
  };
// İP UCU HARİTASI (kişinin sayfasında görünecek)
const hintMap = {
  Burak: ["DOLANDIRICI", "KARAAMBAR"],
  Zeynep: ["DOLANDIRICI", "CIGARA"],
  Ayşenur: ["DOLANDIRICI", "CIGARA"],
  Sanem: ["DOLANDIRICI", "KARAAMBAR"],
  Yusuf: ["DOLANDIRICI", "KARAAMBAR"],
  Esra: ["MONEY"],
  İpek: ["MONEY"],
  Hira: ["MONEY"]
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
      if (lockMessage) {
        lockMessage.textContent =
          "Tüm haklar kullanıldı. Bu cihaz için kilit kalıcı olarak kapandı.";
      }
      return;
    }

    const rawCode = codeInput.value.trim().toUpperCase();



      // ========== GİZLİ KODLAR (4 TANE) ==========
    if (secretMap[rawCode]) {
      window.location.href = secretMap[rawCode];
      return;
    }
    // ==========================================

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
          showWrongCode("3 kez yanlış girdin. Mini quiz açılıyor.");
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

    if (lockMessage) {
      lockMessage.textContent = "Kilidiniz açıldı, iyi eğlenceler!";
    }
    if (lockBox) lockBox.classList.remove("shake", "flash-red");
    if (boomCircle) boomCircle.classList.remove("explode");

    setTimeout(() => {
      if (lockScreen) lockScreen.classList.add("hidden");
      if (mainContent) mainContent.classList.remove("hidden");

      if (instruction && currentPerson) {
        instruction.textContent =
          "Hoş geldin " +
          currentPerson.name +
          "! İlk dokunuşta müzik başlayacak.";
      }
      if (giftText) {
        giftText.textContent =
          "Müzik ve süs için ekrana tıklamayı kullan, sonra hediye kutusunu açabilirsin.";
      }
    }, 350);
  }

  function showWrongCode(message) {
    if (lockMessage) lockMessage.textContent = message;

    if (lockBox && boomCircle) {
      lockBox.classList.remove("shake", "flash-red");
      boomCircle.classList.remove("explode");
      // Reflow ile animasyonu resetle
      void lockBox.offsetWidth;
      lockBox.classList.add("shake", "flash-red");
      boomCircle.classList.add("explode");
    }

    codeInput.value = "";
    codeInput.focus();
  }

  /* ========== QUIZ ========== */

  function openQuiz() {
    if (!quizPanel) return;

    quizPanel.classList.remove("hidden");
    if (quizMessage) quizMessage.textContent = "";
    codeInput.disabled = true;
    unlockBtn.disabled = true;

    if (lockMessage) {
      lockMessage.textContent =
        "3 yanlış deneme yaptın. 3 soruluk mini quiz’i tam doğru bilirsen 1 deneme hakkı daha kazanacaksın.";
    }
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
        if (quizPanel) quizPanel.classList.add("hidden");
        if (quizMessage) quizMessage.textContent = "";
        codeInput.disabled = false;
        unlockBtn.disabled = false;

        if (lockMessage) {
          lockMessage.textContent =
            "Quiz’i geçtin! 1 kez daha şifre deneme hakkın açıldı. Dikkatli kullan 🙂";
        }
        codeInput.focus();
      } else {
        // Quizde başarısız → kalıcı kilit
        if (quizMessage) {
          quizMessage.textContent =
            "Maalesef tüm sorular doğru değil. Bu cihaz için kilit artık açılamayacak.";
        }
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
    if (giftBox && (e.target === giftBox || giftBox.contains(e.target))) return;

    if (step === 0 || step === 1) {
      startMusic();
      return;
    }

    if (step === 2) {
      attachPersonOrnament();
      showRandomHint();

    }
  });

  /* ========== MÜZİK BAŞLATMA ========== */

  function startMusic() {
    if (!audio) {
      step = 2;
      if (instruction) {
        instruction.textContent =
          "Müzik başlatılamadı ama sorun değil. Şimdi tekrar dokun, süsünü takalım.";
      }
      return;
    }

    audio
      .play()
      .then(() => {
        step = 2;
        if (instruction) {
          instruction.textContent =
            "Müzik başladı! Şimdi ağaca senin süsünü takmak için tekrar dokun.";
        }
      })
      .catch(() => {
        step = 2; // akışı kilitleme
        if (instruction) {
          instruction.textContent =
            "Tarayıcı müziği engelledi ama sorun değil. Şimdi tekrar dokun, süsünü takalım.";
        }
      });
  }

  /* ========== SÜS TAKMA ========== */

  function attachPersonOrnament() {
    if (!currentPerson) {
      if (ornamentText) {
        ornamentText.textContent =
          "Bir şeyler ters gitti. Lütfen sayfayı yenileyip kodu tekrar gir.";
      }
      return;
    }

    step = 3;

    if (ornament) {
      ornament.className = "ornament";
      ornament.classList.add(currentPerson.className);
      ornament.classList.remove("hidden");
    }

    if (ornamentText) {
      ornamentText.textContent =
        "Bu süs, " +
        currentPerson.name +
        " için hazırlanmış özel yılbaşı sürprizi.";
    }

    if (giftBox) giftBox.classList.add("active");
    if (giftText) {
      giftText.textContent =
        "Artık hazırsın " +
        currentPerson.name +
        "! Aşağıdaki hediye kutusuna tıklayıp sürprizini açabilirsin.";
    }
    if (instruction) instruction.textContent = "Hediye kutusuna tıkla ve hediyeni aç.";
  }

  /* ========== HEDİYE KUTUSU ========== */

  if (giftBox) {
    giftBox.addEventListener("click", (e) => {
      e.stopPropagation();

      if (!unlocked) return;

      if (step < 3) {
        if (giftText) {
          giftText.textContent =
            "Önce müziği başlat ve ağaca senin süsünü tak, sonra hediye kutusu açılacak.";
        }
        return;
      }

      window.location.href = "hediye.html";
    });
  }
});

function showRandomHint() {
  const hintBox = document.getElementById("hint-box");
  if (!hintBox || !currentPerson) return;

  // Bu kişiye ait ipuçları
  const hints = hintMap[currentPerson.name];
  if (!hints) return;

  // Random bir ipucu seç
  const text = hints[Math.floor(Math.random() * hints.length)];

  hintBox.textContent = "İpucu: " + text;

  // Ekranda random pozisyon
  const randX = Math.random() * (window.innerWidth - 150);
  const randY = Math.random() * (window.innerHeight - 150);

  hintBox.style.left = randX + "px";
  hintBox.style.top = randY + "px";

  // Göster
  hintBox.classList.remove("hidden");
  hintBox.classList.add("show");
}

