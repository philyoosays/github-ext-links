
// Get UI elements
const enabledToggle = document.getElementById('enabled');
const enabledSwitch = document.getElementById('enabledSwitch');
const tabGroupingToggle = document.getElementById('tabGrouping');
const tabGroupingSwitch = document.getElementById('tabGroupingSwitch');
const statusElement = document.getElementById('status');
const groupNamingSelect = document.getElementById('groupNamingSelect');

addGroupNameExample();

// Default settings
const defaultSettings = {
  enabled: true,
  tabGroupingEnabled: true,
  groupNaming: 'url_ext',
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
  addGroupNameExample();
});




async function addGroupNameExample() {
  const nameExampleContainer = document.getElementById('group-name-example');
  nameExampleContainer.innerHTML = '';

  const settings = await chrome.storage.sync.get({ groupNaming: true });
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  let groupTitle = tabs[0].url.split('/').slice(-2).join('/');
  if (settings.groupNaming === 'tab_title') {
    groupTitle = tabs[0].title.split(/ . /)[0];
  }

  const pTag = document.createElement('p');
  pTag.classList.add('groupName');
  pTag.textContent = 'Example: ' + groupTitle;

  nameExampleContainer.appendChild(pTag);
}

console.log('popup.js executed');
