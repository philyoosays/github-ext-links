document.addEventListener('DOMContentLoaded', function () {
  // Get UI elements
  const enabledToggle = document.getElementById('enabled');
  const enabledSwitch = document.getElementById('enabledSwitch');
  const tabGroupingToggle = document.getElementById('tabGrouping');
  const tabGroupingSwitch = document.getElementById('tabGroupingSwitch');
  const statusElement = document.getElementById('status');
  const groupNamingSelect = document.getElementById('groupNamingSelect');

  // Default settings
  const defaultSettings = {
    enabled: true,
    tabGroupingEnabled: true,
    groupNaming: 'url_ext'
  };

  // Load current state
  chrome.storage.sync.get(defaultSettings, function (settings) {
    enabledSwitch.checked = settings.enabled;
    tabGroupingSwitch.checked = settings.tabGroupingEnabled;
    groupNamingSelect.value = settings.groupNaming;
  });

  // Generic function to handle toggle changes
  function handleToggleChange(settingKey, value) {
    // Create an object with the setting to update
    const update = {};
    update[settingKey] = value;

    // Save to storage
    chrome.storage.sync.set(update, function () {
      statusElement.textContent = 'Settings saved!';
      setTimeout(function () {
        statusElement.textContent = '';
      }, 2500);
    });
  }

  // Save state when main toggle changes
  enabledToggle.addEventListener('click', function () {
    enabledSwitch.checked = !enabledSwitch.checked;
    handleToggleChange('enabled', enabledSwitch.checked);
    if (!enabledSwitch.checked) {
      tabGroupingSwitch.checked = enabledSwitch.checked;
      handleToggleChange('tabGroupingEnabled', tabGroupingSwitch.checked);
    }
  });

  // Save state when tab grouping toggle changes
  tabGroupingToggle.addEventListener('click', function () {
    tabGroupingSwitch.checked = !tabGroupingSwitch.checked;
    handleToggleChange('tabGroupingEnabled', tabGroupingSwitch.checked);
  });

  groupNamingSelect.addEventListener('change', function () {
    const selectedValue = groupNamingSelect.value;
    handleToggleChange('groupNaming', selectedValue);
  });
});
