import express from "express";
import multer from "multer";

import {
  startDownload,
  getDownloads,
  pauseDownload,
  resumeDownload,
  stopDownload
} from "../controllers/download.controller.js";
import { getSettings, saveSettings } from "../controllers/settings.controller.js";
import { browseFiles } from "../controllers/fileBrowser.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Downloads
router.post("/download", upload.single("torrent"), startDownload);
router.get("/downloads", getDownloads);

// Controls
router.post("/downloads/:id/pause", pauseDownload);
router.post("/downloads/:id/resume", resumeDownload);
router.post("/downloads/:id/stop", stopDownload);

// Settings
router.get("/settings", getSettings);
router.post("/settings", saveSettings);

// File Browser
router.get("/browse", browseFiles);

export default router;
