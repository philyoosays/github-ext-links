
(async () => {
  await loadState([
    'githubExtLinks',
    'githubTimestamps',
    'githubTimestampsOnlyPRs',
    'githubTimestampsFormat',
  ]);

  openExternalInNewTab()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') return
      replaceTimestamps()
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('Plugin: Github content loaded');
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return
  Object.keys(changes).forEach((key) => {
    if (key !== 'githubTimestamps') return
    replaceTimestamps()
  });
});

function openExternalInNewTab() {
  document.addEventListener('click', (e) => {
    if (!STATE.githubExtLinks) return;

    const link = e.target.closest('a');
    if (!link) return;

    console.log('clicked', link, link.href)
    const url = new URL(link.href);
    if (url.hostname === window.location.hostname) {
      return;
    }
    e.preventDefault();

    chrome.runtime.sendMessage({
      action: 'openExternalLink',
      url: url.href
    });
  });
}

function replaceTimestamps() {
  if (STATE.githubTimestampsOnlyPRs) {
    const isGithub = window.location.href.startsWith('https://github.com/')
    const isPR = window.location.href.includes('/pull/')
    if (!isGithub || !isPR) return;
  }
  if (!STATE.githubTimestamps) {
    document.querySelectorAll('.ghext-datetime-field').forEach((element) => {
      const localeDateTime = element.textContent.split(' ')[0];
      const isoDateTime = element.getAttribute('datetime');
      const relativeTime = element.getAttribute('rel_datetime');

      const replacement = document.createElement('relative-time');
      replacement.setAttribute('title', localeDateTime);
      replacement.setAttribute('datetime', isoDateTime);
      replacement.shadowRoot.textContent = relativeTime;

      element.parentElement.replaceChild(replacement, element)
    })
  } else {
    setTimeout(() => {
      document.querySelectorAll('relative-time').forEach((element) => {

        const localeDateTime = element.getAttribute('title');
        const isoDateTime = element.getAttribute('datetime');
        const relativeTime = element.shadowRoot.textContent;

        let textContent = localeDateTime;
        if (STATE.githubTimestampsFormat) {
          textContent = formatDate(isoDateTime, STATE.githubTimestampsFormat)
        }

        const replacement = document.createElement('span');
        replacement.classList.add('ghext-datetime-field');
        replacement.setAttribute('datetime', isoDateTime);
        replacement.setAttribute('rel_datetime', relativeTime);
        replacement.textContent = `${textContent} (${relativeTime})`;
        replacement.title = `${isoDateTime} (${relativeTime})`;

        element.parentElement.replaceChild(replacement, element)
      })
    }, 250)
  }
}
