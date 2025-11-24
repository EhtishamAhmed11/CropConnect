import * as regionalController from '../../../controllers/regional.controller.js';
import CropType from '../../../models/cropType.model.js';
import District from '../../../models/district.model.js';
import ProductionData from '../../../models/productionData.model.js';
import Province from '../../../models/province.model.js';
import { mockCropType, mockDistrict, mockProductionData, mockProvince } from '../../helpers/mockData.js';
import { createMockNext, createMockReq, createMockRes } from '../../helpers/testHelpers.js';

describe('Regional Controller', () => {
  let province1, province2, district, cropType;

  beforeEach(async () => {
    province1 = await Province.create({ ...mockProvince, code: 'PB', name: 'Punjab' });
    province2 = await Province.create({ 
      ...mockProvince, 
      code: 'SD', 
      name: 'Sindh',
      population: 47000000 
    });
    district = await District.create({ ...mockDistrict, province: province1._id });
    cropType = await CropType.create(mockCropType);

    await ProductionData.create([
      {
        ...mockProductionData,
        province: province1._id,
        provinceCode: 'PB',
        cropType: cropType._id,
        production: { value: 20000000, unit: 'tonnes' },
      },
      {
        ...mockProductionData,
        province: province2._id,
        provinceCode: 'SD',
        cropType: cropType._id,
        production: { value: 10000000, unit: 'tonnes' },
      },
    ]);
  });

  describe('compareRegions', () => {
    it('should compare multiple regions successfully', async () => {
      const req = createMockReq({
        body: {
          regions: [
            { type: 'province', code: 'PB' },
            { type: 'province', code: 'SD' },
          ],
          year: '2024-25',
          crop: 'WHEAT',
          metric: 'production',
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.compareRegions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            comparison: expect.arrayContaining([
              expect.objectContaining({
                region: expect.objectContaining({
                  code: expect.any(String),
                }),
                metrics: expect.objectContaining({
                  production: expect.any(Number),
                }),
                rank: expect.any(Number),
              }),
            ]),
          }),
        })
      );
    });

    it('should reject comparison with less than 2 regions', async () => {
      const req = createMockReq({
        body: {
          regions: [{ type: 'province', code: 'PB' }],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.compareRegions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject comparison with more than 5 regions', async () => {
      const req = createMockReq({
        body: {
          regions: [
            { type: 'province', code: 'PB' },
            { type: 'province', code: 'SD' },
            { type: 'province', code: 'KP' },
            { type: 'province', code: 'BL' },
            { type: 'province', code: 'GB' },
            { type: 'province', code: 'AK' },
          ],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.compareRegions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRegionalPerformance', () => {
    it('should retrieve provincial performance data', async () => {
      const req = createMockReq({
        params: {
          regionType: 'province',
          regionCode: 'PB',
        },
        query: { year: '2024-25' },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getRegionalPerformance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            region: expect.objectContaining({
              code: 'PB',
              type: 'province',
            }),
            overall: expect.objectContaining({
              production: expect.any(Number),
            }),
            cropBreakdown: expect.any(Array),
            trends: expect.any(Array),
          }),
        })
      );
    });

    it('should reject invalid region type', async () => {
      const req = createMockReq({
        params: {
          regionType: 'invalid',
          regionCode: 'PB',
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getRegionalPerformance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for non-existent region', async () => {
      const req = createMockReq({
        params: {
          regionType: 'province',
          regionCode: 'XX',
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getRegionalPerformance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getDistrictRankings', () => {
    beforeEach(async () => {
      const district2 = await District.create({
        ...mockDistrict,
        code: 'FSD',
        name: 'Faisalabad',
        province: province1._id,
      });

      await ProductionData.create({
        ...mockProductionData,
        level: 'district',
        district: district2._id,
        districtCode: 'FSD',
        province: province1._id,
        provinceCode: 'PB',
        cropType: cropType._id,
        production: { value: 3000000, unit: 'tonnes' },
      });
    });

    it('should rank districts by production', async () => {
      const req = createMockReq({
        query: {
          year: '2024-25',
          crop: 'WHEAT',
          metric: 'production',
          limit: 20,
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getDistrictRankings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            rankings: expect.arrayContaining([
              expect.objectContaining({
                rank: expect.any(Number),
                districtCode: expect.any(String),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('getProvincialSummary', () => {
    it('should retrieve provincial summary with shares', async () => {
      const req = createMockReq({
        query: { year: '2024-25', crop: 'WHEAT' },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getProvincialSummary(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            provinces: expect.arrayContaining([
              expect.objectContaining({
                provinceCode: expect.any(String),
                production: expect.any(Number),
                productionShare: expect.any(String),
              }),
            ]),
            totals: expect.objectContaining({
              production: expect.any(Number),
            }),
          }),
        })
      );
    });
  });

  describe('getYearOverYearComparison', () => {
    beforeEach(async () => {
      await ProductionData.create({
        ...mockProductionData,
        year: '2023-24',
        province: province1._id,
        provinceCode: 'PB',
        cropType: cropType._id,
        production: { value: 18000000, unit: 'tonnes' },
      });
    });

    it('should calculate year-over-year changes', async () => {
      const req = createMockReq({
        params: {
          regionType: 'province',
          regionCode: 'PB',
        },
        query: { crop: 'WHEAT' },
      });
      const res = createMockRes();
      const next = createMockNext();

      await regionalController.getYearOverYearComparison(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({
              year: expect.any(String),
              production: expect.any(Number),
              changes: expect.objectContaining({
                production: expect.any(Number),
              }),
            }),
          ]),
        })
      );
    });
  });
});