# Issue #15: Template Directory Restructure (v1.1.1.9.2.4.1.5)

## Description
Restructure template architecture to support future multiple React templates by moving current `template-base/` into proper `templates/template-base/` structure.

## Problem
Current structure:
```
template-base/          (React app template in root)
templates/              (empty after Issue #14)
```

Target structure:
```
templates/
└── template-base/      (React app template moved here)
    ├── Dockerfile
    ├── package.json
    ├── src/
    └── ... (all React app files)
```

Future ready for:
```
templates/
├── template-base/      (current React template)
├── template-1/         (future template)
├── template-2/         (future template)
```

## Acceptance Criteria

1. **Directory Restructure**
   - [ ] Create `templates/template-base/` directory
   - [ ] Move all contents from `template-base/` to `templates/template-base/`
   - [ ] Remove original `template-base/` directory
   - [ ] Preserve all file permissions and structure

2. **Update All References**
   - [ ] Update `init.sh` script template path references
   - [ ] Update site generation scripts path references  
   - [ ] Update any documentation mentioning template-base path
   - [ ] Update ConfigGenerator template directory scanning

3. **Update API Endpoints**
   - [ ] Modify `/api/templates` to scan `templates/` for directories
   - [ ] Return template metadata from directory structure
   - [ ] Support future multiple template discovery

4. **Verify Functionality**
   - [ ] Site generation still works with new path
   - [ ] Wizard can discover Template Basic
   - [ ] All deployment scripts work
   - [ ] Docker builds work from new location

5. **Future-Ready Infrastructure**
   - [ ] Template discovery scans for directories in `templates/`
   - [ ] Each template directory can have metadata file
   - [ ] Easy addition of new templates (template-1, template-2, etc.)

## Technical Requirements
- All existing functionality must work unchanged
- Site generation must use new template path
- API must be ready for multiple templates
- Backward compatibility maintained where possible

## Definition of Done
- [ ] Directory structure matches target
- [ ] All references updated
- [ ] Site generation works
- [ ] API ready for multiple templates
- [ ] All tests pass
- [ ] Committed and deployed

## Priority: CRITICAL
This enables proper template selection in wizard.