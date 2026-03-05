describe('Surplus and Deficit Analysis', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/surplus-deficit');
    });

    it('should load overview dashboard', () => {
        cy.contains('Surplus & Deficit Overview').should('be.visible');
        cy.get('.stats-card').should('exist');
    });

    it('should filter by region', () => {
        cy.get('select[name="region"]').select('Punjab');
        cy.contains('Apply').click();

        // verify charts or data update
        cy.get('.analysis-chart').should('be.visible');
    });

    it('should navigate to detailed views', () => {
        cy.contains('View Surplus Regions').click();
        cy.url().should('include', '/surplus/regions');
        cy.go('back');

        cy.contains('View Deficit Regions').click();
        cy.url().should('include', '/deficit/regions');
    });
});
