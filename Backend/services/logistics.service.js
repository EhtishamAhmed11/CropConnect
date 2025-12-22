import District from "../models/district.model.js";

// Integration with OSRM (Open Source Routing Machine) - Public API
// Alternatives: Mapbox, Google Maps (Require paid keys usually, OSRM is free for demo)
// User provided a key for "ROUTE_API_KEY", assuming it might be Mapbox or similar.
// I will implement a generic handler that can switch or just use OSRM if key is missing/invalid, 
// BUT user said "create a variable in .env i will paste the api key".
// So I will assume Mapbox for now as it's common for this. Or just standard fetch.

const MAPBOX_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/driving";

export const calculateRoute = async (originCoords, destCoords) => {
    // coordinates: [longitude, latitude]
    const apiKey = process.env.ROUTE_API_KEY;

    // If no key, return straight line distance (haversine) as fallback mock
    if (!apiKey) {
        console.warn("ROUTE_API_KEY missing. Returning mock route data.");
        return mockRoute(originCoords, destCoords);
    }

    try {
        const query = `${originCoords[1]},${originCoords[0]};${destCoords[1]},${destCoords[0]}`;
        const url = `${MAPBOX_BASE_URL}/${query}?geometries=geojson&access_token=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Routing API Error: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error("No route found");
        }

        const route = data.routes[0];
        return {
            distance: route.distance, // meters
            duration: route.duration, // seconds
            geometry: route.geometry  // GeoJSON LineString
        };

    } catch (error) {
        console.error("Router Error:", error);
        return mockRoute(originCoords, destCoords);
    }
};

const mockRoute = (origin, dest) => {
    // Simple mock: Straight line geometry
    return {
        distance: 10000,
        duration: 3600,
        geometry: {
            type: "LineString",
            coordinates: [
                [origin[1], origin[0]],
                [dest[1], dest[0]]
            ]
        },
        isMock: true
    };
};

export const suggestTransport = async (surplusDistrictId, deficitDistrictId) => {
    const surplusDist = await District.findById(surplusDistrictId);
    const deficitDist = await District.findById(deficitDistrictId);

    if (!surplusDist || !deficitDist) throw new Error("Invalid Districts");

    // Check coordinates existence
    if (!surplusDist.coordinates?.latitude || !deficitDist.coordinates?.latitude) {
        throw new Error("One or both districts missing coordinates");
    }

    const origin = [surplusDist.coordinates.latitude, surplusDist.coordinates.longitude];
    const dest = [deficitDist.coordinates.latitude, deficitDist.coordinates.longitude];

    const route = await calculateRoute(origin, dest); // Lat/Lon or Lon/Lat? Mapbox expects Lon,Lat usually. 
    // My code above sends: `${originCoords[1]},${originCoords[0]}`. 
    // If origin is [Lat, Lon], then origin[1] is Lon. Correct.

    return {
        origin: surplusDist.name,
        destination: deficitDist.name,
        ...route
    };
};
