#!/bin/bash

# LOGEN Git Workflow & Issue Analysis Script
# Automates: push main, create backup branch, analyze next issue

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Logen project configuration
PROJECT_NAME="LOGEN"
GITHUB_REPO="mocher01/logen"
BACKUP_PREFIX="backup-issue"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_feature() {
    echo -e "${PURPLE}[FEATURE]${NC} $1"
}

# Show Logen project status
show_project_status() {
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🚀 ${PROJECT_NAME} PROJECT STATUS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Repository:${NC} ${GITHUB_REPO}"
    echo -e "${YELLOW}Location:${NC} $(pwd)"
    echo -e "${YELLOW}Branch:${NC} $(git rev-parse --abbrev-ref HEAD)"
    echo -e "${YELLOW}Last Commit:${NC} $(git log -1 --pretty=format:'%h - %s (%cr)')"
    echo ""
    
    # Check running services
    local backend_status="❌ Not Running"
    local frontend_status="❌ Not Running"
    
    if pgrep -f "apps/backend.*start:dev" > /dev/null 2>&1; then
        backend_status="✅ Running (Port 7600)"
    fi
    
    if pgrep -f "apps/frontend.*dev.*7601" > /dev/null 2>&1; then
        frontend_status="✅ Running (Port 7601)"
    fi
    
    echo -e "${YELLOW}Backend Service:${NC} $backend_status"
    echo -e "${YELLOW}Frontend Service:${NC} $frontend_status"
    echo -e "${YELLOW}Production URL:${NC} https://logen.locod-ai.com"
    echo ""
}

# Get current issue number from recent commits or latest closed issue
get_current_issue() {
    cd "$REPO_ROOT"

    # Method 1: Check recent commit messages for issue references
    local commit_issue=$(git log --oneline -20 | grep -o "#[0-9]\+" | sed 's/#//' | sort -n | tail -1 2>/dev/null)
    if [[ -n "$commit_issue" ]]; then
        echo "$commit_issue"
        return
    fi

    # Method 2: Check recently closed issues via GitHub CLI
    if command -v gh &> /dev/null; then
        local closed_issue=$(gh issue list --state closed --limit 10 --json number | jq -r '.[0].number // empty' 2>/dev/null)
        if [[ -n "$closed_issue" && "$closed_issue" != "null" ]]; then
            echo "$closed_issue"
            return
        fi
    fi

    # Method 3: Fallback to latest backup branch
    local latest_backup=$(git branch -r | grep "backup-issue-" | sed 's/.*backup-issue-//' | sort -V | tail -1 2>/dev/null)
    if [[ $latest_backup =~ ^([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "73" # Default to current issue
    fi
}

# Get next version number for current issue
get_next_version() {
    local issue_num=$1
    cd "$REPO_ROOT"
    local versions=$(git branch -a | grep "backup-issue-${issue_num}\." | sed "s/.*backup-issue-${issue_num}\.//" | sed 's/-.*//' | sort -n)
    local latest_version=$(echo "$versions" | tail -1)
    if [[ -z "$latest_version" ]]; then
        echo "1"
    else
        echo $((latest_version + 1))
    fi
}

# Get next issue number
get_next_issue() {
    local current_issue=$1
    echo $((current_issue + 1))
}

# Analyze GitHub issue with Logen-specific formatting
analyze_issue() {
    local issue_num=$1
    log_info "🔍 Fetching Issue #${issue_num} from GitHub repository ${GITHUB_REPO}..."

    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) not found. Please install it to analyze issues."
        return 1
    fi

    # Get issue details
    local issue_data=$(gh issue view $issue_num --json title,body,labels,milestone,state 2>/dev/null)
    if [[ $? -ne 0 ]]; then
        log_error "Could not fetch Issue #${issue_num} from ${GITHUB_REPO}"
        return 1
    fi

    local title=$(echo "$issue_data" | jq -r '.title // "Unknown"')
    local body=$(echo "$issue_data" | jq -r '.body // "No description"')
    local labels=$(echo "$issue_data" | jq -r '.labels[]?.name // empty' | tr '\n' ', ' | sed 's/,$//')
    local milestone=$(echo "$issue_data" | jq -r '.milestone.title // "No milestone"')
    local state=$(echo "$issue_data" | jq -r '.state // "Unknown"')

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📋 ${PROJECT_NAME} ISSUE #${issue_num} ANALYSIS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Title:${NC} $title"
    echo -e "${YELLOW}State:${NC} $state"
    echo -e "${YELLOW}Labels:${NC} $labels"
    echo -e "${YELLOW}Milestone:${NC} $milestone"
    echo ""
    
    # Show first part of description
    echo -e "${YELLOW}Description:${NC}"
    echo "$body" | head -15
    echo ""

    # Extract and show specific sections for Logen issues
    if echo "$body" | grep -q "Unitarily Testable Subtasks"; then
        echo -e "${YELLOW}🎯 Subtasks Overview:${NC}"
        echo "$body" | sed -n '/Unitarily Testable Subtasks/,/Technical Requirements/p' | head -20
        echo ""
    fi

    # Extract acceptance criteria if present
    if echo "$body" | grep -q "Acceptance Criteria"; then
        echo -e "${YELLOW}✅ Acceptance Criteria:${NC}"
        echo "$body" | sed -n '/Acceptance Criteria/,/##/p' | head -10
        echo ""
    fi

    # Extract technical requirements if present
    if echo "$body" | grep -q "Technical Requirements"; then
        echo -e "${YELLOW}🔧 Technical Requirements:${NC}"
        echo "$body" | sed -n '/Technical Requirements/,/##/p' | head -10
        echo ""
    fi

    # Show Definition of Done if present
    if echo "$body" | grep -q "Definition of Done"; then
        echo -e "${YELLOW}🎯 Definition of Done:${NC}"
        echo "$body" | sed -n '/Definition of Done/,/##/p' | head -10
        echo ""
    fi

    # Extract API contracts for backend issues
    if echo "$body" | grep -q "API Contract" && echo "$labels" | grep -q "backend"; then
        echo -e "${YELLOW}🔌 API Contract:${NC}"
        echo "$body" | sed -n '/API Contract/,/```/p' | head -15
        echo ""
    fi

    # Show testing requirements
    if echo "$body" | grep -q "Testing Strategy"; then
        echo -e "${YELLOW}🧪 Testing Strategy:${NC}"
        echo "$body" | sed -n '/Testing Strategy/,/##/p' | head -8
        echo ""
    fi
}

# Main execution plan preview for Logen
show_execution_plan() {
    local current_issue=$1
    local next_version=$2
    local next_issue=$3
    local branch_name="${BACKUP_PREFIX}-${current_issue}.${next_version}"
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    local commit_count=$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo "unknown")

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}🔄 ${PROJECT_NAME} GIT WORKFLOW EXECUTION PLAN${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Current Status:${NC}"
    echo "  • Repository: ${GITHUB_REPO}"
    echo "  • Branch: $current_branch"
    echo "  • Commits ahead of origin/main: $commit_count"
    echo "  • Completing Issue: #$current_issue"
    echo ""
    echo -e "${YELLOW}Planned Actions:${NC}"
    echo "  1. 📤 Push current main branch to GitHub"
    echo "  2. 🌿 Create backup branch: $branch_name"
    echo "  3. 📤 Push backup branch to GitHub"
    echo "  4. 🔄 Return to main branch (already there)"
    echo "  5. 🔒 Close completed Issue #$current_issue on GitHub"
    echo "  6. 🔍 Analyze Issue #$next_issue for next development cycle"
    echo ""
    echo -e "${YELLOW}After execution:${NC}"
    echo "  • ✅ Main branch synced with GitHub"
    echo "  • 💾 Backup created: $branch_name"
    echo "  • 🔒 Issue #$current_issue closed on GitHub"
    echo "  • 🎯 Ready to work on Issue #$next_issue"
    echo "  • 🚀 Services can continue running during development"
    echo ""
    
    # Show which agent assignments to expect
    if command -v gh &> /dev/null; then
        local next_issue_labels=$(gh issue view $next_issue --json labels 2>/dev/null | jq -r '.labels[]?.name // empty' | tr '\n' ', ' | sed 's/,$//' 2>/dev/null)
        if [[ -n "$next_issue_labels" ]]; then
            echo -e "${YELLOW}Next Issue Agent Assignments:${NC}"
            echo "  • Labels: $next_issue_labels"
            if echo "$next_issue_labels" | grep -q "backend"; then
                echo "  • 🔧 Backend Developer: API, database, authentication"
            fi
            if echo "$next_issue_labels" | grep -q "frontend"; then
                echo "  • 🎨 Frontend Developer: UI, forms, validation"
            fi
            if echo "$next_issue_labels" | grep -q "qa"; then
                echo "  • 🧪 QA Tester: E2E testing, acceptance validation"
            fi
            echo ""
        fi
    fi
}

# Confirmation prompt with Logen context
confirm_execution() {
    echo ""
    echo -e "${YELLOW}   ⚠️  IMPORTANT: This will push changes to GitHub and create a backup branch.${NC}"
    echo -e "${YELLOW}   📋 Please verify the issue number and actions above are correct.${NC}"
    echo -e "${YELLOW}   🚀 Running services will continue uninterrupted.${NC}"
    echo ""
    echo -e "${CYAN}🤔 Do you want to proceed with this ${PROJECT_NAME} workflow? [y/N]${NC}"
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            log_success "✅ User confirmed - proceeding with ${PROJECT_NAME} workflow"
            return 0
            ;;
        *)
            log_info "❌ Workflow cancelled by user"
            return 1
            ;;
    esac
}

# Execute the workflow with Logen-specific messaging
execute_workflow() {
    local current_issue=$1
    local next_version=$2
    local next_issue=$3
    local branch_name="${BACKUP_PREFIX}-${current_issue}.${next_version}"

    cd "$REPO_ROOT"

    echo ""
    echo -e "${CYAN}🚀 Executing ${PROJECT_NAME} Git Workflow...${NC}"
    echo ""

    # Step 1: Push main to GitHub
    log_info "Step 1: 📤 Pushing main branch to GitHub..."
    if git push origin main; then
        log_success "✅ Main branch pushed to ${GITHUB_REPO}"
    else
        log_error "❌ Failed to push main branch"
        return 1
    fi
    echo ""

    # Step 2: Create backup branch
    log_info "Step 2: 🌿 Creating backup branch '$branch_name'..."
    if git checkout -b "$branch_name"; then
        log_success "✅ Backup branch '$branch_name' created successfully"
    else
        log_error "❌ Failed to create backup branch"
        return 1
    fi
    echo ""

    # Step 3: Push backup branch
    log_info "Step 3: 📤 Pushing backup branch to GitHub..."
    if git push -u origin "$branch_name"; then
        log_success "✅ Backup branch pushed to ${GITHUB_REPO}"
    else
        log_error "❌ Failed to push backup branch"
        return 1
    fi
    echo ""

    # Step 4: Return to main
    log_info "Step 4: 🔄 Returning to main branch..."
    if git checkout main; then
        log_success "✅ Back on main branch"
    else
        log_error "❌ Failed to checkout main branch"
        return 1
    fi
    echo ""

    # Step 5: Close completed issue
    log_info "Step 5: 🔒 Closing completed Issue #$current_issue..."
    if command -v gh &> /dev/null; then
        local close_comment="✅ **COMPLETED** - Issue #$current_issue

🎉 **Workflow Completed Successfully:**
- 💾 Backup branch created: \`$branch_name\`
- 📤 Changes pushed to GitHub repository
- 🔄 Ready for next development cycle

🚀 **Development Status:**
- Backend service: Running on port 7600
- Frontend service: Running on port 7601  
- Production URL: https://logen.locod-ai.com

**Next:** Ready to begin work on Issue #$next_issue

🤖 Generated with LOGEN Workflow Script"

        if gh issue close $current_issue --comment "$close_comment" 2>/dev/null; then
            log_success "✅ Issue #$current_issue closed with completion comment"
        else
            log_warning "⚠️  Could not close Issue #$current_issue (may already be closed or require permissions)"
        fi
    else
        log_warning "⚠️  GitHub CLI not available - Issue #$current_issue not closed automatically"
        log_info "💡 Manually close Issue #$current_issue on GitHub when ready"
    fi
    echo ""

    # Step 6: Analyze next issue
    log_info "Step 6: 🔍 Analyzing ${PROJECT_NAME} Issue #$next_issue..."
    analyze_issue "$next_issue"

    echo ""
    echo -e "${GREEN}🎉 ${PROJECT_NAME} Workflow completed successfully!${NC}"
    echo -e "${GREEN}💾 Backup created: $branch_name${NC}"
    echo -e "${GREEN}🔒 Issue #$current_issue closed${NC}"
    echo -e "${GREEN}🎯 Ready to work on Issue #$next_issue${NC}"
    echo -e "${GREEN}🚀 Your running services are still active${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  1. Review Issue #$next_issue requirements above"
    echo "  2. Assign tasks to appropriate agents (backend/frontend/qa)"
    echo "  3. Continue development with running services"
    echo "  4. Run this script again when Issue #$next_issue is complete"
}

# Main script for Logen
main() {
    echo -e "${PURPLE}🌟 ${PROJECT_NAME} Git Workflow & Issue Analysis Script${NC}"
    echo ""

    # Show project status first
    show_project_status

    # Ensure we're in a git repository
    cd "$REPO_ROOT"
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi

    # Ensure we're on main branch
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" != "main" ]]; then
        log_error "Must be on main branch (currently on: $current_branch)"
        log_info "Run: git checkout main"
        exit 1
    fi

    # Check if GitHub CLI is available
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) not found. Install it for better issue analysis."
        log_info "Install: https://cli.github.com/"
    fi

    # Get issue numbers and version
    local current_issue
    if [[ -n "$1" && "$1" =~ ^[0-9]+$ ]]; then
        current_issue="$1"
        log_info "📌 Using manually specified issue: #$current_issue"
    else
        current_issue=$(get_current_issue)
        log_info "🔍 Auto-detected current issue: #$current_issue"
        log_info "💡 Tip: Specify issue manually with: ./scripts/workflow.sh 73"
    fi
    
    local next_version=$(get_next_version "$current_issue")
    local next_issue=$(get_next_issue "$current_issue")

    # Show issue detection method
    log_info "🔍 Issue Detection Results:"
    log_info "  • Current completed issue: #$current_issue"
    log_info "  • Next backup version: $next_version"
    log_info "  • Next issue to work on: #$next_issue"
    echo ""

    # Show execution plan
    show_execution_plan "$current_issue" "$next_version" "$next_issue"

    # Get confirmation
    if confirm_execution; then
        execute_workflow "$current_issue" "$next_version" "$next_issue"
    fi
}

# Run main function
main "$@"