importScripts("algo_dynamic_n.js");

const btn = document.getElementById("runBtn");

worker.onmessage = function(e) {
    const data = e.data;

    if (data.type === "init_ok") {
        document.getElementById("status").textContent =
            "Valide";

        btn.classList.add("valid"); // 👉 bouton devient vert
        return;
    }

    if (data.type === "init_error") {
        document.getElementById("status").textContent =
            "❌";

        btn.classList.remove("valid"); // 👉 redevient normal
        worker.terminate();
        return;
    }

    // optimisation
    document.getElementById("output").textContent =
        "Score: " + data.score;
};
