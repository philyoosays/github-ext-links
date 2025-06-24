

ON_MESSAGE.openExternalLink = async (message, sender, sendResponse) => {
    if (message.action !== 'openExternalLink') return
    handleExternalLink(message.url, sender.tab);
    sendResponse({ success: true });
};

async function handleExternalLink(url, sourceTab) {
    // Get current settings
    const settings = await chrome.storage.sync.get([ 'githubExtLinks' ]);
    console.log('handleExternalLink', settings, url, sourceTab)
    if (!settings.githubExtLinks) return;
    const newTab = await chrome.tabs.create({ url, active: true });
    console.log('GLOBAL', GLOBAL)
    GLOBAL.handleTabGrouping(sourceTab, newTab);
}

console.log('Plugin: Github background loaded');
