// Frontend/cypress/e2e/yieldForecasting.cy.js
describe('Yield Forecasting E2E Tests', () => {
    beforeEach(() => {
        // Login first
        cy.visit('/login');
        cy.get('input[name="email"]').type('admin@cropconnect.com');
        cy.get('input[name="password"]').type('admin123');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });

    it('should navigate to yield forecasting page', () => {
        cy.visit('/production/forecasting');
        cy.contains('Yield Forecasting').should('be.visible');
        cy.contains('AI-Powered Insights').should('be.visible');
    });

    it('should display crop and region filters', () => {
        cy.visit('/production/forecasting');

        // Check filters exist
        cy.get('select').should('have.length.at.least', 2);
        cy.contains('Crop').should('be.visible');
        cy.contains('Region').should('be.visible');
    });

    it('should load and display prediction data', () => {
        cy.visit('/production/forecasting');

        // Wait for data to load
        cy.wait(2000);

        // Check for charts
        cy.get('.recharts-wrapper').should('exist');
        cy.get('.recharts-line').should('exist');
    });

    it('should filter data by crop selection', () => {
        cy.visit('/production/forecasting');

        // Select a crop
        cy.get('select').first().select('Wheat');
        cy.wait(1000);

        // Verify data updated
        cy.contains('Wheat').should('be.visible');
    });

    it('should display model performance metrics', () => {
        cy.visit('/production/forecasting');
        cy.wait(2000);

        // Check for key insights cards
        cy.contains('Model Accuracy').should('be.visible');
        cy.contains('Prediction Error').should('be.visible');
        cy.contains('AI Algorithm').should('be.visible');
    });

    it('should show timeline chart with historical and forecast data', () => {
        cy.visit('/production/forecasting');
        cy.wait(2000);

        // Check chart title
        cy.contains('Production Timeline').should('be.visible');

        // Check legend
        cy.contains('Actual Production').should('be.visible');
        cy.contains('AI Forecast').should('be.visible');
    });

    it('should display regional comparison chart', () => {
        cy.visit('/production/forecasting');
        cy.wait(2000);

        // Scroll to regional comparison
        cy.contains('Regional Comparison').should('be.visible');
        cy.get('.recharts-bar').should('exist');
    });

    it('should show chart explanation', () => {
        cy.visit('/production/forecasting');

        cy.contains('How to Read This Chart').should('be.visible');
        cy.contains('solid green line').should('be.visible');
        cy.contains('dashed blue line').should('be.visible');
    });
});
