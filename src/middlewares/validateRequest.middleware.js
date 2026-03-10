import AppError from '../utils/appError.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!parsed.success) {
      const errors = parsed.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return next(new AppError('Validation failed', 400, { errors }));
    }

    // Replace request data with validated/sanitized values
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.params) req.params = parsed.data.params;
    if (parsed.data.query) Object.assign(req.query, parsed.data.query);

    req.validated = parsed.data;

    next();
  };
};
