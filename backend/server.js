import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middleware/errorHandler.js";
import finishedGoodsRoutes from "./src/routes/finishedGoods.routes.js";
import suppliersRoutes from "./src/routes/suppliers.routes.js";
import buyersRoutes from "./src/routes/buyers.routes.js";
import salesOrdersRoutes from "./src/routes/salesOrders.routes.js";
import salesInvoicesRoutes from "./src/routes/salesInvoices.routes.js";
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import nlQueryRoutes from "./src/routes/nlQuery.routes.js";
import searchRoutes from "./src/routes/search.routes.js";
import imageSearchRoutes from "./src/routes/imageSearch.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;


const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.use("/api/finished-goods", finishedGoodsRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/buyers", buyersRoutes);
app.use("/api/sales-orders", salesOrdersRoutes);
app.use("/api/sales-invoices", salesInvoicesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/nl-query", nlQueryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/image-search", imageSearchRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.path} not found`, code: "NOT_FOUND" },
  });
});


app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
