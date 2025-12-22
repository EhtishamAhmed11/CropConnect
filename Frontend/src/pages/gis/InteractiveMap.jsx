import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { gisAPI } from "../../api/gisAPI";

const InteractiveMap = ({ filter, onRegionSelect }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  const [geoData, setGeoData] = useState(null);
  const [mapMetrics, setMapMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  ////////////////////////////////////////////////////////////////////////////
  // 1. FETCH GEOJSON
  ////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setLoading(true);

        const endpoint =
          filter.level === "province"
            ? gisAPI.getProvincesGeoJSON
            : gisAPI.getDistrictsGeoJSON;

        const res = await endpoint(
          filter.level === "district" ? { province: "" } : undefined
        );

        if (
          res.data?.data?.features &&
          res.data.data.features.length > 0
        ) {
          setGeoData(res.data.data);
        } else {
          console.warn("Empty or invalid GeoJSON");
          setGeoData(null);
        }
      } catch (err) {
        console.error("Error fetching GeoJSON:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoJSON();
  }, [filter.level]);

  ////////////////////////////////////////////////////////////////////////////
  // 2. FETCH METRICS
  ////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!filter.crop || !filter.year) return;

    const fetchMetrics = async () => {
      try {
        const res = await gisAPI.getSurplusDeficitMapData(filter);
        setMapMetrics(res.data.data || []);
      } catch (err) {
        console.error("Error fetching metrics:", err);
      }
    };

    fetchMetrics();
  }, [filter]);

  ////////////////////////////////////////////////////////////////////////////
  // 3. RENDER MAP
  ////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    if (width === 0 || height === 0) {
      console.warn("Map container has zero dimensions.");
      return;
    }

    // Clear old map
    svg.selectAll("*").remove();

    ////////////////////////////////////////////////////////////////////////////
    // Tooltip (only create once)
    ////////////////////////////////////////////////////////////////////////////
    let tooltip = tooltipRef.current;
    if (!tooltip) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "10000");

      tooltipRef.current = tooltip;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Projection
    ////////////////////////////////////////////////////////////////////////////
    const projection = d3.geoMercator().fitSize([width, height], geoData);
    const path = d3.geoPath().projection(projection);

    ////////////////////////////////////////////////////////////////////////////
    // MAIN GROUP
    ////////////////////////////////////////////////////////////////////////////
    const g = svg.append("g");

    ////////////////////////////////////////////////////////////////////////////
    // DRAW MAP
    ////////////////////////////////////////////////////////////////////////////
    g.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", path)

      ////////////////////////////////////////////////////
      // COLOR-CODED BY PRODUCTION STATUS
      ////////////////////////////////////////////////////
      .attr("fill", (d) => {
        const metric = mapMetrics.find(
          (m) => m.regionCode === d.properties.code
        );

        if (!metric) return "#d1fadf"; // Light green default

        // Color by status
        if (metric.status === "surplus") return "#86efac"; // Green
        if (metric.status === "deficit") return "#fca5a5"; // Red
        if (metric.status === "balanced") return "#fde047"; // Yellow

        return "#d1fadf"; // Default
      })
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1)
      .style("vector-effect", "non-scaling-stroke")

      .on("mouseover", function (event, d) {
        const metric = mapMetrics.find(
          (m) => m.regionCode === d.properties.code
        );

        // Highlight on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.7)
          .attr("stroke-width", 2);

        tooltip
          .style("visibility", "visible")
          .html(
            `<strong>${d.properties.name}</strong><br/>
             ${metric
              ? `<span style="color: ${metric.status === 'surplus' ? '#86efac' : metric.status === 'deficit' ? '#fca5a5' : '#fde047'}">
                      Status: ${metric.status?.toUpperCase() || 'N/A'}</span><br/>
                    Production: ${metric.production?.toLocaleString() || 'N/A'} tons<br/>
                    Balance: ${metric.balance?.toLocaleString() || 'N/A'} tons`
              : "No production data available"
            }`
          );
      })

      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })

      .on("mouseout", function () {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke-width", 1);

        tooltip.style("visibility", "hidden");
      })

      .on("click", (event, d) => {
        const metric = mapMetrics.find(
          (m) => m.regionCode === d.properties.code
        );
        onRegionSelect?.(metric || d.properties);
      });

    ////////////////////////////////////////////////////////////////////////////
    // SURPLUS → DEFICIT ARROWS
    ////////////////////////////////////////////////////////////////////////////
    if (mapMetrics.length > 0) {
      const surplusRegions = mapMetrics.filter((m) => m.status === "surplus");
      const deficitRegions = mapMetrics.filter((m) => m.status === "deficit");

      // Arrow marker definition
      const defs = svg.append("defs");
      defs
        .append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#059669");

      // Draw arrows from surplus to deficit
      deficitRegions.forEach((deficit) => {
        if (!deficit.coordinates) return;

        // Find nearest surplus region
        let nearest = null;
        let minDist = Infinity;

        surplusRegions.forEach((surplus) => {
          if (!surplus.coordinates) return;
          const dist = Math.sqrt(
            Math.pow(
              surplus.coordinates.latitude - deficit.coordinates.latitude,
              2
            ) +
            Math.pow(
              surplus.coordinates.longitude - deficit.coordinates.longitude,
              2
            )
          );
          if (dist < minDist) {
            minDist = dist;
            nearest = surplus;
          }
        });

        if (nearest) {
          const source = projection([
            nearest.coordinates.longitude,
            nearest.coordinates.latitude,
          ]);
          const target = projection([
            deficit.coordinates.longitude,
            deficit.coordinates.latitude,
          ]);

          if (source && target) {
            // Draw curved arrow
            const dx = target[0] - source[0];
            const dy = target[1] - source[1];
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve factor

            g.append("path")
              .attr(
                "d",
                `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`
              )
              .attr("stroke", "#059669")
              .attr("stroke-width", 2)
              .attr("fill", "none")
              .attr("marker-end", "url(#arrowhead)")
              .attr("opacity", 0.6)
              .style("cursor", "pointer")
              .on("mouseover", function () {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("stroke-width", 3)
                  .attr("opacity", 1);

                tooltip
                  .style("visibility", "visible")
                  .html(
                    `<strong>Transport Suggestion</strong><br/>
                     From: <span style="color: #86efac">${nearest.regionName}</span><br/>
                     To: <span style="color: #fca5a5">${deficit.regionName}</span><br/>
                     Available: ${nearest.balance?.toLocaleString()} tons<br/>
                     Needed: ${Math.abs(deficit.balance)?.toLocaleString()} tons`
                  );
              })
              .on("mousemove", (event) => {
                tooltip
                  .style("top", event.pageY - 10 + "px")
                  .style("left", event.pageX + 10 + "px");
              })
              .on("mouseout", function () {
                d3.select(this)
                  .transition()
                  .duration(200)
                  .attr("stroke-width", 2)
                  .attr("opacity", 0.6);

                tooltip.style("visibility", "hidden");
              });
          }
        }
      });
    }

    ////////////////////////////////////////////////////////////////////////////
    // ZOOM
    ////////////////////////////////////////////////////////////////////////////
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    ////////////////////////////////////////////////////////////////////////////
    // CLEANUP
    ////////////////////////////////////////////////////////////////////////////
    return () => {
      tooltip.style("visibility", "hidden");
    };
  }, [geoData, mapMetrics, filter.level]);

  ////////////////////////////////////////////////////////////////////////////
  // RENDER COMPONENT
  ////////////////////////////////////////////////////////////////////////////
  return (
    <div className="w-full h-full relative bg-blue-50 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full"></svg>

      <div className="absolute bottom-4 right-4 bg-white p-2 rounded shadow text-xs">
        <h4 className="font-bold mb-1">Transport Suggestions</h4>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-gray-800"></span>
          <span>Suggested Route</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;
