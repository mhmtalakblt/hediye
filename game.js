document.addEventListener("DOMContentLoaded", () => {
  // ================== FIREBASE AYARLARI ==================
  // KENDİ firebaseConfig'ini buraya yapıştır (project settings > web app)
  const firebaseConfig = {
    apiKey: "AIzaSyD-aoIn24PiUUNHpPqkmGGlzVSsbJFcsjQ",
    authDomain: "yilbasi-hediye.firebaseapp.com",
    projectId: "yilbasi-hediye",
    storageBucket: "yilbasi-hediye.appspot.com",
    messagingSenderId: "856042975544",
    appId: "1:856042975544:web:b44f805d40e891d09511cd",
    measurementId: "G-H2KTTL1C09"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ================== OYUNCU KOD -> İSİM HARİTASI ==================
  const playerMap = {
    MEGANESARISINE: "Burak",
    ZEYNEP26: "Zeynep",
    ESRA2026: "Esra",
    HIRA2026: "Hira",
    BECHOSENNDAYI: "Sanem",
    YUSUFIM: "Yusuf",
    AYSENUR26: "Ayşenur",
    IPEK2026: "İpek"
  };

  // ================== DOM ELEMANLARI ==================
  const scoreboardBody = document.getElementById("scoreboardBody");
  const scoreMessage = document.getElementById("scoreMessage"); // şimdilik kullanılmıyor
  const gamePlayerCodeInput = document.getElementById("gamePlayerCode");
  const startGameBtn = document.getElementById("startGameBtn");
  const scoreDisplay = document.getElementById("gameScoreDisplay");
  const timerDisplay = document.getElementById("gameTimerDisplay");

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ================== SKOR GÖNDERME FONKSİYONU ==================
  async function submitScore(playerCode, score) {
    const code = (playerCode || "").trim().toUpperCase();
    const numericScore = Number(score);

    if (!code || isNaN(numericScore)) {
      throw new Error("Kod veya skor geçersiz.");
    }

    const name = playerMap[code] || "Bilinmeyen";
    const docRef = db.collection("scores").doc(code);

    return db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      const now = new Date();

      if (!doc.exists) {
        tx.set(docRef, {
          code,
          name,
          bestScore: numericScore,
          lastScore: numericScore,
          updatedAt: now
        });
      } else {
        const data = doc.data();
        const currentBest = data.bestScore || 0;
        const newBest = numericScore > currentBest ? numericScore : currentBest;

        tx.set(
          docRef,
          {
            code,
            name,
            bestScore: newBest,
            lastScore: numericScore,
            updatedAt: now
          },
          { merge: true }
        );
      }
    });
  }

  // ================== SKOR TABLOSU (CANLI DİNLEME) ==================
  function listenScoreboard() {
    db.collection("scores")
      .orderBy("bestScore", "desc")
      .onSnapshot((snapshot) => {
        if (!scoreboardBody) return;
        scoreboardBody.innerHTML = "";

        let rank = 1;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const tr = document.createElement("tr");

          const tdRank = document.createElement("td");
          const tdName = document.createElement("td");
          const tdScore = document.createElement("td");

          tdRank.textContent = rank;
          tdName.textContent = data.name || "-";
          tdScore.textContent = data.bestScore ?? "-";

          tr.appendChild(tdRank);
          tr.appendChild(tdName);
          tr.appendChild(tdScore);

          scoreboardBody.appendChild(tr);
          rank++;
        });
      });
  }

  listenScoreboard();

  // ================== YILBAŞI OYUNU: SÜS YAKALAMA ==================

  if (!canvas || !ctx || !startGameBtn) {
    // game.html yüklenmediyse, sessizce çık
    return;
  }

  let basket = { x: 140, y: 440, width: 50, height: 22 };
  let items = [];
  let score = 0;
  let timeLeft = 20;
  let gameRunning = false;
  let currentCode = null;

  let moveLeft = false;
  let moveRight = false;

  let spawnIntervalId = null;
  let timerIntervalId = null;

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") moveLeft = true;
    if (e.key === "ArrowRight") moveRight = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
  });

  // Mobil dokunmatik kontrol
  canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const posX = touch.clientX - rect.left;
    basket.x = posX - basket.width / 2;
  });

  function spawnItem() {
    const colors = ["#f97316", "#22c55e", "#eab308", "#38bdf8"];
    items.push({
      x: Math.random() * (canvas.width - 20) + 10,
      y: -20,
      size: 14,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function resetGameState() {
    score = 0;
    timeLeft = 20;
    items = [];
    basket.x = (canvas.width - basket.width) / 2;
    basket.y = 440;
    moveLeft = false;
    moveRight = false;

    scoreDisplay.textContent = "Skor: 0";
    timerDisplay.textContent = "Süre: 20";
  }

  function clearIntervals() {
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka plan hafif degrade
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#020617");
    grd.addColorStop(1, "#111827");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Hediye kutusu (basket)
    if (moveLeft) basket.x -= 5;
    if (moveRight) basket.x += 5;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) {
      basket.x = canvas.width - basket.width;
    }

    ctx.fillStyle = "#f97316";
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(
      basket.x + basket.width / 2 - 2,
      basket.y - 6,
      4,
      6
    ); // küçük fiyonk

    // Düşen süsler
    items.forEach((it, index) => {
      it.y += 3;

      ctx.beginPath();
      ctx.fillStyle = it.color;
      ctx.arc(it.x, it.y, it.size, 0, Math.PI * 2);
      ctx.fill();

      // yakalandı mı?
      if (
        it.y + it.size > basket.y &&
        it.y - it.size < basket.y + basket.height &&
        it.x > basket.x &&
        it.x < basket.x + basket.width
      ) {
        score += 10;
        scoreDisplay.textContent = "Skor: " + score;
        items.splice(index, 1);
      }

      // ekran dışı
      if (it.y - it.size > canvas.height) {
        items.splice(index, 1);
      }
    });

    requestAnimationFrame(gameLoop);
  }

  function startTimer() {
    timerDisplay.textContent = "Süre: " + timeLeft;

    timerIntervalId = setInterval(() => {
      if (!gameRunning) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        return;
      }

      timeLeft--;
      timerDisplay.textContent = "Süre: " + timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
        gameRunning = false;

        clearIntervals(); // spawn da temizlensin

        // skor kaydet
        if (currentCode) {
          submitScore(currentCode, score)
            .then(() => {
              alert("Oyun bitti! Skorun: " + score);
            })
            .catch((err) => {
              console.error(err);
              alert("Skor kaydedilemedi ama oyun bitti! Skorun: " + score);
            });
        } else {
          alert("Oyun bitti! Skorun: " + score);
        }
      }
    }, 1000);
  }

  if (startGameBtn) {
    startGameBtn.addEventListener("click", () => {
      const rawCode = (gamePlayerCodeInput.value || "").trim().toUpperCase();

      if (!rawCode) {
        alert("Önce kodunu yaz.");
        return;
      }
      if (!playerMap[rawCode]) {
        alert("Geçersiz kod. (8 kişiden birinin kodu olmalı)");
        return;
      }

      currentCode = rawCode;
      clearIntervals();
      resetGameState();

      // Oyunu başlat
      gameRunning = true;
      spawnItem();
      spawnIntervalId = setInterval(() => {
        if (gameRunning) spawnItem();
      }, 700);

      startTimer();
      gameLoop();
    });
  }
});
