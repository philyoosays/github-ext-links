
const GH_LOCAL = {
  timelineLength: 0,
  parsedTimeline: {},
  pipelineTeam: [
    'philyoosays',
    'reilly3000',
    'Abhishek-Kaudare',
    'YashPatil0706',
    'taemery',
    'mparmarpcln',
    'jerrymaxey',
    'ab-gaikwad',
  ],
  cmdLegend: {
    '/pipelineApprove': 'Bypass approval for pipeline applications'
  }
};

(async () => {
  await loadState([
    'githubExtLinks',
    'githubTimestamps',
    'githubTimestampsOnlyPRs',
    'githubTimestampsFormat',
    'githubTimestampsNoRelative',
    'githubTimestampsAbbrevRelative',
    'githubSlashCommands',
  ]);

  openExternalInNewTab()
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') return
      replaceTimestamps()
      if (
        window.location.href.includes('github.com/pcln/') &&
        window.location.href.includes('/pull/')
      ) {
        parseComments()
        slashCommandMenu()
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  console.log('Plugin: Github content loaded');
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync') return
  Object.keys(changes).forEach((key) => {
    if (!key.startsWith('githubTimestamps')) return
    replaceTimestamps()
  });
});

function openExternalInNewTab() {
  document.addEventListener('click', (e) => {
    if (!STATE.githubExtLinks) return;

    const link = e.target.closest('a');
    if (!link) return;

    console.log('clicked', link.href)
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
        replacement.title = `${isoDateTime} (${relativeTime})`;
        replacement.textContent = textContent;
        if (!STATE.githubTimestampsNoRelative) {
          let fmtRelativeTime = `(${relativeTime})`
          if (STATE.githubTimestampsAbbrevRelative) {
            fmtRelativeTime = `(${abbreviateRelative(relativeTime)})`
          }
          if (STATE.githubRelNonBreaking) fmtRelativeTime = fmtRelativeTime.replace(/ /g, '&nbsp;')
          replacement.innerHTML += ` ${fmtRelativeTime}`
        }

        element.parentElement.replaceChild(replacement, element)
      })
    }, 250)
  }
}

function parseComments(isSlashCommandMenu) {
  if (!STATE.githubSlashCommands) return;

  const isPCLN_Github = window.location.href.startsWith('https://github.com/pcln/')
  const isPR = window.location.href.includes('/pull/')
  if (!isPCLN_Github || !isPR) return;
  
  const timeLineItems = document.querySelectorAll('.TimelineItem.js-comment-container')
  if (!timeLineItems.length) return
  if (!isSlashCommandMenu && GH_LOCAL.timelineLength === timeLineItems.length) return
  GH_LOCAL.timelineLength = timeLineItems.length

  const parseAuthorByHeader = (headerText) => {
    const idx = headerText.findIndex(s => ['bot','commented'].includes(s.toLowerCase()))
    return headerText[idx - 1]
  }

  const parseRepo = (href) => {
    const repoName = href.split('/pcln/')[1].split('/')[0]
    return {
      repoName,
      isSupported: ['gitops-k8s', 'terraform_configs'].includes(repoName)
    }
  }

  const parsedTimeline = {
    repo: parseRepo(window.location.href),
    loggedInUser: {
      user: '',
      isPipeline: false,
    },
    recentSuggestions: [],
    legend: {},
    timeline: [],
    debug: {},
  }

  const ghUserButtonSection = document.querySelector('.AppHeader-user');
  const ghUserButton = ghUserButtonSection && ghUserButtonSection.querySelector('button.Button.Button--medium')
  const ghUser = ghUserButton && ghUserButton.getAttribute('data-login')
  if (ghUser) {
    parsedTimeline.loggedInUser.user = ghUser
    parsedTimeline.loggedInUser.isPipeline = GH_LOCAL.pipelineTeam.includes(ghUser)
  }

  /**
   * parsedTimeline.timeline
   * 
   * TimelineItem {
   *  author: string,
   *  isABot: string,
   *  date: Date,
   *  comment: {
   *    raw: string,
   *    parsed: string,
   *  }
   *  debug: {
   *    authorParse: string,
   *  }
   *  slashCommandLegend: boolean,
   *  slashCommands: string[]
   *  slashCommandUser: string,
   *  slashCommandAck: string,
   *  slashCommandAckText: string,
   * }
   */

  timeLineItems.forEach((item) => {
    const timelineObj = { debug: {} }
    const header = item.querySelector('.timeline-comment-header')
    /**
     * Author
     */
    const author = parseAuthorByHeader(header.innerText.replace(/\n/g, ' ').trim().split(' '))
    timelineObj.author = author
    timelineObj.debug.authorParse = 'innerText'
    if (!author) {
      const textContentText = header.textContent.replace(/\n/g, ' ').split(' ').filter(Boolean)
      timelineObj.author = parseAuthorByHeader(textContentText)
      timelineObj.debug.authorParse = 'textContent'
    }
    /**
     * isABot
     */
    timelineObj.isABot = [
      'pcln-argo',
      'pcln-clouddev-terraformator',
    ].includes(timelineObj.author)
    /**
     * Date
     */
    const dateElem = header.querySelector('a.js-timestamp').firstChild
    timelineObj.date = new Date(dateElem.getAttribute('datetime'))
    /**
     * Comment Body
     */
    const commentBody = item.querySelector('.comment-body, .markdown-body, .js-comment-body')
    timelineObj.comment = {
      raw: commentBody.textContent.replace(/\n{3,}/g, '\n\n').trim(),
      parsed: commentBody.textContent.replace(/\n/g, ' ').trim(),
      innerText: commentBody.innerText.trim()
    }
    /**
     * Slash Commands
     */
    timelineObj.slashCommandLegend = timelineObj.comment.raw.includes('Click here for all available commands.')
    const parsedSlashCmds = parseByEnv(parsedTimeline, timelineObj).slashCmds[parsedTimeline.repo.repoName](commentBody)
    const legendCmds = Object.keys(parsedTimeline.legend)
    // if suggested command not in legend, add it
    if (!legendCmds.length) parsedTimeline.legend = parsedSlashCmds.reduce((a,c) => ({...a, [c]:''}), {})
    else {
      parsedSlashCmds.filter(cmd => !legendCmds.includes(cmd)).forEach(cmd => parsedTimeline.legend[cmd] = '')
    }
    timelineObj.slashCommands = [ ...new Set(parsedSlashCmds) ]
    /**
     * Slash Command Acknowledgement
     */
    const isSameCmd = timelineObj.slashCommands.length > 1 && timelineObj.slashCommands.every(cmd => cmd === timelineObj.slashCommands[0])
    if (isSameCmd && timelineObj.isABot && commentBody.innerText.includes('request by')) {
      timelineObj.slashCommandAck = commentBody.innerText.includes('was processed')
      timelineObj.slashCommandAckText = commentBody.innerText.replace(timelineObj.slashCommands[0], '').trim()
    }

    parsedTimeline.timeline.push(timelineObj)
    /**
     * Recent Suggestions
     */
    if (
      timelineObj.isABot &&
      !timelineObj.slashCommandLegend &&
      !timelineObj.slashCommandAck &&
      timelineObj.slashCommands.length > 0
    ) {  
      parsedTimeline.recentSuggestions = timelineObj.slashCommands
    }
    if (!timelineObj.isABot && timelineObj.slashCommands.length === 1) {
      parsedTimeline.recentSuggestions = []
    }
  })

  if (!isSlashCommandMenu) console.log('Parsed Timeline', parsedTimeline)
  if (Object.keys(parsedTimeline.legend).length > 0) {
    parsedTimeline.legend = {
      ...parsedTimeline.legend,
      ...(
        parsedTimeline.repo.repoName === 'gitops-k8s'
        && parsedTimeline.loggedInUser.isPipeline
        && GH_LOCAL.cmdLegend
      ),
    }
  }
  GH_LOCAL.parsedTimeline = parsedTimeline
  return parsedTimeline
}

function slashCommandMenu() {
  if (!STATE.githubSlashCommands) return

  const slashCommandMenu = document.querySelector('.js-slash-command-menu');
  if (!slashCommandMenu) return

  const existingPCLNMenu = document.getElementById('ghext-pcln-slash-menu')
  if (existingPCLNMenu) {
    const existingSlashCmdList = existingPCLNMenu.getAttribute('data-slash-cmd-list')
    const { slashCmds, slashCmdNodes } = createPCLNMenu_slashCmds();
    if (existingSlashCmdList === slashCmds.join(',')) return

    const existingSlashCmds = existingPCLNMenu.querySelectorAll('.pcln-slash-command-menu-item')
    existingSlashCmds.forEach(child => existingPCLNMenu.remove(child))

    existingPCLNMenu.appendChild(slashCmdNodes);
    return
  }

  slashCommandMenu.style.display = 'flex'
  slashCommandMenu.style.visibility = 'visible'
  slashCommandMenu.style.opacity = '1'

  const pclnMenu = buildPCLNMenu()
  const githubMenu = slashCommandMenu.children[0]

  const container = document.createElement('div')
  container.id = 'ghext-new-container'
  container.style.display = 'flex'
  
  container.appendChild(pclnMenu)
  container.appendChild(githubMenu)

  slashCommandMenu.replaceChildren(container)
}

function buildPCLNMenu() {
  const pclnMenuHeader = createPCLNMenu_header()
  const cat_availableCommands = createPCLNMenu_category('Available Commands')
  
  const pclnMenu = createPCLNMenu_container()
  pclnMenu.appendChild(pclnMenuHeader)
  pclnMenu.appendChild(cat_availableCommands)
  
  const { slashCmds, slashCmdNodes } = createPCLNMenu_slashCmds();
  pclnMenu.setAttribute('data-slash-cmd-list', slashCmds.join(','));
  pclnMenu.appendChild(slashCmdNodes);

  return pclnMenu
}

function createPCLNMenu_header() {
  const ghSlashMenuHeader = document.querySelector('.js-slash-command-menu header.SelectMenu-header')
  const slashMenuHeader = ghSlashMenuHeader.cloneNode(true)
  const slashMenuHeaderText = slashMenuHeader.querySelector('#slash-commands-title')
  if (slashMenuHeaderText) slashMenuHeaderText.textContent = 'PCLN Slash Commands'
  slashMenuHeader.style.height = '36px'

  // Removes the Preview pill
  const lastHeaderChild = slashMenuHeader.children[slashMenuHeader.children.length - 1];
  if (lastHeaderChild) slashMenuHeader.removeChild(lastHeaderChild);

  return slashMenuHeader
}

function createPCLNMenu_category(categoryTitle) {
  const menuCategory = document.createElement('div')

  menuCategory.classList.add('SelectMenu-divider')
  menuCategory.classList.add('js-group-divider')
  
  menuCategory.style.width = '100%'
  menuCategory.style.height = '25px'

  menuCategory.innerText = categoryTitle

  return menuCategory
}

function createPCLNMenu_container() {
  const pclnMenu = document.createElement('div')
  pclnMenu.id = 'ghext-pcln-slash-menu'
  pclnMenu.classList.add('SelectMenu-modal')

  pclnMenu.style.display = 'inline-block'
  // pclnMenu.style.flexDirection = 'column'

  pclnMenu.style.width = '300px'
  pclnMenu.style.height = '320px'
  // pclnMenu.style.border = '1px solid rgb(61, 68, 77)'
  pclnMenu.style.borderWidth = '1px'
  pclnMenu.style.borderStyle = 'solid'
  pclnMenu.style.borderRadius = '6px'
  // pclnMenu.style.backgroundColor = 'rgb(13, 17, 23)'
  // pclnMenu.style.padding = '5px 0px'
  pclnMenu.style.marginTop = '8px'
  pclnMenu.style.marginBottom = '16px'
  pclnMenu.style.marginRight = '8px'
  // pclnMenu.style.color = 'rgb(240, 246, 252)'
  pclnMenu.style.colorScheme = 'dark'
  pclnMenu.style.lineHeight = '21px'
  pclnMenu.style.boxSizing = 'border-box'

  return pclnMenu;
}

function createPCLNMenu_slashCmds() {
  const parsedTimeline = parseComments(true);

  const additionalCommands = []
  if (parsedTimeline.repo === 'gitops-k8s') {
    additionalCommands.push('/retryGates')
  }

  const slashCmds = [...new Set([
    ...parsedTimeline.recentSuggestions,
    ...additionalCommands,
    ...Object.keys(parsedTimeline.legend),
  ])];
  
  const slashCmdNodes = document.createElement('div');
  slashCmdNodes.style.overflowY = 'scroll'
  slashCmdNodes.style.height = '240px'

  slashCmds.forEach((cmd, idx) => {
    const isHighlighted = idx < parsedTimeline.recentSuggestions.length
    const commandItem = createPCLNMenu_slashCmdItem(isHighlighted);
    const {
      commandText,
      commandDesc,
    } = createPCLNMenu_slashCmdContent(cmd, parsedTimeline, isHighlighted);

    commandItem.appendChild(commandText);
    commandItem.appendChild(commandDesc);

    createPCLNMenu_slashCmdListeners({
      commandItem,
      commandDesc,
      cmd,
      parsedTimeline
    });

    slashCmdNodes.appendChild(commandItem);
  })

  return { slashCmds, slashCmdNodes } 
}

function createPCLNMenu_slashCmdItem(isHighlighted) {
  const commandItem = document.createElement('div');
  commandItem.role = 'option';
  commandItem.classList.add('SelectMenu-item');
  commandItem.classList.add('slash-command-menu-item');
  commandItem.classList.add('pcln-slash-command-menu-item');
  commandItem.style.flexDirection = 'column';
  commandItem.style.alignItems = 'flex-start';
  commandItem.style.padding = '10px 16px';

  // highlight recent suggestions
  if (isHighlighted) {
    commandItem.setAttribute('data-highlighted', 'true')
    // commandItem.style.backgroundColor = '#1f6feb';
    // commandItem.style.color = '#fff';
    // commandItem.style.borderColor = '#1f6feb';
  }

  return commandItem;
}

function createPCLNMenu_slashCmdContent(cmd, parsedTimeline, isHighlighted) {
  const commandText = document.createElement('h5');
  commandText.textContent = cmd;

  const commandDesc = document.createElement('span');
  commandDesc.classList.add('command-description');
  if (isHighlighted) {
    commandText.style.color = '#1f6feb';
    commandDesc.textContent = parsedTimeline.legend[cmd];
  }

  return { commandText, commandDesc };
}

function createPCLNMenu_slashCmdListeners({commandItem, commandDesc, cmd, parsedTimeline}) {
  commandItem.addEventListener('click', () => {
    const textarea = document.getElementById('new_comment_field') ||
                    document.querySelector('textarea.js-comment-field');
    textarea.value = cmd
    document.querySelector('.js-slash-command-menu').remove()
  })

  commandItem.addEventListener('mouseover', () => {
    commandDesc.textContent = parsedTimeline.legend[cmd]
  })

  commandItem.addEventListener('mouseout', () => {
    const isHighlighted = commandItem.getAttribute('data-highlighted')
    if (isHighlighted) return
    commandDesc.textContent = ''
  })
}

function parseByEnv(parsedTimeline, timelineObj) {
  const parseSlashCmds = (textContent) => textContent.matchAll(/(?: |\n)(\/[a-zA-Z-]+)(?: |\n)(.+)(?: |\n)/gm)
  return {
    slashCmds: {
      'gitops-k8s': (commentBody) => {
        const slashCommands = []
        const textContent = commentBody.textContent.split(' to Rendered Manifests')[0]
        const slashCmd = parseSlashCmds(textContent)
        for (const cmd of slashCmd) {
          if (timelineObj.slashCommandLegend) {
            parsedTimeline.legend[cmd[1].trim()] = cmd[2].trim()
          }
          slashCommands.push(cmd[1].trim())
        }
        return slashCommands
      },
      terraform_configs: (commentBody) => {
        const slashCommands = []
        const slashCmd = parseSlashCmds(commentBody.textContent)
        for (const cmd of slashCmd) {
          slashCommands.push(cmd[1].trim() + ' ' + cmd[2].trim())
        }
        return slashCommands
      }
    }
  }
}
