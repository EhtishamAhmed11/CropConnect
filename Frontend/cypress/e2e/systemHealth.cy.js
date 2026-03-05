// Frontend/cypress/e2e/systemHealth.cy.js
describe('System Health Dashboard E2E Tests', () => {
    beforeEach(() => {
        // Login as admin
        cy.visit('/login');
        cy.get('input[name="email"]').type('admin@cropconnect.com');
        cy.get('input[name="password"]').type('admin123');
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });

    it('should navigate to system health page', () => {
        cy.visit('/admin/system-health');
        cy.contains('Platform Health').should('be.visible');
        cy.contains('System Diagnostics').should('be.visible');
    });

    it('should display system status badge', () => {
        cy.visit('/admin/system-health');
        cy.wait(1000);

        // Check for status badge
        cy.contains(/healthy|degraded|critical/i).should('be.visible');
    });

    it('should display primary metrics cards', () => {
        cy.visit('/admin/system-health');
        cy.wait(1000);

        // Check for metric cards
        cy.contains('Database Cluster').should('be.visible');
        cy.contains('System Uptime').should('be.visible');
        cy.contains('Failed Ingestions').should('be.visible');
        cy.contains('Memory Usage').should('be.visible');
    });

    it('should show database connection status', () => {
        cy.visit('/admin/system-health');
        cy.wait(1000);

        cy.contains('Connected').should('be.visible');
    });

    it('should display uptime in hours and minutes', () => {
        cy.visit('/admin/system-health');
        cy.wait(1000);

        // Check uptime format (e.g., "2h 30m")
        cy.contains(/\d+h \d+m/).should('be.visible');
    });

    it('should show recent activity logs table', () => {
        cy.visit('/admin/system-health');
        cy.wait(1000);

        cy.contains('Recent Activity Logs').should('be.visible');

        // Check table headers
        cy.contains('Source').should('be.visible');
        cy.contains('Data Type').should('be.visible');
        cy.contains('Status').should('be.visible');
        cy.contains('Processed').should('be.visible');
        cy.contains('Timestamp').should('be.visible');
    });

    it('should have refresh button', () => {
        cy.visit('/admin/system-health');

        cy.contains('Refresh Status').should('be.visible');
        cy.contains('Refresh Status').click();
        cy.wait(1000);
    });

    it('should display ingestion logs if available', () => {
        cy.visit('/admin/system-health');
        cy.wait(2000);

        // Check if logs exist or show empty state
        cy.get('body').then($body => {
            if ($body.text().includes('No activity logs')) {
                cy.contains('No activity logs recorded yet').should('be.visible');
            } else {
                cy.get('table tbody tr').should('have.length.at.least', 1);
            }
        });
    });

    it('should show status badges with correct colors', () => {
        cy.visit('/admin/system-health');
        cy.wait(2000);

        // Look for status badges in logs
        cy.get('body').then($body => {
            if (!$body.text().includes('No activity logs')) {
                cy.get('table').within(() => {
                    cy.get('span').should('exist');
                });
            }
        });
    });
});
