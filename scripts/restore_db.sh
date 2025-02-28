#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Directory where backups are stored (relative to project root)
BACKUP_DIR="$PROJECT_ROOT/backups"

# Read MongoDB URI from config file
MONGODB_URI=$(jq -r '.connection' "$PROJECT_ROOT/config.json")

# List available backups
echo "Available backups:"
ls -1t "$BACKUP_DIR" | grep "backup_.*\.gz"

# Check if there are any backups
if [ $? -ne 0 ]; then
    echo "No backups found in $BACKUP_DIR"
    exit 1
fi

# Ask which backup to restore
echo -e "\nEnter the backup filename to restore (or 'latest' for most recent):"
read BACKUP_CHOICE

if [ "$BACKUP_CHOICE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/backup_*.gz | head -n1)
else
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_CHOICE"
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Confirm restoration
echo -e "\nWARNING: This will overwrite the current database!"
echo "Are you sure you want to restore from: $BACKUP_FILE? (yes/no)"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Perform the restore
echo "Restoring database from $BACKUP_FILE..."
mongorestore --uri="$MONGODB_URI" --gzip --archive="$BACKUP_FILE" --drop

echo "Restore completed!" 
