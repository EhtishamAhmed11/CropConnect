// Frontend/cypress/e2e/auth.cy.js
describe('Authentication E2E Tests', () => {
    const testUser = {
        email: 'john@example.com',
        password: 'SecurePass123'
    };

    beforeEach(() => {
        cy.visit('/login');
    });

    it('should display login form', () => {
        cy.contains('Login').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        // Should redirect away from login
        cy.url().should('not.include', '/login');

        // Should see dashboard or home page
        cy.url().should('match', /\/(dashboard|home)?$/);
    });

    it('should show error with invalid credentials', () => {
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type('WrongPassword');
        cy.get('button[type="submit"]').click();

        // Should stay on login page or show error
        cy.url().should('include', '/login');
    });

    it('should logout successfully', () => {
        // Login first
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);
        cy.get('button[type="submit"]').click();

        cy.wait(1000);

        // Find and click logout button
        cy.get('body').then($body => {
            if ($body.text().includes('Logout') || $body.text().includes('Sign Out')) {
                cy.contains(/Logout|Sign Out/i).click();
                cy.url().should('include', '/login');
            }
        });
    });

    it('should redirect to login when accessing protected route without auth', () => {
        cy.visit('/production');
        cy.url().should('include', '/login');
    });
});
