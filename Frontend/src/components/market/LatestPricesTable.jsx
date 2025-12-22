import { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Typography, CircularProgress, Card, CardContent, TextField, InputAdornment
} from '@mui/material';
import { Search, MapPin, Tag } from 'lucide-react';
import { marketAPI } from '../../api/marketApi';

const LatestPricesTable = ({ onRowClick }) => {
    const [prices, setPrices] = useState([]);
    const [filteredPrices, setFilteredPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const response = await marketAPI.getLatestPrices();
                if (response.data.success) {
                    setPrices(response.data.data);
                    setFilteredPrices(response.data.data);
                }
            } catch (error) {
                console.error("Failed to load prices", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = prices.filter(p => {
            const cropName = p.crop?.name || p.crop || "";
            const districtName = p.district?.name || p.district || "";
            return cropName.toLowerCase().includes(lowerTerm) ||
                districtName.toLowerCase().includes(lowerTerm);
        });
        setFilteredPrices(filtered);
    }, [searchTerm, prices]);

    if (loading) return <div className="flex justify-center p-8"><CircularProgress /></div>;

    return (
        <Card className="shadow-sm border border-gray-100 h-full">
            <CardContent className="h-full flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <Typography variant="h6" className="font-bold text-gray-900">
                            Current Market Prices
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                            Click on a row to view detailed trends
                        </Typography>
                    </div>
                    <TextField
                        size="small"
                        placeholder="Search crop or district..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} className="text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                        className="w-full sm:w-64"
                    />
                </div>

                <TableContainer component={Paper} elevation={0} className="border border-gray-100 rounded-lg overflow-hidden flex-grow">
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow className="bg-gray-50">
                                <TableCell className="font-semibold text-gray-600">Crop</TableCell>
                                <TableCell className="font-semibold text-gray-600">Price (PKR)</TableCell>
                                <TableCell className="font-semibold text-gray-600">Unit</TableCell>
                                <TableCell className="font-semibold text-gray-600">Location</TableCell>
                                <TableCell className="font-semibold text-gray-600 hidden sm:table-cell">Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPrices.map((row) => {
                                const cropName = row.crop || "Unknown";
                                const districtName = row.district?.name || "Unknown";

                                // row.cropId comes from backend projection
                                const cropId = row.cropId || row.crop;
                                const districtId = row.district?._id;

                                return (
                                    <TableRow
                                        key={`${cropId}-${districtId}`}
                                        hover
                                        onClick={() => onRowClick && onRowClick(cropId, districtId, cropName, districtName)}
                                        className="cursor-pointer transition-colors hover:bg-emerald-50"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">
                                                    {cropName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{cropName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-emerald-700">
                                            Rs. {row.price.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-gray-500">{row.unit}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <MapPin size={14} />
                                                {districtName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm hidden sm:table-cell">
                                            {new Date(row.date).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {filteredPrices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" className="py-8 text-gray-500">
                                        No prices found matching your search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default LatestPricesTable;
