# 🚀 LOGEN Workflow Scripts

## Quick Start

When you finish working on an issue and want to create a backup + analyze the next issue:

```bash
# Using the quick alias (recommended)
./scripts/workflow/workflow.sh 73

# Or run the main script directly
./scripts/workflow/logen-workflow.sh 73
```

## What It Does

The workflow script automates the complete issue transition process:

1. **📤 Push main branch** - Syncs your completed work to GitHub
2. **🌿 Create backup branch** - Creates `backup-issue-{N}.{version}` branch  
3. **📤 Push backup** - Preserves your completed work on GitHub
4. **🔄 Return to main** - Ready for next development cycle
5. **🔍 Analyze next issue** - Shows requirements, acceptance criteria, and technical details

## Example Workflow

```bash
# After completing Issue #73 (Customer Registration)
cd /var/apps/logen
./scripts/workflow.sh

# Creates: backup-issue-73.1
# Analyzes: Issue #74 (next feature)
# Shows: Subtasks, acceptance criteria, API contracts
```

## Backup Branch Naming

- `backup-issue-73.1` - First backup of Issue #73
- `backup-issue-73.2` - Second backup of Issue #73 (if needed)
- `backup-issue-74.1` - First backup of Issue #74

## Issue Analysis Features

For each GitHub issue, the script shows:
- 📋 **Title & Status** 
- 🏷️ **Labels & Milestones**
- 🎯 **Subtasks Overview** (for complex issues)
- ✅ **Acceptance Criteria**
- 🔧 **Technical Requirements**
- 🔌 **API Contracts** (for backend tasks)
- 🧪 **Testing Strategy**
- 🎯 **Definition of Done**

## Agent Assignment Detection

The script automatically detects which agents should work on the next issue:
- 🔧 **Backend Developer** - For `backend` labeled issues
- 🎨 **Frontend Developer** - For `frontend` labeled issues  
- 🧪 **QA Tester** - For `qa-testing` labeled issues

## Current Project Status

The script shows real-time status:
- ✅ **Backend Service** - Port 7600 (NestJS)
- ✅ **Frontend Service** - Port 7601 (Next.js)
- 🌐 **Production URL** - https://logen.locod-ai.com
- 📊 **Git Status** - Current branch, commits ahead

## Safety Features

- ✅ **Preview before execution** - Shows exactly what will happen
- ✅ **User confirmation** - Requires explicit approval
- ✅ **Branch validation** - Must be on `main` branch
- ✅ **Service preservation** - Running services continue uninterrupted
- ✅ **Error handling** - Stops if any step fails

## Requirements

- **Git repository** - Must be run from logen project root
- **Main branch** - Must be on `main` branch to execute
- **GitHub CLI (optional)** - For enhanced issue analysis: `gh auth login`

## File Structure

```
scripts/
├── workflow/
│   ├── logen-workflow.sh  # Main workflow script
│   ├── workflow.sh        # Quick alias
│   └── README.md          # This documentation
└── README.md              # Main scripts documentation
```

## Integration with Development

This script is designed to work seamlessly with the logen development process:

1. **Work on Issue #73** - Complete customer registration feature
2. **Run workflow** - `./scripts/workflow.sh`
3. **Backup created** - `backup-issue-73.1` branch on GitHub
4. **Next issue analyzed** - Issue #74 requirements displayed
5. **Continue development** - Start working on Issue #74

The script preserves your running development services (backend on 7600, frontend on 7601) so you can continue working immediately after the backup is created.