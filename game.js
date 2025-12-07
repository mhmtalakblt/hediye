// ================== FIREBASE AYARLARI ==================
// Firebase console'da Web App oluştururken verdiği config'i
// aşağıdaki objenin içine birebir yapıştır.

const firebaseConfig = {
  apiKey: "AIzaSyD-aoIn24PiUUNHpPqkmGGlzVSsbJFcsjQ",
  authDomain: "yilbasi-hediye.firebaseapp.com",
  projectId: "yilbasi-hediye",
  storageBucket: "yilbasi-hediye.firebasestorage.app",
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
        const tdCode = document.createElement("td");
        const tdScore = document.createElement("td");

        tdRank.textContent = rank;
        tdName.textContent = data.name || "-";
        tdCode.textContent = data.code || doc.id;
        tdScore.textContent = data.bestScore ?? "-";

        tr.appendChild(tdRank);
        tr.appendChild(tdName);
        tr.appendChild(tdCode);
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

// Sayfa açılınca canlı tabloyu dinle
listenScoreboard();

// ================== NOT ==================
// Oyun JS'ini yazdığımızda, hangi oyuncu oynuyorsa
// onun kodunu biliyor olacağız (zaten ana sayfadaki codeMap ile eşleşiyor).
// Oyun bittiğinde:
//   submitScore(AKTIF_KOD, SKOR);
// şeklinde çağırman yeterli.
