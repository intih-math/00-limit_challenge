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

// charger au démarrage
loadLeaderboard();

