// Default settings
let SETTINGS = {};

(async () => {
  const { _keys } = await chrome.storage.sync.get(['_keys'])
  const savedState = await chrome.storage.sync.get(_keys)
  SETTINGS = { ...savedState };
  console.log('Content settings loaded:', SETTINGS);
})()

if (window.location.hostname === 'priceline.atlassian.net') {
  setTimeout(() => {
    const aTags = document.querySelectorAll('a');
    aTags.forEach(a => {
      URLS_TO_HIJACK.forEach(url => {
        if (!a.href.startsWith(url)) return;
        a.addEventListener('click', (e) => {
          chrome.runtime.sendMessage({
            action: 'groupTabToSource',
            url: encodeURI(a.href),
          });
        });
      })
    })
  }, 1000 * 1)
}

// Listen for changes to settings
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace !== 'sync') return
  for (const [key, { newValue }] of Object.entries(changes)) {
    SETTINGS[key] = newValue;
  }
  console.log('Content settings updated:', SETTINGS);
});

document.addEventListener('click', function (event) {
  if (!SETTINGS.enabled) return;
  const link = event.target.closest('a');
  if (!link) return;

  console.log('clicked', link, link.href)
  const url = new URL(link.href);
  if (url.hostname !== window.location.hostname) {
    event.preventDefault();

    chrome.runtime.sendMessage({
      action: 'openExternalLink',
      url: url.href
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  switch (message.action) {
    case 'testing-abc':
      console.log('testing-abc', message, sender, sendResponse);
      break;
    default:
      console.log('Unknown message:', message);
      break;
  }
});

console.log('content.js loaded', Date.now())
