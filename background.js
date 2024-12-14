import { getCurrentVersion, isOutdated, fetchLatestVersion } from './version-utils.js';

const CHECK_INTERVAL_MINUTES = 60; // TODO setting in popup.html (or settings page)

async function checkAndUpdateIcon() {
  const currentVersion = await getCurrentVersion();
  const latestVersion = await fetchLatestVersion();

  if (!currentVersion || !latestVersion) return;

  const outdated = isOutdated(currentVersion, latestVersion);
  chrome.action.setIcon({
    path: outdated
      ? "icons/warning-icon16.png"
      : "icons/normal-icon16.png"
  });

  console.log(
    `Current: ${currentVersion}, Latest: ${latestVersion}, Outdated: ${outdated}`
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("checkVersion", { periodInMinutes: CHECK_INTERVAL_MINUTES });
  checkAndUpdateIcon();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkVersion") {
    checkAndUpdateIcon();
  }
});