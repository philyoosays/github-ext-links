
(async () => {
    const ext_debug = localStorage.getItem('EXT_DEBUG')
    if (ext_debug === 'true') {
        console.log('Debug mode enabled', ext_debug)
    } else return

    await addCategory('Debug', 'plugins/debug', { priority: 1000000 });

    const origin = new URL(window.location.href).origin + '/';
    const contentAllowed = URLS_TO_HIJACK.includes(origin);

    document.getElementById('debug-printState').addEventListener('click', async (e) => {
        e.preventDefault();
        const { _keys } = await chrome.storage.sync.get(['_keys'])
        const state = await chrome.storage.sync.get(_keys)
        console.log('All Keys', _keys)
        console.log('State (stored)', state)
        console.log('State (memory)', STATE)
    });

    document.getElementById('debug-printBGState').addEventListener('click', async (e) => {
        e.preventDefault();
        chrome.runtime.sendMessage({
            action: 'printBGState',
        })
    });

    document.getElementById('debug-printGlobals').addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('ENV', ENV)
        console.log('URLS_TO_HIJACK', URLS_TO_HIJACK)
        console.log('REGISTRY', REGISTRY)
        console.log('GLOBAL', GLOBAL)
        console.log('STATE', STATE)
        console.log('BUILD_LOG', BUILD_LOG)
    });

    document.getElementById('debug-clearState').addEventListener('click', async (e) => {
        e.preventDefault();
        chrome.storage.sync.clear();
    });
})()
