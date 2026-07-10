import { runNl2SqlPipeline, streamNl2SqlPipeline } from "../services/nl2sql.service.js";


export async function nlQuery(req, res, next) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: { message: "'question' field is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
      });
    }

    const result = await runNl2SqlPipeline(question.trim());

    res.json(result);
  } catch (err) {
    
    if (err.status === 400) {
      return res.status(400).json({
        error: { message: err.message, code: err.code || "UNSAFE_SQL" },
      });
    }
    next(err);
  }
}


export async function nlQueryStream(req, res, next) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: { message: "'question' field is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
      });
    }

    
    res.setHeader("Content-Type",  "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection",    "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); 
    res.flushHeaders();

    
    await streamNl2SqlPipeline(question.trim(), res);

    res.end();
  } catch (err) {
    
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ stage: "error", data: { message: err.message } })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}
