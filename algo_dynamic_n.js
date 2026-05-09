// =========================
// 🔧 STATE DYNAMIQUE
// =========================

let N, SIZE;

let grid, pos;
let rowSum, colSum;

let bestScore;

self.val1 = 1;
self.val3 = 0;
self.kd   = 0;

self.mode = "diffRC";

// directions fixes
const DIRS = [
  [3,0],[2,2],[0,3],[-2,2],
  [-3,0],[-2,-2],[0,-3],[2,-2]
];

// =========================
// 🧱 INIT
// =========================

function init(Nval, text) {

    N = Nval;
    SIZE = N * N;

    grid = new Uint16Array(SIZE);
    pos  = new Uint16Array(SIZE + 1);

    rowSum = new Int32Array(N);
    colSum = new Int32Array(N);

    let parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
        throw "Format invalide";
    }

    self.mode = parts[2];

    let values = buildGridFromMoves(N, parts[1], parts[2]);

    if (values.length !== SIZE) {
        throw "Solution invalide";
    }

    rowSum.fill(0);
    colSum.fill(0);

    for (let i=0;i<SIZE;i++) {
        let v = values[i];
        grid[i] = v;
        pos[v] = i;

        let x = (i / N) | 0;
        let y = i % N;

        rowSum[x] += v;
        colSum[y] += v;
    }

    bestScore = computeScore();
}

function buildGridFromMoves(N, start, moves) {
    let grid = new Uint16Array(N * N);

    let [x, y] = start.split(",").map(Number);

    let current = 1;
    grid[x * N + y] = current;

    for (let i = 0; i < moves.length; i++) {
        let m = parseInt(moves[i]);
        let [dx, dy] = DIRS[m];

        x = (x + dx + N) % N;
        y = (y + dy + N) % N;

        current++;
        grid[x * N + y] = current;
    }

    return Array.from(grid);
}
// =========================
// 🔁 Snapshot
// =========================

function snapshot() {
    return {
        grid: grid.slice(),
        pos: pos.slice(),
        rowSum: rowSum.slice(),
        colSum: colSum.slice()
    };
}

function restoreSnapshot(s) {
    grid.set(s.grid);
    pos.set(s.pos);
    rowSum.set(s.rowSum);
    colSum.set(s.colSum);
}

// =========================
// ⚡ SCORE
// =========================

function computeScore() {

    const full = computeFullScoreFromFlat();

    if (self.mode === "diffDiag") return full.diffDiag;
    if (self.mode === "balance") return full.balance;

    return full.diffRC;
}

// =========================
// 🔍 Recherche 2 niveaux
// =========================

function exploreTwoLevels() {

    const baseScore = computeScore();
    let bestLocal = baseScore;
    let bestState = null;

    for (let i = 0; i < DIRS.length; i++) {

        let before1 = snapshot();

        parallel();
        altern();
        recomputeSums();

        let score1 = computeScore();

        for (let j = 0; j < DIRS.length; j++) {

            let before2 = snapshot();

            parallel();
            altern();
            recomputeSums();

            let score2 = computeScore();

            if (score2 < bestLocal) {
                bestLocal = score2;
                bestState = snapshot();
            }

            restoreSnapshot(before2);
        }

        restoreSnapshot(before1);
    }

    if (bestState && bestLocal < baseScore) {
        restoreSnapshot(bestState);
        recomputeSums();
        bestScore = bestLocal;
        return true;
    }

    return false;
}

// =========================
// 🔄 STEP PRINCIPAL
// =========================

function step(iter = 500) {

    for (let i = 0; i < iter; i++) {

        let before = computeScore();

        parallel();
        altern();
        recomputeSums();

        let after = computeScore();

        if (after > before) {

            let improved = exploreTwoLevels();

            if (!improved) {
                bestScore = after;
            }

        } else {
            bestScore = after;
        }
    }

    const full = computeFullScoreFromFlat();

    return {
        score: bestScore,
        diffRC: full.diffRC,
        diffDiag: full.diffDiag,
        balance: full.balance,
        solution: exportSolution()
    };
}

// =========================
// ⚡ UTILITAIRES EXISTANTS
// =========================

function recomputeSums() {

    rowSum.fill(0);
    colSum.fill(0);

    for (let i = 0; i < SIZE; i++) {
        let v = grid[i];

        let x = (i / N) | 0;
        let y = i % N;

        rowSum[x] += v;
        colSum[y] += v;
    }
}
