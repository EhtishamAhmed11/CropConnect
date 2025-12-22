import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
    cropType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CropType',
        required: true
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'PKR'
    },
    unit: {
        type: String, // e.g., "kg", "maund" (40kg)
        required: true,
        default: "kg"
    },
    marketType: {
        type: String,
        enum: ['Wholesale', 'Retail', 'Farmgate'],
        default: 'Wholesale'
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    source: {
        type: String // e.g., "Government Mandi", "Survey"
    }
}, {
    timestamps: true
});

// Index for efficient querying of price trends
marketPriceSchema.index({ cropType: 1, district: 1, date: -1 });
marketPriceSchema.index({ date: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

export default MarketPrice;
