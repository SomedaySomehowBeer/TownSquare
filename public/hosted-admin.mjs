const statusEl = document.getElementById("admin-status");
const metaEl = document.getElementById("site-meta");
const installSection = document.getElementById("install-section");
const moderationSection = document.getElementById("moderation-section");
const snippetEl = document.getElementById("embed-snippet");
const copyButton = document.getElementById("copy-snippet");
const refreshButton = document.getElementById("refresh-site");
const chatDisabledInput = document.getElementById("chat-disabled");
const clearMessagesButton = document.getElementById("clear-messages");
const disableSiteButton = document.getElementById("disable-site");
const visitorList = document.getElementById("visitor-list");

let currentSite = null;
let siteKey = "";
let adminToken = "";

function readCredentialsFromUrl() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  siteKey = queryParams.get("siteKey") || hashParams.get("siteKey") || "";
  adminToken = hashParams.get("adminToken") || queryParams.get("adminToken") || "";

  if (siteKey || adminToken) {
    window.history.replaceState({}, document.title, "/admin");
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function formatTime(value) {
  if (!value) return "Not seen yet";
  return new Date(value).toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render(data) {
  currentSite = data.site;
  const scene = data.scene;

  metaEl.hidden = false;
  installSection.hidden = false;
  moderationSection.hidden = false;

  metaEl.innerHTML = `
    <dl>
      <div><dt>Site</dt><dd>${escapeHtml(currentSite.name)}</dd></div>
      <div><dt>Origin</dt><dd>${escapeHtml(currentSite.origin)}</dd></div>
      <div><dt>Status</dt><dd>${currentSite.disabled ? "Disabled" : "Enabled"}</dd></div>
      <div><dt>Verified</dt><dd>${formatTime(currentSite.verifiedAt)}</dd></div>
      <div><dt>Active visitors</dt><dd>${scene.activeVisitors}</dd></div>
      <div><dt>Blocked</dt><dd>${currentSite.blockedCount}</dd></div>
    </dl>
  `;

  snippetEl.value = data.embedSnippet;
  chatDisabledInput.checked = currentSite.chatDisabled;
  disableSiteButton.textContent = currentSite.disabled ? "Enable site" : "Disable site";

  visitorList.replaceChildren();
  if (scene.visitors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hosted-note";
    empty.textContent = "No active visitors right now.";
    visitorList.appendChild(empty);
  }

  for (const visitor of scene.visitors) {
    const row = document.createElement("article");
    row.className = "visitor-row";
    row.innerHTML = `
      <div>
        <strong>Visitor ${visitor.id}</strong>
        <span>${visitor.clientCount} tab${visitor.clientCount === 1 ? "" : "s"} connected</span>
      </div>
    `;

    const kick = document.createElement("button");
    kick.type = "button";
    kick.textContent = "Kick";
    kick.addEventListener("click", () => action("kickVisitor", { visitorId: visitor.id }));

    const block = document.createElement("button");
    block.type = "button";
    block.textContent = "Block";
    block.addEventListener("click", () => action("blockVisitor", { visitorId: visitor.id }));

    row.append(kick, block);
    visitorList.appendChild(row);
  }

  setStatus(currentSite.verifiedAt ? "Installed and active." : "Waiting for the snippet to load from your site.");
}

async function loadSite() {
  if (!adminToken) {
    setStatus("Missing admin token.");
    return;
  }

  if (!siteKey) {
    const loginResponse = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adminToken }),
    });
    const loginBody = await loginResponse.json();
    if (!loginResponse.ok) {
      setStatus(loginBody.error || "Could not load this site.");
      return;
    }
    siteKey = loginBody.site.siteKey;
  }

  const response = await fetch("/api/admin/site", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ siteKey, adminToken }),
  });
  const body = await response.json();
  if (!response.ok) {
    setStatus(body.error || "Could not load this site.");
    return;
  }

  render(body);
}

async function action(name, data = {}) {
  const response = await fetch("/api/admin/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ siteKey, adminToken, action: name, ...data }),
  });

  const body = await response.json();
  if (!response.ok) {
    setStatus(body.error || "Action failed.");
    return;
  }

  await loadSite();
}

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(snippetEl.value);
    copyButton.textContent = "Copied";
    setTimeout(() => {
      copyButton.textContent = "Copy snippet";
    }, 1200);
  } catch {
    setStatus("Copy failed. Select the snippet manually.");
  }
});

refreshButton.addEventListener("click", loadSite);
chatDisabledInput.addEventListener("change", () => action("setChatDisabled", { disabled: chatDisabledInput.checked }));
clearMessagesButton.addEventListener("click", () => action("clearMessages"));
disableSiteButton.addEventListener("click", () => action("disableSite", { disabled: !currentSite.disabled }));

readCredentialsFromUrl();
loadSite();
