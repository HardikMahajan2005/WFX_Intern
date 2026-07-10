

export const SCHEMA_DESCRIPTION = `
You have access to a PostgreSQL database with the following tables.
Use ONLY these tables and columns. Do not hallucinate columns.

-- TABLE: suppliers
-- Primary key: supplier_id (text, e.g. "SUP-001")
-- Columns:
--   supplier_id    TEXT  PRIMARY KEY
--   company_name   TEXT  NOT NULL        -- e.g. "Apex Textiles Ltd"
--   country        TEXT                  -- e.g. "Bangladesh"
--   contact        TEXT                  -- email / phone
--   lead_time_days INTEGER               -- typical lead time in days
--   rating         NUMERIC(2,1)          -- 1.0–5.0 supplier quality score
--   created_at     TIMESTAMPTZ

-- TABLE: buyers
-- Primary key: buyer_id (text, e.g. "BUY-001")
-- Columns:
--   buyer_id       TEXT  PRIMARY KEY
--   company_name   TEXT  NOT NULL        -- e.g. "H&M Retail GmbH"
--   country        TEXT
--   buyer_category TEXT                  -- e.g. "Fast Fashion", "Luxury", "Sports"
--   created_at     TIMESTAMPTZ

-- TABLE: finished_goods
-- Primary key: style_number (text, e.g. "WFX-2501")
-- Columns:
--   style_number   TEXT  PRIMARY KEY
--   style_name     TEXT  NOT NULL        -- e.g. "Oxford Stripe Shirt"
--   category       TEXT                  -- Known values: 'Dress', 'Hoodie', 'Jacket', 'Jeans', 'Polo', 'Shirt', 'Shorts', 'Skirt', 'Sweatshirt', 'T-Shirt', 'Trousers'
--   fabric         TEXT                  -- e.g. "Cotton", "Denim", "Polyester"
--   gsm            INTEGER               -- fabric weight in grams per sq. metre
--   color          TEXT                  -- Known values: 'Beige', 'Black', 'Blue', 'Blush Pink', 'Brown', 'Charcoal', 'Coral', 'Forest Green', 'Green', 'Grey Melange', 'Indigo', 'Lavender', 'Maroon', 'Mustard', 'Navy', 'Off White', 'Olive', 'Orange', 'Pink', 'Plum', 'Purple', 'Red', 'Teal', 'White', 'Yellow'
--   print          TEXT                  -- Known values: 'Printed', 'Solid'
--   season         TEXT                  -- e.g. 'SS25', 'AW24', 'SS24', 'AW25'
--   brand          TEXT
--   supplier_id    TEXT  REFERENCES suppliers(supplier_id)
--   cost           NUMERIC(10,2)         -- manufacturing cost (USD)
--   selling_price  NUMERIC(10,2)         -- wholesale selling price (USD)
--   image_url      TEXT
--   created_at     TIMESTAMPTZ

-- TABLE: sales_orders
-- Primary key: order_number (text, e.g. "SO-00001")
-- Columns:
--   order_number   TEXT  PRIMARY KEY
--   buyer_id       TEXT  REFERENCES buyers(buyer_id)
--   style_number   TEXT  REFERENCES finished_goods(style_number)
--   quantity       INTEGER
--   unit_price     NUMERIC(10,2)
--   shipment_date  DATE
--   status         TEXT                  -- Known values: 'Confirmed', 'Shipped', 'Pending', 'Cancelled'
--   created_at     TIMESTAMPTZ

-- TABLE: tech_packs
-- Primary key: tech_pack_id (text, e.g. "TP-WFX-2501")
-- Columns:
--   tech_pack_id      TEXT PRIMARY KEY
--   style_number      TEXT REFERENCES finished_goods(style_number)
--   fabric_details    TEXT
--   construction      TEXT
--   wash_instructions TEXT
--   created_at        TIMESTAMPTZ

-- TABLE: sales_invoices
-- Primary key: invoice_number (text, e.g. "INV-00001")
-- Columns:
--   invoice_number TEXT  PRIMARY KEY
--   order_number   TEXT  REFERENCES sales_orders(order_number)
--   amount         NUMERIC(12,2)         -- invoice total (in currency below)
--   currency       TEXT                  -- e.g. "USD", "EUR", "GBP", "INR"
--   payment_status TEXT                  -- Known values: 'Paid', 'Pending', 'Overdue'
--   created_at     TIMESTAMPTZ

-- TABLE: query_logs (read-only, do not query this in user-facing SQL)
--   id, question, generated_sql, success, error_message, created_at

RELATIONSHIP SUMMARY:
  finished_goods.supplier_id  → suppliers.supplier_id
  sales_orders.buyer_id       → buyers.buyer_id
  sales_orders.style_number   → finished_goods.style_number
  tech_packs.style_number     → finished_goods.style_number
  sales_invoices.order_number → sales_orders.order_number
`;
