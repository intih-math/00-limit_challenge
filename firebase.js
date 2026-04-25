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

window.loadLeaderboard = async function () {
  const q = query(collection(db, "scores"), orderBy("score", "desc"));
  const snap = await getDocs(q);

  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  snap.forEach(doc => {
    const li = document.createElement("li");
    const d = doc.data();
    li.textContent = `${d.name} — ${d.score}`;
    list.appendChild(li);
  });
};

// charger au démarrage
loadLeaderboard();

