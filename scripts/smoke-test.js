const WebSocket = require("ws");

const SERVER_URL = process.env.TOWNSQUARE_WS_URL || "ws://127.0.0.1:8787/live";

function connect(x) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    const seen = [];

    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "init", x }));
    });

    ws.on("message", (buffer) => {
      const message = JSON.parse(String(buffer));
      seen.push(message);
      if (message.type === "hello") {
        resolve({ ws, seen, id: message.id });
      }
    });

    ws.on("error", reject);
  });
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const first = await connect(0.25);
  const second = await connect(0.75);

  await delay(100);
  second.ws.send(JSON.stringify({ type: "move", x: 0.62 }));
  await delay(100);
  second.ws.send(JSON.stringify({ type: "say", text: "hello from smoke test" }));
  await delay(100);
  second.ws.close();
  await delay(100);

  const firstTypes = first.seen.map((message) => message.type);
  const secondTypes = second.seen.map((message) => message.type);

  assert(firstTypes.includes("join"), "first client did not observe peer join");
  assert(firstTypes.includes("move"), "first client did not observe peer movement");
  assert(firstTypes.includes("say"), "first client did not observe peer chat");
  assert(firstTypes.includes("leave"), "first client did not observe peer leave");
  assert(secondTypes.includes("hello"), "second client did not receive initial hello");
  assert(second.seen.some((message) => message.type === "hello" && Array.isArray(message.peers) && message.peers.length === 1), "second client did not receive expected peer snapshot");

  console.log("Smoke test passed.");
  first.ws.close();
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exitCode = 1;
});
