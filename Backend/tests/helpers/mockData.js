export const mockUsers = {
  admin: {
    username: "admin",
    email: "admin@cropconnect.pk",
    password: "Admin123!",
    fullName: "Admin User",
    role: "admin",
    isVerified: true,
    isActive: true,
  },
  policyMaker: {
    username: "policymaker",
    email: "policy@gov.pk",
    password: "Policy123!",
    fullName: "Policy Maker",
    role: "government_policy_maker",
    isVerified: true,
    isActive: true,
  },
};

export const mockProvince = {
  code: "PB",
  name: "Punjab",
  population: 110000000,
  area: 205345,
  coordinates: {
    latitude: 31.1704,
    longitude: 72.7097,
  },
  isActive: true,
};

export const mockDistrict = {
  code: "LHR",
  name: "Lahore",
  provinceCode: "PB",
  population: 11126285,
  area: 1772,
  coordinates: {
    latitude: 31.5204,
    longitude: 74.3587,
  },
  isActive: true,
};

export const mockCropType = {
  code: "WHEAT",
  name: "Wheat",
  category: "grain",
  season: "rabi",
  avgConsumptionPerCapita: 124,
  isActive: true,
};

export const mockProductionData = {
  year: "2024-25",
  level: "provincial",
  provinceCode: "PB",
  cropCode: "WHEAT",
  cropName: "Wheat",
  areaCultivated: {
    value: 9000000,
    unit: "hectares",
  },
  production: {
    value: 20000000,
    unit: "tonnes",
  },
  yield: {
    value: 2.22,
    unit: "tonnes_per_hectare",
  },
  dataSource: "PBS",
  isEstimated: false,
  reliability: "high",
};
// import bcrypt from "bcryptjs";
// import { v4 as uuidv4 } from "uuid";
// import User from "../../models/user.model.js";
// import Province from "../../models/province.model.js";
// import District from "../../models/district.model.js";
// import CropType from "../../models/cropType.model.js";

// /** Helper to generate unique string */
// const uniqueSuffix = () => uuidv4().split("-")[0];

// /** ----------------------- Mock Users ----------------------- */
// export const mockUsers = {
//   admin: async () => {
//     const random = uniqueSuffix();
//     const password = await bcrypt.hash("Admin123!", 10);

//     return User.create({
//       username: `admin_${random}`,
//       email: `admin_${random}@cropconnect.pk`,
//       password,
//       fullName: "Admin User",
//       role: "admin",
//       isVerified: true,
//       isActive: true,
//     });
//   },

//   policyMaker: async () => {
//     const random = uniqueSuffix();
//     const password = await bcrypt.hash("Policy123!", 10);

//     return User.create({
//       username: `policymaker_${random}`,
//       email: `policy_${random}@gov.pk`,
//       password,
//       fullName: "Policy Maker",
//       role: "government_policy_maker",
//       isVerified: true,
//       isActive: true,
//     });
//   },
// };

// /** ----------------------- Mock Province ----------------------- */
// export const mockProvince = async (overrides = {}) => {
//   const code = `PB_${Math.floor(Math.random() * 10000)}`;
//   return Province.create({
//     code,
//     name: "Punjab",
//     population: 110000000,
//     area: 205345,
//     coordinates: { latitude: 31.1704, longitude: 72.7097 },
//     isActive: true,
//     ...overrides,
//   });
// };

// /** ----------------------- Mock District ----------------------- */
// export const mockDistrict = async (provinceCode, overrides = {}) => {
//   const code = `LHR_${Math.floor(Math.random() * 10000)}`;
//   return District.create({
//     code,
//     name: "Lahore",
//     provinceCode,
//     population: 11126285,
//     area: 1772,
//     coordinates: { latitude: 31.5204, longitude: 74.3587 },
//     isActive: true,
//     ...overrides,
//   });
// };

// /** ----------------------- Mock CropType ----------------------- */
// export const mockCropType = async (overrides = {}) => {
//   const code = `WHEAT_${Math.floor(Math.random() * 10000)}`;
//   return CropType.create({
//     code,
//     name: "Wheat",
//     category: "grain",
//     season: "rabi",
//     avgConsumptionPerCapita: 124,
//     isActive: true,
//     ...overrides,
//   });
// };

// /** ----------------------- Mock Production Data ----------------------- */
// export const mockProductionData = (provinceCode, cropCode) => ({
//   year: "2024-25",
//   level: "provincial",
//   provinceCode,
//   cropCode,
//   cropName: "Wheat",
//   areaCultivated: { value: 9000000, unit: "hectares" },
//   production: { value: 20000000, unit: "tonnes" },
//   yield: { value: 2.22, unit: "tonnes_per_hectare" },
//   dataSource: "PBS",
//   isEstimated: false,
//   reliability: "high",
// });

// /** ----------------------- Test Helpers ----------------------- */
// export const createMockReq = (overrides = {}) => ({
//   body: {},
//   params: {},
//   query: {},
//   user: null,
//   headers: {},
//   ...overrides,
// });

// export const createMockRes = () => {
//   const res = {};
//   res.status = jest.fn().mockReturnValue(res);
//   res.json = jest.fn().mockReturnValue(res);
//   res.send = jest.fn().mockReturnValue(res);
//   return res;
// };

// export const createMockNext = () => jest.fn();
