import * as userController from "../../../controllers/user.controller.js";
import User from "../../../models/user.model.js";
import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";
import { createMockNext, createMockReq, createMockRes, createTestUser } from "../../helpers/testHelpers.js";

describe("User Controller", () => {
  let user;

  beforeEach(async () => {
    user = await createTestUser({
      email: "user@example.com",
      fullName: "Test User",
    });
  });

  describe("getProfile", () => {
    it("should retrieve user profile successfully", async () => {
      const req = createMockReq({ user });
      const res = createMockRes();
      const next = createMockNext();

      await userController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            email: "user@example.com",
            fullName: "Test User",
          }),
        })
      );
    });
  });

  describe("updateProfile", () => {
    it("should update user profile with valid data", async () => {
      const req = createMockReq({
        user,
        body: {
          fullName: "Updated Name",
          phoneNumber: "03001234567",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            fullName: "Updated Name",
            phoneNumber: "03001234567",
          }),
        })
      );

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.fullName).toBe("Updated Name");
    });

    it("should update user preferences", async () => {
      const req = createMockReq({
        user,
        body: {
          preferences: {
            emailNotifications: false,
            reportFrequency: "monthly",
          },
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.preferences.emailNotifications).toBe(false);
      expect(updatedUser.preferences.reportFrequency).toBe("monthly");
    });
  });

  describe("changePassword", () => {
    it("should change password with valid current password", async () => {
      const req = createMockReq({
        user,
        body: {
          currentPassword: "TestPass123",
          newPassword: "NewPass456",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedUser = await User.findById(user._id);
      const isMatch = await bcrypt.compare("NewPass456", updatedUser.password);
      expect(isMatch).toBe(true);
    });

    it("should reject password change with incorrect current password", async () => {
      const req = createMockReq({
        user,
        body: {
          currentPassword: "WrongPassword",
          newPassword: "NewPass456",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Current password is incorrect",
        })
      );
    });

    it("should reject short new password", async () => {
      const req = createMockReq({
        user,
        body: {
          currentPassword: "TestPass123",
          newPassword: "short",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updatePreferences", () => {
    it("should update user preferences successfully", async () => {
      const req = createMockReq({
        user,
        body: {
          preferences: {
            emailNotifications: false,
            inAppNotifications: true,
            reportFrequency: "weekly",
            defaultProvince: "PB",
          },
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.updatePreferences(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.preferences.emailNotifications).toBe(false);
      expect(updatedUser.preferences.defaultProvince).toBe("PB");
    });
  });

  describe("deactivateAccount", () => {
    it("should deactivate account with correct password", async () => {
      const req = createMockReq({
        user,
        body: { password: "TestPass123" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.deactivateAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);

      const deactivatedUser = await User.findById(user._id);
      expect(deactivatedUser.isActive).toBe(false);
    });

    it("should reject deactivation with incorrect password", async () => {
      const req = createMockReq({
        user,
        body: { password: "WrongPassword" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await userController.deactivateAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
