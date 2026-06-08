import axios from "axios";
import * as cheerio from "cheerio";
import MarketPrice from "../models/marketPrice.model.js";
import CropType from "../models/cropType.model.js";
import District from "../models/district.model.js";
import DataIngestionLog from "../models/dataIngestionLog.model.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const TARGET_CROPS = ["Wheat", "Rice", "Cotton"];

// Multiple URLs to try in order — if one fails, we try the next
// Add or reorder these as you discover working sources
const SCRAPE_URLS = [
    "https://www.kissan.pk/commodity-prices",
    "https://www.kissan.pk/market-prices",
    "https://www.kissan.pk/crop-prices",
    "https://kissan.pk/prices",
];

const REQUEST_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Cache-Control": "no-cache",
};

// ─── Government MSP Prices (2024-25 season) ───────────────────────────────────
//
// PKR per 40kg (one maund).
// Source: Pakistan Ministry of National Food Security & Research
// Update these numbers each season as government announces new MSP.
//
// These are used in TWO ways:
//   1. As full fallback when scraping fails completely
//   2. As the base price for any district that has NO scraped price history
//      (fixes the "205 skipped" problem — every district now has a base price)

export const MSP_PRICES = {
    Wheat: 3900,   // PKR/40kg — 2024-25 official support price
    Rice: 4200,   // PKR/40kg — IRRI-6 benchmark
    Cotton: 8500,   // PKR/40kg — seed cotton
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(raw) {
    if (!raw) return null;
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function normalizeCropName(raw) {
    const lower = raw.toLowerCase().trim();
    if (lower.includes("wheat")) return "Wheat";
    if (lower.includes("rice") || lower.includes("paddy")) return "Rice";
    if (lower.includes("cotton")) return "Cotton";
    return null;
}

function normalizeUnit(raw = "") {
    if (raw.includes("40kg") || raw.toLowerCase().includes("maund")) return "40kg";
    if (raw.includes("kg")) return "kg";
    return "40kg";
}

// ─── Scraper — tries multiple URLs ───────────────────────────────────────────

/**
 * Try each URL in SCRAPE_URLS until one works.
 * Tries multiple CSS selector patterns per page so minor HTML changes
 * don't break the whole scraper.
 */
async function scrapeWithFallbackUrls() {
    let lastError = null;

    for (const url of SCRAPE_URLS) {
        try {
            console.log(`[MarketScraper] Trying: ${url}`);
            const response = await axios.get(url, {
                headers: REQUEST_HEADERS,
                timeout: 15000,
            });

            const rows = parseHtmlForPrices(response.data);
            if (rows.length > 0) {
                console.log(`[MarketScraper] Got ${rows.length} rows from ${url}`);
                return rows;
            }

            console.log(`[MarketScraper] ${url} returned 200 but no parseable rows — trying next`);
        } catch (err) {
            console.warn(`[MarketScraper] ${url} failed: ${err.message}`);
            lastError = err;
        }
    }

    // All URLs failed
    throw lastError || new Error("All scrape URLs failed");
}

/**
 * Parse the HTML from any kissan.pk-style page.
 * Tries multiple selector patterns — whichever matches first wins.
 */
function parseHtmlForPrices(html) {
    const $ = cheerio.load(html);
    const results = [];

    // Selector patterns to try — covers different kissan.pk layouts
    const selectorPatterns = [
        "table.price-table tbody tr",
        "table.commodities tbody tr",
        ".prices-table tbody tr",
        "table tbody tr",
        ".price-row",
    ];

    for (const selector of selectorPatterns) {
        const rows = $(selector);
        if (rows.length === 0) continue;

        rows.each((_, row) => {
            const cells = $(row).find("td");
            if (cells.length < 3) return;

            const rawCrop = $(cells[0]).text().trim();
            const rawDistrict = $(cells[1]).text().trim();
            const rawPrice = $(cells[2]).text().trim();
            const rawUnit = $(cells[3])?.text().trim() || "";

            const cropName = normalizeCropName(rawCrop);
            if (!cropName) return;

            const price = parsePrice(rawPrice);
            if (!price || price <= 0) return;

            results.push({
                cropName,
                districtName: rawDistrict,
                price,
                unit: normalizeUnit(rawUnit),
            });
        });

        if (results.length > 0) break; // found rows — stop trying selectors
    }

    return results;
}

// ─── Fallback: MSP for ALL districts ─────────────────────────────────────────

/**
 * When scraping completely fails, seed MSP prices for every district
 * currently in the database. This ensures the forecaster has a base
 * price for every crop × district combination.
 *
 * Previously only 6 cities were hardcoded — that caused 205 skips.
 * Now we dynamically load all districts from DB.
 */
async function getFallbackPricesForAllDistricts() {
    const districts = await District.find({}).select("name");
    const rows = [];

    for (const district of districts) {
        for (const [cropName, price] of Object.entries(MSP_PRICES)) {
            rows.push({
                cropName,
                districtName: district.name,
                price,
                unit: "40kg",
                isFallback: true,
            });
        }
    }

    console.log(`[MarketScraper] Built MSP fallback for ${districts.length} districts × ${Object.keys(MSP_PRICES).length} crops = ${rows.length} rows`);
    return rows;
}

// ─── DB Save ──────────────────────────────────────────────────────────────────

async function saveScrapedPrices(scrapedRows) {
    const cropDocs = await CropType.find({ name: { $in: TARGET_CROPS } }).select("_id name");
    const districtDocs = await District.find({}).select("_id name");

    const cropMap = Object.fromEntries(cropDocs.map(c => [c.name.toLowerCase(), c._id]));
    const districtMap = Object.fromEntries(districtDocs.map(d => [d.name.toLowerCase(), d._id]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let saved = 0;
    let skipped = 0;

    for (const row of scrapedRows) {
        const cropId = cropMap[row.cropName.toLowerCase()];
        const districtId = districtMap[row.districtName.toLowerCase()];

        if (!cropId || !districtId) {
            skipped++;
            continue;
        }

        // Skip if we already saved a price for this crop+district today
        const exists = await MarketPrice.findOne({
            cropType: cropId,
            district: districtId,
            date: { $gte: today },
        });

        if (exists) {
            skipped++;
            continue;
        }

        await MarketPrice.create({
            cropType: cropId,
            district: districtId,
            price: row.price,
            unit: row.unit,
            marketType: "Wholesale",
            currency: "PKR",
            source: row.isFallback ? "MSP_Fallback" : "kissan.pk",
            date: new Date(),
        });

        saved++;
    }

    return { saved, skipped };
}

// ─── Exported Main Function ───────────────────────────────────────────────────

export async function runMarketScraper() {
    const startTime = Date.now();
    let status = "success";
    let errorMsg = null;
    let rows = [];
    let usedFallback = false;

    console.log("[MarketScraper] Starting market price scrape...");

    try {
        rows = await scrapeWithFallbackUrls();
    } catch (err) {
        console.warn(`[MarketScraper] All URLs failed: ${err.message}. Using MSP fallback for all districts.`);
        rows = await getFallbackPricesForAllDistricts();
        usedFallback = true;
        status = "partial";
        errorMsg = err.message;
    }

    const filtered = rows.filter(r => TARGET_CROPS.includes(r.cropName));
    const { saved, skipped } = await saveScrapedPrices(filtered);

    console.log(
        `[MarketScraper] Done. Saved: ${saved}, Skipped (dup/unknown): ${skipped}` +
        (usedFallback ? " [MSP FALLBACK]" : "")
    );

    await DataIngestionLog.create({
        source: usedFallback ? "MSP_Fallback" : "kissan.pk",
        type: "market_price_scrape",
        status,
        recordsAdded: saved,
        errorMessage: errorMsg,
        duration: Date.now() - startTime,
        initiatedBy: "scheduler",
    }).catch(() => { });

    return { saved, skipped, usedFallback };
}