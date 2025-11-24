import {
  calculateSurplusDeficit,
  calculateConsumption,
  calculateGrowthRate,
  generateRecommendations,
} from '../../../utils/calculations.js';

describe('Calculations Utility', () => {
  describe('calculateSurplusDeficit', () => {
    it('should identify surplus scenario', () => {
      const result = calculateSurplusDeficit(15000, 10000);
      
      expect(result.status).toBe('surplus');
      expect(result.balance).toBe(5000);
      expect(result.surplusDeficitPercentage).toBe(50);
      expect(result.selfSufficiencyRatio).toBe(150);
      expect(result.severity).toBe('none');
      expect(result.requiresIntervention).toBe(false);
    });

    it('should identify critical deficit scenario', () => {
      const result = calculateSurplusDeficit(5000, 10000);
      
      expect(result.status).toBe('deficit');
      expect(result.balance).toBe(-5000);
      expect(result.surplusDeficitPercentage).toBe(-50);
      expect(result.selfSufficiencyRatio).toBe(50);
      expect(result.severity).toBe('critical');
      expect(result.requiresIntervention).toBe(true);
    });

    it('should identify moderate deficit scenario', () => {
      const result = calculateSurplusDeficit(8000, 10000);
      
      expect(result.status).toBe('deficit');
      expect(result.severity).toBe('moderate');
      expect(result.requiresIntervention).toBe(true);
    });

    it('should identify mild deficit scenario', () => {
      const result = calculateSurplusDeficit(9000, 10000);
      
      expect(result.status).toBe('deficit');
      expect(result.severity).toBe('mild');
      expect(result.requiresIntervention).toBe(false);
    });

    it('should identify balanced scenario', () => {
      const result = calculateSurplusDeficit(10000, 10000);
      
      expect(result.status).toBe('balanced');
      expect(result.balance).toBe(0);
      expect(result.severity).toBe('none');
    });
  });

  describe('calculateConsumption', () => {
    it('should calculate consumption correctly', () => {
      const population = 110000000;
      const perCapita = 124; // kg per year
      
      const consumption = calculateConsumption(population, perCapita);
      
      expect(consumption).toBe(13640000); // tonnes
    });

    it('should handle zero population', () => {
      const consumption = calculateConsumption(0, 124);
      expect(consumption).toBe(0);
    });

    it('should handle zero per capita consumption', () => {
      const consumption = calculateConsumption(110000000, 0);
      expect(consumption).toBe(0);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth rate', () => {
      const rate = calculateGrowthRate(12000, 10000);
      expect(parseFloat(rate)).toBe(20);
    });

    it('should calculate negative growth rate', () => {
      const rate = calculateGrowthRate(8000, 10000);
      expect(parseFloat(rate)).toBe(-20);
    });

    it('should handle zero previous value', () => {
      const rate = calculateGrowthRate(10000, 0);
      expect(parseFloat(rate)).toBe(0);
    });

    it('should handle no change', () => {
      const rate = calculateGrowthRate(10000, 10000);
      expect(parseFloat(rate)).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate critical deficit recommendations', () => {
      const recommendations = generateRecommendations('critical', 'Punjab', 'Wheat');
      
      expect(recommendations).toHaveLength(4);
      expect(recommendations[0]).toContain('Immediate intervention');
      expect(recommendations).toContain('Establish emergency food distribution centers');
      expect(recommendations).toContain('Consider imports to meet demand');
    });

    it('should generate moderate deficit recommendations', () => {
      const recommendations = generateRecommendations('moderate', 'Sindh', 'Rice');
      
      expect(recommendations).toHaveLength(3);
      expect(recommendations[0]).toContain('Increase Rice cultivation');
      expect(recommendations).toContain('Improve storage and distribution infrastructure');
    });

    it('should generate mild deficit recommendations', () => {
      const recommendations = generateRecommendations('mild', 'KPK', 'Maize');
      
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0]).toContain('Monitor Maize production trends');
    });
  });
});