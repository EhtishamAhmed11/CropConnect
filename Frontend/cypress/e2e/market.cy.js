describe('Market Intelligence', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/market');
    });

    it('should load market dashboard', () => {
        cy.contains('Market Trends').should('be.visible');
        cy.get('canvas').should('exist'); // Assuming Chart.js or similar
    });

    it('should filter market data', () => {
        cy.get('select[name="crop"]').select('Wheat');
        cy.get('select[name="region"]').select('Punjab');
        cy.contains('Apply').click();

        // verify chart updates or list updates
        cy.get('.market-price-list').should('contain', 'Wheat');
    });
});
