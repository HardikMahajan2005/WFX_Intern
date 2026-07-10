export function errorHandler(err, req, res, next) {

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
  }


  if (err.status) {
    return res.status(err.status).json({
      error: {
        message: err.message || "An error occurred",
        code: err.code || "API_ERROR",
      },
    });
  }


  console.error("[Unhandled Error]", err);
  return res.status(500).json({
    error: {
      message: err.message || "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
  });
}
