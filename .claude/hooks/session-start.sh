#!/bin/bash
# Installs Node.js 24 via nvm for Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# nvm v0.40.8, pinned by commit: a tag can be moved, a commit hash can't.
NVM_COMMIT="a885b885fef16fac4bc544188fb25e9e37ae83e8"
NODE_MAJOR="24"
export NVM_DIR="$HOME/.nvm"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  git clone -q https://github.com/nvm-sh/nvm.git "$NVM_DIR"
  git -C "$NVM_DIR" checkout -q "$NVM_COMMIT"
fi

# nvm.sh references unset variables, so relax -u while it runs.
set +u
. "$NVM_DIR/nvm.sh"
# Skip the network when Node 24 is already installed (works offline).
nvm which "$NODE_MAJOR" >/dev/null 2>&1 || nvm install "$NODE_MAJOR" >/dev/null
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
