import * as reportController from "../../../controllers/report.controller.js";
import CropType from "../../../models/cropType.model.js";
import ProductionData from "../../../models/productionData.model.js";
import Province from "../../../models/province.model.js";
import Report from "../../../models/report.model.js";
import {
  mockCropType,
  mockProductionData,
  mockProvince,
} from "../../helpers/mockData.js";
import {
  createMockNext,
  createMockReq,
  createMockRes,
  createTestUser,
} from "../../helpers/testHelpers.js";

describe("Report Controller", () => {
  let user, province, cropType;

  beforeEach(async () => {
    // Create a unique user for each test
    user = await createTestUser({
      email: `user_${Date.now()}@example.com`,
      role: "government_policy_maker",
    });

    // Ensure unique province and crop type codes to avoid duplicates
    province = await Province.create({
      ...mockProvince,
      code: `PB_${Date.now()}`,
    });
    cropType = await CropType.create({
      ...mockCropType,
      code: `WHEAT_${Date.now()}`,
    });

    await ProductionData.create({
      ...mockProductionData,
      province: province._id,
      cropType: cropType._id,
    });
  });

  // ------------------------- getReports -------------------------
  describe("getReports", () => {
    beforeEach(async () => {
      await Report.create([
        {
          reportId: `RPT-001-${Date.now()}`,
          title: `Production Analysis 2024-${Date.now()}`,
          reportType: "production_analysis",
          format: "pdf",
          status: "completed",
          generatedBy: user._id,
        },
        {
          reportId: `RPT-002-${Date.now()}`,
          title: `Surplus Deficit Report-${Date.now()}`,
          reportType: "surplus_deficit",
          format: "csv",
          status: "completed",
          generatedBy: user._id,
        },
      ]);
    });

    it("should retrieve reports with pagination", async () => {
      const req = createMockReq({ query: { page: 1, limit: 10 }, user });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReports(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });

    it("should filter reports by type", async () => {
      const req = createMockReq({
        query: { reportType: "production_analysis", page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReports(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const reports = res.json.mock.calls[0][0].data;
      expect(reports.every((r) => r.reportType === "production_analysis")).toBe(
        true
      );
    });

    it("should filter reports by status", async () => {
      const req = createMockReq({
        query: { status: "completed", page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReports(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ------------------------- getReportById -------------------------
  describe("getReportById", () => {
    let report;

    beforeEach(async () => {
      report = await Report.create({
        reportId: `RPT-SINGLE-${Date.now()}`,
        title: `Test Report ${Date.now()}`,
        reportType: "production_analysis",
        format: "pdf",
        status: "completed",
        generatedBy: user._id,
      });
    });

    it("should retrieve single report by ID", async () => {
      const req = createMockReq({
        params: { id: report._id.toString() },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReportById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ reportId: report.reportId }),
        })
      );
    });

    it("should return 404 for non-existent report", async () => {
      const req = createMockReq({
        params: { id: "507f1f77bcf86cd799439011" },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReportById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should deny access to other users reports", async () => {
      const otherUser = await createTestUser({
        email: `other_${Date.now()}@example.com`,
        role: "ngo_coordinator",
      });

      const req = createMockReq({
        params: { id: report._id.toString() },
        user: otherUser,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getReportById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ------------------------- generateReport -------------------------
  describe("generateReport", () => {
    it("should generate report with valid parameters", async () => {
      const req = createMockReq({
        body: {
          title: `New Production Report ${Date.now()}`,
          reportType: "production_analysis",
          format: "pdf",
          parameters: { year: ["2024-25"], crops: [cropType.code] },
        },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.generateReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const report = await Report.findOne({ title: req.body.title });
      expect(report).toBeDefined();
      expect(report.status).toBe("generating");
    });

    it("should reject report generation with missing required fields", async () => {
      const req = createMockReq({ body: { title: "Incomplete Report" }, user });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.generateReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ------------------------- generateProductionAnalysisReport -------------------------
  describe("generateProductionAnalysisReport", () => {
    it("should generate production analysis report", async () => {
      const req = createMockReq({
        body: {
          year: "2024-25",
          crops: [cropType.code],
          provinces: [province._id.toString()],
          format: "pdf",
        },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.generateProductionAnalysisReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            report: expect.any(Object),
            data: expect.any(Array),
            summary: expect.objectContaining({
              totalRecords: expect.any(Number),
            }),
          }),
        })
      );
    });

    it("should require year parameter", async () => {
      const req = createMockReq({ body: { crops: [cropType.code] }, user });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.generateProductionAnalysisReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ------------------------- deleteReport -------------------------
  describe("deleteReport", () => {
    let report;

    beforeEach(async () => {
      report = await Report.create({
        reportId: `RPT-DELETE-${Date.now()}`,
        title: `Delete Me ${Date.now()}`,
        reportType: "production_analysis",
        format: "pdf",
        status: "completed",
        generatedBy: user._id,
      });
    });

    it("should delete own report successfully", async () => {
      const req = createMockReq({
        params: { id: report._id.toString() },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.deleteReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const deletedReport = await Report.findById(report._id);
      expect(deletedReport).toBeNull();
    });

    it("should prevent deleting other users reports", async () => {
      const otherUser = await createTestUser({
        email: `other_${Date.now()}@example.com`,
        role: "distributor",
      });
      const req = createMockReq({
        params: { id: report._id.toString() },
        user: otherUser,
      });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.deleteReport(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ------------------------- getScheduledReports -------------------------
  describe("getScheduledReports", () => {
    beforeEach(async () => {
      await Report.create({
        reportId: `RPT-SCHEDULED-${Date.now()}`,
        title: `Weekly Production Report ${Date.now()}`,
        reportType: "production_analysis",
        format: "pdf",
        status: "completed",
        generatedBy: user._id,
        isScheduled: true,
        scheduleFrequency: "weekly",
        nextScheduledRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it("should retrieve scheduled reports", async () => {
      const req = createMockReq({ query: { page: 1, limit: 10 }, user });
      const res = createMockRes();
      const next = createMockNext();

      await reportController.getScheduledReports(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const reports = res.json.mock.calls[0][0].data;
      expect(reports.every((r) => r.isScheduled === true)).toBe(true);
    });
  });
});
