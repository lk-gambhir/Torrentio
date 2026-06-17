import { appSettings, updateSettings } from "../utils/state.js";

export const getSettings = (req, res) => {
  res.json(appSettings);
};

export const saveSettings = (req, res) => {
  const newSettings = updateSettings(req.body);
  res.json(newSettings);
};
