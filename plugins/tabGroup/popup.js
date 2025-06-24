
const allowedHostnames = [
  'github.com',
  'priceline.atlassian.net',
  'g.codefresh.io',
  'higgins.prod.pcln.com',
  'higgins.dqs.pcln.com',
];

(async () => {
    await addCategory('Tab Grouping', 'plugins/tabGroup', { priority: 15 });
    await loadState({
        tabGrouping: true,
        tabGroupNaming: 'url_ext',
    })

    const tabGroupingInput = document.getElementById('tabGroupingInput')
    tabGroupingInput.checked = STATE.tabGrouping;

    await addGroupNameExample()
    const activeTabs = await chrome.tabs.query({active: true, currentWindow: true});
    checkIfAllowed(activeTabs);
    await determineTabGroupNamesAndAdd(activeTabs);

    document.getElementById('tabGrouping').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ tabGrouping: !enabledInput.checked })
        .then(() => enabledInput.checked = !enabledInput.checked)
    });
    
    document.getElementById('tabGroup-rename-select').addEventListener('change', (e) => {
        e.preventDefault();
        const selectedValue = e.target.value;
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTabId = tabs[0].id;
            if (!activeTabId) return;
            chrome.tabGroups.update(tabs[0].groupId, { title: selectedValue, });
        });
    });
    
    document.getElementById('tabGroupNaming').addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        chrome.storage.sync.set({ tabGroupNaming: selectedValue })
        .then(() => addGroupNameExample())
    });
})();

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

function checkIfAllowed(activeTabs) {
    const currURL = new URL(activeTabs[0].url);
    const allowedHost = allowedHostnames.includes(currURL.hostname);
    const optionPanel = /chrome-extension:\/\/[a-z]+\/options\.html/.exec(currURL.href);
    const optionGroups = document.querySelectorAll('.option');
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
    const renameGroupContainer = document.getElementById('tabGroup-rename');
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
    const renameGroupSelect = document.getElementById('tabGroup-rename-select');
    groupNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        renameGroupSelect.appendChild(option);
    });
    renameGroupSelect.value = group.title;
}
