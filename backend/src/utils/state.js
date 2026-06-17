import os from "os";
import path from "path";

// In-memory state of all downloads
export const activeDownloads = {};

// Global settings
export let appSettings = {
  defaultSavePath: path.join(os.homedir(), "Downloads"),
  listenPort: 6881,
  maxConnections: 200,
  requireEncryption: true,
  enableDHT: false
};

// Function to safely update settings
export const updateSettings = (newSettings) => {
  appSettings = { ...appSettings, ...newSettings };
  return appSettings;
};
