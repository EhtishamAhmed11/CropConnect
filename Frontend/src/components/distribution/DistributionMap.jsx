import { useState, useEffect, useMemo, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../../map-styles.css"; // Custom Animations
import * as turf from "@turf/turf";
import "leaflet-arrowheads";
import L from "leaflet";
import {
    Typography,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Alert
} from "@mui/material";
import { Map as MapIcon, Truck } from "lucide-react";
import { gisAPI } from "../../api/gisApi";

// Fix Leaflet Default Icon Issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const RouteArrow = ({ route, map }) => {
    useEffect(() => {
        if (!map) return;

        const from = route.from;
        const to = route.to;

        // Leaflet expects [lat, lng]
        // Backend returns [lng, lat] (GeoJSON standard)
        const latlng1 = L.latLng(from[1], from[0]);
        const latlng2 = L.latLng(to[1], to[0]);

        const offsetX = (latlng2.lng - latlng1.lng) * 0.2;
        const offsetY = (latlng2.lat - latlng1.lat) * 0.2;

        const rLat = latlng1.lat + (latlng2.lat - latlng1.lat) / 2 - offsetY;
        const rLng = latlng1.lng + (latlng2.lng - latlng1.lng) / 2 + offsetX;

        const curvePoints = [[latlng1.lat, latlng1.lng], [rLat, rLng], [latlng2.lat, latlng2.lng]];

        const line = L.polyline(curvePoints, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.9,
            dashArray: '10, 10',
            className: 'route-flow-animation'
        }).addTo(map);

        line.arrowheads({
            size: '12px',
            frequency: 'endOnly',
            fill: true,
            fillColor: '#60a5fa',
            color: '#60a5fa'
        });

        line.bindTooltip(`
            <div class="p-3 bg-slate-900 text-white rounded shadow-lg min-w-[220px] font-sans">
                <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Logistics Vector</span>
                </div>
                <div class="flex justify-between items-center mb-3">
                     <span class="font-bold text-sm">${route.sourceName}</span>
                     <span class="text-xs text-slate-500 mx-2">➜</span>
                     <span class="font-bold text-sm text-red-400">${route.destName}</span>
                </div>
                
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between">
                        <span class="text-slate-400">Payload</span>
                        <span class="font-bold text-blue-300">📦 ${Math.round(route.amount).toLocaleString()} t</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Distance</span>
                        <span class="font-bold">📏 ${Math.round(route.distance)} km</span>
                    </div>
                    <div class="pt-1 border-t border-slate-700/50 mt-1">
                        <div class="flex justify-between text-[10px] mb-1">
                            <span class="text-slate-500 uppercase">Transport Cost</span>
                            <span>PKR ${route.costs?.transport?.toLocaleString() || 0}</span>
                        </div>
                        <div class="flex justify-between text-[10px] mb-2">
                            <span class="text-slate-500 uppercase">Toll Charges</span>
                            <span>PKR ${route.costs?.toll?.toLocaleString() || 0}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-amber-400 font-bold uppercase text-[10px]">Total Cost</span>
                            <span class="text-amber-400 font-black text-sm">PKR ${route.costs?.total?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        `, { sticky: true, className: "bg-transparent border-0 shadow-none" });

        return () => { if (map) map.removeLayer(line); };
    }, [map, route]);
    return null;
};

const DistributionMap = () => {
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [surplusData, setSurplusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);
    const [year, setYear] = useState("2024-25");
    const [crop, setCrop] = useState("WHEAT");
    const [viewMode, setViewMode] = useState("surplus"); // 'surplus' | 'simulate'

    // Backend optimized data
    const [optimizedRoutes, setOptimizedRoutes] = useState([]);
    const [routeStats, setRouteStats] = useState(null);

    // Reference to the map instance
    const [mapInstance, setMapInstance] = useState(null);
    const geoJsonRef = useRef();

    // Load GeoJSON and Data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Get District Boundaries (GeoJSON) - Only if not loaded
                if (!geoJsonData) {
                    const geoRes = await gisAPI.getDistrictsGeoJSON({ province: "" });
                    if (geoRes.data.success) setGeoJsonData(geoRes.data.data);
                }

                // 2. Get Surplus/Deficit Data for Coloring
                const dataRes = await gisAPI.getSurplusDeficitMap({ year, crop, level: "district" });
                if (dataRes.data.success) {
                    setSurplusData(dataRes.data.data);
                }
            } catch (error) {
                console.error("Failed to load map data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, crop]);

    // Fetch Optimized Routes when entering simulation mode
    useEffect(() => {
        if (viewMode === 'simulate') {
            const fetchRoutes = async () => {
                setOptimizing(true);
                try {
                    const res = await gisAPI.getOptimizedRoutes({ year, crop, level: "district" });
                    if (res.data.success) {
                        setOptimizedRoutes(res.data.data.routes || []);
                        setRouteStats(res.data.data.stats);
                    }
                } catch (error) {
                    console.error("Failed to optimize routes", error);
                } finally {
                    setOptimizing(false);
                }
            };
            fetchRoutes();
        }
    }, [viewMode, year, crop]);

    // Merge Data for Map Visualization
    const mergedData = useMemo(() => {
        if (!geoJsonData || !surplusData) return null;

        const features = geoJsonData.features.map(feature => {
            const data = surplusData.find(d =>
                d.regionCode === feature.properties.code ||
                d.regionName === feature.properties.name
            );
            return {
                ...feature,
                properties: { ...feature.properties, ...data }
            };
        });
        return { ...geoJsonData, features };
    }, [geoJsonData, surplusData]);

    // Style Function
    const style = (feature) => {
        const props = feature.properties;
        let fillColor = "#eceff1"; // Default Gray
        let fillOpacity = 0.5;

        if (viewMode === 'simulate') {
            if (props.status === "surplus") { fillColor = "#dcfce7"; fillOpacity = 0.4; } // Very light green
            if (props.status === "deficit") { fillColor = "#fee2e2"; fillOpacity = 0.4; } // Very light red
        } else {
            if (props.status) {
                // Determine color based on severity if deficit
                if (props.status === 'deficit') {
                    if (props.severity === 'critical') fillColor = "#ef4444"; // Red 500
                    else if (props.severity === 'high') fillColor = "#f87171"; // Red 400
                    else fillColor = "#fca5a5"; // Red 300
                } else if (props.status === 'surplus') {
                    fillColor = "#10b981"; // Emerald 500
                } else if (props.status === 'balanced') {
                    fillColor = "#f59e0b"; // Amber 500
                } else if (props.status === 'production_only') {
                    fillColor = "#3b82f6"; // Blue 500
                }
                fillOpacity = 0.75;
            }
        }

        return {
            fillColor,
            weight: 1,
            opacity: 1,
            color: "white",
            dashArray: "3",
            fillOpacity
        };
    };

    const onEachFeature = (feature, layer) => {
        const p = feature.properties;
        if (p.name) {
            const isCalculated = p.status !== 'production_only';
            const tooltipContent = `
                <div class="p-3 bg-slate-900 text-white rounded shadow-lg min-w-[200px] font-sans">
                    <h3 class="font-bold text-sm mb-2 border-b border-slate-700 pb-1">${p.name}</h3>
                    <div class="space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-slate-400">Analysis Type</span>
                            <span class="font-bold uppercase ${isCalculated ? 'text-indigo-400' : 'text-blue-400'}">
                                ${isCalculated ? 'CALCULATED' : 'ESTIMATED'}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">Status</span>
                            <span class="font-bold uppercase ${p.status === 'surplus' ? 'text-green-400' :
                    p.status === 'deficit' ? 'text-red-400' :
                        p.status === 'production_only' ? 'text-blue-400' : 'text-orange-400'
                }">${p.status === 'production_only' ? 'Production' : p.status || 'No Data'}</span>
                        </div>
                         ${p.balance ? `
                         <div class="flex justify-between">
                            <span class="text-slate-400">Balance</span>
                            <span class="font-mono">${Math.round(p.balance).toLocaleString()} t</span>
                        </div>` : ''}
                        ${p.production ? `
                        <div class="flex justify-between">
                            <span class="text-slate-400">Production</span>
                            <span class="font-mono">${Math.round(p.production?.value || p.production).toLocaleString()} t</span>
                        </div>` : ''}
                    </div>
                </div>
            `;
            layer.bindTooltip(tooltipContent, { sticky: true, className: "bg-transparent border-0 shadow-none" });

            // Highlight on hover
            layer.on({
                mouseover: (e) => {
                    const l = e.target;
                    l.setStyle({ weight: 2, color: '#333', fillOpacity: 0.9 });
                    l.bringToFront();
                },
                mouseout: (e) => {
                    if (geoJsonRef.current) geoJsonRef.current.resetStyle(e.target);
                }
            });
        }
    };

    return (
        <div className="h-full w-full relative overflow-hidden bg-slate-50 font-['Outfit']">

            {/* 1. Header Control Panel (Glass) */}
            <div className="absolute top-4 left-4 z-[401] flex flex-col gap-4 max-w-sm pointer-events-none">
                <div className="glass-panel p-6 rounded-[2rem] pointer-events-auto interactive-premium">
                    <Typography variant="overline" className="text-slate-500 font-bold tracking-wider">
                        MISSION CONTROL
                    </Typography>
                    <Typography variant="h5" className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <MapIcon className="text-blue-600" /> Supply Chain
                    </Typography>

                    <FormControl size="small" fullWidth className="mb-3">
                        <InputLabel>Crop Type</InputLabel>
                        <Select value={crop} label="Crop Type" onChange={(e) => setCrop(e.target.value)}>
                            <MenuItem value="WHEAT">🌾 Wheat (Staple)</MenuItem>
                            <MenuItem value="RICE">🍚 Rice</MenuItem>
                            <MenuItem value="COTTON">⚪ Cotton</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth className="mb-3">
                        <InputLabel>Season Year</InputLabel>
                        <Select value={year} label="Season Year" onChange={(e) => setYear(e.target.value)}>
                            <MenuItem value="2024-01">2024 (Historical)</MenuItem>
                            <MenuItem value="2024-25">2024-25 (Current)</MenuItem>
                        </Select>
                    </FormControl>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('surplus')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'surplus'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.05]'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setViewMode('simulate')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'simulate'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.05]'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            <Truck size={16} /> Optimize
                        </button>
                    </div>
                </div>

                {/* 2. Live Intelligence Stats (Glass Dark) */}
                {(routeStats || viewMode !== 'simulate') && surplusData.length > 0 && (
                    <div className="glass-panel-dark p-6 rounded-[2rem] pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-700">
                        <Typography variant="overline" className="text-slate-400 font-bold tracking-wider mb-2 block">
                            LIVE INTELLIGENCE
                        </Typography>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-400">Total Deficit</p>
                                <p className="text-xl font-bold text-red-400">
                                    -{routeStats ? (Math.round(routeStats.totalDeficit || 0) / 1000).toFixed(1) :
                                        (surplusData.filter(d => d.status === 'deficit').reduce((acc, curr) => acc + Math.abs(curr.balance || 0), 0) / 1000).toFixed(1)}k <span className="text-xs">tons</span>
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-400">Available Surplus</p>
                                <p className="text-xl font-bold text-green-400">
                                    +{routeStats ? (Math.round(routeStats.totalSurplus || 0) / 1000).toFixed(1) :
                                        (surplusData.filter(d => d.status === 'surplus').reduce((acc, curr) => acc + (curr.balance || 0), 0) / 1000).toFixed(1)}k <span className="text-xs">tons</span>
                                </p>
                            </div>

                            {viewMode === 'simulate' && routeStats && (
                                <div className="col-span-2 bg-slate-800/50 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400">Grand Logistics Cost</p>
                                        <p className="text-lg font-black text-amber-400 leading-none mt-1">
                                            PKR {routeStats.grandTotalCost?.toLocaleString() || routeStats.totalTollCost?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Tolls + Transport</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Deficit Covered</p>
                                        <p className="text-lg font-black text-blue-400 leading-none mt-1">{routeStats.coveragePercent || 0}%</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{routeStats.routeCount || 0} Active Lines</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Map Area */}
            <MapContainer
                center={[30.3753, 69.3451]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                className="z-0 bg-slate-200"
                whenCreated={setMapInstance}
                ref={setMapInstance}
                zoomControl={false}
            >
                <TileLayer
                    url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mergedData && (
                    <GeoJSON
                        key={`${year}-${crop}-${viewMode}`}
                        ref={geoJsonRef}
                        data={mergedData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
                )}

                {viewMode === 'simulate' && optimizedRoutes.map((route) => (
                    <RouteArrow key={route.id} route={route} map={mapInstance} />
                ))}
            </MapContainer>

            {/* Loading Overlay */}
            {optimizing && (
                <div className="absolute inset-0 z-[500] bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="font-bold text-slate-800">Calculating Logistics...</h3>
                        <p className="text-slate-500 text-sm">Optimizing supply chain routes</p>
                    </div>
                </div>
            )}

            {/* Floating Legend (Bottom Right) */}
            <div className="absolute bottom-6 right-6 z-[400] glass-panel p-4 rounded-xl max-w-xs transition-all hover:scale-105 bg-white/90 backdrop-blur shadow-xl border border-white/20">
                <Typography variant="subtitle2" className="font-bold mb-2 text-slate-700">
                    {viewMode === 'surplus' ? 'Regional Balance' : 'Logistics Plan'}
                </Typography>

                {viewMode === 'simulate' ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-8 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-8 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-medium text-slate-600">Active Supply Lines</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Ai-optimized routes moving <b>{routeStats ? Math.round(routeStats.coveredDeficit / 1000) : 0}k tons</b> to balance deficits.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></span>
                            <span className="text-slate-600">Surplus Region</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-200"></span>
                            <span className="text-slate-600">Balanced</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></span>
                            <span className="text-slate-600">Deficit Region</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DistributionMap;
