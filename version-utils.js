/**
 * Fetches the Chrome platforms data from the Version History API.
 * @returns {Promise<string|null>} The matched platform string or null if not found.
 */
async function getChromePlatform() {
    try {
        const response = await fetch('https://versionhistory.googleapis.com/v1/chrome/platforms');
        console.log("Fetching Chrome platforms data...");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received platforms data:", data);

        if (!data || !data.platforms || !Array.isArray(data.platforms)) {
            throw new Error("Invalid or missing platform data in response");
        }

        const platformMap = new Map(data.platforms.map(p => [p.platformType, p.platformType.toLowerCase()]));
        console.log("Platform Map:", platformMap);

        const userAgentLower = navigator.userAgent.toLowerCase();
        console.log("User agent:", userAgentLower);

        // Sort platformTypes to prioritize those with numbers (e.g., "win64" before "win")
        const platformTypes = Array.from(platformMap.keys()).sort((a, b) => {
            const aHasNumber = /\d/.test(a);
            const bHasNumber = /\d/.test(b);
            if (aHasNumber && !bHasNumber) {
                return -1; // a comes first
            } else if (!aHasNumber && bHasNumber) {
                return 1; // b comes first
            } else {
                return 0; // maintain original order
            }
        });

        console.log("Sorted Platform Types:", platformTypes);

        for (let platformType of platformTypes) {
            const lowerCasePlatform = platformMap.get(platformType);
            console.log(`Checking platform type: ${platformType} (${lowerCasePlatform})`);
            if (userAgentLower.includes(lowerCasePlatform)) {
                console.log(`Matched platform: ${lowerCasePlatform}`);
                return lowerCasePlatform;
            }
        }

        console.error("No matching platform found in data:", data);
        chrome.action.setIcon({ path: "icons/warning-icon16.png" });
        return null;
    } catch (error) {
        console.error("Error fetching or processing platform data:", error);
        chrome.action.setIcon({ path: "icons/warning-icon16.png" });
        return null;
    }
}

/**
 * Retrieves the current Chrome version.
 * @returns {Promise<string|null>} The current Chrome version or null if undetermined.
 */
async function getCurrentVersion() {
    if (navigator.userAgentData) {
        try {
            const ua = await navigator.userAgentData.getHighEntropyValues(["fullVersionList"]);
            console.log("UserAgentData:", ua);
            const chromeVersion = ua.fullVersionList.find(item => item.brand === "Google Chrome");
            console.log("Detected Chrome version:", chromeVersion ? chromeVersion.version : null);
            return chromeVersion ? chromeVersion.version : null;
        } catch (error) {
            console.error("Error getting current version:", error);
            return null;
        }
    } else {
        const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        console.log("Parsed userAgent version:", match ? match[1] : null);
        return match ? match[1] : null;
    }
}

/**
 * Compares two version strings.
 * @param {string} current - The current version.
 * @param {string} latest - The latest version.
 * @returns {boolean} True if current is outdated compared to latest.
 */
function isOutdated(current, latest) {
    const currentParts = current.split(".").map(Number);
    const latestParts = latest.split(".").map(Number);
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (currentPart < latestPart) return true;
        if (currentPart > latestPart) return false;
    }
    return false;
}

/**
 * Fetches the latest Chrome version for a specific channel.
 * @param {string} channel - The Chrome channel ('stable', 'beta', 'dev', 'canary').
 * @returns {Promise<string|null>} The latest version for the channel or null if failed.
 */
async function fetchLatestVersion(channel = 'stable') {
    const platform = await getChromePlatform();
    if (!platform) {
        console.error("Platform is undefined. Cannot fetch latest version.");
        return null;
    }

    const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/${platform}/channels/${channel}/versions`;

    try {
        console.log(`Fetching latest version for channel: ${channel}`);
        const response = await fetch(url);
        console.log(`Response status for ${channel}:`, response.status);
        if (!response.ok) throw new Error(`Failed to fetch latest Chrome version for channel ${channel}`);
        const data = await response.json();
        console.log(`Latest versions for ${channel}:`, data.versions);
        if (data.versions && Array.isArray(data.versions) && data.versions.length > 0) {
            return data.versions[0].version; // Assuming versions are sorted descending
        }
        throw new Error(`No versions found for channel ${channel}`);
    } catch (error) {
        console.error(`Error fetching latest Chrome version for channel ${channel}:`, error);
        chrome.action.setIcon({ path: "icons/warning-icon16.png" });
        return null;
    }
}

/**
 * Determines the current Chrome channel by comparing the current version with channel versions.
 * @returns {Promise<string|null>} The current channel ('stable', 'beta', 'dev', 'canary') or null if undetermined.
 */
async function getCurrentChannel() {
    const channels = ['canary', 'dev', 'beta', 'stable']; // Ordered from highest to lowest
    const currentVersion = await getCurrentVersion();

    if (!currentVersion) {
        console.error("Unable to determine current Chrome version.");
        return null;
    }

    try {
        for (let channel of channels) {
            const latestVersion = await fetchLatestVersion(channel);
            if (!latestVersion) {
                console.warn(`Latest version for channel ${channel} is unavailable.`);
                continue;
            }

            console.log(`Comparing current version (${currentVersion}) with latest ${channel} version (${latestVersion})`);
            // Compare versions: if current version >= latest version of the channel, assign to that channel
            if (!isOutdated(currentVersion, latestVersion)) {
                console.log(`Current Chrome channel: ${channel}`);
                return channel;
            }
        }

        console.warn("Current Chrome version does not match any known channel.");
        return null;
    } catch (error) {
        console.error("Error determining current Chrome channel:", error);
        return null;
    }
}

export { getCurrentVersion, isOutdated, fetchLatestVersion, getCurrentChannel };