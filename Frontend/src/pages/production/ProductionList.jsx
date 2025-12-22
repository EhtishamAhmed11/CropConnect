import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { productionAPI } from "../../api/productionAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Pagination from "../../components/common/Pagination";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";

const ProductionList = () => {
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    year: "",
    crop: "",
    province: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [metadata, setMetadata] = useState({ years: [], crops: [], provinces: [] });
  const [summaryStats, setSummaryStats] = useState({ totalRecords: 0, activeCrops: 0 });

  // Fetch initial metadata and stats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [metaRes, cropTypesRes, summaryRes] = await Promise.all([
          productionAPI.getMetadata(),
          productionAPI.getCropTypes(),
          productionAPI.getSummary()
        ]);

        setMetadata(metaRes.data.data);
        setSummaryStats({
          totalRecords: summaryRes.data.data.recordCount || 0,
          activeCrops: cropTypesRes.data.data.length || 0
        });
      } catch (err) {
        console.error("Failed to fetch initial production metadata", err);
      }
    };
    fetchInitialData();
  }, []);

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1); // Reset to first page when filters change
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Fetch data when page or debounced filters change
  useEffect(() => {
    fetchData();
  }, [page, debouncedFilters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { page, limit: 20, ...debouncedFilters };
      const response = await productionAPI.getAll(params);
      setData(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch production data"
      );
      showError("Failed to fetch production data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({
      year: "",
      crop: "",
      province: "",
    });
  };

  const handleRowClick = (row) => {
    navigate(`/production/${row._id}`);
  };

  // Crop Icon Helper
  const getCropIcon = (cropName) => {
    const map = { WHEAT: "🌾", RICE: "🍚", COTTON: "⚪", SUGARCANE: "🍬", MAIZE: "🌽" };
    return map[cropName?.toUpperCase()] || "🌱";
  };

  const hasActiveFilters = filters.year || filters.crop || filters.province;

  if (loading && page === 1 && !hasActiveFilters && metadata.years.length === 0) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 font-['Outfit']">

        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                  Production Records
                </h1>
                <p className="text-emerald-100/80 text-lg max-w-xl">
                  Master database of agricultural output. Track yields, area cultivation, and regional performance across all seasons.
                </p>
              </div>
              <button
                onClick={() => navigate("/production/analysis")}
                className="group flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all font-semibold"
              >
                <span>View Analytics</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Total Records</p>
                <p className="text-2xl font-bold">{summaryStats.totalRecords.toLocaleString()}+</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider">Active Crops</p>
                <p className="text-2xl font-bold">{summaryStats.activeCrops} Major</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar (Glass) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Years</option>
                {metadata.years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute right-4 bottom-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Crop Type</label>
              <select
                name="crop"
                value={filters.crop}
                onChange={handleFilterChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Crops</option>
                {metadata.crops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-4 bottom-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Region</label>
              <select
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">All Regions</option>
                {metadata.provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute right-4 bottom-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-3 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm"
            >
              Reset
            </button>
          )}
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Modern Data Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Season / Year</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Crop</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Production (tons)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Area (ha)</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Yield (t/ha)</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-4xl mb-2">🔍</span>
                        <p className="text-lg font-medium">{loading ? "Scanning Database..." : "No records found matching your filters"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row._id}
                      onClick={() => handleRowClick(row)}
                      className="group hover:bg-emerald-50/30 transition-all duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {row.year}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-xl mr-3 bg-slate-100 w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                            {getCropIcon(row.cropName)}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800">{row.cropName}</p>
                            <p className="text-xs text-slate-500">{row.cropType?.category || "Staple Crop"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                          <span className="font-medium text-slate-700">
                            {row.district?.name || row.province?.name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-emerald-700 text-lg">
                          {row.production.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 font-mono text-sm">
                        {row.areaCultivated.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-800">{row.yield.value}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-300 group-hover:text-emerald-500 transition-colors">→</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductionList;