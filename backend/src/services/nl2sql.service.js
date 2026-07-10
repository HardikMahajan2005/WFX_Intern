import { supabase } from "../config/supabase.js";
import { SCHEMA_DESCRIPTION } from "../config/schema.js";
import pg from "pg";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";


const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

const SQL_MODEL = "google/gemini-2.5-flash";
const ANSWER_MODEL = "google/gemini-2.5-flash";


const DANGEROUS_PATTERNS = [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bTRUNCATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bCREATE\b/i,
  /\bEXECUTE\b/i,
  /--/,
  /\/\*/,
];



function validateSql(sql) {
  const trimmed = sql.trim();

  if (!/^select/i.test(trimmed)) {
    throw Object.assign(
      new Error("Only SELECT statements are supported."),
      { code: "UNSAFE_SQL", status: 400 }
    );
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw Object.assign(
        new Error("Only read-only queries are supported."),
        { code: "UNSAFE_SQL", status: 400 }
      );
    }
  }


  const statements = trimmed.split(";").filter((s) => s.trim().length > 0);
  if (statements.length > 1) {
    throw Object.assign(
      new Error("Only a single SQL statement is supported."),
      { code: "UNSAFE_SQL", status: 400 }
    );
  }
}


function getOpenRouterHeaders() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set in environment.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    "HTTP-Referer": "https://wfx-erp.app",
    "X-Title": "WFX AI-Native ERP",
  };
}


async function callLLM(messages, model) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}


function extractSql(raw) {

  return raw
    .replace(/^```(?:sql)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}




export async function generateSql(question) {
  const systemPrompt = `You are an expert PostgreSQL query generator for an apparel ERP system.

${SCHEMA_DESCRIPTION}

RULES (follow strictly):
1. Return ONLY a valid JSON object containing:
   - "sql": A single valid PostgreSQL SELECT statement. End it without a semicolon.
   - "confidenceScore": An integer between 0 and 100 indicating how confident you are that this query correctly answers the user's question without making unsafe assumptions.
   - "reasoning": A concise 1-sentence explanation of why the SQL is generated this way, and what assumptions (if any) you made.
2. Use only the tables and columns listed above.
3. ALWAYS use ILIKE with % wildcards for text matching — NEVER use exact string equality for user-provided text values.
   CORRECT:   color ILIKE '%Blue%'
   WRONG:     color ILIKE 'Blue'   or   color = 'Blue'
4. Always LIMIT results to 200 rows unless the user asks for aggregates (COUNT, SUM, AVG, etc.).
5. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, GRANT, REVOKE, or EXECUTE.
6. For JOIN queries, always qualify column names with the table alias to avoid ambiguity.
7. Pay close attention to the known values of columns in the schema. If the user asks for a feature (like 'striped', 'check', 'plaid', 'floral') that is not among the known values for the 'print' column ('Solid', 'Printed'), do NOT filter on the 'print' column. Instead, search for it using ILIKE on 'style_name' (e.g. style_name ILIKE '%Stripe%').

Do not include any explanation outside the JSON, no markdown code fences (like \`\`\`json). Just the raw JSON.`;

  const raw = await callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    SQL_MODEL
  );

  let cleanRaw = raw.trim();
  if (cleanRaw.startsWith("```")) {
    cleanRaw = cleanRaw
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  try {
    const parsed = JSON.parse(cleanRaw);
    return {
      sql: parsed.sql ? parsed.sql.trim() : "",
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 100,
      reasoning: parsed.reasoning || "Generated query matching schema constraints.",
    };
  } catch (err) {
    console.error("Failed to parse SQL generation response JSON:", err, "raw content:", raw);
    return {
      sql: extractSql(raw),
      confidenceScore: 70,
      reasoning: "Generated SQL with fallback parser due to JSON formatting issue.",
    };
  }
}


export async function executeSql(sql) {
  validateSql(sql);

  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgresql://")) {
    throw Object.assign(
      new Error(
        "DATABASE_URL is not configured. " +
        "Get it from Supabase Dashboard → Project Settings → Database → Connection string (URI mode) " +
        "and set it in your .env file."
      ),
      { code: "CONFIG_ERROR", status: 500 }
    );
  }

  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result.rows;
  } finally {
    client.release();
  }
}


export async function summariseResult(question, sql, rows) {
  const rowSample = rows.slice(0, 50);
  const systemPrompt = `You are a helpful ERP assistant. 
Given a user question, the SQL that was run, and the query results,
write a concise, friendly 1–3 sentence answer for the user.
Do not show raw SQL. Focus on the business insight.`;

  const userMsg = `Question: ${question}

SQL executed:
${sql}

Result (${rows.length} rows${rows.length > 50 ? ", showing first 50" : ""}):
${JSON.stringify(rowSample, null, 2)}

Answer the question in plain English.`;

  return callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMsg },
    ],
    ANSWER_MODEL
  );
}



export async function logQuery({ question, generatedSql, success, errorMessage, confidenceScore, reasoning }) {
  try {
    await supabase.from("query_logs").insert({
      question,
      generated_sql: generatedSql,
      success,
      error_message: errorMessage || null,
      confidence_score: confidenceScore !== undefined ? confidenceScore : null,
      reasoning: reasoning || null,
    });
  } catch (logErr) {
    console.warn("[query_logs] Failed to log query:", logErr.message);
  }
}



export async function classifyQuestion(question) {
  const systemPrompt = `You are an AI classifier for an apparel ERP copilot.
Determine if the user's message is a greeting, general chat, clothing knowledge/definitions, or a conversational prompt that DOES NOT require querying a database (e.g. "hello", "hi", "who are you", "what can you do", "thank you").
If the query requires retrieving, filtering, calculating, or summarizing specific data from the database tables (finished_goods, suppliers, buyers, sales_orders, sales_invoices), set is_db_query to true.

Respond ONLY with a JSON object of this format:
{
  "is_db_query": false,
  "conversational_response": "A friendly response greeting the user, or answering their general question, and explaining that you can query the finished goods catalog, buyers, sales orders, and suppliers."
}
If is_db_query is true, conversational_response must be null.`;

  try {
    const raw = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      SQL_MODEL
    );

    const cleanRaw = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleanRaw);
    return parsed;
  } catch (err) {
    console.error("Classification failed, defaulting to database query:", err);
    return { is_db_query: true, conversational_response: null };
  }
}

export async function determineChartConfig(question, sqlResult) {
  if (!sqlResult || sqlResult.length === 0) {
    return { type: null, xAxisKey: null, yAxisKey: null, title: null };
  }

  const sampleRows = sqlResult.slice(0, 3);
  const keys = Object.keys(sqlResult[0]);

  const systemPrompt = `You are an AI chart advisor for an apparel ERP system.
Your job is to decide if a dataset returned from a SQL query can be effectively visualized on a chart (bar, line, pie, or area chart).

Typically:
- Aggregates, counts, totals, or trends over time (months/seasons) or categories (suppliers/buyers/fabrics) are perfect for charts.
- Simple lists of individual items (like style details, names, countries, etc.) or single rows are NOT suitable.

If the data is suitable, select:
- type: 'bar' | 'line' | 'pie' | 'area'
- xAxisKey: The key in the rows representing the labels (e.g. "month", "category", "company_name", "fabric").
- yAxisKey: The key in the rows representing the numeric values (e.g. "revenue", "quantity", "cost", "total_orders", "count").
- title: A short descriptive title for the chart (e.g., "Monthly Sales Trend", "Orders by Category").

Available keys in the dataset: ${JSON.stringify(keys)}
Sample rows: ${JSON.stringify(sampleRows)}

Respond ONLY with a JSON object of this structure:
{
  "type": "bar" | "line" | "pie" | "area" | null,
  "xAxisKey": "key_name" | null,
  "yAxisKey": "key_name" | null,
  "title": "Chart Title" | null
}
If you decide a chart is not suitable, set all keys to null. Do not include markdown code blocks.`;

  try {
    const raw = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Question: ${question}` },
      ],
      SQL_MODEL
    );

    let cleanRaw = raw.trim();
    if (cleanRaw.startsWith("```")) {
      cleanRaw = cleanRaw
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    const parsed = JSON.parse(cleanRaw);
    return {
      type: parsed.type || null,
      xAxisKey: parsed.xAxisKey || null,
      yAxisKey: parsed.yAxisKey || null,
      title: parsed.title || null,
    };
  } catch (err) {
    console.error("Failed to determine chart config:", err);
    return { type: null, xAxisKey: null, yAxisKey: null, title: null };
  }
}

export async function runNl2SqlPipeline(question) {
  let generatedSql = null;
  let confidenceScore = null;
  let reasoning = null;

  try {
    const classification = await classifyQuestion(question);
    if (!classification.is_db_query) {
      return {
        question,
        generatedSql: null,
        sqlResult: null,
        aiAnswer: classification.conversational_response || "Hello! How can I help you today?",
        confidenceScore: null,
        reasoning: null,
        chartConfig: { type: null, xAxisKey: null, yAxisKey: null, title: null }
      };
    }

    const genResult = await generateSql(question);
    generatedSql = genResult.sql;
    confidenceScore = genResult.confidenceScore;
    reasoning = genResult.reasoning;

    const sqlResult = await executeSql(generatedSql);

    const aiAnswer = await summariseResult(question, generatedSql, sqlResult);

    const chartConfig = await determineChartConfig(question, sqlResult);

    await logQuery({
      question,
      generatedSql,
      success: true,
      confidenceScore,
      reasoning,
    });

    return { question, generatedSql, sqlResult, aiAnswer, confidenceScore, reasoning, chartConfig };
  } catch (err) {
    await logQuery({
      question,
      generatedSql,
      success: false,
      errorMessage: err.message,
      confidenceScore,
      reasoning,
    });
    throw err;
  }
}

export async function streamNl2SqlPipeline(question, res) {
  const emit = (event, data) => {
    res.write(`data: ${JSON.stringify({ stage: event, data })}\n\n`);
  };
  const emitError = (message, code = "PIPELINE_ERROR") => {
    res.write(`data: ${JSON.stringify({ stage: "error", data: { message, code } })}\n\n`);
  };

  let generatedSql = null;
  let confidenceScore = null;
  let reasoning = null;

  try {
    const classification = await classifyQuestion(question);
    if (!classification.is_db_query) {
      const responseText = classification.conversational_response || "Hello! How can I help you today?";
      const words = responseText.split(" ");
      for (let i = 0; i < words.length; i++) {
        emit("answer_chunk", { token: words[i] + (i === words.length - 1 ? "" : " ") });
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      emit("done", { aiAnswer: responseText });
      return;
    }

    const genResult = await generateSql(question);
    generatedSql = genResult.sql;
    confidenceScore = genResult.confidenceScore;
    reasoning = genResult.reasoning;

    emit("sql_generated", { sql: generatedSql, confidenceScore, reasoning });

    let sqlResult;
    try {
      sqlResult = await executeSql(generatedSql);
    } catch (execErr) {
      await logQuery({
        question,
        generatedSql,
        success: false,
        errorMessage: execErr.message,
        confidenceScore,
        reasoning,
      });
      emitError(
        `Query execution failed: ${execErr.message}`,
        execErr.code || "SQL_EXEC_ERROR"
      );
      emit("done", {});
      return;
    }
    
    const chartConfig = await determineChartConfig(question, sqlResult);
    emit("sql_result", { rows: sqlResult, rowCount: sqlResult.length, chartConfig });

    const rowSample = sqlResult.slice(0, 50);
    const systemPrompt = `You are a helpful ERP assistant.
Given a user question, the SQL that was run, and the query results,
write a concise, friendly 1–3 sentence answer. Do not show raw SQL.`;

    const userMsg = `Question: ${question}

SQL: ${generatedSql}

Result (${sqlResult.length} rows${sqlResult.length > 50 ? ", first 50 shown" : ""}):
${JSON.stringify(rowSample, null, 2)}

Answer the question in plain English.`;

    const streamRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: ANSWER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        stream: true,
      }),
    });

    if (!streamRes.ok) {
      const errText = await streamRes.text();
      throw new Error(`OpenRouter streaming error ${streamRes.status}: ${errText}`);
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const token = parsed.choices?.[0]?.delta?.content ?? "";
          if (token) {
            fullAnswer += token;
            emit("answer_chunk", { token });
          }
        } catch {

        }
      }
    }

    await logQuery({
      question,
      generatedSql,
      success: true,
      confidenceScore,
      reasoning,
    });
    emit("done", { aiAnswer: fullAnswer });
  } catch (err) {
    await logQuery({
      question,
      generatedSql,
      success: false,
      errorMessage: err.message,
      confidenceScore,
      reasoning,
    });
    emitError(err.message, err.code || "PIPELINE_ERROR");
    emit("done", {});
  }
}

