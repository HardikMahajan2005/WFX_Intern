import { Router } from "express";
import { nlQuery, nlQueryStream } from "../controllers/nlQuery.controller.js";

const router = Router();
router.post("/", nlQuery);
router.post("/stream", nlQueryStream);

export default router;
