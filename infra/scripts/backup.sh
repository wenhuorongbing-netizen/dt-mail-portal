#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/dt-mail-portal}"
mkdir -p "$BACKUP_DIR"

echo "Add DB dump, frontend build backup, and mailcow backup commands here before production."
date > "$BACKUP_DIR/last-backup-placeholder.txt"
