import * as productionController from "../../../controllers/production.controller.js";
import ProductionData from "../../../models/productionData.model.js";
import Province from "../../../models/province.model.js";
import District from "../../../models/district.model.js";
import CropType from "../../../models/cropType.model.js";
import {
  mockProductionData,
  mockProvince,
  mockDistrict,
  mockCropType,
} from "../../helpers/mockData.js";
import {
  createMockReq,
  createMockRes,
  createMockNext,
  createTestUser,
} from "../../helpers/testHelpers.js";

describe("Production Controller", () => {
  let province, district, cropType;

  beforeEach(async () => {
    // Re-use standard codes to stay compatible with seeded data structure
    const existingProvince = await Province.findOne({ $or: [{ code: mockProvince.code }, { name: mockProvince.name }] });
    province = existingProvince || (await Province.create(mockProvince));

    const existingCrop = await CropType.findOne({ $or: [{ code: mockCropType.code }, { name: mockCropType.name }] });
    cropType = existingCrop || (await CropType.create(mockCropType));

    const existingDistrict = await District.findOne({ code: mockDistrict.code });
    district = existingDistrict || (await District.create({
      ...mockDistrict,
      province: province._id,
    }));

    // CRITICAL: Clear existing production data for THIS specific province/crop to ensure fresh summary counts
    // while preserving the province/crop themselves.
    await ProductionData.deleteMany({
      province: province._id,
      cropType: cropType._id
    });
  });

  describe("getProductionData", () => {
    beforeEach(async () => {
      await ProductionData.create({
        ...mockProductionData,
        province: province._id,
        provinceCode: province.code,
        cropType: cropType._id,
        cropCode: cropType.code,
      });
    });

    it("should retrieve production data with pagination", async () => {
      const req = createMockReq({
        query: { page: 1, limit: 10 },
      });
      const res = createMockRes();
      const next = createMockNext();

      await productionController.getProductionData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.objectContaining({
            page: 1,
            limit: 10,
          }),
        })
      );
    });

    it("should filter production data by year", async () => {
      const req = createMockReq({
        query: { year: "2024-25", province: province.code, crop: cropType.code },
      });
      const res = createMockRes();
      const next = createMockNext();

      await productionController.getProductionData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.every((item) => item.year === "2024-25")).toBe(true);
    });

    it("should filter production data by crop", async () => {
      const req = createMockReq({
        query: { crop: cropType.code, province: province.code },
      });
      const res = createMockRes();
      const next = createMockNext();

      await productionController.getProductionData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getProductionSummary", () => {
    beforeEach(async () => {
      await ProductionData.create([
        {
          ...mockProductionData,
          province: province._id,
          provinceCode: province.code,
          cropType: cropType._id,
          cropCode: cropType.code,
          production: { value: 10000, unit: "tonnes" },
        },
        {
          ...mockProductionData,
          province: province._id,
          provinceCode: province.code,
          cropType: cropType._id,
          cropCode: cropType.code,
          production: { value: 15000, unit: "tonnes" },
        },
      ]);
    });

    it("should calculate production summary", async () => {
      const req = createMockReq({
        query: { year: "2024-25", crop: cropType.code, province: province.code },
      });
      const res = createMockRes();
      const next = createMockNext();

      await productionController.getProductionSummary(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            totalProduction: 25000,
            recordCount: 2,
          }),
        })
      );
    });
  });

  describe("createProductionData", () => {
    it("should create production data with valid input", async () => {
      const user = await createTestUser({ role: "admin" });

      const req = createMockReq({
        body: {
          ...mockProductionData,
          province: province._id,
          cropType: cropType._id,
        },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await productionController.createProductionData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
