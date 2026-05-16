// 1. On importe UNIQUEMENT l'initialisation depuis le module "app"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

// 2. On importe TOUTES les fonctions de la base de données depuis le module "firestore"
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCpPsCrJspIuvzMqvkhywIXBMCULSQnpl0",
    authDomain: "limit-challenge-a7be6.firebaseapp.com",
    projectId: "limit-challenge-a7be6",
    storageBucket: "limit-challenge-a7be6.firebasestorage.app",
    messagingSenderId: "785701614479",
    appId: "1:785701614479:web:66c5f749e1a3855d3c11fa"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FONCTION DE SOUMISSION ---
async function submitScore(newGameData) {
    const db = getFirestore();
    
    // 1. On récupère TOUS les scores existants pour cette configuration (n + type)
    // (Idéal pour comparer les 3 critères d'un coup)
    const q = query(
        collection(db, "scores"),
        where("n", "==", newGameData.n),
        where("type", "==", newGameData.type)
    );

    try {
        const querySnapshot = await getDocs(q);
        
        // Initialisation des records actuels à l'infini (si la base est vide)
        let recordDiffRC = Infinity;
        let recordDiffDiag = Infinity;
        let recordBalance = Infinity;

        // 2. On parcourt les scores existants pour trouver les 3 meilleurs scores distincts
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.diffRC < recordDiffRC) recordDiffRC = data.diffRC;
            if (data.diffDiag < recordDiffDiag) recordDiffDiag = data.diffDiag;
            if (data.balance < recordBalance) recordBalance = data.balance;
        });

        // 3. Vérification des conditions (STRICTEMENT INFÉRIEUR)
        const beatsRC = newGameData.diffRC < recordDiffRC;
        const beatsDiag = newGameData.diffDiag < recordDiffDiag;
        const beatsBalance = newGameData.balance < recordBalance;

        // 4. Si le joueur bat AU MOINS UN des trois records, on valide !
        if (beatsRC || beatsDiag || beatsBalance) {
            
            let breakingNews = "Félicitations ! Nouveau record battu pour : ";
            if (beatsRC) breakingNews += `[+ : ${newGameData.diffRC} < ${recordDiffRC}] `;
            if (beatsDiag) breakingNews += `[+x : ${newGameData.diffDiag} < ${recordDiffDiag}] `;
            if (beatsBalance) breakingNews += `[balance+ : ${newGameData.balance} < ${recordBalance}]`;
            
            console.log(breakingNews);

            // Sauvegarde dans Firestore
            await addDoc(collection(db, "scores"), newGameData);

            return true;
        } else {
            console.log("Dommage ! Ce score ne bat aucun des trois records existants (diffRC, diffDiag ou balance).");
            return false;
        }

    } catch (error) {
        console.error("Erreur lors de la validation des records :", error);
        return false;
    }
}
// Rendre la fonction accessible à game.js
window.submitScore = submitScore;

//window.submitScore = async function (docData) {
//  try {
//    await addDoc(collection(db, "scores"), docData);
//    alert("Record enregistré !");
//  } catch (e) {
//    console.error("Erreur : ", e);
//  }
//};

// --- GESTION DU CLASSEMENT ---
let startN = 5;

window.changeRange = function(delta) {
  startN = Math.max(5, Math.min(35, startN + delta));
  document.getElementById("range-display").innerText = `Tailles ${startN} à ${startN + 9}`;
  window.loadLeaderboard();
};

window.loadLeaderboard = async function () {
  const endN = startN + 9;
  const categories = ['diffRC', 'diffDiag', 'balance'];
  const tables = {
    diffRC: document.getElementById("table-rc").querySelector("tbody"),
    diffDiag: document.getElementById("table-diag").querySelector("tbody"),
    balance: document.getElementById("table-balance").querySelector("tbody")
  };

  try {
    const q = query(
      collection(db, "scores"), 
      where("n", ">=", startN), 
      where("n", "<=", endN)
    );
    
    const snap = await getDocs(q);
    const rawData = [];
    snap.forEach(doc => rawData.push(doc.data()));

    categories.forEach(cat => {
      const tbody = tables[cat];
      if(!tbody) return;
      tbody.innerHTML = "";

      for (let n = startN; n <= endN; n++) {
        const scoresN = rawData.filter(d => d.n === n);
        
        const bestPath = getBest(scoresN.filter(d => d.type === "parcours"), cat);
        const bestCycle = getBest(scoresN.filter(d => d.type === "cycle"), cat);


        // Ligne pour le Parcours (P)
        tbody.appendChild(createRow(n, bestPath, "row-path", "P", false, bestPath, bestCycle));

        // Ligne pour le Cycle (C) - C'est elle qui analysera si le cycle est <= au parcours
        tbody.appendChild(createRow(n, bestCycle, "row-cycle", "C", false, bestPath, bestCycle));
      }
    });
  } catch (err) {
    console.error("Erreur de chargement :", err);
  }
};

function getBest(list, key) {
  if (list.length === 0) return null;
  
  list.sort((a, b) => {
    if (a[key] !== b[key]) {
      return a[key] - b[key];
    }
    return a.timestamp - b.timestamp;
  });

  // AJOUT DE L'EXTRACTION DU TIMESTAMP ICI
  return { 
    val: list[0][key], 
    name: list[0].name,
    timestamp: list[0].timestamp // On fait suivre la date !
  };
}

function createRow(n, record, className, label, isMatch, bestPath, bestCycle) {
  const tr = document.createElement("tr");
  tr.className = className;
  
  // 1. Valeurs par défaut si aucun record n'est enregistré
  let scoreDisplay = "-";
  let nameDisplay = "-";
  let dateDisplay = "-"; // Nouvelle colonne date
  
  if (record) {
    nameDisplay = record.name;
    console.log(`[Taille ${n} - Date ${record.timestamp}] Données du record :`, record);
    
    // 2. Formatage de la date compacte (JJ/MM/AA)
    if (record.timestamp) {
      const dateObj = new Date(record.timestamp);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      // Récupère les 2 derniers chiffres de l'année
      const year = String(dateObj.getFullYear()).slice(-2); 
      
      dateDisplay = `${day}/${month}/${year}`;
    }
    
    // 3. Gestion de la couleur si le score est égal à 0
    if (record.val === 0) {
      scoreDisplay = `<strong style="font-size: 1.2rem; color: red;">${record.val}</strong>`;
      nameDisplay = `<span style="color: red;">${record.name}</span>`;
      dateDisplay = `<span style="color: red;">${dateDisplay}</span>`;
    } else {
      scoreDisplay = `<strong style="font-size: 1.2rem;">${record.val}</strong>`;
    }
  }
  
  // 4. Logique du point d'exclamation (uniquement sur la ligne Cycle "C" si cycle <= parcours)
  if (label === "C" && bestCycle && bestPath && bestCycle.val <= bestPath.val) {
    scoreDisplay += ' <span class="alert-match">!</span>';
  }
  
  // 5. Génération des 4 colonnes distinctes
  tr.innerHTML = `
    <td>${label} ${n}</td>
    <td>${scoreDisplay}</td>
    <td>${nameDisplay}</td>
    <td>${dateDisplay}</td>
  `;
  return tr;
}
// Lancement initial
window.loadLeaderboard();
