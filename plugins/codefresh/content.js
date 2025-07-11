
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CF_CONTENT_GLOBAL = { firstItem: '' };

(async () => {
    const observer = new MutationObserver(async (mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') return
            if (window.location.href.includes('codefresh.io/2.0/workflows')) {
                const firstItem = document.querySelector('div.workflow-item-header__container')
                if (!firstItem) return
                const firstItemText = firstItem.textContent.split(' ').filter(Boolean).slice(1,-2).join(' ')
                if (CF_CONTENT_GLOBAL.firstItem !== firstItemText) {
                    CF_CONTENT_GLOBAL.firstItem = firstItemText
                    await hijackWorkflowDetails()
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // await hijackWorkflowDetails()

})();

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action !== "cf-skip-to") return
    const nextPageBtns = document.querySelectorAll('nz-col > button');
    if (!nextPageBtns.length) {
        sendResponse({ status: "Did not find buttons" });
        console.log('Did not find buttons')
        return;
    }
    let nextPageBtn = null;
    nextPageBtns.forEach(btn => {
        const label = btn.getAttribute('aria-label')
        if (label !== 'Next page') return
        nextPageBtn = btn
    });

    if (!nextPageBtn) {
        sendResponse({ status: "Did not find button" });
        console.log('Did not find button')
        return;
    }
    
    let targetFound = false
    let hasError = false
    let usedNext = false
    let count = 0
    let firstItem = ''
    while (!targetFound && !hasError && count < 5000) {
        count++
        let targeting = 'div.workflow-start-time__container'
        if (request.pullRequest) {
            targeting = 'div.workflow-item-header-payload__single'
        }
        const domItems = document.querySelectorAll(targeting);
        if (!domItems.length) {
            sendResponse({ status: "Did not find DOM items" });
            console.log('Did not find DOM items')
            return;
        }
        if (firstItem === domItems[0].textContent) {
            continue
        }
        domItems.forEach(domItem => {
            if (targetFound) return
            let container = null;

            if (request.timestamp) {
                const tsText = domItem.textContent.split(',')[1].trim()
                if (tsText < request.timestamp) {
                    targetFound = true
                    container = domItem.parentElement.parentElement.parentElement.parentElement
                }
            } else if (request.pullRequest) {
                if (!domItem.textContent.includes('-pr-')) return
                if (domItem.textContent.includes(request.pullRequest)) {
                    targetFound = true
                    container = domItem.parentElement.parentElement.parentElement.parentElement
                    console.log('found', targetFound)
                    console.log('container', container)
                    // if (request.next && !usedNext) {
                    //     targetFound = false
                    //     container = null
                    //     usedNext = true
                    // }
                }
            }
            
            if (targetFound) {
                domItem.scrollIntoView()
                if (!container) return
                container.style.border = '1px solid red'
            }

        });
        if (!targetFound) {
            nextPageBtn.click()
            await wait(100)
        }
    }

    sendResponse({ status: "Task completed" });
});

async function hijackWorkflowDetails() {
    let loaded = false
    if (!window.location.href.includes('codefresh.io/2.0/workflows')) return
    while (!loaded) {
        await wait(500)
        const wfContainers = document.querySelectorAll('div.workflow-item__container')
        if (wfContainers.length) {
            loaded = true
            wfContainers.forEach(container => {
                const wfName = container.querySelector('div.workflow-item-header-payload__single').textContent.split(' ')[0]
                const wfFooter = container.querySelector('nz-flex.global-workflow-item-footer__container')
                const wfDetails = wfFooter.querySelector('a.flex-no-shrink.ant-typography')
                const newWFDetails = document.createElement('a')
                newWFDetails.innerText = wfDetails.innerText
                newWFDetails.classList.add('flex-no-shrink')
                newWFDetails.classList.add('ant-typography')
                newWFDetails.setAttribute('target', '_blank')

                const { origin, pathname, search } = window.location
                newWFDetails.href = `${origin}${pathname}/${wfName}${search}`
                wfFooter.replaceChild(newWFDetails, wfDetails)
            })
        }
    }
}

console.log('Plugin: Codefresh content loaded');
