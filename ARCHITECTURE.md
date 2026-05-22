# Architecture

## Components

```
┌─────────────────────────────────────────────────┐    chrome.downloads    ┌────────────────────────────┐
│  Chrome extension (MV3)                          │ ───────────────────▶  │  <Downloads>/web-clips/    │
│  - background.js (service worker)                │   data: URL with      │    YYYY-MM-DD-HHmm-        │
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

3. Chrome writes the file under the user's configured Downloads directory.

Optional comment dialog: when the `askForComment` setting (in `chrome.storage.sync`) is on, the service worker sets `chrome.action.setPopup({ popup: 'popup.html' })`. Chrome then opens `popup.html` on click instead of firing `onClicked`; `popup.js` runs the same extraction + `saveClip` flow with the user's comment attached. `popup.html` loads `clip-writer.js` as a regular `<script>` so the popup and the service worker share the exact same save path.

## Filename and content

Filename: `YYYY-MM-DD-HHmm-<title-slug>.md` where the slug is lowercase, Unicode letter/digit/hyphen only (using `\p{L}\p{N}` in JS regex), max 60 chars. Timestamps are in the user's local timezone.

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

YAML strings are quoted whenever they contain characters that would require it (or whitespace at the boundaries) — this avoids parser surprises across YAML implementations. Embedded newlines in a quoted scalar are encoded as `\n` rather than literal line breaks, so a multiline comment stays on one frontmatter line.

## Configuration

| Knob | Mechanism | Default |
|---|---|---|
| Output subdirectory | `chrome.storage.sync` key `subdir` (options page) | `web-clips` |
| Downloads root | Chrome's own setting (`chrome://settings/downloads`) | OS-dependent (`~/Downloads/` on Linux/macOS) |
| Ask for a comment | `chrome.storage.sync` key `askForComment` (options page) | `false` |

The final on-disk path is `<Chrome's Downloads dir>/<subdir>/YYYY-MM-DD-HHmm-<slug>.md`. The extension cannot write outside the Downloads tree — that's a `chrome.downloads` API constraint, not a config choice.

`subdir` may contain forward slashes to nest further (e.g. `notes/web` → `<Downloads>/notes/web/`). Leading and trailing slashes are stripped. Empty means write directly into Downloads.

## Why this shape

The previous design used a native-messaging host (a small Python script) to write files to any path the user chose. That was more flexible (`~/incoming/web/`, env-var overrides) but cost the user a per-machine install step: dropping a JSON manifest into `~/.config/google-chrome/NativeMessagingHosts/` and keeping its `allowed_origins` in sync with the loaded extension's ID. Moving to `chrome.downloads` removes the host process, the install script, the Chrome-side native-messaging manifest, and the extension-ID coupling, at the cost of being locked to the Downloads tree.

## Design notes / gotchas

- **Service workers can't use `URL.createObjectURL`.** MV3 service workers don't have the Blob URL machinery, so we encode the markdown as a `data:` URL with `encodeURIComponent`. For typical articles (~10-100 KB of markdown) this is fine; for very large pages the encoded URL stays well under Chrome's `data:` URL practical ceiling.
- **`chrome.downloads.download` surfaces every clip in Chrome's download tray.** There's no per-extension way to suppress this in MV3. `chrome.downloads.setShelfEnabled(false)` is global and gated behind a permission we deliberately don't ask for.
- **Filename validation is Chrome's.** Forward slashes are interpreted as directory separators. `..` segments and absolute paths (`/foo`) are rejected. Bad input produces a runtime error visible in the service-worker console.
- **`chrome.action.setPopup` is persisted by Chrome**, so the popup setting survives service-worker shutdown without needing to be re-applied on every event. We re-sync from storage only on `onInstalled`, `onStartup`, and `storage.onChanged` — not in the click handler, which would race with Chrome's own decision to open the popup or fire `onClicked`.
- **No remote code in MV3.** Readability and Turndown must be vendored, not loaded from a CDN. They are.
- **Readability does best on article-shaped pages.** Search results, social feeds, and dashboards will produce poor markdown or nothing. The grey `SKIP` badge handles `chrome://` / `about:` pages but not "this page is structurally not an article" — those will produce a red `ERR` badge.
- **Manifest-V3 service workers are ephemeral.** Don't store state in `background.js` globals — they get reaped between events. The extension is currently stateless aside from `chrome.storage.sync`.

## Out of scope (for now)

- Selection-only clipping (clip just `window.getSelection()`)
- Per-domain extraction tweaks
- Firefox support (different MV3 + downloads API surface; small port)
- Writing outside the Downloads tree (would require returning to a native-messaging host or moving to the File System Access API with a popup-per-clip flow)
- Dedup by URL hash, tagging, content cleanup beyond Turndown defaults
