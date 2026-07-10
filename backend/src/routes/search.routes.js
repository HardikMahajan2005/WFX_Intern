import { Router } from "express";
import { searchText } from "../controllers/search.controller.js";
import { validate } from "../middleware/validate.js";
import { searchTextQuerySchema } from "../utils/validators.js";

const router = Router();

router.get("/text", validate(searchTextQuerySchema), searchText);

export default router;
