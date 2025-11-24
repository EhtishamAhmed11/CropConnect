// backend/controllers/surplusDeficit.controller.js
import ProductionData from "../models/productionData.model.js";
import ConsumptionData from"../models/consumptionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import Province from "../models/province.model.js";
import District from "../models/district.model.js";
import CropType from "../models/cropType.model.js";
import Alert from "../models/alerts.model.js";
import ApiResponse from "../utils/apiResponse.js";
import {
  calculateSurplusDeficit,
  calculateConsumption,
  generateRecommendations,
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
    const productionRecord = await ProductionData.findOne(prodQuery)
      .populate("province", "name code population")
      .populate("district", "name code population")
      .populate("cropType", "name code avgConsumptionPerCapita");

    if (!productionRecord) {
      return ApiResponse.error(
        res,
        "Production data not found for specified parameters",
        404
      );
    }

    // Get population
    let population;
    if (level === "district") {
      population = productionRecord.district.population;
    } else if (level === "provincial") {
      population = productionRecord.province.population;
    } else {
      // National level - sum all provinces
      const provinces = await Province.find({});
      population = provinces.reduce((sum, p) => sum + p.population, 0);
    }

    // Calculate consumption
    const perCapitaConsumption =
      productionRecord.cropType.avgConsumptionPerCapita;
    const totalConsumption = calculateConsumption(
      population,
      perCapitaConsumption
    );

    // Calculate surplus/deficit
    const production = productionRecord.production.value;
    const analysis = calculateSurplusDeficit(production, totalConsumption);

    // Generate recommendations
    const regionName =
      level === "district"
        ? productionRecord.district.name
        : level === "provincial"
        ? productionRecord.province.name
        : "Pakistan";

    const recommendations = generateRecommendations(
      analysis.severity,
      regionName,
      productionRecord.cropType.name
    );

    // Save to database
    const surplusDeficitRecord = await SurplusDeficit.create({
      year,
      level,
      province: productionRecord.province?._id,
      provinceCode: productionRecord.provinceCode,
      district: productionRecord.district?._id,
      districtCode: productionRecord.districtCode,
      cropType: productionRecord.cropType._id,
      cropCode: crop.toUpperCase(),
      production,
      consumption: totalConsumption,
      balance: analysis.balance,
      status: analysis.status,
      surplusDeficitPercentage: analysis.surplusDeficitPercentage,
      selfSufficiencyRatio: analysis.selfSufficiencyRatio,
      severity: analysis.severity,
      requiresIntervention: analysis.requiresIntervention,
      priorityLevel:
        analysis.severity === "critical"
          ? "high"
          : analysis.severity === "moderate"
          ? "medium"
          : "low",
      recommendations,
      calculatedBy: req.user._id,
      calculatedAt: new Date(),
    });

    // Create alert if critical or moderate deficit
    if (analysis.requiresIntervention) {
      await Alert.create({
        alertId: `ALERT-${Date.now()}`,
        title: `${analysis.severity.toUpperCase()} Deficit Alert: ${regionName}`,
        message: `${
          productionRecord.cropType.name
        } production in ${regionName} shows ${
          analysis.severity
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
          ...(level === "district" && {
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

    // Build query
    const query = {};
    if (year) query.year = year;
    if (crop) query.cropCode = crop.toUpperCase();
    if (province) query.provinceCode = province.toUpperCase();
    if (district) query.districtCode = district.toUpperCase();
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const skip = (page - 1) * limit;

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

    return ApiResponse.success(
      res,
      {
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
      },
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
          ...(region.district && { province: region.province.name }),
        },
        crop: region.cropType.name,
        year: region.year,
        deficitPercentage: Math.abs(region.surplusDeficitPercentage).toFixed(2),
        balance: Math.round(region.balance),
        selfSufficiency: region.selfSufficiencyRatio.toFixed(2),
        requiresIntervention: region.requiresIntervention,
        recommendations: region.recommendations,
      });
    });

    return ApiResponse.success(
      res,
      {
        deficitRegions: grouped,
        totalDeficits: deficitRegions.length,
        criticalCount: grouped.critical.length,
        moderateCount: grouped.moderate.length,
        mildCount: grouped.mild.length,
      },
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
        ...(region.district && { province: region.province.name }),
      },
      crop: region.cropType.name,
      year: region.year,
      surplusPercentage: region.surplusDeficitPercentage.toFixed(2),
      balance: Math.round(region.balance),
      availableForRedistribution: Math.round(region.balance * 0.8), // Assume 80% available
    }));

    return ApiResponse.success(
      res,
      {
        surplusRegions: formattedRegions,
        totalSurplusRegions: surplusRegions.length,
      },
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

    // Get all records
    const records = await SurplusDeficit.find(matchStage)
      .populate("province", "name code")
      .populate("cropType", "name code")
      .lean();

    const deficitRegions = records.filter((r) => r.status === "deficit");
    const surplusRegions = records.filter((r) => r.status === "surplus");

    const suggestions = [];

    // Match deficit regions with surplus regions
    deficitRegions.forEach((deficit) => {
      const deficitAmount = Math.abs(deficit.balance);

      const matchingSurplus = surplusRegions
        .filter((surplus) => surplus.balance > 0)
        .sort((a, b) => b.balance - a.balance);

      if (matchingSurplus.length > 0) {
        suggestions.push({
          deficitRegion: {
            name: deficit.province.name,
            code: deficit.provinceCode,
            deficitAmount: Math.round(deficitAmount),
            severity: deficit.severity,
          },
          surplusSources: matchingSurplus.slice(0, 3).map((surplus) => ({
            name: surplus.province.name,
            code: surplus.provinceCode,
            availableAmount: Math.round(surplus.balance * 0.8),
            distance: "TBD", // Can be calculated if coordinates available
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
