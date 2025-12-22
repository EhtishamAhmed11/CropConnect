import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { Cloud, Sun, Droplets, Wind, Thermometer } from 'lucide-react';
import { weatherAPI } from '../../api/weatherApi';

const WeatherWidget = ({ districtId, districtName }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!districtId) return;

        const fetchWeather = async () => {
            setLoading(true);
            try {
                const response = await weatherAPI.getDistrictWeather(districtId);
                // The API structure returns { success: true, data: { ... } }
                // My service might just return response.data if I didn't change it. 
                if (response.data?.success && response.data?.data) {
                    setWeather(response.data.data);
                }
            } catch (error) {
                console.error("Weather fetch failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [districtId]);

    if (!districtId) return null;
    if (loading) return <Card className="h-40 flex items-center justify-center"><CircularProgress size={20} /></Card>;
    if (!weather) return <Card className="p-4"><Typography>No weather data available</Typography></Card>;

    // Icons mapping
    const WeatherIcon = weather.condition?.toLowerCase().includes('rain') ? Cloud : Sun;

    return (
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg overflow-visible">
            <CardContent className="relative">
                <div className="flex justify-between items-start">
                    <div>
                        <Typography variant="subtitle2" className="opacity-90 uppercase tracking-wider">
                            Current Weather
                        </Typography>
                        <Typography variant="h5" className="font-bold mt-1">
                            {districtName}
                        </Typography>
                        <div className="flex items-center mt-2">
                            <WeatherIcon size={48} className="mr-3" />
                            <div>
                                <Typography variant="h3" className="font-bold">
                                    {Math.round(weather.temperature)}°C
                                </Typography>
                                <Typography className="capitalize opacity-90">
                                    {weather.description}
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>

                <Box className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/20">
                    <div className="text-center">
                        <Droplets size={16} className="mx-auto mb-1 opacity-80" />
                        <Typography variant="caption" className="block opacity-80">Humidity</Typography>
                        <Typography variant="body2" className="font-semibold">{weather.humidity}%</Typography>
                    </div>
                    <div className="text-center">
                        <Wind size={16} className="mx-auto mb-1 opacity-80" />
                        <Typography variant="caption" className="block opacity-80">Wind</Typography>
                        <Typography variant="body2" className="font-semibold">{weather.windSpeed} m/s</Typography>
                    </div>
                    <div className="text-center">
                        <Cloud size={16} className="mx-auto mb-1 opacity-80" />
                        <Typography variant="caption" className="block opacity-80">Rain</Typography>
                        <Typography variant="body2" className="font-semibold">{weather.rainfall} mm</Typography>
                    </div>
                </Box>
            </CardContent>
        </Card>
    );
};

export default WeatherWidget;
