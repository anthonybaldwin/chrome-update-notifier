const CHECK_INTERVAL_MINUTES = 60; // Check every hour
const PLATFORM = "win64"; // Adjust based on platform: https://versionhistory.googleapis.com/v1/chrome/platforms //TODO

async function fetchLatestVersion() {
  const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/${PLATFORM}/channels/stable/versions`;
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

async function getCurrentVersion() {
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

async function checkAndUpdateIcon() {
  const currentVersion = await getCurrentVersion();
  const latestVersion = await fetchLatestVersion();

  if (!currentVersion || !latestVersion) return;

  const outdated = isOutdated(currentVersion, latestVersion);
  chrome.action.setIcon({
    path: outdated
      ? "icons/warning-icon16.png" // Warning icon
      : "icons/normal-icon16.png" // Normal icon
  });

  console.log(
    `Current: ${currentVersion}, Latest: ${latestVersion}, Outdated: ${outdated}`
  );
}

// Set up periodic checks
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("checkVersion", { periodInMinutes: CHECK_INTERVAL_MINUTES });
  checkAndUpdateIcon();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkVersion") {
    checkAndUpdateIcon();
  }
});
