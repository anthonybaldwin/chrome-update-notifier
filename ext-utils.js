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
                lastUpdated: new Date().toLocaleString(),
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

export { saveToCache, getCachedData, updateVersionCache, showNotification };