document.addEventListener('DOMContentLoaded', function() {
    const enabledToggle = document.getElementById('enabled');
    const statusElement = document.getElementById('status');
    
    // Load current state
    chrome.storage.sync.get({ enabled: true }, function(items) {
      enabledToggle.checked = items.enabled;
    });
    
    // Save state when toggle changes
    enabledToggle.addEventListener('change', function() {
      const isEnabled = enabledToggle.checked;
      
      chrome.storage.sync.set({ enabled: isEnabled }, function() {
        statusElement.textContent = 'Settings saved!';
        setTimeout(function() {
          statusElement.textContent = '';
        }, 1500);
      });
    });
  });
  