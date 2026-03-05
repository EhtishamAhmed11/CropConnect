// Backend/tests/integration/market.integration.test.js
import request from "supertest";
import app from "../../index.js";
import CropType from "../../models/cropType.model.js";
import District from "../../models/district.model.js";
import Province from "../../models/province.model.js";
import { mockCropType, mockProvince, mockDistrict } from "../helpers/mockData.js";

describe("Market API Integration Tests", () => {
    let cropId, districtId, provinceId;

    beforeAll(async () => {
        // Ensure crop exists
        const crop = await CropType.findOne({ code: "WHEAT" });
        if (crop) {
            cropId = crop._id;
        } else {
            const existingName = await CropType.findOne({ name: "Wheat" });
            if (existingName) {
                cropId = existingName._id;
            } else {
                try {
                    const newCrop = await CropType.create(mockCropType);
                    cropId = newCrop._id;
                } catch (e) {
                    const retry = await CropType.findOne({ code: "WHEAT" });
                    cropId = retry._id;
                }
            }
        }

        // Ensure Province exists (for District relation)
        const province = await Province.findOne({ code: mockProvince.code });
        if (province) {
            provinceId = province._id;
        } else {
            try {
                const newProvince = await Province.create(mockProvince);
                provinceId = newProvince._id;
            } catch (e) {
                const retry = await Province.findOne({ code: mockProvince.code });
                provinceId = retry._id;
            }
        }

        // Ensure district exists
        const district = await District.findOne({ code: mockDistrict.code });
        if (district) {
            districtId = district._id;
        } else {
            // Check by name just in case
            const existingName = await District.findOne({ name: "Lahore" });
            if (existingName) {
                districtId = existingName._id;
            } else {
                try {
                    const newDistrict = await District.create({
                        ...mockDistrict,
                        province: provinceId, // Link to Province ID
                        // code, provinceCode are in mockDistrict
                    });
                    districtId = newDistrict._id;
                } catch (e) {
                    const retry = await District.findOne({ code: mockDistrict.code });
                    districtId = retry._id;
                }
            }
        }
    });

    describe("GET /api/market/prices/latest", () => {
        it("should return latest market prices", async () => {
            const response = await request(app).get("/api/market/prices/latest");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should filter latest prices by crop", async () => {
            const response = await request(app)
                .get("/api/market/prices/latest")
                .query({ crop: "Wheat" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            if (response.body.data.length > 0) {
                expect(response.body.data[0].crop).toBeDefined();
            }
        });

        it("should filter latest prices by district", async () => {
            const response = await request(app)
                .get("/api/market/prices/latest")
                .query({ district: "Lahore" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe("GET /api/market/prices/history", () => {
        it("should return price history", async () => {
            // Ensure IDs are available
            let cId = cropId;
            let dId = districtId;

            if (!cId) {
                const c = await CropType.findOne({ code: "WHEAT" });
                if (c) cId = c._id;
            }
            if (!dId) {
                const d = await District.findOne({ code: mockDistrict.code });
                if (d) dId = d._id;
            }

            console.log('DEBUG: Using cropId:', cId, 'districtId:', dId);

            const response = await request(app)
                .get("/api/market/prices/history")
                .query({
                    cropId: cId ? cId.toString() : undefined,
                    districtId: dId ? dId.toString() : undefined
                });

            if (response.status !== 200) {
                console.log("MARKET TEST FAILURE RESPONSE:", JSON.stringify(response.body));
            }

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(typeof response.body.count).toBe("number");
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should handle missing query parameters gracefully", async () => {
            const response = await request(app)
                .get("/api/market/prices/history");

            // Should either return 400 or empty array
            expect([200, 400]).toContain(response.status);
        });
    });

    describe("GET /api/market/highlights", () => {
        it("should return market highlights and statistics", async () => {
            const response = await request(app).get("/api/market/highlights");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });
});
