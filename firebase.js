import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.submit = async function () {
  const name = document.getElementById("name").value || "Anonyme";

  const scores = computeFullScore(data);

  await submitScore({
    name,
    plus: scores.diffRC,
    plusX: scores.diffDiag,
    balance: scores.balance
  });

  loadLeaderboard();
};

// Dans firebase.js
window.loadLeaderboard = async function () {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "Chargement...";

  // On récupère les meilleurs par diffRC (par exemple)
  const q = query(collection(db, "scores"), orderBy("diffRC", "asc"), limit(20));
  const snap = await getDocs(q);

  list.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>n=${d.n} [${d.type.toUpperCase()}]</strong> : ${d.name} 
      <br> +: ${d.diffRC} | +x: ${d.diffDiag} | ⚖: ${d.balance}
    `;
    list.appendChild(li);
  });
};

let startN = 5;

window.changeRange = function(delta) {
  startN = Math.max(5, Math.min(35, startN + delta));
  document.getElementById("range-display").innerText = `Tailles ${startN} à ${startN + 9}`;
  loadLeaderboard();
};

window.loadLeaderboard = async function () {
  const endN = startN + 9;
  const categories = ['diffRC', 'diffDiag', 'balance'];
  const tables = {
    diffRC: document.getElementById("table-rc").querySelector("tbody"),
    diffDiag: document.getElementById("table-diag").querySelector("tbody"),
    balance: document.getElementById("table-balance").querySelector("tbody")
  };

  // 1. Récupération des données Firebase (on récupère tout pour le range N)
  const q = query(
    collection(db, "scores"), 
    where("n", ">=", startN), 
    where("n", "<=", endN)
  );
  
  const snap = await getDocs(q);
  const rawData = [];
  snap.forEach(doc => rawData.push(doc.data()));

  // 2. Traitement des colonnes
  categories.forEach(cat => {
    const tbody = tables[cat];
    tbody.innerHTML = "";

    for (let n = startN; n <= endN; n++) {
      const scoresN = rawData.filter(d => d.n === n);
      
      // Trouver le meilleur (min) pour chaque type
      const bestPath = getBest(scoresN.filter(d => d.type === "parcours"), cat);
      const bestCycle = getBest(scoresN.filter(d => d.type === "cycle"), cat);

      // Création des lignes
      tbody.appendChild(createRow(n, bestPath, "row-path", "P"));
      
      const isMatch = (bestPath && bestCycle && bestPath.val === bestCycle.val);
      tbody.appendChild(createRow(n, bestCycle, "row-cycle", "C", isMatch));
    }
  });
};

function getBest(list, key) {
  if (list.length === 0) return null;
  // On trie par valeur croissante (le plus petit écart est le record)
  list.sort((a, b) => a[key] - b[key]);
  return { val: list[0][key], name: list[0].name };
}

function createRow(n, record, className, label, isMatch) {
  const tr = document.createElement("tr");
  tr.className = className;
  
  const valDisplay = record ? `${record.val} (${record.name})` : "-";
  const matchIcon = isMatch ? ' <span class="alert-match">!</span>' : '';
  
  tr.innerHTML = `
    <td>${label} ${n}</td>
    <td>${valDisplay}${matchIcon}</td>
  `;
  return tr;
}

// Lancer au chargement
loadLeaderboard();

