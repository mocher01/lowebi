# Wizard End-to-End Test Plan

## Test Objective
Validate that the URL transition fix enables AI content to appear in Step 4 of the wizard.

## Pre-Test Setup
1. Frontend rebuilt with URL transition logic
2. Backend running with AI content fixes
3. Clean database state for testing

## Test Scenarios

### Scenario 1: New Wizard Complete Journey
**Objective**: Verify full wizard flow with URL transition

**Steps**:
1. ✅ Navigate to `/wizard?new=true`
2. ✅ Complete Step 0 (Welcome - Accept terms)
3. ✅ Complete Step 1 (Business Info - Enter name)
4. ✅ Complete Step 2 (Business Description)
5. ✅ Click Next → **CRITICAL: URL should change to `/wizard?continue=sessionId&step=3`**
6. ✅ Complete Step 3 (Template Selection)  
7. ✅ Reach Step 4 (Content Review)
8. ✅ Verify Step 4 shows "📋 services" tab with AI content request button
9. ✅ Request AI content for services
10. ✅ Complete AI request in admin portal
11. ✅ Return to wizard Step 4
12. ✅ **CRITICAL: Verify AI-generated services appear in Step 4**

**Success Criteria**:
- URL transitions from `?new=true` to `?continue=sessionId` after Step 2
- AI content appears in Step 4 after admin completion
- No data loss during URL transition
- All wizard functionality remains intact

### Scenario 2: URL Transition Verification
**Objective**: Verify URL transition happens at the right moment

**Test Points**:
1. Step 0→1: URL stays `/wizard?new=true`
2. Step 1→2: URL stays `/wizard?new=true`  
3. **Step 2→3: URL changes to `/wizard?continue=sessionId&step=3`**
4. Step 3→4: URL stays on continue flow
5. Browser refresh works correctly on continue URL
6. Back/forward navigation works properly

### Scenario 3: Edge Cases
**Objective**: Test error conditions and fallbacks

**Test Cases**:
- Session creation fails during transition
- Network error during URL change
- Browser refresh during transition
- Invalid session ID in continue URL
- Missing wizard data during transition

### Scenario 4: Backward Compatibility
**Objective**: Ensure existing flows still work

**Test Cases**:
- Direct access to `/wizard?continue=existingSessionId` 
- Edit mode: `/wizard?edit=siteId`
- Manual continue URLs with step parameters
- Existing completed wizards still accessible

## Automated Test Implementation

### Unit Test: URL Transition Logic
```javascript
describe('Wizard URL Transition', () => {
  test('should redirect after step 2 completion', () => {
    const mockRouter = { replace: jest.fn() };
    const wizardData = { 
      businessInfo: { businessName: 'Test Business' },
      businessDescription: 'Test description'
    };
    const sessionId = 'wizard_test_123';
    
    // Simulate nextStep from step 2→3
    nextStep(); // Implementation with mocked dependencies
    
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/wizard?continue=wizard_test_123&step=3'
    );
  });
});
```

### Integration Test: Full Wizard Flow
```javascript
describe('Wizard End-to-End', () => {
  test('should complete full wizard with AI content', async () => {
    // 1. Start wizard
    await page.goto('/wizard?new=true');
    
    // 2. Complete steps 0-2
    await completeBuisnessInfo();
    
    // 3. Verify URL transition
    await page.waitForURL(/continue=/);
    expect(page.url()).toContain('continue=');
    
    // 4. Complete to step 4
    await completeToContentReview();
    
    // 5. Request AI content
    await requestAiServices();
    
    // 6. Admin completes request
    await completeAiRequestInAdmin();
    
    // 7. Verify content appears
    const servicesContent = await page.locator('[data-testid="ai-services"]');
    await expect(servicesContent).toBeVisible();
  });
});
```

## Manual Testing Checklist

### Pre-Deployment Testing
- [ ] Code builds without errors
- [ ] TypeScript compilation passes
- [ ] No console errors during wizard flow
- [ ] Router.replace() works in test environment

### Post-Deployment Testing
- [ ] Create new wizard from `/wizard?new=true`
- [ ] Verify URL transition after Step 2
- [ ] Confirm AI content appears in Step 4
- [ ] Test browser refresh on continue URL
- [ ] Verify back/forward navigation
- [ ] Test multiple wizard sessions simultaneously

## Success Metrics
1. **URL Transition**: 100% success rate for Step 2→3 transition
2. **AI Content Display**: AI content appears in Step 4 after admin completion
3. **Data Integrity**: No data loss during URL transition
4. **User Experience**: Seamless flow without user awareness of URL change
5. **Error Handling**: Graceful fallback if transition fails

## Failure Criteria
- URL doesn't change after Step 2
- Data is lost during transition  
- AI content still doesn't appear
- Browser navigation breaks
- Console errors occur

## Post-Implementation Validation
1. Test with real user data
2. Verify in production environment
3. Monitor for edge cases
4. Confirm AI content polling works
5. Validate session persistence