#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

cp index.html styles.css app.js docs/

git add index.html styles.css app.js docs/

git commit -m "Deploy update" || {
  echo "Nothing to commit."
  exit 0
}

git push
