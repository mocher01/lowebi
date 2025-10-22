# Issue #14: Critical Architecture Cleanup - Remove Incorrect Template Files (v1.1.1.9.2.4.1.4)

## Description
Remove incorrect JSON configuration files from `templates/` folder that are polluting the template architecture. These files were mistakenly placed as "templates" when they are actually configuration presets.

## Problem
Current incorrect structure:
```
templates/
├── education-academy.json        (WRONG - config preset, not template)
├── translation-professional.json (WRONG - config preset, not template)
```

Target structure:
```
templates/
(empty - ready for future React template directories)
```

## Acceptance Criteria

1. **Remove Incorrect Files**
   - [ ] Delete `templates/education-academy.json`
   - [ ] Delete `templates/translation-professional.json`
   - [ ] Ensure `templates/` folder exists but is empty

2. **Update API References**
   - [ ] Check `/api/templates` endpoint doesn't break
   - [ ] Update ConfigGenerator to not reference these JSON files
   - [ ] Remove any code that loads these files as templates

3. **Verify No Broken Dependencies**
   - [ ] Check wizard doesn't try to load these files
   - [ ] Ensure portal still works without these files
   - [ ] Test all existing functionality

4. **Documentation Update**
   - [ ] Update any docs referencing these template files
   - [ ] Clarify template vs configuration architecture

## Technical Impact
- `/api/templates` will return empty array (correct for single template)
- ConfigGenerator template loading will be removed
- Wizard will work with single template architecture

## Definition of Done
- [ ] JSON files removed from templates folder
- [ ] No broken references in codebase
- [ ] All tests pass
- [ ] Portal and wizard still functional
- [ ] Committed and deployed

## Priority: CRITICAL
This blocks proper wizard implementation.