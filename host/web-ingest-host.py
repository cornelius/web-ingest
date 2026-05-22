#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# ///
"""Native messaging host for the Web Ingest Chrome extension.

Reads a single length-prefixed JSON message on stdin, writes the markdown
payload to disk under the configured output directory, and replies with
{ok, path} or {ok: false, error}.

Output directory precedence: message field `output_dir` (set via the
extension's options page), then env var WEB_INGEST_DIR, then ~/incoming/web.

Optional fields on the incoming message:
- comment: free-text note from the user, written to frontmatter when non-empty.
- output_dir: overrides WEB_INGEST_DIR and the built-in default. Empty or
  whitespace-only values are ignored.

Wire protocol: 4 bytes native-endian unsigned int (message length in bytes),
then that many bytes of UTF-8 JSON. Both directions.

Critical: NEVER write to stdout outside send_message(). Any extra bytes on
stdout corrupt the protocol and the extension silently disconnects. All
diagnostic output goes to the log file.
"""
from __future__ import annotations

import json
import os
import re
import struct
import sys
import traceback
from datetime import datetime
from pathlib import Path

LOG_PATH = Path.home() / ".local" / "state" / "web-ingest" / "host.log"
DEFAULT_DIR = Path.home() / "incoming" / "web"


def log(msg: str) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(f"{datetime.now().isoformat(timespec='seconds')} {msg}\n")


def read_message() -> dict | None:
    raw_len = sys.stdin.buffer.read(4)
    if len(raw_len) < 4:
        return None
    (length,) = struct.unpack("=I", raw_len)
    payload = sys.stdin.buffer.read(length)
    return json.loads(payload.decode("utf-8"))


def send_message(msg: dict) -> None:
    data = json.dumps(msg).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("=I", len(data)))
    sys.stdout.buffer.write(data)
    sys.stdout.buffer.flush()


def slugify(text: str, max_len: int = 60) -> str:
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:max_len].strip("-") or "untitled"


def yaml_escape(s: str) -> str:
    if s == "" or re.search(r'[:#\[\]{}",&*!|>%@`\n]', s) or s != s.strip():
        escaped = s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        return '"' + escaped + '"'
    return s


def build_frontmatter(title: str, url: str, clipped_at: str, comment: str = "") -> str:
    lines = [
        "---",
        f"title: {yaml_escape(title)}",
        f"url: {yaml_escape(url)}",
        f"clipped_at: {yaml_escape(clipped_at)}",
    ]
    if comment:
        lines.append(f"comment: {yaml_escape(comment)}")
    lines.append("---")
    lines.append("")
    lines.append("")
    return "\n".join(lines)


def write_clip(msg: dict) -> Path:
    msg_dir = (msg.get("output_dir") or "").strip()
    env_dir = os.environ.get("WEB_INGEST_DIR", "").strip()
    out_dir = Path(msg_dir or env_dir or str(DEFAULT_DIR)).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    title = msg.get("title", "") or "untitled"
    url = msg.get("url", "")
    clipped_at = msg.get("clipped_at") or datetime.now().isoformat(timespec="seconds")
    markdown = msg.get("markdown", "")
    comment = (msg.get("comment") or "").strip()

    ts = datetime.now().strftime("%Y-%m-%d-%H%M")
    filename = f"{ts}--{slugify(title)}.md"
    path = out_dir / filename

    path.write_text(build_frontmatter(title, url, clipped_at, comment) + markdown, encoding="utf-8")
    return path


def main() -> int:
    try:
        msg = read_message()
        if msg is None:
            log("no message on stdin")
            return 0

        log(f"received clip: {msg.get('url', '?')!r}")
        path = write_clip(msg)
        log(f"wrote {path}")
        send_message({"ok": True, "path": str(path)})
        return 0

    except Exception as e:
        log(f"ERROR: {e}\n{traceback.format_exc()}")
        try:
            send_message({"ok": False, "error": str(e)})
        except Exception:
            pass
        return 1


if __name__ == "__main__":
    sys.exit(main())
