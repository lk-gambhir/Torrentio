import os from "os";
import fs from "fs";
import path from "path";

export const browseFiles = (req, res) => {
  const requestedPath = req.query.path || os.homedir();
  
  try {
    const resolvedPath = path.resolve(requestedPath);
    const homeDir = os.homedir();
    
    if (!resolvedPath.startsWith(homeDir)) {
      return res.status(403).json({ error: "Access denied to directories outside of Home" });
    }

    const items = fs.readdirSync(resolvedPath, { withFileTypes: true });
    const directories = items
      .filter(item => item.isDirectory() && !item.name.startsWith('.')) // Only show public directories
      .map(item => ({
        name: item.name,
        path: path.join(resolvedPath, item.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Provide parent directory for 'Up' navigation
    const parentPath = path.dirname(resolvedPath);
    
    res.json({
      currentPath: resolvedPath,
      parentPath: resolvedPath === parentPath || resolvedPath === homeDir ? null : parentPath,
      directories
    });
  } catch (err) {
    console.error("Browse Error:", err);
    res.status(500).json({ error: "Cannot read directory" });
  }
};
