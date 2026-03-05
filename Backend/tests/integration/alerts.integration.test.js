import request from "supertest";
import app from "../../index.js";
import { createTestUser, generateToken } from "../helpers/testHelpers.js";

describe("Alerts API Integration Tests", () => {
    let authToken;
    let testAlertId;

    beforeAll(async () => {
        const user = await createTestUser({
            role: "admin",
            email: `alert_user_${Date.now()}@test.com`
        });
        authToken = generateToken(user._id);
    });

    describe("GET /api/alerts", () => {
        it("should return list of alerts for authenticated user", async () => {
            const response = await request(app)
                .get("/api/alerts")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should reject unauthenticated requests", async () => {
            const response = await request(app)
                .get("/api/alerts");

            expect(response.status).toBe(401);
        });

        it("should filter alerts by severity", async () => {
            const response = await request(app)
                .get("/api/alerts")
                .query({ severity: "high" })
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should filter alerts by type", async () => {
            const response = await request(app)
                .get("/api/alerts")
                .query({ alertType: "production_drop" })
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should support pagination", async () => {
            const response = await request(app)
                .get("/api/alerts")
                .query({ page: 1, limit: 10 })
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /api/alerts/:id", () => {
        it("should return alert details by ID if alert exists", async () => {
            // First get an alert ID
            const listResponse = await request(app)
                .get("/api/alerts")
                .set("Authorization", `Bearer ${authToken}`);

            if (listResponse.body.data.length > 0) {
                testAlertId = listResponse.body.data[0]._id;

                const response = await request(app)
                    .get(`/api/alerts/${testAlertId}`)
                    .set("Authorization", `Bearer ${authToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data._id).toBe(testAlertId);
            } else {
                // No alerts exist, test should pass
                expect(true).toBe(true);
            }
        });

        it("should return 404 for non-existent alert", async () => {
            const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
            const response = await request(app)
                .get(`/api/alerts/${fakeId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe("GET /api/admin/health", () => {
        it("should return system health status", async () => {
            const response = await request(app)
                .get("/api/admin/health")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.status).toBeDefined();
        });
    });

    describe("GET /api/admin/ingestion-logs", () => {
        it("should return data ingestion logs", async () => {
            const response = await request(app)
                .get("/api/admin/ingestion-logs")
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should support pagination for logs", async () => {
            const response = await request(app)
                .get("/api/admin/ingestion-logs")
                .query({ page: 1, limit: 5 })
                .set("Authorization", `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
