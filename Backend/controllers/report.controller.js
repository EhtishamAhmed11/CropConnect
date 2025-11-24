// backend/controllers/report.controller.js
import Report from "../models/report.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import ApiResponse from "../utils/apiResponse.js";
/**
 * @desc    Get all reports with filters and pagination
 * @route   GET /api/reports
 * @access  Private
 */
export const getReports = async (req, res, next) => {
  try {
    const {
      reportType,
      status,
      generatedBy,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (reportType) query.reportType = reportType;
    if (status) query.status = status;
    if (generatedBy) query.generatedBy = generatedBy;

    // If not admin, only show user's own reports
    if (req.user.role !== "admin") {
      query.generatedBy = req.user._id;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("generatedBy", "username fullName email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      reports,
      page,
      limit,
      total,
      "Reports retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single report by ID
 * @route   GET /api/reports/:id
 * @access  Private
 */
export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate(
      "generatedBy",
      "username fullName email"
    );

    if (!report) {
      return ApiResponse.error(res, "Report not found", 404);
    }

    // Check authorization (users can only view their own reports unless admin)
    if (
      req.user.role !== "admin" &&
      report.generatedBy._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(res, "Not authorized to view this report", 403);
    }

    return ApiResponse.success(res, report, "Report retrieved successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate new report
 * @route   POST /api/reports/generate
 * @access  Private
 */
export const generateReport = async (req, res, next) => {
  try {
    const {
      title,
      description,
      reportType,
      parameters,
      format,
      emailRecipients,
      isScheduled,
      scheduleFrequency,
    } = req.body;

    // Validation
    if (!title || !reportType || !format) {
      return ApiResponse.error(
        res,
        "Title, report type, and format are required",
        400
      );
    }

    // Create report record
    const report = await Report.create({
      reportId: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      reportType,
      parameters: parameters || {},
      format,
      generatedBy: req.user._id,
      emailRecipients: emailRecipients || [],
      isScheduled: isScheduled || false,
      scheduleFrequency: scheduleFrequency || "none",
      status: "pending",
    });

    // TODO: Trigger async report generation process here
    // This would typically be handled by a queue system (Bull, etc.)
    // For now, we'll mark it as generating
    report.status = "generating";
    await report.save();

    // Simulate report generation (replace with actual generation logic)
    setTimeout(async () => {
      try {
        const generatedReport = await Report.findById(report._id);
        if (generatedReport) {
          generatedReport.status = "completed";
          generatedReport.generatedAt = new Date();
          generatedReport.fileName = `${report.reportId}.${format}`;
          generatedReport.fileUrl = `/reports/${report.reportId}.${format}`;
          generatedReport.fileSize = Math.floor(Math.random() * 1000000); // Simulated size
          await generatedReport.save();
        }
      } catch (error) {
        console.error("Error completing report:", error);
      }
    }, 5000);

    return ApiResponse.created(
      res,
      report,
      "Report generation initiated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate production analysis report
 * @route   POST /api/reports/production-analysis
 * @access  Private
 */
export const generateProductionAnalysisReport = async (req, res, next) => {
  try {
    const { year, crops, provinces, format = "pdf" } = req.body;

    if (!year) {
      return ApiResponse.error(res, "Year is required", 400);
    }

    // Build query
    const query = { year };
    if (crops && crops.length > 0) {
      query.cropCode = { $in: crops.map((c) => c.toUpperCase()) };
    }
    if (provinces && provinces.length > 0) {
      query.provinceCode = { $in: provinces.map((p) => p.toUpperCase()) };
    }

    // Fetch data for report
    const productionData = await ProductionData.find(query)
      .populate("province", "name code")
      .populate("district", "name code")
      .populate("cropType", "name code category")
      .lean();

    // Create report record
    const report = await Report.create({
      reportId: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Production Analysis Report - ${year}`,
      description: `Comprehensive production analysis for year ${year}`,
      reportType: "production_analysis",
      parameters: {
        year: [year],
        crops: crops || [],
        provinces: provinces || [],
      },
      format,
      generatedBy: req.user._id,
      status: "completed",
      generatedAt: new Date(),
      fileName: `production-analysis-${year}.${format}`,
      fileUrl: `/reports/production-analysis-${year}.${format}`,
      fileSize: JSON.stringify(productionData).length,
    });

    return ApiResponse.created(
      res,
      {
        report,
        data: productionData,
        summary: {
          totalRecords: productionData.length,
          totalProduction: productionData.reduce(
            (sum, p) => sum + p.production.value,
            0
          ),
          totalArea: productionData.reduce(
            (sum, p) => sum + p.areaCultivated.value,
            0
          ),
        },
      },
      "Production analysis report generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate surplus/deficit report
 * @route   POST /api/reports/surplus-deficit
 * @access  Private
 */
export const generateSurplusDeficitReport = async (req, res, next) => {
  try {
    const { year, crops, format = "pdf" } = req.body;

    if (!year) {
      return ApiResponse.error(res, "Year is required", 400);
    }

    // Build query
    const query = { year };
    if (crops && crops.length > 0) {
      query.cropCode = { $in: crops.map((c) => c.toUpperCase()) };
    }

    // Fetch surplus/deficit data
    const surplusDeficitData = await SurplusDeficit.find(query)
      .populate("province", "name code")
      .populate("district", "name code")
      .populate("cropType", "name code")
      .lean();

    // Create report record
    const report = await Report.create({
      reportId: `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Surplus/Deficit Report - ${year}`,
      description: `Regional surplus and deficit analysis for ${year}`,
      reportType: "surplus_deficit",
      parameters: {
        year: [year],
        crops: crops || [],
      },
      format,
      generatedBy: req.user._id,
      status: "completed",
      generatedAt: new Date(),
      fileName: `surplus-deficit-${year}.${format}`,
      fileUrl: `/reports/surplus-deficit-${year}.${format}`,
      fileSize: JSON.stringify(surplusDeficitData).length,
    });

    // Calculate summary
    const summary = {
      totalRegions: surplusDeficitData.length,
      surplusRegions: surplusDeficitData.filter((r) => r.status === "surplus")
        .length,
      deficitRegions: surplusDeficitData.filter((r) => r.status === "deficit")
        .length,
      criticalDeficits: surplusDeficitData.filter(
        (r) => r.severity === "critical"
      ).length,
    };

    return ApiResponse.created(
      res,
      {
        report,
        data: surplusDeficitData,
        summary,
      },
      "Surplus/deficit report generated successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 * @access  Private
 */
export const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return ApiResponse.error(res, "Report not found", 404);
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      report.generatedBy.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        "Not authorized to delete this report",
        403
      );
    }

    await report.deleteOne();

    return ApiResponse.success(res, null, "Report deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get scheduled reports
 * @route   GET /api/reports/scheduled
 * @access  Private
 */
export const getScheduledReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = {
      isScheduled: true,
      status: { $ne: "failed" },
    };

    // Non-admin users only see their own scheduled reports
    if (req.user.role !== "admin") {
      query.generatedBy = req.user._id;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("generatedBy", "username fullName email")
        .sort({ nextScheduledRun: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Report.countDocuments(query),
    ]);

    return ApiResponse.paginated(
      res,
      reports,
      page,
      limit,
      total,
      "Scheduled reports retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update scheduled report
 * @route   PUT /api/reports/:id/schedule
 * @access  Private
 */
export const updateScheduledReport = async (req, res, next) => {
  try {
    const { scheduleFrequency, emailRecipients } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return ApiResponse.error(res, "Report not found", 404);
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      report.generatedBy.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        "Not authorized to update this report",
        403
      );
    }

    if (scheduleFrequency) {
      report.scheduleFrequency = scheduleFrequency;
      report.isScheduled = scheduleFrequency !== "none";
    }

    if (emailRecipients) {
      report.emailRecipients = emailRecipients;
    }

    await report.save();

    return ApiResponse.success(
      res,
      report,
      "Scheduled report updated successfully"
    );
  } catch (error) {
    next(error);
  }
};
