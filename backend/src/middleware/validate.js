export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(result.error);
    }
    Object.defineProperty(req, "query", {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true
    });
    next();
  };
}
