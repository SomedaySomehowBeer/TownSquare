const form = document.getElementById("register-form");
const statusEl = document.getElementById("register-status");
const resultEl = document.getElementById("register-result");
const snippetEl = document.getElementById("embed-snippet");
const copyButton = document.getElementById("copy-snippet");
const adminLink = document.getElementById("admin-link");

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
  adminLink.href = body.adminUrl;
  resultEl.hidden = false;
  setStatus("Created. Paste the snippet into your website.");
});

copyButton.addEventListener("click", () => {
  copySnippet().catch(() => setStatus("Copy failed. Select the snippet manually."));
});
