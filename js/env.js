
const ENV = 'production'
const URLS_TO_HIJACK = [
    'https://github.com/pcln/',
    'https://g.codefresh.io/',
    'https://higgins.prod.pcln.com/',
    'https://higgins.dqs.pcln.com/',
    'https://priceline.atlassian.net/',
    'https://rundeck.prod.pcln.com/',
];

const REGISTRY = new Set();
const GLOBAL = {};
let STATE = {};
const BUILD_LOG = [];

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'sync') return;
    console.log('Settings changed:', namespace, changes);
    Object.entries(changes).forEach(([key, { newValue }]) => {
        STATE[key] = newValue;
    });
});

async function addCategory(categoryTitle, pluginPath, options = { priority: 0 }) {
    if (REGISTRY.has(categoryTitle)) return;
    const { priority } = options

    const root = document.querySelector('#root');

    const contentRaw = await fetch(pluginPath + '/popup.html')
    const categoryContentHTML = await contentRaw.text()

    // Create category item
    const categoryItem = document.createElement('li');
    categoryItem.className = 'category-item';
    categoryItem.id = categoryTitle;
    categoryItem.setAttribute('data-priority', priority);
    categoryItem.innerHTML = `
    <div class="category-header">
        <span class="category-title">${categoryTitle}</span>
        <span class="caret">&#9660;</span>
    </div>
    `;
    
    // Create category content
    const categoryContentDiv = document.createElement('div');
    categoryContentDiv.className = 'category-content';
    categoryContentDiv.innerHTML = categoryContentHTML;
    
    // Add click event to toggle
    categoryItem.childNodes[1].addEventListener('click', () => {
        root.childNodes.forEach(el => {
            if (el.id === categoryItem.id) return
            el.classList.remove('is-open');
            el.childNodes[3].classList.remove('active')
        })
        categoryItem.classList.toggle('is-open');
        categoryContentDiv.classList.toggle('active');
    });

    // Add content to category item
    categoryItem.appendChild(categoryContentDiv);

    // Append to root div
    const index = Array.from(root.childNodes.values()).findIndex(el => (
        Number(el.getAttribute('data-priority')) < priority
    ))
    BUILD_LOG.push(`Inserting ${categoryTitle} at index ${index} out of ${root.childNodes.length} others, before node ${root.childNodes[index]?.id}`);
    root.insertBefore(categoryItem, root.childNodes[index]);

    // Add stylesheet
    try {
        const stylesExist = await fetch(pluginPath + '/style.css')
        if (stylesExist) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = pluginPath + '/style.css';
            document.head.appendChild(link);
        }
    } catch (err) {
        console.log(`Styles for ${categoryTitle} not found -`, err.message)
    }

    // Add to register
    REGISTRY.add(categoryTitle);
}

async function loadState(defaultStateOrKeys) {
    let keys = ['_keys']
    if (!defaultStateOrKeys) { // get full state
        const allKeys = await chrome.storage.sync.get(keys)
        keys = [ ...allKeys._keys ]
    } else {
        const stateKeys = Array.isArray(defaultStateOrKeys) ? defaultStateOrKeys : Object.keys(defaultStateOrKeys)
        keys.push(...stateKeys)
    }
    const savedState = await chrome.storage.sync.get(keys)
    const dataKeys = [ ...(savedState._keys || []) ]

    const newKeys = {}
    for (const key of keys) {
        if (Array.isArray(defaultStateOrKeys)) break;
        if (!savedState.hasOwnProperty(key)) {
            newKeys[key] = defaultStateOrKeys[key]
        }
        if (!dataKeys.includes(key)) {
            dataKeys.push(key)
        }
    }

    if (Object.keys(newKeys).length) {
        chrome.storage.sync.set({ ...newKeys, _keys: dataKeys })
        savedState._keys = dataKeys
    }

    STATE = { ...STATE, ...savedState, ...newKeys }
}

console.log('loaded env')
