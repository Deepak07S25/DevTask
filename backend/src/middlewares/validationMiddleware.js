/**
 * Strict validation middleware (previously Safe Mode)
 * Returns 400 Bad Request instead of logging warnings.
 */
const validateSafe = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        issues: result.error.issues 
      });
    }
    next();
  } catch (err) {
    console.error("[validate middleware error]", err);
    res.status(500).json({ error: "Internal Server Error during validation" });
  }
};

/**
 * Strict Mode Validation Middleware
 * Uncomment and use this when ready to enforce types and drop bad requests.
 * 
 * const validateStrict = (schema) => (req, res, next) => {
 *   const result = schema.safeParse(req.body);
 *   if (!result.success) {
 *     return res.status(400).json({ 
 *         error: "Validation failed", 
 *         details: result.error.issues 
 *     });
 *   }
 *   next();
 * };
 */

module.exports = { validateSafe };
