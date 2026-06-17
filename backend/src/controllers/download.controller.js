import path from "path";
import * as torrentParser from "../torrent-parser.js";
import download from "../download.js";
import { activeDownloads, appSettings } from "../utils/state.js";

export const startDownload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No torrent file provided" });
  }

  try {
    const torrentFilePath = req.file.path;
    
    // Parse torrent
    const torrent = torrentParser.open(torrentFilePath);
    const rawName = torrent.info.name ? new TextDecoder().decode(torrent.info.name) : req.file.originalname;
    
    // Sanitize to prevent path traversal in the parent folder
    const torrentName = rawName.replace(/[\/\\]/g, "_");
    
    const downloadPath = path.join(appSettings.defaultSavePath, torrentName);
    
    const totalSize = torrent.info.length || (torrent.info.files ? torrent.info.files.reduce((sum, f) => sum + f.length, 0) : 1000000000);

    const downloadId = Date.now().toString();
    activeDownloads[downloadId] = {
      id: downloadId,
      name: torrentName,
      status: "downloading",
      progress: 0,
      speed: 0,
      peers: 0,
      seeds: 0,
      history: [],
      size: totalSize
    };

    console.log(`\n[Torrentino API] Starting download for ${torrentName} into ${downloadPath}`);
    
    let lastProgress = 0;
    let lastTime = Date.now();

    setTimeout(() => {
      try {
        download(
          torrent, 
          downloadPath,
          // onProgress
          (progress) => {
            const dl = activeDownloads[downloadId];
            if (!dl || dl.status !== "downloading") return;

            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000; // seconds
            if (timeDiff > 0) {
              const bytesDiff = (progress - lastProgress) * totalSize;
              dl.speed = (bytesDiff / timeDiff) / (1024 * 1024); // MB/s
            }
            
            dl.progress = progress * 100;
            dl.history.push({ time: new Date().toLocaleTimeString(), speed: dl.speed });
            if (dl.history.length > 20) dl.history.shift();

            lastProgress = progress;
            lastTime = now;
          },
          // onComplete
          () => {
            const dl = activeDownloads[downloadId];
            if (dl) {
              dl.status = "completed";
              dl.progress = 100;
              dl.speed = 0;
            }
          },
          // onError
          (err) => {
            console.error("[Torrentino API] Download error:", err);
            if (activeDownloads[downloadId]) activeDownloads[downloadId].status = "error";
          },
          // onPeers
          (peerCount) => {
            const dl = activeDownloads[downloadId];
            if (dl) dl.peers = peerCount;
          },
          // onSeeds
          (seedCount) => {
            const dl = activeDownloads[downloadId];
            if (dl) dl.seeds = seedCount;
          }
        );
      } catch (err) {
        console.error("[Torrentino API] Download initialization error:", err);
        if (activeDownloads[downloadId]) activeDownloads[downloadId].status = "error";
      }
    }, 0);

    res.json({ message: "Download started", id: downloadId, name: torrentName });
  } catch (err) {
    console.error("[Torrentino API] Error processing torrent:", err);
    res.status(500).json({ error: "Failed to process torrent file" });
  }
};

export const getDownloads = (req, res) => {
  res.json(Object.values(activeDownloads));
};

export const pauseDownload = (req, res) => {
  const dl = activeDownloads[req.params.id];
  if (dl && dl.status === "downloading") {
    dl.status = "paused";
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Cannot pause" });
};

export const resumeDownload = (req, res) => {
  const dl = activeDownloads[req.params.id];
  if (dl && dl.status === "paused") {
    dl.status = "downloading";
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Cannot resume" });
};

export const stopDownload = (req, res) => {
  const dl = activeDownloads[req.params.id];
  if (dl) {
    dl.status = "stopped";
    dl.speed = 0;
    return res.json({ success: true });
  }
  res.status(400).json({ error: "Not found" });
};
