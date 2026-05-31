import api from "./axios";

export const getForecastData = async (crop, region, startYear, endYear) => {
  const response = await api.get("/predictions/forecast", {
    params: { crop, region, startYear, endYear },
  });
  return response.data;
};

export const getTimelineData = async (crop, region) => {
  const response = await api.get("/predictions/timeline", {
    params: { crop, region },
  });
  return response.data;
};

export const getActualVsPredicted = async (crop, region) => {
  const response = await api.get("/predictions/actual-vs-predicted", {
    params: { crop, region },
  });
  return response.data;
};

export const getModelPerformance = async (crop, region) => {
  const response = await api.get("/predictions/performance", {
    params: { crop, region },
  });
  return response.data;
};

export const getRegionalComparison = async (crop, year) => {
  const response = await api.get("/predictions/regional-comparison", {
    params: { crop, year },
  });
  return response.data;
};

export const getPredictionSummary = async (crop, region) => {
  const response = await api.get("/predictions/summary", {
    params: { crop, region },
  });
  return response.data;
};
