import request from "supertest";
import app from "../../index.js";
import CropType from "../../models/cropType.model.js";
import Province from "../../models/province.model.js";
import {
  mockCropType,
  mockProductionData,
  mockProvince,
} from "../helpers/mockData.js";
import { createTestUser, generateToken } from "../helpers/testHelpers.js";

describe("Production Data Integration Tests", () => {
  let adminToken, province, cropType;

  beforeAll(async () => {
    try {
      const admin = await createTestUser({
        role: "admin",
        email: `admin_${Date.now()}@test.com`,
      });
      adminToken = generateToken(admin._id);

      const existingProvince = await Province.findOne({ $or: [{ code: mockProvince.code }, { name: mockProvince.name }] });
      if (existingProvince) {
        province = existingProvince;
      } else {
        try {
          province = await Province.create(mockProvince);
        } catch (e) {
          province = await Province.findOne({ code: mockProvince.code });
        }
      }

      const existingCrop = await CropType.findOne({ $or: [{ code: mockCropType.code }, { name: mockCropType.name }] });
      if (existingCrop) {
        cropType = existingCrop;
      } else {
        try {
          cropType = await CropType.create(mockCropType);
        } catch (e) {
          cropType = await CropType.findOne({ code: mockCropType.code });
        }
      }
    } catch (error) {
      console.error("Setup failed", error);
    }
  });

  describe("Complete Production Data Workflow", () => {
    it("should create, retrieve, update, and delete production data", async () => {
      // Step 1: Create production data
      const createRes = await request(app)
        .post("/api/production")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...mockProductionData,
          province: province._id,
          cropType: cropType._id,
        });

      expect(createRes.status).toBe(201);
      const productionId = createRes.body.data._id;

      // Step 2: Retrieve production data
      const getRes = await request(app)
        .get(`/api/production/${productionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.cropCode).toBe("WHEAT");

      // Step 3: Update production data
      const updateRes = await request(app)
        .put(`/api/production/${productionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          production: { value: 25000000, unit: "tonnes" },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.production.value).toBe(25000000);

      // Step 4: Delete production data
      const deleteRes = await request(app)
        .delete(`/api/production/${productionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const verifyRes = await request(app)
        .get(`/api/production/${productionId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
