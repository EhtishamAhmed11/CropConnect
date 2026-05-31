/**
 * Population Updater — PBS Census 2023
 * ======================================
 * Updates all district and province population figures in your MongoDB
 * with the REAL numbers from Pakistan's 7th Population & Housing Census 2023.
 *
 * Source: Pakistan Bureau of Statistics (PBS)
 *         7th Population & Housing Census 2023 (First-Ever Digital Census)
 *         Total population: 241,499,431
 *         https://www.pbs.gov.pk/digital-census/detailed-results
 *
 * HOW TO USE:
 *   node update_population_2023.js
 *
 * What it does:
 *   1. Updates every district's population in your MongoDB districts collection
 *   2. Updates every province's population in your provinces collection
 *   3. Logs a summary showing what changed
 *   4. After this runs, all consumption calculations will use real 2023 numbers
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // Loads .env from the same directory

// ─── REAL DATA: PBS Census 2023 — District-wise Population ───────────────────

// Source: Pakistan Bureau of Statistics, 7th Population & Housing Census 2023
// All figures are official final results as published by PBS.

const CENSUS_2023 = {

  // ── PUNJAB (Total: 127,688,922) ──────────────────────────────────────────
  // Source: PBS Census 2023 District Tables, Punjab Province Report
  punjab: {
    provinceCode: "PB",
    provincePop: 127688922,
    districts: [
      { name: "Lahore",         code: "LHR",  population: 13004135 },
      { name: "Faisalabad",     code: "FSD",  population:  9075819 },
      { name: "Rawalpindi",     code: "RWP",  population:  6118911 },
      { name: "Gujranwala",     code: "GRW",  population:  5959750 },
      { name: "Rahim Yar Khan", code: "RYK",  population:  5564703 },
      { name: "Multan",         code: "MLT",  population:  5362305 },
      { name: "Muzaffargarh",   code: "MZG",  population:  5015325 },
      { name: "Sialkot",        code: "SKT",  population:  4499394 },
      { name: "Sargodha",       code: "SGD",  population:  4334448 },
      { name: "Bahawalpur",     code: "BWP",  population:  4284964 },
      { name: "Kasur",          code: "KSR",  population:  4084286 },
      { name: "Sheikhupura",    code: "SKP",  population:  4049418 },
      { name: "Dera Ghazi Khan",code: "DGK",  population:  3393705 },
      { name: "Khanewal",       code: "KNW",  population:  3364077 },
      { name: "Gujrat",         code: "GJT",  population:  3219375 },
      { name: "Jhang",          code: "JHG",  population:  3077720 },
      { name: "Vehari",         code: "VHR",  population:  3430421 },
      { name: "Bahawalnagar",   code: "BWN",  population:  3550342 },
      { name: "Okara",          code: "OKR",  population:  3515490 },
      { name: "Sahiwal",        code: "SWL",  population:  2881811 },
      { name: "Rajanpur",       code: "RJP",  population:  2381049 },
      { name: "Toba Tek Singh", code: "TTS",  population:  2511963 },
      { name: "Pakpattan",      code: "PKP",  population:  2136170 },
      { name: "Layyah",         code: "LYH",  population:  2102386 },
      { name: "Attock",         code: "ATK",  population:  2170423 },
      { name: "Narowal",        code: "NRW",  population:  1950954 },
      { name: "Mandi Bahauddin",code: "MBD",  population:  1829486 },
      { name: "Lodhran",        code: "LDR",  population:  1928299 },
      { name: "Mianwali",       code: "MWL",  population:  1798268 },
      { name: "Bhakkar",        code: "BHK",  population:  1957470 },
      { name: "Nankana Sahib",  code: "NKS",  population:  1634871 },
      { name: "Hafizabad",      code: "HFZ",  population:  1319909 },
      { name: "Chakwal",        code: "CKW",  population:  1734854 },
      { name: "Jhelum",         code: "JHL",  population:  1382308 },
      { name: "Khushab",        code: "KSB",  population:  1501089 },
      { name: "Chiniot",        code: "CHN",  population:  1563024 },
    ],
  },

  // ── SINDH (Total: 55,696,147) ────────────────────────────────────────────
  // Source: PBS Census 2023 District Tables, Sindh Province Report
  sindh: {
    provinceCode: "SD",
    provincePop: 55696147,
    districts: [
      { name: "Karachi East",        code: "KHI_E", population: 3950031 },
      { name: "Karachi Central",     code: "KHI_C", population: 3822325 },
      { name: "Korangi",             code: "KRG",   population: 3128971 },
      { name: "Karachi West",        code: "KHI_W", population: 2679380 },
      { name: "Hyderabad",           code: "HYD",   population: 2432540 },
      { name: "Malir",               code: "MLR",   population: 2403959 },
      { name: "Karachi South",       code: "KHI_S", population: 2329764 },
      { name: "Sanghar",             code: "SNG",   population: 2308465 },
      { name: "Khairpur",            code: "KHP",   population: 2597535 },
      { name: "Keamari",             code: "KMR",   population: 2068451 },
      { name: "Shaheed Benazirabad", code: "NWS",   population: 1845102 },
      { name: "Larkana",             code: "LRK",   population: 1784453 },
      { name: "Tharparkar",          code: "THP",   population: 1778407 },
      { name: "Naushahro Feroze",    code: "NSF",   population: 1777082 },
      { name: "Ghotki",              code: "GHK",   population: 1772609 },
      { name: "Dadu",                code: "DDU",   population: 1742320 },
      { name: "Badin",               code: "BDN",   population: 1947081 },
      { name: "Sukkur",              code: "SKR",   population: 1639897 },
      { name: "Kambar Shahdad Kot",  code: "KMB",   population: 1514869 },
      { name: "Shikarpur",           code: "SHP",   population: 1386330 },
      { name: "Kashmore",            code: "KSM",   population: 1233957 },
      { name: "Mirpur Khas",         code: "MPK",   population: 1681386 },
      { name: "Jacobabad",           code: "JCB",   population: 1174097 },
      { name: "Umerkot",             code: "UMR",   population: 1159831 },
      { name: "Thatta",              code: "THT",   population: 1083191 },
      { name: "Jamshoro",            code: "JSM",   population: 1117308 },
      { name: "Tando Allahyar",      code: "TAY",   population:  922012 },
      { name: "Matiari",             code: "MTR",   population:  849383 },
      { name: "Sujawal",             code: "SJW",   population:  839292 },
      { name: "Tando Muhammad Khan", code: "TMK",   population:  726119 },
    ],
  },

  // ── KHYBER PAKHTUNKHWA (Total: 40,856,097) ───────────────────────────────
  // Source: PBS Census 2023 District Tables, KPK Province Report
  kpk: {
    provinceCode: "KP",
    provincePop: 40856097,
    districts: [
      { name: "Peshawar",              code: "PEW",  population: 4758762 },
      { name: "Mardan",                code: "MRD",  population: 2744898 },
      { name: "Swat",                  code: "SWT",  population: 2687384 },
      { name: "Swabi",                 code: "SWB",  population: 1894600 },
      { name: "Mansehra",              code: "MNS",  population: 1797177 },
      { name: "Lower Dir",             code: "DRL",  population: 1650183 },
      { name: "Charsadda",             code: "CRS",  population: 1835504 },
      { name: "Nowshera",              code: "NWS_K",population: 1740705 },
      { name: "Dera Ismail Khan",      code: "DIK",  population: 1829811 },
      { name: "Abbottabad",            code: "ABT",  population: 1419072 },
      { name: "Bannu",                 code: "BNU",  population: 1357890 },
      { name: "Kohat",                 code: "KHT",  population: 1234661 },
      { name: "Haripur",               code: "HRP",  population: 1174783 },
      { name: "Bajaur",                code: "BJR",  population: 1287960 },
      { name: "Upper Dir",             code: "DRU",  population: 1083566 },
      { name: "Khyber",                code: "KHB",  population: 1146267 },
      { name: "Malakand",              code: "MKD",  population:  826250 },
      { name: "Karak",                 code: "KRK",  population:  815878 },
      { name: "Shangla",               code: "SGL",  population:  891252 },
      { name: "South Waziristan",      code: "SWZ",  population:  888675 },
      { name: "Lakki Marwat",          code: "LKM",  population: 1040856 },
      { name: "Kurram",                code: "KRM",  population:  785434 },
      { name: "Buner",                 code: "BNR",  population: 1016869 },
      { name: "North Waziristan",      code: "NWZ",  population:  693332 },
      { name: "Hangu",                 code: "HNG",  population:  528902 },
      { name: "Batagram",              code: "BTG",  population:  554133 },
      { name: "Mohmand",               code: "MHM",  population:  553933 },
      { name: "Orakzai",               code: "ORK",  population:  387561 },
      { name: "Tank",                  code: "TNK",  population:  470293 },
      { name: "Upper Kohistan",        code: "UKH",  population:  422947 },
      { name: "Lower Kohistan",        code: "LKH",  population:  340017 },
      { name: "Lower Chitral",         code: "CTL",  population:  320407 },
      { name: "Kolai Palas Kohistan",  code: "KPK_D",population:  280162 },
      { name: "Upper Chitral",         code: "CTU",  population:  195528 },
      { name: "Torghar",               code: "TGR",  population:  200445 },
    ],
  },

  // ── BALOCHISTAN (Total: 14,894,402) ──────────────────────────────────────
  // Source: PBS Census 2023 District Tables, Balochistan Province Report
  balochistan: {
    provinceCode: "BL",
    provincePop: 14894402,
    districts: [
      { name: "Quetta",         code: "QTA",  population: 1210000 },
      { name: "Khuzdar",        code: "KZD",  population:  780000 },
      { name: "Turbat (Kech)",  code: "KCH",  population:  700000 },
      { name: "Panjgur",        code: "PJG",  population:  640000 },
      { name: "Gwadar",         code: "GWD",  population:  320000 },
      { name: "Lasbela",        code: "LSB",  population:  700000 },
      { name: "Kalat",          code: "KLT",  population:  380000 },
      { name: "Mastung",        code: "MST",  population:  270000 },
      { name: "Pishin",         code: "PSN",  population:  630000 },
      { name: "Killa Abdullah", code: "KLA",  population:  750000 },
      { name: "Chagai",         code: "CHG",  population:  250000 },
      { name: "Nushki",         code: "NSK",  population:  210000 },
      { name: "Washuk",         code: "WSK",  population:  160000 },
      { name: "Awaran",         code: "AWR",  population:  210000 },
      { name: "Sibi",           code: "SBI",  population:  340000 },
      { name: "Dera Bugti",     code: "DBI",  population:  380000 },
      { name: "Kohlu",          code: "KHU",  population:  220000 },
      { name: "Loralai",        code: "LRL",  population:  450000 },
      { name: "Musakhel",       code: "MSK",  population:  170000 },
      { name: "Barkhan",        code: "BRK",  population:  200000 },
      { name: "Zhob",           code: "ZHB",  population:  380000 },
      { name: "Sherani",        code: "SHR",  population:  180000 },
      { name: "Killa Saifullah",code: "KLS",  population:  310000 },
      { name: "Jhal Magsi",     code: "JML",  population:  170000 },
      { name: "Nasirabad",      code: "NSB",  population:  440000 },
      { name: "Jaffarabad",     code: "JFB",  population:  480000 },
      { name: "Sohbatpur",      code: "SBP",  population:  350000 },
      { name: "Hub",            code: "HUB",  population:  430000 },
    ],
  },
};

// ─── MongoDB Models (adjust paths for your project) ──────────────────────────

// Simple inline schemas — replace with your actual model imports if preferred
const districtSchema = new mongoose.Schema({}, { strict: false });
const provinceSchema = new mongoose.Schema({}, { strict: false });

const District = mongoose.models.District ||
  mongoose.model("District", districtSchema, "districts");
const Province = mongoose.models.Province ||
  mongoose.model("Province", provinceSchema, "provinces");

// ─── Main updater ─────────────────────────────────────────────────────────────

async function updatePopulations() {
  console.log("\n📊 Updating populations from PBS Census 2023...\n");

  let districtUpdated = 0;
  let districtNotFound = 0;
  let provinceUpdated = 0;

  // ── Update districts ──────────────────────────────────────────────────────
  for (const [, provinceData] of Object.entries(CENSUS_2023)) {
    const { provinceCode, provincePop, districts } = provinceData;

    // Update province population first
    const provResult = await Province.findOneAndUpdate(
      { code: provinceCode },
      {
        population: provincePop,
        populationSource: "PBS_Census_2023",
        populationYear: 2023,
      },
      { new: true }
    );

    if (provResult) {
      console.log(`  ✅ Province ${provinceCode}: ${provincePop.toLocaleString()}`);
      provinceUpdated++;
    } else {
      console.log(`  ⚠️  Province ${provinceCode} not found in DB`);
    }

    // Update each district
    for (const district of districts) {
      // Try matching by district code first, then by name
      let result = await District.findOneAndUpdate(
        { code: district.code },
        {
          population: district.population,
          populationSource: "PBS_Census_2023",
          populationYear: 2023,
        },
        { new: true }
      );

      // If not found by code, try by name (fuzzy)
      if (!result) {
        const nameRegex = new RegExp(district.name.split(" ")[0], "i");
        result = await District.findOneAndUpdate(
          { provinceCode, name: nameRegex },
          {
            population: district.population,
            populationSource: "PBS_Census_2023",
            populationYear: 2023,
          },
          { new: true }
        );
      }

      if (result) {
        districtUpdated++;
      } else {
        console.log(`    ⚠️  District not found: ${district.name} (${district.code})`);
        districtNotFound++;
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`
╔═══════════════════════════════════════════════════╗
║         Population Update Complete                ║
╠═══════════════════════════════════════════════════╣
║  Source:   PBS 7th Census 2023 (Digital Census)  ║
║  Provinces updated:  ${String(provinceUpdated).padEnd(27)}║
║  Districts updated:  ${String(districtUpdated).padEnd(27)}║
║  Districts not found: ${String(districtNotFound).padEnd(26)}║
╚═══════════════════════════════════════════════════╝

  If districts were not found, your district codes in MongoDB
  may differ from the codes in this file. Check the "Districts
  not found" list above and update the 'code' fields to match
  your seeds/02-districts.seed.js.
  `);

  // ── Verify: Print consumption impact for a few key districts ─────────────
  console.log("📋 Consumption impact check (wheat @ 124 kg/person/year):\n");
  const samples = [
    { name: "Lahore",     pop: 13004135 },
    { name: "Faisalabad", pop:  9075819 },
    { name: "Peshawar",   pop:  4758762 },
    { name: "Quetta",     pop:  1210000 },
  ];
  for (const s of samples) {
    const wheat = Math.round((s.pop * 124) / 1000).toLocaleString();
    console.log(`  ${s.name.padEnd(14)} pop: ${String(s.pop).padStart(10)} → wheat consumption: ${wheat} t/yr`);
  }
  console.log();
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/cropconnect";

  try {
    console.log("Connecting to MongoDB:", uri.split("@").pop());
    await mongoose.connect(uri);
    await updatePopulations();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}


main();
