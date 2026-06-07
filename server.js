const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

/**
 * Tiny demo server for the first playable TownSquare slice.
 *
 * Responsibilities:
 * - serve the demo page and widget assets from ./public
 * - keep a short-lived in-memory list of connected visitors
 * - broadcast movement/chat/presence events over WebSocket
 *
 * Non-goals for this first slice:
 * - persistence
 * - auth/accounts
 * - durable history
 * - multi-room routing
 */

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8787);
const PUBLIC_DIR = path.join(__dirname, "public");
const MAX_MESSAGE_LEN = 140;
const MOVE_THROTTLE_MS = 40;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/** @returns {{id:number,ws:any,x:number,joined:boolean,lastMoveAt:number}} */
function createClient(id, ws) {
  return {
    id,
    ws,
    x: 0.5,
    joined: false,
    lastMoveAt: 0,
  };
}

function clampPosition(x) {
  if (typeof x !== "number" || Number.isNaN(x)) return null;
  if (x < 0 || x > 1) return null;
  return x;
}

function sanitizeMessage(text) {
  if (typeof text !== "string") return "";
  return text.trim().slice(0, MAX_MESSAGE_LEN);
}

function getContentType(filePath) {
  return MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
}

function resolvePublicFile(requestUrl, hostHeader) {
  const pathname = requestUrl === "/"
    ? "/index.html"
    : new URL(requestUrl, `http://${hostHeader}`).pathname;
  const normalized = path.normalize(pathname).replace(/^\.+/, "");
  const filePath = path.join(PUBLIC_DIR, normalized);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return filePath;
}

function send(ws, message) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(message));
}

function snapshotClient(client) {
  return {
    id: client.id,
    x: client.x,
  };
}

const clients = new Map();
let nextClientId = 1;

function broadcast(message, options = {}) {
  const { exceptId = null } = options;
  const payload = JSON.stringify(message);

  for (const client of clients.values()) {
    if (client.id === exceptId) continue;
    if (client.ws.readyState !== client.ws.OPEN) continue;
    client.ws.send(payload);
  }
}

const server = http.createServer((req, res) => {
  const filePath = resolvePublicFile(req.url || "/", req.headers.host || `${HOST}:${PORT}`);

  if (!filePath) {
    res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    res.end("forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      const status = error.code === "ENOENT" ? 404 : 500;
      const body = status === 404 ? "not found" : "server error";
      res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
      res.end(body);
      return;
    }

    res.writeHead(200, {
      "cache-control": "no-store",
      "content-type": getContentType(filePath),
    });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: "/live" });

function handleInit(client, message) {
  if (client.joined) return;

  const nextX = clampPosition(message.x);
  if (nextX !== null) {
    client.x = nextX;
  }

  client.joined = true;
  clients.set(client.id, client);

  const peers = Array.from(clients.values())
    .filter((peer) => peer.id !== client.id)
    .map(snapshotClient);

  send(client.ws, {
    type: "hello",
    id: client.id,
    peers,
  });

  broadcast({ type: "join", peer: snapshotClient(client) }, { exceptId: client.id });
}

function handleMove(client, message) {
  const nextX = clampPosition(message.x);
  if (nextX === null) return;

  const now = Date.now();
  if (now - client.lastMoveAt < MOVE_THROTTLE_MS) return;

  client.lastMoveAt = now;
  client.x = nextX;
  broadcast({ type: "move", id: client.id, x: client.x }, { exceptId: client.id });
}

function handleSay(client, message) {
  const text = sanitizeMessage(message.text);
  if (!text) return;

  broadcast({
    type: "say",
    id: client.id,
    text,
    at: Date.now(),
  });
}

function handleClientMessage(client, raw) {
  let message;
  try {
    message = JSON.parse(String(raw));
  } catch {
    return;
  }

  if (!message || typeof message !== "object") return;

  if (message.type === "init") {
    handleInit(client, message);
    return;
  }

  if (!client.joined) return;

  if (message.type === "move") {
    handleMove(client, message);
    return;
  }

  if (message.type === "say") {
    handleSay(client, message);
  }
}

function handleClientClose(client) {
  if (!client.joined) return;
  clients.delete(client.id);
  broadcast({ type: "leave", id: client.id }, { exceptId: client.id });
}

wss.on("connection", (ws) => {
  const client = createClient(nextClientId++, ws);

  ws.on("message", (raw) => handleClientMessage(client, raw));
  ws.on("close", () => handleClientClose(client));
});

server.listen(PORT, HOST, () => {
  console.log(`TownSquare demo running at http://${HOST}:${PORT}`);
});
