const N = 10;
let data = [];
let current = 1;
let currentPos = null;

// déplacements (copiés depuis Python)
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

// vérifie déplacement valide
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

// clic utilisateur
function click(i, j) {
  if (!isValidMove(i, j)) return;

  data[i][j] = current;
  currentPos = [i, j];

  const btn = document.getElementById(`cell-${i}-${j}`);
  btn.innerText = current;
  btn.style.background = "#222";
  btn.style.color = "white";

  current++;

  highlightMoves();
}

// montre les prochains coups possibles
function highlightMoves() {
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
      document.getElementById(`cell-${ni}-${nj}`).style.background = "#88ff88";
    }
  }
}

// reset couleurs
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
// SCORE (inspiré Python)
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

  // score = équilibre + progression
  let filled = current - 1;
  let balance = max - min;

  return filled * 10 - balance;
}

// =====================
// FIN DE PARTIE
// =====================

function isGameOver() {
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (isValidMove(i, j)) return false;
    }
  }
  return true;
}

// hook après chaque coup
function checkEnd() {
  if (isGameOver()) {
    let score = computeScore();
    alert("Partie terminée ! Score: " + score);
  }
}

// override click pour inclure fin
const originalClick = click;
click = function(i, j) {
  originalClick(i, j);
  checkEnd();
};

// =====================
// SUBMIT SCORE
// =====================

window.submit = async function () {
  const name = document.getElementById("name").value || "Anonyme";
  const score = computeScore();

  await submitScore(name, score);
  loadLeaderboard();
};

