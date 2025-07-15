
const defaultTimestampFormat = 'MMM dd, yyyy, h:mm a zzz';
(async () => {
    await addCategory('Github', 'plugins/github', { priority: 20 });
    await loadState({
        githubExtLinks: true,
        githubTimestamps: true,
        githubTimestampsOnlyPRs: true,
        githubTimestampsFormat: defaultTimestampFormat,
        githubTimestampsNoRelative: false,
        githubTimestampsAbbrevRelative: true,
        githubSlashCommands: true,
        githubRelNonBreaking: true,
    })

    addTimestampFormatExample()

    const extLinksInput = document.getElementById('gh-ext-links-input')
    extLinksInput.checked = STATE.githubExtLinks;

    const slashCmdInput = document.getElementById('gh-slash-cmd-input')
    slashCmdInput.checked = STATE.githubSlashCommands;

    const modTimestampsInput = document.getElementById('github-timestamps-input')
    modTimestampsInput.checked = STATE.githubTimestamps;

    const modTimestampsPRsInput = document.getElementById('github-timestamps-onlyPRs-input')
    modTimestampsPRsInput.checked = STATE.githubTimestampsOnlyPRs;

    const timestampFormatInput = document.getElementById('gh-timestamps-format-input')
    timestampFormatInput.value = STATE.githubTimestampsFormat;

    const timestampNoRelInput = document.getElementById('gh-timestamps-norel-input')
    timestampNoRelInput.checked = STATE.githubTimestampsNoRelative;

    const timestampAbbrevRelInput = document.getElementById('gh-timestamps-abbrevrel-input')
    timestampAbbrevRelInput.checked = STATE.githubTimestampsAbbrevRelative;

    const timestampRelNonBreakingInput = document.getElementById('gh-timestamps-relnonbreaking-input')
    timestampRelNonBreakingInput.checked = STATE.githubRelNonBreaking;

    document.getElementById('gh-ext-links').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubExtLinks: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
    });

    document.getElementById('gh-slash-cmd').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubSlashCommands: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
            .then(() => {
                if (enabledInput.checked) return
                const pclnMenu = document.getElementById('ghext-pcln-slash-menu');
                const container = document.getElementById('ghext-new-container');
                container.removeChild(pclnMenu);
            })
    });

    document.getElementById('github-timestamps').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubTimestamps: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
    });

    document.getElementById('github-timestamps-onlyPRs').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubTimestampsOnlyPRs: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
    });

    document.getElementById('gh-timestamps-format-input').addEventListener('input', (e) => {
        const input = e.target.value
        chrome.storage.sync.set({ githubTimestampsFormat: input })
            .then(() => addTimestampFormatExample())
    });

    document.getElementById('gh-timestamps-norel').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubTimestampsNoRelative: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
            .then(() => addTimestampFormatExample())
    });

    document.getElementById('gh-timestamps-abbrevrel').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubTimestampsAbbrevRelative: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
            .then(() => addTimestampFormatExample())
    });

    document.getElementById('gh-timestamps-relnonbreaking').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubRelNonBreaking: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
            .then(() => addTimestampFormatExample())
    });

    console.log('Plugin: Github popup loaded');
})();

async function addTimestampFormatExample() {
    const tsFormatExampleElem = document.getElementById('gh-timestamps-format-example');
    tsFormatExampleElem.innerHTML = '';

    const settings = await chrome.storage.sync.get(['githubTimestampsFormat']);
    let format = settings.githubTimestampsFormat;
    if (!settings.githubTimestampsFormat) {
        format = defaultTimestampFormat
    }
    const formattedDate = formatDate(Date.now() - 120000, format);

    const pTagLabel = document.createElement('p');
    const pTagValue = document.createElement('p');
    pTagLabel.classList.add('example-text');
    pTagLabel.textContent = 'Example:';
    pTagValue.classList.add('example-text');
    pTagValue.textContent = formattedDate;

    if (!STATE.githubRelNonBreaking) {
        tsFormatExampleElem.style.width = '150px'
    }
    
    if (!STATE.githubTimestampsNoRelative) {
        let relative = '(2 minutes ago)'
        if (STATE.githubTimestampsAbbrevRelative) {
            relative = abbreviateRelative(relative)
        }
        if (STATE.githubRelNonBreaking) {
            relative = relative.replace('/ /g', '&nbsp;');
            tsFormatExampleElem.style.width = '100%'
        }
        pTagValue.innerHTML += ` ${relative}`;
    }

    tsFormatExampleElem.appendChild(pTagLabel);
    tsFormatExampleElem.appendChild(pTagValue);
}
