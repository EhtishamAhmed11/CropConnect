import * as gisController from "../../../controllers/gis.controller.js";
import CropType from "../../../models/cropType.model.js";
import District from "../../../models/district.model.js";
import ProductionData from "../../../models/productionData.model.js";
import Province from "../../../models/province.model.js";
import SurplusDeficit from "../../../models/surplusDeficit.model.js";
import {
  mockCropType,
  mockDistrict,
  mockProductionData,
  mockProvince,
} from "../../helpers/mockData.js";
import {
  createMockNext,
  createMockReq,
  createMockRes,
} from "../../helpers/testHelpers.js";

describe("GIS Controller", () => {
  let province, district, cropType;

  beforeEach(async () => {
    // Create unique province & cropType codes
    province = await Province.create({
      ...mockProvince,
      code: `PB_${Date.now()}`,
      name: `Punjab ${Date.now()}`,
      active: true,
    });
    cropType = await CropType.create({
      ...mockCropType,
      code: `WHEAT_${Date.now()}`,
    });

    district = await District.create({
      ...mockDistrict,
      code: `LHR_${Date.now()}`,
      name: `Lahore ${Date.now()}`,
      province: province._id,
    });
  });

  // ------------------------- getProvinces -------------------------
  describe("getProvinces", () => {
    it("should retrieve all active provinces", async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getProvinces(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data.length).toBeGreaterThan(0);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: province.code, name: province.name }),
        ])
      );
    });
  });

  // ------------------------- getProvinceByCode -------------------------
  describe("getProvinceByCode", () => {
    it("should retrieve province by code", async () => {
      const req = createMockReq({ params: { code: province.code } });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getProvinceByCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ code: province.code }),
        })
      );
    });

    it("should return 404 for non-existent province", async () => {
      const req = createMockReq({ params: { code: "XX" } });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getProvinceByCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ------------------------- getDistricts -------------------------
  describe("getDistricts", () => {
    it("should retrieve districts with pagination", async () => {
      const req = createMockReq({ query: { page: 1, limit: 100 } });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getDistricts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const json = res.json.mock.calls[0][0];
      expect(json.data).toBeInstanceOf(Array);
      expect(json.pagination.page).toBe(1);
      expect(json.pagination.limit).toBe(100);
    });

    it("should filter districts by province", async () => {
      const req = createMockReq({
        query: { province: province.code, page: 1, limit: 100 },
      });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getDistricts(req, res, next);

      const districts = res.json.mock.calls[0][0].data;
      expect(districts.every((d) => d.provinceCode === province.code)).toBe(
        true
      );
    });
  });

  // ------------------------- getDistrictByCode -------------------------
  describe("getDistrictByCode", () => {
    it("should retrieve district by code", async () => {
      const req = createMockReq({ params: { code: district.code } });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getDistrictByCode(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ code: district.code }),
        })
      );
    });
  });

  // ------------------------- getProductionMapData -------------------------
  describe("getProductionMapData", () => {
    beforeEach(async () => {
      await ProductionData.create({
        ...mockProductionData,
        province: province._id,
        cropType: cropType._id,
      });
    });

    it("should retrieve production map data", async () => {
      const req = createMockReq({
        query: { year: "2024-25", crop: cropType.code, level: "provincial" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getProductionMapData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ regionCode: province.code }),
        ])
      );
    });

    it("should require year and crop parameters", async () => {
      const req = createMockReq({ query: { year: "2024-25" } });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getProductionMapData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ------------------------- getSurplusDeficitMapData -------------------------
  describe("getSurplusDeficitMapData", () => {
    beforeEach(async () => {
      await SurplusDeficit.create({
        year: "2024-25",
        level: "provincial",
        province: province._id,
        provinceCode: province.code,
        cropType: cropType._id,
        cropCode: cropType.code,
        production: 20000000,
        consumption: 15000000,
        balance: 5000000,
        status: "surplus",
        surplusDeficitPercentage: 33.33,
        selfSufficiencyRatio: 133.33,
        severity: "none",
      });
    });

    it("should retrieve surplus/deficit map data with color coding", async () => {
      const req = createMockReq({
        query: { year: "2024-25", crop: cropType.code, level: "provincial" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await gisController.getSurplusDeficitMapData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0].data;
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            regionCode: province.code,
            status: "surplus",
          }),
        ])
      );
    });
  });
});
// ------------------------- getRegionsNearby -------------------------
describe("getRegionsNearby", () => {
  it("should find regions within radius", async () => {
    const req = createMockReq({
      query: {
        latitude: 31.5204, // Lahore latitude
        longitude: 74.3587, // Lahore longitude
        radius: 100,
        level: "district",
      },
    });
    const res = createMockRes();
    const next = createMockNext();

    await gisController.getRegionsNearby(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toBeInstanceOf(Array);
  });

  it("should require latitude and longitude", async () => {
    const req = createMockReq({ query: { radius: 100 } });
    const res = createMockRes();
    const next = createMockNext();

    await gisController.getRegionsNearby(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ------------------------- getProvincesGeoJSON -------------------------
describe("getProvincesGeoJSON", () => {
  it("should return provinces in GeoJSON format", async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await gisController.getProvincesGeoJSON(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toHaveProperty("type", "FeatureCollection");
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
    expect(data.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            code: province.code,
            name: province.name,
          }),
        }),
      ])
    );
  });
});

// ------------------------- getDistrictsGeoJSON -------------------------
describe("getDistrictsGeoJSON", () => {
  it("should return districts in GeoJSON format", async () => {
    const req = createMockReq({ query: {} });
    const res = createMockRes();
    const next = createMockNext();

    await gisController.getDistrictsGeoJSON(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data).toHaveProperty("type", "FeatureCollection");
    expect(data.features).toBeInstanceOf(Array);
    expect(data.features.length).toBeGreaterThan(0);
    expect(data.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            code: district.code,
            name: district.name,
          }),
        }),
      ])
    );
  });

  it("should filter GeoJSON by province", async () => {
    const req = createMockReq({ query: { province: province.code } });
    const res = createMockRes();
    const next = createMockNext();

    await gisController.getDistrictsGeoJSON(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0].data;
    expect(
      data.features.every((f) => f.properties.provinceCode === province.code)
    ).toBe(true);
  });
});
