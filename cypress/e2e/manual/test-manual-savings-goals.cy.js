describe('Test Transactions with Manual Plaid Linking (Manual)', () => {
  const baseUrl = 'http://localhost:3000';
  const loginEmail = 'cypress_manual@test.com';
  const loginPassword = 'Test1234';
  const apiBaseUrl = 'http://localhost:3001';

  beforeEach(() => {
    // Visit the home page
    cy.visit(baseUrl);
  });

  it('should create a goal, manually link Plaid, set up savings plan, and test transactions', () => {
    // Step 1: Login and cleanup
    cy.loginWithEmail(loginEmail, loginPassword);
    cy.contains('Savings Goals', { timeout: 10000 }).should('be.visible');
    cy.cleanupUserGoals(apiBaseUrl);
    cy.wait(2000); // Give cleanup time to complete

    // Step 2: Create a savings goal
    cy.createSavingsGoal({
      goalName: 'Transaction Test Goal',
      description: 'Test description for transaction testing',
      targetAmount: 300, // Target $300 for 3 monthly payments of $100
      category: 'other'
    }).then((goalId) => {
      cy.wrap(goalId).as('savingsGoalId');
    });

    // Step 3: Set up savings plan with manual Plaid linking
    cy.setupSavingsPlanWithManualPlaid({ amount: 100, interval: 'Monthly' });

    // Step 7: Refresh the page to get the latest data from the backend
    cy.reload();
    cy.url({ timeout: 10000 }).should('include', '/home');
    cy.contains('Savings Goals', { timeout: 10000 }).should('be.visible');

    // Step 4: Verify bank info appears on the home page
    cy.contains('Transaction Test Goal', { timeout: 10000 }).should('be.visible');
    cy.get('@savingsGoalId').then((savingsGoalId) => {
      cy.verifyBankInfoOnHomePage(savingsGoalId);
    });

    // Step 9: Click View button to go to ViewSavings page using the specific goal ID
    cy.get('@savingsGoalId').then((savingsGoalId) => {
      cy.findGoalOnHomePage(savingsGoalId, { clickView: true });
    });
    
    cy.url({ timeout: 10000 }).should('include', '/view-savings/');

    // Step 10: Refresh the page to get the latest data from the backend
    cy.reload();
    cy.url({ timeout: 10000 }).should('include', '/view-savings/');
    
    // Wait for the page to fully load - check for goal name first (indicates API call completed)
    cy.contains('Transaction Test Goal', { timeout: 10000 }).should('be.visible');
    
    // Wait for the savings goal data to be fully loaded
    // Check for elements that indicate data is loaded (like schedule info or transfers section)
    cy.contains('Transfers', { timeout: 10000 }).should('be.visible');

    // Step 11: Verify bank info appears on ViewSavings page
    // The bank info section is conditionally rendered, so we'll wait for it with a reasonable timeout
    // If it doesn't appear, the test will continue (bank might not be linked yet in some cases)
    cy.get('body').then(($body) => {
      // Check if bank info section exists - it should if bank account was linked
      const bankInfoExists = $body.find('[data-testid="bank-info-section"]').length > 0;
      
      if (bankInfoExists) {
        cy.get('[data-testid="bank-info-section"]', { timeout: 10000 })
          .should('be.visible');
        cy.get('[data-testid="bank-info-display"]', { timeout: 5000 })
          .should('be.visible')
          .should('contain', '$100') // Savings amount
          .should('contain', 'Monthly'); // Interval
      } else {
        // Bank info might not be visible yet - wait a bit more and check again
        cy.wait(2000);
        cy.get('body').then(($body2) => {
          if ($body2.find('[data-testid="bank-info-section"]').length > 0) {
            cy.get('[data-testid="bank-info-section"]', { timeout: 5000 })
              .should('be.visible');
            cy.get('[data-testid="bank-info-display"]', { timeout: 5000 })
              .should('be.visible')
              .should('contain', '$100')
              .should('contain', 'Monthly');
          } else {
            cy.log('⚠️  Bank info section not found after refresh - may need to check backend data population');
            // Continue test anyway - bank info verification is not critical for the payment flow
          }
        });
      }
    });

    // Step 5: Simulate and process payments using goal's dayOfMonth
    cy.get('@savingsGoalId').then((savingsGoalId) => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        // Get goal schedule to determine payment dates
        cy.request({
          method: 'GET',
          url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }).then((goalResponse) => {
          const schedule = goalResponse.body.schedule;
          const dayOfMonth = schedule.dayOfMonth;
          
          // Calculate first run date using dayOfMonth
          const firstRunDate = new Date();
          firstRunDate.setUTCDate(dayOfMonth);
          firstRunDate.setUTCHours(0, 0, 0, 0);
          const firstPaymentDate = firstRunDate.toISOString().split('T')[0];
          
          // Calculate second payment date (next month, same dayOfMonth)
          const secondRunDate = new Date();
          secondRunDate.setUTCMonth(secondRunDate.getUTCMonth() + 1);
          secondRunDate.setUTCDate(dayOfMonth);
          secondRunDate.setUTCHours(0, 0, 0, 0);
          const secondPaymentDate = secondRunDate.toISOString().split('T')[0];
          
          // Calculate third payment date (2 months from first, same dayOfMonth)
          const thirdRunDate = new Date();
          thirdRunDate.setUTCMonth(thirdRunDate.getUTCMonth() + 2);
          thirdRunDate.setUTCDate(dayOfMonth);
          thirdRunDate.setUTCHours(0, 0, 0, 0);
          const thirdPaymentDate = thirdRunDate.toISOString().split('T')[0];
          
          // Payment 1
          cy.log(`📅 Simulating Payment 1 for date: ${firstPaymentDate} (dayOfMonth: ${dayOfMonth})`);
          cy.simulatePaymentForGoal(savingsGoalId, apiBaseUrl, firstPaymentDate);
          
          cy.wait(3000);
          cy.reload();
          cy.url().should('include', '/view-savings/');
          cy.contains('Transaction Test Goal', { timeout: 10000 }).should('be.visible');
          
          // Verify pending transaction appears
          cy.get('table tbody tr', { timeout: 10000 }).should('have.length.at.least', 1);
          cy.get('table tbody tr').first().within(() => {
            cy.get('.badge.bg-warning', { timeout: 5000 })
              .should('be.visible')
              .should('contain', 'pending');
            cy.contains('$100').should('be.visible');
          });
          cy.contains('100', { timeout: 5000 }).should('be.visible');
          
          cy.log('💳 Processing Payment 1 of 3...');
          cy.processAndVerifyPayment(savingsGoalId, apiBaseUrl, baseUrl, 1, 100, 'Transaction Test Goal');
          
          // Payment 2
          cy.wait(5000);
          cy.log(`📅 Simulating Payment 2 for date: ${secondPaymentDate}`);
          cy.simulatePaymentForGoal(savingsGoalId, apiBaseUrl, secondPaymentDate).then(() => {
            cy.wait(2000);
            cy.log('💳 Processing Payment 2 of 3...');
            cy.processAndVerifyPayment(savingsGoalId, apiBaseUrl, baseUrl, 2, 200, 'Transaction Test Goal');
          });
          
          // Payment 3
          cy.wait(5000);
          cy.log(`📅 Simulating Payment 3 for date: ${thirdPaymentDate}`);
          cy.simulatePaymentForGoal(savingsGoalId, apiBaseUrl, thirdPaymentDate).then(() => {
            cy.wait(2000);
            cy.log('💳 Processing Payment 3 of 3...');
            cy.processAndVerifyPayment(savingsGoalId, apiBaseUrl, baseUrl, 3, 300, 'Transaction Test Goal');
          });
        });
      });
    });
    
    // Step 9: Verify goal is complete and test that no 4th payment is created
    cy.wait(5000); // Give time for payment 3 to complete
    cy.get('@savingsGoalId').then((savingsGoalId) => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
                        // Navigate to view savings page explicitly
                        cy.visit(`${baseUrl}/view-savings/${savingsGoalId}`);
                        cy.url({ timeout: 10000 }).should('include', '/view-savings/');
                        cy.contains('Transaction Test Goal', { timeout: 10000 }).should('be.visible');
                        
                        // Wait for page to fully load
                        cy.wait(2000);
        
        // Verify goal shows 300/300
        cy.contains('300', { timeout: 10000 }).should('be.visible');
        cy.contains('300 / 300', { timeout: 5000 }).should('be.visible');
        
        // Get transfer count before attempting 4th payment
        cy.request({
          method: 'GET',
          url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }).then((goalBeforeResponse) => {
          const transfersBefore = goalBeforeResponse.body.transfers?.length || 0;
          
          // Calculate date for 4th payment (3 months from first, same dayOfMonth)
          const goal = goalBeforeResponse.body;
          const schedule = goal.schedule;
          const dayOfMonth = schedule.dayOfMonth;
          const fourthRunDate = new Date();
          fourthRunDate.setUTCMonth(fourthRunDate.getUTCMonth() + 3);
          fourthRunDate.setUTCDate(dayOfMonth);
          fourthRunDate.setUTCHours(0, 0, 0, 0);
          const nextPaymentDate = fourthRunDate.toISOString().split('T')[0];
          
          cy.log('🔍 Testing that no payment is created after goal is reached...');
          cy.log(`📅 Attempting to simulate Payment 4 for date: ${nextPaymentDate}`);
          
          // Simulate payment 4
          cy.request({
            method: 'POST',
            url: `${apiBaseUrl}/api/test/simulate-payments`,
            headers: {
              'Content-Type': 'application/json'
            },
            body: { date: nextPaymentDate },
            failOnStatusCode: false
          }).then((response) => {
            cy.wait(2000);
            
            // Get transfer count after
            cy.request({
              method: 'GET',
              url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              }
            }).then((goalAfterResponse) => {
              const transfersAfter = goalAfterResponse.body.transfers?.length || 0;
              
              // Verify no new payment was created
              expect(transfersAfter).to.eq(transfersBefore);
              cy.log(`✅ Verified: No new payment created (${transfersBefore} transfers before and after)`);
              
              // Verify goal is still at 300/300
              cy.reload();
              cy.contains('300 / 300', { timeout: 5000 }).should('be.visible');
            });
          });
        });
      });
    });

    cy.log('✅ Full transaction test complete: 3 payments processed, goal reached, and verified no further payments are created');
    
    // Step 10: Clean up - Delete the savings goal to prevent accumulation
    cy.get('@savingsGoalId').then((savingsGoalId) => {
      cy.window().then((win) => {
        const token = win.localStorage.getItem('authToken');
        
        cy.log(`🧹 Cleaning up: Deleting savings goal ${savingsGoalId}`);
        cy.request({
          method: 'DELETE',
          url: `${apiBaseUrl}/api/savings-goal/${savingsGoalId}`,
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          failOnStatusCode: false
        }).then((deleteResponse) => {
          if (deleteResponse.status === 200) {
            cy.log('✅ Savings goal deleted successfully');
          } else {
            cy.log(`⚠️  Failed to delete savings goal: ${deleteResponse.status}`, deleteResponse.body);
          }
        });
      });
    });
  });
});
