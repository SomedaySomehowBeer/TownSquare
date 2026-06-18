/**
 * Render the site chat as one chronological thread for the admin.
 *
 * Every visitor carries their own recent messages (newest-last); we flatten and
 * sort by timestamp so the admin reads one interleaved feed and can moderate
 * whoever is speaking. Messages are ephemeral on the server — only the last few
 * per active visitor exist — so this is a live view, not a history log.
 *
 * @param {HTMLElement} container
 * @param {Array<{ id: number, displayName?: string, color?: string, messages?: Array<{ text: string, at: number }> }>} visitors
 * @param {{ onKick: (visitorId: number) => void, onBlock: (visitorId: number) => void }} handlers
 */
export function renderChatThread(container, visitors, { onKick, onBlock }) {
  const entries = [];
  for (const visitor of visitors) {
    const visitorName = String(visitor.displayName || "").trim();
    const label = visitorName || `Visitor ${visitor.id}`;
    for (const message of visitor.messages || []) {
      entries.push({ visitor, label, text: message.text, at: message.at });
    }
  }
  entries.sort((a, b) => a.at - b.at);

  container.replaceChildren();

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hosted-note";
    empty.textContent = "No messages yet.";
    container.appendChild(empty);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("article");
    row.className = "chat-message";

    const head = document.createElement("div");
    head.className = "chat-message-head";

    const author = document.createElement("span");
    author.className = "chat-author";
    author.style.setProperty("--author-color", entry.visitor.color || "currentColor");
    author.textContent = entry.label;

    const time = document.createElement("time");
    time.className = "chat-time";
    time.textContent = formatClock(entry.at);

    const kick = document.createElement("button");
    kick.type = "button";
    kick.className = "chat-mod-button";
    kick.textContent = "Kick";
    kick.addEventListener("click", () => onKick(entry.visitor.id));

    const block = document.createElement("button");
    block.type = "button";
    block.className = "chat-mod-button";
    block.textContent = "Ban";
    block.addEventListener("click", () => onBlock(entry.visitor.id));

    head.append(author, time, kick, block);

    const body = document.createElement("p");
    body.className = "chat-text";
    body.textContent = entry.text;

    row.append(head, body);
    container.appendChild(row);
  }
}

function formatClock(at) {
  if (!at) return "";
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
