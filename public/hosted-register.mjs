const form = document.getElementById("register-form");
const statusEl = document.getElementById("register-status");
const resultEl = document.getElementById("register-result");
const snippetEl = document.getElementById("embed-snippet");
const adminTokenEl = document.getElementById("admin-token");
const copyButton = document.getElementById("copy-snippet");
const copyTokenButton = document.getElementById("copy-token");
const adminLink = document.getElementById("admin-link");
const adminLoginForm = document.getElementById("admin-login-form");
const tokenDialog = document.getElementById("token-dialog");
const dialogAdminTokenEl = document.getElementById("dialog-admin-token");
const copyDialogTokenButton = document.getElementById("copy-dialog-token");

function setStatus(message) {
  statusEl.textContent = message;
}

async function copySnippet() {
  await navigator.clipboard.writeText(snippetEl.value);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy snippet";
  }, 1200);
}

async function copyToken(button) {
  await navigator.clipboard.writeText(adminTokenEl.value);
  const previousText = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = previousText;
  }, 1200);
}

function showTokenDialog(adminToken) {
  dialogAdminTokenEl.value = adminToken;

  if (typeof tokenDialog.showModal === "function") {
    tokenDialog.showModal();
    return;
  }

  tokenDialog.setAttribute("open", "");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Creating...");

  const formData = new FormData(form);
  const response = await fetch("/api/sites", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      origin: formData.get("origin"),
      name: formData.get("name"),
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    setStatus(body.error || "Could not create this TownSquare.");
    return;
  }

  snippetEl.value = body.embedSnippet;
  adminTokenEl.value = body.adminToken;
  adminLink.href = body.adminUrl;
  resultEl.hidden = false;
  setStatus("Created. Paste the snippet into your website.");
  showTokenDialog(body.adminToken);
});

copyButton.addEventListener("click", () => {
  copySnippet().catch(() => setStatus("Copy failed. Select the snippet manually."));
});

copyTokenButton.addEventListener("click", () => {
  copyToken(copyTokenButton).catch(() => setStatus("Copy failed. Select the token manually."));
});

copyDialogTokenButton.addEventListener("click", () => {
  copyToken(copyDialogTokenButton).catch(() => setStatus("Copy failed. Select the token manually."));
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Checking token...");

  const formData = new FormData(adminLoginForm);
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ adminToken: formData.get("adminToken") }),
  });

  const body = await response.json();
  if (!response.ok) {
    setStatus(body.error || "Could not open admin with that token.");
    return;
  }

  window.location.href = body.adminUrl;
});
