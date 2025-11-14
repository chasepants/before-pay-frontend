describe('Merchant Dashboard Order ID Display (Manual)', () => {
  const baseUrl = 'http://localhost:3000';
  const apiBaseUrl = 'http://localhost:3001';
  const merchantId = '69152f4357dd6ee3cc87ae0c';
  const shopDomain = 'stashpay-2.myshopify.com';

  beforeEach(() => {
    // Visit the home page
    cy.visit(baseUrl);
  });

  it('should display order IDs for completed Shopify savings goals', () => {
    // Step 1: Find the merchant user associated with this merchant
    cy.log('🔍 Step 1: Finding merchant user...');
    cy.request({
      method: 'GET',
      url: `${apiBaseUrl}/api/test/merchant-user`,
      headers: {
        'Content-Type': 'application/json'
      },
      qs: {
        merchantId: merchantId
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 404) {
        cy.log('⚠️  Merchant user not found. Please ensure a merchant user exists for this merchant ID');
        cy.log('💡 You may need to create a merchant user first via the Shopify admin portal');
        return;
      }

      expect(response.status).to.eq(200);
      const merchantUser = response.body.user;
      const merchantEmail = merchantUser.email;
      const merchantPassword = 'Test1234';

      cy.log(`✅ Found merchant user: ${merchantEmail}`);

      // Step 2: Log in as the merchant
      cy.log('🔐 Step 2: Logging in as merchant...');
      cy.visit(`${baseUrl}/login`);
      cy.url({ timeout: 10000 }).should('include', '/login');

      // Click "Sign in with email"
      cy.contains('Sign in with email', { timeout: 10000 })
        .should('be.visible')
        .click();

      // Wait for email auth modal and fill in credentials
      cy.get('[data-testid="email-auth-modal"]', { timeout: 5000 })
        .should('be.visible')
        .within(() => {
          cy.get('input[name="email"], input[type="email"]').type(merchantEmail);
          cy.get('input[name="password"], input[type="password"]').type(merchantPassword);
          cy.get('[data-testid="submit-button"]', { timeout: 5000 }).click();
        });

      // Assert we're now on the home page or merchant dashboard
      cy.url({ timeout: 10000 }).should('satisfy', (url) => {
        return url.includes('/home') || url.includes('/dashboard');
      });
      cy.log('✅ Successfully logged in as merchant');

      // Step 3: Navigate to merchant dashboard if not already there
      cy.log('📊 Step 3: Navigating to merchant dashboard...');
      cy.url().then((url) => {
        if (!url.includes('/dashboard')) {
          // Navigate to merchant dashboard
          cy.visit(`${baseUrl}/dashboard`);
        }
      });
      cy.url({ timeout: 10000 }).should('include', '/dashboard');
      cy.log('✅ On merchant dashboard');

      // Step 4: Wait for savings goals to load
      cy.log('⏳ Step 4: Waiting for savings goals to load...');
      
      // Wait for the page to be fully loaded (check for welcome message or any content)
      cy.contains('Welcome', { timeout: 10000 }).should('be.visible');
      
      // Wait for the Customer Savings Goals section to appear
      cy.get('.card-header', { timeout: 10000 })
        .contains('Customer Savings Goals')
        .should('be.visible');
      
      // Wait for loading spinner to disappear if present
      cy.get('body').then(($body) => {
        if ($body.find('.spinner-border').length > 0) {
          cy.get('.spinner-border', { timeout: 10000 }).should('not.exist');
        }
      });
      
      // Give a moment for any async data loading
      cy.wait(2000);

      // Step 5: Verify order IDs are displayed for goals with completed orders
      cy.log('✅ Step 5: Verifying order IDs are displayed...');
      
      // First check if there are any savings goals at all
      cy.get('body').then(($body) => {
        const noGoalsMessage = $body.find('p.text-muted').filter((i, el) => {
          return Cypress.$(el).text().includes('No savings goals found');
        });
        
        if (noGoalsMessage.length > 0) {
          cy.log('⚠️  No savings goals found. This is expected if no goals have been created yet.');
          cy.contains('No savings goals found for your shop yet', { timeout: 5000 }).should('be.visible');
          return;
        }

        // Check if there are any goal cards
        cy.get('.card-body', { timeout: 10000 }).then(($goalCards) => {
          if ($goalCards.length === 0) {
            cy.log('⚠️  No savings goal cards found.');
            return;
          }

          cy.log(`Found ${$goalCards.length} savings goal card(s)`);

          // Look for order ID elements using data-testid
          cy.get('[data-testid^="order-id-"]').then(($orderIdElements) => {
            if ($orderIdElements.length === 0) {
              cy.log('ℹ️  No goals with order IDs found. This is expected if no orders have been completed yet.');
              cy.log('💡 To test order ID display, complete a savings goal (process all 4 payments) first.');
              return;
            }

            cy.log(`Found ${$orderIdElements.length} goal(s) with order IDs`);

            // Verify each order ID is displayed correctly using Cypress .each()
            cy.get('[data-testid^="order-id-"]').each(($element) => {
              const dataTestId = $element.attr('data-testid');
              const goalId = dataTestId.replace('order-id-', '');
              
              // Verify the container div is visible
              cy.wrap($element)
                .should('be.visible')
                .should('contain', 'Order ID:')
                .within(() => {
                  // Get the order ID value element
                  cy.get(`[data-testid="order-id-value-${goalId}"]`)
                    .should('be.visible')
                    .should('not.be.empty')
                    .then(($orderIdValue) => {
                      const orderId = $orderIdValue.text().trim();
                      expect(orderId).to.match(/^\d+$/); // Order IDs should be numeric
                      cy.log(`✅ Verified order ID: ${orderId} for goal ${goalId}`);
                    });
                });
            });

            cy.log(`✅ Verified ${$orderIdElements.length} goal(s) with order IDs displayed correctly`);
          });
        });
      });

      cy.log('✅ Merchant dashboard order ID test completed');
    });
  });
});

