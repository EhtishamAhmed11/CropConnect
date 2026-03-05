describe('Distribution and Logistics', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/distribution/routes');
    });

    it('should load the route planner', () => {
        cy.contains('Route Planner').should('be.visible');
        cy.get('.leaflet-container').should('exist'); // Assuming Leaflet map
    });

    it('should calculate a route', () => {
        // Select Start Point
        cy.get('select[name="startLocation"]').select('Lahore');
        // Select Destination
        cy.get('select[name="endLocation"]').select('Karachi');

        cy.contains('Calculate Route').click();

        // Check for results
        cy.contains('Estimated Distance').should('be.visible');
        cy.contains('Estimated Cost').should('be.visible');
    });
});
