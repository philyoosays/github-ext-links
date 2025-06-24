# github-ext-links

Makes any external links in github open in a new tab.

## Installation

1. Clone this repository
2. Go to chrome://extensions
3. Click "Developer Mode" in the top right corner
4. Click "Load unpacked extension" or "Load unpacked"
5. Select the cloned repository (directory only)

## Plugins

### Github

#### Open External Links in a New Tab
Makes any external links in github open in a new tab.

- **Open External Links In New Tab**: Disable or enable the feature

#### Modify Github Timestamps
Modifies the timestamps on github to include date and time.

- **Enable**: Disable or enable the feature
- **Only For PRs**: Only works when url includes `/pull/`

#### Tab Grouping
Opens new tabs grouped together with the originating tab and names the tabs intelligently. It is based on the source tab.

- **Group Tabs With Source Tab**: Disable or enable the feature
- **Rename Group**: The plugin will populate the dropdown with parsed names of the tabs that are grouped together. Appears only for predefined hosts.
- **Name Groups By**: Select the naming strategy for automatically naming new groups.
  - **url ext**: Parsed from the url
  - **tab title**: Parsed from the tab title
  ***NOTE***: This is a work in progress.

***NOTE***: Planning to add a priority feature meaning some tab names are more valuable than others. For instance `PIPE-1234` is more valuable than `pull/1234` and with an enable/disable toggle will auto rename the tab when new tabs are added to a group. I also want to add a configurable list so a user can set the priority by host name themselves.

#### Tab Organization
Utilities for organizing tabs.
- **Clean Up Tabs**: Closes tabs that are deemed to be unnecessary. Current hosts (hardcoded)
    - `https://priceline.gpcloudservice.com/*`
    - `https://priceline.zoom.us/j/*`
    - `https://cloud.google.com/sdk/auth_success`
    - `https://awscpass.booking.com/*`
***NOTE***: Planning to make this configurable.

#### Debug
When the **popup** local storage has a key/value `EXT_DEBUG: true`, the plugin will be enabled. Currently only contains printing information for debugging features.
