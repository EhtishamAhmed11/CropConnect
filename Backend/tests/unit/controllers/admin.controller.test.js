import * as adminController from "../../../controllers/admin.controller.js";
import User from "../../../models/user.model.js";
import Province from "../../../models/province.model.js";
import CropType from "../../../models/cropType.model.js";
import ProductionData from "../../../models/productionData.model.js";
import Alert from "../../../models/alerts.model.js";
import {
  createMockReq,
  createMockRes,
  createMockNext,
  createTestUser,
} from "../../helpers/testHelpers.js";
import {
  mockCropType,
  mockProductionData,
  mockProvince,
} from "../../helpers/mockData.js";
import mongoose from "mongoose";

describe("Admin Controller", () => {
  let adminUser;

  // Clean DB before each test
  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    adminUser = await createTestUser({
      role: "admin",
      email: `admin_${Date.now()}@cropconnect.pk`,
    });
  });

  describe("getAllUsers", () => {
    beforeEach(async () => {
      await createTestUser({
        email: `user1_${Date.now()}@example.com`,
        role: "government_policy_maker",
      });
      await createTestUser({
        email: `user2_${Date.now()}@example.com`,
        role: "ngo_coordinator",
      });
      await createTestUser({
        email: `user3_${Date.now()}@example.com`,
        role: "distributor",
      });
    });

    it("should retrieve all users with pagination", async () => {
      const req = createMockReq({
        query: { page: 1, limit: 10 },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getAllUsers(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({ page: 1, limit: 10 }),
        })
      );
    });

    it("should filter users by role", async () => {
      const req = createMockReq({
        query: { role: "ngo_coordinator", page: 1, limit: 10 },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      const users = res.json.mock.calls[0][0].data;
      expect(users.every((u) => u.role === "ngo_coordinator")).toBe(true);
    });

    it("should search users by email or username", async () => {
      const req = createMockReq({
        query: { search: "user1" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should filter users by active status", async () => {
      const req = createMockReq({
        query: { isActive: "true" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getUserById", () => {
    let targetUser;

    beforeEach(async () => {
      targetUser = await createTestUser({
        email: `target_${Date.now()}@example.com`,
      });
    });

    it("should retrieve single user by ID", async () => {
      const req = createMockReq({
        params: { id: targetUser._id.toString() },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getUserById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: targetUser.email }),
        })
      );
    });

    it("should return 404 for non-existent user", async () => {
      const req = createMockReq({
        params: { id: "507f1f77bcf86cd799439011" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getUserById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("createUser", () => {
    it("should create new user with valid data", async () => {
      const req = createMockReq({
        body: {
          username: `newuser_${Date.now()}`,
          email: `newuser_${Date.now()}@example.com`,
          password: "SecurePass123",
          fullName: "New User",
          role: "government_policy_maker",
        },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.createUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const createdUser = await User.findOne({ email: req.body.email });
      expect(createdUser).toBeDefined();
      expect(createdUser.isVerified).toBe(true);
    });

    it("should reject user creation with duplicate email", async () => {
      const duplicateUser = await createTestUser({
        email: `duplicate_${Date.now()}@example.com`,
      });

      const req = createMockReq({
        body: {
          username: `newuser_${Date.now()}`,
          email: duplicateUser.email,
          password: "SecurePass123",
          fullName: "New User",
          role: "ngo_coordinator",
        },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.createUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject user creation with missing required fields", async () => {
      const req = createMockReq({
        body: { username: "useronly" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.createUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateUser", () => {
    let targetUser;

    beforeEach(async () => {
      targetUser = await createTestUser({
        email: `updateme_${Date.now()}@example.com`,
      });
    });

    it("should update user successfully", async () => {
      const req = createMockReq({
        params: { id: targetUser._id.toString() },
        body: {
          fullName: "Updated Full Name",
          role: "ngo_coordinator",
          isActive: false,
        },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.updateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser.fullName).toBe("Updated Full Name");
      expect(updatedUser.role).toBe("ngo_coordinator");
      expect(updatedUser.isActive).toBe(false);
    });

    it("should return 404 for non-existent user", async () => {
      const req = createMockReq({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { fullName: "Test" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.updateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteUser", () => {
    let targetUser;

    beforeEach(async () => {
      targetUser = await createTestUser({
        email: `deleteme_${Date.now()}@example.com`,
      });
    });

    it("should delete user successfully", async () => {
      const req = createMockReq({
        params: { id: targetUser._id.toString() },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      const deletedUser = await User.findById(targetUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 for non-existent user", async () => {
      const req = createMockReq({
        params: { id: "507f1f77bcf86cd799439011" },
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.deleteUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("getDashboardStats", () => {
    beforeEach(async () => {
      await createTestUser({ role: "government_policy_maker" });
      await createTestUser({ role: "ngo_coordinator" });

      const province = await Province.create(mockProvince);
      const cropType = await CropType.create(mockCropType);

      await ProductionData.create({
        ...mockProductionData,
        province: province._id,
        cropType: cropType._id,
      });
      await Alert.create({
        alertId: "TEST-ALERT-001",
        title: "Test Alert",
        message: "Test message",
        alertType: "deficit_critical",
        severity: "critical",
        status: "active",
        targetRoles: ["all"],
      });
    });

    it("should retrieve dashboard statistics", async () => {
      const req = createMockReq({
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getDashboardStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: expect.objectContaining({
              total: expect.any(Number),
              byRole: expect.any(Object),
            }),
            alerts: expect.objectContaining({ active: expect.any(Number) }),
          }),
        })
      );
    });
  });

  describe("getSystemHealth", () => {
    it("should retrieve system health status", async () => {
      const req = createMockReq({
        user: { id: adminUser._id, role: adminUser.role },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminController.getSystemHealth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: "healthy",
            database: expect.objectContaining({ status: "connected" }),
            system: expect.objectContaining({
              uptime: expect.any(Number),
              memory: expect.any(Object),
            }),
          }),
        })
      );
    });
  });
});
