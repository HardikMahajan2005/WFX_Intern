import { Router } from "express";
import { index } from "../controllers/salesOrders.controller.js";
import { validate } from "../middleware/validate.js";
import { salesOrdersQuerySchema } from "../utils/validators.js";

const router = Router();
router.get("/", validate(salesOrdersQuerySchema), index);
export default router;
