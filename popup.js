document.addEventListener('DOMContentLoaded', function () {
  // Get UI elements
  const enabledToggle = document.getElementById('enabled');
  const enabledSwitch = document.getElementById('enabledSwitch');
  const tabGroupingToggle = document.getElementById('tabGrouping');
  const tabGroupingSwitch = document.getElementById('tabGroupingSwitch');
  const statusElement = document.getElementById('status');

  // Default settings
  const defaultSettings = {
    enabled: true,
    tabGroupingEnabled: true
  };

  // Load current state
  chrome.storage.sync.get(defaultSettings, function (settings) {
    enabledSwitch.checked = settings.enabled;
    tabGroupingSwitch.checked = settings.tabGroupingEnabled;
  });

  // Generic function to handle toggle changes
  function handleToggleChange(settingKey, switchElement) {
    const isEnabled = switchElement.checked;
    
    // Create an object with the setting to update
    const update = {};
    update[settingKey] = isEnabled;
    
    // Save to storage
    chrome.storage.sync.set(update, function () {
      statusElement.textContent = 'Settings saved!';
      setTimeout(function () {
        statusElement.textContent = '';
      }, 1500);
    });
  }

  // Save state when main toggle changes
  enabledToggle.addEventListener('click', function () {
    enabledSwitch.checked = !enabledSwitch.checked;
    handleToggleChange('enabled', enabledSwitch);
  });

  // Save state when tab grouping toggle changes
  tabGroupingToggle.addEventListener('click', function () {
    tabGroupingSwitch.checked = !tabGroupingSwitch.checked;
    handleToggleChange('tabGroupingEnabled', tabGroupingSwitch);
  });
});
