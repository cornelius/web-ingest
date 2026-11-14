# Extension publishing

Tracking metadata, permission justifications, privacy stance, and per-store listing details for every browser-extension store this extension targets. Maintained alongside the code; updated whenever the manifest, permissions, or data flow change.

`CHROMEWEBSTORE.md` at the repo root is a thin pointer to this file. That filename is the [Chrome-team-recommended convention](https://developer.chrome.com/docs/extensions/ai/build_with_ai); keeping the pointer means agents told to "update CHROMEWEBSTORE.md" still land here.

## Extension

- **Name:** Web Ingest
- **Manifest version:** 3
- **Current version:** 0.1.0 (see `extension/manifest.json`)
- **Category (proposed):** Productivity

## Developer accounts

Support email and developer-account login on both stores: `developer@cornelius.tech`.

## Distribution status

| Store | Status | Listing URL |
|---|---|---|
| Chrome Web Store | Not yet submitted | (TBD after submission) |
| Microsoft Edge Add-ons | Not yet submitted | (TBD after submission) |
| GitHub (unpacked load) | Available | https://github.com/cornelius/web-ingest |

## Short description (manifest `description`, surfaced as the listing short description)

> Clip the current web page as clean markdown to a folder under your Downloads directory. No cloud, no companion process.

Under 132 characters (Chrome Web Store limit). Used verbatim by both stores; to change it, edit `extension/manifest.json` and re-upload the package.

## Long description (entered on each store listing form)

> Web Ingest turns the current web page into a clean Markdown file on your local disk. One click of the toolbar icon extracts the article body with Mozilla Readability, converts the HTML to Markdown with Turndown, and writes the file to a configurable subdirectory under your Downloads folder. YAML frontmatter records the title, source URL, and the timestamp of the clip. An optional comment dialog lets you attach a note that lands in the same frontmatter, useful for marking why a page is worth keeping.
>
> Nothing leaves your machine. The extension makes no network requests of its own, ships no analytics, no telemetry, and no third-party scripts. Mozilla Readability and Turndown are vendored, not loaded remotely. The only data the extension persists is two preference values in Chrome's own settings sync (`subdir` and `askForComment`).
>
> Typical uses: personal article archives, offline reading queues, knowledge-base ingestion, agent-readable Markdown corpora, or any workflow where the destination is "Markdown on disk".

Roughly 950 characters. Comfortably above Edge's 250-character minimum and well below Chrome's and Edge's 10,000-character maximum.

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

## Remote code

The extension loads no remote code. Both vendored libraries (`lib/readability.js`, `lib/turndown.js`) ship in the package. Edge's "Are you using remote code?" prompt: **No**.

## Privacy policy

Lives at `PRIVACY.md` in this repo. Public URL used on each store listing:

> https://github.com/cornelius/web-ingest/blob/main/PRIVACY.md

If the repository ever moves or the default branch is renamed, update the URL above and re-enter it on both store listings.

## Building the package

Both stores take the same zip of `extension/`. Bump `version` in `extension/manifest.json` first for every upload after the initial one; the stores reject a package whose version is not higher than the published one.

```
cd extension
zip -r ../web-ingest-<version>.zip . -x '*.DS_Store'
unzip -l ../web-ingest-<version>.zip
```

The listing should show `manifest.json`, `background.js`, `clip.js`, `clip-writer.js`, `popup.{html,js}`, `options.{html,js}`, `lib/`, `icons/` and nothing else. The zip is a build artifact: do not commit it, delete it after uploading.

---

## Chrome Web Store

- **Dashboard:** https://chrome.google.com/webstore/devconsole
- **One-time developer fee:** $5 USD.
- **Icon spec:** https://developer.chrome.com/docs/webstore/images#icons (96x96 of artwork inside the 128x128 canvas with 16 px transparent padding; icons without alpha get wrapped by Chrome in a 12 px rounded frame).
- **Review timeline:** typically days, occasionally up to a few weeks for first-time submissions.

### Listing assets checklist (Chrome)

- [x] 128x128 store icon (`extension/icons/icon-128.png`; verify against the icon spec at submission time)
- [x] Small promotional tile 440x280 (`store-assets/promo-small.png`)
- [x] At least one screenshot at 1280x800 or 640x400 showing a successful clip (`store-assets/screenshots/`)
- [x] Marquee promotional tile 1400x560 (`store-assets/promo-marquee.png`)
- [x] Support email: `developer@cornelius.tech` (see Developer accounts above)
- [x] Privacy policy URL (above)
- [x] Single-purpose statement (above)
- [x] Permission justifications (above)

### Dashboard fields (Chrome)

The account needs 2-Step Verification before it can publish.

- **Package:** upload the zip from "Building the package".
- **Store listing tab:** long description (above), screenshots and both promo tiles from `store-assets/`, category Productivity, language English.
- **Privacy practices tab:** single-purpose narrative, one justification per permission from the Permissions table, data usage "no data collected" with the limited-use certifications, privacy policy URL.
- **Distribution tab:** visibility public, all regions.

---

## Microsoft Edge Add-ons

- **Dashboard:** https://partner.microsoft.com/dashboard/microsoftedge
- **One-time developer fee:** none (free).
- **Same `.zip` of `extension/`** as Chrome; no manifest changes required.
- **Certification timeline:** up to 7 business days.

### Listing assets checklist (Edge)

- [x] Extension logo (1:1, 300x300 recommended, 128x128 minimum; `extension/icons/icon-128.png` meets the minimum)
- [x] Long description (>= 250 characters, see above)
- [x] Small promotional tile 440x280 (`store-assets/promo-small.png`, same file as Chrome's)
- [x] Large promotional tile 1400x560 (`store-assets/promo-marquee.png`, same file as Chrome's marquee)
- [x] Screenshots (640x480 or 1280x800; same files as Chrome's listing, `store-assets/screenshots/`)
- [ ] YouTube video URL (optional)
- [ ] Search terms (up to 7 terms / 21 words total)
- [x] Support contact detail: `developer@cornelius.tech` (see Developer accounts above)
- [x] Privacy policy URL (same as Chrome)

### Edge-specific declarations

- **Single Purpose Description:** as above.
- **Permission justification:** copy the four justifications from the Permissions table.
- **Remote code:** No.
- **Data usage:** Select "No data collected", certify the limited-use disclosures.
- **Visibility:** Public.
- **Markets:** all (default).
- **Properties:** category Productivity, website https://github.com/cornelius/web-ingest, support contact `developer@cornelius.tech`.
- **Search terms (suggestions):** `markdown clipper`, `web clipper`, `readability`, `download as markdown`, `article archive`.

---

## Open questions / rejection-recovery notes

None yet (pre-submission to either store). Record any reviewer feedback or rejection reasons here as they arrive, so the next iteration of either listing carries the full context. Per-store sub-sections may be added as needed.
