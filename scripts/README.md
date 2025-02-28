# Database backup scripts

This directory contains scripts for managing MongoDB database backups.

## Features

- Automated daily backups
- Manual backup creation
- Backup restoration
- Configurable backup location
- Secure handling of credentials

## Setup

1. Ensure MongoDB tools are installed (mongodump, mongorestore)
2. Make the scripts executable:
```bash
chmod +x backup_db.sh restore_db.sh
```

## Usage

### Creating a Backup

The backup script can be run manually:
```bash
./scripts/backup_db.sh
```

This will create a gzipped backup file in the `backups` directory with the format `backup_YYYYMMDD_HHMMSS.gz`.

### Restoring from Backup

To restore from a backup:
```bash
./scripts/restore_db.sh
```

## Automated Backups

The backup script is configured to run daily at midnight via crontab. Logs are written to `backups/backup.log`.

## Dependencies

### 1. MongoDB Database Tools

```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-database-tools
```

### 2. jq (JSON parser)

```bash
sudo apt-get install -y jq
```

## Configuration

The scripts read the MongoDB connection URI from `config.json` in the project root. Make sure this file exists and contains the correct connection string:

```json
{
    "connection": "mongodb+srv://user:password@your-cluster.mongodb.net/database"
}
```

## Troubleshooting

1. **Backup fails with permission error**:
   - Ensure you have write permissions in the `backups`
