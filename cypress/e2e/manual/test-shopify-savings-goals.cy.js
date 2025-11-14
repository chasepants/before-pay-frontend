describe('Shopify Abandoned Cart Flow (Manual)', () => {
  const baseUrl = 'http://localhost:3000';
  const apiBaseUrl = 'http://localhost:3001';
  const testEmail = 'shopify_customer@test.com';
  const testPassword = 'Test1234!';
  const checkoutId = '44057011322977';
  const emailToken = 'e10c809b-d102-4692-a39d-3e0cdd93c545';

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

  it('should create a savings goal from abandoned cart checkout', () => {
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
      cy.contains('Items in Your Cart', { timeout: 10000 }).should('be.visible');
      cy.log('✅ Page loaded successfully');
    });

    // Step 3: Verify checkout items are displayed
    cy.log('📋 Step 3: Verifying checkout items...');
    // cy.contains('The Collection Snowboard: Liquid', { timeout: 5000 }).should('be.visible');
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
    
    // Find the goal ID by looking for the row/card containing "Cart from"
    cy.get('body').then(($body) => {
      // Try desktop table first
      let goalId = null;
      const goalRow = $body.find('[data-testid^="goal-row-"]').filter((i, el) => {
        return Cypress.$(el).text().includes('Cart from');
      });
      
      if (goalRow.length > 0) {
        goalId = goalRow.attr('data-testid').replace('goal-row-', '');
      } else {
        // Try mobile card view
        const goalCard = $body.find('[data-testid^="mobile-goal-card-"]').filter((i, el) => {
          return Cypress.$(el).text().includes('Cart from');
        });
        if (goalCard.length > 0) {
          goalId = goalCard.attr('data-testid').replace('mobile-goal-card-', '');
        }
      }
      
      if (!goalId) {
        throw new Error('Could not find Shopify goal with "Cart from" text');
      }
      
      cy.wrap(goalId).as('shopifyGoalId');
      cy.log(`✅ Found Shopify goal on home page: ${goalId}`);
    });
    
    // Step 11: Click View button for the Shopify goal
    cy.log('👁️  Step 11: Clicking View button for Shopify goal...');
    cy.get('@shopifyGoalId').then((goalId) => {
      // Try desktop view button first
      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid="view-goal-${goalId}"]`).length > 0) {
          cy.get(`[data-testid="view-goal-${goalId}"]`, { timeout: 5000 })
            .should('be.visible')
            .click();
        } else {
          // Try mobile view button
          cy.get(`[data-testid="mobile-view-goal-${goalId}"]`, { timeout: 5000 })
            .should('be.visible')
            .click();
        }
      });
    });
    
    // Step 12: Verify View Order page displays correctly
    cy.log('📋 Step 12: Verifying View Order page...');
    cy.url({ timeout: 10000 }).should('include', '/view-order/');
    
    // Verify Installment Plan header
    cy.contains('Installment Plan', { timeout: 10000 }).should('be.visible');
    cy.contains('stashpay-2.myshopify.com', { timeout: 5000 }).should('be.visible');
    
    // Verify product details
    cy.contains('The Collection Snowboard: Liquid', { timeout: 10000 }).should('be.visible');
    cy.contains('Hydrogen Vendor', { timeout: 5000 }).should('be.visible');
    
    // Verify order totals
    cy.contains('Order Summary', { timeout: 5000 }).should('be.visible');
    cy.contains('$4.00', { timeout: 5000 }).should('be.visible'); // Total price
    
    // Verify quantity
    cy.contains('Qty', { timeout: 5000 }).should('be.visible');
    cy.contains('1', { timeout: 5000 }).should('be.visible'); // Quantity
    
    cy.log('✅ View Order page displays correctly');

    // Step 13: Process all four installments
    cy.log('💳 Step 13: Processing all four installments...');
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
          
          cy.log(`📅 Processing payment 1/4 for date: ${payment1Date}`);
          cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment1Date).then(() => {
            cy.wait(2000);
            cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 1, 1, 'Cart from');
            cy.log('✅ Payment 1/4 completed');
            
            // Process payment 2
            const payment2DateObj = new Date(payment1DateObj);
            payment2DateObj.setUTCMonth(payment2DateObj.getUTCMonth() + 1);
            payment2DateObj.setUTCDate(dayOfMonth);
            payment2DateObj.setUTCHours(0, 0, 0, 0);
            const payment2Date = payment2DateObj.toISOString().split('T')[0];
            
            cy.log(`📅 Processing payment 2/4 for date: ${payment2Date}`);
            cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment2Date).then(() => {
              cy.wait(2000);
              cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 2, 2, 'Cart from');
              cy.log('✅ Payment 2/4 completed');
              
              // Process payment 3
              const payment3DateObj = new Date(payment2DateObj);
              payment3DateObj.setUTCMonth(payment3DateObj.getUTCMonth() + 1);
              payment3DateObj.setUTCDate(dayOfMonth);
              payment3DateObj.setUTCHours(0, 0, 0, 0);
              const payment3Date = payment3DateObj.toISOString().split('T')[0];
              
              cy.log(`📅 Processing payment 3/4 for date: ${payment3Date}`);
              cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment3Date).then(() => {
                cy.wait(2000);
                cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 3, 3, 'Cart from');
                cy.log('✅ Payment 3/4 completed');
                
                // Process payment 4
                const payment4DateObj = new Date(payment3DateObj);
                payment4DateObj.setUTCMonth(payment4DateObj.getUTCMonth() + 1);
                payment4DateObj.setUTCDate(dayOfMonth);
                payment4DateObj.setUTCHours(0, 0, 0, 0);
                const payment4Date = payment4DateObj.toISOString().split('T')[0];
                
                cy.log(`📅 Processing payment 4/4 for date: ${payment4Date}`);
                cy.simulatePaymentForGoal(goalId, apiBaseUrl, payment4Date).then(() => {
                  cy.wait(2000);
                  cy.processAndVerifyPayment(goalId, apiBaseUrl, baseUrl, 4, 4, 'Cart from');
                  cy.log('✅ All 4 payments completed');
                });
              });
            });
          });
        });
      });
    });

    cy.log('✅ Shopify abandoned cart flow test completed successfully');
  });
});

