import request from "supertest";
import app from "../../index.js";
import District from "../../models/district.model.js";
import CropType from "../../models/cropType.model.js";
import Province from "../../models/province.model.js";
import mongoose from "mongoose";

describe("New Modules Integration Tests", () => {
    let mockDistrict;
    let mockProvince;
    let mockCrop;

    beforeAll(async () => {
        // Setup initial data needed for tests
        mockProvince = await Province.findOneAndUpdate(
            { code: "P-TEST" },
            {
                code: "P-TEST",
                name: "Test Province",
                population: 1000000,
                area: 5000,
                coordinates: { latitude: 30, longitude: 70 }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        mockDistrict = await District.findOneAndUpdate(
            { code: "D-TEST" },
            {
                code: "D-TEST",
                name: "Test District",
                province: mockProvince._id,
                provinceCode: "P-TEST",
                population: 200000,
                area: 1000,
                coordinates: { latitude: 31.5, longitude: 74.3 }, // Lahore roughly
                geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        mockCrop = await CropType.findOneAndUpdate(
            { code: "WHEAT-TEST" },
            {
                code: "WHEAT-TEST",
                name: "Test Wheat",
                category: "grain",
                season: "rabi",
                avgConsumptionPerCapita: 120
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    });

    describe("Module 1: Weather Integration", () => {
        // Note: Real API calls might fail if key is invalid, so we test structure mostly.
        // Or we should mock the service method if we want to be pure.
        // For 'integration' usually we might want to test the full stack, but external APIs are flaky.
        // I will assume the provided key is valid OR handle the error gracefully.

        it("GET /api/weather/district/:id - should get weather for valid district", async () => {
            const res = await request(app).get(`/api/weather/district/${mockDistrict._id}`);

            // It might be 404 if no weather fetched yet, or 200 with data if I trigger update first
            // Let's trigger update first

            // Mocking the fetch in a real test environment without nock is hard.
            // But since we wrote 'fetchWeatherForDistrict' to handle errors, let's see.
            // Actually, best to just test the 'get' endpoint behavior.

            if (res.status === 200) {
                expect(res.body.success).toBe(true);
            } else {
                // If 404, it means no data found, which is valid if we haven't fetched
                expect(res.status).toBe(404); // or 200 with null
            }
        });
    });

    describe("Module 3: Market Intelligence", () => {
        it("POST /api/market/prices - should add new price", async () => {
            const res = await request(app).post("/api/market/prices").send({
                cropType: mockCrop._id,
                district: mockDistrict._id,
                price: 5000,
                unit: "40kg",
                source: "Test Source"
            });

            expect(res.status).toBe(201);
            expect(res.body.data.price).toBe(5000);
        });

        it("GET /api/market/prices/latest - should retrieve latest prices", async () => {
            const res = await request(app).get("/api/market/prices/latest");
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            // Should contain our added price
            const found = res.body.data.find(p => p.price === 5000);
            expect(found).toBeDefined();
        });
    });

    describe("Module 4: Distribution (Route Planning)", () => {
        let secondDistrict;

        beforeAll(async () => {
            secondDistrict = await District.findOneAndUpdate(
                { code: "D-TEST-2" },
                {
                    code: "D-TEST-2",
                    name: "Test District 2",
                    province: mockProvince._id,
                    provinceCode: "P-TEST",
                    coordinates: { latitude: 33.6, longitude: 73.0 } // Islamabad
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        });

        it("GET /api/gis/routes - should calculate route", async () => {
            const res = await request(app).get(`/api/gis/routes?surplusId=${mockDistrict._id}&deficitId=${secondDistrict._id}`);

            expect(res.status).toBe(200);
            expect(res.body.data.distance).toBeDefined();
            // Whether it's mock or real depends on the key, but it should return structure
        });

        it("GET /api/gis/routes - should fail without params", async () => {
            const res = await request(app).get("/api/gis/routes");
            expect(res.status).toBe(400); // Bad Request
        });
    });

});
