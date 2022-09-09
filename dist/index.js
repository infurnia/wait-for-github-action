/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 838:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 766:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(838);
const github = __nccwpck_require__(766);

(async () => {
    try {
        const auth = core.getInput('auth');
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const interval = core.getInput('interval');
        const workflow_name = core.getInput('workflow_name');
        const octokit = github.getOctokit(auth);

        // Get the workflow id
        let workflow = (await octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
            "owner": owner,
            "repo": repo,
        })).data.workflows.filter(e => e.name == workflow_name)[0];
        const workflow_id = workflow.id;

        console.log("Found workflow id: " + workflow_id);

        let latestRun = (await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
            "owner": owner,
            "repo": repo,
            "workflow_id": workflow_id
        })).data.workflow_runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        console.log(`latestRun.id: ${latestRun.id}`);
        console.log(`latestRun.status: ${latestRun.status}`);

        if (!latestRun) {
            console.error("No runs in this workflow.");
            success = false;
        } else {
            while (latestRun.status !== "completed") {
                await timeout(interval*1000);

                latestRun = (await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
                    "owner": owner,
                    "repo": repo,
                    "run_id": latestRun.id
                })).data;

                console.log(`latestRun.id: ${latestRun.id}`);
                console.log(`latestRun.status: ${latestRun.status}`);
            }
            success = latestRun.conclusion === "success";
        }
        console.log(`success: ${success}`);
        process.exit(success ? 0 : 1);
    } catch (error) {
        core.setFailed(error.message);
    }

})();

function timeout (ms) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

})();

module.exports = __webpack_exports__;
/******/ })()
;