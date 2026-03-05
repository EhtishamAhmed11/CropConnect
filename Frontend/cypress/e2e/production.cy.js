describe('Production Management', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/production');
    });

    it('should load production list', () => {
        cy.contains('Production Data').should('be.visible');
        cy.get('table').should('exist');
    });

    it('should allow adding a new production record', () => {
        cy.contains('Add Production').click();
        cy.url().should('include', '/production/add');

        // Fill form
        cy.get('select[name="crop"]').select('Wheat');
        cy.get('input[name="amount"]').type('1000');
        cy.get('input[name="date"]').type('2024-01-01');
        cy.get('button[type="submit"]').click();

        // Verify redirect and list update
        cy.url().should('include', '/production');
        cy.contains('1000').should('be.visible');
    });
});
