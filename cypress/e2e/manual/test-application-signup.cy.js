describe('Application Signup Flow', () => {
  const baseUrl = 'http://localhost:3000';
  const apiBaseUrl = 'http://localhost:3001';
  const testEmail = 'cypressapplication@test.com';
  const testPassword = 'Test1234';
  const testFirstName = 'Cypress';
  const testLastName = 'Application';

  beforeEach(() => {
    // Clean up any existing user data
    cy.cleanupUserData(testEmail, apiBaseUrl);
    cy.wait(1000);
    cy.visit(baseUrl);
  });

  it('should complete the application signup flow', () => {
    // Step 1: Navigate to signup page
    cy.contains('Get Started').click();
    cy.url({ timeout: 5000 }).should('include', '/signup');

    // Step 2: Click "Sign up with email" button
    cy.contains('Sign up with email', { timeout: 5000 }).click();

    // Step 3: Wait for email auth modal to appear
    cy.get('[data-testid="email-auth-modal"]', { timeout: 5000 }).should('be.visible');

    // Step 3.5: Stub the alert BEFORE form submission
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub').callsFake(() => {
        // Alert is automatically "dismissed" when stubbed
        // The navigation will happen after this
      });
    });

    // Step 4: Fill in registration form
    cy.get('[data-testid="email-auth-modal"]').within(() => {
      // First name
      cy.get('[data-testid="first-name-input"]', { timeout: 3000 })
        .should('be.visible')
        .type(testFirstName);

      // Last name
      cy.get('[data-testid="last-name-input"]', { timeout: 3000 })
        .should('be.visible')
        .type(testLastName);

      // Email
      cy.get('[data-testid="email-input"]', { timeout: 3000 })
        .should('be.visible')
        .type(testEmail);

      // Password
      cy.get('[data-testid="password-input"]', { timeout: 3000 })
        .should('be.visible')
        .type(testPassword);

      // Confirm password
      cy.get('input[name="confirmPassword"]', { timeout: 3000 })
        .should('be.visible')
        .type(testPassword);

      // Step 5: Submit the form
      cy.get('[data-testid="submit-button"]', { timeout: 5000 })
        .should('be.visible')
        .click();
    });

    // Step 6: Wait for the alert to be called with the expected message
    cy.get('@alertStub', { timeout: 10000 }).should('have.been.calledWith', 
      'Account created successfully! Please check your email and click the verification link to complete your registration.'
    );

    // Step 7: Wait for navigation to application-signup page
    // After the alert is dismissed, the app navigates to /home, which redirects to /application-signup
    cy.url({ timeout: 10000 }).should('include', '/application-signup');

    // Step 9: Wait for the Unit Elements form to load
    cy.get('unit-elements-application-form', { timeout: 10000 }).should('be.visible');

    // Step 10: Fill out the application form
    // Note: Unit Elements form is inside a shadow DOM, so we need to access it through the shadow root
    // Unit Elements generates dynamic IDs like "first-name-:r0:", "last-name-:r1:", etc.
    
    // Wait for form fields to be available in shadow DOM
    cy.wait(2000); // Give Unit Elements time to render

    // Access shadow DOM and fill first name
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="first-name-:r0:"]', { timeout: 10000 })
      .should('be.visible')
      .type(testFirstName);

    // Fill last name
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="last-name-:r1:"]', { timeout: 10000 })
      .should('be.visible')
      .type(testLastName);

    // Fill email
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="email-:r2:"]', { timeout: 10000 })
      .should('be.visible')
      .clear() // Clear any pre-filled value
      .type(testEmail);

    // Fill phone number
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="phone-:r3:"]', { timeout: 10000 })
      .should('be.visible')
      .type('5555555555');

    // Step 11: Click the "Start" button (also inside shadow DOM)
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .contains('button', 'Start', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Step 12: Wait for MFA modal to appear
    // MANUAL STEP: Enter the MFA code manually in the modal
    cy.wait(2000); // Wait for MFA modal to appear
    cy.get('unit-elements-dialog', { timeout: 10000 }).should('be.visible');
    
    // Pause for manual MFA code entry
    cy.log('⏸️  MANUAL STEP: Please enter the MFA code in the modal');
    cy.pause(); // Pause test execution for manual MFA entry

    // Step 13: After MFA, fill in SSN and occupation
    // Wait for the MFA dialog to close and form to update
    cy.wait(3000);
    
    // Wait for the form to be ready - check that unit-elements-application-form is still visible
    cy.get('unit-elements-application-form', { timeout: 10000 }).should('be.visible');
    
    // Wait a bit more for the form fields to render after MFA
    cy.wait(2000);

    // Enter SSN - the field is in the Unit Elements form shadow DOM
    // Retry with longer timeout since form might be updating
    cy.get('unit-elements-application-form', { timeout: 15000 })
      .shadow()
      .find('[id="ssn-:rc:"]', { timeout: 15000 })
      .should('be.visible')
      .should('not.be.disabled')
      .clear()
      .type('000000002');

    // Select occupation from dropdown
    // First click the dropdown toggle button
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="downshift-:re:-toggle-button"]', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Wait for dropdown options to appear, then select "Architect or Engineer"
    cy.wait(1000);
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .contains('Architect or Engineer', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Step 14: Fill out address fields
    cy.wait(1000); // Wait for form to update after occupation selection

    // Enter street address
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="street1-:rf:"]', { timeout: 10000 })
      .should('be.visible')
      .type('123 Main Street');

    // Enter city
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="city-:rh:"]', { timeout: 10000 })
      .should('be.visible')
      .type('New York');

    // Select state from dropdown
    // Combobox might support typing, so try typing the state name
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="state-combobox-:ri:"]', { timeout: 10000 })
      .should('be.visible')
      .should('not.be.disabled')
      .click()
      .type('New York');
    
    // Wait for dropdown to process the input
    cy.wait(1000);
    
    // If dropdown options appear, try to select from them
    // The options might be in a portal outside the shadow DOM, so search at document level
    cy.get('body').then(($body) => {
      if ($body.find(':contains("New York")').length > 0) {
        cy.contains('New York', { timeout: 5000 })
          .should('be.visible')
          .click({ force: true });
      } else {
        // If no dropdown appears, the combobox might have auto-completed
        cy.log('State combobox may have auto-completed or requires different interaction');
      }
    });

    // Enter postal code
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="postal-code-:rk:"]', { timeout: 10000 })
      .should('be.visible')
      .type('10001');

    // Step 15: Fill out birth date
    // Cypress requires date inputs in YYYY-MM-DD format
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="date-of-birth"]', { timeout: 10000 })
      .should('be.visible')
      .type('2000-01-01');

    // Step 16: Click Continue button
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .contains('button', 'Continue', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Wait for next step to load
    cy.wait(2000);

    // Step 17: Click terms checkbox
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .find('[id="terms-:rm:"]', { timeout: 10000 })
      .should('be.visible')
      .check();

    // Step 18: Click Submit button
    cy.get('unit-elements-application-form', { timeout: 10000 })
      .shadow()
      .contains('button', 'Submit', { timeout: 10000 })
      .should('be.visible')
      .click();

    // Step 19: Wait for form submission and get application ID
    cy.wait(3000);
    
    // Get the user's application ID from the backend
    // The application ID should be available after form submission via webhook
    cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      
      // Fetch user from backend using /api/users endpoint
      return cy.request({
        method: 'GET',
        url: `${apiBaseUrl}/api/users`,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        failOnStatusCode: false
      }).then((response) => {
        let applicationId = response.body?.unitApplicationId;
        
        // If not found, wait for webhook to process and try again
        if (!applicationId) {
          cy.log('⚠️  Application ID not found, waiting for webhook to process...');
          cy.wait(5000);
          return cy.request({
            method: 'GET',
            url: `${apiBaseUrl}/api/users`,
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            failOnStatusCode: false
          }).then((retryResponse) => {
            return cy.wrap(retryResponse.body?.unitApplicationId || null);
          });
        }
        
        return cy.wrap(applicationId);
      });
    }).then((applicationId) => {
      
      if (!applicationId) {
        cy.log('⚠️  Could not retrieve application ID. Please approve manually.');
        return;
      }

      cy.log(`📝 Approving application: ${applicationId}`);

      // Step 20: Approve the application via Unit API
      // Make request through backend to avoid exposing API key
      cy.request({
        method: 'POST',
        url: `${apiBaseUrl}/api/test/approve-application`,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          applicationId: applicationId
        },
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 200) {
          cy.log('✅ Application approved successfully');
        } else {
          cy.log(`⚠️  Application approval response: ${response.status}`, response.body);
        }
      });
    });

    // Step 21: Wait for application processing
    cy.log('Waiting for application to be processed...');
    cy.wait(5000);
  });
});

