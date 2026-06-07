const root = document.getElementById("townsquare-root");

if (!root) {
  throw new Error("TownSquare root element not found");
}

/**
 * Browser-side widget for the first playable TownSquare slice.
 *
 * This intentionally stays small and dependency-free so the first
 * open-source version is easy to read, run, and adapt.
 */

const BUBBLE_TTL_MS = 6000;
const MOVEMENT_SPEED = 0.22;
const SEND_INTERVAL_MS = 45;
const MIN_X = 0.02;
const MAX_X = 0.98;

const socketUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/live`;
const peers = new Map();

const app = renderShell();
const stage = app.querySelector('[data-role="stage"]');
const statusEl = app.querySelector('[data-role="status"]');

const self = {
  id: null,
  x: 0.5,
  movingLeft: false,
  movingRight: false,
  lastSentX: 0.5,
  lastSendAt: 0,
  avatar: createAvatar({ isSelf: true }),
};

stage.appendChild(self.avatar.el);
renderAvatar(self.avatar, self.x);
updateStatus();

const socket = new WebSocket(socketUrl);
wireSocket(socket);
wireKeyboard();
requestAnimationFrame(tick);

function renderShell() {
  const element = document.createElement("section");
  element.className = "townsquare";
  element.innerHTML = `
    <div class="townsquare__status">
      <span data-role="status">Connecting…</span>
      <span>Use ← and → to walk. Presence and chat only in this first slice.</span>
    </div>
    <div class="townsquare__stage" data-role="stage">
      <div class="townsquare__ground"></div>
    </div>
    <div class="townsquare__hint">This widget is embedded into a normal page instead of running as a disconnected mockup.</div>
  `;
  root.appendChild(element);
  return element;
}

function createAvatar({ isSelf }) {
  const el = document.createElement("div");
  el.className = `avatar ${isSelf ? "avatar--self" : "avatar--peer"}`;
  el.innerHTML = `
    <svg viewBox="0 0 20 46" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <circle cx="10" cy="6" r="4"></circle>
      <line x1="10" y1="10" x2="10" y2="26"></line>
      <line class="arm-left" x1="10" y1="14" x2="4" y2="20"></line>
      <line class="arm-right" x1="10" y1="14" x2="16" y2="20"></line>
      <line class="leg-left" x1="10" y1="26" x2="6" y2="42"></line>
      <line class="leg-right" x1="10" y1="26" x2="14" y2="42"></line>
    </svg>
  `;

  const bubble = document.createElement("div");
  bubble.className = "avatar__bubble";
  bubble.hidden = true;
  el.appendChild(bubble);

  const avatar = { el, bubble };

  if (!isSelf) {
    return avatar;
  }

  const controls = document.createElement("div");
  controls.className = "avatar__controls";

  const toggle = document.createElement("button");
  toggle.className = "avatar__chat-toggle";
  toggle.type = "button";
  toggle.textContent = "💬";
  toggle.setAttribute("aria-label", "Say something");

  const composer = document.createElement("form");
  composer.className = "avatar__composer";
  composer.hidden = true;

  const input = document.createElement("input");
  input.className = "avatar__input";
  input.type = "text";
  input.maxLength = 140;
  input.placeholder = "Say something…";

  const send = document.createElement("button");
  send.className = "avatar__send";
  send.type = "submit";
  send.textContent = "↵";
  send.setAttribute("aria-label", "Send message");

  composer.append(input, send);
  controls.append(toggle, composer);
  el.appendChild(controls);

  toggle.addEventListener("click", () => {
    composer.hidden = !composer.hidden;
    if (!composer.hidden) input.focus();
  });

  composer.addEventListener("submit", (event) => {
    event.preventDefault();
    submitChat(input, composer);
  });

  return {
    ...avatar,
    composer,
    input,
  };
}

function submitChat(input, composer) {
  const text = input.value.trim();
  if (!text || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({ type: "say", text }));
  showBubble(self.avatar, text);
  input.value = "";
  composer.hidden = true;
}

function renderAvatar(avatar, x) {
  avatar.el.style.left = `${(x * 100).toFixed(2)}%`;
}

function showBubble(avatar, text) {
  avatar.bubble.textContent = text;
  avatar.bubble.hidden = false;
  clearTimeout(avatar.bubbleTimer);
  avatar.bubbleTimer = setTimeout(() => {
    avatar.bubble.hidden = true;
  }, BUBBLE_TTL_MS);
}

function setWalking(avatar, walking) {
  avatar.el.classList.toggle("walking", walking);
}

function updateStatus() {
  const count = peers.size + (self.id ? 1 : 0);
  statusEl.textContent = self.id
    ? `${count} ${count === 1 ? "visitor" : "visitors"} here right now`
    : "Connecting…";
}

function addOrUpdatePeer(peer) {
  const existing = peers.get(peer.id);
  if (existing) {
    existing.x = peer.x;
    renderAvatar(existing.avatar, existing.x);
    return existing;
  }

  const avatar = createAvatar({ isSelf: false });
  const nextPeer = { id: peer.id, x: peer.x, avatar };
  peers.set(peer.id, nextPeer);
  stage.appendChild(avatar.el);
  renderAvatar(avatar, nextPeer.x);
  updateStatus();
  return nextPeer;
}

function removePeer(id) {
  const peer = peers.get(id);
  if (!peer) return;
  peer.avatar.el.remove();
  peers.delete(id);
  updateStatus();
}

function wireSocket(ws) {
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ type: "init", x: self.x }));
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "hello") {
      self.id = message.id;
      for (const peer of message.peers) {
        addOrUpdatePeer(peer);
      }
      updateStatus();
      return;
    }

    if (message.type === "join") {
      addOrUpdatePeer(message.peer);
      return;
    }

    if (message.type === "leave") {
      removePeer(message.id);
      return;
    }

    if (message.type === "move") {
      const peer = peers.get(message.id);
      if (!peer) return;
      peer.x = message.x;
      renderAvatar(peer.avatar, peer.x);
      setWalking(peer.avatar, true);
      clearTimeout(peer.walkTimer);
      peer.walkTimer = setTimeout(() => setWalking(peer.avatar, false), 120);
      return;
    }

    if (message.type === "say") {
      if (message.id === self.id) return;
      const peer = peers.get(message.id);
      if (!peer) return;
      showBubble(peer.avatar, message.text);
    }
  });

  ws.addEventListener("close", () => {
    statusEl.textContent = "Disconnected. Refresh to rejoin the square.";
  });
}

function wireKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowLeft") self.movingLeft = true;
    if (event.key === "ArrowRight") self.movingRight = true;
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") self.movingLeft = false;
    if (event.key === "ArrowRight") self.movingRight = false;
  });
}

function clampSelfX(x) {
  return Math.max(MIN_X, Math.min(MAX_X, x));
}

let lastFrameAt = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - lastFrameAt) / 1000);
  lastFrameAt = now;

  const direction = Number(self.movingRight) - Number(self.movingLeft);
  if (direction !== 0) {
    self.x = clampSelfX(self.x + direction * MOVEMENT_SPEED * dt);
    renderAvatar(self.avatar, self.x);
    setWalking(self.avatar, true);
    maybeSendMove();
  } else {
    setWalking(self.avatar, false);
  }

  requestAnimationFrame(tick);
}

function maybeSendMove() {
  const now = Date.now();
  const movedEnough = Math.abs(self.x - self.lastSentX) > 0.002;
  const waitedLongEnough = now - self.lastSendAt > SEND_INTERVAL_MS;

  if (socket.readyState !== WebSocket.OPEN || !movedEnough || !waitedLongEnough) {
    return;
  }

  self.lastSentX = self.x;
  self.lastSendAt = now;
  socket.send(JSON.stringify({ type: "move", x: self.x }));
}
