# Agent Instructions

A Chrome extension + Python native-messaging host that clips web pages as markdown to a local folder. See `README.md` for install + usage and `ARCHITECTURE.md` for the wire protocol, frontmatter schema, and design notes.

## Conventions

- **Conventional commits.** `<type>(<scope>): <description>` with lowercase description. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`. Scopes: `extension`, `host`, `install`, `docs`, or omit when broad.
- **Commit messages** in sentence case, imperative mood. `feat(host): add WEB_INGEST_DIR override` — not "added", not "X added".
- **One logical change per commit.** Vendoring a new library, an extension change, a host change, and docs are separate commits.
- **Agent never pushes.** Stage and commit freely so the user inspects a committed diff, but `git push` is the user's responsibility — no exceptions, no flags, no dry-run.

## Critical: don't break the wire protocol

The native-messaging stdout channel is the protocol. **Do not** add `print()` calls, debug writes, or third-party libraries that log to stdout in `host/web-ingest-host.py`. Any extra bytes corrupt the message stream and Chrome silently disconnects with no error visible.

All diagnostic output in the host goes to `~/.local/state/web-ingest/host.log` via the `log()` helper. If you need to see what Chrome is sending, log it; never echo it.

## Working on the extension

- Manifest V3 — no remote code, ephemeral service workers, no `eval`. Vendor any new library into `extension/lib/`.
- After changing files, the unpacked extension at `chrome://extensions` needs to be reloaded (the circular-arrow icon, or disable + re-enable).
- The extension ID is stable across reloads from the same path. It changes if you delete + re-add the unpacked extension. After such a change, the user must re-run `scripts/install.sh <new-id>`.
- DOM extraction runs in the page's world via `chrome.scripting.executeScript`. The three injected files share scope; later files see globals set by earlier ones.

## Working on the host

- Single-file Python, PEP 723 header (no external deps beyond stdlib). Keep it that way unless there's a strong reason — avoids a venv setup tax.
- The `--no-build` design (script runs as-is, no install step) means the file Chrome calls is the file in the repo. Editing it takes effect on the next clip.
- The `Path.home() / ".local/state/web-ingest"` log directory is created on first call.

## Out of scope (don't drift into these without asking)

- Selection-only clipping
- Firefox support
- Per-domain extraction rules
- A bundler / build step for the extension
- Frontmatter customization beyond the three current fields
