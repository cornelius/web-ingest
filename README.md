# Web Ingest

Chrome extension that clips the current web page as clean markdown to a local folder. No application launch, no cloud round-trip — the markdown lands in a directory of your choosing on disk.

## How it works

```
extension (Chrome) ──sendNativeMessage──▶ host (Python) ──writes──▶ ~/incoming/web/*.md
```

The extension extracts the article using Mozilla Readability and converts the HTML to markdown using Turndown. It hands the result to a small Python native-messaging host that writes the file with YAML frontmatter (title, source URL, timestamp).

## Install

Prerequisites: Google Chrome (or Chromium), Python 3.10+, Linux.

1. **Load the extension unpacked.**
   - Open `chrome://extensions`, enable *Developer mode*.
   - Click *Load unpacked* and select the `extension/` folder.
   - Note the extension ID Chrome assigns (a long alphanumeric string).

2. **Register the native messaging host.**

   ```sh
   ./scripts/install.sh <extension-id>
   ```

   This drops a manifest at `~/.config/google-chrome/NativeMessagingHosts/de.cornelius.web_ingest.json` pointing at `host/web-ingest-host.py` in this repo.

3. **(Optional) Choose where clips land.**

   ```sh
   export WEB_INGEST_DIR="$HOME/somewhere/else"
   ```

   Default is `~/incoming/web/`. The variable is read by the host on each invocation, so set it in your shell profile or in a Chrome-launch wrapper.

4. **Restart Chrome** (or just disable + re-enable the extension) so it picks up the new manifest.

## Usage

Open any article, click the *Web Ingest* toolbar icon. A green `OK` badge appears for ~3 seconds when the file has been written; a red `ERR` badge means something went wrong (check the log).

Files are named `YYYY-MM-DD-HHmm--<title-slug>.md`.

## Configuration

| Knob | Default | Where |
|---|---|---|
| Output directory | `~/incoming/web/` | env var `WEB_INGEST_DIR` |
| Log file | `~/.local/state/web-ingest/host.log` | hard-coded in host script |

## Troubleshooting

- **Red `ERR` badge:** tail `~/.local/state/web-ingest/host.log` to see what the host saw, or `console.log` from `chrome://extensions` → *service worker* link.
- **Nothing happens:** verify the manifest exists at `~/.config/google-chrome/NativeMessagingHosts/de.cornelius.web_ingest.json` and that its `allowed_origins` matches your current extension ID. If you reload the extension unpacked, the ID may change — re-run `install.sh` with the new ID.
- **`chrome://` or `about:` pages:** the extension can't extract from them; you'll get a grey `SKIP` badge.

## Repo layout

```
extension/        — Chrome MV3 extension
  manifest.json
  background.js   — service worker; orchestrates clip + send
  clip.js         — injected into the page; runs Readability + Turndown
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
