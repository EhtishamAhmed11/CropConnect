// backend/controllers/surplusDeficit.controller.js
import ProductionData from "../models/productionData.model.js";
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

// 90% availability buffer — how much of a surplus region's balance
// can realistically be shipped out (10% kept as local safety stock).
// Used consistently across ALL endpoints.
const REDISTRIBUTION_AVAILABILITY = 0.9;

// ─── calculateSurplusDeficitAnalysis ─────────────────────────────────────────
/**
 * @desc    Calculate surplus/deficit for a region and persist result
 * @route   POST /api/surplus-deficit/calculate
 * @access  Private (Policy Maker, NGO, Admin)
 *
 * FIX 1: requiresIntervention now reads from analysis object (covers both
 *         critical AND moderate), not just critical as before.
 * FIX 5: Uses findOneAndUpdate (upsert) instead of create — prevents
 *         duplicate records when calculate is called more than once
 *         for the same year/crop/region.
 */
export const calculateSurplusDeficitAnalysis = async (req, res, next) => {
  try {
    const { year, crop, province, district } = req.body;

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    // Determine geographic level
    const level = district ? "district" : province ? "provincial" : "national";

    const prodQuery = { year, cropCode: crop.toUpperCase(), level };
    if (province) prodQuery.provinceCode = province.toUpperCase();
    if (district) prodQuery.districtCode = district.toUpperCase();

    // ── Production data retrieval with roll-up fallback ───────────────────────
    let productionRecord;
    let totalProductionValue = 0;

    if (level === "district") {
      productionRecord = await ProductionData.findOne(prodQuery)
        .populate("province", "name code population")
        .populate("district", "name code population")
        .populate("cropType", "name code avgConsumptionPerCapita");

      if (!productionRecord) {
        return ApiResponse.error(res, "Production data not found for specified district", 404);
      }
      totalProductionValue = productionRecord.production.value;

    } else {
      // Attempt 1: aggregate from districts (most granular — most accurate)
      const districtQuery = { year, cropCode: crop.toUpperCase(), level: "district" };
      if (province) districtQuery.provinceCode = province.toUpperCase();
      let productionData = await ProductionData.find(districtQuery).populate("cropType");

      // Attempt 2: fall back to direct provincial record
      if (productionData.length === 0 && level === "provincial") {
        const directProvRecord = await ProductionData.findOne({
          year, cropCode: crop.toUpperCase(), level: "provincial",
          provinceCode: province.toUpperCase(),
        }).populate("cropType");
        if (directProvRecord) productionData = [directProvRecord];
      }

      // Attempt 3: fall back to provincial sum, then national record
      if (productionData.length === 0 && level === "national") {
        productionData = await ProductionData.find({
          year, cropCode: crop.toUpperCase(), level: "provincial",
        }).populate("cropType");

        if (productionData.length === 0) {
          const directNatRecord = await ProductionData.findOne({
            year, cropCode: crop.toUpperCase(), level: "national",
          }).populate("cropType");
          if (directNatRecord) productionData = [directNatRecord];
        }
      }

      if (productionData.length === 0) {
        return ApiResponse.error(
          res, `No production records found for ${level} analysis in ${year}`, 404
        );
      }

      totalProductionValue = productionData.reduce((sum, p) => sum + p.production.value, 0);
      productionRecord = productionData[0];
    }

    if (!productionRecord?.cropType) {
      return ApiResponse.error(res, "Crop type details not found.", 404);
    }

    // ── Population retrieval ──────────────────────────────────────────────────
    let population;
    let regionName;

    if (level === "district") {
      if (!productionRecord.district) {
        return ApiResponse.error(res, "District details not found in production record.", 404);
      }
      population = productionRecord.district.population || 0;
      regionName = productionRecord.district.name;

    } else if (level === "provincial") {
      const provinceDoc = await Province.findOne({ code: province.toUpperCase() });
      if (!provinceDoc) return ApiResponse.error(res, "Province not found", 404);
      population = provinceDoc.population || 0;
      regionName = provinceDoc.name;
      productionRecord.province = provinceDoc._id;
      productionRecord.provinceCode = provinceDoc.code;

    } else {
      const allProvinces = await Province.find({});
      population = allProvinces.reduce((sum, p) => sum + (p.population || 0), 0);
      regionName = "Pakistan";
    }

    // ── Core calculation ──────────────────────────────────────────────────────
    const perCapitaConsumption = productionRecord.cropType.avgConsumptionPerCapita;
    const totalConsumption = calculateConsumption(population, perCapitaConsumption);
    const analysis = calculateSurplusDeficit(totalProductionValue, totalConsumption);
    const recommendations = generateRecommendations(
      analysis.severity, regionName, productionRecord.cropType.name
    );

    // ── Upsert — prevent duplicate records on re-calculation ─────────────────
    // FIX 5: was SurplusDeficit.create() which inserted a new row every time
    const upsertFilter = {
      year,
      level,
      cropCode: productionRecord.cropCode,
      ...(level !== "national" && {
        provinceCode: productionRecord.provinceCode,
      }),
      ...(level === "district" && {
        districtCode: productionRecord.districtCode,
      }),
    };

    const surplusDeficitRecord = await SurplusDeficit.findOneAndUpdate(
      upsertFilter,
      {
        year,
        level,
        province: level !== "national" ? (productionRecord.province?._id || productionRecord.province) : undefined,
        provinceCode: level !== "national" ? productionRecord.provinceCode : undefined,
        district: level === "district" ? (productionRecord.district?._id || productionRecord.district) : undefined,
        districtCode: level === "district" ? productionRecord.districtCode : undefined,
        cropType: productionRecord.cropType._id || productionRecord.cropType,
        cropCode: productionRecord.cropCode,
        production: totalProductionValue,
        consumption: totalConsumption,
        balance: analysis.balance,
        status: analysis.status,
        surplusDeficitPercentage: analysis.surplusDeficitPercentage,
        selfSufficiencyRatio: analysis.selfSufficiencyRatio,
        severity: analysis.severity,
        // FIX 1: was hardcoded to (severity === "critical") only.
        // analysis.requiresIntervention is true for BOTH critical AND moderate.
        requiresIntervention: analysis.requiresIntervention,
        priorityLevel: analysis.severity === "critical" ? "high"
          : analysis.severity === "moderate" ? "medium" : "low",
        recommendations,
        calculatedBy: req.user._id,
        calculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Invalidate related cache keys so stale data isn't served
    cache.delete(cache.generateKey("sd_summary", { year, crop: crop.toUpperCase() }));
    cache.delete(cache.generateKey("deficit_regions", { year, crop: crop.toUpperCase(), severity: "all" }));
    cache.delete(cache.generateKey("surplus_regions", { year, crop: crop.toUpperCase() }));

    // ── Alert creation ────────────────────────────────────────────────────────
    // FIX 1 (part 2): alert uses analysis.requiresIntervention which was
    // already correct here — the bug was only in the DB save above.
    if (analysis.requiresIntervention) {
      await Alert.create({
        alertId: `ALERT-${Date.now()}`,
        title: `${analysis.severity.toUpperCase()} Deficit Alert: ${regionName}`,
        message: `${productionRecord.cropType.name} production in ${regionName} shows ${analysis.severity} deficit (${Math.abs(analysis.surplusDeficitPercentage).toFixed(2)}%). Immediate attention required.`,
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
        deliveryChannels: { inApp: true, email: true },
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

// ─── getSurplusDeficitRecords ─────────────────────────────────────────────────
/**
 * @desc    Get all surplus/deficit records with filters
 * @route   GET /api/surplus-deficit
 * @access  Public
 *
 * FIX 2: Removed 3 sequential findOne lookups for crop/province/district.
 *         The schema stores cropCode, provinceCode, districtCode as plain
 *         strings so we query those directly — saves 3 DB round-trips per request.
 */
export const getSurplusDeficitRecords = async (req, res, next) => {
  try {
    const {
      year, crop, province, district,
      status, severity, level,
      page = 1, limit = 50,
    } = req.query;

    const cacheKey = cache.generateKey("sd_records", {
      year, crop, province, district, status, severity, level, page, limit,
    });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.paginated(
        res, cachedData.records, page, limit, cachedData.total,
        "Surplus/deficit records retrieved from cache"
      );
    }

    // FIX 2: query by string codes directly — no extra findOne lookups needed
    const query = {};
    if (year) query.year = year;
    if (crop) query.cropCode = crop.toUpperCase();
    if (province) query.provinceCode = province.toUpperCase();
    if (district) query.districtCode = district.toUpperCase();
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (level) query.level = level;   // caller can now filter by level

    const skip = (parseInt(page) - 1) * parseInt(limit);

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

    cache.set(cacheKey, { records, total });

    return ApiResponse.paginated(
      res, records, page, limit, total,
      "Surplus/deficit records retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ─── getSurplusDeficitSummary ─────────────────────────────────────────────────
/**
 * @desc    Get surplus/deficit summary counts and breakdowns
 * @route   GET /api/surplus-deficit/summary
 * @access  Public
 *
 * FIX 6: Added `level` filter parameter. Without it the aggregate counted the
 *         same geographic area multiple times (once as district, once as
 *         province, once as national), inflating all counts.
 *         Default is "district" — the most granular, non-overlapping level.
 */
export const getSurplusDeficitSummary = async (req, res, next) => {
  try {
    const { year, crop, level = "district" } = req.query;

    const matchStage = { level }; // FIX 6: scope to one level
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();

    const cacheKey = cache.generateKey("sd_summary", { year, crop, level });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Surplus/deficit summary retrieved from cache");
    }

    const [summary, criticalDeficits, moderateDeficits, requiresIntervention] = await Promise.all([
      SurplusDeficit.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalBalance: { $sum: "$balance" },
            avgSelfSufficiency: { $avg: "$selfSufficiencyRatio" },
          },
        },
      ]),
      SurplusDeficit.countDocuments({ ...matchStage, severity: "critical", status: "deficit" }),
      SurplusDeficit.countDocuments({ ...matchStage, severity: "moderate", status: "deficit" }),
      SurplusDeficit.countDocuments({ ...matchStage, requiresIntervention: true }),
    ]);

    const statusSummary = { surplus: 0, deficit: 0, balanced: 0 };
    summary.forEach(item => { statusSummary[item._id] = item.count; });

    const result = {
      statusBreakdown: statusSummary,
      severityBreakdown: { critical: criticalDeficits, moderate: moderateDeficits },
      requiresIntervention,
      filters: { year: year || "all", crop: crop || "all", level },
    };

    cache.set(cacheKey, result);

    return ApiResponse.success(res, result, "Surplus/deficit summary retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// ─── getDeficitRegions ────────────────────────────────────────────────────────
/**
 * @desc    Get deficit regions grouped by severity
 * @route   GET /api/surplus-deficit/deficit-regions
 * @access  Public
 */
export const getDeficitRegions = async (req, res, next) => {
  try {
    const { year, crop, severity = "all", level = "district" } = req.query;

    const cacheKey = cache.generateKey("deficit_regions", { year, crop, severity, level });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Deficit regions retrieved from cache");
    }

    const matchStage = { status: "deficit", level };
    if (year) matchStage.year = year;
    if (crop) matchStage.cropCode = crop.toUpperCase();
    if (severity !== "all") matchStage.severity = severity;

    const deficitRegions = await SurplusDeficit.find(matchStage)
      .populate("province", "name code population")
      .populate("district", "name code population")
      .populate("cropType", "name code")
      .sort({ surplusDeficitPercentage: 1 }) // most negative (worst) first
      .lean();

    const grouped = { critical: [], moderate: [], mild: [] };

    deficitRegions.forEach(region => {
      const entry = {
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
        selfSufficiency: region.selfSufficiencyRatio?.toFixed(2),
        requiresIntervention: region.requiresIntervention,
        recommendations: region.recommendations,
      };
      if (grouped[region.severity]) grouped[region.severity].push(entry);
    });

    const responseData = {
      deficitRegions: grouped,
      totalDeficits: deficitRegions.length,
      criticalCount: grouped.critical.length,
      moderateCount: grouped.moderate.length,
      mildCount: grouped.mild.length,
    };

    cache.set(cacheKey, responseData);

    return ApiResponse.success(res, responseData, "Deficit regions retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// ─── getSurplusRegions ────────────────────────────────────────────────────────
/**
 * @desc    Get surplus regions (potential redistribution sources)
 * @route   GET /api/surplus-deficit/surplus-regions
 * @access  Public
 *
 * FIX 3: availableForRedistribution now uses REDISTRIBUTION_AVAILABILITY (90%)
 *         consistently. Was 80% here vs 90% in getRedistributionSuggestions.
 */
export const getSurplusRegions = async (req, res, next) => {
  try {
    const { year, crop, minSurplus = 10, level = "district" } = req.query;

    const cacheKey = cache.generateKey("surplus_regions", { year, crop, minSurplus, level });
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, "Surplus regions retrieved from cache");
    }

    const matchStage = {
      status: "surplus",
      level,
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

    const formattedRegions = surplusRegions.map(region => ({
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
      // FIX 3: unified to REDISTRIBUTION_AVAILABILITY (0.9) — was 0.8 here
      availableForRedistribution: Math.round(region.balance * REDISTRIBUTION_AVAILABILITY),
    }));

    const responseData = {
      surplusRegions: formattedRegions,
      totalSurplusRegions: surplusRegions.length,
    };

    cache.set(cacheKey, responseData);

    return ApiResponse.success(res, responseData, "Surplus regions retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// ─── getRedistributionSuggestions ─────────────────────────────────────────────
/**
 * @desc    Match deficit regions with nearest surplus sources
 * @route   GET /api/surplus-deficit/redistribution-suggestions
 * @access  Private
 *
 * FIX 4: `level` is now a query parameter (default "district") instead of
 *         being hardcoded to "provincial". District-level suggestions now work.
 * FIX 3: Uses REDISTRIBUTION_AVAILABILITY constant (0.9) consistently.
 */
export const getRedistributionSuggestions = async (req, res, next) => {
  try {
    const { year, crop, level = "district" } = req.query; // FIX 4: was hardcoded "provincial"

    if (!year || !crop) {
      return ApiResponse.error(res, "Year and crop are required", 400);
    }

    const records = await SurplusDeficit.find({
      year,
      cropCode: crop.toUpperCase(),
      level,  // FIX 4: now uses the parameter
    })
      .populate("province", "name code coordinates")
      .populate("district", "name code coordinates")
      .populate("cropType", "name code")
      .lean();

    const deficitRegions = records.filter(r => r.status === "deficit");
    const surplusRegions = records.filter(r => r.status === "surplus");

    const suggestions = deficitRegions.map(deficit => {
      const deficitAmount = Math.abs(deficit.balance);
      const targetCoords = deficit.province?.coordinates || deficit.district?.coordinates;

      const matchingSurplus = surplusRegions
        .filter(surplus => surplus.balance > 0)
        .map(surplus => {
          const sourceCoords = surplus.province?.coordinates || surplus.district?.coordinates;
          const distance = (targetCoords && sourceCoords)
            ? calculateDistance(
              [targetCoords.latitude, targetCoords.longitude],
              [sourceCoords.latitude, sourceCoords.longitude]
            )
            : null;
          return { ...surplus, distance };
        })
        .sort((a, b) => {
          if (a.distance !== null && b.distance !== null && a.distance !== b.distance) {
            return a.distance - b.distance; // closest first
          }
          return b.balance - a.balance; // then largest surplus
        });

      if (matchingSurplus.length === 0) return null;

      return {
        deficitRegion: {
          name: deficit.province?.name || deficit.district?.name,
          code: deficit.provinceCode || deficit.districtCode,
          deficitAmount: Math.round(deficitAmount),
          severity: deficit.severity,
        },
        surplusSources: matchingSurplus.slice(0, 3).map(surplus => ({
          name: surplus.province?.name || surplus.district?.name,
          code: surplus.provinceCode || surplus.districtCode,
          // FIX 3: was surplus.balance * 0.9 inline — now uses the constant
          availableAmount: Math.round(surplus.balance * REDISTRIBUTION_AVAILABILITY),
          distance: surplus.distance != null
            ? parseFloat(surplus.distance.toFixed(1))
            : null,
        })),
        priority: deficit.severity === "critical" ? "high" : "medium",
      };
    }).filter(Boolean); // remove nulls (deficits with no matching surplus)

    // Sort: high priority (critical) first
    suggestions.sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));

    return ApiResponse.success(
      res,
      {
        suggestions,
        summary: {
          totalDeficitRegions: deficitRegions.length,
          totalSurplusRegions: surplusRegions.length,
          matchableDeficits: suggestions.length,
          unmatchableDeficits: deficitRegions.length - suggestions.length,
          level,
        },
      },
      "Redistribution suggestions generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// ─── getSurplusDeficitMetadata ────────────────────────────────────────────────
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
          province: d.provinceCode,
        })),
      },
      "Metadata retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};