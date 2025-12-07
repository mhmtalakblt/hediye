document.addEventListener("DOMContentLoaded", () => {
  // ================== FIREBASE AYARLARI ==================
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
  const gamePlayerCodeInput = document.getElementById("gamePlayerCode");
  const startGameBtn = document.getElementById("startGameBtn");
  const scoreDisplay = document.getElementById("gameScoreDisplay");
  const timerDisplay = document.getElementById("gameTimerDisplay");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  const showRulesBtn = document.getElementById("showRulesBtn");
  const rulesModal = document.getElementById("rulesModal");
  const closeRulesBtn = document.getElementById("closeRulesBtn");

  // ================== KURALLAR MODALI ==================
  if (showRulesBtn && rulesModal && closeRulesBtn) {
    showRulesBtn.addEventListener("click", () => {
      rulesModal.classList.remove("hidden");
    });
    closeRulesBtn.addEventListener("click", () => {
      rulesModal.classList.add("hidden");
    });
    rulesModal.addEventListener("click", (e) => {
      if (e.target === rulesModal) {
        rulesModal.classList.add("hidden");
      }
    });
  }

  // ================== SKOR GÖNDERME ==================
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

  // ================== SKOR TABLOSU (CANLI) ==================
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

  // ================== YILBAŞI OYUNU ==================
  if (!canvas || !ctx || !startGameBtn) return;

  let basket = { x: 140, y: 440, width: 50, height: 22 };
  let items = [];
  let score = 0;
  let timeLeft = 35;
  let gameRunning = false;
  let currentCode = null;

  let moveLeft = false;
  let moveRight = false;

  let spawnIntervalId = null;
  let timerIntervalId = null;

  // Klavye kontrolleri + scroll engelleme
  document.addEventListener(
    "keydown",
    (e) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        if (gameRunning) e.preventDefault();
      }
      if (e.key === "ArrowLeft") moveLeft = true;
      if (e.key === "ArrowRight") moveRight = true;
    },
    { passive: false }
  );

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") moveLeft = false;
    if (e.key === "ArrowRight") moveRight = false;
  });

  // Dokunmatik kontrol + scroll engelleme
  canvas.addEventListener(
    "touchmove",
    (e) => {
      if (gameRunning) e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const posX = touch.clientX - rect.left;
      basket.x = posX - basket.width / 2;
    },
    { passive: false }
  );

  // Farklı tipte düşen objeler
  function spawnItem() {
    const r = Math.random();
    let type;
    let emoji;

    if (r < 0.55) {
      type = "ornament";
      const ornaments = ["🎄", "🎁", "⭐", "🎀"];
      emoji = ornaments[Math.floor(Math.random() * ornaments.length)];
    } else if (r < 0.75) {
      type = "snow";
      emoji = "❄️";
    } else if (r < 0.9) {
      type = "bomb";
      emoji = "💣";
    } else if (r < 0.95) {
      type = "trap";
      emoji = "☠️";
    } else {
      type = "clock";
      emoji = "⏰";
    }

    items.push({
      x: Math.random() * (canvas.width - 30) + 10,
      y: -20,
      size: 20,
      type,
      emoji
    });
  }

  function resetGameState() {
    score = 0;
    timeLeft = 35;
    items = [];
    basket.x = (canvas.width - basket.width) / 2;
    basket.y = 440;
    moveLeft = false;
    moveRight = false;

    scoreDisplay.textContent = "Skor: 0";
    timerDisplay.textContent = "Süre: 35";
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

  function drawBackground() {
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, "#020617");
    grd.addColorStop(1, "#111827");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawBasket() {
    ctx.fillStyle = "#f97316";
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(basket.x + basket.width / 2 - 2, basket.y - 6, 4, 6);
  }

  function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (moveLeft) basket.x -= 5;
    if (moveRight) basket.x += 5;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) {
      basket.x = canvas.width - basket.width;
    }

    drawBasket();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    items.forEach((it, index) => {
      it.y += 3.5;

      ctx.font = it.size + "px sans-serif";
      ctx.fillText(it.emoji, it.x, it.y);

      const withinX = it.x > basket.x && it.x < basket.x + basket.width;
      const withinY =
        it.y + it.size / 2 > basket.y &&
        it.y - it.size / 2 < basket.y + basket.height;

      if (withinX && withinY) {
        if (it.type === "ornament") {
          score += 10;
        } else if (it.type === "snow") {
          score += 15;
        } else if (it.type === "bomb") {
          score -= 20;
          if (score < 0) score = 0;
        } else if (it.type === "clock") {
          timeLeft += 5;
        } else if (it.type === "trap") {
          // Kuru kafa: skor 0, oyun devam
          score = 0;
        }

        scoreDisplay.textContent = "Skor: " + score;
        timerDisplay.textContent = "Süre: " + timeLeft;

        items.splice(index, 1);
      }

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
        clearIntervals();

        if (currentCode) {
          submitScore(currentCode, score)
            .then(() => {
              alert("Oyun bitti! Skorun: " + score);
            })
            .catch(() => {
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

      gameRunning = true;
      spawnItem();
      spawnIntervalId = setInterval(() => {
        if (gameRunning) spawnItem();
      }, 650);

      startTimer();
      gameLoop();
    });
  }
});
