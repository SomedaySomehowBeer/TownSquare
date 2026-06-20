# TownSquare server plugins

Plugins are trusted in-process feature modules. They are registered before
`server.js` starts; there is no package discovery or remote installation.
`server/plugins.js` is the source of truth for the manifest and hook contract.

## Register a private plugin

```js
const { registerPlugin } = require("../TownSquare/server/plugins");
const ownerFigure = require("./plugins/owner-figure");

registerPlugin(ownerFigure);
require("../TownSquare/server");
```

Plugin names use lowercase kebab-case and are also their storage and wire-data
namespace. Browser module paths are same-origin absolute `.mjs` paths. The Pro
deployment must serve those paths itself, normally through its reverse proxy.

## Full-stack plugin manifest

```js
module.exports = {
  name: "owner-figure",
  adminModule: "/pro/owner-figure/admin.mjs",
  widgetModule: "/pro/owner-figure/widget.mjs",

  isEnabled: ({ site }) => site?.supporter === true,

  adminActions: {
    update({ owners, setData }, input) {
      if (!owners.some((owner) => owner.handle === input.ownerHandle)) {
        return { error: "Unknown owner." };
      }
      setData({ ownerHandle: input.ownerHandle, hat: input.hat });
    },
  },

  extendVisitor(_visitor, { visitor, data }) {
    if (!visitor.isOwner || visitor.ownerHandle !== data?.ownerHandle) return;
    return { hat: data.hat };
  },

  extendAdminPanel(panel, { data }) {
    return {
      ...panel,
      plugins: { ...panel.plugins, "owner-figure": data },
    };
  },
};
```

`isEnabled` controls the plugin's hooks, actions, visitor data, and browser
module descriptors for a site. Current site context includes `siteKey`, `name`,
`origin`, and `supporter`.

## Plugin storage and admin actions

Each site persists plugin data under `site.plugins[pluginName]`. Admin action
context exposes the current immutable `data`, `owners`, public `visitors`, and
`setData(nextData)`. `setData` replaces only that plugin's namespace and saves
it atomically with the site registry after the action succeeds. Failed actions
do not retain staged data. Data must be JSON and is limited to 64 KiB per plugin.

Browser admin modules call actions through the authenticated core admin API;
they never receive the admin token:

```js
export function mountAdminPlugin({ container, action }) {
  const section = document.createElement("section");
  section.className = "hosted-section";
  container.appendChild(section);

  return {
    render(snapshot) {
      const config = snapshot.plugins?.["owner-figure"];
      // Render idempotently from the latest five-second admin snapshot.
    },
    destroy() {},
  };
}
```

Call `action("update", input)` to invoke `adminActions.update`. Admin actions
are synchronous; the returned promise represents the browser request.

## Visitor data and widget modules

`extendVisitor` runs through the single identity serializer used by hello,
join, movement, profile, and admin visitor snapshots. Its return value is
placed under `visitor.plugins[pluginName]`; plugins cannot replace core visitor
fields or another plugin's namespace.

Widget modules are announced in the WebSocket hello payload, so enabling a
plugin does not require owners to replace an existing embed snippet. A module
mounts once and receives idempotent figure updates:

```js
export function mountWidgetPlugin() {
  return {
    renderFigure({ figure, data, isSelf, visitor }) {
      // Add, update, or remove only this plugin's decoration inside `figure`.
    },
    removeFigure({ figure }) {},
    destroy() {},
  };
}
```

`data` is the current `visitor.plugins[pluginName]` value or `null`. The widget
core continues to own figure creation, movement, presence, and removal.

## Existing hooks

Event/decision hooks are `onVisitorJoin`, `onMessage`, and `onSocketMessage`.
Payload hooks are `extendSiteConfig`, `extendAdminPanel`, `extendMapData`, and
`extendWidgetConfig`. Hooks run synchronously in registration order. Returning
`false` from `onMessage` or `onSocketMessage` stops the action. Plugin failures
are logged and otherwise fail open so core self-hosted behavior continues.

The real contract fixture is `server/fixtures/feature-plugin.js`; its API and
WebSocket client is `scripts/plugin-smoke-test.js` (`npm run smoke:plugins`).
