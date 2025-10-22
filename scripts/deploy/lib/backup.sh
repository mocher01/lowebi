#!/bin/bash
# Backup and Restore Functions
# Handles database backups, configuration backups, and restore operations

# Backup environment
backup_environment() {
    local env="$1"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_dir="$PROJECT_ROOT/backups/$env/$timestamp"
    
    log "INFO" "Starting backup for environment: $env"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    local failed=0
    
    # Backup database
    backup_database "$env" "$backup_dir"
    local db_backup_result=$?
    failed=$((failed + db_backup_result))
    
    # Backup Redis data
    backup_redis "$env" "$backup_dir"
    local redis_backup_result=$?
    failed=$((failed + redis_backup_result))
    
    # Backup configurations
    backup_configurations "$env" "$backup_dir"
    local config_backup_result=$?
    failed=$((failed + config_backup_result))
    
    # Backup container configurations
    backup_container_configs "$env" "$backup_dir"
    local container_backup_result=$?
    failed=$((failed + container_backup_result))
    
    # Create backup manifest
    create_backup_manifest "$env" "$backup_dir" "$timestamp"
    
    # Compress backup
    local archive_name="logen-${env}-backup-${timestamp}.tar.gz"
    local archive_path="$PROJECT_ROOT/backups/$env/$archive_name"
    
    cd "$PROJECT_ROOT/backups/$env"
    tar -czf "$archive_name" "$timestamp/"
    
    if [ $? -eq 0 ]; then
        # Remove uncompressed backup directory
        rm -rf "$backup_dir"
        
        log "SUCCESS" "Backup completed successfully: $archive_path"
        echo ""
        echo "=== Backup Information ==="
        echo "Environment: $env"
        echo "Timestamp: $timestamp"
        echo "Archive: $archive_path"
        echo "Size: $(du -h "$archive_path" | cut -f1)"
        echo ""
        
        # Keep only last 10 backups
        cleanup_old_backups "$env"
        
        return $failed
    else
        log "ERROR" "Failed to create backup archive"
        return 1
    fi
}

# Backup database
backup_database() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Backing up database for environment: $env"
    
    local container_name=$(get_service_name "postgres" "$env")
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Check if container exists and is running
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log "ERROR" "Database container $container_name not running"
        return 1
    fi
    
    # Create database dump
    local dump_file="$backup_dir/database-dump.sql"
    
    if docker exec "$container_name" pg_dump -U "$DB_USERNAME" -d "$DB_DATABASE" > "$dump_file"; then
        log "SUCCESS" "Database backup created: $dump_file"
        
        # Create schema-only dump
        local schema_file="$backup_dir/database-schema.sql"
        docker exec "$container_name" pg_dump -U "$DB_USERNAME" -d "$DB_DATABASE" --schema-only > "$schema_file"
        
        # Create database metadata
        cat > "$backup_dir/database-info.txt" << EOF
Database Backup Information
Generated: $(date)
Environment: $env
Container: $container_name
Database: $DB_DATABASE
User: $DB_USERNAME
Dump Size: $(du -h "$dump_file" | cut -f1)

Tables:
$(docker exec "$container_name" psql -U "$DB_USERNAME" -d "$DB_DATABASE" -c "\dt" 2>/dev/null | grep -E "^\s*public" | awk '{print $3}')

Database Size:
$(docker exec "$container_name" psql -U "$DB_USERNAME" -d "$DB_DATABASE" -c "SELECT pg_size_pretty(pg_database_size('$DB_DATABASE'));" -t | tr -d ' ')
EOF
        
        log "SUCCESS" "Database backup completed"
        return 0
    else
        log "ERROR" "Database backup failed"
        return 1
    fi
}

# Backup Redis data
backup_redis() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Backing up Redis data for environment: $env"
    
    local container_name=$(get_service_name "redis" "$env")
    
    # Check if container exists and is running
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log "ERROR" "Redis container $container_name not running"
        return 1
    fi
    
    # Create Redis backup
    local redis_dump="$backup_dir/redis-dump.rdb"
    
    # Trigger Redis save
    docker exec "$container_name" redis-cli BGSAVE
    
    # Wait for save to complete
    local save_complete=false
    for i in {1..30}; do
        if docker exec "$container_name" redis-cli LASTSAVE | grep -q "$(docker exec "$container_name" redis-cli LASTSAVE)"; then
            sleep 1
        else
            save_complete=true
            break
        fi
    done
    
    if [ "$save_complete" = true ]; then
        # Copy dump file
        docker cp "$container_name:/data/dump.rdb" "$redis_dump"
        
        if [ -f "$redis_dump" ]; then
            log "SUCCESS" "Redis backup created: $redis_dump"
            
            # Create Redis info
            cat > "$backup_dir/redis-info.txt" << EOF
Redis Backup Information
Generated: $(date)
Environment: $env
Container: $container_name
Dump Size: $(du -h "$redis_dump" | cut -f1)

Redis Info:
$(docker exec "$container_name" redis-cli INFO server | grep -E "(redis_version|os|arch|uptime_in_seconds)")
$(docker exec "$container_name" redis-cli INFO memory | grep -E "(used_memory_human|used_memory_peak_human)")
$(docker exec "$container_name" redis-cli INFO stats | grep -E "(total_commands_processed|total_connections_received)")
EOF
            
            return 0
        else
            log "ERROR" "Failed to copy Redis dump file"
            return 1
        fi
    else
        log "ERROR" "Redis backup save did not complete in time"
        return 1
    fi
}

# Backup configurations
backup_configurations() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Backing up configurations for environment: $env"
    
    local config_backup_dir="$backup_dir/configurations"
    mkdir -p "$config_backup_dir"
    
    # Backup environment configuration
    if [ -f "$PROJECT_ROOT/config/environments/$env/.env" ]; then
        cp "$PROJECT_ROOT/config/environments/$env/.env" "$config_backup_dir/environment.env"
    fi
    
    # Backup docker-compose
    if [ -f "$PROJECT_ROOT/config/docker/$env/docker-compose.yml" ]; then
        cp "$PROJECT_ROOT/config/docker/$env/docker-compose.yml" "$config_backup_dir/docker-compose.yml"
    fi
    
    # Backup nginx configuration
    if [ -d "$PROJECT_ROOT/config/nginx/$env" ]; then
        cp -r "$PROJECT_ROOT/config/nginx/$env" "$config_backup_dir/nginx"
    fi
    
    # Backup SSL certificates (if they exist)
    if [ -d "$PROJECT_ROOT/ssl/$env" ]; then
        cp -r "$PROJECT_ROOT/ssl/$env" "$config_backup_dir/ssl"
    fi
    
    log "SUCCESS" "Configuration backup completed"
    return 0
}

# Backup container configurations
backup_container_configs() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Backing up container configurations for environment: $env"
    
    local containers_backup_dir="$backup_dir/containers"
    mkdir -p "$containers_backup_dir"
    
    # Get all containers for this environment
    local containers=$(docker ps -a --filter "name=logen-*-$env" --format "{{.Names}}")
    
    for container in $containers; do
        if [ -n "$container" ]; then
            # Export container configuration
            docker inspect "$container" > "$containers_backup_dir/${container}-config.json"
            
            # Export container logs
            docker logs "$container" --tail 1000 > "$containers_backup_dir/${container}-logs.txt" 2>&1
        fi
    done
    
    # Export Docker network configuration
    local network_name=$(get_network_name "$env")
    if docker network ls | grep -q "$network_name"; then
        docker network inspect "$network_name" > "$containers_backup_dir/network-${network_name}.json"
    fi
    
    # Export volume information
    local volumes=$(docker volume ls --filter "name=logen-*-$env" --format "{{.Name}}")
    for volume in $volumes; do
        if [ -n "$volume" ]; then
            docker volume inspect "$volume" > "$containers_backup_dir/volume-${volume}.json"
        fi
    done
    
    log "SUCCESS" "Container configuration backup completed"
    return 0
}

# Create backup manifest
create_backup_manifest() {
    local env="$1"
    local backup_dir="$2"
    local timestamp="$3"
    
    cat > "$backup_dir/MANIFEST.txt" << EOF
LOGEN Backup Manifest
=====================

Environment: $env
Created: $(date)
Timestamp: $timestamp
Script Version: $SCRIPT_VERSION

Backup Contents:
- database-dump.sql        : Full database backup
- database-schema.sql      : Database schema only
- database-info.txt        : Database metadata
- redis-dump.rdb          : Redis data backup
- redis-info.txt          : Redis metadata
- configurations/         : All configuration files
- containers/             : Container configurations and logs

System Information:
- Host: $(hostname)
- OS: $(uname -a)
- Docker Version: $(docker --version)
- Disk Usage: $(df -h / | tail -1 | awk '{print $5}')
- Memory Usage: $(free -m | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')

Services Status at Backup Time:
$(docker ps --filter "name=logen-*-$env" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

Files in Backup:
$(find "$backup_dir" -type f -exec ls -lh {} \; | awk '{print $9 " (" $5 ")"}')

Total Backup Size: $(du -sh "$backup_dir" | cut -f1)

Verification:
- Database dump: $(if [ -f "$backup_dir/database-dump.sql" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
- Redis dump: $(if [ -f "$backup_dir/redis-dump.rdb" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
- Configurations: $(if [ -d "$backup_dir/configurations" ]; then echo "✓ Present"; else echo "✗ Missing"; fi)
EOF

    log "SUCCESS" "Backup manifest created"
}

# Cleanup old backups
cleanup_old_backups() {
    local env="$1"
    local max_backups=10
    
    local backup_env_dir="$PROJECT_ROOT/backups/$env"
    
    if [ -d "$backup_env_dir" ]; then
        local backup_count=$(ls -1 "$backup_env_dir"/logen-${env}-backup-*.tar.gz 2>/dev/null | wc -l)
        
        if [ $backup_count -gt $max_backups ]; then
            local excess=$((backup_count - max_backups))
            log "INFO" "Cleaning up $excess old backup(s)"
            
            ls -1t "$backup_env_dir"/logen-${env}-backup-*.tar.gz | tail -n $excess | xargs rm -f
            log "SUCCESS" "Cleaned up $excess old backup(s)"
        fi
    fi
}

# Restore environment from backup
restore_environment() {
    local env="$1"
    local backup_file="$2"
    
    log "INFO" "Starting restore for environment: $env from backup: $backup_file"
    
    # Validate backup file
    if [ ! -f "$backup_file" ]; then
        log "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Create temporary directory for extraction
    local temp_dir="/tmp/logen-restore-$$"
    mkdir -p "$temp_dir"
    
    # Extract backup
    log "INFO" "Extracting backup archive..."
    tar -xzf "$backup_file" -C "$temp_dir"
    
    if [ $? -ne 0 ]; then
        log "ERROR" "Failed to extract backup archive"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Find extracted directory
    local extracted_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "*" | grep -v "^$temp_dir$" | head -1)
    
    if [ ! -d "$extracted_dir" ]; then
        log "ERROR" "Could not find extracted backup directory"
        rm -rf "$temp_dir"
        return 1
    fi
    
    log "INFO" "Backup extracted to: $extracted_dir"
    
    # Display backup manifest
    if [ -f "$extracted_dir/MANIFEST.txt" ]; then
        echo ""
        echo "=== Backup Information ==="
        cat "$extracted_dir/MANIFEST.txt"
        echo ""
    fi
    
    # Confirm restore
    echo -n "Are you sure you want to restore from this backup? This will overwrite current data. (y/N): "
    read -r confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log "INFO" "Restore cancelled by user"
        rm -rf "$temp_dir"
        return 0
    fi
    
    local failed=0
    
    # Stop services before restore
    log "INFO" "Stopping services for restore..."
    stop_services "$env"
    
    # Restore database
    if [ -f "$extracted_dir/database-dump.sql" ]; then
        restore_database "$env" "$extracted_dir/database-dump.sql"
        local db_restore_result=$?
        failed=$((failed + db_restore_result))
    fi
    
    # Restore Redis
    if [ -f "$extracted_dir/redis-dump.rdb" ]; then
        restore_redis "$env" "$extracted_dir/redis-dump.rdb"
        local redis_restore_result=$?
        failed=$((failed + redis_restore_result))
    fi
    
    # Restore configurations
    if [ -d "$extracted_dir/configurations" ]; then
        restore_configurations "$env" "$extracted_dir/configurations"
        local config_restore_result=$?
        failed=$((failed + config_restore_result))
    fi
    
    # Start services after restore
    log "INFO" "Starting services after restore..."
    deploy_environment "$env"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    if [ $failed -eq 0 ]; then
        log "SUCCESS" "Restore completed successfully"
    else
        log "ERROR" "Restore completed with $failed error(s)"
    fi
    
    return $failed
}

# Restore database
restore_database() {
    local env="$1"
    local dump_file="$2"
    
    log "INFO" "Restoring database from: $dump_file"
    
    local container_name=$(get_service_name "postgres" "$env")
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Start postgres container if not running
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log "INFO" "Starting database container..."
        start_service "postgres" "$env"
        sleep 10
    fi
    
    # Drop and recreate database
    docker exec "$container_name" dropdb -U "$DB_USERNAME" "$DB_DATABASE" --if-exists
    docker exec "$container_name" createdb -U "$DB_USERNAME" "$DB_DATABASE"
    
    # Restore from dump
    if docker exec -i "$container_name" psql -U "$DB_USERNAME" -d "$DB_DATABASE" < "$dump_file"; then
        log "SUCCESS" "Database restored successfully"
        return 0
    else
        log "ERROR" "Database restore failed"
        return 1
    fi
}

# Restore Redis
restore_redis() {
    local env="$1"
    local dump_file="$2"
    
    log "INFO" "Restoring Redis from: $dump_file"
    
    local container_name=$(get_service_name "redis" "$env")
    
    # Stop Redis container
    docker stop "$container_name" 2>/dev/null || true
    
    # Copy dump file to volume
    local volume_name=$(get_volume_name "redis" "$env")
    docker run --rm -v "$volume_name:/data" -v "$(dirname "$dump_file"):/backup" alpine cp /backup/$(basename "$dump_file") /data/dump.rdb
    
    # Start Redis container
    start_service "redis" "$env"
    
    if [ $? -eq 0 ]; then
        log "SUCCESS" "Redis restored successfully"
        return 0
    else
        log "ERROR" "Redis restore failed"
        return 1
    fi
}

# Restore configurations
restore_configurations() {
    local env="$1"
    local config_dir="$2"
    
    log "INFO" "Restoring configurations from: $config_dir"
    
    # Restore environment configuration
    if [ -f "$config_dir/environment.env" ]; then
        mkdir -p "$PROJECT_ROOT/config/environments/$env"
        cp "$config_dir/environment.env" "$PROJECT_ROOT/config/environments/$env/.env"
    fi
    
    # Restore docker-compose
    if [ -f "$config_dir/docker-compose.yml" ]; then
        mkdir -p "$PROJECT_ROOT/config/docker/$env"
        cp "$config_dir/docker-compose.yml" "$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    fi
    
    # Restore nginx configuration
    if [ -d "$config_dir/nginx" ]; then
        cp -r "$config_dir/nginx" "$PROJECT_ROOT/config/nginx/$env"
    fi
    
    # Restore SSL certificates
    if [ -d "$config_dir/ssl" ]; then
        cp -r "$config_dir/ssl" "$PROJECT_ROOT/ssl/$env"
    fi
    
    log "SUCCESS" "Configuration restore completed"
    return 0
}

# Stop services
stop_services() {
    local env="$1"
    
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        cd "$(dirname "$compose_file")"
        docker-compose -f docker-compose.yml down
    fi
}

# Start specific service
start_service() {
    local service="$1"
    local env="$2"
    
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        set -a
        source "$PROJECT_ROOT/config/environments/$env/.env"
        set +a
        
        cd "$(dirname "$compose_file")"
        docker-compose -f docker-compose.yml up -d "$service"
    fi
}

# List available backups
list_backups() {
    local env="$1"
    
    log "INFO" "Available backups for environment: $env"
    
    local backup_dir="$PROJECT_ROOT/backups/$env"
    
    if [ -d "$backup_dir" ]; then
        echo ""
        echo "=== Available Backups ==="
        ls -lht "$backup_dir"/logen-${env}-backup-*.tar.gz 2>/dev/null | while read line; do
            local file=$(echo "$line" | awk '{print $9}')
            local size=$(echo "$line" | awk '{print $5}')
            local date=$(echo "$line" | awk '{print $6, $7, $8}')
            
            if [ -n "$file" ]; then
                echo "$(basename "$file") - $size - $date"
            fi
        done
        echo ""
    else
        log "INFO" "No backups found for environment: $env"
    fi
}