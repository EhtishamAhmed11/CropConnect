// src/pages/surplus/RegionComparison.jsx
import { useEffect, useState } from "react";
import { regionalAPI } from "../../api/regionalAPI";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function RegionComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComparison() {
      try {
        const res = await regionalAPI.compareRegions({
          regions: [
            { type: "province", code: "P1" },
            { type: "province", code: "P2" },
          ],
        });
        setData(res.data.comparison);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchComparison();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold mb-4">Region Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart>
            {data.map((region, idx) => (
              <Line
                key={idx}
                dataKey={() => region.metrics.production}
                name={region.region.name}
                stroke={
                  ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"][idx]
                }
              />
            ))}
            <XAxis dataKey="region.name" />
            <YAxis />
            <Tooltip />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
