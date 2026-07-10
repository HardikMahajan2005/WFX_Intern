import { searchByImage } from "../services/imageSearch.service.js";

/**
 * Controller for POST /api/image-search
 * Handles the upload of a garment image and returns visually similar products.
 */
export async function imageSearch(req, res, next) {
  try {
    // 1. Validate that file is uploaded
    if (!req.file) {
      throw Object.assign(
        new Error("No image file uploaded. Please upload a garment image in the 'image' field."),
        { status: 400, code: "MISSING_IMAGE" }
      );
    }

    // 2. Perform the image search service logic
    const { query, products } = await searchByImage(req.file.buffer, req.file.mimetype);

    // 3. Return the response
    return res.json({
      success: true,
      query,
      products,
    });
  } catch (err) {
    // 4. Map error statuses to match proper API error contract
    if (err.message.includes("Gemini")) {
      err.status = 502;
      err.code = "GEMINI_FAILURE";
    } else if (err.message.includes("Typesense")) {
      err.status = 500;
      err.code = "TYPESENSE_FAILURE";
    }
    
    // Pass to standard error handler middleware
    next(err);
  }
}
