import logger from "../utils/logger.js";

/**
 * Middleware to log key user actions
 * Captures timestamp, user ID, method, path, and status code
 */
const auditLogger = (req, res, next) => {
    const start = Date.now();

    // Listen for the finish event to log the completed request
    res.on("finish", () => {
        const duration = Date.now() - start;
        const { method, path, user } = req;
        const { statusCode } = res;

        // Log key actions (mutating requests or specific paths)
        const isKeyAction =
            ["POST", "PUT", "DELETE"].includes(method) ||
            path.includes("/reports") ||
            path.includes("/auth/login");

        if (isKeyAction || statusCode >= 400) {
            const logData = {
                timestamp: new Date().toISOString(),
                userId: user ? user._id : "anonymous",
                username: user ? user.username : "anonymous",
                method,
                path,
                statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
            };

            if (statusCode >= 400) {
                logger.warn("Request failed: %j", logData);
            } else {
                logger.info("Key action performed: %j", logData);
            }
        }
    });

    next();
};

export default auditLogger;
