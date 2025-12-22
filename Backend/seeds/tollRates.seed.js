// backend/seeds/tollRates.seed.js
import TollRate from "../models/tollRate.model.js";

const tollRatesData = [
    // ============ NATIONAL HIGHWAYS ============
    {
        routeId: "NH-N55",
        routeName: "National Highway - Kohat Tunnel",
        highwayType: "national",
        routeSegment: "Kohat Tunnel (N-55)",
        rates: {
            car: 200,
            wagon: 500,
            bus: 600,
            twoThreeAxleTruck: 600,
            articulatedTruck: 900,
        },
    },
    {
        routeId: "NH-N75-MDCW",
        routeName: "National Highway - MDCW (N-75)",
        highwayType: "national",
        routeSegment: "MDCW (N-75)",
        rates: {
            car: 200,
            wagon: 200,
            bus: 350,
            twoThreeAxleTruck: 400,
            articulatedTruck: 800,
        },
    },
    {
        routeId: "NH-N135-MIANWALI",
        routeName: "Mianwali-Muzaffargarh N-135 (Mianwali Plaza)",
        highwayType: "national",
        routeSegment: "Mianwali-Muzaffargarh N-135 (Mianwali)",
        tollPlaza: "Mianwali & Khusab Toll Plaza",
        rates: {
            car: 70,
            wagon: 150,
            bus: 250,
            twoThreeAxleTruck: 300,
            articulatedTruck: 550,
        },
    },
    {
        routeId: "NH-N135-FATEHPUR",
        routeName: "Mianwali-Muzaffargarh N-135 (Fatehpur Plaza)",
        highwayType: "national",
        routeSegment: "Mianwali-Muzaffargarh N-135 (Fatehpur)",
        tollPlaza: "Fatehpur & Channi Sahib Toll Plaza",
        rates: {
            car: 20,
            wagon: 30,
            bus: 60,
            twoThreeAxleTruck: 70,
            articulatedTruck: 150,
        },
    },

    // ============ MOTORWAYS ============
    {
        routeId: "MW-M1-ISB-PSH",
        routeName: "Islamabad-Peshawar Motorway M-1",
        highwayType: "motorway",
        routeSegment: "Islamabad - Peshawar M-1",
        rates: {
            car: 550,
            wagonUpto12Seater: 850,
            coasterMiniBus: 1150,
            bus: 1650,
            twoThreeAxleTruck: 2150,
            articulatedTruck: 2650,
        },
    },
    {
        routeId: "MW-M3-LAH-ABH",
        routeName: "Lahore-Abdul Hakeem Motorway M-3",
        highwayType: "motorway",
        routeSegment: "Lahore - Abdul Hakeem M-3",
        rates: {
            car: 800,
            wagonUpto12Seater: 1200,
            coasterMiniBus: 1750,
            bus: 2500,
            twoThreeAxleTruck: 3950,
            articulatedTruck: 3950,
        },
    },
    {
        routeId: "MW-M4-PBN-FSB",
        routeName: "Pindi Bhattian-Faisalabad-Multan Motorway M-4",
        highwayType: "motorway",
        routeSegment: "Pindi Bhattian - Faisalabad - Multan M-4",
        rates: {
            car: 1050,
            wagonUpto12Seater: 1550,
            coasterMiniBus: 2300,
            bus: 3200,
            twoThreeAxleTruck: 4200,
            articulatedTruck: 5150,
        },
    },
    {
        routeId: "MW-M5-MLT-SUK",
        routeName: "Multan-Sukkur Motorway M-5",
        highwayType: "motorway",
        routeSegment: "Multan - Sukkur M-5",
        rates: {
            car: 1200,
            wagonUpto12Seater: 1750,
            coasterMiniBus: 2550,
            bus: 3650,
            twoThreeAxleTruck: 4700,
            articulatedTruck: 5750,
        },
    },
    {
        routeId: "MW-M14-DIK-HKL",
        routeName: "D.I Khan-Hakla Motorway M-14",
        highwayType: "motorway",
        routeSegment: "D.I Khan - Hakla M-14",
        rates: {
            car: 650,
            wagonUpto12Seater: 1100,
            coasterMiniBus: 1450,
            bus: 2200,
            twoThreeAxleTruck: 2800,
            articulatedTruck: 3350,
        },
    },
    {
        routeId: "MW-E35-HAS-HVN-MAN",
        routeName: "Hassanabdal-Havelian-Mansehra Expressway E-35",
        highwayType: "motorway",
        routeSegment: "Hassanabdal - Havelian - Mansehra E-35",
        rates: {
            car: 300,
            wagonUpto12Seater: 450,
            coasterMiniBus: 600,
            bus: 900,
            twoThreeAxleTruck: 1150,
            articulatedTruck: 1400,
        },
    },
];

export const seedTollRates = async () => {
    try {
        console.log("[Seed] Seeding toll rates...");

        // Clear existing
        await TollRate.deleteMany({});

        // Insert new
        await TollRate.insertMany(tollRatesData);

        console.log(`[Seed] Inserted ${tollRatesData.length} toll rates.`);
        return { success: true, count: tollRatesData.length };
    } catch (error) {
        console.error("[Seed] Toll rates seeding failed:", error);
        throw error;
    }
};

export default seedTollRates;
