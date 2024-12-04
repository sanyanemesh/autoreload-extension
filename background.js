let activeTabId = null; // ID of the matched tab
let intervalId = null; // ID for the reload interval
let targetUrlPart = ""; // User-defined URL or part of URL to match


function getRandomizedInterval(baseInterval) {
  const startValue = baseInterval * 0.5;
  const endValue = baseInterval * 1.5;
  return Math.floor(Math.random() * (endValue - startValue + 1) + startValue);
}


// Utility function to start the auto-reload timer
function startAutoReload() {
  chrome.storage.local.get(["timer", "timerEnabled", "enabled", "targetUrlPart"], (data) => {
    const { timer = 10, timerEnabled, enabled, targetUrlPart: savedUrlPart } = data;
    targetUrlPart = savedUrlPart || "";

    if (!enabled) {
      console.log("Extension is disabled. Auto-reload will not start.");
      return;
    }

    if (!timerEnabled) {
      console.log("Auto-reload is disabled via the timer toggle.");
      return;
    }

    if (!activeTabId) {
      console.log("No active tab matches the target URL. Cannot start auto-reload.");
      return;
    }

    console.log(`Starting auto-reload for tab ${activeTabId} with a ${timer}s interval.`);
    clearInterval(intervalId);
    intervalId = setInterval(() => {
      chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          console.log("Error or tab closed. Stopping auto-reload.");
          stopAutoReload();
          return;
        }

        console.log(`Reloading tab ${activeTabId} (URL: ${tab.url}).`);
        chrome.tabs.reload(activeTabId, {}, () => {
          if (chrome.runtime.lastError) {
            console.error("Error reloading tab:", chrome.runtime.lastError.message);
          } else {
            console.log(`Tab ${activeTabId} reloaded successfully.`);
          }
        });
      });
    }, timer * 1000);
  });
}

// Utility function to stop the auto-reload timer and reset settings
function stopAutoReload() {
  console.log("Stopping auto-reload.");
  clearInterval(intervalId);
  intervalId = null;
  activeTabId = null;

  // Reset settings to defaults
  chrome.storage.local.set({
    enabled: false,
    timer: 10,
    timerEnabled: false,
    targetUrlPart: "",
  }, () => {
    console.log("Settings reset to defaults.");
  });
}

// Listen for tab updates (e.g., URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(["targetUrlPart"], (data) => {
    targetUrlPart = data.targetUrlPart || "";

    if (tab.url?.includes(targetUrlPart)) {
      console.log(`Matched URL on tab ${tabId}: ${tab.url}`);
      activeTabId = tabId;

      // Auto-reload logic ensures timer starts after matching tab found
      chrome.storage.local.get(["enabled", "timerEnabled"], (data) => {
        if (data.enabled && data.timerEnabled) {
          startAutoReload();
        }
      });
    }
  });
});

// Listen for active tab switches
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url?.includes(targetUrlPart)) {
      console.log(`Switched to matched tab ${activeInfo.tabId}: ${tab.url}`);
      activeTabId = activeInfo.tabId;
    } else {
      console.log(`Switched to unmatched tab ${activeInfo.tabId}: ${tab.url}`);
    }
  });
});

// Handle tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    console.log(`Matched tab ${tabId} closed. Stopping auto-reload.`);
    stopAutoReload();
  }
});

// Handle settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.timerEnabled || changes.timer || changes.targetUrlPart) {
    console.log("Settings changed:", changes);
    chrome.storage.local.get(["enabled", "timerEnabled"], (data) => {
      if (data.enabled && data.timerEnabled) {
        startAutoReload();
      } else {
        stopAutoReload();
      }
    });
  }
});
