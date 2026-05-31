/**
 * cropconnect-price-scraper.js
 *
 * Scrapes Wheat, Rice, Cotton prices from amis.pk and saves to CropConnect.
 *
 * Usage:
 *   node cropconnect-price-scraper.js              # save prices
 *   node cropconnect-price-scraper.js --dry-run    # preview, don't save
 *   node cropconnect-price-scraper.js --debug      # dump raw HTML + parse attempt
 */

import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

const API_URL   = process.env.CROPCONNECT_API_URL || "http://localhost:3000/api";
const API_TOKEN = process.env.SCRAPER_API_TOKEN   || "";
const DRY_RUN   = process.argv.includes("--dry-run");
const DEBUG     = process.argv.includes("--debug");

// ─── COMMODITY CONFIG ────────────────────────────────────────────────────────

const COMMODITIES = [
    { amisId: 1,  cropId: process.env.CROP_ID_WHEAT,  name: "Wheat",  unit: "40kg" },
    { amisId: 4,  cropId: process.env.CROP_ID_RICE,   name: "Rice",   unit: "40kg" },
    { amisId: 21, cropId: process.env.CROP_ID_COTTON, name: "Cotton", unit: "40kg" },
];

const DISTRICT_MAP = {
    "Lahore":     process.env.DIST_ID_LAHORE,
    "Faisalabad": process.env.DIST_ID_FAISALABAD,
    "Multan":     process.env.DIST_ID_MULTAN,
    "Peshawar":   process.env.DIST_ID_PESHAWAR,
    "Quetta":     process.env.DIST_ID_QUETTA,
    "Hyderabad":  process.env.DIST_ID_HYDERABAD,
};

// ─── HTTP FETCH ──────────────────────────────────────────────────────────────

async function fetchHtml(amisId) {
    // MUST use http:// — amis.pk HTTPS cert is broken (EPROTO error)
    const url = `http://www.amis.pk/Printer.aspx?searchType=0&commodityId=${amisId}`;

    const response = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "identity",   // disable compression — avoid encoding issues
            "Connection": "keep-alive",
            "Referer": "http://www.amis.pk/BrowsePrices.aspx?searchType=0",
            "Cache-Control": "no-cache",
        },
        timeout: 25000,
        // Get raw bytes, decode manually — amis.pk may serve Windows-1252
        responseType: "arraybuffer",
    });

    // Try UTF-8 first, then latin1 (covers Windows-1252)
    let html = Buffer.from(response.data).toString("utf8");
    if (html.includes("charset=windows-1252") || html.includes("charset=iso-8859")) {
        html = Buffer.from(response.data).toString("latin1");
    }

    return html;
}

// ─── PARSER — Multiple strategies ────────────────────────────────────────────

/**
 * Strategy 1: Standard cheerio table parse.
 * Works if amis.pk returns well-formed HTML.
 * Table: City(td0) | Graph(td1) | Min(td2) | Max(td3) | FQP(td4) | Arrival(td5)
 */
function parseStrategy1(html) {
    const $ = cheerio.load(html);
    const rows = [];

    $("table tr").each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length < 5) return;

        const city = $(cells[0]).text().trim();
        const fqp  = $(cells[4]).text().trim();

        if (!city || !fqp || fqp === "-" || fqp === "") return;
        // Skip header row
        if (city.toLowerCase().includes("pricedate") || city === "Graph") return;

        const price = parseFloat(fqp.replace(/,/g, ""));
        if (isNaN(price) || price <= 0) return;

        rows.push({
            city,
            min:   parseFloat($(cells[2]).text().replace(/,/g, "")) || price,
            max:   parseFloat($(cells[3]).text().replace(/,/g, "")) || price,
            price,
        });
    });

    return rows;
}

/**
 * Strategy 2: Regex fallback — extracts city+prices directly from raw HTML.
 * Handles malformed tables, bad encoding, or broken tags.
 *
 * amis.pk rows look like:
 *   <a href="Printer.aspx?searchType=1&commodityId=1">Lahore</a> ... 14000 ... 14500 ... 14250 ...
 */
function parseStrategy2(html) {
    const rows = [];

    // Match each anchor with a district-link href followed by 3 numbers (min, max, fqp)
    // commodityId in the href here refers to district IDs (searchType=1)
    const rowPattern = /searchType=1&(?:amp;)?commodityId=\d+[^>]*>([^<]+)<\/a>[\s\S]*?<td[^>]*>([\d,]+)<\/td>\s*<td[^>]*>([\d,]+)<\/td>\s*<td[^>]*>([\d,]+)<\/td>/gi;

    let match;
    while ((match = rowPattern.exec(html)) !== null) {
        const city  = match[1].trim();
        const min   = parseFloat(match[2].replace(/,/g, ""));
        const max   = parseFloat(match[3].replace(/,/g, ""));
        const price = parseFloat(match[4].replace(/,/g, "")); // FQP is the 3rd number

        if (!city || isNaN(price) || price <= 0) continue;
        rows.push({ city, min, max, price });
    }

    return rows;
}

/**
 * Strategy 3: Line-by-line scan.
 * Finds city names from href links, then finds the next 3 numbers on nearby lines.
 */
function parseStrategy3(html) {
    const rows = [];

    // Extract all city anchor tags
    const cityPattern = /searchType=1&(?:amp;)?commodityId=(\d+)[^>]*>([A-Za-z][A-Za-z\s]+?)<\/a>/gi;
    const cityMatches = [...html.matchAll(cityPattern)];

    for (const cm of cityMatches) {
        const city = cm[2].trim();
        const pos  = cm.index;

        // Look ahead 300 chars for numbers in <td> cells
        const region = html.slice(pos, pos + 400);
        const nums   = [...region.matchAll(/<td[^>]*>([\d,]+)<\/td>/gi)]
            .map(m => parseFloat(m[1].replace(/,/g, "")))
            .filter(n => !isNaN(n) && n > 0);

        if (nums.length >= 3) {
            // amis.pk column order after city: graph, min, max, fqp
            rows.push({ city, min: nums[0], max: nums[1], price: nums[2] });
        }
    }

    return rows;
}

async function fetchCommodityPrices(amisId, name) {
    const html = await fetchHtml(amisId);

    if (DEBUG) {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`DEBUG: Raw HTML for ${name} (amisId=${amisId})`);
        console.log(`${"─".repeat(60)}`);
        console.log(html.substring(0, 2000));
        console.log("...(truncated)");
    }

    // Try all 3 strategies, use whichever returns data
    let rows = parseStrategy1(html);
    if (DEBUG) console.log(`\nStrategy 1 (cheerio table): ${rows.length} rows`);

    if (rows.length === 0) {
        rows = parseStrategy2(html);
        if (DEBUG) console.log(`Strategy 2 (regex row): ${rows.length} rows`);
    }

    if (rows.length === 0) {
        rows = parseStrategy3(html);
        if (DEBUG) console.log(`Strategy 3 (line scan): ${rows.length} rows`);
    }

    if (DEBUG && rows.length > 0) {
        console.log("\nParsed rows (first 5):");
        rows.slice(0, 5).forEach(r =>
            console.log(`  ${r.city.padEnd(16)} min=${r.min} max=${r.max} fqp=${r.price}`)
        );
    }

    return rows;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\n🌾 CropConnect Price Scraper — ${new Date().toISOString()}`);
    console.log(`   Source: amis.pk (Punjab AMIS)`);
    if (DEBUG)   console.log("   Mode  : DEBUG");
    else if (DRY_RUN) console.log("   Mode  : DRY RUN — nothing will be saved");
    else         console.log(`   Target: ${API_URL}`);
    console.log();

    const today   = new Date();
    const records = [];
    const preview = [];

    for (const commodity of COMMODITIES) {
        if (!commodity.cropId) {
            console.log(`   ⚠️  ${commodity.name.padEnd(10)} — CROP_ID not in .env, skipping`);
            continue;
        }

        process.stdout.write(`   Fetching ${commodity.name.padEnd(10)} (amisId=${commodity.amisId}) ... `);

        try {
            const cityRows = await fetchCommodityPrices(commodity.amisId, commodity.name);
            let matched = 0;

            for (const row of cityRows) {
                const districtId = DISTRICT_MAP[row.city];

                preview.push({
                    crop:      commodity.name,
                    city:      row.city,
                    "min PKR": row.min,
                    "max PKR": row.max,
                    "fqp PKR": row.price,
                    saved:     districtId ? "✅" : "—",
                });

                if (!districtId) continue;

                records.push({
                    cropType:   commodity.cropId,
                    district:   districtId,
                    price:      Math.round(row.price),
                    unit:       commodity.unit,
                    marketType: "Wholesale",
                    source:     "amis.pk",
                    date:       today,
                });
                matched++;
            }

            console.log(`${cityRows.length} cities scraped | ${matched} matched your districts`);
            await new Promise(r => setTimeout(r, 700));

        } catch (err) {
            console.log(`FAILED — ${err.message}`);
            if (DEBUG) console.error(err.stack);
        }
    }

    // Deduplicate: one entry per crop+district per day
    const seen    = new Set();
    const deduped = records.filter(r => {
        const key = `${r.cropType}:${r.district}:${today.toDateString()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`\n📊 Total scraped: ${preview.length}  |  Ready to save: ${deduped.length}`);

    if (DEBUG || DRY_RUN) {
        const yourRows   = preview.filter(r => r.saved === "✅");
        const otherRows  = preview.filter(r => r.saved === "—").slice(0, 8);

        if (yourRows.length > 0) {
            console.log("\n── Your districts (will be saved) ─────────────────────");
            console.table(yourRows);
        }
        if (otherRows.length > 0) {
            console.log("\n── Other cities scraped (not saved — add DIST_ID_* to save) ──");
            console.table(otherRows);
        }

        if (preview.length === 0) {
            console.log("\n⚠️  0 rows parsed. Run with --debug to see the raw HTML from amis.pk.");
            console.log("   This usually means:");
            console.log("   1. amis.pk blocked the request (try adding a cookie or session header)");
            console.log("   2. The table structure changed — check --debug output");
        }

        if (DRY_RUN) {
            console.log("\nRemove --dry-run to save to CropConnect.");
            return;
        }
    }

    if (!DRY_RUN && deduped.length > 0) {
        console.log(`\n💾 Saving ${deduped.length} records...`);
        let saved = 0, failed = 0;

        for (const record of deduped) {
            try {
                await axios.post(`${API_URL}/market/prices`, record, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${API_TOKEN}`,
                    },
                    timeout: 10000,
                });
                saved++;
                process.stdout.write(".");
            } catch (err) {
                failed++;
                process.stdout.write("x");
                if (DEBUG) console.error(`\n   ❌ ${err.response?.data?.message || err.message}`);
            }
        }
        console.log(`\n\n✅ Done — Saved: ${saved}  |  Failed: ${failed}`);
        if (failed > 0) console.log("   Re-run with --debug to diagnose failures.");
    } else if (!DRY_RUN) {
        console.log("⚠️  Nothing to save.");
    }
}

main().catch(err => {
    console.error("\n💥 Fatal:", err.message);
    process.exit(1);
});