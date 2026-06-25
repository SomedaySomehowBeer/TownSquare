/**
 * Loads trusted widget feature modules declared by the TownSquare server.
 * A module exports mountWidgetPlugin({ root, stage, plugin }) and returns an
 * optional { renderFigure(...), removeFigure(...), destroy() } lifecycle.
 */
export function createWidgetPluginRuntime(ctx) {
  const mounted = new Map();
  const loading = new Map();
  let active = new Map();
  let disposed = false;

  function setModules(modules) {
    if (disposed) return;
    active = new Map(validModules(modules).map((descriptor) => [descriptor.name, descriptor]));

    for (const [name, instance] of mounted) {
      if (!active.has(name)) {
        instance?.destroy?.();
        mounted.delete(name);
      }
    }
    for (const descriptor of active.values()) {
      if (!mounted.has(descriptor.name) && !loading.has(descriptor.name)) {
        const pending = mount(descriptor).finally(() => loading.delete(descriptor.name));
        loading.set(descriptor.name, pending);
      }
    }
  }

  async function mount(descriptor) {
    try {
      const moduleUrl = new URL(descriptor.module, ctx.serverOrigin);
      if (moduleUrl.origin !== new URL(ctx.serverOrigin).origin) {
        throw new Error("Widget plugin modules must use the TownSquare server origin");
      }
      const pluginModule = await import(moduleUrl.href);
      if (disposed || !active.has(descriptor.name)) return;
      if (typeof pluginModule.mountWidgetPlugin !== "function") {
        throw new Error("Widget plugin module must export mountWidgetPlugin");
      }

      const instance = await pluginModule.mountWidgetPlugin({
        root: ctx.root,
        stage: ctx.stage,
        plugin: descriptor.name,
      });
      if (disposed || !active.has(descriptor.name)) {
        instance?.destroy?.();
        return;
      }
      mounted.set(descriptor.name, instance);
      renderPresence(ctx.self);
      for (const peer of ctx.peers.values()) renderPresence(peer);
    } catch (error) {
      console.warn(`Could not load TownSquare widget plugin ${descriptor.name}: ${error.message}`);
    }
  }

  function renderPresence(presence) {
    if (!presence?.avatar?.el) return;
    const visitor = visitorSnapshot(presence);
    for (const [name, instance] of mounted) {
      instance?.renderFigure?.({
        figure: presence.avatar.el,
        visitor,
        data: visitor.plugins[name] ?? null,
        isSelf: presence === ctx.self,
      });
    }
  }

  function removePresence(presence) {
    const visitor = visitorSnapshot(presence);
    for (const [name, instance] of mounted) {
      instance?.removeFigure?.({
        figure: presence.avatar.el,
        visitor,
        data: visitor.plugins[name] ?? null,
        isSelf: presence === ctx.self,
      });
    }
  }

  function destroy() {
    disposed = true;
    active.clear();
    for (const instance of mounted.values()) instance?.destroy?.();
    mounted.clear();
  }

  return { setModules, renderPresence, removePresence, destroy };
}

function visitorSnapshot(presence) {
  return Object.freeze({
    id: presence.id,
    displayName: presence.displayName,
    color: presence.color,
    isOwner: presence.isOwner === true,
    plugins: presence.plugins && typeof presence.plugins === "object" ? presence.plugins : {},
  });
}

function validModules(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((descriptor) => (
    descriptor
    && typeof descriptor.name === "string"
    && typeof descriptor.module === "string"
    && descriptor.module.startsWith("/")
  ));
}
