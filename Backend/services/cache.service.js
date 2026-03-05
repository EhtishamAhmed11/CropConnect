import logger from "../utils/logger.js";

class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = 60 * 5 * 1000; // Default 5 minutes
    }

    set(key, value, ttl = this.ttl) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
        logger.info(`Cache set for key: ${key}, expires in ${ttl / 1000}s`);
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            logger.info(`Cache expired for key: ${key}`);
            return null;
        }

        logger.info(`Cache hit for key: ${key}`);
        return entry.value;
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
        logger.info("Cache cleared");
    }

    /**
     * Helper to generate a cache key from an object (e.g., query params)
     */
    generateKey(prefix, params) {
        return `${prefix}:${JSON.stringify(params)}`;
    }
}

export default new CacheService();
