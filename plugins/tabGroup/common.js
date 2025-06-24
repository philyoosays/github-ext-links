
function determineGroupName(tab) {
    const tabUrl = tab.pendingUrl ?? tab.url
    const tabUrlObj = new URL(tabUrl);

    const isAtlassian = tabUrlObj.hostname === 'priceline.atlassian.net'
    const isHiggins = /higgins\.\w+\.pcln\.com\/project\//.exec(tabUrl)
    const isCodeFresh = /g\.codefresh\.io/.exec(tabUrl)

    const groupNames = new Set()

    if (isAtlassian) {
        if (tabUrl.includes('selectedIssue=')) {
            groupNames.add(new URL(tabUrl).searchParams.get('selectedIssue'))
        } else if (tabUrl.startsWith('https://priceline.atlassian.net/browse/') || tabUrl.includes('/servicedesk/')) {
            // https://priceline.atlassian.net/jira/servicedesk/projects/PIPESUP/queues/issue/PIPESUP-8522
            // https://priceline.atlassian.net/servicedesk/customer/portal/2107/PIPESUP-8522
            groupNames.add(tabUrl.split('/').slice(-1)[0])
        } else if (/issue\/[A-Z]+-\d+/.exec(tabUrl)) {
            groupNames.add(/issue\/[A-Z]+-\d+/.exec(tabUrl)[0])
        }
    } else if (isHiggins) {
        groupNames.add(tabUrl.split('/project/')[1].split('/')[0])
    } else if (isCodeFresh) {
        // Codefresh
        // https://g.codefresh.io/2.0/applications-dashboard/cf-gitops/cf-gitops-prod-guse4/bundle-builder.preprod.gnae1.non-pci.standalonerule/current-state/tree
        // ?activeAccountId=61f9b27f150a6b8924f43f3b
        // https://g.codefresh.io/2.0/applications-dashboard/cf-gitops/cf-gitops-nonprod-guse4/genai-svc.qa-a.gnae1.non-pci.primary/current-state/tree?activeAccountId=639ccb979f9e60850651dd8e
        const rdAppName = tabUrlObj.searchParams.get('rdAppName')
        const rdName = tabUrlObj.searchParams.get('rdName')
        const resourceName = tabUrlObj.searchParams.get('resourceName')
        const deployName = tabUrl.split('/current-state/')[0].split('/').slice(-1)[0]

        if (rdAppName) groupNames.add(rdAppName)
        if (rdName) groupNames.add(rdName)
        if (resourceName) groupNames.add(resourceName)
        groupNames.add(deployName)
    } else if (SETTINGS.groupNaming === 'url_ext') {
        groupNames.add(tabUrl.split('/').slice(-2).join('/'))
        groupNames.add(tab.title.split(/ [^\s\w-] /)[0])
    } else {
        groupNames.add(tab.title.split(/ [^\s\w-] /)[0])
        groupNames.add(tabUrl.split('/').slice(-2).join('/'))
    }

    return groupNames
}
