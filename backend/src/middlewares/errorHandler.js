// errorHandler.js
/**
 * Global Error Handler Middleware
 * Intercepts unhandled errors passed to next() and formats them consistently.
 * Matches legacy shape: { error: message } to prevent breaking the frontend Axios handlers.
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[Global Error] ${req.method} ${req.originalUrl}:`, err.message);

    // Default status code
    let statusCode = 500;

    // Preserve existing validation codes if passed (e.g. 400 for bad request, 403 for forbidden)
    if (err.statusCode) {
        statusCode = err.statusCode;
    } else if (err.status) {
        statusCode = err.status;
    } else if (err.message && (err.message.includes('not found') || err.message.includes('No user found'))) {
        statusCode = 404;
    } else if (err.message && (err.message.includes('authorized') || err.message.includes('Forbidden'))) {
        statusCode = 403;
    } else if (err.message && (err.message.includes('Validation') || err.message.includes('Required'))) {
        statusCode = 400;
    }

    const finalMessage = (process.env.NODE_ENV === 'production' && statusCode === 500) 
        ? 'Internal Server Error' 
        : (err.message || 'Internal Server Error');

    res.status(statusCode).json({
        error: finalMessage
    });
};

module.exports = { errorHandler };
