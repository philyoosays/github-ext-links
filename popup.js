
// Get UI elements
const enabledToggle = document.getElementById('enabled');
const enabledSwitch = document.getElementById('enabledSwitch');
const tabGroupingToggle = document.getElementById('tabGrouping');
const tabGroupingSwitch = document.getElementById('tabGroupingSwitch');
const statusElement = document.getElementById('status');
const groupNamingSelect = document.getElementById('groupNamingSelect');
const renameGroupSelect = document.getElementById('renameGroupSelect');
const renameGroupContainer = document.getElementById('renameGroup');
const optionGroups = document.querySelectorAll('.option-group');

const allowedHostnames = [
  'github.com',
  'priceline.atlassian.net',
  'g.codefresh.io',
  'higgins.prod.pcln.com',
  'higgins.dqs.pcln.com',
];

const namingContainer = document.getElementById('naming');

addGroupNameExample();

// Default settings
const defaultSettings = {
  enabled: true,
  tabGroupingEnabled: true,
  groupNaming: 'url_ext',
};

chrome.tabs.query({active: true, currentWindow: true}, async function(activeTabs) {
  // Check if the hostname is allowed
  if (!allowedHostnames.includes(new URL(activeTabs[0].url).hostname)) {
    optionGroups.forEach(container => {
      container.style.display = 'none';
    });
  } else {
    optionGroups.forEach(container => {
      delete container.style.display;
    });
  }
});

chrome.tabs.query({active: true, currentWindow: true}, async function(activeTabs) {
  const activeTabGroupId = activeTabs[0].groupId;
  if (activeTabGroupId <= 0) {
    renameGroupContainer.style.display = 'none';
    return
  };
  delete renameGroupContainer.style.display
  const group = await chrome.tabGroups.get(activeTabGroupId);
  const groupTabs = await chrome.tabs.query({ groupId: activeTabGroupId });
  const groupNames = [];
  groupTabs.forEach(tab => {
    if (tab.url.startsWith('https://priceline.atlassian.net/')) {
      // Atlassian
      if (tab.url.includes('selectedIssue=')) {
        groupNames.push(new URL(tab.url).searchParams.get('selectedIssue'))
      } else if (tab.url.startsWith('https://priceline.atlassian.net/jira/servicedesk')) {
        // https://priceline.atlassian.net/jira/servicedesk/projects/PIPESUP/queues/issue/PIPESUP-8522
        groupNames.push(tab.url.slice(-1)[0])
        // groupNames.push(tab.url.split('/issue/').slice(-1)[0])
      } else if (tab.url.startsWith('https://priceline.atlassian.net/servicedesk')) {
        // https://priceline.atlassian.net/servicedesk/customer/portal/2107/PIPESUP-8522
        groupNames.push(tab.url.split('/').slice(-1)[0])
      } else if (tab.url.startsWith('https://priceline.atlassian.net/browse/')) {
        groupNames.push(tab.url.split('/').slice(-1)[0])
      }
    } else if (/higgins\.[\w]+\.pcln\.com\/project\//.exec(tab.url)) {
      // Higgins
      groupNames.push(tab.url.split('/project/')[1].split('/')[0])

    } else {
      groupNames.push(tab.title.split(/ [^\s\w-] /)[0])
      groupNames.push(tab.url.split('/').slice(-2).join('/'))
    }
  })
  if (!groupNames.includes(group.title)) {
    groupNames.unshift(group.title)
  }
  groupNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    renameGroupSelect.appendChild(option);
  });
  renameGroupSelect.value = group.title;

});

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

renameGroupSelect.addEventListener('change', function () {
  const selectedValue = renameGroupSelect.value;
  
  chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
    const activeTabId = tabs[0].id;
    if (!activeTabId) return;
    chrome.tabGroups.update(tabs[0].groupId, { title: selectedValue, });
  });
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
