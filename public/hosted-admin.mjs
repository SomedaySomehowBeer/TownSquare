import {
  bindCopy,
  renderDefinitionList,
  renderKeyValueList,
  setStatus,
  setValueIfIdle,
} from "./hosted-common.mjs";
import { getSceneSummaryEntries } from "./site-config.mjs";

const loginView = document.getElementById("login-view");
const adminView = document.getElementById("admin-view");
const loginForm = document.getElementById("login-form");
const loginTokenEl = document.getElementById("login-token");
const loginSubmitButton = document.getElementById("login-submit");
const loginStatusEl = document.getElementById("login-status");
const signOutButton = document.getElementById("sign-out");
const statusEl = document.getElementById("admin-status");
const metaEl = document.getElementById("site-meta");
const snippetEl = document.getElementById("embed-snippet");
const styleSnippetEl = document.getElementById("style-snippet");
const sceneSummaryEl = document.getElementById("scene-summary");
const copyButton = document.getElementById("copy-snippet");
const copyStyleButton = document.getElementById("copy-style");
const chatDisabledInput = document.getElementById("chat-disabled");
const clearMessagesButton = document.getElementById("clear-messages");
const disableSiteButton = document.getElementById("disable-site");
const visitorList = document.getElementById("visitor-list");

const STORAGE_KEY = "townsquare-admin-session";
const REFRESH_INTERVAL_MS = 5000;

let currentSite = null;
let siteKey = "";
let adminToken = "";
let refreshTimer = null;

function readStoredCredentials() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored.adminToken === "string") {
      return { siteKey: stored.siteKey || "", adminToken: stored.adminToken };
    }
  } catch {
    // fall through to empty credentials
  }
  return { siteKey: "", adminToken: "" };
}

function readCredentials() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const urlSiteKey = queryParams.get("siteKey") || hashParams.get("siteKey") || "";
  const urlAdminToken = hashParams.get("adminToken") || queryParams.get("adminToken") || "";

  if (urlSiteKey || urlAdminToken) {
    window.history.replaceState({}, document.title, "/admin");
    return { siteKey: urlSiteKey, adminToken: urlAdminToken };
  }

  return readStoredCredentials();
}

function storeCredentials() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ siteKey, adminToken }));
}

function clearCredentials() {
  siteKey = "";
  adminToken = "";
  currentSite = null;
  sessionStorage.removeItem(STORAGE_KEY);
}

function showLogin(message = "", isError = false) {
  stopAutoRefresh();
  adminView.hidden = true;
  loginView.hidden = false;
  setStatus(loginStatusEl, message, isError, { hideWhenEmpty: true });
  loginTokenEl.focus();
}

function showAdmin() {
  loginView.hidden = true;
  adminView.hidden = false;
  startAutoRefresh();
}

function startAutoRefresh() {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    if (!document.hidden) {
      loadSite({ silent: true });
    }
  }, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
  if (!refreshTimer) return;
  clearInterval(refreshTimer);
  refreshTimer = null;
}

async function api(path, payload) {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    return { ok: response.ok, status: response.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "Could not reach the server." } };
  }
}

function formatTime(value) {
  if (!value) return "Not seen yet";
  return new Date(value).toLocaleString();
}

function renderSceneSummary(sceneConfig = {}) {
  renderKeyValueList(sceneSummaryEl, getSceneSummaryEntries(sceneConfig));
}

function renderSiteMeta(site, scene) {
  renderDefinitionList(metaEl, [
    { label: "Site", value: site.name },
    { label: "Origin", value: site.origin },
    { label: "Status", value: site.disabled ? "Disabled" : "Enabled" },
    { label: "Verified", value: formatTime(site.verifiedAt) },
    { label: "Active visitors", value: scene.activeVisitors },
    { label: "Blocked", value: site.blockedCount },
  ]);
}

function createVisitorRow(visitor) {
  const row = document.createElement("article");
  row.className = "visitor-row";

  const info = document.createElement("div");
  const title = document.createElement("strong");
  const meta = document.createElement("span");
  const visitorName = String(visitor.displayName || "").trim();
  const visitorLabel = visitorName || `Visitor ${visitor.id}`;
  const visitorMeta = visitorName ? `Visitor ${visitor.id} · ` : "";

  title.textContent = visitorLabel;
  meta.textContent = `${visitorMeta}${visitor.clientCount} tab${visitor.clientCount === 1 ? "" : "s"} connected`;
  info.append(title, meta);

  const kick = document.createElement("button");
  kick.type = "button";
  kick.textContent = "Kick";
  kick.addEventListener("click", () => action("kickVisitor", { visitorId: visitor.id }));

  const block = document.createElement("button");
  block.type = "button";
  block.textContent = "Block";
  block.addEventListener("click", () => action("blockVisitor", { visitorId: visitor.id }));

  row.append(info, kick, block);
  return row;
}

function renderVisitors(scene) {
  visitorList.replaceChildren();
  if (scene.visitors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hosted-note";
    empty.textContent = "No active visitors right now.";
    visitorList.appendChild(empty);
    return;
  }

  for (const visitor of scene.visitors) {
    visitorList.appendChild(createVisitorRow(visitor));
  }
}

function render(data) {
  currentSite = data.site;
  const scene = data.scene;

  renderSiteMeta(currentSite, scene);
  setValueIfIdle(snippetEl, data.embedSnippet);
  setValueIfIdle(styleSnippetEl, data.styleSnippet);
  renderSceneSummary(currentSite.sceneConfig);
  renderVisitors(scene);

  chatDisabledInput.checked = currentSite.chatDisabled;
  disableSiteButton.textContent = currentSite.disabled ? "Enable site" : "Disable site";

  if (currentSite.disabled) {
    setStatus(statusEl, "Site is disabled. Visitors cannot connect.", true);
  } else if (currentSite.verifiedAt) {
    setStatus(statusEl, "Installed and active. Updates automatically.");
  } else {
    setStatus(statusEl, "Waiting for the snippet to load from your site. Updates automatically.");
  }
}

async function loadSite({ silent = false } = {}) {
  if (!adminToken) {
    showLogin();
    return;
  }

  if (!siteKey) {
    const login = await api("/api/admin/login", { adminToken });
    if (!login.ok) {
      clearCredentials();
      showLogin(login.body.error || "Could not open admin with that token.", true);
      return;
    }
    siteKey = login.body.site.siteKey;
  }

  const result = await api("/api/admin/site", { siteKey, adminToken });
  if (!result.ok) {
    if (result.status === 403) {
      clearCredentials();
      showLogin("That admin token no longer works.", true);
      return;
    }
    if (!silent) {
      setStatus(statusEl, result.body.error || "Could not load this site.", true);
    }
    return;
  }

  storeCredentials();
  showAdmin();
  render(result.body);
}

async function action(name, data = {}) {
  const result = await api("/api/admin/action", { siteKey, adminToken, action: name, ...data });
  if (!result.ok) {
    setStatus(statusEl, result.body.error || "Action failed.", true);
    return;
  }

  await loadSite();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginSubmitButton.disabled = true;
  setStatus(loginStatusEl, "Checking token...", false, { hideWhenEmpty: true });

  adminToken = loginTokenEl.value.trim();
  siteKey = "";
  await loadSite();

  loginSubmitButton.disabled = false;
  if (!adminView.hidden) {
    loginForm.reset();
    setStatus(loginStatusEl, "", false, { hideWhenEmpty: true });
  }
});

signOutButton.addEventListener("click", () => {
  clearCredentials();
  showLogin("Signed out. Your token was forgotten on this device.");
});

bindCopy(copyButton, () => snippetEl.value, { fallbackTarget: snippetEl });
bindCopy(copyStyleButton, () => styleSnippetEl.value, { fallbackTarget: styleSnippetEl });

chatDisabledInput.addEventListener("change", () => action("setChatDisabled", { disabled: chatDisabledInput.checked }));
clearMessagesButton.addEventListener("click", () => action("clearMessages"));
disableSiteButton.addEventListener("click", () => action("disableSite", { disabled: !currentSite.disabled }));

const credentials = readCredentials();
siteKey = credentials.siteKey;
adminToken = credentials.adminToken;

if (adminToken) {
  loadSite();
} else {
  showLogin();
}
