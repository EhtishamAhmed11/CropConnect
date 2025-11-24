import Province from "../../../models/province.model.js";
import ProductionData from '../../../models/productionData.model.js';
import CropType from "../../../models/cropType.model.js";
import { mockCropType, mockProductionData, mockProvince } from "../../helpers/mockData";

describe('ProductionData Model', () => {
  let province, cropType;

  beforeEach(async () => {
    province = await Province.create(mockProvince);
    cropType = await CropType.create(mockCropType);
  });

  describe('Schema Validation', () => {
    it('should create production data with valid fields', async () => {
      const productionData = await ProductionData.create({
        ...mockProductionData,
        province: province._id,
        cropType: cropType._id,
      });

      expect(productionData.year).toBe('2024-25');
      expect(productionData.cropCode).toBe('WHEAT');
      expect(productionData.level).toBe('provincial');
      expect(productionData.production.value).toBe(20000000);
    });

    it('should reject invalid year format', async () => {
      await expect(
        ProductionData.create({
          ...mockProductionData,
          year: '2024', // Invalid format
          province: province._id,
          cropType: cropType._id,
        })
      ).rejects.toThrow();
    });

    it('should reject negative production value', async () => {
      await expect(
        ProductionData.create({
          ...mockProductionData,
          production: { value: -1000, unit: 'tonnes' },
          province: province._id,
          cropType: cropType._id,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid data source', async () => {
      await expect(
        ProductionData.create({
          ...mockProductionData,
          dataSource: 'INVALID_SOURCE',
          province: province._id,
          cropType: cropType._id,
        })
      ).rejects.toThrow();
    });

    it('should set default units', async () => {
      const productionData = await ProductionData.create({
        year: '2024-25',
        level: 'national',
        provinceCode: 'PB',
        cropCode: 'WHEAT',
        cropName: 'Wheat',
        areaCultivated: { value: 9000000 },
        production: { value: 20000000 },
        yield: { value: 2.22 },
        dataSource: 'PBS',
        province: province._id,
        cropType: cropType._id,
      });

      expect(productionData.areaCultivated.unit).toBe('hectares');
      expect(productionData.production.unit).toBe('tonnes');
      expect(productionData.yield.unit).toBe('tonnes_per_hectare');
    });
  });

  describe('Indexes', () => {
    it('should create indexes for efficient querying', async () => {
      const indexes = ProductionData.schema.indexes();
      
      expect(indexes.some(idx => 
        JSON.stringify(idx[0]) === JSON.stringify({ year: 1, cropCode: 1, level: 1 })
      )).toBe(true);
    });
  });
});