import api from './axios';

export const weatherAPI = {
    getDistrictWeather: (districtId) => api.get(`/weather/district/${districtId}`),
    getWeatherHistory: (districtId) => api.get(`/weather/history/${districtId}`),
    triggerUpdate: (districtId) => api.post(`/weather/update/${districtId}`),
};
