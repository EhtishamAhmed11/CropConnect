import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../../map-styles.css";
import "leaflet-arrowheads";
import L from "leaflet";
import {
    Typography, FormControl, Select, MenuItem, InputLabel,
} from "@mui/material";
import { Map as MapIcon, Truck, ArrowRight, Route } from "lucide-react";
import { gisAPI } from "../../api/gisAPI";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Module-level GeoJSON cache — survives re-renders, cleared on page nav
let cachedGeoJson = null;

// ─── RouteArrow — animated dashed line with rich tooltip ─────────────────────
const RouteArrow = ({ route, map, index }) => {
    useEffect(() => {
        if (!map) return;

        const latlng1 = L.latLng(route.from[1], route.from[0]);
        const latlng2 = L.latLng(route.to[1],   route.to[0]);

        // Slight curve to distinguish overlapping routes
        const offsetX = (latlng2.lng - latlng1.lng) * 0.2;
        const offsetY = (latlng2.lat - latlng1.lat) * 0.2;
        const rLat    = latlng1.lat + (latlng2.lat - latlng1.lat) / 2 - offsetY;
        const rLng    = latlng1.lng + (latlng2.lng - latlng1.lng) / 2 + offsetX;

        // Colour route by deficit severity
        const severityColor = {
            critical: "#ef4444",
            moderate: "#f97316",
            mild:     "#eab308",
        }[route.deficitSeverity] || "#3b82f6";

        const line = L.polyline(
            [[latlng1.lat, latlng1.lng], [rLat, rLng], [latlng2.lat, latlng2.lng]],
            { color: severityColor, weight: 3, opacity: 0.9, dashArray: "10, 10", className: "route-flow-animation" }
        ).addTo(map);

        line.arrowheads({ size: "12px", frequency: "endOnly", fill: true, fillColor: severityColor, color: severityColor });

        line.bindTooltip(`
            <div class="p-3 bg-slate-900 text-white rounded-lg shadow-lg min-w-[240px] font-sans">
                <div class="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Shipment Route #${index + 1}</span>
                    ${route.deficitSeverity === "critical" ? '<span class="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">CRITICAL</span>' : ""}
                </div>
                <div class="flex justify-between items-center mb-3">
                    <span class="font-bold text-sm text-green-400">${route.sourceName}</span>
                    <span class="text-xs text-slate-500 mx-2">→</span>
                    <span class="font-bold text-sm text-red-400">${route.destName}</span>
                </div>
                <div class="space-y-1.5 text-xs">
                    <div class="flex justify-between">
                        <span class="text-slate-400">Amount</span>
                        <span class="font-bold text-blue-300">${Math.round(route.amount).toLocaleString()} tonnes</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Trucks needed</span>
                        <span class="font-bold">${route.numTrucks} trucks</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Road distance</span>
                        <span class="font-bold">${route.distance} km</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">Est. duration</span>
                        <span class="font-bold">${(route.estimatedDuration / 60).toFixed(1)} hrs</span>
                    </div>
                    <div class="pt-1.5 border-t border-slate-700/50 mt-1 space-y-1">
                        <div class="flex justify-between text-[10px]">
                            <span class="text-slate-500">Transport</span>
                            <span>PKR ${(route.costs?.transport || 0).toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between text-[10px]">
                            <span class="text-slate-500">Tolls</span>
                            <span>PKR ${(route.costs?.toll || 0).toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center pt-1">
                            <span class="text-amber-400 font-bold uppercase text-[10px]">Total Cost</span>
                            <span class="text-amber-400 font-black text-sm">PKR ${(route.costs?.total || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `, { sticky: true, className: "bg-transparent border-0 shadow-none" });

        return () => { try { map.removeLayer(line); } catch (_) {} };
    }, [map, route, index]);

    return null;
};

// ─── DistributionMap ──────────────────────────────────────────────────────────
const DistributionMap = () => {
    const [geoJsonData,     setGeoJsonData]     = useState(cachedGeoJson);
    const [surplusData,     setSurplusData]     = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [optimizing,      setOptimizing]      = useState(false);
    const [year,            setYear]            = useState("2024-25");
    const [crop,            setCrop]            = useState("WHEAT");
    const [viewMode,        setViewMode]        = useState("surplus"); // 'surplus' | 'simulate'
    const [optimizedRoutes, setOptimizedRoutes] = useState([]);
    const [routeStats,      setRouteStats]      = useState(null);
    const [mapInstance,     setMapInstance]     = useState(null);
    const geoJsonRef = useRef();

    // ── Load GeoJSON (once, cached) + surplus/deficit data ───────────────────
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (!cachedGeoJson) {
                    const geoRes = await gisAPI.getDistrictsGeoJSON({ province: "" });
                    if (geoRes.data.success) {
                        cachedGeoJson = geoRes.data.data;
                        setGeoJsonData(geoRes.data.data);
                    }
                }
                const dataRes = await gisAPI.getSurplusDeficitMap({ year, crop, level: "district" });
                if (dataRes.data.success) setSurplusData(dataRes.data.data);
            } catch (error) {
                console.error("Failed to load map data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year, crop]);

    // ── Fetch optimised routes when switching to simulate mode ────────────────
    useEffect(() => {
        if (viewMode !== "simulate") return;
        const fetchRoutes = async () => {
            setOptimizing(true);
            try {
                const res = await gisAPI.getOptimizedRoutes({ year, crop, level: "district" });
                if (res.data.success) {
                    setOptimizedRoutes(res.data.data.routes || []);
                    setRouteStats(res.data.data.stats);
                }
            } catch (error) {
                console.error("Failed to optimise routes", error);
            } finally {
                setOptimizing(false);
            }
        };
        fetchRoutes();
    }, [viewMode, year, crop]);

    // ── Merge GeoJSON boundaries with surplus/deficit data ───────────────────
    const mergedData = useMemo(() => {
        if (!geoJsonData || !surplusData) return null;
        const lookup = {};
        for (const d of surplusData) lookup[d.regionCode] = d;

        const features = geoJsonData.features.map(feature => {
            const data = lookup[feature.properties.code] || null;
            return { ...feature, properties: { ...feature.properties, ...data } };
        });
        return { ...geoJsonData, features };
    }, [geoJsonData, surplusData]);

    // ── District fill colour ──────────────────────────────────────────────────
    const style = (feature) => {
        const p = feature.properties;
        let fillColor   = "#eceff1"; // no data — light grey
        let fillOpacity = 0.5;

        if (viewMode === "simulate") {
            // Softer colours so route arrows are visible on top
            if (p.status === "surplus") { fillColor = "#dcfce7"; fillOpacity = 0.4; }
            if (p.status === "deficit") { fillColor = "#fee2e2"; fillOpacity = 0.4; }
        } else if (p.status) {
            fillOpacity = 0.75;
            if (p.status === "surplus") {
                fillColor = "#10b981";
            } else if (p.status === "balanced") {
                fillColor = "#64748b";
            } else if (p.status === "deficit") {
                // severity-graded reds — matches backend color logic
                if (p.severity === "critical")      fillColor = "#ef4444";
                else if (p.severity === "moderate") fillColor = "#f97316";
                else                                fillColor = "#eab308"; // mild
            }
        }

        return { fillColor, weight: 1, opacity: 1, color: "white", dashArray: "3", fillOpacity };
    };

    // ── District tooltip + hover ──────────────────────────────────────────────
    const onEachFeature = (feature, layer) => {
        const p = feature.properties;
        if (!p.name) return;

        const statusColor =
            p.status === "surplus"  ? "text-green-400" :
            p.status === "deficit"  ? "text-red-400"   :
            p.status === "balanced" ? "text-slate-400"  : "text-blue-400";

        const severityBadge = p.severity && p.severity !== "none"
            ? `<span class="ml-1 text-[9px] uppercase bg-white/10 px-1 py-0.5 rounded">${p.severity}</span>`
            : "";

        layer.bindTooltip(`
            <div class="p-3 bg-slate-900 text-white rounded shadow-lg min-w-[210px] font-sans">
                <h3 class="font-bold text-sm mb-2 border-b border-slate-700 pb-1">${p.name}</h3>
                <div class="space-y-1.5 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400">Status</span>
                        <span class="font-bold uppercase ${statusColor}">${p.status || "No Data"}${severityBadge}</span>
                    </div>
                    ${p.balance != null ? `
                    <div class="flex justify-between">
                        <span class="text-slate-400">${p.balance > 0 ? "Surplus" : "Shortfall"}</span>
                        <span class="font-mono font-bold ${p.balance > 0 ? "text-green-400" : "text-red-400"}">
                            ${Math.abs(Math.round(p.balance)).toLocaleString()} tonnes
                        </span>
                    </div>` : ""}
                    ${p.production != null ? `
                    <div class="flex justify-between">
                        <span class="text-slate-400">Production</span>
                        <span class="font-mono">${Math.round(p.production).toLocaleString()} t</span>
                    </div>` : ""}
                    ${p.consumption != null ? `
                    <div class="flex justify-between">
                        <span class="text-slate-400">Consumption</span>
                        <span class="font-mono">${Math.round(p.consumption).toLocaleString()} t</span>
                    </div>` : ""}
                    ${p.selfSufficiencyRatio != null ? `
                    <div class="flex justify-between">
                        <span class="text-slate-400">Self-sufficiency</span>
                        <span class="font-mono">${(p.selfSufficiencyRatio * 100).toFixed(1)}%</span>
                    </div>` : ""}
                    ${p.dataSource ? `
                    <div class="pt-1 border-t border-slate-800">
                        <span class="text-[9px] text-slate-500">${p.dataSource}</span>
                    </div>` : ""}
                </div>
            </div>
        `, { sticky: true, className: "bg-transparent border-0 shadow-none" });

        layer.on({
            mouseover: e => { e.target.setStyle({ weight: 2, color: "#333", fillOpacity: 0.9 }); e.target.bringToFront(); },
            mouseout:  e => { if (geoJsonRef.current) geoJsonRef.current.resetStyle(e.target); },
        });
    };

    // ── Quick stats derived from surplusData for the stats panel ─────────────
    const quickStats = useMemo(() => {
        if (!surplusData.length) return null;
        return {
            totalDeficit:  surplusData.filter(d => d.status === "deficit").reduce((s, d) => s + Math.abs(d.balance || 0), 0),
            totalSurplus:  surplusData.filter(d => d.status === "surplus").reduce((s, d) => s + (d.balance || 0), 0),
            criticalCount: surplusData.filter(d => d.severity === "critical").length,
        };
    }, [surplusData]);

    return (
        <div className="h-full w-full relative overflow-hidden bg-slate-50 font-['Outfit']">

            {/* ── Control Panel ────────────────────────────────────────────── */}
            <div className="absolute top-4 left-4 z-[401] flex flex-col gap-4 max-w-sm pointer-events-none">
                <div className="glass-panel p-6 rounded-[2rem] pointer-events-auto">
                    <Typography variant="overline" className="text-slate-500 font-bold tracking-wider">
                        DISTRIBUTION PLANNER
                    </Typography>
                    <Typography variant="h5" className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <MapIcon className="text-blue-600" /> Supply Chain
                    </Typography>

                    <FormControl size="small" fullWidth className="mb-3">
                        <InputLabel>Crop Type</InputLabel>
                        <Select value={crop} label="Crop Type" onChange={e => { setCrop(e.target.value); setOptimizedRoutes([]); setRouteStats(null); }}>
                            <MenuItem value="WHEAT">🌾 Wheat</MenuItem>
                            <MenuItem value="RICE">🍚 Rice</MenuItem>
                            <MenuItem value="COTTON">⚪ Cotton</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth className="mb-4">
                        <InputLabel>Season Year</InputLabel>
                        <Select value={year} label="Season Year" onChange={e => { setYear(e.target.value); setOptimizedRoutes([]); setRouteStats(null); }}>
                            <MenuItem value="2024-25">2024-25 (Current)</MenuItem>
                            <MenuItem value="2023-24">2023-24</MenuItem>
                        </Select>
                    </FormControl>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode("surplus")}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                viewMode === "surplus"
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setViewMode("simulate")}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                viewMode === "simulate"
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            <Truck size={15} /> Optimize
                        </button>
                    </div>
                </div>

                {/* ── Stats Panel ──────────────────────────────────────────── */}
                {quickStats && (
                    <div className="glass-panel-dark p-5 rounded-[2rem] pointer-events-auto animate-in fade-in slide-in-from-left-4 duration-500">
                        <Typography variant="overline" className="text-slate-400 font-bold tracking-wider mb-2 block">
                            QUICK OVERVIEW
                        </Typography>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-400">Total Deficit</p>
                                <p className="text-xl font-bold text-red-400">
                                    -{((routeStats?.totalDeficit ?? quickStats.totalDeficit) / 1000).toFixed(1)}k
                                    <span className="text-xs ml-1">t</span>
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-400">Total Surplus</p>
                                <p className="text-xl font-bold text-green-400">
                                    +{((routeStats?.totalSurplus ?? quickStats.totalSurplus) / 1000).toFixed(1)}k
                                    <span className="text-xs ml-1">t</span>
                                </p>
                            </div>

                            {/* Critical district count — always shown */}
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                <p className="text-xs text-slate-400">Critical Districts</p>
                                <p className="text-xl font-bold text-orange-400">{quickStats.criticalCount}</p>
                            </div>

                            {viewMode === "simulate" && routeStats ? (
                                <>
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-xs text-slate-400">Coverage</p>
                                        <p className="text-xl font-bold text-blue-400">{routeStats.coveragePercent}%</p>
                                    </div>
                                    <div className="col-span-2 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-slate-400">Total Logistics Cost</p>
                                                <p className="text-lg font-black text-amber-400">
                                                    PKR {routeStats.grandTotalCost?.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Routes / Trucks</p>
                                                <p className="text-sm font-bold text-slate-300">
                                                    {routeStats.routeCount} / {routeStats.totalTrucks}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    PKR {routeStats.costPerTonne?.toLocaleString()}/t
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 col-span-1">
                                    <p className="text-xs text-slate-400">Districts</p>
                                    <p className="text-xl font-bold text-slate-300">{surplusData.length}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Route Sidebar (simulate mode) ────────────────────────────── */}
            {viewMode === "simulate" && optimizedRoutes.length > 0 && !optimizing && (
                <div className="absolute top-4 right-4 z-[401] w-80 max-h-[calc(100vh-8rem)] overflow-y-auto pointer-events-auto">
                    <div className="glass-panel p-4 rounded-2xl bg-white/95 backdrop-blur shadow-xl border border-white/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Route size={16} className="text-indigo-600" />
                            <h3 className="font-bold text-slate-800 text-sm">
                                Shipment Routes ({optimizedRoutes.length})
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                            Sorted: worst deficits served first. Route colour = deficit severity.
                            Distance includes road factor (×1.35). Cost = trucks × km × PKR 250.
                        </p>
                        <div className="space-y-2">
                            {optimizedRoutes.map((route, i) => {
                                const severityBg = { critical: "bg-red-50 border-red-200", moderate: "bg-orange-50 border-orange-200", mild: "bg-yellow-50 border-yellow-200" }[route.deficitSeverity] || "bg-slate-50 border-slate-100";
                                return (
                                    <div key={route.id || i} className={`${severityBg} rounded-xl p-3 border hover:opacity-90 transition-opacity`}>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">#{i + 1}</span>
                                            <div className="flex items-center gap-1 text-xs font-bold flex-1 min-w-0">
                                                <span className="text-green-700 truncate">{route.sourceName}</span>
                                                <ArrowRight size={11} className="text-slate-400 flex-shrink-0" />
                                                <span className="text-red-700 truncate">{route.destName}</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1 text-[10px]">
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Amount</p>
                                                <p className="font-bold text-slate-700">{Math.round(route.amount).toLocaleString()} t</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Trucks</p>
                                                <p className="font-bold text-slate-700">{route.numTrucks}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Dist</p>
                                                <p className="font-bold text-slate-700">{route.distance} km</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 font-bold uppercase">Cost</p>
                                                <p className="font-bold text-amber-600">₨{((route.costs?.total || 0) / 1000).toFixed(0)}k</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Map ──────────────────────────────────────────────────────── */}
            <MapContainer
                center={[30.3753, 69.3451]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                className="z-0 bg-slate-200"
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

                {viewMode === "simulate" && optimizedRoutes.map((route, i) => (
                    <RouteArrow key={route.id || i} route={route} map={mapInstance} index={i} />
                ))}
            </MapContainer>

            {/* ── Loading overlay ───────────────────────────────────────────── */}
            {(loading || optimizing) && (
                <div className="absolute inset-0 z-[500] bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <h3 className="font-bold text-slate-800">
                            {optimizing ? "Calculating Routes..." : "Loading Map..."}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {optimizing ? "Finding optimal supply chain paths" : "Fetching district data"}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Legend ───────────────────────────────────────────────────── */}
            <div className="absolute bottom-6 right-6 z-[400] glass-panel p-4 rounded-xl max-w-xs bg-white/90 backdrop-blur shadow-xl border border-white/20">
                <Typography variant="subtitle2" className="font-bold mb-2 text-slate-700">
                    {viewMode === "surplus" ? "What the Colours Mean" : "Route Legend"}
                </Typography>

                {viewMode === "simulate" ? (
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-red-500 opacity-80"></span><span className="text-slate-600">Critical deficit route</span></div>
                        <div className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-orange-400 opacity-80"></span><span className="text-slate-600">Moderate deficit route</span></div>
                        <div className="flex items-center gap-2"><span className="w-6 h-2 rounded bg-yellow-400 opacity-80"></span><span className="text-slate-600">Mild deficit route</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-200 border border-green-400"></span><span className="text-slate-600">Surplus (source)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-200 border border-red-400"></span><span className="text-slate-600">Deficit (destination)</span></div>
                    </div>
                ) : (
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-slate-600">Surplus — produces more than needed</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400"></span><span className="text-slate-600">Balanced — meets local demand</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400"></span><span className="text-slate-600">Mild deficit (&lt;20% short)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-slate-600">Moderate deficit (20–40% short)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-slate-600">Critical deficit (&gt;40% short)</span></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DistributionMap;
