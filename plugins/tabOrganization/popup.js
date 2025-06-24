
(async () => {
    await addCategory('Tab Organization', 'plugins/tabOrganization', { priority: 10 });
    await loadState({
        tabsToClear: [
            'https://priceline.gpcloudservice.com/*',
            'https://priceline.zoom.us/j/*',
            'https://cloud.google.com/sdk/auth_success',
            'https://awscpass.booking.com/*',
        ],
    })

    document.getElementById('clearNowBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Tabs to clear:', STATE.tabsToClear);
    
        const tabsToClear = STATE.tabsToClear || [];
        const tabs = await chrome.tabs.query({ url: tabsToClear });
    
        if (!tabs.length) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Clean Up Tabs',
                message: 'Found no tabs to clear'
            })
            console.log('Found no tabs to clear');
            return;
        };
    
        const clearedTabs = new Map()
        for (const tab of tabs) {
            chrome.tabs.remove(tab.id);
            const { hostname } = new URL(tab.url)
            if (!clearedTabs.has(hostname)) {
                clearedTabs.set(hostname, 0)
            }
            const count = clearedTabs.get(hostname)
            clearedTabs.set(new URL(tab.url).hostname, count + 1)
        }

        const clearedTabsRendered = Array.from(clearedTabs.entries()).map(([key, value]) => (
            `${key} (${value})`
        )).join(', ');

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Clean Up Tabs',
            message: `Cleared tabs for ${clearedTabsRendered}`
        })
        console.log('Cleared tabs:', `Cleared tabs for ${clearedTabsRendered}`);
    })
})()
