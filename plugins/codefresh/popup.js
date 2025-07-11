
(async () => {
    await addCategory('Codefresh', 'plugins/codefresh', { priority: 19 });
    // await loadState

    document.getElementById('cf-timestamp-skip-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const inputValue = document.getElementById('cf-timestamp-skip-input').value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                action: "cf-skip-to",
                timestamp: inputValue,
            }, (response) => {
                console.log(response?.status);
            });
        });
    });

    document.getElementById('cf-pr-skip-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const inputValue = document.getElementById('cf-pr-skip-input').value;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                action: "cf-skip-to",
                pullRequest: inputValue,
            }, (response) => {
                console.log(response?.status);
            });
        });
    });

    // document.getElementById('cf-pr-next-btn').addEventListener('click', (e) => {
    //     e.preventDefault();
    //     const inputValue = document.getElementById('cf-pr-skip-input').value;
    //     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    //         const activeTab = tabs[0];
    //         chrome.tabs.sendMessage(activeTab.id, {
    //             action: "cf-skip-to",
    //             pullRequest: inputValue,
    //             next: true,
    //         }, (response) => {
    //             console.log(response?.status);
    //         });
    //     });
    // });
})()