import * as alertController from "../../../controllers/alert.controller.js";
import Alert from "../../../models/alerts.model.js";
import CropType from "../../../models/cropType.model.js";
import Province from "../../../models/province.model.js";
import { mockCropType, mockProvince } from "../../helpers/mockData.js";
import { createMockNext, createMockReq, createMockRes, createTestUser } from "../../helpers/testHelpers.js";

describe("Alert Controller", () => {
  let user, province, cropType;

  beforeEach(async () => {
    user = await createTestUser({ role: "government_policy_maker" });
    province = await Province.create(mockProvince);
    cropType = await CropType.create(mockCropType);
  });

  describe("getAlerts", () => {
    beforeEach(async () => {
      await Alert.create([
        {
          alertId: "ALERT-001",
          title: "Critical Deficit Alert",
          message: "Severe wheat deficit in Punjab",
          alertType: "deficit_critical",
          severity: "critical",
          status: "active",
          targetRoles: ["all"],
          province: province._id,
          cropType: cropType._id,
        },
        {
          alertId: "ALERT-002",
          title: "Production Drop",
          message: "Rice production decreased",
          alertType: "production_drop",
          severity: "medium",
          status: "active",
          targetRoles: ["government_policy_maker"],
        },
      ]);
    });

    it("should retrieve alerts with pagination", async () => {
      const req = createMockReq({
        query: { page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.getAlerts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
        })
      );
    });

    it("should filter alerts by severity", async () => {
      const req = createMockReq({
        query: { severity: "critical", page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.getAlerts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const alerts = res.json.mock.calls[0][0].data;
      expect(alerts.every((a) => a.severity === "critical")).toBe(true);
    });

    it("should filter alerts by type", async () => {
      const req = createMockReq({
        query: { alertType: "deficit_critical", page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.getAlerts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createAlert", () => {
    it("should create alert with valid data", async () => {
      const adminUser = await createTestUser({
        role: "admin",
        email: "admin@test.com",
      });

      const req = createMockReq({
        body: {
          title: "New Alert",
          message: "Test alert message",
          alertType: "system_health",
          severity: "high",
          targetRoles: ["admin", "government_policy_maker"],
        },
        user: adminUser,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.createAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      const alert = await Alert.findOne({ title: "New Alert" });
      expect(alert).toBeDefined();
    });

    it("should reject alert creation with missing required fields", async () => {
      const adminUser = await createTestUser({
        role: "admin",
        email: "admin@test.com",
      });

      const req = createMockReq({
        body: {
          title: "New Alert",
        },
        user: adminUser,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.createAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("acknowledgeAlert", () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        alertId: "ALERT-ACK-001",
        title: "Test Alert",
        message: "Test message",
        alertType: "system_health",
        severity: "medium",
        status: "active",
        targetRoles: ["all"],
      });
    });

    it("should acknowledge alert successfully", async () => {
      const req = createMockReq({
        params: { id: alert._id.toString() },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.acknowledgeAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const acknowledgedAlert = await Alert.findById(alert._id);
      expect(acknowledgedAlert.status).toBe("acknowledged");
      expect(acknowledgedAlert.acknowledgedBy).toHaveLength(1);
    });

    it("should reject duplicate acknowledgment", async () => {
      await alertController.acknowledgeAlert(
        createMockReq({ params: { id: alert._id.toString() }, user }),
        createMockRes(),
        createMockNext()
      );

      const req = createMockReq({
        params: { id: alert._id.toString() },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.acknowledgeAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("resolveAlert", () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        alertId: "ALERT-RESOLVE-001",
        title: "Test Alert",
        message: "Test message",
        alertType: "system_health",
        severity: "medium",
        status: "acknowledged",
        targetRoles: ["all"],
      });
    });

    it("should resolve alert successfully", async () => {
      const req = createMockReq({
        params: { id: alert._id.toString() },
        body: { resolutionNotes: "Issue fixed" },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.resolveAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const resolvedAlert = await Alert.findById(alert._id);
      expect(resolvedAlert.status).toBe("resolved");
      expect(resolvedAlert.resolutionNotes).toBe("Issue fixed");
    });

    it("should reject resolving already resolved alert", async () => {
      await Alert.findByIdAndUpdate(alert._id, { status: "resolved" });

      const req = createMockReq({
        params: { id: alert._id.toString() },
        body: { resolutionNotes: "Already fixed" },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.resolveAlert(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getUnreadAlertsCount", () => {
    beforeEach(async () => {
      await Alert.create([
        {
          alertId: "ALERT-UNREAD-001",
          title: "Unread Alert 1",
          message: "Test",
          alertType: "system_health",
          severity: "medium",
          status: "active",
          targetRoles: ["government_policy_maker"],
        },
        {
          alertId: "ALERT-UNREAD-002",
          title: "Unread Alert 2",
          message: "Test",
          alertType: "system_health",
          severity: "low",
          status: "active",
          targetRoles: ["all"],
        },
      ]);
    });

    it("should return unread alerts count", async () => {
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.getUnreadAlertsCount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            unreadCount: expect.any(Number),
          }),
        })
      );
    });
  });

  describe("getCriticalAlerts", () => {
    beforeEach(async () => {
      await Alert.create([
        {
          alertId: "ALERT-CRIT-001",
          title: "Critical Alert",
          message: "Critical issue",
          alertType: "deficit_critical",
          severity: "critical",
          status: "active",
          targetRoles: ["all"],
        },
      ]);
    });

    it("should retrieve only critical alerts", async () => {
      const req = createMockReq({
        query: { page: 1, limit: 10 },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await alertController.getCriticalAlerts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const alerts = res.json.mock.calls[0][0].data;
      expect(alerts.every((a) => a.severity === "critical")).toBe(true);
    });
  });
});
