import * as surplusDeficitController from "../../../controllers/surplusDeficit.controller.js";
import CropType from "../../../models/cropType.model.js";
import ProductionData from "../../../models/productionData.model.js";
import Province from "../../../models/province.model.js";
import SurplusDeficit from "../../../models/surplusDeficit.model.js";
import { mockCropType, mockProductionData, mockProvince } from "../../helpers/mockData.js";
import { createMockNext, createMockReq, createMockRes, createTestUser } from "../../helpers/testHelpers.js";

describe("Surplus/Deficit Controller", () => {
  let province, cropType, user;

  beforeEach(async () => {
    province = await Province.create({
      ...mockProvince,
      population: 110000000,
    });
    cropType = await CropType.create(mockCropType);
    user = await createTestUser({ role: "government_policy_maker" });

    await ProductionData.create({
      ...mockProductionData,
      province: province._id,
      cropType: cropType._id,
      production: { value: 10000000, unit: "tonnes" },
    });
  });

  describe("calculateSurplusDeficitAnalysis", () => {
    it("should calculate surplus scenario", async () => {
      const req = createMockReq({
        body: {
          year: "2024-25",
          crop: "WHEAT",
          province: "PB",
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
        { cropCode: "WHEAT" },
        { production: { value: 5000000, unit: "tonnes" } }
      );

      const req = createMockReq({
        body: {
          year: "2024-25",
          crop: "WHEAT",
          province: "PB",
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
        provinceCode: "PB",
        cropType: cropType._id,
        cropCode: "WHEAT",
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
        query: { year: "2024-25", crop: "WHEAT" },
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
