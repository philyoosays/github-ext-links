// Default settings
let settings = {
  enabled: true,
  tabGroupingEnabled: true
};

// Load settings from storage
chrome.storage.sync.get(settings, function(items) {
  settings = items;
});

// Listen for changes to settings
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    // Update local settings when storage changes
    for (const [key, { newValue }] of Object.entries(changes)) {
      settings[key] = newValue;
    }
  }
});

document.addEventListener('click', function(event) {
  // Only process if the feature is enabled
  if (!settings.enabled) return;
  
  const link = event.target.closest('a');
  if (link) {
    const url = new URL(link.href);
    if (url.hostname !== window.location.hostname) {
      event.preventDefault();
      
      // Send message to background script to handle the link opening
      chrome.runtime.sendMessage({
        action: "openExternalLink",
        url: url.href
      });
    }
  }
});
