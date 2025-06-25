# Browser Utils

Makes any external links in github open in a new tab.

---

## Installation

1. Clone this repository
2. Go to chrome://extensions
3. Click "Developer Mode" in the top right corner
4. Click "Load unpacked extension" or "Load unpacked"
5. Select the cloned repository (directory only)
6. It's better to pin the extension so you can easily access the menu

---

## Plugins

- Github
  - Open External Links in a New Tab
  -

### Github

#### Open External Links in a New Tab
Makes any external links in github open in a new tab.

- **Open External Links In New Tab**: Disable or enable the feature

#### Modify Github Timestamps
Modifies the timestamps on github to include date and time.

- **Enable**: Disable or enable the feature
- **Only For PRs**: Only works when url includes `/pull/`
- **Date Formatting**: Select the date format

_Default Format_: `MMM dd, yyyy, h:mm a zzz`
**Accepted formats**:
| Token | Example | Description |
| ----- | ------- | ----------- |
| yyyy  | 2025    | Full year   | 
| yy    | 25      | Two-digit year | 
| MMMM  | June    | Full month name |
| MMM   | Jun     | Abbreviated month name |
| MM    | 06      | Two-digit month |
| M     | 6       | Numeric month |
| dd    | 24      | Two-digit day |
| d     | 24      | Numeric day |
| hh    | 04      | 12-hour format, two digits |
| h     | 4       | 12-hour format |
| HH    | 14      | 24-hour format, two digits |
| H     | 14      | 24-hour format |
| mm    | 15      | Two-digit minutes |
| ss    | 30      | Two-digit seconds |
| a     | PM      | AM/PM marker |
| zzz   | EDT     | Time zone abbreviation |
| z     | EDT     | Time zone abbreviation |
| DDD   | Wednesday | Long day of week |
| DD    | Wed     | Medium day of week |
| D     | We      | Short day of week |

**Examples of Accepted Formats**:
| Date Format | Result |
| ----------- | ------ |
| yyyy-MM-dd | 2025-06-24 |
| dd-MM-yyyy | 24-06-2025 |
| D MM/dd/yyyy | Tu 06/24/2025 |
| dd/MM/yyyy | 24/06/2025 |
| yyyy-MM-dd HH:mm:ss | 2025-06-24 14:15:30 |
| dd-MM-yyyy hh:mm:ss a | 24-06-2025 02:15:30 PM |
| MMM dd, yyyy (DD) | Jun 24, 2025 (Tue) |
| MMMM dd, yyyy | June 24, 2025 |
| MMM dd, yyyy, hh:mm a | Jun 24, 2025, 02:15 PM |
| DDD MMM dd, yyyy, h:mm a zzz | Tuesday Jun 24, 2025, 2:15 PM EDT |

---

### Tab Grouping
Opens new tabs grouped together with the originating tab and names the tabs intelligently. It is based on the source tab.

- **Group Tabs With Source Tab**: Disable or enable the feature
- **Rename Group**: The plugin will populate the dropdown with parsed names of the tabs that are grouped together. Appears only for predefined hosts.
- **Name Groups By**: Select the naming strategy for automatically naming new groups.
  - **url ext**: Parsed from the url
  - **tab title**: Parsed from the tab title
  ***NOTE***: This is a work in progress.

***NOTE***: Planning to add a priority feature meaning some tab names are more valuable than others. For instance `PIPE-1234` is more valuable than `pull/1234` and with an enable/disable toggle will auto rename the tab when new tabs are added to a group. I also want to add a configurable list so a user can set the priority by host name themselves.

---

### Tab Organization
Utilities for organizing tabs.
- **Clean Up Tabs**: Closes tabs that are deemed to be unnecessary. Current hosts (hardcoded)
    - `https://priceline.gpcloudservice.com/*`
    - `https://priceline.zoom.us/j/*`
    - `https://cloud.google.com/sdk/auth_success`
    - `https://awscpass.booking.com/*`

***NOTE***: Planning to make this configurable.

---

### Debug
When the **popup** local storage has a key/value `EXT_DEBUG: true`, the plugin will be enabled. Currently only contains printing information for debugging features.
