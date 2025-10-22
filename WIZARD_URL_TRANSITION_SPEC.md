# Wizard URL Transition Architecture Specification

## Problem Statement
- Users start on `/wizard?new=true` and stay there for all 8 steps
- AI content requires `/wizard?continue=sessionId` flow to work
- No URL transition logic exists, breaking AI content access

## Solution Architecture

### URL Flow States
1. **NEW_SESSION_STATE**: `/wizard?new=true`
   - Steps: 0-2 (Welcome, Business Info, Business Description)
   - Purpose: Collect minimum data needed for session creation
   - Transition: After Step 2 completion

2. **CONTINUE_SESSION_STATE**: `/wizard?continue=sessionId`
   - Steps: 3-7 (Template, Content Review, Images, Contact, Site Creation)
   - Purpose: Complete wizard with AI content access
   - AI Content: Available from Step 4 onwards

### Transition Logic
**TRIGGER POINT**: After Step 2 (Business Description) completion
**CONDITION**: Session has enough data (businessInfo, businessDescription)
**ACTION**: `router.replace('/wizard?continue=' + sessionId)`

### Implementation Points

#### 1. Wizard Provider Updates
- Add `shouldTransitionToContinue()` check
- Add URL transition logic in `nextStep()` function
- Preserve all wizard data during transition

#### 2. Router Integration  
- Use Next.js `router.replace()` to avoid back button issues
- Maintain step number in URL: `?continue=sessionId&step=3`
- Ensure seamless transition without data loss

#### 3. Session Validation
- Verify session exists before transition
- Handle edge cases (session not found, network errors)
- Fallback to current behavior if transition fails

#### 4. AI Content Integration
- Ensure AI requests are created after transition
- Verify AI content polling works on continue flow
- Test AI content display in Step 4

## Success Criteria
1. ✅ User starts on `/wizard?new=true` 
2. ✅ After Step 2, URL changes to `/wizard?continue=sessionId`
3. ✅ Wizard continues seamlessly without data loss
4. ✅ AI content appears in Step 4 when completed by admin
5. ✅ All existing functionality remains intact

## Risk Mitigation
- **Data Loss**: Implement robust state preservation during URL change
- **Session Mismatch**: Add session validation before transition
- **Backward Compatibility**: Maintain support for existing flows
- **Browser Issues**: Handle edge cases with router.replace()

## Testing Strategy
1. **Unit Tests**: URL transition logic
2. **Integration Tests**: Wizard flow end-to-end
3. **Manual Testing**: Real user journey validation
4. **Edge Cases**: Network failures, browser refresh, back button