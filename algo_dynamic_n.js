// =========================================================================
// 🔧 STATE DYNAMIQUE & CONFIGURATION
// =========================================================================

let N, SIZE;
let startPositionStr = ""; 

let grid, pos;
let rowSum, colSum;

let bestScore;

// ANCRARES GÉOMÉTRIQUES (Parallélogrammes)
let anchorPos1 = null;
let anchorPos2 = null;
let anchorPos3 = null;
let anchorPos4 = null;
let looped = false; 

// GESTION DU TEMPS (LIMITE 6 MINUTES)
let startTime = 0;
const TIME_LIMIT_MS = 6 * 60 * 1000; 
let isTimeOver = false;

// SAUVEGARDE DU MEILLEUR ÉTAT ABSOLU
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

self.mode = "diffRC";          // Mode principal demandé par l'IHM
let activeMode = "diffRC";     // Mode réellement évalué à l'instant t

// Directions fixes
const DIRS = [
  [3,0], [2,2], [0,3], [-2,2],
  [-3,0], [-2,-2], [0,-3], [2,-2]
];

// =========================================================================
// 🧱 INITIALISATION ET UTILS
// =========================================================================

function init(Nval, text) {
    N = Nval;
    SIZE = N * N;

    startTime = performance.now(); 
    isTimeOver = false;

    grid = new Uint16Array(SIZE);
    pos  = new Uint16Array(SIZE + 1);

    rowSum = new Int32Array(N);
    colSum = new Int32Array(N);

    let parts = text.trim().split(/\s+/);
    if (parts.length < 3) {
        throw "Format invalide";
    }

    startPositionStr = parts[1];
    self.mode = "diffRC"; 
    activeMode = self.mode;

    let values = buildGridFromMoves(N, parts[1], parts[2]);

    if (values.length !== SIZE) {
        throw "Solution invalide";
    }

    rowSum.fill(0);
    colSum.fill(0);

    for (let i = 0; i < SIZE; i++) {
        let v = values[i];
        grid[i] = v;
        pos[v] = i;

        let x = (i / N) | 0;
        let y = i % N;

        rowSum[x] += v;
        colSum[y] += v;
    }

    bestScore = computeScore();
    resetAnchor();
    
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

        x = x + dx;
        y = y + dy;

        if (x < 0 || x >= N || y < 0 || y >= N) {
            console.error(`Saut invalide détecté à l'étape ${i} : position [${x}, ${y}] hors-limite.`);
        }

        current++;
        grid[x * N + y] = current;
    }

    return Array.from(grid);
}

function debugPrintGrid() {
    console.log("--- État de la Grille ---");
    for (let i = 0; i < N; i++) {
        let row = "";
        for (let j = 0; j < N; j++) {
            let val = grid[i * N + j];
            row += val.toString().padStart(4, " ") + " ";
        }
        console.log(row);
    }
    console.log("-------------------------");
}

// =========================================================================
// 🔁 GESTION DES ANCRES ET SNAPSHOTS
// =========================================================================

function resetAnchor() {
    anchorPos1 = null;
    anchorPos2 = null;
    anchorPos3 = null;
    anchorPos4 = null;
    looped = false;
}

function isSamePos(p1, p2) {
    if (!p1 || !p2) return false;
    return p1[0] === p2[0] && p1[1] === p2[1];
}

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

// =========================================================================
// 🔍 CŒUR GÉOMÉTRIQUE : DETECTION & ALTERNATION
// =========================================================================

function parallel() {
    let found = false;
    let reprise = true;
    let nbIter = 0;
    looped = false; 

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

                            // Vérification ou enregistrement de l'ancre géométrique
                            if (anchorPos1 === null) {
                                anchorPos1 = pos1;
                                anchorPos2 = pos2;
                                anchorPos3 = pos3;
                                anchorPos4 = pos4;
                            } else {
                                if (isSamePos(pos1, anchorPos1) && 
                                    isSamePos(pos2, anchorPos2) && 
                                    isSamePos(pos3, anchorPos3) && 
                                    isSamePos(pos4, anchorPos4)) {
                                    looped = true; 
                                }
                            }
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

function altern() {
    let first = self.val1;

    if (first !== 0 && self.val3 > first) {
        let positions = [];

        // Récupération de la séquence inverse
        for (let v = self.val3; v > first; v--) {
            positions.push(posOf(v));
        }

        let newVal = first + 1;

        // Inversion géométrique du chemin
        for (let i = 0; i < positions.length; i++) {
            let [x, y] = positions[i];
            setVal(x, y, newVal);
            newVal++;
        }
    }
}

// =========================================================================
// ⚡ CALCULS DE SCORES
// =========================================================================

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
    if (activeMode === "diffDiag") return full.diffDiag;
    if (activeMode === "balance") return full.balance;
    return full.diffRC;
}

function computePrimaryScore() {
    const full = computeFullScoreFromFlat();
    if (self.mode === "diffDiag") return full.diffDiag;
    if (self.mode === "balance") return full.balance;
    return full.diffRC;
}

function checkTime() {
    if (isTimeOver) return true;
    const elapsed = performance.now() - startTime;
    if (elapsed >= TIME_LIMIT_MS) {
        isTimeOver = true;
    }
    return isTimeOver;
}

// =========================================================================
// 🔄 EXPORT DE LA SOLUTION
// =========================================================================

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

function buildStepResult(timeOrForceOver) {
    const currentFull = computeFullScoreFromFlat();
    const currentPrimary = computePrimaryScore();

    return {
        timeOver: timeOrForceOver,
        current: {
            score: currentPrimary,
            diffRC: currentFull.diffRC,
            diffDiag: currentFull.diffDiag,
            balance: currentFull.balance,
            activeMode: activeMode
        },
        best: {
            score: globalBest.score,
            diffRC: globalBest.diffRC,
            diffDiag: globalBest.diffDiag,
            balance: globalBest.balance,
            solution: exportSolutionFromGrid(globalBest.grid, globalBest.pos)
        }
    };
}

// =========================================================================
// 🔄 ALGORITHME PRINCIPAL (REFORMATÉ SANS DOUBLE DÉCLARATION)
// =========================================================================

let forceStop = false; 

function step() {
    if (checkTime() || forceStop) {
        return buildStepResult(true);
    }

    // Détermination du critère secondaire temporaire
    let secondaryMode = "diffRC";
    if (self.mode === "diffRC") {
        secondaryMode = "balance";
    } else if (self.mode === "balance") {
        secondaryMode = "diffRC";
    } else if (self.mode === "diffDiag") {
        secondaryMode = "diffRC";
    }

    activeMode = self.mode; 

    i=0;
    while (i % 50 !== 0 || !checkTime()) {
        i++;
        // 1. Détection du parallélogramme (lève 'looped' s'il matche l'ancre active)
        parallel();
        
        // 2. Traitement du rebouclage géométrique
        if (looped && !checkTime()) {
            console.log("Boucle géométrique détectée ! Bascule temporaire sur :", secondaryMode);
            activeMode = secondaryMode; 
            
            let secondaryImprovementsCount = 0;
            let lastSecondaryScore = computeScore();

            // On effectue des étapes de perturbation légères sur le critère secondaire
            for (let j = 0; j < 500; j++) {
                parallel();
                altern();
                recomputeSums();

                let currentSecondaryScore = computeScore();
                if (currentSecondaryScore < lastSecondaryScore) {
                    secondaryImprovementsCount++;
                    lastSecondaryScore = currentSecondaryScore;
                    if (secondaryImprovementsCount >= 2) break; 
                }
            }

            // Si échec de la perturbation secondaire : arrêt de sécurité
            if (secondaryImprovementsCount < 2) {
                forceStop = true;
                break;
            }

            // Si réussi : on efface l'ancre (unknown), repasse en principal et on poursuit
            resetAnchor();
            activeMode = self.mode;
            continue; 
        }

        // 3. Application de la transformation & Hill Climbing Strict
        let stateBackup = snapshot(); 
        let scoreBefore = computeScore();

        altern();
        recomputeSums();

        let scoreAfter = computeScore();

        if (scoreAfter < scoreBefore) {
            // AMÉLIORATION LOCALE : Le paysage change, on reset l'ancre
            resetAnchor();
            bestScore = scoreAfter;
        } else {
            // ÉCHEC : On applique le Rollback (Hill Climbing strict)
            restoreSnapshot(stateBackup);
        }

        // 4. Suivi du record Historique Global
        const currentPrimary = computePrimaryScore();
        if (currentPrimary < globalBest.score) {
            const full = computeFullScoreFromFlat();
            globalBest = {
                score: currentPrimary,
                diffRC: full.diffRC,
                diffDiag: full.diffDiag,
                balance: full.balance,
                grid: grid.slice(),
                pos: pos.slice()
            };
            
            resetAnchor(); // Remise à zéro complète (unknown)
        }
    }

    return buildStepResult(checkTime() || forceStop);
}
