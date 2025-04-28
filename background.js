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

    handleTabGrouping(sourceTab, newTab.id, settings);
}

async function addToGroup(groupId, newTabId) {
    await chrome.tabs.group({
        tabIds: [newTabId],
        groupId
    });
}

async function createNewGroup(newTabId, sourceTab, settings) {
    const { id, title, url } = sourceTab;

    const groupId = await chrome.tabs.group({
        tabIds: [id, newTabId]
    });

    let groupTitle = url.split('/').slice(-2).join('/');
    if (settings.groupNaming === 'tab_title') {
        groupTitle = title.split(' · ')[0];
    }

    // Color the group based on the domain
    await chrome.tabGroups.update(groupId, {
        color: "blue",
        title: groupTitle
    });
}

async function handleTabGrouping(sourceTab, newTabId, settings) {
    if (!settings.tabGroupingEnabled) return;

    try {
        const groupId = sourceTab.groupId;
        if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            addToGroup(groupId, newTabId);
        } else {
            createNewGroup(newTabId, sourceTab, settings);
        }
    } catch (error) {
        console.error("Error grouping tabs:", error);
    }
}
