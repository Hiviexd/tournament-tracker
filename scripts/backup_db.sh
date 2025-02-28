#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Directory where backups will be stored (relative to project root)
BACKUP_DIR="$PROJECT_ROOT/backups"

# Read MongoDB URI from config file
MONGODB_URI=$(jq -r '.connection' "$PROJECT_ROOT/config.json")

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for the backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.gz"

# Create the backup using mongodump
mongodump --uri="$MONGODB_URI" --gzip --archive="$BACKUP_FILE"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "backup_*.gz" -type f -mtime +7 -delete

# Print status
echo "Backup completed: $BACKUP_FILE"
echo "Old backups cleaned up"
