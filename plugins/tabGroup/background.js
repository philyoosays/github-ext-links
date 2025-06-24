
ON_MESSAGE.groupTabToSource = async (message, sender, sendResponse) => {
    if (!message.action !== 'groupTabToSource') return
    handleGroupTabToSource(message.url, sender.tab);
};

function addToGroup(groupId, newTabId) {
    chrome.tabs.group({ groupId, tabIds: [newTabId] });
}

async function createNewGroup(newTab, sourceTab) {
    try {
        const { id, title, url } = sourceTab;

        console.log('createNewGroup', newTab, sourceTab, STATE)

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
        if (STATE.groupNaming === 'tab_title') {
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

function getRandomColor() {
    const tabColors = [ 'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange', ]
    return tabColors[Math.floor(Math.random() * tabColors.length)];
}

async function handleGroupTabToSource(url, sourceTab) {
    if (!STATE.tabGrouping) return;
    const matchingTabs = await poll(
        async () => await chrome.tabs.query({ url }),
        (res) => Boolean(res.length)
    );

    if (!matchingTabs.length) return;
    const newestTab = matchingTabs.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
    handleTabGrouping(sourceTab, newestTab);
}

async function handleTabGrouping(sourceTab, newTab) {
    if (!STATE.tabGrouping) return;
    try {
        const groupId = sourceTab.groupId;
        if (groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
            addToGroup(groupId, newTab.id);
        } else {
            await createNewGroup(newTab, sourceTab);
        }
    } catch (error) {
        console.error("Error grouping tabs:", error);
    }
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

GLOBAL.addToGroup = addToGroup;
GLOBAL.createNewGroup = createNewGroup;
GLOBAL.handleTabGrouping = handleTabGrouping;

console.log('Plugin: TabGrouping background loaded')
