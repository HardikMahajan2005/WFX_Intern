import "dotenv/config";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "google/gemini-2.5-flash";

/**
 * Returns headers required for calling OpenRouter API
 */
function getOpenRouterHeaders() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set in environment.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "HTTP-Referer": "https://wfx-erp.app",
    "X-Title": "WFX AI-Native ERP Image Search",
  };
}

/**
 * Uses Gemini 2.5 Flash via OpenRouter to analyze an image buffer and extract garment attributes.
 * 
 * @param {Buffer} imageBuffer - The image buffer from multer
 * @param {string} mimeType - The MIME type of the image (e.g. image/jpeg, image/png)
 * @returns {Promise<{category: string|null, color: string|null, pattern: string|null, gender: string|null, style: string|null, fabric: string|null}>}
 */
export async function analyzeGarmentImage(imageBuffer, mimeType) {
  if (!imageBuffer || !mimeType) {
    throw new Error("Image buffer and MIME type are required.");
  }

  // Convert buffer to base64
  const base64Data = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `You are an expert fashion cataloging assistant. Analyze this garment image and extract the following details.
Return ONLY a valid JSON object with the following fields:
{
  "category": "e.g., Shirt, T-Shirt, Jeans, Dress, Jacket, etc.",
  "color": "e.g., Blue, Black, White, Red, etc.",
  "pattern": "e.g., Solid, Checked, Printed, Striped, etc.",
  "gender": "e.g., Men, Women, Unisex, Kids",
  "style": "e.g., Casual, Formal, Sportswear, etc.",
  "fabric": "e.g., Cotton, Denim, Polyester, Linen, or null if not identifiable"
}

Do not include any explanation, markdown formatting (like \`\`\`json), or extra text. Return ONLY the raw JSON object.`
        },
        {
          type: "image_url",
          image_url: {
            url: dataUrl
          }
        }
      ]
    }
  ];

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API responded with ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();
    
    if (!rawContent) {
      throw new Error("No response content received from Gemini.");
    }

    // Clean up markdown block styling if returned
    let cleanContent = rawContent;
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    const attributes = JSON.parse(cleanContent);
    return {
      category: attributes.category || null,
      color: attributes.color || null,
      pattern: attributes.pattern || null,
      gender: attributes.gender || null,
      style: attributes.style || null,
      fabric: attributes.fabric || null,
    };
  } catch (error) {
    console.error("[Gemini Service Error]:", error);
    throw new Error(`Failed to analyze garment image: ${error.message}`);
  }
}
