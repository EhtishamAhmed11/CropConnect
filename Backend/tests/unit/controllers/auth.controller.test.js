import * as authController from "../../../controllers/auth.controller.js";
import User from "../../../models/user.model.js";
import {
  createMockReq,
  createMockRes,
  createMockNext,
  createTestUser,
} from "../../helpers/testHelpers.js";
import { jest } from "@jest/globals";

describe("Auth Controller", () => {
  describe("register", () => {
    it("should register a new user with valid data", async () => {
      const req = createMockReq({
        body: {
          username: "newuser",
          email: "newuser@example.com",
          password: "NewPass123",
          fullName: "New User",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: "newuser@example.com",
            }),
            token: expect.any(String),
          }),
        })
      );
    });

    it("should reject registration with invalid email format", async () => {
      const req = createMockReq({
        body: {
          username: "testuser",
          email: "invalid-email",
          password: "TestPass123",
          fullName: "Test User",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid email format",
        })
      );
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await createTestUser({
        email: "login@example.com",
        username: "loginuser",
      });
    });

    it("should login with valid credentials", async () => {
      const req = createMockReq({
        body: {
          email: "login@example.com",
          password: "TestPass123",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: expect.any(String),
          }),
        })
      );
    });
  });
});
