const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");
const E = require("./engine");
const rooms = new Map(),
  sessions = new Map();
const root = path.join(__dirname, "public");
const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    res.writeHead(400);
    return res.end("Invalid request");
  }
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }
  const file = path.join(root, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css",
          ".js": "text/javascript",
          ".svg": "image/svg+xml",
          ".ttf": "font/ttf",
          ".m4a": "audio/mp4",
          ".webp": "image/webp",
        }[path.extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  });
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });
function send(ws, data) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function snapshot(r) {
  const c = r.challenge;
  return {
    type: "state",
    code: r.code,
    solo: r.solo,
    level: r.level,
    host: r.host,
    phase: r.phase,
    bots: r.bots,
    started: r.started,
    now: Date.now(),
    challenge: c
      ? {
          id: c.id,
          kind: c.kind,
          choices: c.choices,
          round: c.round,
          opens: c.opens,
          closes: c.closes,
          extinguish: c.kind === 2 ? c.extinguish : undefined,
          still: c.kind === 3 ? c.answer[0] : undefined,
        }
      : null,
    players: E.rank(r).map((p) => ({
      ...p,
      token: undefined,
      ws: undefined,
      planned: undefined,
    })),
    events: r.events.slice(-5),
  };
}
function broadcast(r) {
  const data = snapshot(r);
  for (const p of r.players) if (!p.bot) send(p.ws, data);
}
function code() {
  let c;
  do {
    c = Array.from(
      crypto.randomBytes(4),
      (n) => "ABCDEFGHJKLMNPQRSTUVWXYZ"[n % 24],
    ).join("");
  } while (rooms.has(c));
  return c;
}
function attach(ws, r, p) {
  if (p.ws && p.ws !== ws) {
    p.ws.room = null;
    p.ws.player = null;
    p.ws.close(4000, "Reconnected elsewhere");
  }
  p.ws = ws;
  p.online = true;
  r.host ??= p.id;
  ws.room = r;
  ws.player = p;
  send(ws, { type: "joined", id: p.id, token: p.token, code: r.code });
  broadcast(r);
}
function reset(r) {
  r.phase = "lobby";
  r.challenge = null;
  r.events = [];
  r.players = r.players.filter((p) => !p.bot);
  for (const p of r.players) {
    Object.assign(p, {
      progress: 0,
      correct: 0,
      item: null,
      blockedUntil: 0,
      effect: null,
      stones: 0,
      answered: null,
      finish: null,
      ready: false,
    });
  }
  broadcast(r);
}
function start(r) {
  r.players = r.players.filter((p) => !p.bot);
  if (r.bots) {
    while (r.players.length < 4) {
      const used = r.players.map((p) => p.team);
      const team =
        E.TEAMS.find((t) => !used.includes(t)) || E.TEAMS[r.players.length % 4];
      const racerId =
        [0, 1, 2, 3].find((id) => !r.players.some((p) => p.racer === id)) ??
        r.players.length % 4;
      const p = E.player(E.RACERS[racerId], racerId, team, true);
      p.personality = ["fast", "steady", "average"][(r.players.length - 1) % 3];
      r.players.push(p);
    }
  }
  r.phase = "countdown";
  r.started = Date.now() + 3000;
  r.round = -1;
  r.events = [];
  broadcast(r);
}
function newChallenge(r, now) {
  r.round++;
  r.challenge = E.challenge(r.round, now, Math.random, r.level);
  for (const p of r.players) {
    if (p.bot) {
      p.planned =
        now +
        (p.personality === "fast"
          ? 350 + Math.random() * 1500
          : p.personality === "steady"
            ? 1700 + Math.random() * 900
            : 900 + Math.random() * 1500);
      p.planned = now + (p.planned - now) * E.LEVELS[r.level].botDelay;
      p.sloppy = p.personality === "fast";
    } else if (r.round > 0 && !p.finish && p.answered !== r.previous) {
      p.blockedUntil = Math.max(p.blockedUntil, now + 100);
    }
  }
  r.previous = r.challenge.id;
}
let tick = setInterval(() => {
  const now = Date.now();
  for (const [key, r] of rooms) {
    if (
      now - r.active > 30 * 60 * 1000 ||
      (!r.players.some((p) => !p.bot && p.online) && now - r.active > 120000)
    ) {
      for (const p of r.players) sessions.delete(p.token);
      rooms.delete(key);
      continue;
    }
    if (r.phase === "countdown" && now >= r.started) {
      r.phase = "race";
      newChallenge(r, now);
    }
    if (r.phase === "race") {
      for (const p of r.players) {
        if (p.bot && !p.finish) {
          if (p.stones) p.stones--;
          if (p.planned <= now && p.answered !== r.challenge.id) {
            const index =
              Math.random() < E.LEVELS[r.level].botMiss + (p.sloppy ? 0.16 : 0)
                ? -1
                : r.challenge.answer[0];
            if (r.challenge.kind !== 2 || now >= r.challenge.extinguish)
              E.answer(r, p, r.challenge.id, index, now);
          }
          if (E.botWantsItem(r, p) && Math.random() < 0.008 + r.level * 0.006) {
            const event = E.useItem(r, p, now);
            if (event)
              r.events.push({
                ...event,
                id: crypto.randomUUID(),
                by: p.id,
                at: now,
              });
          }
        }
      }
      if (now > r.challenge.closes) {
        for (const p of r.players) {
          if (!p.finish && p.answered !== r.challenge.id) {
            p.answered = r.challenge.id;
            p.effect = "Stumble";
            p.blockedUntil = Math.max(p.blockedUntil, now + 1000);
            if (!p.bot) send(p.ws, { type: "answer", ok: false });
          }
        }
      }
      if (r.players.some((p) => p.finish) || now - r.started > 120000) {
        r.phase = "finished";
        r.ended = now;
        for (const p of r.players) p.place = E.rank(r).indexOf(p) + 1;
      } else if (now > r.challenge.closes + 700) newChallenge(r, now);
    }
    broadcast(r);
  }
}, 100);
wss.on("connection", (ws) => {
  let recent = [];
  ws.alive = true;
  ws.on("pong", () => (ws.alive = true));
  ws.on("message", (raw) => {
    try {
      const now = Date.now();
      recent = recent.filter((t) => now - t < 1000);
      if (recent.length > 30) return;
      recent.push(now);
      const m = JSON.parse(raw);
      if (!m || typeof m !== "object") return;
      if (m.type === "resume") {
        const found = sessions.get(m.token);
        if (found && rooms.has(found.room.code)) {
          attach(ws, found.room, found.player);
          return;
        }
        send(ws, { type: "expired" });
        return;
      }
      if (m.type === "create" || m.type === "join") {
        if (ws.room) return;
        let r;
        if (m.type === "create") {
          if (rooms.size >= 500)
            throw Error("The graveyard is busy. Try again soon.");
          r = {
            code: code(),
            players: [],
            phase: "lobby",
            solo: !!m.solo,
            level:
              m.solo && Number.isInteger(m.level) && m.level >= 0 && m.level < 4
                ? m.level
                : m.solo
                  ? 0
                  : 3,
            bots: true,
            events: [],
            active: now,
          };
          rooms.set(r.code, r);
        } else {
          r = rooms.get(String(m.code || "").toUpperCase());
          if (!r) throw Error("Room not found. Check those four letters.");
          if (r.solo) throw Error("Room not found.");
          if (r.players.filter((p) => !p.bot).length >= 6)
            throw Error("Room is full. Six souls is the limit.");
          if (r.phase !== "lobby")
            throw Error("That race has already started.");
        }
        const p = E.player(m.name, m.racer, m.team);
        p.token = crypto.randomUUID();
        r.players.push(p);
        r.host ??= p.id;
        sessions.set(p.token, { room: r, player: p });
        r.active = now;
        attach(ws, r, p);
        if (r.solo) start(r);
        return;
      }
      const r = ws.room,
        p = ws.player;
      if (!r || !p) return;
      r.active = now;
      if (m.type === "leave") {
        p.online = false;
        p.ready = false;
        ws.room = null;
        ws.player = null;
        sessions.delete(p.token);
        if (r.phase === "lobby") r.players = r.players.filter((x) => x !== p);
        if (r.host === p.id)
          r.host = r.players.find((x) => x.online && !x.bot)?.id;
        broadcast(r);
        return;
      }
      if (m.type === "ready" && r.phase === "lobby") p.ready = !p.ready;
      if (m.type === "bots" && p.id === r.host && r.phase === "lobby")
        r.bots = !!m.value;
      if (m.type === "start" && p.id === r.host && r.phase === "lobby") {
        if (
          !r.players
            .filter((x) => !x.bot && x.online)
            .every((x) => x.id === r.host || x.ready)
        )
          throw Error("Wait for every racer to get ready.");
        start(r);
      }
      if (m.type === "answer") {
        const ok = E.answer(r, p, m.id, m.index, now);
        if (ok !== null) send(ws, { type: "answer", ok });
      }
      if (m.type === "smash" && r.phase === "race" && p.stones > 0) p.stones--;
      if (m.type === "item") {
        const event = E.useItem(r, p, now);
        if (event)
          r.events.push({
            ...event,
            id: crypto.randomUUID(),
            by: p.id,
            at: now,
          });
      }
      if (m.type === "rematch" && r.phase === "finished" && p.id === r.host) {
        reset(r);
        if (r.solo) start(r);
      }
      broadcast(r);
    } catch (err) {
      send(ws, {
        type: "error",
        message: err.message || "Something went bump. Try again.",
      });
    }
  });
  ws.on("close", () => {
    const r = ws.room,
      p = ws.player;
    if (!r || !p || p.ws !== ws) return;
    p.online = false;
    r.active = Date.now();
    if (r.host === p.id) r.host = r.players.find((x) => x.online && !x.bot)?.id;
    broadcast(r);
  });
});
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) {
      ws.terminate();
      continue;
    }
    ws.alive = false;
    ws.ping();
  }
}, 15000);
server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
  console.log(`Midnight Zombies listening on ${server.address().port}`),
);
function close() {
  clearInterval(tick);
  clearInterval(heartbeat);
  for (const ws of wss.clients) ws.terminate();
  wss.close();
  server.close();
}
process.on("SIGTERM", () => {
  close();
});
module.exports = { server, rooms, close };
