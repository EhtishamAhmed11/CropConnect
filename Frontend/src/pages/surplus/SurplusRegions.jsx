import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SurplusRegions = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metadata, setMetadata] = useState({ years: [], crops: [] });
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    crop: "",
    minSurplus: 10,
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (filters.year && filters.crop) {
      fetchData();
    }
  }, [filters]);

  const loadMetadata = async () => {
    try {
      const res = await surplusDeficitAPI.getMetadata();
      if (res.data.success) {
        setMetadata(res.data.data);
        setFilters(prev => ({
          ...prev,
          year: res.data.data.years[0] || "",
          crop: res.data.data.crops[0]?.value || ""
        }));
      }
    } catch (err) {
      showError("Failed to load filter options");
    } finally {
      setMetaLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await surplusDeficitAPI.getSurplusRegions(filters);
      setRegions(response.data.data.surplusRegions);
    } catch (error) {
      showError("Failed to fetch surplus analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const chartData = regions.map((r) => ({
    name: r.region.name,
    available: r.availableForRedistribution,
  })).slice(0, 8);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Surplus Zones</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Regions identifying excess production capacity available for redistribution.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <select
              name="year"
              value={filters.year}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {metadata.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              name="crop"
              value={filters.crop}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {metadata.crops.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <div className="flex items-center gap-2 px-2 bg-slate-50 border border-slate-300 rounded-lg">
              <span className="text-xs text-slate-500 font-bold uppercase">Min %</span>
              <input
                type="number"
                name="minSurplus"
                value={filters.minSurplus}
                onChange={handleChange}
                className="bg-transparent border-none w-16 text-sm font-medium focus:ring-0"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading />
            <p className="text-slate-500 mt-4">Analyzing regional capacity...</p>
          </div>
        ) : regions.length > 0 ? (
          <div className="space-y-8">
            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Top Contributing Regions</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="available" fill="#10b981" radius={[4, 4, 4, 4]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{region.region.name}</h3>
                      <p className="text-xs text-slate-500 uppercase font-medium mt-1">{region.crop} • {region.year}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                      <TrendingUp size={16} /> +{region.surplusPercentage}%
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Available for Export</p>
                        <p className="text-2xl font-bold text-emerald-600">{region.availableForRedistribution.toLocaleString()} t</p>
                      </div>
                      <ArrowUpRight className="text-emerald-200" size={32} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Production</p>
                        <p className="font-semibold text-slate-700">{region.production?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Local Demand</p>
                        <p className="font-semibold text-slate-700">{region.consumption?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="inline-block p-4 rounded-full bg-white shadow-sm mb-4">⚖️</div>
            <h3 className="text-lg font-bold text-slate-800">No Significant Surplus</h3>
            <p className="text-slate-500">Current production levels are balanced with consumption for these parameters.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SurplusRegions;
