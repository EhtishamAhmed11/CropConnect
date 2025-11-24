import React, { useState, useEffect } from "react";
import { surplusDeficitAPI } from "../../api/surplusDeficitAPI";
import { useAlert } from "../../context/AlertContext";
import Layout from "../../components/layout/Layout";
import Loading from "../../components/common/Loading";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

const Redistribution = () => {
  const { showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    year: "2024-25",
    crop: "WHEAT",
  });

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await surplusDeficitAPI.getRedistributionSuggestions(
        filters
      );
      setSuggestions(response.data.data.suggestions);
    } catch (error) {
      showError("Failed to fetch redistribution suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Redistribution Suggestions</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          />
          <Input
            label="Crop Code"
            value={filters.crop}
            onChange={(e) => setFilters({ ...filters, crop: e.target.value })}
          />
          <div className="flex items-end">
            <Button onClick={fetchSuggestions} loading={loading} fullWidth>
              Get Suggestions
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white p-6 rounded shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-red-600">
                    Deficit Region: {suggestion.deficitRegion.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Needs:{" "}
                    {suggestion.deficitRegion.deficitAmount.toLocaleString()}{" "}
                    tonnes
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                      suggestion.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {suggestion.priority} priority
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-green-600">
                  Potential Surplus Sources:
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {suggestion.surplusSources.map((source, idx) => (
                    <div
                      key={idx}
                      className="border border-green-200 rounded p-3 bg-green-50"
                    >
                      <p className="font-semibold">{source.name}</p>
                      <p className="text-sm text-gray-600">
                        Available: {source.availableAmount.toLocaleString()}{" "}
                        tonnes
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow text-center text-gray-500">
          Click "Get Suggestions" to generate redistribution plan
        </div>
      )}
    </Layout>
  );
};

export default Redistribution;
