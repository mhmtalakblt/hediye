const codes = {
    "esra": "ESR2025",
    "ipek": "IPK2025",
    "hira": "HRA2025",
    "zeynep": "ZNP2025",
    "ayşenur": "AYN2025",
    "burak": "BRK2025",
    "yusuf": "YSF2025",
    "sanem": "SNM2025"
};

let wrong = 0;

function checkCode() {
    const input = document.getElementById("codeInput").value;
    const match = Object.values(codes).includes(input);

    if (match) {
        localStorage.setItem("userCode", input);
        window.location.href = "quiz.html";
    } else {
        wrong++;
        document.getElementById("error").innerText = "Yanlış kod! (" + wrong + "/3)";
        if (wrong >= 3) {
            window.location.href = "quiz.html"; // Mini quiz açılır
        }
    }
}

