// Store tab group mappings
let tabGroupMappings = {};

// Default settings
const defaultSettings = {
    enabled: true,
    tabGroupingEnabled: true
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
        handleExternalLink(message.url, sender.tab.id);
        sendResponse({ success: true });
        return true;
    }
});

// Function to handle opening external links
async function handleExternalLink(url, sourceTabId) {
    // Get current settings
    const settings = await chrome.storage.sync.get(defaultSettings);

    if (!settings.enabled) return;

    // Create the new tab
    const newTab = await chrome.tabs.create({
        url: url,
        active: true
    });

    if (!settings.tabGroupingEnabled) return;
    
    try {
        // Get info about the source tab
        const sourceTab = await chrome.tabs.get(sourceTabId);

        // If source tab is in a group, add new tab to that group
        if (sourceTab.groupId && sourceTab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            await chrome.tabs.group({
                tabIds: [newTab.id],
                groupId: sourceTab.groupId
            });
        }
        // If source tab is not in a group, create a new group
        else {
            const groupId = await chrome.tabs.group({
                tabIds: [sourceTabId, newTab.id]
            });

            // Color the group based on the domain
            await chrome.tabGroups.update(groupId, {
                color: "blue",
                title: "GitHub Links"
            });
        }
    } catch (error) {
        console.error("Error grouping tabs:", error);
    }
}
