// Custom command to interact with Plaid Link iframe
Cypress.Commands.add('getPlaidIframe', () => {
  return cy
    .get('iframe[src*="plaid"], iframe[id*="plaid"], iframe[title*="Plaid"]', { timeout: 10000 })
    .should('be.visible')
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap);
});

// Custom command to interact with elements inside Plaid iframe
Cypress.Commands.add('withinPlaidIframe', (callback) => {
  cy.getPlaidIframe().within(callback);
});

/**
 * Custom command to fill out and submit the CreateSavingsGoal form
 * @param {Object} options - Form data
 * @param {string} options.goalName - Name of the savings goal
 * @param {string} options.description - Description of the goal (required)
 * @param {string|number} options.targetAmount - Target amount for the goal
 * @param {string} options.category - Category (defaults to 'other')
 * @param {string} options.productLink - Optional product link
 * @returns {Cypress.Chainable} - Chainable for further assertions
 * 
 * @example
 * cy.fillCreateSavingsGoalForm({
 *   goalName: 'My Goal',
 *   description: 'Test description',
 *   targetAmount: 200,
 *   category: 'other'
 * });
 */
Cypress.Commands.add('fillCreateSavingsGoalForm', (options = {}) => {
  const {
    goalName = 'Test Savings Goal',
    description = 'Test description for savings goal',
    targetAmount = 200,
    category = 'other',
    productLink = ''
  } = options;

  cy.log(`📝 Filling out CreateSavingsGoal form: ${goalName}`);

  // Fill goal name
  cy.get('input[name="goalName"], input[placeholder*="Savings Goal Name"]', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(goalName);

  // Fill description (required field)
  cy.get('input[name="description"], input[placeholder*="Description"]', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(description);

  // Fill target amount
  cy.get('input[type="number"][placeholder*="Target Amount"], input[name="targetAmount"], input[name="amount"]', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(targetAmount.toString());

  // Select category
  cy.get('[data-testid="category-select"]', { timeout: 5000 })
    .should('be.visible')
    .select(category);

  // Fill product link if provided
  if (productLink) {
    cy.get('input[name="productLink"], input[placeholder*="Product Link"]', { timeout: 5000 })
      .should('be.visible')
      .clear()
      .type(productLink);
  }

  // Submit the form
  cy.get('button[type="submit"]', { timeout: 5000 })
    .should('not.be.disabled')
    .click();

  cy.log('✅ CreateSavingsGoal form submitted');
});

/**
 * Custom command to clean up all savings goals for the authenticated user
 * This ensures tests start with a clean state
 * 
 * @example
 * cy.cleanupUserGoals();
 */
Cypress.Commands.add('cleanupUserGoals', (apiBaseUrl = 'http://localhost:3001') => {
  cy.log('🧹 Cleaning up all savings goals for user...');
  
  cy.window().then((win) => {
    const token = win.localStorage.getItem('authToken');
    
    if (!token) {
      cy.log('⚠️  No auth token found, skipping cleanup');
      return;
    }
    
    // Get all goals for the user
    cy.request({
      method: 'GET',
      url: `${apiBaseUrl}/api/savings-goal`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200 && response.body && Array.isArray(response.body)) {
        const goals = response.body;
        cy.log(`Found ${goals.length} goals to clean up`);
        
        // Delete each goal sequentially
        if (goals.length > 0) {
          cy.wrap(goals).each((goal) => {
            cy.request({
              method: 'DELETE',
              url: `${apiBaseUrl}/api/savings-goal/${goal._id}`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              failOnStatusCode: false
            }).then(() => {
              cy.log(`✅ Deleted goal: ${goal._id}`);
            });
          });
        } else {
          cy.log('✅ No goals to clean up');
        }
      } else {
        cy.log('⚠️  No goals found or invalid response');
      }
    });
  });
});

/**
 * Custom command to find and interact with a specific savings goal on the home page
 * @param {string} savingsGoalId - The ID of the savings goal to find
 * @param {Object} options - Options for interaction
 * @param {boolean} options.clickView - Whether to click the View button
 * @param {boolean} options.verifyAmount - Whether to verify the current amount
 * @param {number} options.expectedAmount - Expected current amount
 * 
 * @example
 * cy.findGoalOnHomePage('goal-id-123', { clickView: true, verifyAmount: true, expectedAmount: 50 });
 */
Cypress.Commands.add('findGoalOnHomePage', (savingsGoalId, options = {}) => {
  const { clickView = false, verifyAmount = false, expectedAmount = null } = options;
  
  cy.log(`🔍 Looking for goal ${savingsGoalId} on home page...`);
  
  // Try desktop table first
  cy.get('body').then(($body) => {
    if ($body.find(`[data-testid="goal-row-${savingsGoalId}"]`).length > 0) {
      cy.get(`[data-testid="goal-row-${savingsGoalId}"]`, { timeout: 10000 })
        .should('be.visible')
        .then(($row) => {
          if (verifyAmount && expectedAmount !== null) {
            cy.wrap($row).within(() => {
              cy.contains(`$${expectedAmount}`, { timeout: 5000 }).should('be.visible');
            });
          }
          
          if (clickView) {
            cy.get(`[data-testid="view-goal-${savingsGoalId}"]`, { timeout: 5000 })
              .should('be.visible')
              .click();
          }
        });
    } else {
      // Try mobile card
      cy.get(`[data-testid="mobile-goal-card-${savingsGoalId}"]`, { timeout: 10000 })
        .should('be.visible')
        .then(($card) => {
          if (verifyAmount && expectedAmount !== null) {
            cy.wrap($card).within(() => {
              cy.contains(`${expectedAmount}`, { timeout: 5000 }).should('be.visible');
            });
          }
          
          if (clickView) {
            cy.get(`[data-testid="mobile-view-goal-${savingsGoalId}"]`, { timeout: 5000 })
              .should('be.visible')
              .click();
          }
        });
    }
  });
});

/**
 * Custom command to login with email and password
 * @param {string} email - Email address
 * @param {string} password - Password
 * 
 * @example
 * cy.loginWithEmail('test@example.com', 'password123');
 */
Cypress.Commands.add('loginWithEmail', (email, password) => {
  cy.log(`🔐 Logging in with email: ${email}`);
  
  // Click "Sign In" button (may be on landing page or elsewhere)
  cy.contains('Sign In', { timeout: 10000 }).click();
  
  // Wait for login page to load and "Sign in with email" button to be visible, then click it
  cy.contains('Sign in with email', { timeout: 10000 })
    .should('be.visible')
    .click();
  
  // Wait for email auth modal to appear
  cy.get('[data-testid="email-auth-modal"]', { timeout: 5000 })
    .should('be.visible')
    .within(() => {
      cy.get('input[name="email"], input[type="email"]').type(email);
      cy.get('input[name="password"], input[type="password"]').type(password);
      cy.get('[data-testid="submit-button"]', { timeout: 5000 }).click();
    });
  
  // Wait for successful login and navigation to home
  cy.url({ timeout: 10000 }).should('include', '/home');
  cy.log('✅ Logged in successfully');
});

/**
 * Custom command to set up a savings plan with manual Plaid linking
 * @param {Object} options - Savings plan options
 * @param {string|number} options.amount - Savings amount
 * @param {string} options.startDate - Start date (ISO format, defaults to today)
 * @param {string} options.interval - Interval ('Weekly' or 'Monthly', defaults to 'Weekly')
 * @param {number} options.waitTime - Wait time for manual Plaid linking in ms (defaults to 40000)
 * 
 * @example
 * cy.setupSavingsPlanWithManualPlaid({ amount: 50, interval: 'Weekly' });
 */
Cypress.Commands.add('setupSavingsPlanWithManualPlaid', (options = {}) => {
  const {
    amount,
    startDate = new Date().toISOString().split('T')[0],
    interval = 'Weekly',
    waitTime = 40000
  } = options;

  if (!amount) {
    throw new Error('Amount is required for setupSavingsPlanWithManualPlaid');
  }

  cy.log(`💰 Setting up savings plan: $${amount}, ${interval}`);

  // Fill in savings amount
  cy.get('[data-testid="savings-amount-input"]', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(amount.toString());

  // Fill in start date
  cy.get('[data-testid="start-date-input"]', { timeout: 5000 })
    .should('be.visible')
    .clear()
    .type(startDate);

  // Select interval
  cy.get('[data-testid="interval-select"]', { timeout: 5000 })
    .should('be.visible')
    .select(interval);

  // Wait for manual Plaid linking
  cy.log(`⏳ Waiting ${waitTime / 1000} seconds for manual Plaid bank account linking...`);
  cy.log('💡 Please link your bank account via Plaid in the browser');
  cy.wait(waitTime);

  // Click the Create button
  cy.get('[data-testid="create-savings-plan-button"]', { timeout: 5000 })
    .should('be.visible')
    .should('not.be.disabled')
    .click();

  cy.log('✅ Savings plan form submitted');

  // Wait for alert to appear and auto-dismiss (Cypress handles this automatically)
  // Then wait for navigation to home page
  cy.url({ timeout: 15000 }).should('include', '/home');
  cy.log('✅ Navigated to home page');
});

/**
 * Custom command to create a savings goal and navigate to setup page
 * @param {Object} options - Goal options (same as fillCreateSavingsGoalForm)
 * @returns {Cypress.Chainable<string>} - The savings goal ID
 * 
 * @example
 * cy.createSavingsGoal({ goalName: 'My Goal', description: 'Test', targetAmount: 200 })
 *   .then((goalId) => {
 *     cy.log(`Created goal: ${goalId}`);
 *   });
 */
Cypress.Commands.add('createSavingsGoal', (options = {}) => {
  cy.log('📝 Creating savings goal...');
  
  cy.contains('Add New Goal', { timeout: 10000 }).click();
  cy.url({ timeout: 10000 }).should('include', '/create-savings-goal');
  
  cy.fillCreateSavingsGoalForm(options);
  
  cy.url({ timeout: 10000 }).should('include', '/setup-savings');
  
  // Extract and return the goal ID
  return cy.url().then((url) => {
    const match = url.match(/\/setup-savings\/([a-f0-9]{24})/);
    if (match) {
      const goalId = match[1];
      cy.log(`✅ Created savings goal: ${goalId}`);
      return cy.wrap(goalId);
    } else {
      throw new Error('Could not extract savings goal ID from URL');
    }
  });
});

/**
 * Custom command to simulate a payment for a savings goal
 * @param {string} savingsGoalId - The savings goal ID
 * @param {string} apiBaseUrl - The API base URL
 * @param {string} paymentDate - Optional payment date (ISO format, defaults to today)
 * @returns {Cypress.Chainable} - Chainable for further assertions
 * 
 * @example
 * cy.simulatePaymentForGoal('goal-id-123', 'http://localhost:3001');
 */
Cypress.Commands.add('simulatePaymentForGoal', (savingsGoalId, apiBaseUrl, paymentDate = null) => {
  cy.log(`💳 Simulating payment for goal: ${savingsGoalId}`);
  
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('authToken');
    
    // Get goal schedule to calculate payment date if not provided
    return cy.request({
      method: 'GET',
      url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      failOnStatusCode: false
    }).then((goalResponse) => {
      if (goalResponse.status !== 200) {
        cy.log(`⚠️  Failed to fetch goal: ${goalResponse.status}`);
        return;
      }
      
      const date = paymentDate || new Date().toISOString().split('T')[0];
      
      // Simulate payment
      return cy.request({
        method: 'POST',
        url: `${apiBaseUrl}/api/test/simulate-payments`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: { date },
        failOnStatusCode: false
      }).then((simResponse) => {
        if (simResponse.status === 200) {
          cy.log('✅ Payment simulated successfully');
        } else {
          cy.log(`⚠️  Payment simulation failed: ${simResponse.status}`);
        }
        return cy.wrap(simResponse);
      });
    });
  });
});

/**
 * Custom command to process a payment (transmit and clear) for a savings goal
 * @param {string} savingsGoalId - The savings goal ID
 * @param {string} apiBaseUrl - The API base URL
 * @returns {Cypress.Chainable<string>} - The payment ID
 * 
 * @example
 * cy.processPaymentForGoal('goal-id-123', 'http://localhost:3001')
 *   .then((paymentId) => {
 *     cy.log(`Processed payment: ${paymentId}`);
 *   });
 */
Cypress.Commands.add('processPaymentForGoal', (savingsGoalId, apiBaseUrl) => {
  cy.log(`🔄 Processing payment for goal: ${savingsGoalId}`);
  
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('authToken');
    
    // Get the payment ID from the goal
    return cy.request({
      method: 'GET',
      url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      failOnStatusCode: false
    }).then((goalResponse) => {
      if (goalResponse.status !== 200 || !goalResponse.body.transfers || goalResponse.body.transfers.length === 0) {
        cy.log('⚠️  No transfers found for goal');
        return cy.wrap(null);
      }
      
      const latestTransfer = goalResponse.body.transfers[goalResponse.body.transfers.length - 1];
      const paymentId = latestTransfer?.transferId || latestTransfer?.transactionId;
      
      if (!paymentId) {
        cy.log('⚠️  No payment ID found in latest transfer');
        return cy.wrap(null);
      }
      
      cy.log(`💳 Processing payment: ${paymentId}`);
      
      // Transmit the payment
      return cy.request({
        method: 'POST',
        url: `${apiBaseUrl}/api/test/transmit-payment`,
        headers: { 'Content-Type': 'application/json' },
        body: { paymentId },
        failOnStatusCode: false
      }).then((transmitResponse) => {
        if (transmitResponse.status === 200 || transmitResponse.status === 201) {
          cy.log('✅ Payment transmitted successfully');
          cy.wait(1000);
          
          // Clear the payment
          return cy.request({
            method: 'POST',
            url: `${apiBaseUrl}/api/test/clear-payment`,
            headers: { 'Content-Type': 'application/json' },
            body: { paymentId },
            failOnStatusCode: false
          }).then((clearResponse) => {
            if (clearResponse.status === 200 || clearResponse.status === 201) {
              cy.log('✅ Payment cleared successfully');
            } else if (clearResponse.status === 500) {
              cy.log('⚠️  Clear payment failed with 500 - payment may already be in completed state');
            } else {
              cy.log(`⚠️  Clear payment failed: ${clearResponse.status}`);
            }
            return cy.wrap(paymentId);
          });
        } else {
          cy.log(`⚠️  Transmit payment failed: ${transmitResponse.status}`);
          return cy.wrap(null);
        }
      });
    });
  });
});

/**
 * Custom command to verify bank info appears on home page for a goal
 * @param {string} savingsGoalId - The savings goal ID
 * 
 * @example
 * cy.verifyBankInfoOnHomePage('goal-id-123');
 */
Cypress.Commands.add('verifyBankInfoOnHomePage', (savingsGoalId) => {
  cy.log(`🔍 Verifying bank info on home page for goal: ${savingsGoalId}`);
  
  cy.get(`[data-testid="transfer-from-${savingsGoalId}"]`, { timeout: 10000 })
    .should('be.visible')
    .should('not.contain', 'Not set')
    .should('contain', '****'); // Should show last 4 digits
  
  cy.log('✅ Bank info verified on home page');
});

/**
 * Custom command to calculate next payment date based on schedule
 * @param {Object} schedule - Schedule object with interval, dayOfWeek, or dayOfMonth
 * @returns {Cypress.Chainable<string>} - Next payment date in ISO format (YYYY-MM-DD)
 * 
 * @example
 * cy.calculateNextPaymentDate({ interval: 'Weekly', dayOfWeek: 'Monday' })
 *   .then((date) => {
 *     cy.log(`Next payment date: ${date}`);
 *   });
 */
Cypress.Commands.add('calculateNextPaymentDate', (schedule) => {
  if (!schedule || !schedule.interval) {
    return cy.wrap(new Date().toISOString().split('T')[0]); // Default to today
  }

  const today = new Date();
  let nextPaymentDate;

  if (schedule.interval === 'Monthly' && schedule.dayOfMonth) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, schedule.dayOfMonth);
    if (nextMonth.getDate() !== schedule.dayOfMonth) {
      nextMonth.setDate(0); // Last day of month
    }
    nextPaymentDate = nextMonth.toISOString().split('T')[0];
  } else if (schedule.interval === 'Weekly' && schedule.dayOfWeek) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = daysOfWeek.indexOf(schedule.dayOfWeek);
    const currentDayIndex = today.getDay();
    let daysUntilNext = (targetDayIndex - currentDayIndex + 7) % 7;
    if (daysUntilNext === 0) daysUntilNext = 7; // Next week
    const nextPayment = new Date(today);
    nextPayment.setDate(today.getDate() + daysUntilNext);
    nextPaymentDate = nextPayment.toISOString().split('T')[0];
  } else {
    nextPaymentDate = today.toISOString().split('T')[0];
  }

  return cy.wrap(nextPaymentDate);
});

/**
 * Custom command to clean up user data (DB and Firebase) after test
 * @param {string} email - User email to clean up
 * @param {string} apiBaseUrl - The API base URL
 * 
 * @example
 * cy.cleanupUserData('test@example.com', 'http://localhost:3001');
 */
Cypress.Commands.add('cleanupUserData', (email, apiBaseUrl) => {
  cy.log(`🧹 Cleaning up user data (DB and Firebase) for: ${email}`);
  
  return cy.request({
    method: 'DELETE',
    url: `${apiBaseUrl}/api/test/cleanup-user`,
    headers: {
      'Content-Type': 'application/json'
    },
    body: { email },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      if (response.body.deleted) {
        cy.log('✅ User data cleaned up successfully (DB and Firebase)');
      } else {
        cy.log('⚠️  User not found in database (may not have been created)');
      }
    } else {
      cy.log(`⚠️  Cleanup response: ${response.status}`, response.body);
    }
  });
});

/**
 * Custom command to process a payment and verify it's completed on both view and home pages
 * @param {string} savingsGoalId - The savings goal ID
 * @param {string} apiBaseUrl - The API base URL
 * @param {string} baseUrl - The frontend base URL
 * @param {number} paymentNumber - Payment number (for logging)
 * @param {number} expectedCurrentAmount - Expected current amount after payment
 * @param {string} goalName - Goal name (for verification)
 * 
 * @example
 * cy.processAndVerifyPayment('goal-id-123', 'http://localhost:3001', 'http://localhost:3000', 1, 100, 'My Goal');
 */
Cypress.Commands.add('processAndVerifyPayment', (savingsGoalId, apiBaseUrl, baseUrl, paymentNumber, expectedCurrentAmount, goalName) => {
  cy.log(`💳 Payment ${paymentNumber}: Processing and verifying payment...`);
  
  return cy.processPaymentForGoal(savingsGoalId, apiBaseUrl).then(() => {
    cy.wait(2000);
    
    // Fetch goal to determine if it's a Shopify or Manual goal
    return cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      
      return cy.request({
        method: 'GET',
        url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        failOnStatusCode: false
      }).then((response) => {
        const isShopifyGoal = response.body && response.body.__t === 'ShopifySavingsGoal';
        const viewRoute = isShopifyGoal ? '/view-order/' : '/view-savings/';
        
        // Navigate to the appropriate view page
        cy.visit(`${baseUrl}${viewRoute}${savingsGoalId}`);
        cy.url({ timeout: 10000 }).should('include', viewRoute);
        // cy.contains(goalName, { timeout: 10000 }).should('be.visible');
        cy.wait(2000);
        
        if (isShopifyGoal) {
          // Shopify goals use payment items with data-testid, not tables
          cy.get('[data-testid^="payment-item-"]', { timeout: 10000 }).should('have.length.at.least', paymentNumber);
          cy.get(`[data-testid="payment-item-${paymentNumber - 1}"]`, { timeout: 10000 }).within(() => {
            // Verify payment status is completed
            cy.get(`[data-testid="payment-status-icon-${paymentNumber - 1}"]`, { timeout: 10000 })
              .should('be.visible')
              .should('have.class', 'bi-check-circle-fill');
            // Verify payment amount
            // Note: ViewOrder page shows individual payment amounts, not currentAmount
            // cy.contains(`$${expectedCurrentAmount.toFixed(2)}`).should('be.visible');
          });
        } else {
          // Manual goals use tables
          cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', paymentNumber);
          cy.get('table tbody tr').eq(paymentNumber - 1).within(() => {
            cy.get('.badge.bg-success', { timeout: 10000 })
              .should('be.visible')
              .should('contain', 'completed');
            cy.contains('$100').should('be.visible');
          });
        }
        
        // Verify current amount on view page
        // Note: ViewOrder page (Shopify goals) doesn't display currentAmount, so skip for Shopify goals
        if (!isShopifyGoal) {
          cy.contains(`${expectedCurrentAmount}`, { timeout: 5000 }).should('be.visible');
        }
        
        // Navigate to home and verify current amount there too
        cy.get('nav img[alt="App Logo"]', { timeout: 5000 }).click();
        cy.url({ timeout: 10000 }).should('include', '/home');
        cy.contains(goalName, { timeout: 10000 }).should('be.visible');
        
        cy.findGoalOnHomePage(savingsGoalId, { verifyAmount: true, expectedAmount: expectedCurrentAmount });
        
        cy.log(`✅ Payment ${paymentNumber}: Processed and verified successfully`);
      });
    });
  });
});

