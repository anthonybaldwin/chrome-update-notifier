import { updateVersionCache, showNotification } from './ext-utils.js';
import { capitalize } from './string-utils.js';

const CHECK_INTERVAL_MINUTES = 60; // TODO: Make this configurable via settings

/**
 * Checks the current Chrome version against the latest version of its channel and updates the extension icon.
 */
async function checkAndUpdateIcon() {
    try {
        console.log("Checking Chrome version...");

        const cacheData = await updateVersionCache(); // Update cache and get data
        if (!cacheData) {
            chrome.action.setIcon({ path: "icons/warning-icon16.png" });
            chrome.action.setBadgeText({ text: "!" });
            chrome.action.setTitle({ title: "Failed to fetch version information." });
            return;
        }

        const { currentChannel, latestVersion, isOutdated } = cacheData;

        chrome.action.setIcon({
            path: isOutdated ? "icons/warning-icon16.png" : "icons/normal-icon16.png"
        });
        chrome.action.setBadgeText({ text: isOutdated ? "Upd." : "" });
        chrome.action.setBadgeBackgroundColor({ color: "yellow" });
        chrome.action.setTitle({
            title: isOutdated
                ? `Update Chrome (${capitalize(currentChannel)}) to version ${latestVersion}.`
                : `Chrome (${capitalize(currentChannel)}) is up-to-date.`
        });

        if (isOutdated) {
            showNotification(
                "Chrome Update Available",
                `Your browser is outdated. Update to version ${latestVersion}.`
            );
        }
    } catch (error) {
        console.error("Error in checkAndUpdateIcon:", error);
    }
}

// Initial check when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated. Setting up alarms.");
    chrome.alarms.create("checkVersion", { periodInMinutes: CHECK_INTERVAL_MINUTES });
    checkAndUpdateIcon();
});

// Periodic checks based on the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkVersion") {
        console.log("Alarm triggered: checkVersion");
        checkAndUpdateIcon();
    }
});

// Listen for messages from other parts of the extension (e.g., popup.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkVersionNow") {
        console.log("Received message to check version now.");
        checkAndUpdateIcon().then(() => {
            sendResponse({ status: "Version check completed." });
        }).catch((error) => {
            sendResponse({ status: "Version check failed.", error: error.message });
        });
        // Keep the message channel open for sendResponse
        return true;
    }
});
