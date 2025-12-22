import api from './axios';

export const marketAPI = {
    getLatestPrices: (districtId = '') => {
        const query = districtId ? `?district=${districtId}` : '';
        return api.get(`/market/prices/latest${query}`);
    },
    getPriceHistory: (cropId, districtId, days = 30) => {
        return api.get(`/market/prices/history`, {
            params: { cropId, districtId, days }
        });
    },
    getHighlights: () => api.get('/market/highlights'),
    addPrice: (data) => api.post('/market/prices', data),
};
