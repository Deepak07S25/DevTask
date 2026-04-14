// asyncHandler.js
// A wrapper to catch exceptions in async express routes and pass them to next(err) automatically
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
