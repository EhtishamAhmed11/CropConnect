// backend/controllers/surplusDeficit.controller.js
import ProductionData from "../models/productionData.model.js";
import ConsumptionData from "../models/consumptionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import CropType from "../models/cropType.model.js";
import Alert from "../models/alerts.model.js";
import ApiResponse from "../utils/apiResponse.js";
import cache from "../services/cache.service.js";
import {
  calculateSurplusDeficit,
  calculateConsumption,
  generateRecommendations,
  calculateDistance,
} from "../utils/calculations.js";

/**
 * @desc    Calculate surplus/deficit for a region
 * @route   POST /api/surplus-deficit/calculate
 * @access  Private (Policy Maker, NGO, Admin)
 */
export const calculateSurplusDeficitAnalysis = async (req, res, next) => {
  try {
    const { year, crop, province, district } = req.body;

    // Validation
    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    // Determine level
    const level = district ? "district" : province ? "provincial" : "national";

    // Build query for production data
    const prodQuery = {
      year,
      cropCode: crop.toUpperCase(),
      level,
    };

    if (province) prodQuery.provinceCode = province.toUpperCase();
    if (district) prodQuery.districtCode = district.toUpperCase();

    // Get production data
    let productionRecord;
    let totalProductionValue = 0;

    if (level === "district") {
      productionRecord = await ProductionData.findOne(prodQuery)
        .populate("province", "name code population")
        .populate("district", "name code population")
        .populate("cropType", "name code avgConsumptionPerCapita");

      if (!productionRecord) {
        return ApiResponse.error(
          res,
          "Production data not found for specified district",
          404
        );
      }
      totalProductionValue = productionRecord.production.value;
    } else {
      // Aggregate production for Provincial or National level
      // Attempt 1: Aggregate from districts
      const districtQuery = {
        year,
        cropCode: crop.toUpperCase(),
        level: "district"
      };
      if (province) districtQuery.provinceCode = province.toUpperCase();

      let productionData = await ProductionData.find(districtQuery).populate("cropType");

      // Attempt 2: If no districts, and level is provincial, look for direct provincial record
      if (productionData.length === 0 && level === "provincial") {
        const provQuery = {
          year,
          cropCode: crop.toUpperCase(),
          level: "provincial",
          provinceCode: province.toUpperCase()
        };
        const directProvRecord = await ProductionData.findOne(provQuery).populate("cropType");
        if (directProvRecord) productionData = [directProvRecord];
      }

      // Attempt 3: If no districts, and level is national, look for provincial records to sum, OR national record
      if (productionData.length === 0 && level === "national") {
        const provQuery = {
          year,
          cropCode: crop.toUpperCase(),
          level: "provincial"
        };
        productionData = await ProductionData.find(provQuery).populate("cropType");

        if (productionData.length === 0) {
          const natQuery = {
            year,
            cropCode: crop.toUpperCase(),
            level: "national"
          };
          const directNatRecord = await ProductionData.findOne(natQuery).populate("cropType");
          if (directNatRecord) productionData = [directNatRecord];
        }
      }

      if (productionData.length === 0) {
        return ApiResponse.error(
          res,
          `No production records found for ${level} analysis in ${year}`,
          404
        );
      }

      totalProductionValue = productionData.reduce((sum, p) => sum + p.production.value, 0);
      // Use the first record to get cropType details
      productionRecord = productionData[0];
    }

    if (!productionRecord || !productionRecord.cropType) {
      return ApiResponse.error(
        res,
        "Crop type details not found. Please ensure crop configuration exists.",
        404
      );
    }

    // Get population
    let population;
    let regionName;

    if (level === "district") {
      if (!productionRecord.district) {
        return ApiResponse.error(
          res,
          "District details not found in production record.",
          404
        );
      }
      population = productionRecord.district.population || 0;
      regionName = productionRecord.district.name;
    } else if (level === "provincial") {
      const provinceDoc = await Province.findOne({ code: province.toUpperCase() });
      if (!provinceDoc) {
        return ApiResponse.error(res, "Province not found", 404);
      }
      population = provinceDoc.population || 0;
      regionName = provinceDoc.name;
      // Ensure productionRecord matches the province for later saving
      productionRecord.province = provinceDoc._id;
      productionRecord.provinceCode = provinceDoc.code;
    } else {
      // National level
      const allProvinces = await Province.find({});
      population = allProvinces.reduce((sum, p) => sum + (p.population || 0), 0);
      regionName = "Pakistan";
    }

    // Calculate consumption
    const perCapitaConsumption =
      productionRecord.cropType.avgConsumptionPerCapita;
    const totalConsumption = calculateConsumption(
      population,
      perCapitaConsumption
    );

    // Calculate surplus/deficit
    const production = totalProductionValue;
    const analysis = calculateSurplusDeficit(production, totalConsumption);

    // Generate recommendations
    const recommendations = generateRecommendations(
      analysis.severity,
      regionName,
      productionRecord.cropType.name
    );

    // Save to database
    const surplusDeficitRecord = await SurplusDeficit.create({
      year,
      level,
      province: level !== "national" ? (productionRecord.province?._id || productionRecord.province) : undefined,
      provinceCode: level !== "national" ? productionRecord.provinceCode : undefined,
      district: level === "district" ? (productionRecord.district?._id || productionRecord.district) : undefined,
      districtCode: level === "district" ? productionRecord.districtCode : undefined,
      cropType: productionRecord.cropType._id || productionRecord.cropType,
      cropCode: productionRecord.cropCode,
      production,
      consumption: totalConsumption,
      balance: analysis.balance,
      status: analysis.status,
      surplusDeficitPercentage: analysis.surplusDeficitPercentage,
      selfSufficiencyRatio: analysis.selfSufficiencyRatio,
      severity: analysis.severity,
      requiresIntervention: analysis.status === "deficit" && analysis.severity === "critical",
      priorityLevel: analysis.severity === "critical" ? "high" : analysis.severity === "moderate" ? "medium" : "low",
      recommendations,
      calculatedBy: req.user._id,
      calculatedAt: new Date(),
    });

    // Create alert if critical or moderate deficit
    if (analysis.requiresIntervention) {
      await Alert.create({
        alertId: `ALERT-${Date.now()}`,
        title: `${analysis.severity.toUpperCase()} Deficit Alert: ${regionName}`,
        message: `${productionRecord.cropType.name
          } production in ${regionName} shows ${analysis.severity
          } deficit (${Math.abs(analysis.surplusDeficitPercentage).toFixed(
            2
          )}%). Immediate attention required.`,
        alertType: "deficit_critical",
        severity: analysis.severity === "critical" ? "critical" : "high",
        relatedEntity: {
          entityType: "surplus_deficit",
          entityId: surplusDeficitRecord._id,
        },
        province: productionRecord.province?._id,
        district: productionRecord.district?._id,
        cropType: productionRecord.cropType._id,
        targetRoles: ["admin", "government_policy_maker", "ngo_coordinator"],
        deliveryChannels: {
          inApp: true,
          email: true,
        },
      });
    }

    return ApiResponse.created(
      res,
      {
        ...analysis,
        region: {
          level,
          name: regionName,
          ...(level === "district" && productionRecord.province && {
            province: productionRecord.province.name,
          }),
        },
        crop: productionRecord.cropType.name,
        year,
        population,
        perCapitaConsumption,
        recommendations,
        alertCreated: analysis.requiresIntervention,
      },
      "Surplus/deficit analysis completed successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all surplus/deficit records with filters
 * @route   GET /api/surplus-deficit
 * @access  Public
 */
export const getSurplusDeficitRecords = async (req, res, next) => {
  try {
    const {
      year,
      crop,
      province,
      district,
      status,
      severity,
      page = 1,
      limit = 50,
    } = req.query;

    // Cache check
    const cacheKey = cache.generateKey("sd_records", { year, crop, province, district, status, severity, page, limit });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.paginated(res, cachedData.records, page, limit, cachedData.total, "Surplus/deficit records retrieved from cache");
    }

    const skip = (page - 1) * limit;

    // Build query filter from request parameters
    const query = {};
    if (year) query.year = year;
    if (crop) {
      const cropDoc = await CropType.findOne({ code: crop.toUpperCase() });
      if (cropDoc) query.cropType = cropDoc._id;
    }
    if (province) {
      const provDoc = await Province.findOne({ code: province.toUpperCase() });
      if (provDoc) query.province = provDoc._id;
    }
    if (district) {
      const distDoc = await District.findOne({ code: district.toUpperCase() });
      if (distDoc) query.district = distDoc._id;
    }
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const [records, total] = await Promise.all([
      SurplusDeficit.find(query)
        .populate("province", "name code")
        .populate("district", "name code")
        .populate("cropType", "name code")
        .sort({ calculatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SurplusDeficit.countDocuments(query),
    ]);

    // Store in cache
    cache.set(cacheKey, { records, total });

    return ApiResponse.paginated(
      res,
      records,
      page,
      limit,
      total,
      "Surplus/deficit records retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get surplus/deficit summary
 * @route   GET /api/surplus-deficit/summary
 * @access  Public
 */
export const getSurplusDeficitSummary = async (req, res, next) => {
  try {
    const { year, crop } = req.query;

    const matchStage = {};
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();

    // Cache check
    const cacheKey = cache.generateKey("sd_summary", { year, crop });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Surplus/deficit summary retrieved from cache");
    }

    const summary = await SurplusDeficit.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalBalance: { $sum: "$balance" },
          avgSelfSufficiency: { $avg: "$selfSufficiencyRatio" },
        },
      },
    ]);

    const criticalDeficits = await SurplusDeficit.countDocuments({
      ...matchStage,
      severity: "critical",
      status: "deficit",
    });

    const moderateDeficits = await SurplusDeficit.countDocuments({
      ...matchStage,
      severity: "moderate",
      status: "deficit",
    });

    const requiresIntervention = await SurplusDeficit.countDocuments({
      ...matchStage,
      requiresIntervention: true,
    });

    // Transform summary
    const statusSummary = {
      surplus: 0,
      deficit: 0,
      balanced: 0,
    };

    summary.forEach((item) => {
      statusSummary[item._id] = item.count;
    });

    const result = {
      statusBreakdown: statusSummary,
      severityBreakdown: {
        critical: criticalDeficits,
        moderate: moderateDeficits,
      },
      requiresIntervention,
      filters: {
        year: year || "all",
        crop: crop || "all",
      },
    };

    // Store in cache
    cache.set(cacheKey, result);

    return ApiResponse.success(
      res,
      result,
      "Surplus/deficit summary retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get deficit regions (critical areas)
 * @route   GET /api/surplus-deficit/deficit-regions
 * @access  Public
 */
export const getDeficitRegions = async (req, res, next) => {
  try {
    const { year, crop, severity = "all" } = req.query;

    // Cache check
    const cacheKey = cache.generateKey("deficit_regions", { year, crop, severity });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Deficit regions retrieved from cache");
    }

    const matchStage = {
      status: "deficit",
    };

    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (severity !== "all") matchStage.severity = severity;

    const deficitRegions = await SurplusDeficit.find(matchStage)
      .populate("province", "name code population")
      .populate("district", "name code population")
      .populate("cropType", "name code")
      .sort({ surplusDeficitPercentage: 1 }) // Most severe first
      .lean();

    // Group by severity
    const grouped = {
      critical: [],
      moderate: [],
      mild: [],
    };

    deficitRegions.forEach((region) => {
      grouped[region.severity].push({
        region: {
          level: region.level,
          name: region.district?.name || region.province?.name || "National",
          code: region.districtCode || region.provinceCode,
          ...(region.district && region.province && { province: region.province.name }),
        },
        crop: region.cropType?.name,
        year: region.year,
        production: Math.round(region.production),
        consumption: Math.round(region.consumption),
        deficitPercentage: Math.abs(region.surplusDeficitPercentage).toFixed(2),
        balance: Math.round(region.balance),
        selfSufficiency: region.selfSufficiencyRatio.toFixed(2),
        requiresIntervention: region.requiresIntervention,
        recommendations: region.recommendations,
      });
    });

    const responseData = {
      deficitRegions: grouped,
      totalDeficits: deficitRegions.length,
      criticalCount: grouped.critical.length,
      moderateCount: grouped.moderate.length,
      mildCount: grouped.mild.length,
    };

    // Store in cache (5 min TTL)
    cache.set(cacheKey, responseData);

    return ApiResponse.success(
      res,
      responseData,
      "Deficit regions retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get surplus regions (potential redistribution sources)
 * @route   GET /api/surplus-deficit/surplus-regions
 * @access  Public
 */
export const getSurplusRegions = async (req, res, next) => {
  try {
    const { year, crop, minSurplus = 10 } = req.query;

    // Cache check
    const cacheKey = cache.generateKey("surplus_regions", { year, crop, minSurplus });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Surplus regions retrieved from cache");
    }

    const matchStage = {
      status: "surplus",
      surplusDeficitPercentage: { $gte: parseFloat(minSurplus) },
    };

    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();

    const surplusRegions = await SurplusDeficit.find(matchStage)
      .populate("province", "name code")
      .populate("district", "name code")
      .populate("cropType", "name code")
      .sort({ surplusDeficitPercentage: -1 })
      .lean();

    const formattedRegions = surplusRegions.map((region) => ({
      region: {
        level: region.level,
        name: region.district?.name || region.province?.name || "National",
        code: region.districtCode || region.provinceCode,
        ...(region.district && region.province && { province: region.province.name }),
      },
      crop: region.cropType?.name,
      year: region.year,
      production: Math.round(region.production),
      consumption: Math.round(region.consumption),
      surplusPercentage: region.surplusDeficitPercentage.toFixed(2),
      balance: Math.round(region.balance),
      availableForRedistribution: Math.round(region.balance * 0.8), // Assume 80% available
    }));

    const responseData = {
      surplusRegions: formattedRegions,
      totalSurplusRegions: surplusRegions.length,
    };

    // Store in cache (5 min TTL)
    cache.set(cacheKey, responseData);

    return ApiResponse.success(
      res,
      responseData,
      "Surplus regions retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get redistribution suggestions
 * @route   GET /api/surplus-deficit/redistribution-suggestions
 * @access  Private
 */
export const getRedistributionSuggestions = async (req, res, next) => {
  try {
    const { year, crop } = req.query;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const matchStage = {
      year,
      cropCode: crop.toUpperCase(),
      level: "provincial", // Focus on provincial level
    };

    // Get all records with geographic coordinates
    const records = await SurplusDeficit.find(matchStage)
      .populate("province", "name code coordinates")
      .populate("district", "name code coordinates")
      .populate("cropType", "name code")
      .lean();

    const deficitRegions = records.filter((r) => r.status === "deficit");
    const surplusRegions = records.filter((r) => r.status === "surplus");

    const suggestions = [];

    // Match deficit regions with surplus regions
    deficitRegions.forEach((deficit) => {
      const deficitAmount = Math.abs(deficit.balance);
      const targetCoords = deficit.province?.coordinates || deficit.district?.coordinates;

      const matchingSurplus = surplusRegions
        .filter((surplus) => surplus.balance > 0)
        .map(surplus => {
          const sourceCoords = surplus.province?.coordinates || surplus.district?.coordinates;
          let distance = null;

          if (targetCoords && sourceCoords) {
            distance = calculateDistance(
              [targetCoords.latitude, targetCoords.longitude],
              [sourceCoords.latitude, sourceCoords.longitude]
            );
          }

          return {
            ...surplus,
            distance: distance
          };
        })
        .sort((a, b) => {
          // Sort by distance (closest first), then by balance (largest first)
          if (a.distance !== null && b.distance !== null) {
            if (a.distance !== b.distance) return a.distance - b.distance;
          }
          return b.balance - a.balance;
        });

      if (matchingSurplus.length > 0) {
        suggestions.push({
          deficitRegion: {
            name: deficit.province?.name || deficit.district?.name,
            code: deficit.provinceCode || deficit.districtCode,
            deficitAmount: Math.round(deficitAmount),
            severity: deficit.severity,
          },
          surplusSources: matchingSurplus.slice(0, 3).map((surplus) => ({
            name: surplus.province?.name || surplus.district?.name,
            code: surplus.provinceCode || surplus.districtCode,
            availableAmount: Math.round(surplus.balance * 0.9), // Available reserve
            distance: surplus.distance ? parseFloat(surplus.distance.toFixed(1)) : null,
          })),
          priority: deficit.severity === "critical" ? "high" : "medium",
        });
      }
    });

    return ApiResponse.success(
      res,
      {
        suggestions: suggestions.sort((a, b) =>
          a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0
        ),
        summary: {
          totalDeficitRegions: deficitRegions.length,
          totalSurplusRegions: surplusRegions.length,
          matchableDeficits: suggestions.length,
        },
      },
      "Redistribution suggestions generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get metadata for filters (years, crops, provinces, districts)
 * @route   GET /api/surplus-deficit/metadata
 * @access  Public
 */
export const getSurplusDeficitMetadata = async (req, res, next) => {
  try {
    const [sdYears, prodYears, crops, provinces, districts] = await Promise.all([
      SurplusDeficit.distinct("year"),
      ProductionData.distinct("year"),
      CropType.find({}, "name code").lean(),
      Province.find({ isActive: true }, "name code").lean(),
      District.find({ isActive: true }, "name code provinceCode").lean(),
    ]);

    // Merge and deduplicate years
    const years = [...new Set([...sdYears, ...prodYears])].sort((a, b) => b.localeCompare(a));

    return ApiResponse.success(
      res,
      {
        years,
        crops: crops.map(c => ({ label: c.name, value: c.code })),
        provinces: provinces.map(p => ({ label: p.name, value: p.code })),
        districts: districts.map(d => ({
          label: d.name,
          value: d.code,
          province: d.provinceCode
        })),
      },
      "Metadata retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};
