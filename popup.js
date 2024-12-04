document.addEventListener("DOMContentLoaded", () => {
  const extensionToggle = document.getElementById("extensionToggle");
  const timerInput = document.getElementById("timerInput");
  const timerToggle = document.getElementById("timerToggle");
  const targetUrlInput = document.getElementById("targetUrlInput");
  const saveButton = document.getElementById("saveButton");

  // Load saved settings or use defaults
  chrome.storage.local.get(["enabled", "timer", "timerEnabled", "targetUrlPart"], (data) => {
    console.log("Loaded settings:", data);
    extensionToggle.checked = data.enabled ?? false;
    timerInput.value = data.timer ?? 10;
    timerToggle.checked = data.timerEnabled ?? false;
    targetUrlInput.value = data.targetUrlPart ?? "";
  });

  // Save settings
  saveButton.addEventListener("click", () => {
    const enabled = extensionToggle.checked;
    const timer = parseInt(timerInput.value, 10) || 10;
    const timerEnabled = timerToggle.checked;
    const targetUrlPart = targetUrlInput.value.trim();

    chrome.storage.local.set({ enabled, timer, timerEnabled, targetUrlPart }, () => {
      console.log("Settings saved:", { enabled, timer, timerEnabled, targetUrlPart });
      alert("Settings saved!");
    });
  });
});
