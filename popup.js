document.addEventListener('DOMContentLoaded', function () {
  const enabledToggle = document.getElementById('enabled');
  const enabledSwitch = document.getElementById('enabledSwitch');
  const statusElement = document.getElementById('status');

  // Load current state
  chrome.storage.sync.get({ enabled: true }, function (items) {
    enabledSwitch.checked = items.enabled;
  });

  // Save state when toggle changes
  enabledToggle.addEventListener('click', function () {
    const isEnabled = !enabledSwitch.checked;

    chrome.storage.sync.set({ enabled: isEnabled }, function () {
      statusElement.textContent = 'Settings saved!';
      chrome.storage.sync.get({ enabled: true }, function (items) {
        enabledSwitch.checked = items.enabled;
      });
      setTimeout(function () {
        statusElement.textContent = '';
      }, 1500);
    });
  });
});
