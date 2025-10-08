// Default settings
(async () => {
  await loadState([
    'githubExtLinks',
  ]);
  console.log('Content settings loaded:', STATE);
})();

if (window.location.hostname === 'priceline.atlassian.net') {
  setTimeout(() => {
    const aTags = document.querySelectorAll('a');
    aTags.forEach(a => {
      URLS_TO_HIJACK.forEach(url => {
        if (!a.href.startsWith(url)) return;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.runtime.sendMessage({
            action: 'groupTabToSource',
            url: encodeURI(a.href),
          });
        });
      })
    })
  }, 1000 * 1.5)
}

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
