describe('Shopify Refund Flow (Manual)', () => {
  const baseUrl = 'http://localhost:3000';
  const apiBaseUrl = 'http://localhost:3001';
  const testEmail = 'roweashbyparks@gmail.com';
  const testPassword = 'Test1234!';
  const checkoutId = '44067729735777';
  const emailToken = '7457f1b8-3571-49e6-ac9d-74073c45175e';

  beforeEach(() => {
    // Clean up user data before each test to ensure clean state
    cy.cleanupUserData(testEmail, apiBaseUrl);
    cy.wait(1000); // Give cleanup time to complete
    
    // Reset EmailToken to unused state
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/api/test/reset-email-token`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        token: emailToken
      },
      failOnStatusCode: false
    });
    
    // Reset checkout cart orderId (since we reuse the same checkout cart across tests)
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/api/test/reset-checkout-cart`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        checkoutId: checkoutId
      },
      failOnStatusCode: false
    });
    
    // Visit the home page
    cy.visit(baseUrl);
  });

  afterEach(() => {
    // Clean up user data after each test
    cy.cleanupUserData(testEmail, apiBaseUrl);
    
    // Reset checkout cart orderId (since we reuse the same checkout cart across tests)
    cy.request({
      method: 'POST',
      url: `${apiBaseUrl}/api/test/reset-checkout-cart`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        checkoutId: checkoutId
      },
      failOnStatusCode: false
    });
  });

  it('should process all payments and then refund, pausing the goal', () => {
    // Step 1: Use existing abandoned cart setup
    cy.log('📦 Step 1: Using existing abandoned cart setup...');
    cy.log(`✅ Using checkoutId: ${checkoutId}, email: ${testEmail}, token: ${emailToken}`);
    cy.wrap(emailToken).as('emailToken');
    cy.wrap(checkoutId).as('checkoutId');

    // Step 2: Navigate to start-savings-plan page with token
    cy.get('@emailToken').then((token) => {
      cy.log('🔗 Step 2: Navigating to start-savings-plan page...');
      cy.visit(`${baseUrl}/start-savings-plan?token=${token}&checkout=${checkoutId}`);
      
      // Wait for page to load and validate token
      cy.contains('Start Your Savings Plan', { timeout: 10000 }).should('be.visible');
    //   cy.contains('Items in Your Cart', { timeout: 10000 }).should('be.visible');
      cy.log('✅ Page loaded successfully');
    });

    // Step 3: Verify checkout items are displayed
    cy.log('📋 Step 3: Verifying checkout items...');
    cy.contains('$4.00', { timeout: 5000 }).should('be.visible'); // Total price
    cy.contains('$1.00', { timeout: 5000 }).should('be.visible'); // Amount per payment (4/4)
    cy.log('✅ Checkout items verified');

    // Step 4: Link bank account (manual Plaid linking required)
    cy.log('🏦 Step 4: Linking bank account...');
    cy.contains('Link Bank Account', { timeout: 5000 })
      .should('be.visible')
      .click();

    // Wait for manual Plaid linking
    cy.log('⏳ Waiting 40 seconds for manual Plaid bank account linking...');
    cy.log('💡 Please link your bank account via Plaid in the browser');
    cy.wait(40000); // 40 seconds

    // Verify bank account is linked
    cy.contains('****', { timeout: 10000 }).should('be.visible');
    cy.log('✅ Bank account linked');

    // Step 5: Fill in password
    cy.log('🔐 Step 5: Filling in password...');
    cy.get('input[type="password"][id="password"]', { timeout: 5000 })
      .should('be.visible')
      .clear()
      .type(testPassword);
    cy.log('✅ Password filled');

    // Step 6: Verify form is ready (button should be enabled)
    cy.log('✅ Step 6: Verifying form is ready...');
    cy.get('button.btn-success', { timeout: 5000 })
      .should('be.visible')
      .should('not.be.disabled')
      .should('contain', 'Create Savings Plan');
    cy.log('✅ Form is ready');

    // Step 7: Create savings plan
    cy.log('💾 Step 7: Creating savings plan...');
    cy.get('button.btn-success', { timeout: 5000 })
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Step 8: Wait for navigation after creating savings plan
    cy.url({ timeout: 15000 }).should('satisfy', (url) => {
      return url.includes('/home') || url.includes('/login');
    });
    cy.log('✅ Savings plan created successfully');

    // Step 9: Handle login redirect if needed
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('🔐 Step 9: Redirected to login page, signing in...');
        
        // Verify we're on the login page
        cy.url({ timeout: 5000 }).should('include', '/login');
        cy.contains('Sign in with email', { timeout: 10000 })
          .should('be.visible')
          .click();
        
        // Wait for email auth modal and fill in credentials
        cy.get('[data-testid="email-auth-modal"]', { timeout: 5000 })
          .should('be.visible')
          .within(() => {
            cy.get('input[name="email"], input[type="email"]').type(testEmail);
            cy.get('input[name="password"], input[type="password"]').type(testPassword);
            cy.get('[data-testid="submit-button"]', { timeout: 5000 }).click();
          });
        
        // Assert we're now on the home page
        cy.url({ timeout: 10000 }).should('include', '/home');
        cy.log('✅ Successfully logged in and navigated to home');
      }
    });

    // Step 10: Verify goal appears on home page and get its ID
    cy.log('🔍 Step 10: Verifying goal appears on home page...');
    cy.url({ timeout: 10000 }).should('include', '/home');
    cy.contains('Savings Goals', { timeout: 10000 }).should('be.visible');
    cy.contains('Cart from', { timeout: 10000 }).should('be.visible');
    
    // Find the goal ID by looking for the row in Material UI DataGrid containing "Cart from stashpay-2"
    cy.get('body').then(($body) => {
      let goalId = null;
      
      // Try to find in Material UI DataGrid rows
      const dataGridRows = $body.find('[role="row"][data-id]');
      
      if (dataGridRows.length > 0) {
        dataGridRows.each((index, row) => {
          const $row = Cypress.$(row);
          const rowText = $row.text();
          if (rowText.includes('Cart from stashpay-2')) {
            goalId = $row.attr('data-id');
            return false; // Break the loop
          }
        });
      }
      
      // Fallback: Try old desktop table structure
      if (!goalId) {
        const goalRow = $body.find('[data-testid^="goal-row-"]').filter((i, el) => {
          return Cypress.$(el).text().includes('Cart from stashpay-2');
        });
        
        if (goalRow.length > 0) {
          goalId = goalRow.attr('data-testid').replace('goal-row-', '');
        }
      }
      
      // Fallback: Try mobile card view
      if (!goalId) {
        const goalCard = $body.find('[data-testid^="mobile-goal-card-"]').filter((i, el) => {
          return Cypress.$(el).text().includes('Cart from stashpay-2');
        });
        if (goalCard.length > 0) {
          goalId = goalCard.attr('data-testid').replace('mobile-goal-card-', '');
        }
      }
      
      if (!goalId) {
        throw new Error('Could not find Shopify goal with "Cart from stashpay-2" text');
      }
      
      cy.wrap(goalId).as('shopifyGoalId');
      cy.log(`✅ Found Shopify goal on home page: ${goalId}`);
    });
    
    // Step 11: Click View button for the Shopify goal
    cy.log('👁️  Step 11: Clicking View button for Shopify goal...');
    cy.get('@shopifyGoalId').then((goalId) => {
      // Find the row with this goal ID in Material UI DataGrid
      cy.get(`[data-id="${goalId}"][role="row"]`, { timeout: 5000 })
        .should('be.visible')
        .within(() => {
          // Find the View button (Material UI DataGrid actions)
          cy.get('button[aria-label="View"]', { timeout: 5000 })
            .should('be.visible')
            .click();
        });
    });
    
    // Step 12: Verify View Order page displays correctly
    cy.log('📋 Step 12: Verifying View Order page...');
    cy.url({ timeout: 10000 }).should('include', '/view-order/');
    
    // Verify Installment Plan header
    cy.contains('Installment Plan', { timeout: 10000 }).should('be.visible');
    cy.contains('stashpay-2.myshopify.com', { timeout: 5000 }).should('be.visible');
    
    // Verify product details
    // cy.contains('The Collection Snowboard: Liquid', { timeout: 10000 }).should('be.visible');
    // cy.contains('Hydrogen Vendor', { timeout: 5000 }).should('be.visible');
    
    // Verify order totals
    cy.contains('Order Summary', { timeout: 5000 }).should('be.visible');
    cy.contains('$4.00', { timeout: 5000 }).should('be.visible'); // Total price
    
    cy.log('✅ View Order page displays correctly');

    // Step 13: Process three installments (not all four - refund is only available before order is created)
    cy.log('💳 Step 13: Processing three installments (refund only available before order is created)...');
    cy.get('@shopifyGoalId').then((goalId) => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Get goal schedule to determine payment date
        cy.request({
          method: 'GET',
          url: `${apiBaseUrl}/api/savings-goal/${goalId}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }).then((goalResponse) => {
          const schedule = goalResponse.body.schedule;
          const dayOfMonth = schedule.dayOfMonth;
          
          // Process payment 1
          const payment1DateObj = new Date();
          payment1DateObj.setUTCDate(dayOfMonth);
          payment1DateObj.setUTCHours(0, 0, 0, 0);
          const payment1Date = payment1DateObj.toISOString().split('T')[0];
          
          cy.log(`📅 Processing payment 1/3 for date: ${payment1Date}`);
          cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment1Date).then(() => {
            cy.wait(2000);
            cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 1, 1, 'Cart from');
            cy.log('✅ Payment 1/3 completed');
            
            // Process payment 2
            const payment2DateObj = new Date(payment1DateObj);
            payment2DateObj.setUTCMonth(payment2DateObj.getUTCMonth() + 1);
            payment2DateObj.setUTCDate(dayOfMonth);
            payment2DateObj.setUTCHours(0, 0, 0, 0);
            const payment2Date = payment2DateObj.toISOString().split('T')[0];
            
            cy.log(`📅 Processing payment 2/3 for date: ${payment2Date}`);
            cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment2Date).then(() => {
              cy.wait(2000);
              cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 2, 2, 'Cart from');
              cy.log('✅ Payment 2/3 completed');
              
              // Process payment 3
              const payment3DateObj = new Date(payment2DateObj);
              payment3DateObj.setUTCMonth(payment3DateObj.getUTCMonth() + 1);
              payment3DateObj.setUTCDate(dayOfMonth);
              payment3DateObj.setUTCHours(0, 0, 0, 0);
              const payment3Date = payment3DateObj.toISOString().split('T')[0];
              
              cy.log(`📅 Processing payment 3/3 for date: ${payment3Date}`);
              cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment3Date).then(() => {
                cy.wait(2000);
                cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 3, 3, 'Cart from');
                cy.log('✅ All 3 payments completed');
                
                // Step 14: Wait for all payments to be completed and verify refund button is visible
                cy.log('🔄 Step 14: Verifying all payments are completed and refund button is available...');
                cy.wait(3000); // Give time for any async updates
                
                // Navigate back to ViewOrder page to see refund button
                cy.visit(`${baseUrl}/view-order/${goalId}`);
                cy.url({ timeout: 10000 }).should('include', '/view-order/');
                
                // Verify all 3 payments are completed
                cy.get('[data-testid^="payment-item-"]', { timeout: 10000 }).should('have.length.at.least', 3);
                
                // Verify refund button is visible (should be visible when all payments are completed)
                cy.get('[data-testid="refund-button"]', { timeout: 10000 })
                  .should('be.visible')
                  .should('contain', 'Refund All Savings');
                cy.log('✅ Refund button is visible');
                
                // Step 15: Set up alert handler before clicking refund
                cy.log('📢 Step 15: Setting up alert handler...');
                cy.window().then((win) => {
                  cy.stub(win, 'alert').as('alertStub');
                });
                
                // Step 16: Click refund button
                cy.log('💰 Step 16: Clicking refund button...');
                cy.get('[data-testid="refund-button"]', { timeout: 5000 })
                  .should('be.visible')
                  .click();
                
                // Step 17: Confirm refund in modal
                cy.log('✅ Step 17: Confirming refund in modal...');
                cy.get('.modal', { timeout: 5000 })
                  .should('be.visible')
                  .within(() => {
                    cy.contains('Confirm Refund', { timeout: 5000 }).should('be.visible');
                    cy.contains('Important:', { timeout: 5000 }).should('be.visible');
                    cy.contains('This will refund all your savings', { timeout: 5000 }).should('be.visible');
                    
                    // Click the confirm refund button
                    cy.get('button')
                      .contains('Confirm Refund', { timeout: 5000 })
                      .should('be.visible')
                      .should('not.be.disabled')
                      .click();
                  });
                
                // Step 18: Verify alert was shown
                cy.log('📢 Step 18: Verifying refund alert...');
                cy.get('@alertStub').should('have.been.called');
                cy.get('@alertStub').then((stub) => {
                  const alertMessage = stub.getCall(0).args[0];
                  expect(alertMessage).to.include('Refund initiated successfully');
                  expect(alertMessage).to.include('paused');
                  cy.log(`✅ Alert received: ${alertMessage}`);
                });
                
                // Wait for modal to close and state to update
                cy.wait(3000);
                
                // Step 19: Verify goal is paused
                cy.log('⏸️  Step 19: Verifying goal is paused...');
                
                // Refresh the page to get updated goal state
                cy.visit(`${baseUrl}/view-order/${goalId}`);
                cy.url({ timeout: 10000 }).should('include', '/view-order/');
                
                // Verify paused status is displayed
                cy.contains('This savings plan is paused', { timeout: 10000 }).should('be.visible');
                
                // Verify refund payment appears in the payment list
                cy.get('[data-testid^="payment-item-"]', { timeout: 10000 }).should('have.length.at.least', 4); // 3 payments + 1 refund
                
                // Verify refund button is no longer visible (goal is paused)
                cy.get('[data-testid="refund-button"]', { timeout: 5000 }).should('not.exist');
                
                // Verify on home page that goal shows as paused
                cy.visit(`${baseUrl}/home`);
                cy.url({ timeout: 10000 }).should('include', '/home');
                
                cy.get('@shopifyGoalId').then((goalId) => {
                  // Find the row in DataGrid and check for PAUSED status
                  cy.get(`[data-id="${goalId}"][role="row"]`, { timeout: 10000 })
                    .should('be.visible')
                    .within(() => {
                      // Check the Next Run column for PAUSED
                      cy.contains('PAUSED', { timeout: 10000 })
                        .should('be.visible');
                    });
                  cy.log('✅ Goal is paused on home page');
                });
                cy.log('✅ Refund flow test completed successfully');
              });
            });
          });
        });
      });
    });
  });
});

