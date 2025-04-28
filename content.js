// Default to enabled
let isEnabled = true;

// Load the setting from storage
chrome.storage.sync.get({ enabled: true }, function(items) {
  isEnabled = items.enabled;
});

// Listen for changes to the setting
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.enabled) {
    isEnabled = changes.enabled.newValue;
  }
});

document.addEventListener('click', function(event) {
  // Only process if the feature is enabled
  if (!isEnabled) return;
  
  const link = event.target.closest('a');
  if (link) {
    const url = new URL(link.href);
    if (url.hostname !== window.location.hostname) {
      event.preventDefault();
      window.open(url.href, '_blank');
    }
  }
});
