
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

/**
 * 
 * HELPER FUNCTIONS
 * 
 */

function abbreviateRelative(relative) {
  let result = relative
  result = result.replace('second', 'sec')
  result = result.replace('minute', 'min')
  result = result.replace('hour', 'hr')
  return result
}

function formatDate(date, format) {
    const dateObj = new Date(date);

    const daysOfWeek = {
        0: { short: 'Su', medium: 'Sun', long: 'Sunday' },
        1: { short: 'Mo', medium: 'Mon', long: 'Monday' },
        2: { short: 'Tu', medium: 'Tue', long: 'Tuesday' },
        3: { short: 'We', medium: 'Wed', long: 'Wednesday' },
        4: { short: 'Th', medium: 'Thu', long: 'Thursday' },
        5: { short: 'Fr', medium: 'Fri', long: 'Friday' },
        6: { short: 'Sa', medium: 'Sat', long: 'Saturday' },
    }

    const reduceDaysOfWeek = (type) => Object.entries(daysOfWeek).reduce((acc, [key, val]) => {
        return { ...acc, [key]: val[type] }
    }, {})

    const formatMap = {
        'yyyy': { year: 'numeric' },
        'yy': { year: '2-digit' },
        'MMMM': { month: 'long' },
        'MMM': { month: 'short' },
        'MM': { month: '2-digit' },
        'M': { month: 'numeric' },
        'dd': { day: '2-digit' },
        'd': { day: 'numeric' },
        'HH': { hour: '2-digit', hour12: false },
        'H': { hour: 'numeric', hour12: false },
        'hh': { hour: '2-digit', hour12: true },
        'h': { hour: 'numeric', hour12: true },
        'mm': { minute: '2-digit' },
        'ss': { second: '2-digit' },
        'a': { hour: '2-digit', hour12: true },
        'zzz': { timeZoneName: 'short' },
        'z': { timeZoneName: 'short' },
        'DDD': reduceDaysOfWeek('long'),
        'DD': reduceDaysOfWeek('medium'),
        'D': reduceDaysOfWeek('short'),
    };


    const formatTokens = Object.keys(formatMap).join('|')
    const regexp = new RegExp(`(${formatTokens})`)

    const tokenSplit = format.split(regexp).map(token => {
        const option = formatMap[token]
        if (!option) return token
        if (['DDD','DD','D'].includes(token)) {
            const dayOfWeek =  dateObj.getDay()
            return option[dayOfWeek]
        }

        const formatted = new Intl.DateTimeFormat('en-US', option).format(dateObj);
        if (['hh', 'h'].includes(token)) {
            return formatted.split(' ')[0]
        }
        if (['a','zzz','z'].includes(token)) {
            return formatted.split(' ')[1]
        }
        if (['mm','ss'].includes(token)) {
            return formatted.padStart(2, '0')
        }
        return formatted
    }).join('').trim()
   
    return tokenSplit
}



console.log('loaded env')
