import api from './axios';

export const weatherAPI = {
    getDistrictWeather: (districtId) => api.get(`/weather/district/${districtId}`),
    getWeatherHistory: (districtId) => api.get(`/weather/history/${districtId}`),
    getForecast: (districtId) => api.get(`/weather/forecast/${districtId}`),
    triggerUpdate: (districtId) => api.post(`/weather/update/${districtId}`),
};
