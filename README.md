# github-ext-links

Makes any external links in github open in a new tab.

## Installation

1. Clone this repository
2. Go to chrome://extensions
3. Click "Developer Mode" in the top right corner
4. Click "Load unpacked extension" or "Load unpacked"
5. Select the cloned repository (directory only)
6. It's better to pin the extension so you can easily access the menu

## Plugins

### Github

#### Open External Links in a New Tab
Makes any external links in github open in a new tab.

- **Open External Links In New Tab**: Disable or enable the feature

#### Modify Github Timestamps
Modifies the timestamps on github to include date and time.

- **Enable**: Disable or enable the feature
- **Only For PRs**: Only works when url includes `/pull/`
- **Date Formatting**: Select the date format

Default Format `MMM dd, yyyy, h:mm a zzz`
Accepted formats:
```md
yyyy (Full year, e.g., 2025)
yy (Two-digit year, e.g., 25)

MMMM (Full month name, e.g., June)
MMM (Abbreviated month name, e.g., Jun)
MM (Two-digit month, e.g., 06)
M (Numeric month, e.g., 6)

dd (Two-digit day, e.g., 24)
d (Numeric day, e.g., 24)

hh (12-hour format, two digits, e.g., 04)
h (12-hour format, e.g., 4)
HH (24-hour format, two digits, e.g., 14)
H (24-hour format, e.g., 14)

mm (Two-digit minutes, e.g., 15)
ss (Two-digit seconds, e.g., 30)

a (AM/PM marker)

zzz (Time zone abbreviation, e.g., EDT)
z (Time zone abbreviation)
```
Examples of Accepted Formats:
```md
yyyy-MM-dd (2025-06-24)
dd-MM-yyyy (24-06-2025)
MM/dd/yyyy (06/24/2025)
dd/MM/yyyy (24/06/2025)
yyyy-MM-dd HH:mm:ss (2025-06-24 14:15:30)
dd-MM-yyyy hh:mm:ss a (24-06-2025 02:15:30 PM)
MMM dd, yyyy (Jun 24, 2025)
MMMM dd, yyyy (June 24, 2025)
MMM dd, yyyy, hh:mm a (Jun 24, 2025, 02:15 PM)
MMM dd, yyyy, h:mm a zzz (Jun 24, 2025, 2:15 PM EDT)
```

### Tab Grouping
Opens new tabs grouped together with the originating tab and names the tabs intelligently. It is based on the source tab.

- **Group Tabs With Source Tab**: Disable or enable the feature
- **Rename Group**: The plugin will populate the dropdown with parsed names of the tabs that are grouped together. Appears only for predefined hosts.
- **Name Groups By**: Select the naming strategy for automatically naming new groups.
  - **url ext**: Parsed from the url
  - **tab title**: Parsed from the tab title
  ***NOTE***: This is a work in progress.

***NOTE***: Planning to add a priority feature meaning some tab names are more valuable than others. For instance `PIPE-1234` is more valuable than `pull/1234` and with an enable/disable toggle will auto rename the tab when new tabs are added to a group. I also want to add a configurable list so a user can set the priority by host name themselves.

### Tab Organization
Utilities for organizing tabs.
- **Clean Up Tabs**: Closes tabs that are deemed to be unnecessary. Current hosts (hardcoded)
    - `https://priceline.gpcloudservice.com/*`
    - `https://priceline.zoom.us/j/*`
    - `https://cloud.google.com/sdk/auth_success`
    - `https://awscpass.booking.com/*`

***NOTE***: Planning to make this configurable.

### Debug
When the **popup** local storage has a key/value `EXT_DEBUG: true`, the plugin will be enabled. Currently only contains printing information for debugging features.
