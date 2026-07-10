import { Router } from "express";
import multer from "multer";
import { imageSearch } from "../controllers/imageSearch.controller.js";

const router = Router();

// 1. Configure Multer memory storage and limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(
          new Error("Invalid file type. Only JPG, JPEG, PNG, and WebP images are allowed."),
          { status: 400, code: "INVALID_IMAGE_TYPE" }
        )
      );
    }
  },
});

// 2. Define POST route for image upload and search
router.post("/", upload.single("image"), imageSearch);

export default router;
