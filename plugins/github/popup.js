
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
    })

    addTimestampFormatExample()

    const extLinksInput = document.getElementById('gh-ext-links-input')
    extLinksInput.checked = STATE.githubExtLinks;

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

    document.getElementById('gh-ext-links').addEventListener('click', (e) => {
        const enabledInput = e.target.parentElement.childNodes[1];
        chrome.storage.sync.set({ githubExtLinks: !enabledInput.checked })
            .then(() => enabledInput.checked = !enabledInput.checked)
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
    const formattedDate = formatDate(Date.now(), format);

    const pTagLabel = document.createElement('p');
    const pTagValue = document.createElement('p');
    pTagLabel.classList.add('example-text');
    pTagLabel.textContent = 'Example:';
    pTagValue.classList.add('example-text');
    pTagValue.textContent = formattedDate;

    if (!STATE.githubTimestampsNoRelative) {
        pTagValue.textContent += ' (now)';
    }

    tsFormatExampleElem.appendChild(pTagLabel);
    tsFormatExampleElem.appendChild(pTagValue);
}
