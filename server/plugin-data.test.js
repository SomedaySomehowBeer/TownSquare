"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MAX_PLUGIN_DATA_BYTES,
  ensurePluginData,
  getPluginData,
  setPluginData,
} = require("./plugin-data");

test("plugin data is namespaced, normalized, and immutable", () => {
  const site = {};
  assert.equal(ensurePluginData(site), true);
  assert.equal(ensurePluginData(site), false);

  const saved = setPluginData(site, "owner-figure", { hat: "top-hat", colors: ["gold"] });
  assert.deepEqual(getPluginData(site, "owner-figure"), saved);
  assert.equal(Object.isFrozen(saved), true);
  assert.equal(Object.isFrozen(saved.colors), true);
  assert.equal(getPluginData(site, "analytics"), null);
});

test("plugin data rejects non-JSON and oversized values", () => {
  const site = {};
  assert.throws(() => setPluginData(site, "bad", undefined), /JSON-serializable/);
  assert.throws(
    () => setPluginData(site, "large", { value: "x".repeat(MAX_PLUGIN_DATA_BYTES) }),
    /exceeds/,
  );
});
