import { bindCopy, setStatus } from "./hosted-common.mjs";
import { applyConfigToForm, readSceneConfigFromForm, readStyleConfigFromForm } from "./site-config.mjs";
import { mountTownSquare } from "./townsquare.mjs";

const registerView = document.getElementById("register-view");
const successView = document.getElementById("success-view");
const form = document.getElementById("register-form");
const submitButton = document.getElementById("register-submit");
const statusEl = document.getElementById("register-status");
const successSiteEl = document.getElementById("success-site");
const snippetEl = document.getElementById("embed-snippet");
const styleSnippetEl = document.getElementById("style-snippet");
const adminTokenEl = document.getElementById("admin-token");
const adminLink = document.getElementById("admin-link");
const previewRoot = document.getElementById("townsquare-root");

let previewHandle = null;

function mountPreview() {
  if (!(previewRoot instanceof HTMLElement)) return;
  previewHandle?.destroy();
  previewHandle = mountTownSquare(previewRoot, {
    serverOrigin: window.location.origin,
    scene: readSceneConfigFromForm(form),
    style: readStyleConfigFromForm(form),
    readingLabel: "Registration preview",
    readingUrl: window.location.href,
  });
}

function showSuccess(body) {
  successSiteEl.textContent = `${body.site.name} — ${body.site.origin}`;
  adminTokenEl.value = body.adminToken;
  snippetEl.value = body.embedSnippet;
  styleSnippetEl.value = body.styleSnippet;
  adminLink.href = body.adminUrl;

  previewHandle?.destroy();
  previewHandle = null;
  registerView.hidden = true;
  successView.hidden = false;
  window.scrollTo({ top: 0 });
}

form.addEventListener("input", () => {
  mountPreview();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus(statusEl, "Creating your TownSquare...", false, { hideWhenEmpty: true });

  try {
    const formData = new FormData(form);
    const response = await fetch("/api/sites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        origin: formData.get("origin"),
        name: formData.get("name"),
        sceneConfig: readSceneConfigFromForm(form),
        styleConfig: readStyleConfigFromForm(form),
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      setStatus(statusEl, body.error || "Could not create this TownSquare.", true, { hideWhenEmpty: true });
      return;
    }

    setStatus(statusEl, "", false, { hideWhenEmpty: true });
    showSuccess(body);
  } catch {
    setStatus(statusEl, "Could not reach the server. Check your connection and try again.", true, { hideWhenEmpty: true });
  } finally {
    submitButton.disabled = false;
  }
});

bindCopy(document.getElementById("copy-token"), () => adminTokenEl.value, { fallbackTarget: adminTokenEl });
bindCopy(document.getElementById("copy-snippet"), () => snippetEl.value, { fallbackTarget: snippetEl });
bindCopy(document.getElementById("copy-style"), () => styleSnippetEl.value, { fallbackTarget: styleSnippetEl });
applyConfigToForm(form);
mountPreview();
