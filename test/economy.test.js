const { test } = require("node:test");
const assert = require("node:assert/strict");
const L = require("../public/economy");
const A = require("../public/arcade-core");
test("old excessive stashes become three lives plus one-time original-price coin credit", () => {
  const p = { extraLives: 49, coins: 100 };
  L.normalize(p);
  assert.equal(p.extraLives, 3);
  assert.equal(p.coins, 3780);
  L.normalize(p);
  assert.equal(p.coins, 3780);
});
test("bonus lives require 2500 points and stop at three, without banking surplus milestones", () => {
  const s = A.createRhythm(4, { totalScore: 2400, extraLives: 3 });
  A.prepareRhythm(s, { time: 0, origin: 2 });
  for (const n of s.notes) {
    A.stepRhythm(s, n.time);
    A.hitRhythm(s, n.lane, n.time);
  }
  assert.equal(s.reserveLives, 3);
  assert.equal(s.events.filter((e) => e.type === "bonus-life").length, 0);
  const t = A.createRhythm(0, { totalScore: 0 }, 2);
  A.prepareRhythm(t, { time: 0, origin: 2 });
  for (const n of t.notes.slice(0, 20)) {
    A.stepRhythm(t, n.time);
    A.hitRhythm(t, n.lane, n.time);
  }
  assert.equal(t.totalScore, 1500);
  assert.equal(t.reserveLives, 0);
});
