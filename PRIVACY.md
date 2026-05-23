# Privacy Policy

*Last updated: 2026-05-23*

Web Ingest is a Chrome extension that converts the current web page to a Markdown file and writes it to a folder under your Downloads directory. This policy describes what the extension does and does not do with your data.

## What the extension does NOT do

- **No network requests.** The extension does not contact any server — not the developer's, not a third party's, not anywhere. All article extraction, Markdown conversion, and file writing happen locally in your browser.
- **No analytics, no telemetry, no third-party scripts.** Mozilla Readability and Turndown are bundled with the extension and run entirely in the page's context.
- **No data collected, transmitted, or shared with anyone, ever.**

## Data the extension creates on your machine

Two categories of data exist as a result of using the extension. Both stay on your device, fully under your control.

1. **Clip files.** When you click the toolbar icon (or save from the comment popup), the extension writes a Markdown file under the Downloads subdirectory you configured. The file contains the extracted article body and YAML frontmatter (title, source URL, timestamp, and your optional comment). These files are yours. The extension never reads them back or transmits them.

2. **Preferences.** Two values are stored via `chrome.storage.sync`:
   - `subdir` — the Downloads subdirectory you chose in the options page.
   - `askForComment` — whether the comment popup is enabled.

   Chrome syncs these between your own signed-in Chrome instances if you have Chrome Sync turned on. They are not visible to the developer or any third party.

## Permissions

The extension requests four permissions, all narrowly scoped to its single purpose:

- `downloads` — write the Markdown file to your Downloads folder.
- `activeTab` — read the URL of the tab you clicked the action on, and inject the extraction code into it.
- `scripting` — pair with `activeTab` to inject Readability, Turndown, and the clip logic.
- `storage` — persist your two preferences.

None of these permissions are used for anything other than the actions described above.

## Your control

- Disable or uninstall the extension at `chrome://extensions` at any time.
- Clear preferences by uninstalling the extension (or by editing `chrome.storage.sync` from the developer console).
- Delete clip files like any other file in your Downloads folder.

## Contact

Open an issue at <https://github.com/cornelius/web-ingest/issues>.

## Changes to this policy

If this policy changes, the updated version will be committed to this file. The git history of this repository serves as the change log.
