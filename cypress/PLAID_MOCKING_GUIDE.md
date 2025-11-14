# Plaid Link Mocking Guide for Cypress E2E Tests

## Overview

Based on HAR file analysis of the Plaid Link flow, this guide explains how to mock Plaid Link in Cypress tests.

## Understanding the Plaid Flow

From the HAR file (`plaid_request_profile.har`), we can see:

1. **Plaid Link Initialization:**
   - Plaid Link loads from `cdn.plaid.com` as an iframe
   - Makes internal API calls to `sandbox.plaid.com/link/workflow/*`:
     - `/link/workflow/start` - Initializes the workflow
     - `/link/workflow/event` - Sends events during the flow
     - `/link/workflow/next` - Moves to next step
     - `/link/workflow/poll` - Polls for updates

2. **Frontend Integration:**
   - Uses `react-plaid-link` library with `usePlaidLink` hook
   - When user completes flow, Plaid calls `onSuccess(public_token, metadata)`
   - The `metadata` object contains:
     ```javascript
     {
       institution: { name: 'Chase', institution_id: 'ins_1' },
       accounts: [{
         id: 'acc-123',
         name: 'Plaid Checking',
         mask: '0000',
         type: 'depository',
         subtype: 'checking'
       }]
     }
     ```

3. **Backend Integration:**
   - Frontend sends `public_token` to backend at `/api/bank/plaid/connect` or `/api/savings-goal/:id/schedule`
   - Backend exchanges `public_token` for `access_token` via Plaid API
   - Backend creates processor token for Unit Finance

## Mocking Strategy

### Option 1: Mock `usePlaidLink` Hook (Recommended)

Intercept the `react-plaid-link` module and stub the `usePlaidLink` hook:

```javascript
// In cypress/support/plaid-mock.js
Cypress.Commands.add('mockPlaidLink', () => {
  cy.window().then((win) => {
    // Store mock data
    win.__plaidMockData = {
      publicToken: 'public-sandbox-test-token',
      metadata: {
        institution: { name: 'Chase', institution_id: 'ins_1' },
        accounts: [{
          id: 'acc-test-123',
          name: 'Plaid Checking',
          mask: '0000',
          type: 'depository',
          subtype: 'checking'
        }]
      }
    };
  });
});

// Trigger the onSuccess callback
Cypress.Commands.add('triggerPlaidSuccess', () => {
  cy.window().then((win) => {
    const mockData = win.__plaidMockData;
    
    // Find the component instance and call onSuccess
    // This requires accessing React internals or using postMessage
    win.postMessage({
      type: 'PLAID_SUCCESS',
      public_token: mockData.publicToken,
      metadata: mockData.metadata
    }, '*');
  });
});
```

### Option 2: Intercept Backend API Calls

Mock the backend endpoints that handle Plaid tokens:

```javascript
// Mock the link token creation
cy.intercept('POST', '/api/bank/plaid-link-token', {
  statusCode: 200,
  body: { link_token: 'link-sandbox-mock-token' }
}).as('plaidLinkToken');

// Mock the token exchange
cy.intercept('POST', '/api/bank/plaid/connect', {
  statusCode: 200,
  body: { 
    success: true,
    accessToken: 'access-sandbox-mock-token'
  }
}).as('plaidConnect');
```

### Option 3: Direct Component Interaction (Current Approach)

Since Plaid Link runs in an iframe and is complex to mock, the current approach:
1. Waits for manual Plaid linking (30 seconds)
2. User manually completes the flow
3. Test continues after manual completion

This is documented in `test-transactions-with-plaid.cy.js`.

## Recommended Implementation

For automated tests, **Option 1** is best - mock the `usePlaidLink` hook directly:

```javascript
// In test file
beforeEach(() => {
  cy.mockPlaidLink({
    accountId: 'acc-test-123',
    accountName: 'Chase Checking',
    mask: '0000'
  });
});

it('should link bank account via Plaid', () => {
  // Click "Link Bank Account" button
  cy.get('[data-testid="link-bank-account-button"]').click();
  
  // Trigger mock Plaid success
  cy.triggerPlaidSuccess();
  
  // Verify account is linked
  cy.contains('Chase Checking').should('be.visible');
});
```

## Challenges

1. **Iframe Communication:** Plaid Link runs in an iframe, making it hard to interact with directly
2. **React Hook Access:** Accessing React hooks from Cypress requires accessing React internals
3. **postMessage Protocol:** Plaid uses a specific postMessage protocol that's not fully documented

## Current Status

The `test-transactions-with-plaid.cy.js` test currently uses manual Plaid linking with a 30-second wait. This is reliable but not fully automated.

## Future Improvements

1. Create a Cypress plugin that intercepts `react-plaid-link` at the module level
2. Use `cy.stub()` to replace the `usePlaidLink` function
3. Directly call the `onSuccess` callback with mock data

## References

- HAR file: `/Users/chaseparks/Downloads/plaid_request_profile.har`
- Plaid Link SDK: https://github.com/plaid/react-plaid-link
- Cypress Component Testing: https://docs.cypress.io/guides/component-testing

