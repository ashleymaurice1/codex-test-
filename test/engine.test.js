const { test } = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine");
function setup(kind = 0) {
  const p = E.player("Player", 0, "Mach"),
    r = {
      phase: "race",
      players: [p],
      challenge: E.challenge(kind, 1000, () => 0.4),
    };
  return { p, r };
}
test("solo progression completes in approximately fifteen answers", () => {
  const { p, r } = setup();
  for (let i = 0; i < 15; i++) {
    r.challenge = E.challenge(0, 1000 + i * 4000);
    assert.equal(
      E.answer(
        r,
        p,
        r.challenge.id,
        r.challenge.answer[0],
        r.challenge.opens + 500,
      ),
      true,
    );
  }
  assert.equal(p.progress, 100);
  assert.ok(p.finish);
});
test("wrong, repeated and stale answers cannot advance the player", () => {
  const { p, r } = setup();
  assert.equal(E.answer(r, p, "stale", 0, 1200), null);
  assert.equal(E.answer(r, p, r.challenge.id, -1, 1200), false);
  assert.equal(p.progress, 0);
  assert.equal(p.blockedUntil, 2200);
  assert.equal(
    E.answer(r, p, r.challenge.id, r.challenge.answer[0], 2300),
    null,
  );
});
test("all six challenge types have valid targets and candle rejects an early tap", () => {
  for (let i = 0; i < 6; i++) {
    const { p, r } = setup(i);
    assert.ok(r.challenge.answer.length);
    assert.ok(r.challenge.answer.every((n) => n < r.challenge.choices.length));
    if (i === 2) {
      assert.equal(E.answer(r, p, r.challenge.id, 0, 1100), false);
    } else {
      assert.equal(
        E.answer(r, p, r.challenge.id, r.challenge.answer[0], 1500),
        true,
      );
    }
  }
  const { p, r } = setup(2);
  assert.equal(
    E.answer(r, p, r.challenge.id, 0, r.challenge.extinguish + 10),
    true,
  );
});
test("items are position weighted and applied on the server", () => {
  const { p, r } = setup();
  const rival = E.player("Rival", 1, "Ember");
  rival.progress = 20;
  r.players.push(rival);
  p.item = "Brain Freeze";
  const event = E.useItem(r, p, 1500);
  assert.equal(event.target, rival.id);
  assert.equal(rival.blockedUntil, 3500);
  assert.equal(p.item, null);
  p.item = "Tombstone Drop";
  E.useItem(r, p, 1500);
  assert.equal(rival.stones, 3);
  p.item = "Sugar Rush";
  E.useItem(r, p, 1500);
  assert.equal(p.progress, 13);
});
test("server refuses answers during freezes and tombstones", () => {
  const { p, r } = setup();
  p.stones = 3;
  assert.equal(
    E.answer(r, p, r.challenge.id, r.challenge.answer[0], 1500),
    null,
  );
  p.stones = 0;
  p.blockedUntil = 2000;
  assert.equal(
    E.answer(r, p, r.challenge.id, r.challenge.answer[0], 1500),
    null,
  );
  assert.equal(p.progress, 0);
});
test("Sunrise is restricted to the last two places in a six-player race", () => {
  const players = Array.from({ length: 6 }, (_, i) =>
    E.player("P" + i, i % 4, "Mach"),
  );
  players.forEach((p, i) => (p.progress = 90 - i * 10));
  const room = { players };
  assert.equal(
    E.awardItem(players[0], room, () => 0.999),
    "Sugar Rush",
  );
  assert.equal(
    E.awardItem(players[2], room, () => 0.999),
    "Brain Freeze",
  );
  assert.equal(
    E.awardItem(players[4], room, () => 0.999),
    "Sunrise",
  );
});
test("Sunrise blinds the leader while Arm Toss hits the racer immediately ahead", () => {
  const { p, r } = setup();
  const leader = E.player("Leader", 1, "Ember"),
    ahead = E.player("Ahead", 2, "Slink");
  leader.progress = 80;
  ahead.progress = 50;
  r.players.push(leader, ahead);
  p.item = "Arm Toss";
  assert.equal(E.useItem(r, p, 1500).target, ahead.id);
  assert.equal(ahead.blockedUntil, 2500);
  assert.equal(ahead.effect, "Arm Toss");
  p.item = "Sunrise";
  assert.equal(E.useItem(r, p, 1500).target, leader.id);
  assert.equal(leader.blockedUntil, 4500);
  assert.equal(leader.effect, "Sunrise");
});
test("rival bots use boosts and save targeted attacks until a racer is ahead", () => {
  const { p, r } = setup();
  const bot = E.player("Pumpkin Pete", 3, "Ember", true);
  bot.progress = 50;
  r.players.push(bot);
  bot.item = "Sugar Rush";
  assert.equal(E.botWantsItem(r, bot), true);
  bot.item = "Arm Toss";
  assert.equal(E.botWantsItem(r, bot), false);
  p.progress = 60;
  assert.equal(E.botWantsItem(r, bot), true);
  bot.item = "Sunrise";
  assert.equal(E.botWantsItem(r, bot), true);
  bot.finish = 1500;
  assert.equal(E.botWantsItem(r, bot), false);
});
