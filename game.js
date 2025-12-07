// ================== FIREBASE AYARLARI ==================
// Firebase console'da Web App oluştururken verdiği config'i
// aşağıdaki objenin içine birebir yapıştır.

const firebaseConfig = {
  apiKey: "AIzaSyD-aoIn24PiUUNHpPqkmGGlzVSsbJFcsjQ",
  authDomain: "yilbasi-hediye.firebaseapp.com",
  projectId: "yilbasi-hediye",
  storageBucket: "yilbasi-hediye.firebasestorage.com",
  messagingSenderId: "856042975544",
  appId: "1:856042975544:web:b44f805d40e891d09511cd",
  measurementId: "G-H2KTTL1C09"
};


// Firebase başlat
firebase.initializeApp(firebaseConfig);

// Firestore referansı
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

const playerCodeInput = document.getElementById("playerCode");
const playerScoreInput = document.getElementById("playerScore");
const sendScoreBtn = document.getElementById("sendScoreBtn");
const scoreMessage = document.getElementById("scoreMessage");
const scoreboardBody = document.getElementById("scoreboardBody");

// ================== SKOR GÖNDERME FONKSİYONU ==================
// Oyun bittiğinde JS içinden şu fonksiyonu çağıracağız:
//   submitScore("MEGANESARISINE", 180);

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
      // İlk kez skor kaydediliyor
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
        tdCode.textContent = data.code || doc.id;
        tdScore.textContent = data.bestScore ?? "-";

        tr.appendChild(tdRank);
        tr.appendChild(tdName);
        tr.appendChild(tdScore);

        scoreboardBody.appendChild(tr);
        rank++;
      });
    });
}

// ================== TEST FORMU (ŞU AN İÇİN) ==================

if (sendScoreBtn) {
  sendScoreBtn.addEventListener("click", async () => {
    if (scoreMessage) scoreMessage.textContent = "";

    const code = playerCodeInput.value;
    const score = playerScoreInput.value;

    try {
      await submitScore(code, score);
      if (scoreMessage) {
        scoreMessage.textContent = "Skor kaydedildi.";
      }
    } catch (err) {
      console.error(err);
      if (scoreMessage) {
        scoreMessage.textContent =
          "Skor kaydedilemedi: " + (err.message || "Bilinmeyen hata");
      }
    }
  });
}


/* ========== YILBAŞI OYUNU: SNOW BALL CATCHER ========== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startGameBtn");
const scoreDisplay = document.getElementById("gameScoreDisplay");
const timerDisplay = document.getElementById("gameTimerDisplay");

let basket = { x: 140, y: 440, width: 40, height: 20 };
let items = [];
let score = 0;
let timeLeft = 20;
let gameRunning = false;

// klavye kontrol
let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;
});
document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") moveLeft = false;
  if (e.key === "ArrowRight") moveRight = false;
});

// dokunmatik (mobil)
canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const posX = touch.clientX - rect.left;
  basket.x = posX - basket.width / 2;
});

// süs generate
function spawnItem() {
  const colors = ["#ff4444", "#ffd93d", "#ff8c00", "#00eaff"];
  items.push({
    x: Math.random() * 300,
    y: -20,
    size: 16,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
}

// oyun loop
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // basket hareket
  if (moveLeft) basket.x -= 5;
  if (moveRight) basket.x += 5;

  // sınırlar
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > 320) basket.x = 320 - basket.width;

  // basket çiz
  ctx.fillStyle = "#eab308";
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

  // süs çiz + hareket
  items.forEach((it, index) => {
    it.y += 3;

    ctx.beginPath();
    ctx.fillStyle = it.color;
    ctx.arc(it.x, it.y, it.size, 0, Math.PI * 2);
    ctx.fill();

    // yakalandı mı?
    if (
      it.y + it.size > basket.y &&
      it.x > basket.x &&
      it.x < basket.x + basket.width
    ) {
      score += 10;
      scoreDisplay.textContent = "Skor: " + score;
      items.splice(index, 1);
    }

    // ekran dışı
    if (it.y > 500) items.splice(index, 1);
  });

  requestAnimationFrame(gameLoop);
}

// timer
function startTimer(playerCode) {
  timeLeft = 20;
  timerDisplay.textContent = "Süre: " + timeLeft;

  const count = setInterval(() => {
    if (!gameRunning) return clearInterval(count);

    timeLeft--;
    timerDisplay.textContent = "Süre: " + timeLeft;

    if (timeLeft <= 0) {
      clearInterval(count);
      gameRunning = false;

      // Firebase'e skor kaydet
      submitScore(playerCode, score);

      alert("Oyun bitti! Skorun: " + score);
    }
  }, 1000);
}

// oyunu başlat
startBtn.addEventListener("click", () => {
  const currentCode = prompt("Kodunu yaz (ör: MEGANESARISINE)").toUpperCase();

  if (!playerMap[currentCode]) {
    alert("Geçersiz kod!");
    return;
  }

  score = 0;
  scoreDisplay.textContent = "Skor: 0";

  items = [];
  gameRunning = true;

  spawnItem();
  setInterval(() => gameRunning && spawnItem(), 700);

  startTimer(currentCode);
  gameLoop();
});

// Sayfa açılınca canlı tabloyu dinle
listenScoreboard();

// ================== NOT ==================
// Oyun JS'ini yazdığımızda, hangi oyuncu oynuyorsa
// onun kodunu biliyor olacağız (zaten ana sayfadaki codeMap ile eşleşiyor).
// Oyun bittiğinde:
//   submitScore(AKTIF_KOD, SKOR);
// şeklinde çağırman yeterli.
