describe('Dashboard Access', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/dashboard');
    });

    it('should load key metrics', () => {
        // Check for key cards like Total Production, Active Routes, etc.
        cy.contains('Total Production').should('be.visible');
        cy.contains('Active Routes').should('be.visible');
        cy.contains('Pending Alerts').should('be.visible');
    });

    it('should display recent activity', () => {
        cy.contains('Recent Activity').should('be.visible');
        cy.get('.activity-list').should('exist');
    });
});
