// =========================
// 🔧 STATE DYNAMIQUE
// =========================
let N, SIZE;

let grid, pos;
let rowSum, colSum;

let bestScore;

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
    let min = 1e9, max = -1e9;

    for (let i=0;i<N;i++) {
        let r = rowSum[i];
        let c = colSum[i];

        if (r < min) min = r;
        if (c < min) min = c;
        if (r > max) max = r;
        if (c > max) max = c;
    }

    return max - min;
}

// =========================
// 🔍 Détection parallélogramme
// =========================
function detectParallel() {
    for (let val1 = 1; val1 < SIZE - 1; val1++) {

        let i1 = pos[val1];
        let i2 = pos[val1 + 1];

        let x1 = (i1 / N) | 0, y1 = i1 % N;
        let x2 = (i2 / N) | 0, y2 = i2 % N;

        let dx = x2 - x1;
        let dy = y2 - y1;

        for (let k = 0; k < DIRS.length; k++) {

            let [dxk, dyk] = DIRS[k];

            let x3 = (x1 + dxk + N) % N;
            let y3 = (y1 + dyk + N) % N;

            let i3 = x3 * N + y3;
            let val3 = grid[i3];

            if (val3 <= val1) continue;

            let x4 = (x3 + dx + N) % N;
            let y4 = (y3 + dy + N) % N;

            let i4 = x4 * N + y4;
            let val4 = grid[i4];

            if (val4 === val3 + 1 && val4 > val1 + 2) {
                return { val1, val3, k };
            }
        }
    }
    return null;
}

// =========================
// 🔁 Altern (géométrique)
// =========================
function applyAltern(val1, val3, k) {

    let i1 = pos[val1];
    let i2 = pos[val1 + 1];

    let x1 = (i1 / N) | 0, y1 = i1 % N;
    let x2 = (i2 / N) | 0, y2 = i2 % N;

    let dx = x2 - x1;
    let dy = y2 - y1;

    let kInv = (k + 4) % 8;
    let [dxkInv, dykInv] = DIRS[kInv];

    let path = [];
    let cx = x1;
    let cy = y1;

    for (let v = val1; v <= val3; v++) {

        let idx = cx * N + cy;
        path.push(idx);

        if ((v - val1) % 2 === 0) {
            cx = (cx + dxkInv + N) % N;
            cy = (cy + dykInv + N) % N;
        } else {
            cx = (cx + dx + N) % N;
            cy = (cy + dy + N) % N;
        }
    }

    // récupérer + inverser
    let vals = path.map(i => grid[i]).reverse();

    // appliquer + maj pos
    for (let i = 0; i < path.length; i++) {
        let idx = path[i];
        let v = vals[i];

        grid[idx] = v;
        pos[v] = idx;
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
        tryMutation();
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
