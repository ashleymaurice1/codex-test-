const { test } = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine");
function rng(seed = 17) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}
test("race settings change timers, rivals, length and variety across all courses", () => {
  for (let level = 0; level < 4; level++) {
    const [a, b, c] = [0, 1, 2].map((d) => E.raceSettings(level, d));
    assert.ok(a.pace > b.pace && b.pace >= c.pace);
    assert.ok(a.botDelay > b.botDelay && b.botDelay > c.botDelay);
    assert.ok(a.finishHits < b.finishHits && b.finishHits < c.finishHits);
    assert.equal(c.kinds.length, 12);
    for (let d = 0; d < 3; d++) {
      const s = E.raceSettings(level, d),
        order = E.challengeOrder(level, d, rng());
      for (let i = 0; i < order.length; i++) {
        const ch = E.challenge(i, 1000, rng(i + 1), level, order, d);
        assert.ok(ch.closes - ch.opens >= s.floor);
        assert.ok(ch.extinguish < ch.closes);
        assert.ok(
          ch.answer.every((index) => index >= 0 && index < ch.choices.length),
        );
      }
    }
  }
});
test("shuffled bags visit every challenge once before repeating and avoid boundary repeats", () => {
  for (let d = 0; d < 3; d++) {
    const random = rng(),
      bags = [];
    let previous = null;
    for (let i = 0; i < 5; i++) {
      const order = E.challengeOrder(
        0,
        d,
        random,
        previous,
        i === 0 && d === 0,
      );
      assert.equal(new Set(order).size, E.raceSettings(0, d).kinds.length);
      assert.notEqual(order[0], previous);
      if (i === 0 && d === 0) assert.equal(order[0], 0);
      previous = order.at(-1);
      bags.push(order.join(","));
    }
    assert.ok(new Set(bags).size > 1);
  }
});
test("varied sky and potion targets agree with the winning answer", () => {
  for (const [kind, targets] of [
    [6, ["moon", "sun", "star"]],
    [7, ["potion-blue", "potion-orange", "potion-green"]],
  ]) {
    const seen = new Set();
    for (const value of [0.1, 0.5, 0.9]) {
      const c = E.challenge(0, 1000, () => value, 0, [kind], 2);
      seen.add(c.target);
      assert.equal(c.choices[c.answer[0]], c.target);
    }
    assert.deepEqual([...seen].sort(), targets.sort());
  }
});
test("every difficulty is winnable with its configured answer count", () => {
  for (let d = 0; d < 3; d++) {
    const p = E.player("Ghost", 0, "Mach"),
      r = { phase: "race", level: 0, difficulty: d, players: [p] };
    const count = E.raceSettings(0, d).finishHits,
      order = E.challengeOrder(0, d, rng());
    for (let i = 0; i < count; i++) {
      const now = 1000 + i * 5000;
      r.challenge = E.challenge(i, now, rng(i + 1), 0, order, d);
      const at =
        r.challenge.kind === 2 ? r.challenge.extinguish + 20 : now + 250;
      assert.equal(
        E.answer(r, p, r.challenge.id, r.challenge.answer[0], at),
        true,
      );
      if (i < count - 1) assert.ok(!p.finish);
    }
    assert.equal(p.progress, 100);
    assert.equal(p.correct, count);
  }
});
