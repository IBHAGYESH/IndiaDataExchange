import multer from "multer";
import path from "path";
import { Request } from "express";

const SAMPLE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const FULL_DATA_MAX_SIZE = 500 * 1024 * 1024; // 500MB

const storage = multer.memoryStorage();

export const datasetUpload = multer({
  storage,
  limits: {
    fileSize: FULL_DATA_MAX_SIZE,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = [
      ".csv", ".json", ".pdf", ".txt",
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".zip", ".tar", ".gz",
      ".mp3", ".wav", ".mp4", ".avi", ".mov", ".mkv",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
}).fields([
  { name: "sampleFile", maxCount: 1 },
  { name: "fullDataFile", maxCount: 1 },
]);

export const submissionUpload = multer({
  storage,
  limits: {
    fileSize: FULL_DATA_MAX_SIZE,
  },
}).fields([
  { name: "sampleFile", maxCount: 1 },
  { name: "fullDataFile", maxCount: 1 },
]);

export type MulterFiles = {
  sampleFile?: Express.Multer.File[];
  fullDataFile?: Express.Multer.File[];
};
