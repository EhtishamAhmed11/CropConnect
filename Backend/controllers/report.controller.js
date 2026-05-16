import Report from "../models/report.model.js";
import ProductionData from "../models/productionData.model.js";
import SurplusDeficit from "../models/surplusDeficit.model.js";
import Weather from "../models/weather.model.js";
import MarketPrice from "../models/marketPrice.model.js";
import ApiResponse from "../utils/apiResponse.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateProductionInsights, generateSurplusDeficitInsights } from "../utils/reportInsights.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, "../public/reports");

// Strip emoji and non-WinAnsi characters for pdf-lib standard fonts
const stripEmoji = (str) => str.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '').replace(/[^\x00-\xFF]/g, '').trim();

// Helper to ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}
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

    // Fetch weather, market, and historical data for enhanced insights
    const [weatherData, marketData, historicalData] = await Promise.all([
      Weather.find({}).populate("district", "name code").lean().catch(() => []),
      MarketPrice.find({}).populate("cropType", "name code").populate("district", "name code").sort({ date: -1 }).limit(200).lean().catch(() => []),
      ProductionData.find({ year: { $ne: year } }).populate("province", "name code").populate("cropType", "name code").lean().catch(() => []),
    ]);

    // Generate insights and chart data
    const { insights, chartData } = generateProductionInsights(productionData, { weatherData, marketData, historicalData });

    // Generate actual file
    const reportFileName = `production-analysis-${year}-${Date.now()}.${format}`;
    const filePath = path.join(REPORTS_DIR, reportFileName);

    // Pre-compute summary KPIs (used in all formats)
    const totalProdVal = productionData.reduce((s, p) => s + (p.production?.value || 0), 0);
    const totalAreaVal = productionData.reduce((s, p) => s + (p.areaCultivated?.value || 0), 0);
    const avgYieldVal = totalAreaVal > 0 ? (totalProdVal / totalAreaVal).toFixed(2) : 0;
    const uniqueProvinces = [...new Set(productionData.map(p => p.province?.name).filter(Boolean))];
    const uniqueDistricts = [...new Set(productionData.map(p => p.district?.name).filter(Boolean))];

    if (format === "pdf") {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let yOffset = height - 50;

      const drawText = (text, size = 12, font = timesRomanFont, color = rgb(0, 0, 0), x = 50) => {
        if (yOffset < 50) {
          page = pdfDoc.addPage();
          yOffset = height - 50;
        }
        const safeText = stripEmoji(String(text));
        if (safeText) page.drawText(safeText, { x, y: yOffset, size, font, color });
        yOffset -= size + 10;
      };

      // ── COVER PAGE ──
      // Background Accent
      page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: rgb(0.05, 0.15, 0.4) });
      
      yOffset = height - 80;
      drawText("CROP CONNECT", 14, timesRomanBoldFont, rgb(1, 1, 1), 50);
      drawText("Agricultural Intelligence & Analytics", 10, timesRomanFont, rgb(0.8, 0.8, 1), 50);
      
      yOffset = height - 250;
      drawText("PRODUCTION ANALYSIS REPORT", 32, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
      drawText(`Strategic Assessment for Year ${year}`, 16, timesRomanFont, rgb(0.3, 0.3, 0.3));
      
      yOffset -= 40;
      page.drawRectangle({ x: 50, y: yOffset, width: width - 100, height: 1.5, color: rgb(0.06, 0.52, 0.35) });
      yOffset -= 40;
      
      drawText(`Report ID: RPT-PROD-${year}-${Date.now().toString().slice(-4)}`, 11, timesRomanFont, rgb(0.4, 0.4, 0.4));
      drawText(`Generation Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 11);
      drawText(`Analysis Scope: ${uniqueProvinces.length} Provinces, ${uniqueDistricts.length} Districts`, 11);
      
      yOffset = 150;
      drawText("Confidential Policy Document", 10, timesRomanBoldFont, rgb(0.6, 0.1, 0.1));
      drawText("This report contains critical agricultural data intended for government policy-making and strategic planning.", 9, timesRomanFont, rgb(0.4, 0.4, 0.4));

      // ── PAGE 2: MAIN FINDINGS & EXECUTIVE SUMMARY ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("1. EXECUTIVE SUMMARY & MAIN FINDINGS", 20, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.06, 0.52, 0.35) });
      yOffset -= 30;

      // KPI Grid
      const kpis = [
        { label: "Aggregate Production", value: `${Math.round(totalProdVal).toLocaleString()} tonnes` },
        { label: "Total Cultivated Area", value: `${Math.round(totalAreaVal).toLocaleString()} hectares` },
        { label: "National Average Yield", value: `${avgYieldVal} tonnes / hectare` },
        { label: "Geographic Coverage", value: `${uniqueProvinces.length} Regions` },
        { label: "Data Granularity", value: `${uniqueDistricts.length} District records` },
        { label: "Crop Diversification", value: `${[...new Set(productionData.map(p => p.cropType?.name).filter(Boolean))].length} Active Crops` },
      ];

      kpis.forEach((kpi, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = 50 + col * ((width - 110) / 2 + 10);
        const by = yOffset - row * 50;
        page.drawRectangle({ x: bx, y: by - 5, width: (width - 120) / 2, height: 40, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 0.5 });
        page.drawText(kpi.label, { x: bx + 10, y: by + 22, size: 8, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
        page.drawText(kpi.value, { x: bx + 10, y: by + 8, size: 12, font: timesRomanBoldFont, color: rgb(0.05, 0.15, 0.4) });
      });
      yOffset -= 160;

      // Top Insights section (The "Main Findings" part)
      if (insights.length > 0) {
        drawText("Key Findings & Strategic Takeaways", 14, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
        yOffset -= 5;
        
        const topInsights = insights.slice(0, 3); // Top 3 main findings
        topInsights.forEach((insight, idx) => {
          if (yOffset < 100) { page = pdfDoc.addPage(); yOffset = height - 50; }
          
          // Insight box
          const boxHeight = 60;
          page.drawRectangle({ x: 50, y: yOffset - boxHeight + 10, width: width - 100, height: boxHeight, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5 });
          
          page.drawText(`${idx + 1}. ${stripEmoji(insight.title)}`, { x: 60, y: yOffset - 15, size: 11, font: timesRomanBoldFont, color: rgb(0.1, 0.1, 0.1) });
          
          const words = stripEmoji(insight.text).split(" ");
          let line = "";
          let lineY = yOffset - 30;
          words.forEach((word) => {
            if ((line + word).length > 90) {
              page.drawText(line.trim(), { x: 60, y: lineY, size: 9, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3) });
              line = word + " ";
              lineY -= 12;
            } else {
              line += word + " ";
            }
          });
          if (line.trim()) page.drawText(line.trim(), { x: 60, y: lineY, size: 9, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3) });
          
          yOffset -= (boxHeight + 10);
        });
      }

      // ── PAGE 3: DATA VISUALIZATIONS & TRENDS ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("2. GEOGRAPHIC & CROP DISTRIBUTIONS", 18, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.06, 0.52, 0.35) });
      yOffset -= 20;

      if (chartData.productionByProvince?.length > 0) {
        drawText("Production Contribution by Province (tonnes)", 13, timesRomanBoldFont, rgb(0.1, 0.1, 0.1));
        yOffset -= 5;
        const chartBars = chartData.productionByProvince.slice(0, 10);
        const maxVal = Math.max(...chartBars.map(b => b.production));
        
        chartBars.forEach((bar) => {
          if (yOffset < 60) { page = pdfDoc.addPage(); yOffset = height - 50; }
          const barW = maxVal > 0 ? (bar.production / maxVal) * (width - 250) : 0;
          page.drawText(bar.name, { x: 60, y: yOffset + 3, size: 9, font: timesRomanFont });
          page.drawRectangle({ x: 180, y: yOffset, width: barW, height: 14, color: rgb(0.1, 0.45, 0.3) });
          page.drawText(bar.production.toLocaleString(), { x: 185 + barW, y: yOffset + 3, size: 8, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
          yOffset -= 20;
        });
        yOffset -= 15;
      }

      if (chartData.yieldComparison?.length > 0) {
        drawText("Yield Efficiency Comparison (t/ha)", 13, timesRomanBoldFont, rgb(0.1, 0.1, 0.1));
        yOffset -= 5;
        const yieldBars = chartData.yieldComparison.slice(0, 10);
        const maxYield = Math.max(...yieldBars.map(b => b.yield));
        
        yieldBars.forEach((bar) => {
          if (yOffset < 60) { page = pdfDoc.addPage(); yOffset = height - 50; }
          const barW = maxYield > 0 ? (bar.yield / maxYield) * (width - 250) : 0;
          page.drawText(bar.name, { x: 60, y: yOffset + 3, size: 9, font: timesRomanFont });
          page.drawRectangle({ x: 180, y: yOffset, width: barW, height: 14, color: rgb(0.2, 0.4, 0.7) });
          page.drawText(bar.yield.toString(), { x: 185 + barW, y: yOffset + 3, size: 8, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
          yOffset -= 20;
        });
      }

      // ── PAGE 4: DECISION SUPPORT INSIGHTS ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("3. DECISION SUPPORT & ACTIONABLE INSIGHTS", 18, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.06, 0.52, 0.35) });
      yOffset -= 20;

      insights.forEach((insight) => {
        if (yOffset < 120) { page = pdfDoc.addPage(); yOffset = height - 50; }
        
        // Severity based indicator
        const accentColor = insight.type === 'danger' ? rgb(0.8, 0.1, 0.1) : (insight.type === 'warning' ? rgb(0.9, 0.6, 0.1) : rgb(0.1, 0.5, 0.3));
        page.drawRectangle({ x: 50, y: yOffset - 5, width: 3, height: 35, color: accentColor });
        
        drawText(`[${insight.type.toUpperCase()}] ${insight.title}`, 12, timesRomanBoldFont, rgb(0.1, 0.1, 0.1), 60);
        yOffset += 5; // Adjustment because drawText moves yOffset
        
        const words = stripEmoji(insight.text).split(" ");
        let line = "";
        words.forEach((word) => {
          if ((line + word).length > 85) {
            drawText(line.trim(), 10, timesRomanFont, rgb(0.3, 0.3, 0.3), 60);
            line = word + " ";
          } else {
            line += word + " ";
          }
        });
        if (line.trim()) drawText(line.trim(), 10, timesRomanFont, rgb(0.3, 0.3, 0.3), 60);
        yOffset -= 15;
      });

      // ── PAGE 5: DETAILED TABULAR DATA ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("4. DETAILED PRODUCTION LOGS", 18, timesRomanBoldFont, rgb(0.05, 0.15, 0.4));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.06, 0.52, 0.35) });
      yOffset -= 20;

      // Table Header
      page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: rgb(0.05, 0.15, 0.4) });
      page.drawText("Region", { x: 55, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Crop", { x: 200, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Production (t)", { x: 320, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Area (ha)", { x: 420, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Yield", { x: 500, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      yOffset -= 25;

      productionData.forEach((item, index) => {
        if (yOffset < 50) { 
          page = pdfDoc.addPage(); yOffset = height - 50; 
          // Re-draw header on new page
          page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: rgb(0.05, 0.15, 0.4) });
          yOffset -= 25;
        }

        if (index % 2 === 0) page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: rgb(0.96, 0.97, 1) });
        
        page.drawText(`${item.district?.name || '?'}, ${item.province?.name?.slice(0, 3) || '?'}`, { x: 55, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.cropType?.name || '?', { x: 200, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.production.value?.toLocaleString() || '0', { x: 320, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.areaCultivated.value?.toLocaleString() || '0', { x: 420, y: yOffset + 2, size: 8, font: timesRomanFont });
        const yld = item.areaCultivated.value > 0 ? (item.production.value / item.areaCultivated.value).toFixed(2) : '0';
        page.drawText(yld, { x: 500, y: yOffset + 2, size: 8, font: timesRomanFont });
        
        yOffset -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);
    } else if (format === "excel") {
      const workbook = new ExcelJS.Workbook();

      // ── Sheet 1: Executive Summary ──
      const summarySheet = workbook.addWorksheet("Executive Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 30 },
      ];
      summarySheet.getRow(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
      summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D3B66" } };
      summarySheet.addRow({ metric: "Report Title", value: `Production Analysis Report - ${year}` });
      summarySheet.addRow({ metric: "Generated", value: new Date().toLocaleString() });
      summarySheet.addRow({ metric: "Total Records", value: productionData.length });
      summarySheet.addRow({ metric: "Total Production (tonnes)", value: Math.round(totalProdVal) });
      summarySheet.addRow({ metric: "Total Area (hectares)", value: Math.round(totalAreaVal) });
      summarySheet.addRow({ metric: "Average Yield (t/ha)", value: avgYieldVal });
      summarySheet.addRow({ metric: "Provinces Covered", value: uniqueProvinces.length });
      summarySheet.addRow({ metric: "Districts Covered", value: uniqueDistricts.length });

      // ── Sheet 2: Production Data (styled) ──
      const sheet = workbook.addWorksheet("Production Data");
      sheet.columns = [
        { header: "#", key: "index", width: 6 },
        { header: "Province", key: "province", width: 20 },
        { header: "District", key: "district", width: 20 },
        { header: "Crop", key: "crop", width: 20 },
        { header: "Production (tonnes)", key: "production", width: 20 },
        { header: "Area (hectares)", key: "area", width: 18 },
        { header: "Yield (t/ha)", key: "yield", width: 14 },
      ];
      sheet.getRow(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };

      productionData.forEach((item, idx) => {
        const row = sheet.addRow({
          index: idx + 1,
          province: item.province?.name,
          district: item.district?.name,
          crop: item.cropType?.name,
          production: item.production.value,
          area: item.areaCultivated.value,
          yield: item.yield?.value || (item.areaCultivated.value > 0 ? +(item.production.value / item.areaCultivated.value).toFixed(2) : 0),
        });
        // Alternate row shading
        if (idx % 2 === 0) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
        }
      });

      // ── Sheet 3: Production by Province (chart data) ──
      if (chartData.productionByProvince?.length > 0) {
        const provSheet = workbook.addWorksheet("By Province");
        provSheet.columns = [
          { header: "Province", key: "name", width: 25 },
          { header: "Production (tonnes)", key: "production", width: 22 },
          { header: "Area (hectares)", key: "area", width: 20 },
        ];
        provSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        provSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
        chartData.productionByProvince.forEach(p => provSheet.addRow(p));
      }

      // ── Sheet 4: Yield Comparison (chart data) ──
      if (chartData.yieldComparison?.length > 0) {
        const yieldSheet = workbook.addWorksheet("Yield Comparison");
        yieldSheet.columns = [
          { header: "Crop", key: "name", width: 25 },
          { header: "Yield (t/ha)", key: "yield", width: 18 },
        ];
        yieldSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        yieldSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8B5CF6" } };
        chartData.yieldComparison.forEach(c => yieldSheet.addRow(c));
      }

      // ── Sheet 5: Insights & Recommendations ──
      if (insights.length > 0) {
        const insightsSheet = workbook.addWorksheet("Insights & Recommendations");
        insightsSheet.columns = [
          { header: "Type", key: "type", width: 14 },
          { header: "Title", key: "title", width: 35 },
          { header: "Recommendation", key: "text", width: 90 },
        ];
        insightsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        insightsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
        insights.forEach(i => {
          const row = insightsSheet.addRow({ type: i.type, title: stripEmoji(i.title), text: stripEmoji(i.text) });
          const typeColors = { highlight: "FFD1FAE5", warning: "FFFEF3C7", danger: "FFFEE2E2", info: "FFDBEAFE", action: "FFEDE9FE" };
          row.getCell("type").fill = { type: "pattern", pattern: "solid", fgColor: { argb: typeColors[i.type] || "FFF1F5F9" } };
        });
      }

      await workbook.xlsx.writeFile(filePath);
    } else {
      // CSV with full summary + insights + data
      let content = "";
      // Summary section
      content += "# ═══════════════════════════════════════════\n";
      content += "# PRODUCTION ANALYSIS REPORT\n";
      content += `# Generated: ${new Date().toLocaleString()}\n`;
      content += "# ═══════════════════════════════════════════\n";
      content += "#\n";
      content += `# Total Records: ${productionData.length}\n`;
      content += `# Total Production: ${Math.round(totalProdVal).toLocaleString()} tonnes\n`;
      content += `# Total Area: ${Math.round(totalAreaVal).toLocaleString()} hectares\n`;
      content += `# Average Yield: ${avgYieldVal} t/ha\n`;
      content += `# Provinces: ${uniqueProvinces.length} | Districts: ${uniqueDistricts.length}\n`;
      content += "#\n";
      // Insights section
      if (insights.length > 0) {
        content += "# ─── DECISION SUPPORT INSIGHTS ───\n";
        insights.forEach(i => { content += `# [${i.type.toUpperCase()}] ${stripEmoji(i.title)}: ${stripEmoji(i.text)}\n`; });
        content += "#\n";
      }
      // Chart data: Production by Province
      if (chartData.productionByProvince?.length > 0) {
        content += "# ─── PRODUCTION BY PROVINCE ───\n";
        chartData.productionByProvince.forEach(p => { content += `# ${p.name}: ${p.production.toLocaleString()} tonnes\n`; });
        content += "#\n";
      }
      content += "Province,District,Crop,Production,Unit,Area,Yield\n";
      content += productionData.map(item => {
        const yieldVal = item.areaCultivated.value > 0 ? (item.production.value / item.areaCultivated.value).toFixed(2) : 0;
        return `${item.province?.name},${item.district?.name},${item.cropType?.name},${item.production.value},${item.production.unit},${item.areaCultivated.value},${yieldVal}`;
      }).join("\n");
      fs.writeFileSync(filePath, content);
    }

    // Calculate summary
    const prodSummary = {
      totalRecords: productionData.length,
      totalProduction: productionData.reduce((sum, p) => sum + p.production.value, 0),
      totalArea: productionData.reduce((sum, p) => sum + p.areaCultivated.value, 0),
    };

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
      fileName: reportFileName,
      fileUrl: `/reports/${reportFileName}`,
      fileSize: fs.statSync(filePath).size,
      insights,
      chartData,
      summary: prodSummary,
    });

    return ApiResponse.created(
      res,
      {
        report,
        data: productionData,
        summary: prodSummary,
        insights,
        chartData,
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

    // Fetch weather, market, and historical data for enhanced insights
    const [weatherData, marketData, historicalData] = await Promise.all([
      Weather.find({}).populate("district", "name code").lean().catch(() => []),
      MarketPrice.find({}).populate("cropType", "name code").populate("district", "name code").sort({ date: -1 }).limit(200).lean().catch(() => []),
      SurplusDeficit.find({ year: { $ne: year } }).populate("province", "name code").populate("district", "name code").populate("cropType", "name code").lean().catch(() => []),
    ]);

    // Generate insights and chart data
    const { insights, chartData } = generateSurplusDeficitInsights(surplusDeficitData, { weatherData, marketData, historicalData });

    // Generate actual file
    const reportFileName = `surplus-deficit-${year}-${Date.now()}.${format}`;
    const filePath = path.join(REPORTS_DIR, reportFileName);

    if (format === "pdf") {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let yOffset = height - 50;

      const drawText = (text, size = 12, font = timesRomanFont, color = rgb(0, 0, 0), x = 50) => {
        if (yOffset < 50) {
          page = pdfDoc.addPage();
          yOffset = height - 50;
        }
        const safeText = stripEmoji(String(text));
        if (safeText) page.drawText(safeText, { x, y: yOffset, size, font, color });
        yOffset -= size + 10;
      };

      // ── COVER PAGE ──
      page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: rgb(0.5, 0.1, 0.1) });
      
      yOffset = height - 80;
      drawText("CROP CONNECT", 14, timesRomanBoldFont, rgb(1, 1, 1), 50);
      drawText("Food Security & Logistics Management", 10, timesRomanFont, rgb(1, 0.8, 0.8), 50);
      
      yOffset = height - 250;
      drawText("SURPLUS / DEFICIT ANALYSIS", 32, timesRomanBoldFont, rgb(0.4, 0.05, 0.05));
      drawText(`Strategic Food Balance Report - ${year}`, 16, timesRomanFont, rgb(0.3, 0.3, 0.3));
      
      yOffset -= 40;
      page.drawRectangle({ x: 50, y: yOffset, width: width - 100, height: 1.5, color: rgb(0.8, 0.2, 0.2) });
      yOffset -= 40;
      
      drawText(`Report ID: RPT-BAL-${year}-${Date.now().toString().slice(-4)}`, 11, timesRomanFont, rgb(0.4, 0.4, 0.4));
      drawText(`Generation Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 11);
      
      const netBalanceVal = surplusDeficitData.reduce((s, r) => s + (r.balance || 0), 0);
      drawText(`Status: ${netBalanceVal >= 0 ? "Aggregate Surplus" : "Aggregate Deficit"}`, 11, timesRomanBoldFont, netBalanceVal >= 0 ? rgb(0.1, 0.5, 0.2) : rgb(0.8, 0.1, 0.1));

      // ── PAGE 2: EXECUTIVE BALANCE SUMMARY ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("1. EXECUTIVE BALANCE SUMMARY", 20, timesRomanBoldFont, rgb(0.4, 0.05, 0.05));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.8, 0.2, 0.2) });
      yOffset -= 30;

      const surplusCount = surplusDeficitData.filter(r => r.status === "surplus").length;
      const deficitCount = surplusDeficitData.filter(r => r.status === "deficit").length;
      const criticalCount = surplusDeficitData.filter(r => r.severity === "critical").length;

      const kpis = [
        { label: "Net National Balance", value: `${Math.round(netBalanceVal).toLocaleString()} t` },
        { label: "Surplus Districts", value: `${surplusCount}` },
        { label: "Deficit Districts", value: `${deficitCount}` },
        { label: "CRITICAL ZONES", value: `${criticalCount}` },
      ];

      kpis.forEach((kpi, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const bx = 50 + col * ((width - 110) / 2 + 10);
        const by = yOffset - row * 50;
        const isCritical = kpi.label === "CRITICAL ZONES" && criticalCount > 0;
        page.drawRectangle({ 
          x: bx, y: by - 5, width: (width - 120) / 2, height: 40, 
          color: isCritical ? rgb(1, 0.95, 0.95) : rgb(0.98, 0.98, 0.98), 
          borderColor: isCritical ? rgb(0.8, 0.1, 0.1) : rgb(0.9, 0.9, 0.9), 
          borderWidth: isCritical ? 1 : 0.5 
        });
        page.drawText(kpi.label, { x: bx + 10, y: by + 22, size: 8, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
        page.drawText(kpi.value, { x: bx + 10, y: by + 8, size: 12, font: timesRomanBoldFont, color: isCritical ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.1, 0.1) });
      });
      yOffset -= 120;

      if (insights.length > 0) {
        drawText("Primary Findings & Strategic Risks", 14, timesRomanBoldFont, rgb(0.4, 0.05, 0.05));
        yOffset -= 5;
        insights.slice(0, 3).forEach((insight, idx) => {
          if (yOffset < 100) { page = pdfDoc.addPage(); yOffset = height - 50; }
          const boxHeight = 55;
          page.drawRectangle({ x: 50, y: yOffset - boxHeight + 10, width: width - 100, height: boxHeight, color: rgb(1, 1, 1), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5 });
          page.drawText(`${idx + 1}. ${stripEmoji(insight.title)}`, { x: 60, y: yOffset - 15, size: 11, font: timesRomanBoldFont });
          
          const words = stripEmoji(insight.text).split(" ");
          let line = "";
          let lineY = yOffset - 28;
          words.forEach((word) => {
            if ((line + word).length > 90) {
              page.drawText(line.trim(), { x: 60, y: lineY, size: 9, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3) });
              line = word + " "; lineY -= 11;
            } else { line += word + " "; }
          });
          if (line.trim()) page.drawText(line.trim(), { x: 60, y: lineY, size: 9, font: timesRomanFont, color: rgb(0.3, 0.3, 0.3) });
          yOffset -= (boxHeight + 8);
        });
      }

      // ── PAGE 3: REGIONAL ANALYSIS CHARTS ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("2. REGIONAL BALANCE VISUALIZATION", 18, timesRomanBoldFont, rgb(0.4, 0.05, 0.05));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.8, 0.2, 0.2) });
      yOffset -= 20;

      if (chartData.balanceByProvince?.length > 0) {
        drawText("Net Balance by Province (tonnes)", 13, timesRomanBoldFont);
        yOffset -= 5;
        const provBars = chartData.balanceByProvince.slice(0, 10);
        const maxVal = Math.max(...provBars.map(b => Math.max(b.surplus, b.deficit)));
        
        provBars.forEach((bar) => {
          if (yOffset < 60) { page = pdfDoc.addPage(); yOffset = height - 50; }
          const net = bar.surplus - bar.deficit;
          const barW = maxVal > 0 ? (Math.abs(net) / maxVal) * (width - 250) : 0;
          page.drawText(bar.name, { x: 60, y: yOffset + 3, size: 9, font: timesRomanFont });
          page.drawRectangle({ x: 180, y: yOffset, width: barW, height: 14, color: net >= 0 ? rgb(0.1, 0.5, 0.2) : rgb(0.8, 0.2, 0.2) });
          page.drawText(`${net.toLocaleString()} t`, { x: 185 + barW, y: yOffset + 3, size: 8, font: timesRomanFont, color: rgb(0.4, 0.4, 0.4) });
          yOffset -= 20;
        });
      }

      // ── PAGE 4: DETAILED BALANCE DATA ──
      page = pdfDoc.addPage(); yOffset = height - 50;
      drawText("3. DISTRICT-LEVEL BALANCE LOGS", 18, timesRomanBoldFont, rgb(0.4, 0.05, 0.05));
      page.drawRectangle({ x: 50, y: yOffset + 5, width: width - 100, height: 2, color: rgb(0.8, 0.2, 0.2) });
      yOffset -= 20;

      // Table Header
      page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: rgb(0.2, 0.2, 0.2) });
      page.drawText("Region (Crop)", { x: 55, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Status", { x: 200, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Production", { x: 280, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Consumption", { x: 380, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      page.drawText("Balance", { x: 480, y: yOffset + 2, size: 9, font: timesRomanBoldFont, color: rgb(1, 1, 1) });
      yOffset -= 25;

      surplusDeficitData.forEach((item, index) => {
        if (yOffset < 50) { 
          page = pdfDoc.addPage(); yOffset = height - 50; 
          page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: rgb(0.2, 0.2, 0.2) });
          yOffset -= 25;
        }

        const isDeficit = item.status === 'deficit';
        if (index % 2 === 0) page.drawRectangle({ x: 50, y: yOffset - 5, width: width - 100, height: 20, color: isDeficit ? rgb(1, 0.96, 0.96) : rgb(0.96, 1, 0.96) });
        
        page.drawText(`${item.district?.name || '?'}, ${item.province?.name?.slice(0, 3) || '?'} (${item.cropType?.name?.slice(0, 5)})`, { x: 55, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.status.toUpperCase(), { x: 200, y: yOffset + 2, size: 8, font: timesRomanBoldFont, color: isDeficit ? rgb(0.7, 0, 0) : rgb(0, 0.5, 0) });
        page.drawText(item.production?.toLocaleString() || '0', { x: 280, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.consumption?.toLocaleString() || '0', { x: 380, y: yOffset + 2, size: 8, font: timesRomanFont });
        page.drawText(item.balance?.toLocaleString() || '0', { x: 480, y: yOffset + 2, size: 8, font: timesRomanBoldFont });
        
        yOffset -= 20;
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);
    } else if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const surplusCount = surplusDeficitData.filter(r => r.status === "surplus").length;
      const deficitCount = surplusDeficitData.filter(r => r.status === "deficit").length;
      const criticalCount = surplusDeficitData.filter(r => r.severity === "critical").length;
      const totalSurplusVal = surplusDeficitData.filter(r => r.status === "surplus").reduce((s, r) => s + (r.balance || 0), 0);

      // ── Sheet 1: Executive Summary ──
      const summarySheet = workbook.addWorksheet("Executive Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 30 },
      ];
      summarySheet.getRow(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
      summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D3B66" } };
      summarySheet.addRow({ metric: "Report Title", value: `Surplus/Deficit Report - ${year}` });
      summarySheet.addRow({ metric: "Generated", value: new Date().toLocaleString() });
      summarySheet.addRow({ metric: "Total Regions", value: surplusDeficitData.length });
      summarySheet.addRow({ metric: "Surplus Regions", value: surplusCount });
      summarySheet.addRow({ metric: "Deficit Regions", value: deficitCount });
      summarySheet.addRow({ metric: "Critical Deficit Zones", value: criticalCount });
      summarySheet.addRow({ metric: "Total Surplus (tonnes)", value: Math.round(totalSurplusVal) });

      // ── Sheet 2: Data (styled with color-coded rows) ──
      const sheet = workbook.addWorksheet("Surplus Deficit Data");
      sheet.columns = [
        { header: "#", key: "index", width: 6 },
        { header: "Province", key: "province", width: 20 },
        { header: "District", key: "district", width: 20 },
        { header: "Crop", key: "crop", width: 20 },
        { header: "Status", key: "status", width: 12 },
        { header: "Severity", key: "severity", width: 12 },
        { header: "Production (t)", key: "production", width: 16 },
        { header: "Consumption (t)", key: "consumption", width: 16 },
        { header: "Balance (t)", key: "balance", width: 16 },
        { header: "Self-Sufficiency %", key: "ratio", width: 18 },
      ];
      sheet.getRow(1).font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

      surplusDeficitData.forEach((item, idx) => {
        const row = sheet.addRow({
          index: idx + 1,
          province: item.province?.name,
          district: item.district?.name,
          crop: item.cropType?.name,
          status: item.status?.toUpperCase(),
          severity: item.severity || "none",
          production: item.production,
          consumption: item.consumption,
          balance: item.balance,
          ratio: item.selfSufficiencyRatio || 0,
        });
        // Color-coded rows: green for surplus, red for deficit
        const fillColor = item.status === "surplus" ? "FFD1FAE5" : "FFFEE2E2";
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
        // Bold the status cell
        row.getCell("status").font = { bold: true, color: { argb: item.status === "surplus" ? "FF059669" : "FFDC2626" } };
      });

      // ── Sheet 3: Balance by Province (chart data) ──
      if (chartData.balanceByProvince?.length > 0) {
        const provSheet = workbook.addWorksheet("By Province");
        provSheet.columns = [
          { header: "Province", key: "name", width: 25 },
          { header: "Surplus (tonnes)", key: "surplus", width: 20 },
          { header: "Deficit (tonnes)", key: "deficit", width: 20 },
        ];
        provSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        provSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
        chartData.balanceByProvince.forEach(p => provSheet.addRow(p));
      }

      // ── Sheet 4: Top Deficit Zones (chart data) ──
      if (chartData.topDeficits?.length > 0) {
        const defSheet = workbook.addWorksheet("Top Deficit Zones");
        defSheet.columns = [
          { header: "District", key: "name", width: 25 },
          { header: "Crop", key: "crop", width: 20 },
          { header: "Deficit (tonnes)", key: "deficit", width: 20 },
        ];
        defSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        defSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEF4444" } };
        chartData.topDeficits.forEach(d => defSheet.addRow(d));
      }

      // ── Sheet 5: Insights & Recommendations ──
      if (insights.length > 0) {
        const insightsSheet = workbook.addWorksheet("Insights & Recommendations");
        insightsSheet.columns = [
          { header: "Type", key: "type", width: 14 },
          { header: "Title", key: "title", width: 35 },
          { header: "Recommendation", key: "text", width: 90 },
        ];
        insightsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        insightsSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
        insights.forEach(i => {
          const row = insightsSheet.addRow({ type: i.type, title: stripEmoji(i.title), text: stripEmoji(i.text) });
          const typeColors = { highlight: "FFD1FAE5", warning: "FFFEF3C7", danger: "FFFEE2E2", info: "FFDBEAFE", action: "FFEDE9FE" };
          row.getCell("type").fill = { type: "pattern", pattern: "solid", fgColor: { argb: typeColors[i.type] || "FFF1F5F9" } };
        });
      }

      await workbook.xlsx.writeFile(filePath);
    } else {
      // CSV with full summary + insights + data
      const surplusCount = surplusDeficitData.filter(r => r.status === "surplus").length;
      const deficitCount = surplusDeficitData.filter(r => r.status === "deficit").length;
      const criticalCount = surplusDeficitData.filter(r => r.severity === "critical").length;

      let content = "";
      content += "# ═══════════════════════════════════════════\n";
      content += "# SURPLUS / DEFICIT ANALYSIS REPORT\n";
      content += `# Generated: ${new Date().toLocaleString()}\n`;
      content += "# ═══════════════════════════════════════════\n";
      content += "#\n";
      content += `# Total Regions: ${surplusDeficitData.length}\n`;
      content += `# Surplus Regions: ${surplusCount}\n`;
      content += `# Deficit Regions: ${deficitCount}\n`;
      content += `# Critical Deficit Zones: ${criticalCount}\n`;
      content += "#\n";
      if (insights.length > 0) {
        content += "# ─── DECISION SUPPORT INSIGHTS ───\n";
        insights.forEach(i => { content += `# [${i.type.toUpperCase()}] ${stripEmoji(i.title)}: ${stripEmoji(i.text)}\n`; });
        content += "#\n";
      }
      if (chartData.balanceByProvince?.length > 0) {
        content += "# ─── BALANCE BY PROVINCE ───\n";
        chartData.balanceByProvince.forEach(p => { content += `# ${p.name}: Surplus ${p.surplus.toLocaleString()}t | Deficit ${p.deficit.toLocaleString()}t\n`; });
        content += "#\n";
      }
      content += "Province,District,Crop,Status,Severity,Production,Consumption,Balance,SelfSufficiency%\n";
      content += surplusDeficitData.map(item =>
        `${item.province?.name},${item.district?.name},${item.cropType?.name},${item.status},${item.severity || "none"},${item.production},${item.consumption},${item.balance},${item.selfSufficiencyRatio || 0}`
      ).join("\n");
      fs.writeFileSync(filePath, content);
    }

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
      fileName: reportFileName,
      fileUrl: `/reports/${reportFileName}`,
      fileSize: fs.statSync(filePath).size,
      insights,
      chartData,
      summary: {
        totalRegions: surplusDeficitData.length,
        surplusRegions: surplusDeficitData.filter((r) => r.status === "surplus").length,
        deficitRegions: surplusDeficitData.filter((r) => r.status === "deficit").length,
        criticalDeficits: surplusDeficitData.filter((r) => r.severity === "critical").length,
      },
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
        insights,
        chartData,
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

/**
 * @desc    Download report file
 * @route   GET /api/reports/:id/download
 * @access  Private
 */
export const downloadReport = async (req, res, next) => {
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
      return ApiResponse.error(res, "Not authorized to download this report", 403);
    }

    if (report.status !== "completed") {
      return ApiResponse.error(res, "Report is not ready for download", 400);
    }

    const filePath = path.join(REPORTS_DIR, report.fileName);

    if (!fs.existsSync(filePath)) {
      return ApiResponse.error(res, "Report file not found on server", 404);
    }

    res.download(filePath, report.fileName);
  } catch (error) {
    next(error);
  }
};
