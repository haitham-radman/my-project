#!/bin/bash
# Installs Node.js 24 via nvm for Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

NVM_VERSION="v0.40.8"
NODE_MAJOR="24"
export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | PROFILE=/dev/null bash >/dev/null
fi

# nvm.sh references unset variables, so relax -u while it runs.
set +u
. "$NVM_DIR/nvm.sh"
nvm install "$NODE_MAJOR" >/dev/null
nvm alias default "$NODE_MAJOR" >/dev/null
NODE_BIN="$(dirname "$(nvm which "$NODE_MAJOR")")"
set -u

# Put Node 24 ahead of any preinstalled Node for the rest of the session.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export NVM_DIR=\"$NVM_DIR\""
    echo "export PATH=\"$NODE_BIN:\$PATH\""
  } >> "$CLAUDE_ENV_FILE"
fi

echo "Node $("$NODE_BIN/node" -v), npm $("$NODE_BIN/npm" -v)" >&2
