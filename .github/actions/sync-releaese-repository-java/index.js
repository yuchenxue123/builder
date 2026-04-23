const fs = require('fs');

const repository = process.env.INPUT_REPOSITORY;
const prefix = process.env.INPUT_PREFIX;

const token = process.env.INPUT_TOKEN;
const localRepository = process.env.INPUT_LOCAL;


(async () => {
    const headers = {
        'Authorization': `token ${token}`,
        'User-Agent': 'GitHub Actions Sync Release Repository Java',
        'Accept': 'application/vnd.github.v3+json',
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, { headers });
        const data = await response.json();

        const latestVersion = data['tag_name'];

        if (!latestVersion || latestVersion === 'null') {
            console.log("No releases found or tag is empty. Skipping.");
            return setOutput("trigger", "false");
        }

        console.log(`Upstream latest release tag: ${latestVersion}`);

        const releaseTag = `${prefix}-${latestVersion}`;

        console.log(`Generate release tag: ${releaseTag}`);

        const hasTagExist = await fetch(`https://api.github.com/repos/${localRepository}/releases/tags/${releaseTag}`, { headers });

        if (hasTagExist.status === 200) {
            console.log(`Tag ${releaseTag} already exists. Skipping.`);
            setOutput("trigger", "false");
        } else {
            setOutput("trigger", "true");
            setOutput("upstream_tag", latestVersion);
            setOutput("release_tag", releaseTag);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }

    function setOutput(name, value) {
        const outPath = process.env.GITHUB_OUTPUT;
        const line = `${name}=${value}\n`;
        if (outPath) {
            fs.appendFileSync(outPath, line);
        } else {
            console.log(`::set-output name=${name}::${value}`);
        }
    }
})();