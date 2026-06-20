"use strict";

const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const HTTP_ORIGIN = process.env.TOWNSQUARE_HTTP_ORIGIN || "http://127.0.0.1:8787";
const WS_URL = process.env.TOWNSQUARE_WS_URL || "ws://127.0.0.1:8787/live";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", ".data");

async function post(pathname, body) {
  const response = await fetch(`${HTTP_ORIGIN}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

function connect(siteKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(WS_URL);
    url.searchParams.set("siteKey", siteKey);
    const ws = new WebSocket(url, { headers: { Origin: HTTP_ORIGIN } });
    const seen = [];
    ws.on("open", () => ws.send(JSON.stringify({ type: "init", browserId: "plugin-smoke", x: 0.5 })));
    ws.on("message", (raw) => {
      const message = JSON.parse(String(raw));
      seen.push(message);
      if (message.type === "hello") resolve({ ws, seen, hello: message });
    });
    ws.on("error", reject);
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const registration = await post("/api/sites", { name: "Plugin smoke", origin: HTTP_ORIGIN });
  assert(registration.response.ok, registration.body.error || "site registration failed");
  const { siteKey } = registration.body.site;
  const { adminToken } = registration.body;

  const visitor = await connect(siteKey);
  assert(
    visitor.hello.pluginModules?.some((entry) => entry.name === "test-feature"),
    "hello did not include the widget module",
  );
  assert(visitor.hello.plugins?.["test-feature"]?.hat === "none", "hello did not include visitor plugin data");

  const before = await post("/api/admin/site", { siteKey, adminToken });
  assert(before.response.ok, before.body.error || "admin load failed");
  assert(
    before.body.pluginModules?.some((entry) => entry.name === "test-feature"),
    "admin response did not include the admin module",
  );

  const updated = await post("/api/admin/action", {
    siteKey,
    adminToken,
    plugin: "test-feature",
    action: "update",
    input: { hat: "top-hat" },
  });
  assert(updated.response.ok, updated.body.error || "plugin action failed");
  assert(updated.body.plugins?.["test-feature"]?.hat === "top-hat", "admin extension did not update");

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert(
    visitor.seen.some((message) => (
      message.type === "profile" && message.plugins?.["test-feature"]?.hat === "top-hat"
    )),
    "plugin action did not broadcast updated visitor data",
  );

  const persisted = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "sites.json"), "utf8"));
  const savedSite = persisted.sites.find((site) => site.siteKey === siteKey);
  assert(savedSite?.plugins?.["test-feature"]?.hat === "top-hat", "plugin data was not persisted");

  visitor.ws.close();
  console.log("Plugin smoke test passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
