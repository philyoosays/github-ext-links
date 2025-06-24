const ON_MESSAGE = {};
const ON_STATE_CHANGE = [];
const GLOBAL = {};
let STATE = {};

importScripts(
    'plugins/debug/background.js',
    'plugins/github/background.js',
    'plugins/tabGroup/background.js',
);

(async () => {
    const { _keys } = await chrome.storage.sync.get(['_keys'])
    STATE = await chrome.storage.sync.get(_keys)

    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log('Received message:', message);

        for (const handler of Object.values(ON_MESSAGE)) {
            await handler(message, sender, sendResponse);
        }
    });

    console.log('Background script loaded');
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return
    Object.entries(changes).forEach(([key, { newValue }]) => {
        STATE[key] = newValue;
    });
});
