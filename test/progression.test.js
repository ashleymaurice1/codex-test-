const { test } = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine");
const { awardLevel } = require("../public/progression");
test("levels add variety while shortening timers and improving rivals", () => {
  const counts = E.LEVELS.map((l) => new Set(l.kinds).size);
  assert.deepEqual(counts, [3, 4, 5, 6]);
  for (let i = 0; i < 4; i++) {
    const level = E.LEVELS[i];
    for (let r = 0; r < 18; r++) {
      const c = E.challenge(r, 1000, () => 0.5, i);
      assert.ok(level.kinds.includes(c.kind));
      assert.ok(c.closes - c.opens >= level.floor);
      assert.ok(c.extinguish < c.closes);
    }
    if (i) {
      assert.ok(level.pace < E.LEVELS[i - 1].pace);
      assert.ok(level.botDelay < E.LEVELS[i - 1].botDelay);
      assert.ok(level.botMiss < E.LEVELS[i - 1].botMiss);
    }
  }
});
test("active podium finishes unlock the next level, with persistent best medals", () => {
  const profile = { unlockedLevel: 0, levelStars: [] };
  assert.equal(awardLevel(profile, 0, 4, 15), false);
  assert.equal(awardLevel(profile, 0, 1, 0), false);
  assert.equal(profile.unlockedLevel, 0);
  assert.equal(awardLevel(profile, 0, 2, 8), true);
  assert.equal(profile.unlockedLevel, 1);
  assert.equal(profile.levelStars[0], 2);
  awardLevel(profile, 0, 3, 5);
  assert.equal(profile.levelStars[0], 2);
  awardLevel(profile, 0, 1, 12);
  assert.equal(profile.levelStars[0], 3);
  awardLevel(profile, 3, 1, 12);
  assert.equal(profile.unlockedLevel, 3);
});
test("invalid level medals cannot alter progression", () => {
  for (const level of [-1, 4, 1.5, undefined]) {
    const p = { unlockedLevel: 0, levelStars: [] };
    assert.equal(awardLevel(p, level, 1, 15), false);
    assert.equal(p.unlockedLevel, 0);
  }
});
