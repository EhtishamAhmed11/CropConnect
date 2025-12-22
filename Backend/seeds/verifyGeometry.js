import mongoose from 'mongoose';
import District from '../models/district.model.js';
import dotenv from 'dotenv';

dotenv.config();

export const verifyGeometry = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const districts = await District.find({}).limit(5);

        console.log(`📊 Found ${districts.length} districts (showing first 5)\n`);

        districts.forEach((district, index) => {
            console.log(`${index + 1}. ${district.name}`);
            console.log(`   - Has geometry: ${district.geometry ? '✅ YES' : '❌ NO'}`);
            if (district.geometry) {
                console.log(`   - Type: ${district.geometry.type}`);
                console.log(`   - Coordinates length: ${district.geometry.coordinates?.[0]?.length || 0}`);
            }
            console.log('');
        });

        await mongoose.disconnect();
        console.log('✅ Verification complete');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};


