// Adjust based on user's OS
const PLATFORM = "win64"; // Adjust based on platform: https://versionhistory.googleapis.com/v1/chrome/platforms //TODO

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
  