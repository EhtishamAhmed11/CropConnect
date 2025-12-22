import mongoose from "mongoose";
import District from "../models/district.model.js";
import Province from "../models/province.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const districts = [
  {
    code: "PB-HFZ",
    name: "Hafizabad",
    provinceCode: "PB",
    population: 1156957,
    area: 2367,
    coordinates: { latitude: 32.0711, longitude: 73.6878 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-GRW",
    name: "Gujranwala",
    provinceCode: "PB",
    population: 5014196,
    area: 3622,
    coordinates: { latitude: 32.1877, longitude: 74.1945 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-SKT",
    name: "Sialkot",
    provinceCode: "PB",
    population: 3893672,
    area: 3016,
    coordinates: { latitude: 32.4945, longitude: 74.5229 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-SHK",
    name: "Sheikhupura",
    provinceCode: "PB",
    population: 5960883,
    area: 5960,
    coordinates: { latitude: 31.7167, longitude: 73.985 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-LHE",
    name: "Lahore",
    provinceCode: "PB",
    population: 11126285,
    area: 1772,
    coordinates: { latitude: 31.5204, longitude: 74.3587 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-KSR",
    name: "Kasur",
    provinceCode: "PB",
    population: 3454996,
    area: 3995,
    coordinates: { latitude: 31.1186, longitude: 74.4507 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-OKR",
    name: "Okara",
    provinceCode: "PB",
    population: 3039139,
    area: 3858,
    coordinates: { latitude: 30.8081, longitude: 73.4534 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-SHW",
    name: "Sahiwal",
    provinceCode: "PB",
    population: 2517560,
    area: 3201,
    coordinates: { latitude: 30.6682, longitude: 73.1114 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-FSD",
    name: "Faisalabad",
    provinceCode: "PB",
    population: 7873910,
    area: 5856,
    coordinates: { latitude: 31.4504, longitude: 73.135 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-JHG",
    name: "Jhang",
    provinceCode: "PB",
    population: 2743416,
    area: 8809,
    coordinates: { latitude: 31.2681, longitude: 72.3181 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-TTS",
    name: "Toba Tek Singh",
    provinceCode: "PB",
    population: 2190535,
    area: 3252,
    coordinates: { latitude: 30.9726, longitude: 72.485 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-CHT",
    name: "Chiniot",
    provinceCode: "PB",
    population: 1369740,
    area: 2643,
    coordinates: { latitude: 31.7167, longitude: 72.9833 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-NNK",
    name: "Nankana Sahib",
    provinceCode: "PB",
    population: 1410000,
    area: 2960,
    coordinates: { latitude: 31.45, longitude: 73.7 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-MBD",
    name: "Mandi Bahauddin",
    provinceCode: "PB",
    population: 1593292,
    area: 2673,
    coordinates: { latitude: 32.5861, longitude: 73.4917 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-GJT",
    name: "Gujrat",
    provinceCode: "PB",
    population: 2756110,
    area: 3192,
    coordinates: { latitude: 32.5742, longitude: 74.0789 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-NRW",
    name: "Narowal",
    provinceCode: "PB",
    population: 1709757,
    area: 2337,
    coordinates: { latitude: 32.1019, longitude: 74.8728 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-SGD",
    name: "Sargodha",
    provinceCode: "PB",
    population: 3702588,
    area: 5854,
    coordinates: { latitude: 32.0836, longitude: 72.6711 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-KHB",
    name: "Khushab",
    provinceCode: "PB",
    population: 1281299,
    area: 6511,
    coordinates: { latitude: 32.2967, longitude: 72.3522 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-MNW",
    name: "Mianwali",
    provinceCode: "PB",
    population: 1546094,
    area: 5840,
    coordinates: { latitude: 32.5853, longitude: 71.5436 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
  {
    code: "PB-BHK",
    name: "Bhakkar",
    provinceCode: "PB",
    population: 1650117,
    area: 8153,
    coordinates: { latitude: 31.626, longitude: 71.0653 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-MLN",
    name: "Multan",
    provinceCode: "PB",
    population: 4745109,
    area: 3720,
    coordinates: { latitude: 30.1978, longitude: 71.4711 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-LDN",
    name: "Lodhran",
    provinceCode: "PB",
    population: 1700620,
    area: 2778,
    coordinates: { latitude: 29.5339, longitude: 71.6333 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-VHR",
    name: "Vehari",
    provinceCode: "PB",
    population: 2903285,
    area: 4364,
    coordinates: { latitude: 30.0452, longitude: 72.3489 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-KHW",
    name: "Khanewal",
    provinceCode: "PB",
    population: 2921986,
    area: 4349,
    coordinates: { latitude: 30.3017, longitude: 71.9321 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-BWN",
    name: "Bahawalnagar",
    provinceCode: "PB",
    population: 2981919,
    area: 8878,
    coordinates: { latitude: 29.9941, longitude: 73.2531 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-BWP",
    name: "Bahawalpur",
    provinceCode: "PB",
    population: 3668106,
    area: 24830,
    coordinates: { latitude: 29.3956, longitude: 71.6722 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-RYK",
    name: "Rahim Yar Khan",
    provinceCode: "PB",
    population: 4814006,
    area: 11880,
    coordinates: { latitude: 28.4202, longitude: 70.2952 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-DGK",
    name: "Dera Ghazi Khan",
    provinceCode: "PB",
    population: 2872201,
    area: 11922,
    coordinates: { latitude: 30.0561, longitude: 70.6403 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-RJN",
    name: "Rajanpur",
    provinceCode: "PB",
    population: 1995958,
    area: 12319,
    coordinates: { latitude: 29.1044, longitude: 70.33 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "PB-MZG",
    name: "Muzaffargarh",
    provinceCode: "PB",
    population: 4322009,
    area: 8249,
    coordinates: { latitude: 30.0733, longitude: 71.1933 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "PB-LYH",
    name: "Layyah",
    provinceCode: "PB",
    population: 1824230,
    area: 6291,
    coordinates: { latitude: 30.9617, longitude: 70.9428 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },

  // ============================================
  // SINDH DISTRICTS (20 districts)
  // ============================================
  {
    code: "SD-LRK",
    name: "Larkana",
    provinceCode: "SD",
    population: 1524391,
    area: 1855,
    coordinates: { latitude: 27.559, longitude: 68.2121 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-SHK",
    name: "Shikarpur",
    provinceCode: "SD",
    population: 1231481,
    area: 2512,
    coordinates: { latitude: 27.9556, longitude: 68.6383 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-JCB",
    name: "Jacobabad",
    provinceCode: "SD",
    population: 1006297,
    area: 2771,
    coordinates: { latitude: 28.2769, longitude: 68.4514 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-KSH",
    name: "Kashmore",
    provinceCode: "SD",
    population: 1089169,
    area: 2551,
    coordinates: { latitude: 28.4317, longitude: 69.5836 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-GTK",
    name: "Ghotki",
    provinceCode: "SD",
    population: 1647239,
    area: 6506,
    coordinates: { latitude: 28.005, longitude: 69.3156 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-SKR",
    name: "Sukkur",
    provinceCode: "SD",
    population: 1487903,
    area: 5165,
    coordinates: { latitude: 27.705, longitude: 68.8578 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-KHP",
    name: "Khairpur",
    provinceCode: "SD",
    population: 2405523,
    area: 15910,
    coordinates: { latitude: 27.5295, longitude: 68.7592 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-NSW",
    name: "Nawabshah",
    provinceCode: "SD",
    population: 1265085,
    area: 4618,
    coordinates: { latitude: 26.2442, longitude: 68.41 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-SGR",
    name: "Sanghar",
    provinceCode: "SD",
    population: 2057057,
    area: 10726,
    coordinates: { latitude: 26.0467, longitude: 68.9481 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-MPK",
    name: "Mirpurkhas",
    provinceCode: "SD",
    population: 1505876,
    area: 2891,
    coordinates: { latitude: 25.5276, longitude: 69.0111 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-UMK",
    name: "Umerkot",
    provinceCode: "SD",
    population: 1073146,
    area: 5608,
    coordinates: { latitude: 25.3614, longitude: 69.7361 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-TPK",
    name: "Tharparkar",
    provinceCode: "SD",
    population: 1649661,
    area: 19638,
    coordinates: { latitude: 24.8742, longitude: 70.6469 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
  {
    code: "SD-BDN",
    name: "Badin",
    provinceCode: "SD",
    population: 1804516,
    area: 6726,
    coordinates: { latitude: 24.6559, longitude: 68.8377 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-THT",
    name: "Thatta",
    provinceCode: "SD",
    population: 979817,
    area: 17355,
    coordinates: { latitude: 24.7471, longitude: 67.9248 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-DDU",
    name: "Dadu",
    provinceCode: "SD",
    population: 1550266,
    area: 8034,
    coordinates: { latitude: 26.7308, longitude: 67.7756 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-JAM",
    name: "Jamshoro",
    provinceCode: "SD",
    population: 993142,
    area: 11517,
    coordinates: { latitude: 25.4297, longitude: 68.2811 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-HYD",
    name: "Hyderabad",
    provinceCode: "SD",
    population: 2199453,
    area: 1022,
    coordinates: { latitude: 25.396, longitude: 68.3578 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-MTR",
    name: "Matiari",
    provinceCode: "SD",
    population: 769349,
    area: 1516,
    coordinates: { latitude: 25.5974, longitude: 68.4467 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-TDA",
    name: "Tando Allahyar",
    provinceCode: "SD",
    population: 543630,
    area: 1573,
    coordinates: { latitude: 25.4608, longitude: 68.7194 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-TMK",
    name: "Tando Muhammad Khan",
    provinceCode: "SD",
    population: 677228,
    area: 1814,
    coordinates: { latitude: 25.1239, longitude: 68.5375 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "SD-NSF",
    name: "Naushahro Feroze",
    provinceCode: "SD",
    population: 1265085,
    area: 2945,
    coordinates: { latitude: 26.8419, longitude: 68.1225 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "SD-SBZ",
    name: "Shaheed Benazirabad",
    provinceCode: "SD",
    population: 1612847,
    area: 4502,
    coordinates: { latitude: 26.2442, longitude: 68.41 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },

  // ============================================
  // BALOCHISTAN DISTRICTS (7 districts)
  // ============================================
  {
    code: "BL-QTA",
    name: "Quetta",
    provinceCode: "BL",
    population: 2275699,
    area: 2653,
    coordinates: { latitude: 30.1798, longitude: 66.975 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "BL-NSB",
    name: "Nasirabad",
    provinceCode: "BL",
    population: 417806,
    area: 10994,
    coordinates: { latitude: 28.4728, longitude: 68.0361 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "BL-JFB",
    name: "Jafarabad",
    provinceCode: "BL",
    population: 513441,
    area: 2445,
    coordinates: { latitude: 28.2253, longitude: 68.3697 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "BL-SBI",
    name: "Sibi",
    provinceCode: "BL",
    population: 185000,
    area: 7796,
    coordinates: { latitude: 29.543, longitude: 67.8772 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "BL-KCH",
    name: "Kachhi",
    provinceCode: "BL",
    population: 412008,
    area: 7524,
    coordinates: { latitude: 28.6436, longitude: 67.9247 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "BL-ZHB",
    name: "Zhob",
    provinceCode: "BL",
    population: 314180,
    area: 15906,
    coordinates: { latitude: 31.3414, longitude: 69.4494 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
  {
    code: "BL-LRL",
    name: "Loralai",
    provinceCode: "BL",
    population: 397512,
    area: 9830,
    coordinates: { latitude: 30.3703, longitude: 68.5978 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
  {
    code: "BL-KLT",
    name: "Kalat",
    provinceCode: "BL",
    population: 412222,
    area: 6621,
    coordinates: { latitude: 29.0264, longitude: 66.5911 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
  {
    code: "BL-MKN",
    name: "Makran",
    provinceCode: "BL",
    population: 350000,
    area: 62538,
    coordinates: { latitude: 26.55, longitude: 63.98 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },

  // ============================================
  // KPK DISTRICTS (8 districts)
  // ============================================
  {
    code: "KP-PSH",
    name: "Peshawar",
    provinceCode: "KP",
    population: 4269079,
    area: 1257,
    coordinates: { latitude: 34.0151, longitude: 71.5249 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "KP-MRD",
    name: "Mardan",
    provinceCode: "KP",
    population: 2373061,
    area: 1632,
    coordinates: { latitude: 34.1958, longitude: 72.0447 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "KP-SWB",
    name: "Swabi",
    provinceCode: "KP",
    population: 1624581,
    area: 1543,
    coordinates: { latitude: 34.1201, longitude: 72.4697 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "KP-CHR",
    name: "Charsadda",
    provinceCode: "KP",
    population: 1616198,
    area: 996,
    coordinates: { latitude: 34.1483, longitude: 71.7408 },
    agriculturalZone: "high_productivity",
    isActive: true,
  },
  {
    code: "KP-NSH",
    name: "Nowshera",
    provinceCode: "KP",
    population: 1520820,
    area: 1748,
    coordinates: { latitude: 33.9994, longitude: 71.9828 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "KP-DIK",
    name: "Dera Ismail Khan",
    provinceCode: "KP",
    population: 1627453,
    area: 9334,
    coordinates: { latitude: 31.8324, longitude: 70.9017 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "KP-BNU",
    name: "Bannu",
    provinceCode: "KP",
    population: 1167892,
    area: 1227,
    coordinates: { latitude: 32.9889, longitude: 70.6056 },
    agriculturalZone: "medium_productivity",
    isActive: true,
  },
  {
    code: "KP-KHT",
    name: "Kohat",
    provinceCode: "KP",
    population: 993492,
    area: 2973,
    coordinates: { latitude: 33.5889, longitude: 71.4414 },
    agriculturalZone: "low_productivity",
    isActive: true,
  },
];


const seedDistricts = async () => {
  try {
    console.log(`starting District seeding...`);
    const provinces = await Province.find({});

    if (provinces.length === 0) {
      throw new Error("No provinces found! Please run province seed first.");
    }
    const provinceMap = {};
    provinces.forEach((province) => {
      provinceMap[province.code] = province._id;
    });

    console.log(`Found:${provinces.length} provinces.`);
    await District.deleteMany({});
    console.log("Cleared existing districts");

    // Load GeoJSON data
    let geoJsonData = null;
    try {
      const geoJsonPath = path.join(__dirname, 'data', 'PAK_adm3.json');
      console.log(`📂 Looking for GeoJSON at: ${geoJsonPath}`);
      const geoJsonContent = fs.readFileSync(geoJsonPath, 'utf8');
      geoJsonData = JSON.parse(geoJsonContent);
      console.log(`📍 Loaded ${geoJsonData.features.length} district geometries from GeoJSON`);
    } catch (error) {
      console.warn('⚠️  Could not load GeoJSON file, using fallback geometry:', error.message);
    }

    // Create a map of district names to geometry from GeoJSON
    const geometryMap = {};
    if (geoJsonData && geoJsonData.features) {
      geoJsonData.features.forEach(feature => {
        const districtName = feature.properties.NAME_3;
        if (districtName && feature.geometry) {
          // Store with lowercase key for case-insensitive matching
          const key = districtName.toLowerCase();

          // If this is a split district (e.g., "Gujranwala 1"), also map the base name
          const baseMatch = districtName.match(/^(.+?)\s+\d+$/);
          if (baseMatch) {
            const baseName = baseMatch[1].toLowerCase();
            // For split districts, use the first one found or merge if needed
            if (!geometryMap[baseName]) {
              geometryMap[baseName] = feature.geometry;
            }
          }

          // Store the exact name too
          geometryMap[key] = feature.geometry;
        }
      });

      console.log(`📊 Created geometry map with ${Object.keys(geometryMap).length} entries`);
    }

    // Add province ObjectId and real geometry
    const districtsWithProvinceId = districts.map((district) => {
      // Try to find matching geometry from GeoJSON
      const districtKey = district.name.toLowerCase();
      let geometry = geometryMap[districtKey];

      // If not found, try fuzzy matching (contains)
      if (!geometry) {
        const fuzzyKey = Object.keys(geometryMap).find(key =>
          key.includes(districtKey) || districtKey.includes(key)
        );
        if (fuzzyKey) {
          geometry = geometryMap[fuzzyKey];
          console.log(`🔍 Fuzzy matched "${district.name}" → "${fuzzyKey}"`);
        }
      }

      // Fallback: generate a simple square polygon if no GeoJSON match
      if (!geometry) {
        const { latitude, longitude } = district.coordinates;
        const offset = 0.15;
        geometry = {
          type: "Polygon",
          coordinates: [[
            [longitude - offset, latitude - offset],
            [longitude + offset, latitude - offset],
            [longitude + offset, latitude + offset],
            [longitude - offset, latitude + offset],
            [longitude - offset, latitude - offset]
          ]]
        };
        console.log(`⚠️  Using fallback geometry for: ${district.name}`);
      } else {
        console.log(`✅ Matched "${district.name}" with ${geometry.coordinates[0]?.length || 0} points`);
      }

      return {
        ...district,
        province: provinceMap[district.provinceCode],
        geometry
      };
    });

    // Insert districts
    const insertedDistricts = await District.insertMany(
      districtsWithProvinceId
    );

    console.log(` Successfully seeded ${insertedDistricts.length} districts`);

    // Display summary by province
    const summary = {};

    insertedDistricts.forEach((district) => {
      const province = provinces.find(
        (p) => p._id.toString() === district.province.toString()
      );

      if (!province) return; // safety

      if (!summary[province.code])
        summary[province.code] = {
          name: province.name,
          count: 0,
        };

      summary[province.code].count++;
    });

    console.log("\n📊 District Summary by Province:");
    Object.keys(summary).forEach((provinceCode) => {
      const provinceName = provinces.find((p) => p.code === provinceCode)?.name;
      console.log(
        `  - ${provinceName} (${provinceCode}): ${summary[provinceCode].count} districts`
      );
    });

    return insertedDistricts;
  } catch (error) {
    console.error(`❌ Error seeding districts: ${error.message}`);
    throw error;
  }
};

export default seedDistricts;

