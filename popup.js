import { getCurrentVersion, isOutdated, fetchLatestVersion } from './version-utils.js';

(async () => {
    const versionInfo = document.getElementById("version-info");
    const currentVersion = await getCurrentVersion();
    const latestVersion = await fetchLatestVersion();

    if (!currentVersion || !latestVersion) {
        versionInfo.innerHTML = `<p>Error fetching version information.</p>`;
        return;
    }

    const outdated = isOutdated(currentVersion, latestVersion);

    versionInfo.innerHTML = `
        <p><strong>Current Version:</strong> ${currentVersion}</p>
        <p><strong>Latest Version:</strong> ${latestVersion}</p>
        <hr>
        <p id="status">${outdated ? "Your browser is outdated. Please update!" : "Your browser is up-to-date."}</p>
    `;
})();