

const debugEnabled = true
// if (!debugEnabled) return;

const origin = new URL(window.location.href).origin + '/';
const contentAllowed = URLS_TO_HIJACK.includes(origin);

const debugContainer = document.getElementById('debug');

const title = document.createElement('div');
title.classList.add('option-group-title');
title.textContent = 'Debug';

const printSettings = createPrintSettings(contentAllowed);

debugContainer.classList.add('option-group');
debugContainer.appendChild(title);
debugContainer.appendChild(printSettings);

function createPrintSettings(contentAllowed) {
    const printSettings = document.createElement('div');
    printSettings.classList.add('option');
    printSettings.setAttribute('id', 'printSettings');
    
    const printSettingsLabel = document.createElement('span');
    printSettingsLabel.textContent = 'Print Settings';

    const printSettingsButton = document.createElement('button');
    printSettingsButton.textContent = 'Debug';
    printSettingsButton.classList.add('button');
    printSettingsButton.setAttribute('style', 'margin-left: 10px;font-size: 12px;');
    printSettingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('SETTINGS', SETTINGS);
    });

    console.log('origin', origin, contentAllowed)
    let printToConsoleButton
    if (contentAllowed) {
        printToConsoleButton = document.createElement('button');
        printToConsoleButton.textContent = 'Console';
        printToConsoleButton.classList.add('button');
        printToConsoleButton.setAttribute('style', 'margin-left: 10px;font-size: 12px;');
        printToConsoleButton.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.sendMessage({
                action: 'testing-abc',
            });
        });
        
    }

    printSettings.appendChild(printSettingsLabel);
    printSettings.appendChild(printSettingsButton);
    if (contentAllowed) {
        printSettings.appendChild(printToConsoleButton);
    }
    return printSettings;
}
