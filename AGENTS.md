# Agent Instructions

A Chrome extension that clips web pages as markdown into a subdirectory of the user's Downloads folder via `chrome.downloads`. See `README.md` for install + usage and `ARCHITECTURE.md` for the frontmatter schema and design notes.

## Conventions

- **Conventional commits.** `<type>(<scope>): <description>` with lowercase description. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Scope is usually `extension`, or omit when broad.
- **Commit messages** in sentence case, imperative mood. `feat(extension): add output subdirectory option` — not "added", not "X added".
- **One logical change per commit.** An extension change, a vendored-library change, and docs are separate commits.
- **Agent never pushes.** Stage and commit freely so the user inspects a committed diff, but `git push` is the user's responsibility — no exceptions, no flags, no dry-run.

## Working on the extension

- Manifest V3 — no remote code, ephemeral service workers, no `eval`. Vendor any new library into `extension/lib/`.
- After changing files, the unpacked extension at `chrome://extensions` needs to be reloaded (the circular-arrow icon, or disable + re-enable).
- DOM extraction runs in the page's world via `chrome.scripting.executeScript`. The three injected files (`lib/readability.js`, `lib/turndown.js`, `clip.js`) share scope; later files see globals set by earlier ones.
- The service worker can't use `URL.createObjectURL`. `clip-writer.js` encodes clip content as a `data:` URL for `chrome.downloads.download`; keep it that way unless you also add an offscreen document.
- `clip-writer.js` is shared between the service worker (`importScripts('clip-writer.js')`) and the popup (`<script src="clip-writer.js">`). Keep it free of DOM dependencies so both contexts can load it.

## Out of scope (don't drift into these without asking)

- Selection-only clipping
- Firefox support
- Per-domain extraction rules
- A bundler / build step for the extension
- Writing outside the Downloads tree (would mean re-introducing a native host or switching to the File System Access API)
- Frontmatter customization beyond the current fields
