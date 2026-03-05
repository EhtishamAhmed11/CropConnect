describe('Pricing Dashboard', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/pricing');
    });

    it('should display current prices', () => {
        cy.contains('Current Market Prices').should('be.visible');
        cy.get('.price-card').should('have.length.gt', 0);
    });

    it('should show price trends', () => {
        cy.contains('Price History').should('be.visible');
        cy.get('canvas').should('exist'); // Chart
    });

    it('should allow setting price alerts', () => {
        cy.contains('Set Alert').click();
        cy.get('select[name="crop"]').select('Wheat');
        cy.get('input[name="threshold"]').type('5000');
        cy.contains('Save Alert').click();

        cy.contains('Alert set successfully').should('be.visible');
    });
});
