# WFX AI-Native ERP 🧵

> An intelligent, AI-powered ERP system for the apparel industry — built for the WFX Internship Assignment.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Docker Setup](#-docker-setup)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

WFX AI-Native ERP is a full-stack web application that brings **AI capabilities** to apparel enterprise resource planning. It combines:

- A **REST API backend** (Node.js + Express) connected to **Supabase (PostgreSQL)**
- A **React frontend** with a modern dark-themed dashboard
- **Natural Language to SQL** — ask questions in plain English, get database answers
- **Image Search** — upload a garment photo, find similar products using Gemini Vision + Typesense
- **Full-text product search** powered by Typesense

The system manages 6 core business entities: Suppliers, Buyers, Finished Goods, Sales Orders, Tech Packs, and Sales Invoices — with over **4,700 rows** of seeded data.

---

## ✨ Features

### 🤖 AI / NL2SQL Query Engine
- Type any business question in plain English (e.g. *"Show me all blue cotton t-shirts from suppliers in China"*)
- **Gemini 2.5 Flash** via OpenRouter converts it to a safe, read-only SQL query
- Multi-stage streaming pipeline:  
  `classify question → generate SQL → execute → summarize answer → suggest chart`
- Confidence score + reasoning shown for every query
- Auto-generates **bar / line / pie / area charts** for aggregation results using Recharts
- All queries logged to `query_logs` table for audit trail
- SQL injection protection: only `SELECT` statements allowed

### 🖼️ Combined AI & Visual Search
- **Natural Language Text Search**: Query the catalog with plain English prompts (like *"Blue floral dress"* or *"Black oversized hoodie"*). Includes handy quick-click recommendations in the sidebar to test prompts instantly.
- **Optional Image Search**: Drag & drop or upload a photo of a garment. **Gemini Vision** analyzes the image to extract details (color, fabric, category, pattern), which are then matched using **Typesense** to locate visually similar garments.
- Integrated search states allow you to clear text search and image uploads with a single click.

### 🔍 Full-Text Product Search
- Fast, typo-tolerant search across style name, fabric, color, print, category, and brand.
- Powered by **Typesense** under the hood.
- Multi-dimensional sidebar filters to narrow down category, fabric, and color combinations.

### 📊 Dashboard
- Live KPI cards displaying aggregate business metrics: Total Revenue, Finished Goods count, Sales Orders, and active Buyers.
- Interactive, responsive revenue trend chart plotting the last 24 months (built using Recharts).

### 📦 Finished Goods Catalog & Usability Enhancements
- Browse over 1,000 products with advanced filter matrices.
- **Auto-Scroll Pagination**: Navigating through pages automatically scrolls the main page view back to the top, saving you from manual scrolling.
- Click any product to open a detailed modal containing tech pack specifications and supplier parameters.

### 💎 Design System & Brand Identity
- **Redesigned Brand Header**: Built a premium, glassmorphic logo container featuring an interactive `Compass` icon that spins `360deg` on hover, a sharp neon gradient border (using CSS masking), and a glowing ambient backlight.
- **Consistent Typography**: Swapped the serif header font for a modern, tracking-heavy geometric sans-serif style for sidebar navigation labels and status badges.


### 🗂️ Full CRUD REST API
- **Suppliers** — list, filter by country, get by ID
- **Buyers** — list, filter by category/country, get by ID
- **Finished Goods** — list, filter, paginate, get by style number
- **Sales Orders** — list, filter by status/buyer/style, get by order number
- **Sales Invoices** — list, filter by payment status, get by invoice number
- **Dashboard** — KPI stats, revenue by month

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 18+ (ESM)** | Runtime |
| **Express 5** | HTTP server & routing |
| **Supabase JS Client** | Supabase API (REST) |
| **pg (node-postgres)** | Direct PostgreSQL for NL2SQL & dashboard |
| **Zod** | Request validation & schema definitions |
| **OpenRouter API** | LLM gateway (Gemini 2.5 Flash) |
| **Typesense** | Full-text & image search |
| **Multer** | Image upload handling |
| **dotenv** | Environment variable management |
| **Docker** | Containerisation |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Tailwind CSS 4** | Utility-first styling |
| **Recharts** | Data visualisation (charts) |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |

### Database & Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Supabase (PostgreSQL)** | Primary database |
| **pgvector** | Vector extension (for future CLIP embeddings) |
| **Typesense** | Search engine |

---

## 📁 Project Structure

```
WFX_INTERN_ASSIGNMENT/
├── backend/
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── database/
│   │   ├── migrate.js               # Node.js migration runner
│   │   ├── seed.js                  # CSV → Supabase bulk loader
│   │   ├── data/                    # CSV seed files (6 entities)
│   │   └── supabase/migrations/     # SQL migration files
│   ├── scripts/
│   │   ├── indexFinishedGoods.js    # Index products into Typesense
│   │   └── generateImageEmbeddings.js
│   └── src/
│       ├── config/
│       │   ├── supabase.js          # Supabase client
│       │   ├── typesense.js         # Typesense client
│       │   └── schema.js            # Zod schemas + DB schema description
│       ├── middleware/
│       │   ├── errorHandler.js      # Global error handler
│       │   └── validate.js          # Zod request validation
│       ├── controllers/             # Route handlers (one per entity)
│       ├── services/                # Business logic & DB queries
│       │   ├── nl2sql.service.js    # NL → SQL pipeline (classify → generate → execute → summarize)
│       │   ├── gemini.service.js    # Gemini Vision for image analysis
│       │   ├── imageSearch.service.js
│       │   ├── search.service.js    # Typesense search
│       │   ├── dashboard.service.js # KPI aggregations
│       │   └── ...                  # One service per entity
│       ├── routes/                  # Express routers (one per entity)
│       └── utils/
│           └── validators.js        # Query param sanitisers
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── nginx.conf                   # Production nginx config
    └── src/
        ├── main.jsx                 # React entry point
        ├── App.jsx                  # Router setup
        ├── index.css                # Global design system
        ├── components/
        │   └── Layout.jsx           # Sidebar + nav shell
        ├── pages/
        │   ├── Dashboard.jsx        # KPI cards + revenue chart
        │   ├── FinishedGoods.jsx    # Product catalog with filters
        │   ├── ProductSearch.jsx    # Typesense full-text search
        │   ├── ImageSearch.jsx      # Drag-and-drop image search
        │   └── NlQuery.jsx          # AI natural language query
        └── lib/
            └── api.js               # Axios API client
```

---

## 🗄️ Database Schema

```
suppliers          buyers
    │                 │
    │                 │
    ▼                 ▼
finished_goods ──► sales_orders ──► sales_invoices
    │
    ▼
tech_packs

query_logs  (audit trail for NL2SQL)
```

| Table | Primary Key | Rows (seeded) | Description |
|-------|-------------|---------------|-------------|
| `suppliers` | `supplier_id` (e.g. SUP-001) | 12 | Fabric & garment suppliers |
| `buyers` | `buyer_id` (e.g. BUY-001) | 12 | Retail / wholesale buyers |
| `finished_goods` | `style_number` (e.g. WFX-2501) | 1,000 | Product catalog |
| `sales_orders` | `order_number` (e.g. SO-00001) | 1,500 | Customer orders |
| `tech_packs` | `tech_pack_id` (e.g. TP-WFX-2501) | 1,000 | Technical specifications |
| `sales_invoices` | `invoice_number` (e.g. INV-00001) | 1,206 | Payment invoices |
| `query_logs` | `id` (UUID) | dynamic | NL2SQL audit trail |

---

## 📡 API Reference

**Base URL:** `http://localhost:4000`

### Health Check
```
GET /api/health
```

### Finished Goods
```
GET /api/finished-goods              # List with filters & pagination
GET /api/finished-goods/:styleNumber # Get single product
```
**Query params:** `page`, `limit`, `category`, `fabric`, `color`, `season`, `brand`, `supplier_id`

### Suppliers
```
GET /api/suppliers          # List all suppliers
GET /api/suppliers/:id      # Get single supplier
```

### Buyers
```
GET /api/buyers             # List all buyers
GET /api/buyers/:id         # Get single buyer
```

### Sales Orders
```
GET /api/sales-orders              # List with filters
GET /api/sales-orders/:orderNumber # Get single order
```
**Query params:** `status`, `buyer_id`, `style_number`, `page`, `limit`

### Sales Invoices
```
GET /api/sales-invoices                    # List with filters
GET /api/sales-invoices/:invoiceNumber     # Get single invoice
```
**Query params:** `payment_status`, `order_number`, `page`, `limit`

### Dashboard
```
GET /api/dashboard/stats          # KPI stats (counts + revenue)
GET /api/dashboard/revenue        # Revenue by month (last 24 months)
```

### Natural Language Query (NL2SQL)
```
POST /api/nl-query/stream         # Server-Sent Events streaming pipeline
POST /api/nl-query                # Non-streaming (JSON response)
```
**Body:** `{ "question": "Show me all blue cotton shirts" }`

**Streaming events:** `sql_generated` → `sql_result` → `answer_chunk` (tokens) → `done`

### Product Search (Typesense)
```
GET /api/search?q=blue+cotton&page=1&per_page=10
```

### Image Search
```
POST /api/image-search             # multipart/form-data, field: "image"
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Git | any |
| Supabase account | free tier works |
| OpenRouter API key | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Typesense | local or cloud |

---

### 1. Clone the Repository

```bash
git clone https://github.com/HardikMahajan2005/WFX_Intern.git
cd WFX_Intern
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and fill environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)
```

**Run database migrations** (creates all tables in Supabase):
```bash
npm run migrate
```

**Seed the database** (loads ~4,700 rows from CSV files):
```bash
npm run seed
```

**Index products into Typesense** (required for search & image search):
```bash
npm run index-search
```

**Start the backend server:**
```bash
npm run dev       # Development (auto-restart on file changes)
npm start         # Production
```

Backend runs at: `http://localhost:4000`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Copy environment file:
```bash
cp .env.example .env
# VITE_API_URL=http://localhost:4000
```

**Start the dev server:**
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 Environment Variables

### Backend — `backend/.env`

```env
# Supabase — Dashboard → Project Settings → API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct Postgres — Dashboard → Project Settings → Database → Connection string (URI mode)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# OpenRouter — https://openrouter.ai/keys (used for Gemini 2.5 Flash)
OPENROUTER_API_KEY=sk-or-v1-...

# Typesense
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=your-typesense-api-key
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:4000
```

---

## 🐳 Docker Setup

Run the full stack with Docker Compose:

```bash
cd backend
docker-compose up --build
```

This starts:
- **Backend** on port `4000`
- **Typesense** on port `8108`

---

## 🗺️ NL2SQL Pipeline — How it Works

```
User Question
      │
      ▼
┌─────────────────────────────┐
│  1. Classify Question       │  → Is this a DB query or casual chat?
│     (Gemini 2.5 Flash)      │
└─────────────┬───────────────┘
              │ is_db_query = true
              ▼
┌─────────────────────────────┐
│  2. Generate SQL            │  → Converts NL → PostgreSQL SELECT
│     (Gemini 2.5 Flash)      │    with confidence score + reasoning
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. Validate SQL            │  → Only SELECT, no dangerous keywords
│     (Security layer)        │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. Execute SQL             │  → Runs on Supabase PostgreSQL via pg pool
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  5. Determine Chart Config  │  → AI decides: bar/line/pie/area/none
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  6. Stream AI Answer        │  → Natural language summary (SSE stream)
│     (Gemini 2.5 Flash)      │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  7. Log to query_logs       │  → Audit trail with confidence score
└─────────────────────────────┘
```

---

## 📊 Available npm Scripts

### Backend
```bash
npm run dev          # Start with auto-reload (node --watch)
npm start            # Start production server
npm run migrate      # Run all SQL migrations on Supabase
npm run seed         # Load CSV data into Supabase tables
npm run index-search # Index finished_goods into Typesense
npm run index-images # Generate image embeddings
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 👤 Author

**Hardik Mahajan**  
WFX Internship Assignment — 2026  
GitHub: [@HardikMahajan2005](https://github.com/HardikMahajan2005)
