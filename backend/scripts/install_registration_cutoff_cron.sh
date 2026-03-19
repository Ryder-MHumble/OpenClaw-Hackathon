#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PY_BIN="${PY_BIN:-python3}"
LOG_FILE="$ROOT_DIR/registration_cutoff.log"

CRON_LINE="0 0 20 3 * cd \"$ROOT_DIR\" && $PY_BIN scripts/close_registration.py >> \"$LOG_FILE\" 2>&1"

(crontab -l 2>/dev/null | grep -v "close_registration.py"; echo "$CRON_LINE") | crontab -

echo "Cron installed: $CRON_LINE"
