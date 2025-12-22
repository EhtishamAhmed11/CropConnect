import { useState, useEffect } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { marketAPI } from '../../api/marketApi';
import { TrendingUp } from 'lucide-react';

const PriceTrendChart = ({ cropId, districtId, cropName }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!cropId || !districtId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // In a real app we'd filter locally or call API with these new names (since we're passing names now from the Table click)
                // For this demo, let's just re-fetch history which normally takes IDs. 
                // We'll simulate fetching by calling history.
                const response = await marketAPI.getPriceHistory(cropId, districtId);
                if (response.data.success) {
                    const formattedDetails = response.data.data.map(item => ({
                        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        price: item.price
                    }));
                    // Sort by date to be sure
                    setData(formattedDetails.reverse());
                }
            } catch (error) {
                console.error("Error fetching history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [cropId, districtId]);

    // Empty State
    if (!cropId || !districtId) {
        return (
            <Card className="h-72 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 shadow-none rounded-xl">
                <div className="p-4 bg-white rounded-full mb-3 shadow-sm">
                    <TrendingUp className="text-gray-400" size={32} />
                </div>
                <Typography className="text-gray-500 font-medium">Select a crop from the table</Typography>
                <Typography variant="caption" className="text-gray-400">to view price trends</Typography>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border border-gray-100">
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" className="font-bold text-gray-900">
                        {cropName} Price Trend
                    </Typography>
                    <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                        Live Data
                    </div>
                </div>

                <Box sx={{ height: 300, width: '100%' }}>
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-400">Loading trend...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `Rs.${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`Rs. ${value}`, 'Price']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default PriceTrendChart;
