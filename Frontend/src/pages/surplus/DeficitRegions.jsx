import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import { AlertCircle, TrendingDown } from "lucide-react";

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
      setRegions(response.data.data.deficitRegions);
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 font-sans">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Deficit Zones</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Regions where consumption exceeds production. Identify areas requiring supply intervention.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <select
              name="year"
              value={filters.year}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {metadata.years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              name="crop"
              value={filters.crop}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {metadata.crops.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <div className="flex items-center gap-2 px-2 bg-slate-50 border border-slate-300 rounded-lg">
              <span className="text-xs text-slate-500 font-bold uppercase">Min %</span>
              <input
                type="number"
                name="minDeficit"
                value={filters.minDeficit}
                onChange={handleChange}
                className="bg-transparent border-none w-16 text-sm font-medium focus:ring-0"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loading />
            <p className="text-slate-500 mt-4">Loading regional data...</p>
          </div>
        ) : regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{region.region.name}</h3>
                    <p className="text-xs text-slate-500 uppercase font-medium mt-1">{region.crop} • {region.year}</p>
                  </div>
                  <div className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                    <TrendingDown size={16} /> -{region.deficitPercentage}%
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">Net Shortfall</p>
                      <p className="text-2xl font-bold text-red-600">{Math.abs(region.balance).toLocaleString()} t</p>
                    </div>
                    <AlertCircle className="text-red-200" size={32} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Production</p>
                      <p className="font-semibold text-slate-700">{region.production?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Demand</p>
                      <p className="font-semibold text-slate-700">{region.consumption?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="inline-block p-4 rounded-full bg-white shadow-sm mb-4">🛡️</div>
            <h3 className="text-lg font-bold text-slate-800">No Deficits Found</h3>
            <p className="text-slate-500">All regions are meeting consumption demands for these parameters.</p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default DeficitRegions;
