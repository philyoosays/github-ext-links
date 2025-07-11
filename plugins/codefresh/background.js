
// ON_MESSAGE.skipToTimestamp = async (message, sender, sendResponse) => {
//     if (message.action !== 'skip-to-timestamp') return
//     const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!activeTab.url.startsWith('https://g.codefresh.io/2.0/workflows?')) return
//     const nextPageBtn = document.querySelector('button[aria-label="Next Page"]');
//     console.log(nextPageBtn)
//     console.log(request.timestamp)
//     sendResponse({ success: true });
// };
