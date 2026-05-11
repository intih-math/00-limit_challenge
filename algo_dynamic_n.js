// =========================
// 🔧 STATE DYNAMIQUE
// =========================

let N, SIZE;
let startPositionStr = ""; // Mémorise la position de départ "x,y" pour l'export

let grid, pos;
let rowSum, colSum;

let bestScore;

// 🟢 SAUVEGARDE DU MEILLEUR ÉTAT ABSOLU (RECORD)
let globalBest = {
    score: Infinity,
    diffRC: Infinity,
    diffDiag: Infinity,
    balance: Infinity,
    grid: null,
    pos: null
};

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

    startPositionStr = parts[1];
    self.mode = "diffRC"; // Sera surchargé par le message du worker si nécessaire

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
    
    // Initialiser le record global avec l'état de départ
    const full = computeFullScoreFromFlat();
    globalBest = {
        score: bestScore,
        diffRC: full.diffRC,
        diffDiag: full.diffDiag,
        balance: full.balance,
        grid: grid.slice(),
        pos: pos.slice()
    };
}

function posOf(v) {
    let index = pos[v];
    let x = (index / N) | 0;
    let y = index % N;
    return [x, y];
}

function getVal(x, y) {
    return grid[x * N + y];
}

function setVal(x, y, val) {
    const idx = x * N + y;
    grid[idx] = val;
    pos[val] = idx;
}

function wrap([x, y], [dx, dy]) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx < 0 || nx >= N) return [-1, -1];
    if (ny < 0 || ny >= N) return [-1, -1];

    return [nx, ny];
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
        colSum: colSum.slice(),
        val1: self.val1,
        val3: self.val3,
        kd: self.kd
    };
}

function restoreSnapshot(s) {
    grid.set(s.grid);
    pos.set(s.pos);
    rowSum.set(s.rowSum);
    colSum.set(s.colSum);
    self.val1 = s.val1;
    self.val3 = s.val3;
    self.kd = s.kd;
}

// =========================
// 🔍 Détection parallélogramme
// =========================
function parallel() {
    let found = false;
    let reprise = true;
    let nbIter = 0;

    while (!found && nbIter < SIZE) {
        nbIter++;

        let pos1 = posOf(self.val1);
        let pos2 = posOf(self.val1 + 1);

        let d = [pos2[0] - pos1[0], pos2[1] - pos1[1]];

        let k = reprise ? self.kd + 1 : 0;
        reprise = false;

        while (!found && k < DIRS.length) {
            let dk = DIRS[k];

            let pos3 = wrap(pos1, dk);
            if (pos3[0] !== -1) {
                let val3 = getVal(pos3[0], pos3[1]);

                if (pos3[0] !== pos2[0] || pos3[1] !== pos2[1]) {
                    let pos4 = wrap(pos3, d);
                    if (pos4[0] !== -1) {
                        let val4 = getVal(pos4[0], pos4[1]);

                        if (val4 === val3 + 1 && val4 > self.val1 + 2) {
                            self.val3 = val3;
                            self.dk = k;
                            found = true;
                        }
                    }
                }
            }
            k++;
        }

        self.kd = k;

        if (!found) {
            if (self.val1 < SIZE - 1) {
                self.val1++;
            } else {
                self.val1 = 1;
            }
        }
    }
}

// =========================
// 🔁 Altern (géométrique)
// =========================
function altern() {
    let first = self.val1;

    if (first !== 0 && self.val3 > first) {
        let positions = [];

        for (let v = self.val3; v > first; v--) {
            positions.push(posOf(v));
        }

        let newVal = first + 1;

        for (let i = 0; i < positions.length; i++) {
            let [x, y] = positions[i];
            setVal(x, y, newVal);
            newVal++;
        }
    }
}

// =========================
// ⚡ SCORE
// =========================
function computeFullScoreFromFlat() {
    let sumsRow = new Int32Array(N);
    let sumsCol = new Int32Array(N);
    let diag1 = new Int32Array(N);
    let diag2 = new Int32Array(N);

    for (let i = 0; i < SIZE; i++) {
        let v = grid[i];
        let x = (i / N) | 0;
        let y = i % N;

        sumsRow[x] += v;
        sumsCol[y] += v;
        diag1[(x + y) % N] += v;
        diag2[(x - y + N) % N] += v;
    }

    let minRC = Infinity;
    let maxRC = -Infinity;

    for (let i = 0; i < N; i++) {
        minRC = Math.min(minRC, sumsRow[i], sumsCol[i]);
        maxRC = Math.max(maxRC, sumsRow[i], sumsCol[i]);
    }

    let diffRC = maxRC - minRC;

    let minD = Math.min(minRC, ...diag1, ...diag2);
    let maxD = Math.max(maxRC, ...diag1, ...diag2);

    let diffDiag = maxD - minD;

    let weights = [];
    let w = Math.floor((N - 1) / 2) * 2;

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

    let balance = Math.max(Math.abs(balanceX), Math.abs(balanceY));

    return { diffRC, diffDiag, balance };
}

// =========================
// 🔄 Recompute complet sums
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
        self.val1 = (self.val1 % (SIZE - 1)) + 1;
    }

    if (bestState && bestLocal < baseScore) {
        restoreSnapshot(bestState);
        recomputeSums();
        bestScore = bestLocal;
        return true;
    }

    return false;
}

// 🟢 EXPORTATION ADAPTÉE À UNE GRILLE SPÉCIFIQUE
function exportSolutionFromGrid(targetGrid, targetPos) {
    let result = [];
    
    let startPos = startPositionStr;
    if (targetPos[1] !== undefined) {
        let startRow = (targetPos[1] / N) | 0;
        let startCol = targetPos[1] % N;
        startPos = `${startRow},${startCol}`;
    }

    for (let v = 1; v < SIZE; v++) {
        let index1 = targetPos[v];
        let x1 = (index1 / N) | 0;
        let y1 = index1 % N;

        let index2 = targetPos[v + 1];
        let x2 = (index2 / N) | 0;
        let y2 = index2 % N;

        let dx = x2 - x1;
        let dy = y2 - y1;

        let matched = false;
        for (let i = 0; i < DIRS.length; i++) {
            if (DIRS[i][0] === dx && DIRS[i][1] === dy) {
                result.push(i);
                matched = true;
                break;
            }
        }
        if (!matched) result.push("?");
    }

    return `${N} ${startPos} ${result.join("")}`;
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

        // 🟢 TEST DE RECORD À CHAQUE MICRO-ÉTAPE
        const currentScore = computeScore();
        if (currentScore < globalBest.score) {
            const full = computeFullScoreFromFlat();
            globalBest = {
                score: currentScore,
                diffRC: full.diffRC,
                diffDiag: full.diffDiag,
                balance: full.balance,
                grid: grid.slice(),
                pos: pos.slice()
            };
        }
    }

    const currentFull = computeFullScoreFromFlat();
    const currentScore = computeScore();

    // On renvoie d'un côté l'état courant qui bouge,
    // et de l'autre le record absolu figé.
    return {
        // État courant (qui varie en direct)
        current: {
            score: currentScore,
            diffRC: currentFull.diffRC,
            diffDiag: currentFull.diffDiag,
            balance: currentFull.balance
        },
        // Meilleur état historique (figé)
        best: {
            score: globalBest.score,
            diffRC: globalBest.diffRC,
            diffDiag: globalBest.diffDiag,
            balance: globalBest.balance,
            solution: exportSolutionFromGrid(globalBest.grid, globalBest.pos)
        }
    };
}
