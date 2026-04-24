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
game.style.gridTemplateColumns = `repeat(${N}, 40px)`;

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

// =====================
// CLICK
// =====================
function click(i, j) {
  if (!isValidMove(i, j)) return;

  data[i][j] = current;
  currentPos = [i, j];

  const btn = document.getElementById(`cell-${i}-${j}`);
  btn.innerText = current;
  btn.style.background = "#222";
  btn.style.color = "white";

  current++;

  updateHints();
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
    if (filled == 100) {
      let score = computeScore();
      alert("Partie terminée ! Score: " + score);
    }
    else {
      alert("Vous n'avez plus de coup, la grille est incomplète. Réessayez.");
    }
  }
}

// =====================
// SUBMIT
// =====================
window.submit = async function () {
  const name = document.getElementById("name").value || "Anonyme";
  const score = computeScore();

  await submitScore(name, score);
  loadLeaderboard();
};
