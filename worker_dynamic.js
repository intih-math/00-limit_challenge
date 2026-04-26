importScripts("algo_dynamic_n.js");

onmessage = function(e) {
    const { solution } = e.data;

    try {
        const N = Math.sqrt(solution.replace(/\D/g, "").length);

        init(N, solution);

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
