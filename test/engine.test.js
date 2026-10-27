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
test("all twelve challenge types have valid targets and candle rejects an early tap", () => {
  for (let i = 0; i < 12; i++) {
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
  const bot = E.player("Ember", 2, "Ember", true);
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
test("first level finishes in five easy correct taps and introduces items later", () => {
  const p = E.player("Learner", 0, "Mach"),
    r = { phase: "race", players: [p], level: 0 };
  for (let i = 0; i < 5; i++) {
    r.challenge = E.challenge(i, 1000 + i * 3000, () => 0.5, 0);
    E.answer(
      r,
      p,
      r.challenge.id,
      r.challenge.answer[0],
      r.challenge.opens + 800,
    );
    if (i < 4) assert.ok(p.progress < 100);
    assert.equal(p.item, null);
  }
  assert.equal(p.progress, 100);
  assert.ok(p.finish);
});
test("solo mistakes spend hearts and spare lives protect a player before elimination", () => {
  const p = E.player("Mach", 0, "Mach"),
    bot = E.player("Slink", 1, "Slink", true),
    r = { solo: true, phase: "race", level: 0, players: [p, bot] };
  p.lives = 1;
  p.reserveLives = 1;
  p.progress = 80;
  r.challenge = E.challenge(0, 1000, () => 0.5, 0);
  assert.equal(E.answer(r, p, r.challenge.id, -1, 1200), false);
  assert.equal(p.lives, 1);
  assert.equal(p.reserveLives, 0);
  assert.equal(p.lifeSaved, true);
  assert.equal(p.eliminated, false);
  r.challenge = E.challenge(1, 3000, () => 0.5, 0);
  E.answer(r, p, r.challenge.id, -1, 3200);
  assert.equal(p.eliminated, true);
  assert.equal(p.lives, 0);
  assert.equal(E.rank(r).at(-1).id, p.id);
  r.challenge = E.challenge(2, 5000, () => 0.5, 0);
  assert.equal(
    E.answer(r, p, r.challenge.id, r.challenge.answer[0], 5200),
    null,
  );
});
test("every 2500 total solo score awards one spare life without duplicate rewards", () => {
  const p = E.player("Ember", 2, "Ember"),
    r = {
      solo: true,
      phase: "race",
      level: 0,
      players: [p],
      challenge: E.challenge(0, 1000, () => 0.5, 0),
    };
  p.totalScore = 2400;
  E.answer(r, p, r.challenge.id, r.challenge.answer[0], 1200);
  assert.equal(p.totalScore, 2500);
  assert.equal(p.runScore, 100);
  assert.equal(p.reserveLives, 1);
  assert.equal(p.bonusLivesEarned, 1);
  E.answer(r, p, r.challenge.id, r.challenge.answer[0], 1500);
  assert.equal(p.reserveLives, 1);
  r.challenge = E.challenge(1, 3000, () => 0.5, 0);
  E.answer(r, p, r.challenge.id, r.challenge.answer[0], 3200);
  assert.equal(p.totalScore, 2600);
  assert.equal(p.reserveLives, 1);
});
test("multiplayer and computer racers are not eliminated by solo heart rules", () => {
  const { p, r } = setup();
  E.answer(r, p, r.challenge.id, -1, 1500);
  assert.equal(p.lives, 3);
  const bot = E.player("Slink", 1, "Slink", true);
  r.solo = true;
  r.players = [bot];
  r.challenge = E.challenge(0, 3000);
  E.answer(r, bot, r.challenge.id, -1, 3200);
  assert.equal(bot.lives, 3);
  assert.equal(bot.eliminated, false);
});
