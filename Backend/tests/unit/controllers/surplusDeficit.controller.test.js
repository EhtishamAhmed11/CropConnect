import * as surplusDeficitController from "../../../controllers/surplusDeficit.controller.js";
import Alert from "../../../models/alerts.model.js";
import CropType from "../../../models/cropType.model.js";
import ProductionData from "../../../models/productionData.model.js";
import Province from "../../../models/province.model.js";
import SurplusDeficit from "../../../models/surplusDeficit.model.js";
import { mockCropType, mockProductionData, mockProvince } from "../../helpers/mockData.js";
import { createMockNext, createMockReq, createMockRes, createTestUser } from "../../helpers/testHelpers.js";

describe("Surplus/Deficit Controller", () => {
  let province, cropType, user;

  beforeEach(async () => {
    const existingProvince = await Province.findOne({ $or: [{ code: mockProvince.code }, { name: mockProvince.name }] });
    province = existingProvince || (await Province.create(mockProvince));

    const existingCrop = await CropType.findOne({ $or: [{ code: mockCropType.code }, { name: mockCropType.name }] });
    cropType = existingCrop || (await CropType.create(mockCropType));

    user = await createTestUser({
      role: "government_policy_maker",
      email: `policy_${Date.now()}@test.com`
    });

    // Isolation: clear production and surplus data for this combination
    await ProductionData.deleteMany({ province: province._id, cropType: cropType._id });
    await SurplusDeficit.deleteMany({ province: province._id, cropType: cropType._id });

    await ProductionData.create({
      ...mockProductionData,
      province: province._id,
      provinceCode: province.code,
      cropType: cropType._id,
      cropCode: cropType.code,
      production: { value: 10000000, unit: "tonnes" },
    });
  });

  describe("calculateSurplusDeficitAnalysis", () => {
    it("should calculate surplus scenario", async () => {
      const req = createMockReq({
        body: {
          year: "2024-25",
          crop: cropType.code,
          province: province.code,
        },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await surplusDeficitController.calculateSurplusDeficitAnalysis(
        req,
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: expect.any(String),
            balance: expect.any(Number),
          }),
        })
      );
    });

    it("should create alert for critical deficit", async () => {
      await ProductionData.findOneAndUpdate(
        { cropCode: cropType.code },
        { production: { value: 5000000, unit: "tonnes" } }
      );

      const req = createMockReq({
        body: {
          year: "2024-25",
          crop: cropType.code,
          province: province.code,
        },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await surplusDeficitController.calculateSurplusDeficitAnalysis(
        req,
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(201);

      const alert = await Alert.findOne({ alertType: "deficit_critical" });
      expect(alert).toBeDefined();
    });

    it("should reject calculation without required parameters", async () => {
      const req = createMockReq({
        body: { year: "2024-25" },
        user,
      });
      const res = createMockRes();
      const next = createMockNext();

      await surplusDeficitController.calculateSurplusDeficitAnalysis(
        req,
        res,
        next
      );

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getDeficitRegions", () => {
    beforeEach(async () => {
      await SurplusDeficit.create({
        year: "2024-25",
        level: "provincial",
        province: province._id,
        provinceCode: province.code,
        cropType: cropType._id,
        cropCode: cropType.code,
        production: 5000000,
        consumption: 10000000,
        balance: -5000000,
        status: "deficit",
        surplusDeficitPercentage: -50,
        selfSufficiencyRatio: 50,
        severity: "critical",
        requiresIntervention: true,
      });
    });

    it("should retrieve deficit regions", async () => {
      const req = createMockReq({
        query: { year: "2024-25", crop: cropType.code, province: province.code },
      });
      const res = createMockRes();
      const next = createMockNext();

      await surplusDeficitController.getDeficitRegions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            deficitRegions: expect.objectContaining({
              critical: expect.any(Array),
            }),
          }),
        })
      );
    });
  });
});
