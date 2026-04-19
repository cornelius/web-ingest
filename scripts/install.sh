#!/bin/bash
# Register the web-ingest native messaging host with Chrome.
#
# Usage: scripts/install.sh <chrome-extension-id>
#
# Find the extension ID at chrome://extensions after loading the unpacked
# extension/ folder in Developer mode.
set -euo pipefail

if [[ $# -ne 1 || -z "${1:-}" ]]; then
    echo "Usage: $0 <chrome-extension-id>" >&2
    echo "  Get the ID from chrome://extensions after loading extension/ unpacked." >&2
    exit 1
fi

EXT_ID="$1"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_PATH="$REPO_DIR/host/web-ingest-host.py"
TEMPLATE="$REPO_DIR/host/manifest.template.json"
MANIFEST_NAME="de.cornelius.web_ingest.json"
MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
MANIFEST_PATH="$MANIFEST_DIR/$MANIFEST_NAME"

if [[ ! -f "$HOST_PATH" ]]; then
    echo "Host script not found: $HOST_PATH" >&2
    exit 1
fi
if [[ ! -f "$TEMPLATE" ]]; then
    echo "Manifest template not found: $TEMPLATE" >&2
    exit 1
fi

chmod +x "$HOST_PATH"
mkdir -p "$MANIFEST_DIR"

# Substitute paths into the manifest template.
sed -e "s|{HOST_PATH}|$HOST_PATH|g" \
    -e "s|{EXTENSION_ID}|$EXT_ID|g" \
    "$TEMPLATE" > "$MANIFEST_PATH"
chmod 644 "$MANIFEST_PATH"

cat <<EOF
Installed web-ingest native messaging host.

  Manifest:    $MANIFEST_PATH
  Host script: $HOST_PATH
  Output dir:  \${WEB_INGEST_DIR:-\$HOME/incoming/web}
  Log file:    \$HOME/.local/state/web-ingest/host.log

Restart Chrome (or the extension) to pick up the manifest, then click
the extension's toolbar icon on any article.
EOF
