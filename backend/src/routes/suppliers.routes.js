import { Router } from "express";
import { index } from "../controllers/suppliers.controller.js";
import { validate } from "../middleware/validate.js";
import { paginationSchema } from "../utils/validators.js";

const router = Router();
router.get("/", validate(paginationSchema), index);
export default router;
