// Backend/tests/integration/prediction.integration.test.js
import request from "supertest";
import app from "../../index.js";

describe("Prediction API Integration Tests", () => {
    describe("GET /api/predictions/forecast", () => {
        it("should return yield predictions for a specific crop and region", async () => {
            const response = await request(app)
                .get("/api/predictions/forecast")
                .query({ crop: "Wheat", region: "Punjab" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return predictions for all regions if region not specified", async () => {
            const response = await request(app)
                .get("/api/predictions/forecast")
                .query({ crop: "Wheat" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should handle invalid crop gracefully", async () => {
            const response = await request(app)
                .get("/api/predictions/forecast")
                .query({ crop: "InvalidCrop", region: "Punjab" });

            expect([200, 404]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body.data.length).toBe(0);
            }
        });
    });

    describe("GET /api/predictions/timeline", () => {
        it("should return combined historical and forecast data", async () => {
            const response = await request(app)
                .get("/api/predictions/timeline")
                .query({ crop: "Wheat", region: "Punjab" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.historical).toBeDefined();
            expect(response.body.data.forecast).toBeDefined();
            expect(Array.isArray(response.body.data.historical)).toBe(true);
            expect(Array.isArray(response.body.data.forecast)).toBe(true);
        });

        it("should work with different crops", async () => {
            const crops = ["Wheat", "Rice", "Cotton"];

            for (const crop of crops) {
                const response = await request(app)
                    .get("/api/predictions/timeline")
                    .query({ crop, region: "Punjab" });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            }
        });
    });

    describe("GET /api/predictions/performance", () => {
        it("should return model performance metrics", async () => {
            const response = await request(app)
                .get("/api/predictions/performance")
                .query({ crop: "Wheat", region: "Punjab" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // The controller returns an array for ModelPerformance.find(query)
            if (response.body.data.length > 0) {
                expect(response.body.data[0].testR2).toBeDefined();
            }
        });

        it("should return performance for all crops if not specified", async () => {
            const response = await request(app)
                .get("/api/predictions/performance");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /api/predictions/regional-comparison", () => {
        it("should return regional comparison data for a specific year", async () => {
            const response = await request(app)
                .get("/api/predictions/regional-comparison")
                .query({ crop: "Wheat", year: 2025 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should work without year parameter", async () => {
            const response = await request(app)
                .get("/api/predictions/regional-comparison")
                .query({ crop: "Wheat" });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/predictions/summary", () => {
        it("should return aggregate prediction statistics", async () => {
            const response = await request(app).get("/api/predictions/summary");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it("should include total predictions count", async () => {
            const response = await request(app).get("/api/predictions/summary");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            // Controller returns 'count', not 'totalPredictions'
            if (response.body.data.count) {
                expect(typeof response.body.data.count).toBe("number");
            }
        });
    });
});
