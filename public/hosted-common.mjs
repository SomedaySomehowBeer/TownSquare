export function setStatus(element, message, isError = false, { hideWhenEmpty = false } = {}) {
  element.textContent = message;
  element.classList.toggle("hosted-status--error", isError);
  if (hideWhenEmpty) {
    element.hidden = !message;
  }
}

export function bindCopy(button, getText, { doneLabel = "Copied", fallbackTarget = null } = {}) {
  const originalLabel = button.textContent;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getText());
    } catch {
      if (fallbackTarget) {
        fallbackTarget.focus();
        fallbackTarget.select();
      }
      return;
    }

    button.textContent = doneLabel;
    setTimeout(() => {
      button.textContent = originalLabel;
    }, 1200);
  });
}

export function setValueIfIdle(input, value) {
  if (document.activeElement !== input) {
    input.value = value;
  }
}

export function renderKeyValueList(container, entries) {
  container.replaceChildren();
  for (const entry of entries) {
    const row = document.createElement("div");
    const key = document.createElement("strong");
    const value = document.createElement("span");
    key.textContent = entry.label;
    value.textContent = String(entry.value);
    row.append(key, value);
    container.appendChild(row);
  }
}

export function renderDefinitionList(container, entries) {
  container.replaceChildren();
  const list = document.createElement("dl");

  for (const entry of entries) {
    const row = document.createElement("div");
    const key = document.createElement("dt");
    const value = document.createElement("dd");
    key.textContent = entry.label;
    value.textContent = String(entry.value);
    row.append(key, value);
    list.appendChild(row);
  }

  container.appendChild(list);
}
