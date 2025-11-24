import request from "supertest";
import app from "../../app.js"; // Your Express app
import { createTestUser } from "../helpers/testHelpers.js";

describe("Authentication Integration Tests", () => {
  describe("Complete Registration Flow", () => {
    it("should complete user registration to login flow", async () => {
      // Step 1: Register
      const registerRes = await request(app).post("/api/auth/register").send({
        username: "integrationuser",
        email: "integration@example.com",
        password: "IntegrationPass123",
        fullName: "Integration Test User",
      });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.token).toBeDefined();

      const token = registerRes.body.data.token;

      // Step 2: Access protected route
      const profileRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.email).toBe("integration@example.com");

      // Step 3: Login again
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "integration@example.com",
        password: "IntegrationPass123",
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });

  describe("Password Reset Flow", () => {
    it("should complete forgot password to reset flow", async () => {
      // Create user first
      await createTestUser({ email: "resetflow@example.com" });

      // Step 1: Request password reset
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "resetflow@example.com" });

      expect(forgotRes.status).toBe(200);

      // Get reset token from response (in production, this would be emailed)
      const resetToken = forgotRes.body.data.resetToken;

      // Step 2: Reset password
      const resetRes = await request(app)
        .put(`/api/auth/reset-password/${resetToken}`)
        .send({ password: "NewSecurePass456" });

      expect(resetRes.status).toBe(200);

      // Step 3: Login with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "resetflow@example.com",
        password: "NewSecurePass456",
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
    });
  });
});
