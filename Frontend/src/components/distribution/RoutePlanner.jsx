import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, TextField, Button, MenuItem, Box, Alert } from '@mui/material';
import { Map, Navigation } from 'lucide-react';
import { gisAPI } from '../../api/gisApi';
// Assuming we have a Map component, but for "Route Planning" specifically, 
// we might want a new view or integrate into existing. 
// I'll create a standalone planner form that CAN be placed next to a map.

const RoutePlanner = () => {
    const [districts, setDistricts] = useState([]);
    const [surplusId, setSurplusId] = useState('');
    const [deficitId, setDeficitId] = useState('');
    const [routeResult, setRouteResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load districts for dropdowns
        const loadDistricts = async () => {
            try {
                const res = await gisAPI.getDistricts({ limit: 100 });
                if (res.data.success) {
                    setDistricts(res.data.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadDistricts();
    }, []);

    const handleCalculate = async () => {
        if (!surplusId || !deficitId) return;
        setLoading(true);
        try {
            const res = await gisAPI.getRoute(surplusId, deficitId);
            if (res.data.success) {
                setRouteResult(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="shadow-lg h-full">
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Navigation className="text-blue-600" />
                    <Typography variant="h6" className="font-bold">
                        Transport Optimization
                    </Typography>
                </div>

                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Origin (Surplus District)"
                            value={surplusId}
                            onChange={(e) => setSurplusId(e.target.value)}
                            size="small"
                        >
                            {districts.map((d) => (
                                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            select
                            fullWidth
                            label="Destination (Deficit District)"
                            value={deficitId}
                            onChange={(e) => setDeficitId(e.target.value)}
                            size="small"
                        >
                            {districts.map((d) => (
                                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleCalculate}
                            disabled={!surplusId || !deficitId || loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? 'Calculating...' : 'Calculate Route'}
                        </Button>
                    </Grid>
                </Grid>

                {routeResult && (
                    <Box className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Typography variant="subtitle2" className="text-gray-500 uppercase text-xs font-bold mb-2">
                            Route Details
                        </Typography>
                        <div className="flex justify-between mb-2">
                            <Typography variant="body2" className="text-gray-600">Distance</Typography>
                            <Typography variant="body1" className="font-bold">{(routeResult.distance / 1000).toFixed(1)} km</Typography>
                        </div>
                        <div className="flex justify-between">
                            <Typography variant="body2" className="text-gray-600">Est. Time</Typography>
                            <Typography variant="body1" className="font-bold">{(routeResult.duration / 3600).toFixed(1)} hrs</Typography>
                        </div>

                        <Alert severity="info" className="mt-4 py-0 text-sm">
                            Suggested via National Highway N-5
                        </Alert>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RoutePlanner;
