import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { gisAPI } from "../../api/gisAPI";

mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN";

const MapView = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [mapMetrics, setMapMetrics] = useState([]);
  const [filter, setFilter] = useState({
    crop: "",
    year: "",
    level: "district",
  });
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Load GeoJSON
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const endpoint =
          filter.level === "province"
            ? gisAPI.getProvincesGeoJSON
            : gisAPI.getDistrictsGeoJSON;
        const res = await endpoint(
          filter.level === "district" ? { province: "" } : undefined
        );
        setGeoData(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGeoJSON();
  }, [filter.level]);

  // Load surplus/deficit metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await gisAPI.getSurplusDeficitMapData(filter);
        setMapMetrics(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (filter.crop && filter.year) fetchMetrics();
  }, [filter]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!geoData) return;

    // Clear previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [67.0, 30.0],
      zoom: 5.5,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Add districts source
      map.addSource("districts", {
        type: "geojson",
        data: geoData,
      });

      // Fill layer
      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: {
          "fill-color": [
            "match",
            ["get", "code"],
            ...mapMetrics.flatMap((d) => [d.regionCode, d.color || "#ccc"]),
            "#ccc",
          ],
          "fill-opacity": 0.6,
        },
      });

      // Outline layer
      map.addLayer({
        id: "districts-outline",
        type: "line",
        source: "districts",
        paint: {
          "line-color": "#000",
          "line-width": 1,
        },
      });

      // Click event to show side panel
      map.on("click", "districts-fill", (e) => {
        const code = e.features[0].properties.code;
        const item =
          mapMetrics.find((d) => d.regionCode === code) ||
          e.features[0].properties;
        setSelectedRegion(item);
      });

      // Change cursor on hover
      map.on(
        "mouseenter",
        "districts-fill",
        () => (map.getCanvas().style.cursor = "pointer")
      );
      map.on(
        "mouseleave",
        "districts-fill",
        () => (map.getCanvas().style.cursor = "")
      );

      // Add markers if coordinates exist
      geoData.features.forEach((feature) => {
        const { coordinates } = feature.properties;
        if (coordinates?.latitude && coordinates?.longitude) {
          const marker = new mapboxgl.Marker({ color: "#0074D9" })
            .setLngLat([coordinates.longitude, coordinates.latitude])
            .addTo(map);

          marker.getElement().addEventListener("click", () => {
            const item =
              mapMetrics.find(
                (d) => d.regionCode === feature.properties.code
              ) || feature.properties;
            setSelectedRegion(item);
          });
        }
      });
    });
  }, [geoData, mapMetrics]);

  return (
    <div className="flex flex-col md:flex-row h-[90vh] p-4 gap-4">
      {/* Sidebar */}
      <div className="md:w-1/4 bg-white rounded shadow p-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="space-y-2">
          <select
            className="w-full border p-2 rounded"
            value={filter.crop}
            onChange={(e) => setFilter({ ...filter, crop: e.target.value })}
          >
            <option value="">Select Crop</option>
            <option value="WHEAT">Wheat</option>
            <option value="RICE">Rice</option>
          </select>

          <select
            className="w-full border p-2 rounded"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          >
            <option value="">Select Year</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>

          <select
            className="w-full border p-2 rounded"
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
          >
            <option value="district">District</option>
            <option value="province">Province</option>
          </select>
        </div>

        {selectedRegion && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">Region Details</h2>
            <p>
              <strong>Name:</strong>{" "}
              {selectedRegion.regionName || selectedRegion.name}
            </p>
            {selectedRegion.status && (
              <>
                <p>
                  <strong>Status:</strong> {selectedRegion.status}
                </p>
                <p>
                  <strong>Surplus/Deficit:</strong> {selectedRegion.balance}
                </p>
                <p>
                  <strong>Self-Sufficiency Ratio:</strong>{" "}
                  {selectedRegion.selfSufficiencyRatio}
                </p>
                <p>
                  <strong>Production:</strong> {selectedRegion.production}
                </p>
                <p>
                  <strong>Consumption:</strong> {selectedRegion.consumption}
                </p>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6">
          <h2 className="font-semibold text-lg mb-2">Legend</h2>
          <div className="space-y-1">
            <div>
              <span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>
              High Productivity
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-orange-500 mr-2"></span>
              Medium Productivity
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>Low
              Productivity
            </div>
            <div>
              <span className="inline-block w-4 h-4 bg-gray-400 mr-2"></span>No
              Data
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="md:flex-1 h-full" ref={mapContainer}></div>
    </div>
  );
};

export default MapView;
