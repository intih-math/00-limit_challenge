const N = 10;
let data = [];
let current = 1;
let currentPos = null;
let helpMode = true;

// déplacements (comme Python)
const moves = [
  [3, 0], [2, 2], [0, 3], [-2, 2],
  [-3, 0], [-2, -2], [0, -3], [2, -2]
];

const game = document.getElementById("game");
game.style.gridTemplateColumns = `repeat(${N}, 60px)`;

// init grille
for (let i = 0; i < N; i++) {
  data[i] = [];
  for (let j = 0; j < N; j++) {
    data[i][j] = 0;

    const btn = document.createElement("button");
    btn.id = `cell-${i}-${j}`;
    btn.onclick = () => click(i, j);

    game.appendChild(btn);
  }
}

async function getRecords() {
  const res = await fetch("records.json");
  return await res.json();
}

function displayRecordItem(label, recordArray) {
  let html = `${label} : `;

  const types = ["parcours", "cycle"];

  recordArray.forEach((rec, i) => {
    if (rec) {
      html += `
        <a href="#" onclick="loadRecord(\`${rec.input}\`); return false;">
          ${types[i]} (${rec.value ?? "✔"})
        </a> `;
    }
  });

  return html + "<br>";
}

function displayRecords(records) {
  const container = document.getElementById("leaderboard");
  container.innerHTML = "";

  const sortedN = Object.keys(records).sort((a, b) => a - b);

  for (let n of sortedN) {
    const block = document.createElement("li");

    let html = `<strong>n = ${n}</strong><br>`;

    html += displayRecordItem("🟢 +", records[n].diffRC);
    html += displayRecordItem("🔵 +x", records[n].diffDiag);
    html += displayRecordItem("⚖️ Balance", records[n].balance);

    block.innerHTML = html;
    container.appendChild(block);
  }
}

function updateScoreDisplay() {
  const result = computeFullScore(N, data);

  document.getElementById("diffRC").innerText = result.diffRC;
  document.getElementById("diffDiag").innerText = result.diffDiag;
  document.getElementById("balance").innerText = result.balance;
}

function computeFullScore(N,grid) {
  let sumsCol = Array(N).fill(0);
  let sumsRow = Array(N).fill(0);
  let diag1 = Array(N).fill(0);
  let diag2 = Array(N).fill(0);

  // =====================
  // SOMMES
  // =====================
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let v = grid[i][j];

      sumsCol[i] += v;
      sumsRow[j] += v;

      diag1[(i + j) % N] += v;
      diag2[(i - j + N) % N] += v;
    }
  }

  // =====================
  // 1️⃣ SCORE LIGNES/COLONNES
  // =====================
  let minRC = Infinity;
  let maxRC = -Infinity;

  for (let i = 0; i < N; i++) {
    minRC = Math.min(minRC, sumsCol[i], sumsRow[i]);
    maxRC = Math.max(maxRC, sumsCol[i], sumsRow[i]);
  }

  let diffRC = maxRC - minRC;

  // =====================
  // 2️⃣ SCORE DIAGONALES
  // =====================
  let minD = Math.min(minRC,...diag1, ...diag2);
  let maxD = Math.max(maxRC,...diag1, ...diag2);

  let diffDiag = maxD - minD;

  // =====================
  // 3️⃣ BALANCE
  // =====================
  let weights = [];
  let w = Math.floor((N-1)/2)*2;

  for (let i = 0; i < N; i++) {
    weights[i] = w;
    w -= 2;
  }

  let balanceX = 0;
  let balanceY = 0;

  for (let i = 0; i < N; i++) {
    balanceX += weights[i] * sumsCol[i];
    balanceY += weights[i] * sumsRow[i];
  }

  let balance = Math.min(Math.abs(balanceX), Math.abs(balanceY));
  return { diffRC, diffDiag, balance };
  
}


// =====================
// VALIDATION MOUVEMENT
// =====================
function isValidMove(i, j) {
  if (data[i][j] !== 0) return false;
  if (current === 1) return true;

  for (let m of moves) {
    if (
      currentPos &&
      currentPos[0] + m[0] === i &&
      currentPos[1] + m[1] === j
    ) {
      return true;
    }
  }
  return false;
}

function rollbackTo(value) {

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {

      if (data[i][j] > value) {

        data[i][j] = 0;

        const btn = document.getElementById(`cell-${i}-${j}`);

        btn.innerText = "";
        btn.style.background = "";
        btn.style.color = "";
      }

      // retrouver position actuelle
      if (data[i][j] === value) {
        currentPos = [i, j];
      }
    }
  }

  current = value + 1;

  updateHints();
  updateScoreDisplay();
}

// =====================
// CLICK
// =====================
function click(i, j) {

  // 🔥 retour arrière
  if (data[i][j] !== 0) {
    rollbackTo(data[i][j]);
    return;
  }

  if (!isValidMove(i, j)) return;
  data[i][j] = current;
  currentPos = [i, j];

  const btn = document.getElementById(`cell-${i}-${j}`);
  btn.innerText = current;
  btn.style.background = "#222";
  btn.style.color = "white";

  current++;

  updateHints();
  updateScoreDisplay();
  checkEnd();
}

// =====================
// AIDE (COULEURS)
// =====================
function countNextMoves(i, j) {
  let count = 0;

  for (let m of moves) {
    let ni = i + m[0];
    let nj = j + m[1];

    if (
      ni >= 0 && ni < N &&
      nj >= 0 && nj < N &&
      data[ni][nj] === 0
    ) {
      count++;
    }
  }
  return count;
}

function updateHints() {
  clearHighlights();

  if (!currentPos) return;

  for (let m of moves) {
    let ni = currentPos[0] + m[0];
    let nj = currentPos[1] + m[1];

    if (
      ni >= 0 && ni < N &&
      nj >= 0 && nj < N &&
      data[ni][nj] === 0
    ) {
      let remaining = countNextMoves(ni, nj);
      let cell = document.getElementById(`cell-${ni}-${nj}`);

      if (remaining === 0) {
        cell.style.background = "red";
      } else if (remaining === 1) {
        cell.style.background = "pink";
      } else if (remaining === 2) {
        cell.style.background = "purple";
      } else {
        cell.style.background = "#88ff88";
      }
      if (!helpMode) {
        cell.style.background = "#88ff88";
      }
    }
  }
}

// =====================
// RESET COULEURS
// =====================
function clearHighlights() {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (data[i][j] === 0) {
        document.getElementById(`cell-${i}-${j}`).style.background = "";
      }
    }
  }
}

// =====================
// TOGGLE AIDE
// =====================
window.toggleHelp = function () {
  helpMode = !helpMode;

  const btn = document.getElementById("helpBtn");
  btn.innerText = "Aide: " + (helpMode ? "ON" : "OFF");

  updateHints();
};

// =====================
// SCORE
// =====================
function computeScore() {
  let sumsCol = Array(N).fill(0);
  let sumsRow = Array(N).fill(0);

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      let v = data[i][j];
      sumsCol[i] += v;
      sumsRow[j] += v;
    }
  }

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < N; i++) {
    min = Math.min(min, sumsCol[i], sumsRow[i]);
    max = Math.max(max, sumsCol[i], sumsRow[i]);
  }

  let filled = current - 1;
  let balance = max - min;

  return balance;
}

// =====================
// FIN
// =====================
function isGameOver() {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (isValidMove(i, j)) return false;
    }
  }
  return true;
}

function checkEnd() {
  if (isGameOver()) {
    if (current > 100) {
      let score = computeScore();
      alert("Partie terminée ! Score: " + score);
    }
    else {
      alert("Vous n'avez plus de coup, la grille est incomplète. Réessayez.");
    }
  }
}

function loadGrid() {
  const input = document.getElementById("loadInput").value.trim();
  if (!input) return;

  const parts = input.split(" ");
  if (parts.length < 3) {
    alert("Format: taille x,y chemin");
    return;
  }

  const posStr = parts[1];
  const path = parts[2];
  N = Math.floor(Math.sqrt(path.length+1));
  alert("N:"+N);

  // grille temporaire (NE PAS afficher)
  let temp = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => 0)
  );

  let pos = posStr.split(",").map(Number);
  let i = pos[0];
  let j = pos[1];

  let val = 1;
  temp[i][j] = val++;

  // reconstruction parcours
  for (let k = 0; k < path.length; k++) {
    let moveIndex = parseInt(path[k]);
    let move = moves[moveIndex];

    if (!move) continue;

    // version circulaire comme Python
    i = (i + move[0] + N) % N;
    j = (j + move[1] + N) % N;

    temp[i][j] = val++;
  }

  return computeFullScore(N,temp);
};
// =====================
// SUBMIT
// =====================
window.submit = async function () {
  const name = document.getElementById("name").value || "Anonyme";

  const result = window.loadGrid();

  if (!result) return;

  // 👉 affichage dans la page
  document.getElementById("diffRC").innerText = result.diffRC;
  document.getElementById("diffDiag").innerText = result.diffDiag;
  document.getElementById("balance").innerText = result.balance;

  // 👉 si tu veux envoyer un score (ex: diffDiag)
  await submitScore(name, result.diffDiag);

  loadLeaderboard();
};
