
(async () => {
  await loadState([
    'githubExtLinks',
    'githubTimestamps',
    'githubTimestampsOnlyPRs'
  ]);

  openExternalInNewTab()
  parseComments()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== 'childList') return
      replaceTimestamps()
      // slashCommandMenu()
      // downloadClonedElementAsHtml()
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

      const replacement =  document.createElement('relative-time');
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
  
        const replacement = document.createElement('span');
        replacement.classList.add('ghext-datetime-field');
        replacement.setAttribute('datetime', isoDateTime);
        replacement.setAttribute('rel_datetime', relativeTime);
        replacement.textContent = `${localeDateTime} (${relativeTime})`;
        replacement.title = `${isoDateTime} (${relativeTime})`;
  
        element.parentElement.replaceChild(replacement, element)
      })
    }, 250)
  }
}

let cloneCount = 0

function downloadClonedElementAsHtml() {
  const slashCommandMenu = document.querySelector('.js-slash-command-menu');
  if (!slashCommandMenu) return

  cloneCount++
  if (cloneCount > 1) return
  // Get the source element
  let sourceElement = slashCommandMenu

  if (!sourceElement) {
    console.error('Source element not found!');
    return;
  }

  // Clone the source element. This will create a deep copy of the element and its descendants.
  let clonedElement = sourceElement.cloneNode(true);

  // Create a new HTML document
  let newDoc = document.implementation.createHTMLDocument('New Document');

  // Copy the current document's styles and links to the new document
  let head = newDoc.head;
  Array.from(document.head.getElementsByTagName('style')).forEach(style => {
    head.appendChild(style.cloneNode(true));
  });
  Array.from(document.head.getElementsByTagName('link')).forEach(link => {
    head.appendChild(link.cloneNode(true));
  });

  // Add the basic structure to the new document's body along with the cloned element
  newDoc.body.appendChild(clonedElement);

  // Create a Blob containing the new document's HTML
  let htmlBlob = new Blob([newDoc.documentElement.outerHTML], { type: 'text/html' });

  // Create a link element for downloading the file manually
  let downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(htmlBlob);
  downloadLink.download = 'newDocument.html';  // Set the name of the downloaded file

  // Append the link to the document
  document.body.appendChild(downloadLink);

  // Request user to click the link manually
  downloadLink.textContent = 'Click to download the cloned document';
  downloadLink.style.display = 'block';
  downloadLink.style.margin = '20px';
  downloadLink.style.fontSize = '20px';
  downloadLink.style.color = 'blue';
  downloadLink.style.cursor = 'pointer';

  const container = document.querySelector('.js-discussion')
  container.appendChild(downloadLink);
}
function createClone () {

  const slashCommandMenu = document.querySelector('.js-slash-command-menu');
  if (!slashCommandMenu) return

  cloneCount++
  if (cloneCount > 1) return
  // Get the source element

  // Clone the source element. This will create a deep copy of the element and its descendants.
  let clonedElement = slashCommandMenu.cloneNode(true);

  // Create a new HTML document
  let newDoc = document.implementation.createHTMLDocument('New Document');

  // Copy the current document's styles and links to the new document
  let head = newDoc.head;
  Array.from(document.head.getElementsByTagName('style')).forEach(style => {
    head.appendChild(style.cloneNode(true));
  });
  Array.from(document.head.getElementsByTagName('link')).forEach(link => {
    head.appendChild(link.cloneNode(true));
  });

  newDoc.body.style.colorScheme = 'dark'
  newDoc.body.style.backgroundColor = 'rgb(13, 17, 23)'
  newDoc.body.style.color = 'rgb(240, 246, 252)'

  // Add the basic structure to the new document's body along with the cloned element
  newDoc.body.appendChild(clonedElement);

  // Optionally, launch a new window with the new document
  let newWindow = window.open();
  newWindow.document.write(newDoc.documentElement.outerHTML);
  newWindow.document.close();

  // Create a Blob containing the new document's HTML
  let htmlBlob = new Blob([newDoc.documentElement.outerHTML], { type: 'text/html' });

  // Create a link element for downloading the file
  let downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(htmlBlob);
  downloadLink.download = 'newDocument.html';  // Set the name of the downloaded file

  // Append the link to the document, trigger a click on it, and then remove it
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function parseComments() {
  const timeLineItems = document.querySelectorAll('.TimelineItem.js-comment-container')
  console.log(timeLineItems)

  // const dunno = timeLineItems[timeLineItems.length - 2]
  // console.log(dunno.textContent)
  // console.log(dunno.innerText)
  // console.log(dunno.textContent.replace(/\n/g, ' '))
  // const slashCmd = /(?:`| |\n)\/([a-zA-Z]+)/g.exec(dunno.textContent)
  // console.log(slashCmd)

  const parsedTimeline = []
  /**
   * {
   *  author: string,
   *  isArgo: string,
   *  date: Date,
   *  comment: string,
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
    // console.log(header.textContent.replace(/\n/g, ' '))
    const author = parseAuthorByHeader(header.innerText.trim().split(' '))
    timelineObj.author = author
    if (!author) {
      const textContentText = header.textContent.replace(/\n/g, ' ').split(' ').filter(Boolean)
      timelineObj.author = parseAuthorByHeader(textContentText)
    }
    timelineObj.isArgo = timelineObj.author.includes('pcln-argo')

    const dateElem = header.querySelector('a.js-timestamp').firstChild
    timelineObj.date = new Date(dateElem.getAttribute('datetime'))

    const commentBody = item.querySelector('.comment-body, .markdown-body, .js-comment-body')
    timelineObj.comment = commentBody.textContent.replace(/\n{3,}/g, '\n\n')
    const slashCmd = commentBody.textContent.matchAll(/(?: |\n)(\/[a-zA-Z]+)/gm)

    timelineObj.slashCommands = []
    for (const cmd of slashCmd) {
      timelineObj.slashCommands.push(cmd[1])
    }

    timelineObj.slashCommandLegend = timelineObj.comment.includes('Click here for all available commands.')

    // console.log(commentBody.textContent)
    // console.log(commentBody.innerText)
    const isSameCmd = timelineObj.slashCommands.length > 1 && timelineObj.slashCommands.every(cmd => cmd === timelineObj.slashCommands[0])
    if (isSameCmd && timelineObj.isArgo && commentBody.innerText.includes('request by')) {
      timelineObj.slashCommandAck = commentBody.innerText.includes('was processed')
      timelineObj.slashCommandAckText = commentBody.innerText.replace(timelineObj.slashCommands[0], '').trim()
    }
    const { author: auth, isArgo, slashCommandLegend, slashCommands, slashCommandAck, slashCommandAckText } = timelineObj
    console.log({ auth, isArgo, slashCommandLegend, slashCommandAck, slashCommandAckText })  

    if (header.textContent.includes('pcln-argo') && header.textContent.includes('commented')) {
      // if (slashCmd) {
      //   console.log(commentBody.textContent)
      //   console.log(commentBody.textContent.split('\n').filter(Boolean))
      //   console.log(slashCmd)
      // }
      // if (slashCmd) {
      //   console.log('✌️', slashCmd)
      //   console.log('✌️', commentBody.textContent.replace(/\n/g, ' '))
      // }
    }
  })
}

let count = 0

async function slashCommandMenu() {
  const slashCommandMenu = document.querySelector('.js-slash-command-menu');

  if (!slashCommandMenu) return
  count++
  if (count > 1) return

  slashCommandMenu.style.display = 'flex'
  slashCommandMenu.style.visibility = 'visible'
  slashCommandMenu.style.opacity = '1'

  const slashCommandModal = slashCommandMenu.children[0]
  const slashMenuHeader = slashCommandMenu.querySelector('header.SelectMenu-header')

  const container = document.createElement('div')
  container.id = 'ghext-new-container'
  container.style.border = '4px solid red'
  container.style.display = 'flex'

  const newMenu = buildSlashCommandMenu()

  container.appendChild(newMenu)
  container.appendChild(slashCommandModal)

  slashCommandMenu.replaceChildren(container)
  debugger
  // alert('hello')
}

function buildSlashCommandMenu() {
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
  slashMenuHeaderText.textContent = 'PCLN Slash Commands'
  slashMenuHeaderCopy.style.height = '36px'
  // slashMenuHeaderCopy.style.boxSizing = 'border-box'

  console.log(slashMenuHeaderCopy.children[slashMenuHeaderCopy.children.length - 1])
  const lastHeaderChild = slashMenuHeaderCopy.children[slashMenuHeaderCopy.children.length - 1]
  slashMenuHeaderCopy.removeChild(lastHeaderChild)

  
  
  const availableCmdHeader = document.createElement('div')
  availableCmdHeader.classList.add('SelectMenu-divider')
  availableCmdHeader.classList.add('js-group-divider')
  availableCmdHeader.innerText = 'Available Commands'
  // availableCmdHeader.style.boxSizing = 'border-box'
  availableCmdHeader.style.width = '100%'
  availableCmdHeader.style.height = '25px'
  
  newMenu.appendChild(slashMenuHeaderCopy)
  newMenu.appendChild(availableCmdHeader)
  
  // newMenu.innerHTML = `
  //   <div>
  //     <span>Hello</span>
  //   </div>
  // `
  return newMenu
}

function parseAuthorByHeader(headerText) {
  // return headerText.filter(s => (
  //   !['author', 'bot', 'commented'].includes(s.toLowerCase())
  // ))[0]
  // console.log(headerText)
  const idx = headerText.findIndex(s => ['bot','commented'].includes(s.toLowerCase()))
  // console.log(idx)
  // console.log(headerText[idx - 1])
  return headerText[idx - 1]
}
