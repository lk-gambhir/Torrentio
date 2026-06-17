import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/api", apiRouter);

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.listen(port, () => {
  console.log(`[Torrentino] Server running at http://localhost:${port}`);
});
