import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Input from "../../components/common/Input";

const DeficitRegions = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    year: "2024-25",
    crop: "WHEAT",
    minDeficit: 10,
  });
  const [tempFilters, setTempFilters] = useState({
    year: "2024-25",
    crop: "WHEAT",
    minDeficit: 10,
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await surplusDeficitAPI.getDeficitRegions(filters);
      setRegions(response.data.data.deficitRegions);
    } catch (error) {
      console.error("Failed to fetch deficit regions:", error);
      showError("Failed to fetch deficit regions");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      year: "2024-25",
      crop: "WHEAT",
      minDeficit: 10,
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  if (loading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Deficit Regions</h1>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Input
            label="Year"
            value={tempFilters.year}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, year: e.target.value })
            }
            placeholder="e.g., 2024-25"
          />
          <Input
            label="Crop Code"
            value={tempFilters.crop}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, crop: e.target.value })
            }
            placeholder="e.g., WHEAT, RICE"
          />
          <Input
            label="Min Deficit %"
            type="number"
            value={tempFilters.minDeficit}
            onChange={(e) =>
              setTempFilters({ ...tempFilters, minDeficit: e.target.value })
            }
            placeholder="Minimum deficit percentage"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Regions Grid */}
      <div className="bg-white rounded shadow">
        {regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {regions.map((region, index) => (
              <div
                key={index}
                className="border border-red-200 rounded p-4 bg-red-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {region.region.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {region.crop} - {region.year}
                    </p>
                  </div>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                    Deficit
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Deficit Percentage:
                    </span>
                    <span className="text-red-600 font-bold">
                      {region.deficitPercentage}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="font-semibold text-red-700">
                      {region.balance.toLocaleString()} tonnes
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <span className="text-sm text-gray-600">Production:</span>
                    <span className="text-sm">
                      {region.production?.toLocaleString() || "N/A"} tonnes
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Consumption:</span>
                    <span className="text-sm">
                      {region.consumption?.toLocaleString() || "N/A"} tonnes
                    </span>
                  </div>

                  {region.requiredFromOthers && (
                    <div className="mt-3 p-2 bg-red-100 rounded">
                      <p className="text-xs text-red-800 font-medium">
                        Required from other regions:
                      </p>
                      <p className="text-sm font-bold text-red-900">
                        {region.requiredFromOthers.toLocaleString()} tonnes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No deficit regions found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters to see results
            </p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {regions.length > 0 && (
        <div className="mt-6 bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 rounded border border-red-200">
              <p className="text-sm text-gray-600">Total Deficit Regions</p>
              <p className="text-2xl font-bold text-red-600">
                {regions.length}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded border border-orange-200">
              <p className="text-sm text-gray-600">Total Deficit (tonnes)</p>
              <p className="text-2xl font-bold text-orange-600">
                {regions
                  .reduce((sum, r) => sum + Math.abs(r.balance), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm text-gray-600">Avg Deficit Percentage</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(
                  regions.reduce((sum, r) => sum + r.deficitPercentage, 0) /
                  regions.length
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DeficitRegions;
