import { updateVersionCache, getCachedData, updateBrowserStatusIcon, capitalize } from './ext-utils.js';

(async () => {
    const versionInfo = document.getElementById("version-info");
    const checkNowButton = document.getElementById("check-now");

    // Function to update the version info display
    async function updateVersionInfo() {
        const cachedData = await getCachedData('versionInfo');
        if (cachedData) {
            console.log("Using cached version info:", cachedData);
            versionInfo.innerHTML = buildHtmlForVersionInfo(
                cachedData.currentVersion,
                cachedData.currentChannel,
                cachedData.latestVersion,
                cachedData.lastUpdated,
                cachedData.isOutdated
            );
        } else {
            console.log("No cached data found. Fetching fresh data...");
            const cacheData = await updateVersionCache(); // Fetch and cache fresh data
            if (cacheData) {
                versionInfo.innerHTML = buildHtmlForVersionInfo(
                    cacheData.currentVersion,
                    cacheData.currentChannel,
                    cacheData.latestVersion,
                    cacheData.lastUpdated,
                    cacheData.isOutdated
                );
            } else {
                versionInfo.innerHTML = `<p>Error fetching version information.</p>`;
            }
        }
    }      

    // Function to handle "Check Now" button click
    async function handleCheckNow() {
        console.log('"Check Now" button clicked.');
        checkNowButton.disabled = true;
        checkNowButton.textContent = "Checking...";
    
        const cacheData = await updateVersionCache();
        if (cacheData) {
            const { currentChannel, latestVersion, isOutdated } = cacheData;
            updateBrowserStatusIcon(isOutdated, currentChannel, latestVersion);
            versionInfo.innerHTML = buildHtmlForVersionInfo(
                cacheData.currentVersion,
                cacheData.currentChannel,
                cacheData.latestVersion,
                cacheData.lastUpdated,
                cacheData.isOutdated
            );
        } else {
            versionInfo.innerHTML = `<p>Error fetching version information.</p>`;
        }
    
        checkNowButton.disabled = false;
        checkNowButton.textContent = "Check Now";
    }

    // Initial update on popup load
    await updateVersionInfo();

    // Add event listener to "Check Now" button
    if (checkNowButton) {
        checkNowButton.addEventListener('click', handleCheckNow);
    }
})();

function buildHtmlForVersionInfo(currentVersion, currentChannel, latestVersion, currentTime, outdated) {
    return `
        <p id="status" class="${outdated ? "outdated" : ""}">
            ${outdated ? "⚠️ Your browser is out-of-date." : "✅ Your browser is up-to-date."}
        </p>
        <hr>
        <div id="version-details">
            <p><strong>Current Version:</strong> ${currentVersion} (${capitalize(currentChannel)})</p>
            ${outdated ? `<p><strong>Latest Version:</strong> ${latestVersion}</p>` : ""}
        </div>
        <p id="last-checked"><strong>Last Checked:</strong> ${currentTime}</p>
    `;
}
