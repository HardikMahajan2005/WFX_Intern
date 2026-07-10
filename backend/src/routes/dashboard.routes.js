import { Router } from "express";
import { stats, revenueByMonth } from "../controllers/dashboard.controller.js";

const router = Router();
router.get("/stats",            stats);
router.get("/revenue-by-month", revenueByMonth);
export default router;
