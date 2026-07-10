import { analyzeGarmentImage } from "./gemini.service.js";
import { typesenseClient } from "../config/typesense.js";

/**
 * Generates a descriptive search query from the extracted garment attributes.
 * 
 * @param {object} attrs - The extracted attributes from Gemini
 * @returns {string} - The generated search query
 */
function buildQueryString(attrs) {
  const parts = [];

  if (attrs.color) parts.push(attrs.color);
  if (attrs.pattern) parts.push(attrs.pattern);
  if (attrs.style) parts.push(attrs.style);

  // Convert gender to possessive form for a more natural query
  if (attrs.gender) {
    const genderLower = attrs.gender.toLowerCase();
    if (genderLower === "men") {
      parts.push("Men's");
    } else if (genderLower === "women") {
      parts.push("Women's");
    } else {
      parts.push(attrs.gender);
    }
  }

  if (attrs.fabric) parts.push(attrs.fabric);
  if (attrs.category) parts.push(attrs.category);

  return parts.join(" ").trim() || "*";
}

/**
 * Analyzes the garment image and searches Typesense for relevant products.
 * 
 * @param {Buffer} buffer - The uploaded image buffer
 * @param {string} mimeType - The MIME type of the uploaded image
 * @returns {Promise<{query: string, products: Array}>}
 */
export async function searchByImage(buffer, mimeType) {
  // 1. Analyze the image using Gemini Vision service
  let attrs;
  try {
    attrs = await analyzeGarmentImage(buffer, mimeType);
  } catch (err) {
    throw new Error(`Gemini analysis failed: ${err.message}`);
  }

  // 2. Build the search query string
  const query = buildQueryString(attrs);

  // 3. Search Typesense products collection
  try {
    const searchParams = {
      q: query,
      query_by: "style_name,fabric,color,print,category,brand",
      page: 1,
      per_page: 10, // Top 10 most relevant products
    };

    const searchResult = await typesenseClient
      .collections("finished_goods")
      .documents()
      .search(searchParams);

    // Map Typesense documents to unified product structure
    const products = (searchResult.hits || []).map((hit) => {
      const doc = hit.document;
      return {
        style_number: doc.style_number,
        style_name: doc.style_name,
        category: doc.category,
        fabric: doc.fabric,
        gsm: doc.gsm,
        color: doc.color,
        print: doc.print,
        season: doc.season,
        brand: doc.brand,
        supplier_id: null,
        cost: null,
        selling_price: doc.selling_price,
        image_url: doc.image_url,
        created_at: null,
        suppliers: {
          company_name: doc.supplier_name,
        },
      };
    });

    return {
      query,
      products,
    };
  } catch (err) {
    console.error("[Typesense Image Search Error]:", err);
    throw new Error(`Typesense search failed: ${err.message}`);
  }
}
