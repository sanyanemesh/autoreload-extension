let intervalId = null;
let url = "";
let AllTabs = [];
let match = null;

function getRandomizedInterval(baseInterval) {
  const startValue = baseInterval * 0.5;
  const endValue = baseInterval * 1.5;
  return Math.floor(Math.random() * (endValue - startValue + 1) + startValue);
}

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

    if (intervalId) {
      return;
    }

    const reloadTab = () => {
      const baseInterval = timer * 1000;
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
      intervalId = setTimeout(reloadTab, randomizedInterval);
    };
    reloadTab();
  });
}

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
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(["url"], (data) => {
    url = data.url || "";

    if (url && tab.url?.includes(url)) {
      match = {id: tabId, url: match.url};
      chrome.storage.local.get(["timerEnabled"], (data) => {
        if (data.timerEnabled) {
          startAutoReload();
        }
      });
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === match?.id) {
    console.log(`Matched tab ${tabId} closed. Stopping auto-reload.`);
    stopAutoReload();
    listAllTabsInWindow()
  }
});

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
  }
  chrome.runtime.sendMessage({ action: "closePopup" });
});

function listAllTabsInWindow() {
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