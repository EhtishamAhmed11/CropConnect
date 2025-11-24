import CropType from "../../models/cropType.model";
import ProductionData from "../../models/productionData.model";
import Province from "../../models/province.model";
import SurplusDeficit from "../../models/surplusDeficit.model";
import { mockCropType, mockProductionData, mockProvince } from "../helpers/mockData";
import { createTestUser, generateToken } from "../helpers/testHelpers";

describe("Surplus/Deficit Integration Tests", () => {
  let policyMakerToken, province, cropType;

  beforeAll(async () => {
    const policyMaker = await createTestUser({
      role: "government_policy_maker",
      email: "policy@test.com",
    });
    policyMakerToken = generateToken(policyMaker._id);

    province = await Province.create({
      ...mockProvince,
      population: 110000000,
    });
    cropType = await CropType.create(mockCropType);
  });

  describe("Calculate Surplus/Deficit and Alert Creation", () => {
    it("should calculate deficit and automatically create alert", async () => {
      // Step 1: Create production data with deficit scenario
      await ProductionData.create({
        ...mockProductionData,
        province: province._id,
        cropType: cropType._id,
        production: { value: 5000000, unit: "tonnes" }, // Low production
      });

      // Step 2: Calculate surplus/deficit
      const calculateRes = await request(app)
        .post("/api/surplus-deficit/calculate")
        .set("Authorization", `Bearer ${policyMakerToken}`)
        .send({
          year: "2024-25",
          crop: "WHEAT",
          province: "PB",
        });

      expect(calculateRes.status).toBe(201);
      expect(calculateRes.body.data.status).toBe("deficit");
      expect(calculateRes.body.data.alertCreated).toBe(true);

      // Step 3: Verify alert was created
      const alertsRes = await request(app)
        .get("/api/alerts?alertType=deficit_critical")
        .set("Authorization", `Bearer ${policyMakerToken}`);

      expect(alertsRes.status).toBe(200);
      expect(alertsRes.body.data.length).toBeGreaterThan(0);

      // Step 4: Retrieve deficit regions
      const deficitRes = await request(app)
        .get("/api/surplus-deficit/deficit-regions?year=2024-25&crop=WHEAT")
        .set("Authorization", `Bearer ${policyMakerToken}`);

      expect(deficitRes.status).toBe(200);
      expect(
        deficitRes.body.data.deficitRegions.critical.length
      ).toBeGreaterThan(0);
    });
  });

  describe("Redistribution Suggestions Workflow", () => {
    it("should match surplus and deficit regions", async () => {
      // Create deficit region
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

      // Create surplus region
      const province2 = await Province.create({
        ...mockProvince,
        code: "SD",
        name: "Sindh",
        population: 47000000,
      });

      await SurplusDeficit.create({
        year: "2024-25",
        level: "provincial",
        province: province2._id,
        provinceCode: "SD",
        cropType: cropType._id,
        cropCode: "WHEAT",
        production: 15000000,
        consumption: 10000000,
        balance: 5000000,
        status: "surplus",
        surplusDeficitPercentage: 50,
        selfSufficiencyRatio: 150,
        severity: "none",
        requiresIntervention: false,
      });

      // Get redistribution suggestions
      const suggestionsRes = await request(app)
        .get(
          "/api/surplus-deficit/redistribution-suggestions?year=2024-25&crop=WHEAT"
        )
        .set("Authorization", `Bearer ${policyMakerToken}`);

      expect(suggestionsRes.status).toBe(200);
      expect(suggestionsRes.body.data.suggestions.length).toBeGreaterThan(0);
      expect(suggestionsRes.body.data.suggestions[0]).toHaveProperty(
        "deficitRegion"
      );
      expect(suggestionsRes.body.data.suggestions[0]).toHaveProperty(
        "surplusSources"
      );
    });
  });
});
