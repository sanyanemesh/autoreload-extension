let intervalId = null; // ID for the reload interval
let url = ""; // User-defined URL or part of URL to match
let AllTabs = [];
let match = null;

// Utility function to calculate a random interval based on the formula
function getRandomizedInterval(baseInterval) {
  const startValue = baseInterval * 0.5;
  const endValue = baseInterval * 1.5;
  return Math.floor(Math.random() * (endValue - startValue + 1) + startValue);
}

// Utility function to start the auto-reload timer
function startAutoReload() {
  chrome.storage.local.get(["timer", "timerEnabled", "url"], (data) => {
    const { timer = 10, timerEnabled, url: savedUrlPart } = data;
    url = savedUrlPart || "";

    if (!timerEnabled) {
      console.log("Auto-reload is disabled via the timer toggle.");
      return;
    }

    if (!match?.id) {
      console.log("No active tab matches the target URL. Cannot start auto-reload.");
      return;
    }

    // Prevent multiple intervals
    if (intervalId) {
      // console.log("Auto-reload is already active. Skipping redundant start.");
      return;
    }

    console.log(`Starting auto-reload for tab ${match?.id} with base interval: ${timer}s.`);

    // Reload function with random interval logic
    const reloadTab = () => {
      const baseInterval = timer * 1000; // Convert seconds to milliseconds
      const randomizedInterval = getRandomizedInterval(baseInterval);

      console.log(`Next reload in ${randomizedInterval}ms.`);

      chrome.tabs.get(match?.id, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          console.log("Error or tab closed. Stopping auto-reload.");
          stopAutoReload();
          return;
        }

        console.log(`Reloading tab ${match?.id} (URL: ${tab.url}).`);
        chrome.tabs.reload(match?.id, {}, () => {
          if (chrome.runtime.lastError) {
            console.error("Error reloading tab:", chrome.runtime.lastError.message);
          } else {
            console.log(`Tab ${match?.id} reloaded successfully.`);
          }
        });
      });

      // Schedule the next reload with the randomized interval
      intervalId = setTimeout(reloadTab, randomizedInterval);
    };

    // Start the first reload immediately
    reloadTab();
  });
}

// Utility function to stop the auto-reload timer and reset settings
function stopAutoReload() {
  if (intervalId) {
    console.log("Stopping auto-reload.");
    clearInterval(intervalId);
    intervalId = null;
    url=""
    match= null
    chrome.storage.local.set({
      timer: 10,
      timerEnabled: false,
      url: "",
    }, () => {
      console.log("Settings reset to defaults.");
    });
  }
}

// Listen for tab updates (e.g., URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(["url"], (data) => {
    url = data.url || "";

    if (url && tab.url?.includes(url)) {
      match = {id: tabId, url: match.url};
      // Auto-reload logic ensures timer starts after matching tab found
      chrome.storage.local.get(["timerEnabled"], (data) => {
        if (data.timerEnabled) {
          startAutoReload();
        }
      });
    }
  });
});

// Handle tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === match?.id) {
    console.log(`Matched tab ${tabId} closed. Stopping auto-reload.`);
    stopAutoReload();
    listAllTabsInWindow()
  }
});

// Handle settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.timerEnabled || changes.timer || changes.url) {
    console.log("Settings changed:", changes);
    url = changes?.url?.newValue;
    listAllTabsInWindow()

    chrome.storage.local.get(["timerEnabled"], (data) => {
      if (data.timerEnabled) {
        startAutoReload();
      } else {
        stopAutoReload();
      }
    });
  } else {
    console.log("nothing changed")
  }
  chrome.runtime.sendMessage({ action: "closePopup" });
});

function listAllTabsInWindow() {
  // Query all tabs in the current window
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if(!match) {
      let tabsArr = []
      tabs.forEach((tab, index) => {
        if(AllTabs.length !== tabs.length) {
          tabsArr.push({id:tab.id, url:tab.url})
          if(index+1 === tabs.length) {
            AllTabs = tabsArr
            console.log("allTabs upd")
          }
        }
        if(url) {
          if(tab.url.includes(url)) {
            match = {id:tab.id, url:tab.url}
            console.log("its a match, set match", match)
          }
        }
      });
      if(!url) {
        chrome.storage.local.set({
          timer: 10,
          timerEnabled: false,
          url: "",
        }, () => {
          console.log("Settings reset to defaults.");
        });
      }
    } else {
      console.log("All tabs arr don't need to upd (quantity the same and match exist)")
    }
  });
}

listAllTabsInWindow()