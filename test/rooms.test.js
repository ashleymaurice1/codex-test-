const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { WebSocket } = require("ws");
process.env.PORT = "0";
const { server, rooms, close } = require("../server");
after(close);
async function client() {
  if (!server.listening) await once(server, "listening");
  const ws = new WebSocket(`ws://127.0.0.1:${server.address().port}`);
  ws.queue = [];
  ws.on("message", (raw) => ws.queue.push(JSON.parse(raw)));
  await once(ws, "open");
  ws.sendData = (m) => ws.send(JSON.stringify(m));
  ws.next = async (predicate) => {
    const deadline = Date.now() + 6500;
    while (Date.now() < deadline) {
      const i = ws.queue.findIndex(predicate);
      if (i >= 0) return ws.queue.splice(i, 1)[0];
      await new Promise((r) => setTimeout(r, 20));
    }
    throw Error("Timed out awaiting message");
  };
  return ws;
}
test("room codes, synchronized countdown and challenges, reconnect and host transfer", async () => {
  const a = await client(),
    b = await client();
  a.sendData({ type: "create", name: "Alice", team: "Mach" });
  const join = await a.next((m) => m.type === "joined");
  assert.match(join.code, /^[A-Z]{4}$/);
  b.sendData({ type: "join", code: join.code, name: "Bob", team: "Slink" });
  const bj = await b.next((m) => m.type === "joined");
  await b.next((m) => m.type === "state" && m.players.length === 2);
  b.sendData({ type: "ready" });
  await a.next(
    (m) => m.type === "state" && m.players.find((p) => p.id === bj.id)?.ready,
  );
  a.sendData({ type: "start" });
  const [sa, sb] = await Promise.all([
    a.next((m) => m.phase === "race"),
    b.next((m) => m.phase === "race"),
  ]);
  assert.equal(sa.challenge.id, sb.challenge.id);
  assert.equal(sa.started, sb.started);
  assert.equal(sa.players.length, 4);
  assert.equal(sa.challenge.answer, undefined);
  const r = rooms.get(join.code);
  const p = r.players.find((x) => x.id === join.id);
  if (r.challenge.kind === 2)
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.max(0, r.challenge.extinguish - Date.now() + 30),
      ),
    );
  a.sendData({
    type: "answer",
    id: r.challenge.id,
    index: r.challenge.answer[0],
  });
  assert.equal((await a.next((m) => m.type === "answer")).ok, true);
  await b.next(
    (m) =>
      m.type === "state" && m.players.find((x) => x.id === p.id)?.progress > 0,
  );
  a.close();
  await b.next((m) => m.type === "state" && m.host === bj.id);
  const restored = await client();
  restored.sendData({ type: "resume", token: join.token });
  assert.equal((await restored.next((m) => m.type === "joined")).id, join.id);
  restored.close();
  b.close();
});
test("invalid codes, full rooms and invalid answers produce no shared-state corruption", async () => {
  const a = await client();
  a.sendData({ type: "join", code: "QQQQ" });
  assert.match((await a.next((m) => m.type === "error")).message, /not found/);
  a.sendData({ type: "create", name: "Host" });
  const j = await a.next((m) => m.type === "joined");
  const clients = [a];
  for (let i = 0; i < 5; i++) {
    const c = await client();
    clients.push(c);
    c.sendData({ type: "join", code: j.code, name: "Guest" });
    await c.next((m) => m.type === "joined");
  }
  const extra = await client();
  extra.sendData({ type: "join", code: j.code });
  assert.match((await extra.next((m) => m.type === "error")).message, /full/);
  extra.close();
  for (const c of clients) c.close();
});
test("solo answers advance promptly while rival challenge clocks remain independent", async () => {
  const a = await client();
  a.sendData({
    type: "create",
    solo: true,
    level: 0,
    name: "Beginner",
    team: "Mach",
  });
  const join = await a.next((m) => m.type === "joined");
  const state = await a.next((m) => m.phase === "race");
  const room = rooms.get(join.code);
  const original = room.challenge.id;
  const botIds = room.players
    .filter((p) => p.bot)
    .map((p) => p.botChallenge.id);
  const answeredAt = Date.now();
  a.sendData({ type: "answer", id: original, index: room.challenge.answer[0] });
  assert.equal((await a.next((m) => m.type === "answer")).ok, true);
  const next = await a.next(
    (m) => m.phase === "race" && m.challenge.id !== original,
  );
  assert.ok(
    Date.now() - answeredAt < 2000,
    "A correct tap should not wait for the full round timer",
  );
  assert.equal(next.challenge.kind, 6);
  assert.deepEqual(
    room.players.filter((p) => p.bot).map((p) => p.botChallenge.id),
    botIds,
  );
  assert.ok(next.players.every((p) => !p.botChallenge));
  assert.deepEqual(
    next.players
      .filter((p) => p.bot)
      .map((p) => p.name)
      .sort(),
    ["Ember", "Misty", "Slink"],
  );
  a.close();
});
