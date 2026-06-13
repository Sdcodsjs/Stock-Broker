const { z } = require('zod');

// Schema definitions
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});

const tradeSchema = z.object({
  ticker: z.string().toUpperCase().min(1, "Ticker is required"),
  shares: z.number().int().positive("Shares must be a positive integer"),
});

const subscriptionSchema = z.object({
  ticker: z.string().toUpperCase().min(1, "Ticker is required"),
});

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

// Middleware factory for validating request bodies
const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    next(err);
  }
};

module.exports = {
  loginSchema,
  tradeSchema,
  subscriptionSchema,
  settingsSchema,
  validateBody,
};
