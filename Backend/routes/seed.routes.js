import express from "express";
import seedSurplusDeficit from "../seeds/04-surplusDeficit.seed.js";
import seed2024Data from "../seeds/2024_25_data.seed.js";

const router = express.Router();

// Seed surplus/deficit data
router.post("/seed-surplus-deficit", async (req, res) => {
    try {
        console.log("🌾 Starting Surplus/Deficit Seeding via API...");
        const result = await seedSurplusDeficit();
        res.json({
            success: true,
            message: "Surplus/Deficit data seeded successfully",
            count: result.length,
        });
    } catch (error) {
        console.error("Error seeding:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Seed 2024-25 data
router.post("/seed-2024-25", async (req, res) => {
    try {
        console.log("🌱 Starting 2024-25 Seeding via API...");
        await seed2024Data();
        res.json({
            success: true,
            message: "2024-25 data seeded successfully",
        });
    } catch (error) {
        console.error("Error seeding:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
