import React, { useState, useEffect, useMemo } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import { TrendingUp, ArrowUpRight, Package, HelpCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
      const data = response.data?.data;
      const items = Array.isArray(data) ? data : (data?.surplusRegions || data?.regions || []);
      setRegions(Array.isArray(items) ? items : []);
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

  const chartData = (Array.isArray(regions) ? regions : []).map((r) => ({
    name: r.region?.name || 'Unknown',
    available: parseFloat(r.availableForRedistribution) || 0,
  })).slice(0, 8);

  // Summary Stats — parseFloat to fix NaN
  const stats = useMemo(() => {
    if (!Array.isArray(regions) || regions.length === 0) return null;
    const totalAvailable = regions.reduce((acc, r) => acc + (parseFloat(r.availableForRedistribution) || 0), 0);
    const totalBalance = regions.reduce((acc, r) => acc + (parseFloat(r.balance) || 0), 0);
    const avgSurplus = (regions.reduce((acc, r) => acc + (parseFloat(r.surplusPercentage) || 0), 0) / regions.length).toFixed(1);
    return { totalAvailable, totalBalance, avgSurplus, total: regions.length };
  }, [regions]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Surplus Zones</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              These areas <strong>grow more than they consume</strong> — the extra production can be
              shipped to deficit regions that need it.
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
          </div>
        </div>

        {/* Explainer Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <HelpCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 mb-1">What does "surplus" mean?</p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              A <strong>surplus</strong> means a region <strong>produces more</strong> of a crop than it <strong>consumes locally</strong>.
              For example, if a district grows 1,000 tonnes of wheat but only uses 600 tonnes, there are 400 extra tonnes
              available to ship to other areas. The <strong>"available for export"</strong> figure shows how much can be redistributed.
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        {stats && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Surplus Regions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-[10px] text-slate-400 mt-1">Areas with extra production</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Available to Share</p>
              <p className="text-2xl font-bold text-emerald-600">{(stats.totalAvailable / 1000).toFixed(1)}k t</p>
              <p className="text-[10px] text-slate-400 mt-1">Tonnes that can be shipped</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Extra</p>
              <p className="text-2xl font-bold text-blue-600">{(stats.totalBalance / 1000).toFixed(1)}k t</p>
              <p className="text-[10px] text-slate-400 mt-1">Production above demand</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Avg Surplus</p>
              <p className="text-2xl font-bold text-emerald-600">+{stats.avgSurplus}%</p>
              <p className="text-[10px] text-slate-400 mt-1">Avg extra above local need</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading />
            <p className="text-slate-500 mt-4">Analyzing regional capacity...</p>
          </div>
        ) : regions.length > 0 ? (
          <div className="space-y-8">
            {/* Chart */}
            {chartData.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-1">Top Contributing Regions</h2>
                <p className="text-xs text-slate-500 mb-6">How much extra food each region can share with deficit areas (in tonnes)</p>
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
                        formatter={(value) => [`${value.toLocaleString()} tonnes`, 'Available to share']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="available" fill="#10b981" radius={[4, 4, 4, 4]} barSize={40} name="Available for Export (t)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Region Cards */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">All Surplus Regions</h2>
              <p className="text-xs text-slate-500 mb-4">Each card shows how much extra a region produces and how much is available to share</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{region.region?.name || 'Unknown'}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">{region.crop} • {region.year}</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                      <TrendingUp size={16} /> +{parseFloat(region.surplusPercentage || 0).toFixed(0)}%
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Plain language summary */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        This area produces <strong className="text-emerald-600">{parseFloat(region.surplusPercentage || 0).toFixed(0)}% more</strong> {region.crop?.toLowerCase()} than
                        it needs locally — that's <strong>{(parseFloat(region.availableForRedistribution) || 0).toLocaleString()} tonnes</strong> available
                        to send to areas that need it.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-[10px] text-green-600 font-bold uppercase mb-1">Produces</p>
                        <p className="font-bold text-green-700">{(parseFloat(region.production) || 0).toLocaleString()} t</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-bold uppercase mb-1">Uses Locally</p>
                        <p className="font-bold text-blue-700">{(parseFloat(region.consumption) || 0).toLocaleString()} t</p>
                      </div>
                    </div>

                    {/* Available for redistribution */}
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-emerald-600" />
                        <p className="text-xs text-emerald-700 font-bold">
                          {(parseFloat(region.availableForRedistribution) || 0).toLocaleString()} tonnes ready to ship
                        </p>
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
            <p className="text-slate-500">Production levels are balanced with consumption — no extra supply available for the selected crop and year.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SurplusRegions;
