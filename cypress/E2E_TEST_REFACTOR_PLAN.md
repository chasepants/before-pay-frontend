# E2E Test Refactor Plan

## Current Issues

### 1. Duplicate Code
- **Plaid OAuth flow duplicated 3 times** (lines 164-206, 217-258, 261-300)
  - Same steps repeated: login, get code, enter code, select account, checkboxes, continue, accept terms, connect
  - ~40 lines of identical code in each branch
- **Iframe interaction pattern repeated** (lines 100-112, 119-127, 133-154)
  - Same pattern: get iframe, access contents, interact
- **Stub setup duplicated** (lines 136-145)

### 2. Plaid OAuth Flow Problem

#### How Plaid OAuth Actually Works:
1. User clicks "Continue to Login" in Plaid iframe
2. Plaid calls `window.open()` to open a **popup window** for OAuth (`cdn.plaid.com`)
3. User completes OAuth in the popup window
4. When user clicks "Connect account information", Plaid:
   - Uses `window.opener.postMessage()` to send data back to the **parent window**
   - The parent window's `onSuccess` callback (from `usePlaidLink`) is triggered
   - The Plaid modal closes automatically
   - The app continues with the linked account

#### Why Our Cypress Approach Failed:
1. **We stubbed `window.open()`** - This prevented the popup from actually opening
2. **We manually navigated** using `cy.origin()` and `cy.visit()` - This does a **full page navigation**, not a popup
3. **No `window.opener` relationship** - When we navigate directly (not from a popup), there's no `window.opener` object
4. **Communication broken** - When Plaid tries to send data back via `window.opener.postMessage()`, it fails because:
   - We're not in a popup context anymore
   - There's no parent window to communicate with
   - The `onSuccess` callback never gets triggered

**The core issue**: We're trying to simulate a **popup window flow** using **full page navigation**, which breaks the `window.opener` communication mechanism that Plaid relies on.

#### Why We Can't Just Navigate Back:
- Even if we navigate back to `localhost:3000/setup-savings/:id`, the Plaid modal is still waiting for the `postMessage` callback
- The `onSuccess` callback hasn't been triggered, so the app doesn't know the account was linked
- The modal would still be open, waiting for a response that will never come

## Refactoring Plan

### Phase 1: Extract Duplicate Code

#### 1.1 Create Helper Functions
```javascript
// In cypress/support/commands.js or a separate helpers file

// Helper to interact with Plaid iframe
Cypress.Commands.add('withinPlaidIframe', (callback) => {
  cy.get('iframe', { timeout: 15000 })
    .should('exist')
    .then(($iframe) => {
      const iframeBody = $iframe.contents().find('body');
      cy.wrap(iframeBody).within(callback);
    });
});

// Helper to complete Plaid OAuth flow
function completePlaidOAuth(plaidUsername, plaidPassword, plaidCode) {
  // Step 15: Fill in Plaid credentials
  cy.get('input[type="text"], input[type="email"]').first().type(plaidUsername);
  cy.get('input[type="password"]').first().type(plaidPassword);
  cy.get('button').contains('Sign in', { timeout: 5000 }).click();

  // Step 16: Click "Get code"
  cy.contains('Get code', { timeout: 10000 }).click();

  // Step 17: Enter code
  cy.get('input[id="code"]', { timeout: 10000 }).type(plaidCode);

  // Step 18: Click submit
  cy.get('button[id="submit-code"]', { timeout: 5000 }).click();

  // Step 19: Click "Plaid Checking"
  cy.contains('Plaid Checking', { timeout: 10000 }).click();

  // Step 20: Click the two checkboxes
  cy.get('input[type="checkbox"]').then(($checkboxes) => {
    if ($checkboxes.length >= 2) {
      cy.wrap($checkboxes).eq(0).check();
      cy.wrap($checkboxes).eq(1).check();
    }
  });

  // Step 21: Click continue
  cy.contains('Continue', { timeout: 5000 }).click();

  // Step 22: Accept terms and conditions
  cy.get('input[type="checkbox"][id="terms"]', { timeout: 5000 }).check();

  // Step 23: Click "Connect account information"
  cy.get('button[id="submit-confirmation"]', { timeout: 5000 }).click();
  
  // Step 24: Wait for OAuth completion
  cy.get('div[id="oauth-user-instruction-header"]', { timeout: 10000 })
    .should('be.visible')
    .should('contain', 'Continue to Beforepay to finish account linking');
}
```

#### 1.2 Simplify Stub Handling
```javascript
// Single function to handle window.open stubbing and URL capture
function handlePlaidOAuthRedirect(plaidUsername, plaidPassword, plaidCode) {
  // Stub window.open on both iframe and main window
  cy.get('iframe', { timeout: 10000 })
    .should('exist')
    .then(($iframe) => {
      const iframeWindow = $iframe[0].contentWindow;
      if (iframeWindow) {
        cy.stub(iframeWindow, 'open').as('iframeWindowOpen');
      }
      cy.window().then((win) => {
        cy.stub(win, 'open').as('mainWindowOpen');
      });
    });

  // Click "Continue to Login"
  cy.withinPlaidIframe(() => {
    cy.contains('Continue to login', { timeout: 10000 })
      .should('be.visible')
      .click();
  });

  // Get URL from stub and navigate
  cy.wait(2000);
  cy.get('@iframeWindowOpen').then((iframeStub) => {
    let plaidUrl = null;
    if (iframeStub && iframeStub.called) {
      plaidUrl = iframeStub.getCall(0).args[0];
    } else {
      cy.get('@mainWindowOpen').then((mainStub) => {
        if (mainStub && mainStub.called) {
          plaidUrl = mainStub.getCall(0).args[0];
        }
      });
    }
    
    if (plaidUrl) {
      cy.origin('https://cdn.plaid.com', { args: { plaidUrl, plaidUsername, plaidPassword, plaidCode } }, ({ plaidUrl, plaidUsername, plaidPassword, plaidCode }) => {
        cy.visit(plaidUrl);
        completePlaidOAuth(plaidUsername, plaidPassword, plaidCode);
      });
    } else {
      // Fallback: assume navigation happened
      cy.origin('https://cdn.plaid.com', { args: { plaidUsername, plaidPassword, plaidCode } }, ({ plaidUsername, plaidPassword, plaidCode }) => {
        completePlaidOAuth(plaidUsername, plaidPassword, plaidCode);
      });
    }
  });
}
```

### Phase 2: Plaid OAuth Flow Strategy

#### Option A: Mock Plaid Link (Recommended for E2E)
**Pros:**
- Fast, reliable tests
- No dependency on Plaid's sandbox
- Can test all scenarios
- No OAuth redirect issues
- Can simulate `onSuccess` callback directly

**Cons:**
- Doesn't test actual Plaid integration
- Requires mocking setup

**Implementation:**
- Mock `usePlaidLink` hook to return a controlled `open` function
- When "Link Bank Account" is clicked, directly trigger the `onSuccess` callback with mock data
- This simulates what Plaid would do via `window.opener.postMessage()`
- Can test the full app flow including redirect back to home page
- Example:
  ```javascript
  // In test, mock usePlaidLink
  cy.window().then((win) => {
    // Mock the hook to capture onSuccess
    // Then trigger it directly with mock public_token and metadata
    win.plaidOnSuccess('mock-public-token', { accounts: [...] });
  });
  ```

#### Option B: Don't Stub window.open, Let Popup Open (Theoretical)
**Pros:**
- Tests real Plaid integration
- Uses actual Plaid sandbox
- Preserves `window.opener` relationship

**Cons:**
- **Cypress doesn't support multiple windows natively**
- Would need a plugin like `cypress-window-commands` or similar
- Still complex to handle popup communication
- May not work reliably

**Implementation:**
- Don't stub `window.open()`
- Let the popup actually open
- Use a Cypress plugin to switch between windows
- Complete OAuth in popup
- Wait for `postMessage` to trigger `onSuccess` in main window
- **Note**: This is theoretically possible but Cypress has limited support for multiple windows

#### Option C: Simulate window.opener.postMessage After OAuth
**Pros:**
- Tests real Plaid OAuth flow
- Can complete the full test

**Cons:**
- Complex to implement
- Need to manually trigger the callback
- May not match real behavior exactly

**Implementation:**
- Complete OAuth flow in `cy.origin()` context
- After OAuth completes, manually trigger `window.opener.postMessage()` from the main window
- This simulates what Plaid would do
- Example:
  ```javascript
  // After completing OAuth
  cy.window().then((win) => {
    // Manually trigger the postMessage that Plaid would send
    win.postMessage({
      eventName: 'PLAID_EVENT',
      metadata: { public_token: '...', accounts: [...] }
    }, '*');
  });
  ```
- **Challenge**: Need to know the exact message format Plaid uses

#### Option D: Split Tests
**Pros:**
- Simpler individual tests
- Can test goal creation without Plaid
- Can test Plaid linking separately

**Cons:**
- Doesn't test end-to-end flow
- More test files to maintain

**Implementation:**
- `create-goal.cy.js` - Test goal creation only
- `link-bank-account.cy.js` - Test Plaid linking only (with pre-created goal)
- `create-goal-and-link-bank.cy.js` - Full flow (if we solve Plaid redirect)

#### Option D: Accept Incomplete Test (Current State)
**Pros:**
- Tests most of the flow
- No complex mocking needed

**Cons:**
- Test doesn't verify final state
- Manual intervention required
- Not a true E2E test

## Recommended Approach

### Short Term (Immediate Cleanup)
1. **Extract duplicate Plaid OAuth code** into a helper function
2. **Simplify iframe interactions** with custom commands
3. **Consolidate stub handling** into a single function
4. **Keep current Plaid approach** but document the limitation clearly

### Long Term (Plaid Solution)
**Recommendation: Option A (Mock Plaid Link)**

1. **Create a Plaid mock service** that intercepts Plaid Link initialization
2. **Return mock public token** when Plaid Link "succeeds"
3. **Test the full flow** including redirect back to app
4. **Keep a separate integration test** for actual Plaid integration (manual or CI with special setup)

**Why this approach:**
- E2E tests should be fast and reliable
- Plaid integration can be tested separately (unit tests, integration tests)
- The app's handling of Plaid responses is what matters for E2E
- Avoids the complexity of cross-origin redirects in Cypress

## Action Items

### Immediate (Code Cleanup)
- [ ] Extract `completePlaidOAuth()` function
- [ ] Extract `withinPlaidIframe()` custom command
- [ ] Extract `handlePlaidOAuthRedirect()` function
- [ ] Simplify main test to use these helpers
- [ ] Remove duplicate code (should reduce from ~314 lines to ~150 lines)

### Future (Plaid Solution)
- [ ] Research Plaid test mode options
- [ ] Decide on mocking vs. real Plaid
- [ ] Implement chosen solution
- [ ] Complete the test to verify final state (goal on home page)

## Questions to Answer

1. **Do we need to test actual Plaid integration in E2E?**
   - Or can we mock it and test separately?

2. **What's the priority: speed/reliability vs. real integration testing?**
   - E2E tests should be fast and reliable
   - Integration tests can be slower and test real APIs

3. **Can we use Plaid's update mode instead of OAuth?**
   - Update mode might not require redirects
   - Would simplify the test significantly

