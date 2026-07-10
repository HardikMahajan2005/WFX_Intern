import { Router } from "express";
import { index, show, getFilters } from "../controllers/finishedGoods.controller.js";
import { validate } from "../middleware/validate.js";
import { finishedGoodsQuerySchema } from "../utils/validators.js";

const router = Router();
router.get("/", validate(finishedGoodsQuerySchema), index);
router.get("/filters/options", getFilters);
router.get("/:id", show);

export default router;
