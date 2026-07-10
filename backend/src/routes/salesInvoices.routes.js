import { Router } from "express";
import { index } from "../controllers/salesInvoices.controller.js";
import { validate } from "../middleware/validate.js";
import { salesInvoicesQuerySchema } from "../utils/validators.js";

const router = Router();
router.get("/", validate(salesInvoicesQuerySchema), index);
export default router;
