
const GH_LOCAL = {
  timelineLength: 0,
  parsedTimeline: {},
};

(async () => {
  await loadState([
    'githubExtLinks',
    'githubTimestamps',
    'githubTimestampsOnlyPRs',
    'githubTimestampsFormat',
    'githubTimestampsNoRelative',
    'githubTimestampsAbbrevRelative',
  ]);

  openExternalInNewTab()
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') return
      replaceTimestamps()
      parseComments()
      slashCommandMenu()
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
        replacement.title = `${isoDateTime} (${relativeTime})`;
        replacement.textContent = textContent;
        if (!STATE.githubTimestampsNoRelative) {
          let fmtRelativeTime = ` (${relativeTime})`
          if (STATE.githubTimestampsAbbrevRelative) {
            fmtRelativeTime = ` (${abbreviateRelative(relativeTime)})`
          }
          replacement.textContent += fmtRelativeTime
        }

        element.parentElement.replaceChild(replacement, element)
      })
    }, 250)
  }
}

function parseComments(isSlashCommandMenu) {
  const isGithub = window.location.href.startsWith('https://github.com/')
  const isPR = window.location.href.includes('/pull/')
  if (!isGithub || !isPR) return;
  
  const timeLineItems = document.querySelectorAll('.TimelineItem.js-comment-container')
  if (!timeLineItems.length) return
  if (!isSlashCommandMenu && GH_LOCAL.timelineLength === timeLineItems.length) return
  GH_LOCAL.timelineLength = timeLineItems.length

  const parsedTimeline = {
    recentSuggestions: [],
    legend: {},
    timeline: [],
  }
  /**
   * {
   *  author: string,
   *  isArgo: string,
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
    const timelineObj = {}
    const header = item.querySelector('.timeline-comment-header')
    const author = parseAuthorByHeader(header.innerText.replace(/\n/g, ' ').trim().split(' '))
    timelineObj.author = author
    timelineObj.debug = {
      authorParse: 'innerText'
    }
    if (!author) {
      const textContentText = header.textContent.replace(/\n/g, ' ').split(' ').filter(Boolean)
      timelineObj.author = parseAuthorByHeader(textContentText)
      timelineObj.debug.authorParse = 'textContent'
    }
    timelineObj.isArgo = timelineObj.author.includes('pcln-argo')

    const dateElem = header.querySelector('a.js-timestamp').firstChild
    timelineObj.date = new Date(dateElem.getAttribute('datetime'))

    const commentBody = item.querySelector('.comment-body, .markdown-body, .js-comment-body')
    timelineObj.comment = {
      raw: commentBody.textContent.replace(/\n{3,}/g, '\n\n').trim(),
      parsed: commentBody.textContent.replace(/\n/g, ' ').trim(),
      innerText: commentBody.innerText.trim()
    }

    timelineObj.slashCommandLegend = timelineObj.comment.raw.includes('Click here for all available commands.')
    const slashCmd = commentBody.textContent.matchAll(/(?: |\n)(\/[a-zA-Z]+)(?: |\n)(.+)(?: |\n)/gm)
    timelineObj.slashCommands = []
    for (const cmd of slashCmd) {
      timelineObj.slashCommands.push(cmd[1].trim())
      if (timelineObj.slashCommandLegend) {
        parsedTimeline.legend[cmd[1].trim()] = cmd[2].trim()
      }
    }
    timelineObj.slashCommands = [ ...new Set(timelineObj.slashCommands) ]

    const isSameCmd = timelineObj.slashCommands.length > 1 && timelineObj.slashCommands.every(cmd => cmd === timelineObj.slashCommands[0])
    if (isSameCmd && timelineObj.isArgo && commentBody.innerText.includes('request by')) {
      timelineObj.slashCommandAck = commentBody.innerText.includes('was processed')
      timelineObj.slashCommandAckText = commentBody.innerText.replace(timelineObj.slashCommands[0], '').trim()
    }
    parsedTimeline.timeline.push(timelineObj)
    if (
      timelineObj.isArgo &&
      !timelineObj.slashCommandLegend &&
      !timelineObj.slashCommandAck &&
      timelineObj.slashCommands.length > 0
    ) {  
      parsedTimeline.recentSuggestions = timelineObj.slashCommands
    }
    if (!timelineObj.isArgo && timelineObj.slashCommands.length === 1) {
      parsedTimeline.recentSuggestions = []
    }
  })
  if (!isSlashCommandMenu) console.log('Parsed Timeline', parsedTimeline)
  GH_LOCAL.parsedTimeline = parsedTimeline
  return parsedTimeline
}

async function slashCommandMenu() {
  const slashCommandMenu = document.querySelector('.js-slash-command-menu');
  const existingNewMenu = document.getElementById('ghext-pcln-slash-menu')

  if (!slashCommandMenu || existingNewMenu) return

  slashCommandMenu.style.display = 'flex'
  slashCommandMenu.style.visibility = 'visible'
  slashCommandMenu.style.opacity = '1'

  const slashCommandModal = slashCommandMenu.children[0]

  const container = document.createElement('div')
  container.id = 'ghext-new-container'
  // container.style.border = '4px solid red'
  container.style.display = 'flex'

  const newMenu = buildSlashCommandMenu()

  container.appendChild(newMenu)
  container.appendChild(slashCommandModal)

  slashCommandMenu.replaceChildren(container)
}

function buildSlashCommandMenu() {
  const parsedTimeline = parseComments(true)
  const newMenu = document.createElement('div')
  newMenu.id = 'ghext-pcln-slash-menu'
  newMenu.classList.add('SelectMenu-modal')

  newMenu.style.width = '300px'
  newMenu.style.border = '1px solid rgb(61, 68, 77)'
  newMenu.style.borderRadius = '6px'
  newMenu.style.backgroundColor = 'rgb(13, 17, 23)'
  // newMenu.style.padding = '5px 0px'
  newMenu.style.marginTop = '8px'
  newMenu.style.marginBottom = '16px'
  newMenu.style.marginRight = '8px'
  newMenu.style.color = 'rgb(240, 246, 252)'
  newMenu.style.colorScheme = 'dark'
  newMenu.style.lineHeight = '21px'
  newMenu.style.boxSizing = 'border-box'

  const slashMenuHeader = document.querySelector('.js-slash-command-menu header.SelectMenu-header')
  const slashMenuHeaderCopy = slashMenuHeader.cloneNode(true)
  const slashMenuHeaderText = slashMenuHeaderCopy.querySelector('#slash-commands-title')
  if (slashMenuHeaderText) slashMenuHeaderText.textContent = 'PCLN Slash Commands'
  slashMenuHeaderCopy.style.height = '36px'
  // slashMenuHeaderCopy.style.boxSizing = 'border-box'

  const lastHeaderChild = slashMenuHeaderCopy.children[slashMenuHeaderCopy.children.length - 1]
  if (lastHeaderChild) slashMenuHeaderCopy.removeChild(lastHeaderChild)

  const availableCmdHeader = document.createElement('div')
  availableCmdHeader.classList.add('SelectMenu-divider')
  availableCmdHeader.classList.add('js-group-divider')
  availableCmdHeader.innerText = 'Available Commands'
  // availableCmdHeader.style.boxSizing = 'border-box'
  availableCmdHeader.style.width = '100%'
  availableCmdHeader.style.height = '25px'

  newMenu.appendChild(slashMenuHeaderCopy)
  newMenu.appendChild(availableCmdHeader)

  const slashCmds = [...new Set([
    ...parsedTimeline.recentSuggestions,
    '/retryGates',
    ...Object.keys(parsedTimeline.legend),
  ])]

  slashCmds.forEach((cmd, idx) => {
    const commandBox = document.createElement('div');
    commandBox.role = 'option';
    commandBox.classList.add('SelectMenu-item');
    commandBox.classList.add('slash-command-menu-item');
    commandBox.style.flexDirection = 'column';
    commandBox.style.alignItems = 'flex-start';
    if (idx < parsedTimeline.recentSuggestions.length) {
      commandBox.style.backgroundColor = '#1f6feb';
    }
    
    const commandText = document.createElement('h5');
    commandText.textContent = cmd
    const commandDesc = document.createElement('span');
    commandDesc.classList.add('command-description');
    if (parsedTimeline.recentSuggestions.includes(cmd)) {
      commandDesc.textContent = parsedTimeline.legend[cmd]
    }
    commandBox.appendChild(commandText)
    commandBox.appendChild(commandDesc)

    commandBox.addEventListener('click', (e) => {
      const textarea = document.querySelector('textarea.js-comment-field');
      textarea.value = cmd
      document.querySelector('.js-slash-command-menu').remove()
    })

    commandBox.addEventListener('mouseover', (e) => {
      commandDesc.textContent = parsedTimeline.legend[cmd]
    })

    commandBox.addEventListener('mouseout', (e) => {
      commandDesc.textContent = ''
    })

    newMenu.appendChild(commandBox)
  })
  
  return newMenu
}

function parseAuthorByHeader(headerText) {
  const idx = headerText.findIndex(s => ['bot','commented'].includes(s.toLowerCase()))
  return headerText[idx - 1]
}

