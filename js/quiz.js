const questions = [
    {q: "Türkiye'nin başkenti?", a: ["İstanbul","Ankara","İzmir"], c:1},
    {q: "5 + 7 = ?", a: ["10","12","14"], c:1},
    {q: "Kış ayı değildir?", a: ["Aralık","Haziran","Ocak"], c:1}
];

let index = 0;
let correct = 0;

function loadQ() {
    const q = questions[index];
    document.getElementById("question").innerText = q.q;

    let html = "";
    q.a.forEach((ans,i)=>{
        html += `<button onclick="choose(${i})">${ans}</button>`;
    });

    document.getElementById("answers").innerHTML = html;
}
loadQ();

function choose(i) {
    if (i === questions[index].c) correct++;

    index++;

    if (index >= questions.length) {
        if (correct === 3) {
            window.location.href = "tree.html";
        } else {
            document.getElementById("result").innerText = "Başaramadın. Tekrar dene.";
            index = 0;
            correct = 0;
            loadQ();
        }
    } else {
        loadQ();
    }
}

