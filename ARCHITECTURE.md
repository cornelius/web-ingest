# Architecture

## Components

```
┌─────────────────────────────────────────────────┐    chrome.downloads    ┌────────────────────────────┐
│  Chrome extension (MV3)                          │ ───────────────────▶  │  <Downloads>/web-clips/    │
│  - background.js (service worker)                │   data: URL with      │    YYYYMMDDTHHmm-          │
│  - clip.js (injected into page)                  │   markdown + frontmt. │    <slug>.md               │
│  - clip-writer.js (slug + frontmatter + save)    │                       └────────────────────────────┘
│  - Readability + Turndown (vendored)             │
└─────────────────────────────────────────────────┘
```

One component: the extension. The whole pipeline (extract, convert, format, save) runs inside Chrome.

1. The user clicks the toolbar action. The service worker (`background.js`) injects three scripts into the active tab via `chrome.scripting.executeScript({ files: [...] })`:
   - `lib/readability.js` — sets the `Readability` global
   - `lib/turndown.js` — sets the `TurndownService` global
   - `clip.js` — IIFE that calls both, returns `{title, markdown}`

2. The service worker imports `clip-writer.js` via `importScripts` and calls `saveClip(...)`, which:
   - Slugifies the title into a filename
   - Builds the YAML frontmatter
   - Concatenates frontmatter + markdown into one string
   - Encodes that as a `data:text/markdown;charset=utf-8,...` URL
   - Calls `chrome.downloads.download({ url, filename, saveAs: false, conflictAction: 'uniquify' })`
   - Awaits the terminal `complete` state on `chrome.downloads.onChanged`, or rejects on `interrupted` with the reason Chrome reported

3. Chrome writes the file under the user's configured Downloads directory. The `OK` badge fires only after the download has reached the `complete` state, so a disk-full or permission failure surfaces as `ERR` with the interruption reason on the toolbar tooltip.

Optional comment dialog: when the `askForComment` setting (in `chrome.storage.sync`) is on, the service worker sets `chrome.action.setPopup({ popup: 'popup.html' })`. Chrome then opens `popup.html` on click instead of firing `onClicked`; `popup.js` runs the same extraction + `saveClip` flow with the user's comment attached. `popup.html` loads `clip-writer.js` as a regular `<script>` so the popup and the service worker share the exact same save path.

## Filename and content

Filename: `YYYYMMDDTHHmm-<title-slug>.md` where the slug is the NFC-normalized, lowercased title reduced to Unicode letters, combining marks, digits and hyphens (`\p{L}\p{M}\p{N}`), capped at 60 code points and 200 UTF-8 bytes so the filename stays under the 255-byte limit of common filesystems. Truncation works on code points, so it never leaves a lone surrogate. The timestamp is ISO 8601 basic format (no separators in date or time) so the filename is parseable as ISO 8601 and safe on every filesystem. Times are in the user's local timezone.

Collisions: `chrome.downloads.download` is called with `conflictAction: 'uniquify'`, so Chrome appends ` (1)`, ` (2)`, etc. for filename collisions instead of overwriting.

Frontmatter:

```yaml
---
title: "The Title of the Article"
url: "https://example.com/article"
clipped_at: "2026-05-23T22:05:31.000Z"
comment: "optional, only present when a non-empty comment was supplied"
---

# Article body in markdown
```

`clipped_at` is the ISO-8601 UTC timestamp from `new Date().toISOString()`. The filename timestamp is local time and uses a different format; this is intentional — filenames sort better in local time, frontmatter is unambiguous in UTC.

YAML strings are *always* double-quoted, regardless of content. The "only quote when needed" path got tangled in yaml's reserved words (`null`, `true`, `yes`, `~`, plain integers, leading flow indicators) and missed tab and CR. Unconditional quoting is a few extra bytes and zero ambiguity. Escapes cover `\`, `"`, `\n`, `\r`, and `\t`, so a multiline comment stays on one frontmatter line.

## Configuration

| Knob | Mechanism | Default |
|---|---|---|
| Output subdirectory | `chrome.storage.sync` key `subdir` (options page) | `web-clips` |
| Downloads root | Chrome's own setting (`chrome://settings/downloads`) | OS-dependent (`~/Downloads/` on Linux/macOS) |
| Ask for a comment | `chrome.storage.sync` key `askForComment` (options page) | `false` |

The final on-disk path is `<Chrome's Downloads dir>/<subdir>/YYYYMMDDTHHmm-<slug>.md`. The extension cannot write outside the Downloads tree — that's a `chrome.downloads` API constraint, not a config choice.

`subdir` may contain forward slashes to nest further (e.g. `notes/web` → `<Downloads>/notes/web/`). Leading and trailing slashes are stripped. Empty means write directly into Downloads. The options page validates input on every keystroke (debounced 300 ms before persisting) and rejects backslashes, control characters, the characters `< > : " | ? *`, empty or `.`/`..` segments, and segments that start with a space or end with a space or dot. Bad values surface as inline error text under the field. `saveClip` runs the same check (`validateSubdir` in `clip-writer.js`), so a bad value arriving through sync from another device fails with a message naming the subdirectory.

## Why this shape

Writing through `chrome.downloads` needs no companion process and no per-machine install step, at the cost of being limited to the Downloads tree.

## Design notes / gotchas

- **Service workers can't use `URL.createObjectURL`.** MV3 service workers don't have the Blob URL machinery, so we encode the markdown as a `data:` URL with `encodeURIComponent`. Percent-encoding inflates non-ASCII text up to threefold, and the largest `data:` URL Chrome accepts here has not been measured, so a very large page in a non-Latin script is the case most likely to fail.
- **`chrome.downloads.download` surfaces every clip in Chrome's download tray.** There's no per-extension way to suppress this in MV3. `chrome.downloads.setShelfEnabled(false)` is global and gated behind a permission we deliberately don't ask for.
- **Filename validation is Chrome's.** Forward slashes are interpreted as directory separators. `..` segments and absolute paths (`/foo`) are rejected. Bad input produces a runtime error visible in the service-worker console.
- **`chrome.action.setPopup` is re-applied from storage, never decided per click.** The worker re-syncs it from storage each time it starts, on `onInstalled` and `onStartup`, and on `storage.onChanged`, so it holds whatever Chrome keeps across restarts and extension reloads. It is never set in the click handler, which would race with Chrome's own decision to open the popup or fire `onClicked`.
- **No remote code in MV3.** Readability and Turndown must be vendored, not loaded from a CDN. They are.
- **Readability does best on article-shaped pages.** Search results, social feeds, and dashboards will produce poor markdown or nothing. The grey `SKIP` badge handles pages that are not http(s) (`chrome://`, `about:`, `file://`) but not "this page is structurally not an article" — those will produce a red `ERR` badge.
- **Manifest-V3 service workers are ephemeral.** Don't store state in `background.js` globals — they get reaped between events. The extension is currently stateless aside from `chrome.storage.sync`.
- **Action badge and title are per-tab.** Every `setBadgeText` / `setBadgeBackgroundColor` / `setTitle` call passes `tabId`, so clipping in tab A and switching to tab B leaves B with its own state. A failed clip puts the error message on the toolbar tooltip via `setTitle`, so the user can hover the icon instead of opening the service-worker console.

## Out of scope (for now)

- Selection-only clipping (clip just `window.getSelection()`)
- Per-domain extraction tweaks
- Firefox support (different MV3 + downloads API surface; small port)
- Writing outside the Downloads tree (would require returning to a native-messaging host or moving to the File System Access API with a popup-per-clip flow)
- Dedup by URL hash, tagging, content cleanup beyond Turndown defaults
