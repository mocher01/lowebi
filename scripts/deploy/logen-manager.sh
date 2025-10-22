#!/bin/bash
# LOGEN Deployment Manager
# Single entry point for all LOGEN deployment operations
# Ensures consistent naming, port allocation, and service management

set -euo pipefail

# Script metadata
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCK_FILE="/tmp/logen-manager.lock"

# Source library functions
source "$SCRIPT_DIR/lib/environment.sh"
source "$SCRIPT_DIR/lib/docker.sh"
source "$SCRIPT_DIR/lib/health.sh"
source "$SCRIPT_DIR/lib/backup.sh"
source "$SCRIPT_DIR/lib/validation.sh"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" ;;
        "SUCCESS") echo -e "${GREEN}[✓]${NC}    [$timestamp] $message" ;;
        *) echo -e "[$timestamp] $message" ;;
    esac
    
    # Also log to file
    echo "[$level] [$timestamp] $message" >> "$PROJECT_ROOT/logs/logen-manager.log"
}

# Create lock to prevent concurrent operations
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "ERROR" "Another instance is already running (PID: $pid)"
            exit 1
        else
            log "WARN" "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
}

# Display usage information
show_usage() {
    cat << EOF
${CYAN}LOGEN Deployment Manager v$SCRIPT_VERSION${NC}
Single entry point for all LOGEN deployment operations

${YELLOW}USAGE:${NC}
    $(basename "$0") <command> [options]

${YELLOW}COMMANDS:${NC}
    ${GREEN}Environment Management:${NC}
        init <env>              Initialize environment (dev|staging|prod)
        deploy <env>            Deploy/redeploy all services
        status <env>            Check all services status
        health <env>            Run comprehensive health checks
        
    ${GREEN}Service Management:${NC}
        rebuild <service> <env> [--force] Rebuild specific service (auto-detects changes)
        quick-deploy <service> <env>    Quick reliable deployment (no timeouts)
        restart <service> <env> Restart specific service
        logs <service> <env>    View service logs
        scale <service> <env> <replicas> Scale service
        
    ${GREEN}Maintenance:${NC}
        cleanup <env>           Clean unused Docker resources
        backup <env>            Backup databases and configurations
        restore <env> <file>    Restore from backup
        rollback <env> <tag>    Rollback to previous version
        migrate <env>           Migrate existing containers to LOGEN standard
        
    ${GREEN}Utilities:${NC}
        validate <env>          Validate environment configuration
        monitor <env>           Real-time monitoring dashboard
        debug <env>             Debug mode with detailed output

${YELLOW}BUILD CONFIGURATION:${NC}
    BUILD_TIMEOUT=600          Set build timeout in seconds (default: 600s/10min)
    BUILD_PROGRESS_INTERVAL=10 Progress update interval in seconds (default: 10s)
    
    ${PURPLE}Example with custom timeout:${NC}
    BUILD_TIMEOUT=900 ./logen-manager.sh rebuild admin-frontend prod

${YELLOW}ENVIRONMENTS:${NC}
    dev         Development environment (localhost)
    staging     Staging environment (staging servers)
    prod        Production environment (live servers)

${YELLOW}SERVICES:${NC}
    backend             NestJS API backend
    admin-frontend      Admin portal frontend
    customer-frontend   Customer portal frontend
    postgres            PostgreSQL database
    redis               Redis cache
    nginx               Reverse proxy

${YELLOW}EXAMPLES:${NC}
    $(basename "$0") init prod
    $(basename "$0") deploy prod
    $(basename "$0") rebuild admin-frontend prod
    $(basename "$0") logs backend prod
    $(basename "$0") health prod
    $(basename "$0") backup prod

${YELLOW}PORT ALLOCATION (Fixed):${NC}
    Backend:            7600
    Admin Frontend:     7602
    Customer Frontend:  7601
    PostgreSQL:         5433 (main), 7633 (prod)
    Redis:              7679
    Nginx:              80, 443

For more information, see: docs/deployment/logen-manager.md
EOF
}

# Main command dispatcher
main() {
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    # Acquire lock
    acquire_lock
    
    local command="${1:-}"
    
    if [ -z "$command" ]; then
        show_usage
        exit 1
    fi
    
    case "$command" in
        "init")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for init command"
                show_usage
                exit 1
            fi
            log "INFO" "Initializing LOGEN environment: $env"
            init_environment "$env"
            ;;
            
        "deploy")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for deploy command"
                show_usage
                exit 1
            fi
            log "INFO" "Deploying LOGEN to environment: $env"
            deploy_environment "$env"
            ;;
            
        "rebuild")
            local service="${2:-}"
            local env="${3:-}"
            local force_flag="${4:-}"
            
            if [ -z "$service" ] || [ -z "$env" ]; then
                log "ERROR" "Service and environment required for rebuild command"
                show_usage
                exit 1
            fi
            
            # Parse force flag
            local force_rebuild=false
            if [ "$force_flag" = "--force" ]; then
                force_rebuild=true
                log "INFO" "Force rebuild requested for $service in environment: $env"
            else
                log "INFO" "Smart rebuild for $service in environment: $env (will check if rebuild is needed)"
            fi
            
            rebuild_service "$service" "$env" "$force_rebuild"
            ;;

        "quick-deploy")
            local service="${2:-}"
            local env="${3:-}"
            
            if [ -z "$service" ] || [ -z "$env" ]; then
                log "ERROR" "Service and environment required for quick-deploy command"
                show_usage
                exit 1
            fi
            
            log "INFO" "Quick deployment of $service in environment $env"
            "$SCRIPT_DIR/logen-quick-deploy.sh" "$service" "$env"
            ;;
            
        "status")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for status command"
                show_usage
                exit 1
            fi
            check_services_status "$env"
            ;;
            
        "health")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for health command"
                show_usage
                exit 1
            fi
            run_health_checks "$env"
            ;;
            
        "logs")
            local service="${2:-}"
            local env="${3:-}"
            if [ -z "$service" ] || [ -z "$env" ]; then
                log "ERROR" "Service and environment required for logs command"
                show_usage
                exit 1
            fi
            show_service_logs "$service" "$env"
            ;;
            
        "cleanup")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for cleanup command"
                show_usage
                exit 1
            fi
            cleanup_environment "$env"
            ;;
            
        "backup")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for backup command"
                show_usage
                exit 1
            fi
            backup_environment "$env"
            ;;
            
        "restore")
            local env="${2:-}"
            local backup_file="${3:-}"
            if [ -z "$env" ] || [ -z "$backup_file" ]; then
                log "ERROR" "Environment and backup file required for restore command"
                show_usage
                exit 1
            fi
            restore_environment "$env" "$backup_file"
            ;;
            
        "validate")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for validate command"
                show_usage
                exit 1
            fi
            validate_environment "$env"
            ;;
            
        "migrate")
            local env="${2:-}"
            if [ -z "$env" ]; then
                log "ERROR" "Environment required for migrate command"
                show_usage
                exit 1
            fi
            log "INFO" "Migrating existing containers to LOGEN standard for environment: $env"
            migrate_to_standard "$env"
            ;;
            
        "--help"|"-h"|"help")
            show_usage
            ;;
            
        "--version"|"-v"|"version")
            echo "LOGEN Deployment Manager v$SCRIPT_VERSION"
            ;;
            
        *)
            log "ERROR" "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
    
    log "SUCCESS" "Operation completed successfully"
}

# Run main function with all arguments
main "$@"