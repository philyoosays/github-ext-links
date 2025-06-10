let tabGroupMappings = {};

let settings = {
    enabled: true,
    autoClear: true,
    autoClearInterval: 10,
    tabGroupingEnabled: true,
    groupNaming: 'url_ext',
    hostsToClear: 'https://priceline.zoom.us/j/*',
    tabsToClear: [
        'https://priceline.gpcloudservice.com/*',
        'https://priceline.zoom.us/j/*',
        'https://cloud.google.com/sdk/auth_success',
        'https://awscpass.booking.com/*',
    ],
};
settings._keys = Object.keys(settings);

(async () => {
    console.log('starting background')
    // Load current state
    chrome.storage.sync.clear();
    const savedState = await chrome.storage.sync.get(settings._keys)
    console.log('Saved state:', savedState)
    if (Object.keys(savedState).length !== Object.keys(settings).length) {
        await chrome.storage.sync.set(settings)
    } else {
        await chrome.storage.sync.set(settings)
        settings = { ...savedState };
    }
    console.log('Background settings loaded:', Date.now(), settings);
})();

// Listen for settings changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace !== 'sync') return
    Object.entries(changes).forEach(([key, { newValue }]) => {
        settings[key] = newValue;
    });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    switch (message.action) {
        case 'openExternalLink':
            handleExternalLink(message.url, sender.tab);
            sendResponse({ success: true });
            break;
        case 'groupTabToSource':
            handleGroupTabToSource(message.url, sender.tab);
            break;
        default:
            console.log('Unknown message:', message);
            break;
    }
});



setInterval(async () => {
    if (!settings.autoClear) return;

    const tabsToClear = settings.tabsToClear || [];
    const tabs = await chrome.tabs.query({ url: tabsToClear });
    // if (!tabs.length) return;
    if (!tabs.length) {
        chrome.notifications.create({
            type: 'basic',
            // iconUrl: 'icons/icon48.png',
            title: 'Cleared tabs',
            message: 'Found no tabs to clear'
        })
        console.log('Found no tabs to clear');
        return;
    };

    for (const tab of tabs) {
        chrome.tabs.remove(tab.id);
    }
    chrome.notifications.create({
        type: 'basic',
        // iconUrl: 'icons/icon48.png',
        title: 'Cleared tabs',
        message: `Cleared ${tabs.length} tabs for ${tabsToClear.join(', ')}`
    })
    console.log('Cleared tabs:', `Cleared ${tabs.length} tabs for ${tabsToClear.join(', ')}`);
}, 60000 * 5);



/**
 * Functions
 */

// Function to handle opening external links
async function handleExternalLink(url, sourceTab) {
    // Get current settings
    // const settings = await chrome.storage.sync.get(settings);
    console.log('handleExternalLink', settings, url, sourceTab)
    if (!settings.enabled) return;
    const newTab = await chrome.tabs.create({ url, active: true });
    handleTabGrouping(sourceTab, newTab);
}

async function handleGroupTabToSource(url, sourceTab) {
    console.log('handleGroupTabToSource', url, sourceTab)
    const matchingTabs = await poll(
        async () => await chrome.tabs.query({ url }),
        (res) => Boolean(res.length)
    );
    console.log('Matching tabs', matchingTabs)

    
    if (!matchingTabs.length) return;
    const newestTab = matchingTabs.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
    console.log('Newest tab', newestTab)
    handleTabGrouping(sourceTab, newestTab);
}

async function poll(callback, condition) {
    let complete = false;
    let retries = 0;
    let res = [];
    while (!complete && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 250));
        res = await callback();
        if (condition(res)) complete = true;
        retries++;
    }
    return res
}

function addToGroup(groupId, newTabId) {
    chrome.tabs.group({ groupId, tabIds: [newTabId] });
}

async function createNewGroup(newTab, sourceTab, settings) {
    try {
        const { id, title, url } = sourceTab;

        console.log('createNewGroup', newTab, sourceTab, settings)

        const groupId = await chrome.tabs.group({
            tabIds: [id, newTab.id]
        });

        console.log('url', url)
        console.log('newTab', newTab)
        console.log('sourceTab', sourceTab)
        console.log('newTab pending', newTab.pendingUrl)
        console.log('sourceTab url', sourceTab.url)

        const sourceUrlIsGithub = new URL(url).hostname === 'github.com';
        const sourceUrlIsJira = new URL(sourceTab.url).hostname === 'priceline.atlassian.net';

        const newTabUrl = new URL(newTab.pendingUrl ?? newTab.url);
        const newUrlIsGithub = newTabUrl.hostname === 'github.com';
        const newUrlIsJira = newTabUrl.hostname === 'priceline.atlassian.net';

        let parsedUrl = url;
        let parsedTitle = title;
        if (!sourceUrlIsGithub && newUrlIsGithub) {
            parsedUrl = newTab.pendingUrl ?? newTabUrl.href;
            parsedTitle = newTab.title;
        }

        console.log('sourceUrlIsGithub', sourceUrlIsGithub)
        console.log('newUrlIsGithub', newUrlIsGithub)
        console.log('sourceUrlIsJira', sourceUrlIsJira)
        console.log('newUrlIsJira', newUrlIsJira)
        console.log('parsedUrl', parsedUrl)
        console.log('parsedTitle', parsedTitle)
        
        let groupTitle = parsedUrl.split('/').slice(-2).join('/');
        if (settings.groupNaming === 'tab_title') {
            groupTitle = parsedTitle.split(/ [^\s\w-] /)[0];
        }

        console.log('groupTitle before', groupTitle)

        if (sourceUrlIsJira || newUrlIsJira) {
            parsedUrl = sourceUrlIsJira ? sourceTab.url : newTab.pendingUrl ?? newTabUrl.href
            console.log('is jira parsedUrl', parsedUrl)
            if (parsedUrl.includes('selectedIssue=')) {
                groupTitle = new URL(parsedUrl).searchParams.get('selectedIssue');
            } else if (parsedUrl.startsWith('https://priceline.atlassian.net/browse/')) {
                groupTitle = parsedUrl.split('/').slice(-1)[0];
            } else if (parsedUrl.includes('/servicedesk/')) {
                groupTitle = parsedUrl.split('/').slice(-1)[0];
            } else if (/issue\/[A-Z]+-\d+/.exec(groupTitle)) {
                groupTitle = groupTitle.split('/')[1];
            }
        }

        console.log('groupTitle after', groupTitle)

        // Color the group based on the domain
        await chrome.tabGroups.update(groupId, {
            color: getRandomColor(),
            title: groupTitle
        });
    } catch (error) {
        console.error('Error creating new group:', error);
    }
}

async function handleTabGrouping(sourceTab, newTab) {
    if (!settings.tabGroupingEnabled) return;

    try {
        const groupId = sourceTab.groupId;
        console.log('sourceTab', sourceTab.groupId, sourceTab)
        if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            addToGroup(groupId, newTab.id);
        } else {
            await createNewGroup(newTab, sourceTab, settings);
        }
    } catch (error) {
        console.error("Error grouping tabs:", error);
    }
}

function getRandomColor() {
    const tabColors = [ 'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', ]
    return tabColors[Math.floor(Math.random() * tabColors.length)];
}

// function setGroupNameWithPriority(sourceTab, newTab, settings) {
//     const priorities = [
//         {
//             hostname: 'priceline.atlassian.net',
//             parser: () => {
//                 const sourceIsJira = new URL(sourceTab.url).hostname === 'priceline.atlassian.net';
//                 const newIsJira = new URL(newTab.url).hostname === 'priceline.atlassian.net';
//                 if (sourceIsJira) {
                    
//                 }
//             }
//         }
//     ]

//     const sourceUrlIsJira = new URL(sourceTab.url).hostname === 'priceline.atlassian.net';
//     const newUrlIsJira = new URL(newTab.pendingUrl).hostname === 'priceline.atlassian.net';
//     const sourceUrlIsGithub = new URL(sourceTab.url).hostname === 'github.com';
//     const newUrlIsGithub = new URL(newTab.pendingUrl).hostname === 'github.com';

//     let parsedUrl = sourceTab.url;
//     let parsedTitle = sourceTab.title;
//     if (!sourceUrlIsGithub && newUrlIsGithub) {
//         parsedUrl = newTab.pendingUrl;
//         parsedTitle = newTab.title;
//     }

//     let groupTitle = parsedUrl.split('/').slice(-2).join('/');
//     if (settings.groupNaming === 'tab_title') {
//         groupTitle = parsedTitle.split(' · ')[0];
//     }

//     return groupTitle;
// }

console.log("Background script loaded.", Date.now());
