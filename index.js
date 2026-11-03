const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    try {
        const auth = core.getInput('auth');
        const owner = core.getInput('owner');
        const repo = core.getInput('repo');
        const interval = core.getInput('interval');
        const workflow_name = core.getInput('workflow_name');
        const octokit = github.getOctokit(auth);
        // Retries temporary GitHub API failures (5xx, timeouts, connection
        // resets) so a blip does not fail the release that is waiting.
        // A 4xx (bad token, missing workflow) still fails at once.
        const request = async (route, params) => {
            for (let attempt = 1; ; attempt++) {
                try {
                    return await octokit.request(route, params);
                } catch (error) {
                    const temporary = !error.status || error.status >= 500;
                    if (!temporary || attempt >= 5) throw error;
                    console.log(`GitHub API ${route} failed (${error.status || error.message}), attempt ${attempt} of 5; retrying in ${attempt * 10}s`);
                    await timeout(attempt * 10 * 1000);
                }
            }
        };

        // Get the workflow id
        let workflow = (await request('GET /repos/{owner}/{repo}/actions/workflows', {
            "owner": owner,
            "repo": repo,
        }))
        workflow =  workflow.data.workflows.filter(e => e.name == workflow_name && e.state == 'active')[0];
        const workflow_id = workflow.id;

        console.log("Found workflow id: " + workflow_id);

        let latestRun = (await request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
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

                latestRun = (await request('GET /repos/{owner}/{repo}/actions/runs/{run_id}', {
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
