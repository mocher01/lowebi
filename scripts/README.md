# 🛠️ LOGEN Scripts Directory

This directory contains various automation scripts for the LOGEN project.

## 📁 Directory Structure

```
scripts/
├── workflow/              # Git workflow automation
│   ├── logen-workflow.sh  # Main workflow script
│   ├── workflow.sh        # Quick workflow alias
│   └── README.md          # Workflow documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Workflow Scripts (Most Common)

After completing work on an issue:

```bash
# From the workflow folder
./scripts/workflow/workflow.sh 73

# Or run the main script directly
./scripts/workflow/logen-workflow.sh 73
```

## 📂 Available Script Categories

### 🔄 Workflow Automation (`workflow/`)
- **Purpose:** Automate issue completion and transition workflow
- **Features:** Git backup, branch management, GitHub issue analysis
- **Usage:** Run when finishing work on a GitHub issue

## 🔗 Related Documentation

- **Workflow Scripts:** See `scripts/workflow/README.md` for detailed workflow documentation
- **Project Overview:** See main project README for general setup

## 💡 Adding New Scripts

When adding new script categories, create dedicated folders:

```bash
mkdir scripts/deployment/    # For deployment scripts
mkdir scripts/testing/       # For testing automation
mkdir scripts/database/      # For database management
```

Each category should include its own README.md with specific documentation.