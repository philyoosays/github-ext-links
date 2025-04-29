// Store tab group mappings
let tabGroupMappings = {};

// Default settings
const defaultSettings = {
    enabled: true,
    tabGroupingEnabled: true,
    groupNaming: 'url_ext'
};

// Load settings
chrome.storage.sync.get(defaultSettings, function (settings) {
    // Initialize with stored settings
});

// Listen for settings changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'sync') {
        // Update local settings when storage changes
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openExternalLink") {
        handleExternalLink(message.url, sender.tab);
        sendResponse({ success: true });
        return true;
    }
});

// Function to handle opening external links
async function handleExternalLink(url, sourceTab) {
    // Get current settings
    const settings = await chrome.storage.sync.get(defaultSettings);
    if (!settings.enabled) return;

    const newTab = await chrome.tabs.create({ url, active: true });

    handleTabGrouping(sourceTab, newTab, settings);
}

async function addToGroup(groupId, newTabId) {
    await chrome.tabs.group({
        tabIds: [newTabId],
        groupId
    });
}

async function createNewGroup(newTab, sourceTab, settings) {
    const { id, title, url } = sourceTab;

    const groupId = await chrome.tabs.group({
        tabIds: [id, newTab.id]
    });

    const sourceUrlIsGithub = new URL(url).hostname === 'github.com';
    const newUrlIsGithub = new URL(newTab.pendingUrl).hostname === 'github.com';

    let parsedUrl = url;
    let parsedTitle = title;
    if (!sourceUrlIsGithub && newUrlIsGithub) {
        parsedUrl = newTab.pendingUrl;
        parsedTitle = newTab.title;
    }

    let groupTitle = parsedUrl.split('/').slice(-2).join('/');
    if (settings.groupNaming === 'tab_title') {
        groupTitle = parsedTitle.split(' · ')[0];
    }

    // Color the group based on the domain
    await chrome.tabGroups.update(groupId, {
        color: "blue",
        title: groupTitle
    });
}

async function handleTabGrouping(sourceTab, newTab, settings) {
    if (!settings.tabGroupingEnabled) return;

    try {
        const groupId = sourceTab.groupId;
        if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            addToGroup(groupId, newTab.id);
        } else {
            createNewGroup(newTab, sourceTab, settings);
        }
    } catch (error) {
        console.error("Error grouping tabs:", error);
    }
}

function setGroupNameWithPriority(sourceTab, newTab, settings) {
    const sourceUrlIsGithub = new URL(sourceTab.url).hostname === 'github.com';
    const newUrlIsGithub = new URL(newTab.pendingUrl).hostname === 'github.com';

    let parsedUrl = url;
    let parsedTitle = title;
    if (!sourceUrlIsGithub && newUrlIsGithub) {
        parsedUrl = newTab.pendingUrl;
        parsedTitle = newTab.title;
    }

    let groupTitle = parsedUrl.split('/').slice(-2).join('/');
    if (settings.groupNaming === 'tab_title') {
        groupTitle = parsedTitle.split(' · ')[0];
    }
}

console.log("Background script loaded.");
