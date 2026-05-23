# Chrome Web Store submission

Tracking information used to prepare and maintain the Chrome Web Store listing. Agents updating this extension keep this file current as a side effect of changes to the manifest, permissions, code that touches user data, or store listing.

## Extension

- **Name:** Web Ingest
- **Manifest version:** 3
- **Current version:** 0.1.0 (see `extension/manifest.json`)
- **Category (proposed):** Productivity
- **Distribution status:** Not yet submitted to the Chrome Web Store. Available as unpacked load from the repo.

## Short description (under 132 characters)

Clip the current web page as clean markdown to a folder under your Downloads directory. No cloud, no companion process.

## Detailed description

Web Ingest turns the current web page into a clean Markdown file on your local disk. One click of the toolbar icon extracts the article body with Mozilla Readability, converts it to Markdown with Turndown, and writes the file to a configurable subdirectory under your Downloads folder. YAML frontmatter records the title, source URL, and clip timestamp; an optional comment dialog lets you attach a note before saving.

Nothing leaves your machine. The extension makes no network calls of its own and stores no data outside Chrome's own settings sync.

Use it for personal article archives, offline reading, knowledge-base ingestion, or any workflow where Markdown on disk is the destination.

## Single-purpose narrative

Web Ingest does one thing: clip the current page to a local Markdown file. It does not host content, render previews, sync to cloud services, or extract anything other than the current article on the active tab when the user clicks the toolbar action.

## Permissions

| Permission | Required because | Surface |
|---|---|---|
| `downloads` | Writes the Markdown file to the user's Downloads folder via `chrome.downloads.download` (the only file-write API available to MV3 extensions without a native host). | `extension/clip-writer.js` |
| `activeTab` | Reads the URL of the tab the user just clicked the action on, and authorizes the one-shot script injection that follows. Used in lieu of `<all_urls>` to keep the access click-driven. | `extension/background.js`, `extension/popup.js` |
| `scripting` | Injects `lib/readability.js`, `lib/turndown.js`, and `clip.js` into the active tab via `chrome.scripting.executeScript` to extract and convert the article. Required pair for the `activeTab` model. | `extension/background.js`, `extension/popup.js` |
| `storage` | Persists user preferences (`subdir`, `askForComment`) via `chrome.storage.sync` so they survive browser restart and follow the user across signed-in profiles. | `extension/options.js`, `extension/background.js`, `extension/popup.js` |

No host permissions are declared. The extension does not request `<all_urls>` or any specific origin.

## Data handling and privacy

- **No data leaves the device.** The extension makes no `fetch`, no `XMLHttpRequest`, no remote-resource loads. All vendored libraries (`lib/readability.js`, `lib/turndown.js`) ship in the package.
- **No analytics, no telemetry.** Zero third-party scripts.
- **Data the user produces:** Markdown files written to the user's chosen Downloads subdirectory. The file is created by Chrome's download manager and is fully owned by the user from that point.
- **Data the extension stores:** two preference keys (`subdir`, `askForComment`) in `chrome.storage.sync`. Chrome syncs these between the user's signed-in Chrome instances. No clip content is ever stored in this store.
- **Optional user input:** the comment textarea (when `askForComment` is enabled) is embedded in the clip's YAML frontmatter and written to the same Markdown file as the article. It is not transmitted or stored elsewhere.

## Privacy policy

Lives at `PRIVACY.md` in this repo. Public URL for the Web Store listing:

  https://github.com/cornelius/web-ingest/blob/main/PRIVACY.md

Substance: Web Ingest processes the current page only when the user clicks the toolbar action. Page content is converted to Markdown locally and written to the user's Downloads folder. No data is transmitted off the device. The extension stores two preference values in `chrome.storage.sync`; no other data is retained.

If the repository ever moves or the default branch is renamed, update both the URL above and the Web Store listing.

## Listing assets checklist

- [ ] 128x128 store icon (`extension/icons/icon-128.png` is the source; verify it satisfies the [icon spec](https://developer.chrome.com/docs/webstore/images#icons))
- [ ] Small promotional tile (440x280)
- [ ] At least one screenshot at 1280x800 or 640x400 showing a successful clip
- [ ] Optional: marquee promotional tile (1400x560)
- [ ] Support email
- [x] Privacy policy URL (https://github.com/cornelius/web-ingest/blob/main/PRIVACY.md)
- [ ] Single-purpose statement copied from this file

## Open questions / rejection-recovery notes

None yet (extension is pre-submission). Record any reviewer feedback or rejection reasons in this section as they arrive, so the next iteration of the listing has the full context.
