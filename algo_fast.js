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

    if (values.length !== SIZE) {
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
// 🔁 SWAP
// =========================
function applySwap(i, j) {
    let vi = grid[i];
    let vj = grid[j];

    let xi = (i / N) | 0, yi = i % N;
    let xj = (j / N) | 0, yj = j % N;

    rowSum[xi] -= vi;
    colSum[yi] -= vi;

    rowSum[xj] -= vj;
    colSum[yj] -= vj;

    grid[i] = vj;
    grid[j] = vi;

    pos[vi] = j;
    pos[vj] = i;

    rowSum[xi] += vj;
    colSum[yi] += vj;

    rowSum[xj] += vi;
    colSum[yj] += vi;
}

// =========================
// 🔥 MUTATION
// =========================
function tryMutation() {
    let v = 1 + (Math.random() * (SIZE - 2)) | 0;

    let i1 = pos[v];
    let i2 = pos[v+1];

    let d = DIRS[(Math.random() * DIRS.length) | 0];

    let i3 = move(i1, d[0], d[1]);

    let x1 = (i1 / N) | 0, y1 = i1 % N;
    let x2 = (i2 / N) | 0, y2 = i2 % N;

    let dx = x2 - x1;
    let dy = y2 - y1;

    let i4 = move(i3, dx, dy);

    if (i3 === i4) return;

    applySwap(i3, i4);

    let newScore = computeScore();

    if (newScore <= bestScore) {
        bestScore = newScore;
    } else {
        applySwap(i3, i4); // rollback
    }
}

// =========================
// 🔁 STEP
// =========================
function step(iter = 1000) {
    for (let i=0;i<iter;i++) {
        tryMutation();
    }

    return {
        score: bestScore,
        solution: Array.from(grid).join("")
    };
}
