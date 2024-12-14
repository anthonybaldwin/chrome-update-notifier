async function getChromePlatform() {
    try {
        const response = await fetch('https://versionhistory.googleapis.com/v1/chrome/platforms');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.platforms || !Array.isArray(data.platforms)) {
            throw new Error("Invalid or missing platform data in response");
        }

        const platformMap = new Map(data.platforms.map(p => [p.platformType, p.platformType.toLowerCase()]));

        const userAgentLower = navigator.userAgent.toLowerCase();
        console.log("User agent:", userAgentLower);

        // Sort platformTypes to prioritize those with numbers (e.g., "win64" before "win")
        // Otherwise, randomly, "win" may be matched first, even if "win64" is present (even doing a reverse sort)
        // Or, I'm missing something else that I don't care to spend the time on
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

        for (let i = 0; i < platformTypes.length; i++) {
            const platformType = platformTypes[i];
            const lowerCasePlatform = platformMap.get(platformType);

            if (userAgentLower.includes(lowerCasePlatform)) {
                console.log(
                    `Matched platform: ${lowerCasePlatform}`
                );
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

export async function getCurrentVersion() {
    if (navigator.userAgentData) {
        try {
            const ua = await navigator.userAgentData.getHighEntropyValues(["fullVersionList"]);
            const chromeVersion = ua.fullVersionList.find(item => item.brand === "Google Chrome");
            return chromeVersion ? chromeVersion.version : null;
        } catch (error) {
            console.error("Error getting current version:", error);
            return null;
        }
    } else {
        const match = navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }
}

export function isOutdated(current, latest) {
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

export async function fetchLatestVersion() {
    const platform = await getChromePlatform();
    const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/${platform}/channels/stable/versions`;

    if (!platform) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch latest Chrome version");
        const data = await response.json();
        return data.versions[0].version;
    } catch (error) {
        console.error("Error fetching latest Chrome version:", error);
        return null;
    }
}