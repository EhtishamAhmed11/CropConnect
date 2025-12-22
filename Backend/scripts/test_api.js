import axios from 'axios';

const API_URL = 'http://localhost:3000/api/surplus-deficit/calculate';
const login_data = {
    email: 'admin@cropconnect.com', // Assuming this exists from previous seeds
    password: 'adminpassword'
};

async function testCalculate() {
    try {
        console.log('Testing calculation for Punjab -> Faisalabad...');
        // We need auth, but let's see if we can get a response or at least a 401/403 vs 404
        // Actually I don't know the admin password for sure, I should check seeds.

        const payload = {
            year: '2024-25',
            crop: 'RICE',
            province: 'PB',
            district: 'PB-FSD'
        };

        // For now, I'll just check if the record exists in DB directly instead of API to avoid Auth hassle
        // but if I need to test the "Controller logic", I should try API.
        console.log('Skipping API test for now, checking logic in controller instead.');
    } catch (e) {
        console.error(e.message);
    }
}

testCalculate();
