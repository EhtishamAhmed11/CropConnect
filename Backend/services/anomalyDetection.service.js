
// backend/services/anomalyDetection.service.js
export const checkYieldAnomaly = (currentRecord, previousRecord, thresholdPercent = 20) => {
    if (!previousRecord || !previousRecord.production?.value || !currentRecord.production?.value) {
        return null;
    }

    const prevValue = previousRecord.production.value;
    const currValue = currentRecord.production.value;

    if (prevValue === 0) return null;

    const percentChange = ((currValue - prevValue) / prevValue) * 100;

    if (Math.abs(percentChange) >= thresholdPercent) {
        return {
            isAnomaly: true,
            percentChange: percentChange.toFixed(2),
            prevValue,
            currValue,
            type: percentChange < 0 ? "Production Drop" : "Production Surge",
            severity: Math.abs(percentChange) > 50 ? "critical" : "high",
        };
    }

    return null;
};
