
const allowedHostnames = [
  'github.com',
  'priceline.atlassian.net',
  'g.codefresh.io',
  'higgins.prod.pcln.com',
  'higgins.dqs.pcln.com',
];

let SETTINGS = {};

(async () => {
  const { _keys } = await chrome.storage.sync.get(['_keys'])
  const savedState = await chrome.storage.sync.get(_keys)
  SETTINGS = { ...savedState };

  const formatted = Object.entries(SETTINGS).reduce((acc, [key, value]) => {
    return { ...acc, [key]: { newValue: value } }
  }, {});
  setStateToDOM(formatted);

  await addGroupNameExample();
  const activeTabs = await chrome.tabs.query({active: true, currentWindow: true});
  checkIfAllowed(activeTabs);
  await determineTabGroupNamesAndAdd(activeTabs);
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Settings changed:', namespace, changes);
  if (namespace !== 'sync') return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    SETTINGS[key] = newValue;
  }
  setStateToDOM(changes);
});

/**
 * External Links
 */

document.getElementById('enabled').addEventListener('click', (e) => {
  const enabledInput = e.target.parentElement.childNodes[1];
  handleDataChange('enabled', !enabledInput.checked, e);
});

/**
 * Auto Clear
 */

document.getElementById('addHostToClearBtn').addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();

  const autoClearHost = e.target.parentElement.childNodes[1];
  const hostToClear = autoClearHost.value;
  console.log('Adding host to clear:', hostToClear);
  if (!hostToClear) return;

  addTabsToClear(hostToClear);
  SETTINGS.hostsToClear = SETTINGS.hostsToClear.split(',').concat(hostToClear).join(',');
  chrome.storage.sync.set({ hostsToClear: SETTINGS.hostsToClear });
});

/**
 * Tab Organization
 */

document.getElementById('tabGrouping').addEventListener('click', (e) => {
  e.preventDefault();
  const enabledInput = document.getElementById('enabledInput');
  if (!enabledInput.checked) {
    setMessage('Please enable the external links first.', 'red');
    return;
  }
  const tabGroupingInput = e.currentTarget.childNodes[1];
  handleDataChange('tabGroupingEnabled', !tabGroupingInput.checked, e);
});

document.getElementById('renameGroupSelect').addEventListener('change', (e) => {
  e.preventDefault();
  const selectedValue = e.target.value;
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTabId = tabs[0].id;
    if (!activeTabId) return;
    chrome.tabGroups.update(tabs[0].groupId, { title: selectedValue, });
  });
});

document.getElementById('groupNamingSelect').addEventListener('change', (e) => {
  e.preventDefault();
  const selectedValue = e.target.value;
  handleDataChange('groupNaming', selectedValue, e);
  addGroupNameExample();
});

document.getElementById('clearNowBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!SETTINGS.autoClear) return;

  console.log('Tabs to clear:', SETTINGS.tabsToClear);

  const tabsToClear = SETTINGS.tabsToClear || [];
  const tabs = await chrome.tabs.query({ url: tabsToClear });

  if (!tabs.length) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Cleared tabs',
      message: 'Found no tabs to clear'
    })
    console.log('Found no tabs to clear');
    return;
  };

  const clearedTabs = []
  for (const tab of tabs) {
    console.log(tab)
    chrome.tabs.remove(tab.id);
    clearedTabs.push(new URL(tab.url).hostname);
  }
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Cleared tabs',
    message: `Cleared ${tabs.length} tabs for ${clearedTabs.join(', ')}`
  })
  console.log('Cleared tabs:', `Cleared ${tabs.length} tabs for ${clearedTabs.join(', ')}`);
})

/**
 * 
 * FUNCTIONS
 * 
 */

async function addGroupNameExample() {
  const nameExampleContainer = document.getElementById('group-name-example');
  nameExampleContainer.innerHTML = '';

  const settings = await chrome.storage.sync.get(['groupNaming']);
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
  let groupTitle = activeTabs[0].url.split('/').slice(-2).join('/');
  if (settings.groupNaming === 'tab_title') {
    groupTitle = activeTabs[0].title.split(/ . /)[0];
  }

  const pTag = document.createElement('p');
  pTag.classList.add('groupName');
  pTag.textContent = 'Example: ' + groupTitle;

  nameExampleContainer.appendChild(pTag);
}

function addTabsToClear(host) {
  const container = document.createElement('div');
  const spanElem = document.createElement('span');
  const deleteButton = document.createElement('button');

  spanElem.textContent = host;
  deleteButton.textContent = 'x';
  deleteButton.classList.add('button-delete');
  deleteButton.addEventListener('click', (e) => amendHostsToClear(e, 'remove', host));

  container.appendChild(deleteButton);
  container.appendChild(spanElem);

  const hostsToClearList = document.getElementById('hostsToClear');
  hostsToClearList.appendChild(container);
}

function amendHostsToClear(e, direction, hostname) {
  if (direction === 'remove') {
    const hostsToClearList = document.getElementById('hostsToClear');
    hostsToClearList.removeChild(e.target.parentElement);
    SETTINGS.hostsToClear = SETTINGS.hostsToClear.split(',').filter(host => host !== hostname).join(',');
    chrome.storage.sync.set({ hostsToClear: SETTINGS.hostsToClear });
  } else {
    addTabsToClear(hostname);
    SETTINGS.hostsToClear = SETTINGS.hostsToClear.split(',').push(hostname).join(',');
    chrome.storage.sync.set({ hostsToClear: SETTINGS.hostsToClear });
  }
}

function checkIfAllowed(activeTabs) {
  const currURL = new URL(activeTabs[0].url);
  const allowedHost = allowedHostnames.includes(currURL.hostname);
  const optionPanel = /chrome-extension:\/\/[a-z]+\/options\.html/.exec(currURL.href);
  const optionGroups = document.querySelectorAll('.option-group');
  // Check if the hostname is allowed
  if (!allowedHost && !optionPanel && false) {
    optionGroups.forEach(container => {
      container.style.display = 'none';
    });
  } else {
    optionGroups.forEach(container => {
      delete container.style.display;
    });
  }
}

async function determineTabGroupNamesAndAdd(activeTabs) {
  const renameGroupContainer = document.getElementById('renameGroup');
  const activeTabGroupId = activeTabs[0].groupId;
  if (Number(activeTabGroupId) <= 0) {
    renameGroupContainer.style.display = 'none';
    return
  };
  delete renameGroupContainer.style.display
  const group = await chrome.tabGroups.get(activeTabGroupId);
  const groupTabs = await chrome.tabs.query({ groupId: activeTabGroupId });
  const groupNames = new Set();
  groupTabs.forEach(tab => {
    console.log(tab.url)
    if (tab.url.startsWith('https://priceline.atlassian.net/')) {
      // Atlassian
      if (tab.url.includes('selectedIssue=')) {
        groupNames.add(new URL(tab.url).searchParams.get('selectedIssue'))
      } else if (tab.url.includes('/servicedesk/')) {
        // https://priceline.atlassian.net/jira/servicedesk/projects/PIPESUP/queues/issue/PIPESUP-8522
        // https://priceline.atlassian.net/servicedesk/customer/portal/2107/PIPESUP-8522
        groupNames.add(tab.url.split('/').slice(-1)[0])
      } else if (tab.url.startsWith('https://priceline.atlassian.net/browse/')) {
        groupNames.add(tab.url.split('/').slice(-1)[0])
      }
    } else if (/higgins\.\w+\.pcln\.com\/project\//.exec(tab.url)) {
      // Higgins
      groupNames.add(tab.url.split('/project/')[1].split('/')[0])
    } else if (/g\.codefresh\.io/.exec(tab.url)) {
      // Codefresh
      // https://g.codefresh.io/2.0/applications-dashboard/cf-gitops/cf-gitops-prod-guse4/bundle-builder.preprod.gnae1.non-pci.standalonerule/current-state/tree
      // ?activeAccountId=61f9b27f150a6b8924f43f3b
      // https://g.codefresh.io/2.0/applications-dashboard/cf-gitops/cf-gitops-nonprod-guse4/genai-svc.qa-a.gnae1.non-pci.primary/current-state/tree?activeAccountId=639ccb979f9e60850651dd8e
      const url = new URL(tab.url)
      const rdAppName = url.searchParams.get('rdAppName')
      const rdName = url.searchParams.get('rdName')
      const resourceName = url.searchParams.get('resourceName')
      const deployName = tab.url.split('/current-state/')[0].split('/').slice(-1)[0]

      if (rdAppName) groupNames.add(rdAppName)
      if (rdName) groupNames.add(rdName)
      if (resourceName) groupNames.add(resourceName)
      groupNames.add(deployName)
    } else {
      groupNames.add(tab.title.split(/ [^\s\w-] /)[0])
      groupNames.add(tab.url.split('/').slice(-2).join('/'))
    }
    console.log([...groupNames])
  })
  if (!groupNames.has(group.title)) {
    groupNames.add(group.title)
    groupNames.delete()
  }
  const renameGroupSelect = document.getElementById('renameGroupSelect');
  groupNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    renameGroupSelect.appendChild(option);
  });
  renameGroupSelect.value = group.title;
}

function handleDataChange(settingKey, value, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  chrome.storage.sync.set({ [settingKey]: value }, () => {
    setMessage('Settings saved!');
  });
}

function insertTabsToClear() {
  SETTINGS.tabsToClear.forEach(addTabsToClear);
}

let timeout
function setMessage(message, color) {
  const statusElement = document.getElementById('status');
  if (timeout) clearTimeout(timeout);
  if (color) statusElement.setAttribute('style', `color: ${color}`);
  else statusElement.removeAttribute('style');
  statusElement.textContent = message;
  timeout = setTimeout(() => {
    statusElement.textContent = '';
    statusElement.removeAttribute('style');
    clearTimeout(timeout);
  }, 2500);
}

function setStateToDOM(changes) {
  console.log('setStateToDOM', changes)
  const enabledInput = document.getElementById('enabledInput');
  const tabGroupingInput = document.getElementById('tabGroupingInput');
  const groupNamingSelect = document.getElementById('groupNamingSelect');
  Object.entries(changes).forEach(([key, { newValue }]) => {
    switch (key) {
      case 'enabled':
        enabledInput.checked = newValue;
        if (newValue) break;
        handleDataChange('tabGroupingEnabled', false);
        break;
      case 'tabGroupingEnabled':
        tabGroupingInput.checked = newValue;
        break;
      case 'groupNaming':
        groupNamingSelect.value = newValue;
        break;
      case 'hostsToClear':
        insertTabsToClear();
        break;
      default:
        break;
    }
  });
}

console.log('popup sees', ENV)
console.log('popup.js loaded', Date.now());
