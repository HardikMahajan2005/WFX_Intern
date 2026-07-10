# WFX AI-Native ERP — Backend

Express.js REST API + NL2SQL engine for the WFX apparel ERP system.

---

## Quick start

```bash
cd backend
cp .env.example .env        # fill in your credentials
npm install
npm run dev                 # starts with --watch (auto-reload)
```

Server runs on `http://localhost:4000` by default.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key (bypasses RLS) |
| `PORT` | — | HTTP port (default: 4000) |
| `FRONTEND_URL` | — | Vercel URL for CORS (e.g. `https://your-app.vercel.app`) |
| `OPENROUTER_API_KEY` | ✅ for NL2SQL | Get from [openrouter.ai/keys](https://openrouter.ai/keys) |
| `TYPESENSE_HOST` | — | Reserved for future search module |
| `TYPESENSE_API_KEY` | — | Reserved for future search module |

---

## Project structure

```
backend/
├── server.js                    ← Entry point: Express app setup
├── src/
│   ├── config/
│   │   ├── supabase.js          ← Supabase client singleton
│   │   └── schema.js            ← DB schema string for LLM prompting
│   ├── routes/
│   │   ├── finishedGoods.routes.js
│   │   ├── suppliers.routes.js
│   │   ├── buyers.routes.js
│   │   ├── salesOrders.routes.js
│   │   ├── salesInvoices.routes.js
│   │   ├── dashboard.routes.js
│   │   └── nlQuery.routes.js
│   ├── controllers/             ← Thin; just call services & send res
│   ├── services/                ← All business + Supabase logic
│   │   ├── finishedGoods.service.js
│   │   ├── suppliers.service.js
│   │   ├── buyers.service.js
│   │   ├── salesOrders.service.js
│   │   ├── salesInvoices.service.js
│   │   ├── dashboard.service.js
│   │   └── nl2sql.service.js    ← LLM + SQL pipeline
│   ├── middleware/
│   │   ├── errorHandler.js      ← Global error → { error: { message, code } }
│   │   └── validate.js          ← Zod query-param validation factory
│   └── utils/
│       └── validators.js        ← Zod schemas for all query params
└── database/                    ← Seed tooling (separate from API)
```

---

## API Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: "ok", timestamp }` |

**Example:**
```bash
curl http://localhost:4000/api/health
# { "status": "ok", "timestamp": "2026-07-09T..." }
```

---

### Finished Goods

| Method | Path | Description |
|---|---|---|
| GET | `/api/finished-goods` | Paginated list with filters |
| GET | `/api/finished-goods/:id` | Single item with supplier join |

**Query params for list:**

| Param | Type | Example |
|---|---|---|
| `category` | string | `Shirts` |
| `fabric` | string | `Cotton` |
| `color` | string | `Blue` |
| `print` | string | `Striped` |
| `season` | string | `SS25` |
| `supplier` | string | `Apex Textiles` (partial match on company_name) |
| `gsm_min` | integer | `180` |
| `gsm_max` | integer | `300` |
| `page` | integer | `1` |
| `limit` | integer | `20` (max 200) |
| `sort_by` | enum | `gsm`, `cost`, `selling_price`, `created_at` |
| `sort_order` | `asc`/`desc` | `desc` |

**Examples:**
```bash
# Blue striped shirts, sorted by GSM descending
curl "http://localhost:4000/api/finished-goods?color=Blue&print=Striped&category=Shirts&sort_by=gsm&sort_order=desc"

# Single item
curl "http://localhost:4000/api/finished-goods/WFX-2501"
```

**Response:**
```json
{
  "data": [{ "style_number": "WFX-2501", "style_name": "Oxford Stripe Shirt", "suppliers": { "company_name": "..." }, "..." }],
  "pagination": { "page": 1, "limit": 20, "total": 1000, "totalPages": 50 }
}
```

---

### Suppliers

```bash
GET /api/suppliers?page=1&limit=20
```

### Buyers

```bash
GET /api/buyers?page=1&limit=20
```

### Sales Orders

```bash
GET /api/sales-orders?status=Pending&sort_by=shipment_date&sort_order=asc
```

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status (partial match) |
| `buyer_id` | string | Filter by buyer ID |
| `sort_by` | enum | `order_number`, `quantity`, `unit_price`, `shipment_date`, `status`, `created_at` |

### Sales Invoices

```bash
GET /api/sales-invoices?payment_status=Pending&currency=USD
```

---

### Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | KPI counts + total paid revenue |
| GET | `/api/dashboard/revenue-by-month` | Monthly revenue for charting |

```bash
curl http://localhost:4000/api/dashboard/stats
```
```json
{
  "data": {
    "totalFinishedGoods": 1000,
    "totalSuppliers": 12,
    "totalBuyers": 12,
    "totalOrders": 1500,
    "totalRevenue": 4823910.50,
    "revenueNote": "totalRevenue = SUM(sales_invoices.amount) where payment_status = 'Paid' (case-insensitive)"
  }
}
```

```bash
curl http://localhost:4000/api/dashboard/revenue-by-month
```
```json
{
  "data": [
    { "month": "2025-01", "revenue": 182300.00 },
    { "month": "2025-02", "revenue": 204100.50 }
  ]
}
```

---

### NL2SQL — Natural Language Query

#### Standard (non-streaming)

```bash
POST /api/nl-query
Content-Type: application/json

{ "question": "Show blue striped shirts under 900" }
```

**Response:**
```json
{
  "question": "Show blue striped shirts under 900",
  "generatedSql": "SELECT * FROM finished_goods WHERE color ILIKE '%Blue%' AND print ILIKE '%Strip%' AND selling_price < 900 LIMIT 200",
  "sqlResult": [ { "style_number": "WFX-2509", "..." } ],
  "aiAnswer": "There are 14 blue striped shirts priced under $900, ranging from $420 to $899. The most popular fabric is Cotton at 180–220 GSM."
}
```

#### Streaming (SSE)

```bash
POST /api/nl-query/stream
Content-Type: application/json

{ "question": "Which supplier has the highest average order value?" }
```

SSE event stream:
```
data: {"stage":"sql_generated","data":{"sql":"SELECT s.company_name, AVG(so.unit_price) ..."}}

data: {"stage":"sql_result","data":{"rows":[...],"rowCount":12}}

data: {"stage":"answer_chunk","data":{"token":"Apex"}}
data: {"stage":"answer_chunk","data":{"token":" Textiles"}}
...

data: {"stage":"done","data":{"aiAnswer":"Apex Textiles Ltd has the highest average order value at $87.40 per unit."}}
```

**Error response (400) — unsafe SQL rejected:**
```json
{ "error": { "message": "Only read-only queries are supported.", "code": "UNSAFE_SQL" } }
```

**Safety validation** — the following are blocked:
`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `REVOKE`, `CREATE`, `EXECUTE`, `--` (comments), multiple statements.

---

### Error shape

All errors follow a consistent JSON shape:

```json
{
  "error": {
    "message": "Human-readable description",
    "code": "SNAKE_CASE_CODE"
  }
}
```

Validation errors also include a `details` array:
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "gsm_min", "message": "Expected number, received string" }]
  }
}
```

---

## Typesense Full-Text Search

We use Typesense for typo-tolerant fast search. If Typesense is unreachable/offline, the backend gracefully falls back to performing Postgres `ILIKE` queries so search remains functional.

### 1. Running Typesense locally (Docker)

```bash
docker run -d -p 8108:8108 \
  -v /tmp/typesense-data:/data \
  typesense/typesense:0.25.1 \
  --data-dir /data \
  --api-key=xyz123 \
  --enable-cors
```

### 2. Indexing data from Supabase to Typesense

To (re)create the `finished_goods` collection schema and index/import all rows from Supabase, run the indexing script:

```bash
npm run index-search
```

### 3. Search Endpoint

| Method | Path | Description |
|---|---|---|
| GET | `/api/search/text` | Full-text query with optional facet filters |

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search query string (defaults to `*`) |
| `category` | string | Filter by category (exact match) |
| `fabric` | string | Filter by fabric (exact match) |
| `color` | string | Filter by color (exact match) |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 20, max 200) |

**Example:**
```bash
# Search for shirts matching "blue" with Cotton fabric filter
curl "http://localhost:4000/api/search/text?q=blue&fabric=Cotton"
```

**Response:**
```json
{
  "data": [
    {
      "style_number": "WFX-2501",
      "style_name": "Oxford Stripe Shirt",
      "category": "Shirt",
      "fabric": "Cotton",
      "gsm": 180,
      "color": "Blue",
      "print": "Solid",
      "season": "SS25",
      "brand": "WFX",
      "supplier_id": null,
      "cost": null,
      "selling_price": 55.99,
      "image_url": "...",
      "created_at": null,
      "suppliers": {
        "company_name": "Apex Textiles Ltd"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## Image Similarity Search

We implement an image similarity search utilizing CLIP (Contrastive Language-Image Pretraining) and pgvector.

### Why a Hybrid Architecture?
State-of-the-art multimodal vision models like CLIP (Contrastive Language-Image Pre-training) are primarily written, maintained, and optimized in Python (e.g. PyTorch and OpenCLIP). There are no mature Node.js packages for loading and running raw PyTorch CLIP weights on CPU/GPU.
Therefore, we adopt a **microservice hybrid architecture**:
1. **Python Embedding Service (FastAPI):** A small, high-performance API that loads the model (`ViT-B-32` with `laion2b_s34b_b79k` weights) once at startup and computes 512-dimensional vector embeddings for uploaded images or URLs.
2. **Node.js Express Server:** The main ERP backend. It communicates with the Python service to extract embeddings, which it indexes into Supabase (Postgres with `pgvector`) or queries using a cosine distance database function.

If the Python service is offline, the main Node.js backend catches the connection error and returns a friendly `"Image search service is temporarily unavailable"` (503 Service Unavailable) error, keeping the rest of the ERP system functional.

---

### 1. Running the Embedding Microservice (Python FastAPI)

#### Locally (without Docker)
Requires Python 3.10+ and pip:
```bash
cd embedding_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Locally (with Docker)
```bash
# Build the image (pre-downloads CLIP weights to speed up cold-starts)
docker build -t wfx_embedding_service ./embedding_service

# Run the container
docker run -d --name wfx_embedding -p 8000:8000 wfx_embedding_service:latest
```

---

### 2. Generating Image Embeddings for Existing Goods

Once the embedding microservice is running on port 8000, run the batch indexing script to fetch all seeded garments from Supabase, generate their vector embeddings, and store them in Postgres:

```bash
npm run index-images
```

This script:
- Fetches all finished goods with an `image_url`
- Requests the embedding vectors from the Python service
- Updates the `embedding` column (using direct pg pool for safety)
- Handles failures using retry logic (up to 3 retries) and basic batch rate-limiting.

---

### 3. Image Search Endpoint

| Method | Path | Description |
|---|---|---|
| POST | `/api/search/image` | Accepts a multipart image file and returns closest items |

**Request Body (multipart/form-data):**
- `file`: The image file upload

**Query Parameters:**
- `limit`: Maximum matches to return (default: 10)

**Example:**
```bash
curl -X POST -F "file=@/path/to/sample_shirt.jpg" "http://localhost:4000/api/search/image?limit=5"
```

**Response:**
```json
{
  "data": [
    {
      "style_number": "WFX-2573",
      "style_name": "Classic Sky Blue Shirt",
      "category": "Shirt",
      "fabric": "Chambray",
      "gsm": 180,
      "color": "Sky Blue",
      "print": "Solid",
      "season": "SS25",
      "brand": "Vastra Studio",
      "supplier_id": "SUP-002",
      "cost": 423.37,
      "selling_price": 789.43,
      "image_url": "...",
      "similarity_score": 0.842391050239105,
      "suppliers": {
        "company_name": "Jakarta Garmindo"
      }
    }
  ]
}
```

---

### 4. Separate Production Deployment

When deploying to a cloud environment (such as Render, Heroku, or AWS):
1. **Python Embedding Service:** Deploy it as a standalone Python Web Service (using the `Dockerfile`). It can be deployed on a GPU instance (for high speed) or a CPU instance (with Render's Python environment). Set `EMBEDDING_SERVICE_URL` in the main Node.js environment variables to point to its deployed URL (e.g., `https://wfx-embedding.onrender.com/embed`).
2. **Node.js Express Server:** Deploy it normally as a Node.js Web Service. Set `DATABASE_URL` and `EMBEDDING_SERVICE_URL`.
3. **Supabase Database:** Hosted on Supabase (already has pgvector enabled and migration function loaded).


