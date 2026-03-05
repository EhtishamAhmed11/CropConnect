import request from "supertest";
import app from "../../index.js";
import User from "../../models/user.model.js";
import { createTestUser, generateToken } from "../helpers/testHelpers.js";

describe("Authentication Integration Tests", () => {
  const password = "SecurePass123";

  describe("Login Flow", () => {
    let email;

    beforeEach(async () => {
      email = `john_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
      await createTestUser({
        email,
        password,
        fullName: "John Test",
        role: "government_policy_maker",
        isVerified: true
      });
    });

    it("should login with valid credentials", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      if (loginRes.status !== 200) {
        console.log('DEBUG: Login failed. Status:', loginRes.status, 'Body:', JSON.stringify(loginRes.body));
      }

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.body.data.user.email).toBe(email);
    });

    it("should reject login with invalid password", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "WrongPassword123" });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.success).toBe(false);
    });

    it("should reject login with non-existent email", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "SomePassword123"
        });

      expect(loginRes.status).toBe(401);
    });
  });

  describe("Protected Routes", () => {
    let authToken;
    let userEmail;

    beforeEach(async () => {
      const user = await createTestUser({
        email: `protected_${Date.now()}@test.com`,
        role: "government_policy_maker",
        isActive: true,
        isVerified: true
      });
      authToken = generateToken(user._id);
      userEmail = user.email;
    });

    it("should access profile with valid token", async () => {
      const profileRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.data.email).toBe(userEmail);
    });

    it("should reject access without token", async () => {
      const profileRes = await request(app)
        .get("/api/auth/me");

      expect(profileRes.status).toBe(401);
    });

    it("should reject access with invalid token", async () => {
      const profileRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid_token_here");

      expect(profileRes.status).toBe(401);
    });
  });

  describe("Registration Flow", () => {
    let existingEmail;

    beforeEach(async () => {
      const user = await createTestUser({
        email: `existing_${Date.now()}@test.com`
      });
      existingEmail = user.email;
    });

    it("should reject registration with duplicate email", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          username: `newuser_${Date.now()}`,
          email: existingEmail,
          password: "NewPassword123",
          fullName: "Test User"
        });

      expect(registerRes.status).toBe(400);
    });

    it("should reject registration with missing fields", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: "incomplete@example.com"
        });

      expect(registerRes.status).toBe(400);
    });

    it("should reject registration with weak password", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          username: `weak_${Date.now()}`,
          email: `weak_${Date.now()}@test.com`,
          password: "123",
          fullName: "Weak User"
        });

      expect(registerRes.status).toBe(400);
    });
  });
});
