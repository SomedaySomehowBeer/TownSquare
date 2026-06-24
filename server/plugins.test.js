"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { PluginManager } = require("./plugins");

test("plugins run in registration order and can stop a core action", () => {
  const calls = [];
  const manager = new PluginManager();
  manager.register({ name: "analytics", onMessage: () => calls.push("analytics") });
  manager.register({ name: "moderation", onMessage: () => false });
  manager.register({ name: "notifications", onMessage: () => calls.push("notifications") });

  assert.equal(manager.run("onMessage", { message: { text: "hello" } }), false);
  assert.deepEqual(calls, ["analytics"]);
});

test("extension hooks compose returned values", () => {
  const manager = new PluginManager();
  manager.register({
    name: "supporter-badges",
    extendWidgetConfig: (config) => ({ ...config, supporter: true }),
  });
  manager.register({
    name: "custom-themes",
    extendWidgetConfig: (config) => ({ ...config, themeName: "midnight" }),
  });

  assert.deepEqual(
    manager.extend("extendWidgetConfig", { siteKey: "site_1" }),
    { siteKey: "site_1", supporter: true, themeName: "midnight" },
  );
});

test("registration rejects duplicate names and unknown hooks", () => {
  const manager = new PluginManager();
  manager.register({ name: "analytics" });

  assert.throws(() => manager.register({ name: "analytics" }), /already registered/);
  assert.throws(
    () => manager.register({ name: "moderation", beforeEverything() {} }),
    /Unknown TownSquare plugin hook/,
  );
});

test("visitor extensions are namespaced and browser modules respect enablement", () => {
  const manager = new PluginManager();
  manager.register({
    name: "owner-figure",
    adminModule: "/pro/owner-figure/admin.mjs",
    widgetModule: "/pro/owner-figure/widget.mjs",
    isEnabled: ({ site }) => site.supporter,
    extendVisitor: (_visitor, { data, visitor }) => (visitor.isOwner ? data : undefined),
  });
  const context = (site, visitor) => () => ({
    site,
    visitor,
    data: { hat: "top-hat" },
  });

  assert.deepEqual(
    manager.extendVisitor(
      { id: 1, displayName: "Owner" },
      context({ supporter: true }, { isOwner: true }),
    ),
    {
      id: 1,
      displayName: "Owner",
      plugins: { "owner-figure": { hat: "top-hat" } },
    },
  );
  assert.deepEqual(manager.browserModules("admin", context({ supporter: true }, {})), [
    { name: "owner-figure", module: "/pro/owner-figure/admin.mjs" },
  ]);
  assert.deepEqual(manager.browserModules("widget", context({ supporter: false }, {})), []);
});

test("plugin admin actions receive only their scoped context", () => {
  const manager = new PluginManager();
  let saved = null;
  manager.register({
    name: "owner-figure",
    adminActions: {
      update({ setData }, input) {
        setData({ hat: input.hat });
      },
    },
  });

  const invoked = manager.invokeAdminAction(
    "owner-figure",
    "update",
    () => ({ setData: (value) => { saved = value; } }),
    { hat: "top-hat" },
  );

  assert.equal(invoked.found, true);
  assert.deepEqual(saved, { hat: "top-hat" });
  assert.deepEqual(manager.invokeAdminAction("owner-figure", "missing", {}, {}), { found: false });
});
