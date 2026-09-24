// Minimal Server-Sent-Events hub: one open connection per logged-in tab, keyed by userId.
const clients = new Map(); // userId -> Set<ServerResponse>

export function subscribe(userId, res) {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
  res.write(": connected\n\n");
  const set = clients.get(userId) || new Set();
  set.add(res);
  clients.set(userId, set);
  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  res.on("close", () => {
    clearInterval(ping);
    clients.get(userId)?.delete(res);
  });
}

export function emit(userId, event, data) {
  const set = clients.get(userId);
  if (!set) return;
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(chunk);
}
