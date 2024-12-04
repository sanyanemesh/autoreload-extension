// Select elements
const urlInput = document.getElementById("url");
const timerInput = document.getElementById("timer");
const toggleTimerCheckbox = document.getElementById("toggle-timer");
const saveButton = document.getElementById("save-settings");

// Load saved settings when popup opens
chrome.storage.local.get(["url", "timer", "timerEnabled"], (data) => {
  urlInput.value = data.url || "";
  timerInput.value = data.timer || 10;
  toggleTimerCheckbox.checked = data.timerEnabled || false;
});

// Save settings when the save button is clicked
saveButton.addEventListener("click", () => {
  const url=  urlInput.value
  const timer = parseInt(timerInput.value, 10)
  const timerEnabled= toggleTimerCheckbox.checked

  chrome.storage.local.set({url, timer, timerEnabled}, () => {
    console.log("Settings saved:", {url, timer, timerEnabled} );
    alert("Settings saved!");
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "closePopup") {
    console.log("Closing popup due to settings change.");
    window.close();
  }
});
