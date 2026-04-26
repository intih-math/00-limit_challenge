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
// 🔍 Trouver position d'une valeur
// =========================
function findValue(v) {
    for (let i = 0; i < SIZE; i++) {
        if (grid[i] === v) return i;
    }
    return -1;
}

// =========================
// 🔍 Détection parallélogramme (équivalent Python parallel())
// =========================
function detectParallel() {
    for (let val1 = 1; val1 < SIZE - 1; val1++) {

        let i1 = findValue(val1);
        let i2 = findValue(val1 + 1);

        if (i1 < 0 || i2 < 0) continue;

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
                return { val1, val3 };
            }
        }
    }

    return null;
}

// =========================
// 🔁 Transformation (équivalent Python altern())
// =========================
function applyAltern(val1, val3) {

    let positions = [];

    // récupérer positions du segment à inverser
    for (let v = val3; v > val1; v--) {
        let idx = findValue(v);
        if (idx >= 0) positions.push(idx);
    }

    // réassigner les valeurs
    let newVal = val1 + 1;

    for (let idx of positions) {
        grid[idx] = newVal;
        newVal++;
    }
}

// =========================
// 🔥 Mutation complète (parallel + altern + acceptation)
// =========================
function tryMutation() {

    let res = detectParallel();
    if (!res) return;

    // sauvegarde
    let backup = grid.slice();

    applyAltern(res.val1, res.val3);

    let newScore = computeScore();

    if (newScore <= bestScore) {
        bestScore = newScore;
    } else {
        // rollback
        for (let i = 0; i < SIZE; i++) {
            grid[i] = backup[i];
        }
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
