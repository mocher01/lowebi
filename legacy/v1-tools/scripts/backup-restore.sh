#!/bin/bash

# Backup and Restore Script for Website Generator v2
# Handles database backups, configuration backups, and disaster recovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/root/website-generator/v2"
BACKUP_DIR="/backups/website-generator"
S3_BUCKET="website-generator-backups"  # Configure if using S3
RETENTION_DAYS=30
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"

# Database configuration
DB_CONTAINER="locod-postgres-prod"
DB_USER="locod_user"
DB_NAME="locod_prod"

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Create backup directory structure
create_backup_dirs() {
    local backup_path="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

# Database backup
backup_database() {
    local backup_path="$1"
    
    log "Starting database backup..."
    
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        error "Database container $DB_CONTAINER is not running"
    fi
    
    # Create database dump
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$backup_path/database.sql"
    
    # Create compressed backup
    gzip "$backup_path/database.sql"
    
    # Get database size info
    local db_size=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    echo "$db_size" > "$backup_path/database_info.txt"
    
    success "Database backup completed: $backup_path/database.sql.gz"
}

# Configuration backup
backup_configuration() {
    local backup_path="$1"
    
    log "Starting configuration backup..."
    
    # Backup Docker configurations
    cp -r "$PROJECT_DIR/docker" "$backup_path/"
    
    # Backup environment file (without sensitive data in logs)
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        cp "$PROJECT_DIR/.env" "$backup_path/.env.backup"
    fi
    
    # Backup application source (if needed)
    if [[ "$BACKUP_SOURCE" == "true" ]]; then
        tar -czf "$backup_path/source.tar.gz" -C "$PROJECT_DIR" --exclude=node_modules --exclude=dist --exclude=.git .
    fi
    
    # Create backup manifest
    cat > "$backup_path/backup_manifest.txt" << EOF
Backup Created: $(date)
Project Directory: $PROJECT_DIR
Database Container: $DB_CONTAINER
Database Name: $DB_NAME
Backup Type: Full System Backup
Files Included:
- Database dump (compressed)
- Docker configurations
- Environment configuration
- Application source (if enabled)
EOF
    
    success "Configuration backup completed"
}

# Upload to cloud storage (if configured)
upload_to_cloud() {
    local backup_path="$1"
    
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        log "Uploading backup to S3..."
        local backup_name=$(basename "$backup_path")
        aws s3 sync "$backup_path" "s3://$S3_BUCKET/$backup_name/"
        success "Backup uploaded to S3: s3://$S3_BUCKET/$backup_name/"
    else
        info "Cloud storage not configured or AWS CLI not available"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -type d -name "20*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    
    # Clean S3 backups if configured
    if command -v aws &> /dev/null && [[ -n "$S3_BUCKET" ]]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        aws s3 ls "s3://$S3_BUCKET/" | while read -r line; do
            local backup_date=$(echo "$line" | awk '{print $2}' | cut -d'_' -f1)
            if [[ "$backup_date" < "$cutoff_date" ]]; then
                local backup_name=$(echo "$line" | awk '{print $2}')
                aws s3 rm "s3://$S3_BUCKET/$backup_name/" --recursive
                info "Removed old S3 backup: $backup_name"
            fi
        done
    fi
    
    success "Cleanup completed"
}

# Full backup process
full_backup() {
    log "=== Starting Full System Backup ==="
    
    local backup_path=$(create_backup_dirs)
    
    backup_database "$backup_path"
    backup_configuration "$backup_path"
    upload_to_cloud "$backup_path"
    cleanup_old_backups
    
    # Create backup report
    local backup_size=$(du -sh "$backup_path" | cut -f1)
    cat > "$backup_path/backup_report.txt" << EOF
=== Backup Report ===
Backup Date: $(date)
Backup Path: $backup_path
Backup Size: $backup_size
Status: Completed Successfully

Files Created:
$(ls -la "$backup_path")
EOF
    
    success "=== Full backup completed successfully ==="
    info "Backup location: $backup_path"
    info "Backup size: $backup_size"
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring database from: $backup_file"
    
    # Stop application to prevent new connections
    warning "Stopping application services..."
    cd "$PROJECT_DIR"
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop backend frontend
    
    # Restore database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
    else
        docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$backup_file"
    fi
    
    # Restart application
    info "Restarting application services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" start backend frontend
    
    success "Database restore completed"
}

# List available backups
list_backups() {
    log "Available backups:"
    
    if [[ -d "$BACKUP_DIR" ]]; then
        find "$BACKUP_DIR" -type d -name "20*" | sort | while read -r backup; do
            local backup_name=$(basename "$backup")
            local backup_size=$(du -sh "$backup" | cut -f1)
            local backup_date=$(echo "$backup_name" | sed 's/_/ /' | sed 's/\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)/\1-\2-\3/')
            echo "  $backup_name ($backup_size) - $backup_date"
        done
    else
        warning "No backup directory found: $BACKUP_DIR"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_path="$1"
    
    if [[ ! -d "$backup_path" ]]; then
        error "Backup directory not found: $backup_path"
    fi
    
    log "Verifying backup integrity: $backup_path"
    
    # Check required files
    local required_files=("backup_manifest.txt" "database.sql.gz")
    for file in "${required_files[@]}"; do
        if [[ ! -f "$backup_path/$file" ]]; then
            error "Required backup file missing: $file"
        fi
    done
    
    # Test database dump
    if command -v zcat &> /dev/null; then
        if zcat "$backup_path/database.sql.gz" | head -n 10 | grep -q "PostgreSQL database dump"; then
            success "Database dump appears valid"
        else
            error "Database dump appears corrupted"
        fi
    fi
    
    success "Backup verification completed"
}

# Main script logic
case "${1:-backup}" in
    "backup"|"full")
        full_backup
        ;;
    "database")
        backup_path=$(create_backup_dirs)
        backup_database "$backup_path"
        ;;
    "config")
        backup_path=$(create_backup_dirs)
        backup_configuration "$backup_path"
        ;;
    "restore")
        if [[ -z "$2" ]]; then
            error "Usage: $0 restore <backup_file>"
        fi
        restore_database "$2"
        ;;
    "list")
        list_backups
        ;;
    "verify")
        if [[ -z "$2" ]]; then
            error "Usage: $0 verify <backup_path>"
        fi
        verify_backup "$2"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Website Generator v2 - Backup & Restore Tool"
        echo "Usage: $0 {backup|database|config|restore|list|verify|cleanup}"
        echo ""
        echo "Commands:"
        echo "  backup   - Full system backup (default)"
        echo "  database - Database backup only"
        echo "  config   - Configuration backup only"
        echo "  restore  - Restore from backup file"
        echo "  list     - List available backups"
        echo "  verify   - Verify backup integrity"
        echo "  cleanup  - Remove old backups"
        echo ""
        echo "Examples:"
        echo "  $0 backup"
        echo "  $0 restore /backups/website-generator/20240816_143000/database.sql.gz"
        echo "  $0 verify /backups/website-generator/20240816_143000"
        exit 1
        ;;
esac