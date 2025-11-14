# Cypress E2E Tests

This directory contains end-to-end tests for the BeforePay frontend application.

## Setup

1. Install Cypress (if not already installed):
```bash
npm install --save-dev cypress
```

2. Make sure your frontend and backend servers are running:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001` (or your configured port)

## Running Tests

### Open Cypress Test Runner (Interactive Mode)
```bash
npm run cypress:open
```

### Run Tests Headlessly
```bash
npm run cypress:run
```

## Test Files

### `create-goal-and-link-bank.cy.js`
Tests the complete flow of:
1. Logging in
2. Creating a new savings goal
3. Setting up savings plan
4. Linking a bank account via Plaid OAuth
5. Verifying the goal appears on the home page with bank information

## Important Notes

### Plaid OAuth Handling
The test uses `cy.origin()` to handle cross-origin navigation to Plaid's OAuth page (`cdn.plaid.com`). This requires:
- Cypress version 9.7.0 or higher
- The `chromeWebSecurity: false` setting in `cypress.config.js` (already configured)

### Test Credentials
The test uses the following credentials:
- **Login**: `cypress_manual@test.com` / `Test1234`
- **Plaid Sandbox**: `custom_chaseparks` / `pass_test` / Code: `1234`

Make sure these accounts exist and are properly configured in your test environment.

### Plaid Iframe
Plaid Link opens in an iframe, which can be challenging for Cypress. The test attempts to handle this by:
1. Waiting for the iframe to load
2. Trying to interact with elements inside the iframe
3. Falling back to direct interaction if iframe access fails

If you encounter issues with Plaid iframe interaction, you may need to adjust the selectors or add additional waits.

## Troubleshooting

### Test fails at Plaid OAuth step
- Ensure `chromeWebSecurity: false` is set in `cypress.config.js`
- Verify you're using Cypress 9.7.0+ for `cy.origin()` support
- Check that Plaid sandbox credentials are correct

### Test can't find elements
- Add more specific `data-testid` attributes to components
- Increase timeout values if elements load slowly
- Check browser console for JavaScript errors

### Plaid iframe not accessible
- This is a known limitation with cross-origin iframes
- Consider using Plaid's test mode or mocking Plaid Link for faster tests
- You may need to use `cy.window()` and direct DOM manipulation

