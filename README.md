# Web Ingest

Chrome extension that clips the current web page as clean markdown to a local folder. No application launch, no cloud round-trip — the markdown lands in a directory of your choosing on disk.

> **Status:** v0.1 — works for one user (the author) on one Linux box. Useful but rough; expect missing edge cases.

## What it does (and doesn't)

**Does:**
- One-click clip of an article-shaped page → clean markdown on disk
- YAML frontmatter with title, source URL, and timestamp
- Configurable output directory
- Optional comment dialog before each clip (off by default)

**Doesn't (yet):**
- Selection-only clipping (it always extracts the whole article)
- Per-domain extraction tweaks
- Firefox (different native-messaging manifest schema)
- Anything on `chrome://`, `about:`, or non-article pages (search results, social feeds, dashboards) — Readability gives up and you get an `ERR` badge

## How it works

```
extension (Chrome) ──sendNativeMessage──▶ host (Python) ──writes──▶ ~/incoming/web/*.md
```

The extension extracts the article using Mozilla Readability and converts the HTML to markdown using Turndown. It hands the result to a small Python native-messaging host that writes the file with YAML frontmatter (title, source URL, timestamp).

## Install

Prerequisites: Google Chrome (or Chromium), [uv](https://docs.astral.sh/uv/) (used as the script runner via the host's `#!/usr/bin/env -S uv run --script` shebang — uv handles Python interpreter selection per the PEP 723 header), Linux.

1. **Clone the repo.**

   ```sh
   git clone https://github.com/cornelius/web-ingest.git
   cd web-ingest
   ```

   The extension and host run from the repo in place — no copy step.

2. **Load the extension unpacked.**
   - Open `chrome://extensions`, enable *Developer mode* (top-right toggle).
   - Click *Load unpacked* and select the `extension/` folder.
   - Note the extension ID Chrome assigns (a long lowercase alphanumeric string).

3. **Register the native messaging host.**

   ```sh
   ./scripts/install.sh <extension-id>
   ```

   This drops a manifest at `~/.config/google-chrome/NativeMessagingHosts/de.cornelius.web_ingest.json` pointing at `host/web-ingest-host.py` in this repo.

4. **(Optional) Choose where clips land.**

   ```sh
   export WEB_INGEST_DIR="$HOME/somewhere/else"
   ```

   Default is `~/incoming/web/`. The variable is read by the host on each invocation, so set it in your shell profile (or in a wrapper that launches Chrome) — Chrome must inherit the env.

5. **Restart Chrome** (or just disable + re-enable the extension) so it picks up the new manifest.

## Usage

Open any article, click the *Web Ingest* toolbar icon. A green `OK` badge appears for ~3 seconds when the file has been written; a red `ERR` badge means something went wrong (check the log).

Files are named `YYYY-MM-DD-HHmm--<title-slug>.md`.

### Adding a comment

The default flow is silent — click the icon, get the file. If you'd rather jot a note alongside each clip, open `chrome://extensions`, find *Web Ingest*, click *Details* → *Extension options*, and enable *Ask for a comment when clipping*. Once on, clicking the toolbar icon opens a small popup with a title preview and a textarea; type a note (or leave it empty), then *Save* (or `Ctrl/Cmd+Enter`). The comment is stored as a `comment:` field in the YAML frontmatter; an empty comment is omitted. Press `Esc` or *Cancel* to skip the clip.

## Configuration

| Knob | Default | Where |
|---|---|---|
| Output directory | `~/incoming/web/` | env var `WEB_INGEST_DIR` |
| Log file | `~/.local/state/web-ingest/host.log` | hard-coded in host script |
| Ask for a comment | off | extension options page (`chrome.storage.sync`) |

## Troubleshooting

- **Red `ERR` badge:** tail `~/.local/state/web-ingest/host.log` to see what the host saw, or `console.log` from `chrome://extensions` → *service worker* link.
- **Nothing happens:** verify the manifest exists at `~/.config/google-chrome/NativeMessagingHosts/de.cornelius.web_ingest.json` and that its `allowed_origins` matches your current extension ID. If you reload the extension unpacked, the ID may change — re-run `install.sh` with the new ID.
- **`chrome://` or `about:` pages:** the extension can't extract from them; you'll get a grey `SKIP` badge.

## Repo layout

```
extension/        — Chrome MV3 extension
  manifest.json
  background.js   — service worker; silent-clip path + popup toggle
  clip.js         — injected into the page; runs Readability + Turndown
  popup.{html,js} — comment dialog (shown when the option is on)
  options.{html,js} — options page with the comment-dialog toggle
  lib/            — vendored Readability.js (Apache 2.0) and Turndown (MIT)
  icons/          — placeholder PNGs (replace with real ones any time)
host/             — native messaging host
  web-ingest-host.py
  manifest.template.json
scripts/
  install.sh      — registers the host with Chrome
ARCHITECTURE.md   — wire protocol, frontmatter schema, design notes
```

## License

Code in this repo: MIT (see `LICENSE`). Vendored libraries retain their own licenses (see `extension/lib/LICENSES.md`).
