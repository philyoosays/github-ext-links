
(async () => {
    await addCategory('Github', 'plugins/github', { priority: 20 });
    await loadState({
        githubExtLinks: true,
        githubTimestamps: true,
        githubTimestampsOnlyPRs: true,
    })
    
    const extLinksInput = document.getElementById('gh-ext-links-input')
    extLinksInput.checked = STATE.githubExtLinks;
    
    const modTimestampsInput = document.getElementById('github-timestamps-input')
    modTimestampsInput.checked = STATE.githubTimestamps;

    const modTimestampsPRsInput = document.getElementById('github-timestamps-onlyPRs-input')
    modTimestampsPRsInput.checked = STATE.githubTimestampsOnlyPRs;

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

    console.log('Plugin: Github popup loaded');
})();
