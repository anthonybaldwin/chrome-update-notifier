import { getCurrentVersion, getCurrentChannel, fetchLatestVersion, isOutdated } from './version-utils.js';

// Save data to local storage
async function saveToCache(key, data) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: data }, resolve);
    });
}

// Fetch cached data from local storage
async function getCachedData(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key] || null);
        });
    });
}

async function updateVersionCache() {
    try {
        const currentVersion = await getCurrentVersion();
        const currentChannel = await getCurrentChannel();
        const latestVersion = await fetchLatestVersion(currentChannel);

        if (currentVersion && currentChannel && latestVersion) {
            const outdated = isOutdated(currentVersion, latestVersion);
            const cacheData = {
                currentVersion,
                currentChannel,
                latestVersion,
                lastUpdated: new Date().toLocaleString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZoneName: 'short',
                    hour12: false
                }),
                isOutdated: outdated,
                timestamp: Date.now(),
            };
            await saveToCache('versionInfo', cacheData);
            return cacheData; // Return updated data for immediate use
        } else {
            console.error("Failed to fetch version information.");
            return null;
        }
    } catch (error) {
        console.error("Error updating version cache:", error);
        return null;
    }
}

/**
 * Displays a Chrome notification with instructions to update Chrome.
 * @param {string} title - The notification title.
 * @param {string} message - The notification message.
 */
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/warning-icon48.png',
        title: title,
        message: message,
        priority: 2
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error(`Error creating notification: ${chrome.runtime.lastError.message}`);
        } else {
            console.log(`Notification created with ID: ${notificationId}`);
        }
    });
}

/**
 * Update the extension icon based on browser version status.
 * @param {*} isOutdated 
 * @param {*} currentChannel 
 * @param {*} latestVersion 
 */
function updateBrowserStatusIcon(isOutdated, currentChannel, latestVersion) {
    const iconPath = isOutdated ? "icons/warning-icon16.png" : "icons/normal-icon16.png";
    const badgeText = isOutdated ? "Upd." : "";
    const badgeColor = isOutdated ? "yellow" : "";
    const title = isOutdated
        ? `Update Chrome (${capitalize(currentChannel)}) to version ${latestVersion}.`
        : `Chrome (${capitalize(currentChannel)}) is up-to-date.`;

    chrome.action.setIcon({ path: iconPath });
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    chrome.action.setTitle({ title: title });
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export { saveToCache, getCachedData, updateVersionCache, showNotification, updateBrowserStatusIcon, capitalize };