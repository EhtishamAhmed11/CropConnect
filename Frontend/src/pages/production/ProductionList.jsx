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

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(1); // Reset to first page when filters change
    }, 500); // Wait 500ms after user stops typing

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
    setFilters({ ...filters, [e.target.name]: e.target.value.toUpperCase() });
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

  const hasActiveFilters = filters.year || filters.crop || filters.province;

  if (loading && page === 1 && !hasActiveFilters) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Production Data
            </h1>
            <p className="text-gray-500 mt-1">
              View and manage production records
            </p>
          </div>
          <button
            onClick={() => navigate("/production/analysis")}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            📊 View Analysis
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="text"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                placeholder="e.g., 2024-25"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop
              </label>
              <input
                type="text"
                name="crop"
                value={filters.crop}
                onChange={handleFilterChange}
                placeholder="e.g., WHEAT"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Province
              </label>
              <input
                type="text"
                name="province"
                value={filters.province}
                onChange={handleFilterChange}
                placeholder="e.g., PB"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          {loading && hasActiveFilters && (
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4 mr-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Crop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Province
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Production
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Yield
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {loading ? "Loading..." : "No records found"}
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row._id}
                      onClick={() => handleRowClick(row)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {row.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.cropName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {row.province?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                        {row.production.value.toLocaleString()}{" "}
                        <span className="text-gray-500 font-normal">tonnes</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-700">
                        {row.areaCultivated.value.toLocaleString()}{" "}
                        <span className="text-gray-500">ha</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                        {row.yield.value}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.length > 0 && (
            <div className="p-4 border-t border-gray-200">
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