// Frontend/cypress/support/commands.js
// Custom command for login
Cypress.Commands.add('login', (email = 'john@example.com', password = 'SecurePass123') => {
    cy.session([email, password], () => {
        cy.visit('/login');
        cy.get('input[name="email"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
    });
});

// Custom command for API login (get token)
Cypress.Commands.add('loginAPI', (email = 'john@example.com', password = 'SecurePass123') => {
    return cy.request({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/login',
        body: { email, password }
    }).then((response) => {
        expect(response.status).to.eq(200);
        window.localStorage.setItem('token', response.body.data.token);
        return response.body.data.token;
    });
});
