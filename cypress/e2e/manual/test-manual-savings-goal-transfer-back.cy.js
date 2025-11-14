describe('Batch Transfer Back E2E Test (Manual)', () => {
  const baseUrl = 'http://localhost:3000';
  const apiBaseUrl = 'http://localhost:3001';
  const testEmail = 'cypress_manual@test.com';
  const testPassword = 'Test1234';

  let savingsGoalId1;
  let savingsGoalId2;

  beforeEach(() => {
    // Visit the app
    cy.visit(baseUrl);
  });

  // Clean up all goals after login (in the test itself, after login step)

  afterEach(() => {
    // Clean up: Delete both savings goals
    cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      
      if (savingsGoalId1) {
        cy.request({
          method: 'DELETE',
          url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId1}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          failOnStatusCode: false
        }).then(() => {
          cy.log('✅ Cleaned up savings goal 1');
        });
      }
      
      if (savingsGoalId2) {
        cy.request({
          method: 'DELETE',
          url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId2}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          failOnStatusCode: false
        }).then(() => {
          cy.log('✅ Cleaned up savings goal 2');
        });
      }
    });
  });

  it('should create two goals, make $50 payments to each, then transfer back $30 ($20 to goal 1, $10 to goal 2)', () => {
    // Step 1: Login and cleanup
    cy.loginWithEmail(testEmail, testPassword);
    cy.cleanupUserGoals(apiBaseUrl);
    cy.wait(2000); // Give cleanup time to complete

    // Step 2: Create first savings goal
    cy.createSavingsGoal({
      goalName: 'Transfer Back Test Goal 1',
      description: 'Test goal for batch transfer back',
      targetAmount: 200,
      category: 'other'
    }).then((goalId) => {
      savingsGoalId1 = goalId;
      cy.wrap(goalId).as('savingsGoalId1');
    });

    // Step 3: Set up savings plan for goal 1 (manual Plaid linking required)
    cy.setupSavingsPlanWithManualPlaid({ amount: 50, interval: 'Weekly' });
    cy.log('✅ Savings plan set up for goal 1');

    // Step 4: Create second savings goal
    cy.createSavingsGoal({
      goalName: 'Transfer Back Test Goal 2',
      description: 'Test goal for batch transfer back',
      targetAmount: 200,
      category: 'other'
    }).then((goalId) => {
      savingsGoalId2 = goalId;
      cy.wrap(goalId).as('savingsGoalId2');
    });

    // Step 5: Set up savings plan for goal 2 (manual Plaid linking required)
    cy.setupSavingsPlanWithManualPlaid({ amount: 50, interval: 'Weekly' });
    cy.log('✅ Savings plan set up for goal 2');

    // Step 6: Simulate and process $50 payment for goal 1
    cy.log('💳 Step 6: Simulating and processing $50 payment for goal 1...');
    cy.get('@savingsGoalId1').then((goalId1) => {
      cy.simulatePaymentForGoal(goalId1, apiBaseUrl).then(() => {
        cy.wait(2000);
        cy.processPaymentForGoal(goalId1, apiBaseUrl).then(() => {
          cy.log('✅ Payment 1 processed and cleared');
        });
      });
    });

    // Step 7: Simulate and process $50 payment for goal 2
    cy.log('💳 Step 7: Simulating and processing $50 payment for goal 2...');
    cy.wait(5000); // Give time for goal 1 payment to process
    cy.get('@savingsGoalId2').then((goalId2) => {
      cy.simulatePaymentForGoal(goalId2, apiBaseUrl).then(() => {
        cy.wait(2000);
        cy.processPaymentForGoal(goalId2, apiBaseUrl).then(() => {
          cy.log('✅ Payment 2 processed and cleared');
        });
      });
    });

    // Step 8: Wait for payments to complete and verify both goals have $50
    cy.log('⏳ Step 8: Waiting for payments to complete...');
    cy.wait(5000);
    cy.reload();
    cy.url({ timeout: 10000 }).should('include', '/home');
    
    cy.get('@savingsGoalId1').then((goalId1) => {
      cy.findGoalOnHomePage(goalId1, { verifyAmount: true, expectedAmount: 50 });
    });
    
    cy.get('@savingsGoalId2').then((goalId2) => {
      cy.findGoalOnHomePage(goalId2, { verifyAmount: true, expectedAmount: 50 });
    });
    cy.log('✅ Both goals have $50 current amount');

    // Step 9: Navigate to Transfer Back page
    cy.log('🔄 Step 9: Navigating to Transfer Back page...');
    cy.get('[data-testid="transfer-back-link"]', { timeout: 10000 }).click();
    cy.url({ timeout: 10000 }).should('include', '/transfer-back');
    cy.get('[data-testid="transfer-back-title"]', { timeout: 5000 })
      .should('be.visible')
      .should('contain', 'Transfer Back');
    cy.log('✅ On Transfer Back page');

    // Step 10: Enter total amount ($30)
    cy.log('💰 Step 10: Entering total amount of $30...');
    cy.get('[data-testid="total-amount-input"]', { timeout: 5000 })
      .should('be.visible')
      .clear()
      .type('30');
    cy.log('✅ Total amount set to $30');

    // Step 11: Allocate $20 to goal 1
    cy.log('📊 Step 11: Allocating $20 to goal 1...');
    cy.get('@savingsGoalId1').then((goalId1) => {
      cy.get(`[data-testid="goal-input-${goalId1}"]`, { timeout: 5000 })
        .should('be.visible')
        .clear()
        .type('20');
      cy.log('✅ Allocated $20 to goal 1');
    });

    // Step 12: Allocate $10 to goal 2
    cy.log('📊 Step 12: Allocating $10 to goal 2...');
    cy.get('@savingsGoalId2').then((goalId2) => {
      cy.get(`[data-testid="goal-input-${goalId2}"]`, { timeout: 5000 })
        .should('be.visible')
        .clear()
        .type('10');
      cy.log('✅ Allocated $10 to goal 2');
    });

    // Step 13: Verify allocation summary shows $30 / $30
    cy.log('✅ Step 13: Verifying allocation summary...');
    cy.get('[data-testid="allocation-summary"]', { timeout: 5000 })
      .should('be.visible')
      .should('contain', 'Allocated: $30 / $30');
    cy.log('✅ Allocation summary is correct');

    // Step 14: Submit the transfer
    cy.log('🚀 Step 14: Submitting batch transfer...');
    cy.get('[data-testid="transfer-button"]', { timeout: 5000 })
      .should('be.visible')
      .should('not.be.disabled')
      .click();
    
    // Wait for alert and accept it
    cy.on('window:alert', (text) => {
      expect(text).to.include('Transfer back initiated');
      cy.log('✅ Transfer back alert shown');
    });
    
    cy.url({ timeout: 10000 }).should('include', '/home');
    cy.log('✅ Redirected to home after transfer');

    // Step 15: Verify the transfer was successful by checking goal amounts
    cy.log('🔍 Step 15: Verifying transfer was successful...');
    cy.wait(3000); // Give time for the transfer to process
    cy.reload();
    
    cy.get('@savingsGoalId1').then((goalId1) => {
      // Goal 1 should now have $30 (was $50, transferred back $20)
      cy.findGoalOnHomePage(goalId1, { verifyAmount: true, expectedAmount: 30 });
    });
    
    cy.get('@savingsGoalId2').then((goalId2) => {
      // Goal 2 should now have $40 (was $50, transferred back $10)
      cy.findGoalOnHomePage(goalId2, { verifyAmount: true, expectedAmount: 40 });
    });
    
    cy.log('✅ Batch transfer back completed successfully!');
    cy.log('✅ Goal 1: $50 → $30 (transferred back $20)');
    cy.log('✅ Goal 2: $50 → $40 (transferred back $10)');
  });
});

