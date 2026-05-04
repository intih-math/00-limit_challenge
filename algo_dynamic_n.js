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

    let values = text.split("")
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));

    if (values.length !== SIZE-1) {
        throw "Solution invalide pour N=" + N;
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

// =========================
// ⚡ UTILS
// =========================
function posOf(v) {
    let i = pos[v];
    return [(i / N) | 0, i % N];
}

function getVal([x, y]) {
    return grid[x * N + y];
}

function setVal(x, y, v) {
    let i = x * N + y;
    grid[i] = v;
    pos[v] = i;
}

function wrap([x, y], [dx, dy]) {
    x = (x + dx + N) % N;
    y = (y + dy + N) % N;
    return [x, y];
}

function same(a, b) {
    return a[0] === b[0] && a[1] === b[1];
}

function move(i, dx, dy) {
    let x = (i / N) | 0;
    let y = i % N;

    x = (x + dx + N) % N;
    y = (y + dy + N) % N;

    return x * N + y;
}

// =========================
// ⚡ SCORE
// =========================
function computeScore() {
    const full = computeFullScoreFromFlat();

    if (self.mode === "diffDiag") return full.diffDiag;
    if (self.mode === "balance") return full.balance;

    return full.diffRC; // défaut
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
            let val3 = getVal(pos3);

            if (!same(pos3, pos2)) {
                let pos4 = wrap(pos3, d);
                let val4 = getVal(pos4);

                if (val4 === val3 + 1 && val4 > self.val1 + 2) {
                    self.val3 = val3;
                    self.dk = k;
                    found = true;
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

    let balance = Math.min(Math.abs(balanceX), Math.abs(balanceY));

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

// =========================
// 🔥 Mutation complète
// =========================
function tryMutation() {

    let res = detectParallel();
    if (!res) return;

    let backupGrid = grid.slice();
    let backupPos  = pos.slice();

    applyAltern(res.val1, res.val3, res.k);

    // 🔴 important
    recomputeSums();

    let newScore = computeScore();

    if (newScore <= bestScore) {
        bestScore = newScore;
    } else {
        grid.set(backupGrid);
        pos.set(backupPos);

        // restaurer sums
        recomputeSums();
    }
}
// =========================
// 🔁 STEP
// =========================
function step(iter = 1000) {
    for (let i=0;i<iter;i++) {
        parallel();
        altern();
    }

    const full = computeFullScoreFromFlat();
    
    return {
        score: bestScore,
        diffRC: full.diffRC,
        diffDiag: full.diffDiag,
        balance: full.balance,
        solution: Array.from(grid).join("")
    };
}
