importScripts("algo_dynamic_n.js");

onmessage = function(e) {
    const { solution, mode } = e.data;
    self.mode = mode || "diffRC";

    try {
        const parts = solution.trim().split(/\s+/);

        // 🔹 1. N
        const N = parseInt(parts[0]);
        if (isNaN(N)) throw "N invalide";

        // 🔹 2. position "ligne,colonne"
        const posParts = parts[1].split(",");
        if (posParts.length !== 2) throw "Position invalide";

        const startRow = parseInt(posParts[0]);
        const startCol = parseInt(posParts[1]);

        if (isNaN(startRow) || isNaN(startCol)) {
            throw "Position invalide";
        }

        // 🔹 3. grille
        const gridText = parts.slice(2).join("");

        init(N, gridText);

        postMessage({ type: "init_ok" });

        function loop() {
            const res = step(2000);
            postMessage(res);
            setTimeout(loop, 0);
        }

        loop();

    } catch (err) {
        postMessage({
            type: "init_error",
            message: err.toString()
        });
    }
};
