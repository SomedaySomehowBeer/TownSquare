"use strict";

const MAX_PLUGIN_DATA_BYTES = 64 * 1024;

function ensurePluginData(site) {
  if (site.plugins && typeof site.plugins === "object" && !Array.isArray(site.plugins)) {
    for (const value of Object.values(site.plugins)) deepFreeze(value);
    return false;
  }
  site.plugins = {};
  return true;
}

function getPluginData(site, pluginName) {
  if (!site) return null;
  ensurePluginData(site);
  return site.plugins[pluginName] ?? null;
}

function setPluginData(site, pluginName, value) {
  ensurePluginData(site);
  const json = JSON.stringify(value);
  if (json === undefined) throw new TypeError("Plugin data must be JSON-serializable");
  if (Buffer.byteLength(json) > MAX_PLUGIN_DATA_BYTES) {
    throw new RangeError(`Plugin data exceeds ${MAX_PLUGIN_DATA_BYTES} bytes`);
  }
  const normalized = deepFreeze(JSON.parse(json));
  site.plugins[pluginName] = normalized;
  return normalized;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

module.exports = { MAX_PLUGIN_DATA_BYTES, ensurePluginData, getPluginData, setPluginData };
