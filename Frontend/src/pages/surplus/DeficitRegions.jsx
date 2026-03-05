import React, { useState, useEffect, useMemo } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import { AlertCircle, TrendingDown, AlertTriangle, ShieldAlert, Info, HelpCircle } from "lucide-react";

const severityConfig = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", icon: <ShieldAlert size={14} />, barColor: "bg-red-500", desc: "These areas urgently need food imports or aid — consumption far exceeds what is produced locally." },
  moderate: { label: "Moderate", color: "bg-orange-100 text-orange-700 border-orange-200", icon: <AlertTriangle size={14} />, barColor: "bg-orange-500", desc: "These areas have noticeable shortages. Improving supply routes from surplus regions can help." },
  mild: { label: "Mild", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <Info size={14} />, barColor: "bg-yellow-500", desc: "These areas have small shortages that can be managed through better local distribution." },
};

const DeficitRegions = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metadata, setMetadata] = useState({ years: [], crops: [] });
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    crop: "",
    minDeficit: 10,
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
      const response = await surplusDeficitAPI.getDeficitRegions(filters);
      const data = response.data?.data;
      // API returns deficitRegions as { critical: [], moderate: [], mild: [] } (already grouped)
      const raw = data?.deficitRegions || data?.regions || data || [];
      let items;
      if (Array.isArray(raw)) {
        items = raw;
      } else if (typeof raw === 'object') {
        items = [...(raw.critical || []), ...(raw.moderate || []), ...(raw.mild || [])];
      } else {
        items = [];
      }
      setRegions(items);
    } catch (error) {
      showError("Failed to fetch deficit reports");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Group regions by severity
  const grouped = useMemo(() => {
    const groups = { critical: [], moderate: [], mild: [] };
    if (!Array.isArray(regions)) return groups;
    regions.forEach(r => {
      const pct = parseFloat(r.deficitPercentage) || 0;
      const sev = r.severity || (pct > 30 ? 'critical' : pct > 15 ? 'moderate' : 'mild');
      if (groups[sev]) groups[sev].push({ ...r, severity: sev });
      else groups.mild.push({ ...r, severity: 'mild' });
    });
    return groups;
  }, [regions]);

  // Summary stats — parseFloat to fix NaN
  const stats = useMemo(() => {
    if (!Array.isArray(regions) || regions.length === 0) return null;
    const totalShortfall = regions.reduce((acc, r) => acc + Math.abs(parseFloat(r.balance) || 0), 0);
    const avgDeficit = (regions.reduce((acc, r) => acc + (parseFloat(r.deficitPercentage) || 0), 0) / regions.length).toFixed(1);
    const critical = grouped.critical.length;
    return { totalShortfall, avgDeficit, critical, total: regions.length };
  }, [regions, grouped]);

  const getRecommendation = (region) => {
    const sev = region.severity;
    if (sev === 'critical') return "Immediate intervention required — consider emergency imports and food distribution.";
    if (sev === 'moderate') return "Increase cultivation next season and improve supply chain from nearby surplus regions.";
    return "Monitor production trends and optimize local distribution efficiency.";
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Deficit Zones</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              These are areas where people need <strong>more food than what is grown locally</strong>.
              The bigger the deficit, the more urgent the need for outside supply.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <select
              name="year"
              value={filters.year}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
            >
              {metadata.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              name="crop"
              value={filters.crop}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-500"
            >
              {metadata.crops.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Explainer Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <HelpCircle size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">What does "deficit" mean?</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              A <strong>deficit</strong> happens when a region <strong>consumes more</strong> of a crop than it <strong>produces</strong>.
              For example, if a district grows 500 tonnes of wheat but needs 700 tonnes, there is a 200-tonne shortfall.
              The <strong>deficit percentage</strong> shows how severe the gap is — higher means more urgent.
            </p>
          </div>
        </div>

        {/* Summary Stats Bar */}
        {stats && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Regions</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-[10px] text-slate-400 mt-1">Areas with shortages</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-red-500 uppercase mb-1">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-[10px] text-slate-400 mt-1">Need immediate help</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Shortfall</p>
              <p className="text-2xl font-bold text-red-600">{(stats.totalShortfall / 1000).toFixed(1)}k t</p>
              <p className="text-[10px] text-slate-400 mt-1">Tonnes of food needed</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Avg Deficit</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgDeficit}%</p>
              <p className="text-[10px] text-slate-400 mt-1">Average gap between supply & demand</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading />
            <p className="text-slate-500 mt-4">Loading regional data...</p>
          </div>
        ) : regions.length > 0 ? (
          <div className="space-y-8">
            {/* Grouped by severity */}
            {['critical', 'moderate', 'mild'].map(sev => {
              const items = grouped[sev];
              if (items.length === 0) return null;
              const config = severityConfig[sev];

              return (
                <div key={sev}>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`${config.barColor} w-1 h-6 rounded-full`}></span>
                      <h2 className="text-lg font-bold text-slate-800 capitalize">{config.label} Deficit</h2>
                      <span className="text-sm text-slate-500">({items.length} regions)</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-4">{config.desc}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((region, index) => (
                      <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">{region.region?.name || 'Unknown'}</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">{region.crop} • {region.year}</p>
                          </div>
                          <div className={`${config.color} border px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1`}>
                            {config.icon} {config.label}
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {/* Plain language summary */}
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed">
                              This area needs <strong className="text-red-600">{Math.abs(parseFloat(region.balance) || 0).toLocaleString()} tonnes</strong> more
                              {' '}{region.crop?.toLowerCase()} than it can produce — a <strong>{parseFloat(region.deficitPercentage || 0).toFixed(0)}% gap</strong> between
                              supply and demand.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                              <p className="text-[10px] text-green-600 font-bold uppercase mb-1">Produces</p>
                              <p className="font-bold text-green-700">{(parseFloat(region.production) || 0).toLocaleString()} t</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                              <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Needs</p>
                              <p className="font-bold text-red-700">{(parseFloat(region.consumption) || 0).toLocaleString()} t</p>
                            </div>
                          </div>

                          {/* Recommendation */}
                          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <p className="text-[10px] text-indigo-600 font-bold uppercase mb-1">💡 What Should Be Done</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{getRecommendation(region)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="inline-block p-4 rounded-full bg-white shadow-sm mb-4">🛡️</div>
            <h3 className="text-lg font-bold text-slate-800">No Deficits Found</h3>
            <p className="text-slate-500">Good news! All regions have enough production to meet demand for the selected crop and year.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default DeficitRegions;
