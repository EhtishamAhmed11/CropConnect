describe('Alerts System', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'SecurePass123');
        cy.visit('/alerts');
    });

    it('should display active alerts', () => {
        cy.contains('Active Alerts').should('be.visible');
        cy.get('.alert-item').should('exist');
    });

    it('should mark an alert as read', () => {
        cy.get('.alert-item').first().within(() => {
            cy.contains('Mark as Read').click();
        });

        // Check if style changed or item removed
        cy.get('.alert-item').first().should('have.class', 'read');
    });
});
