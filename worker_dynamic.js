importScripts("algo_dynamic_n.js");

onmessage = function(e) {
    let {solution, N} = e.data;

    init(N, solution);

    function loop() {
        let res = step(2000);
        postMessage(res);
        setTimeout(loop, 0);
    }

    loop();
};
