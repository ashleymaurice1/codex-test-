const { test } = require("node:test");
const assert = require("node:assert/strict");
const J = require("../public/journey");
const A = require("../public/arcade-core");
test("journey visits all four styles in each of five chapters without skipping or duplicate advances", () => {
  const p = { journeyStep: 0 };
  for (let i = 0; i < 20; i++) {
    const n = J.current(p);
    assert.equal(n.mode, ["rhythm", "jump", "maze", "race"][i % 4]);
    assert.equal(n.chapter, Math.floor(i / 4));
    assert.equal(J.complete(p, "wrong", 0), false);
    assert.equal(J.complete(p, n.mode, n.stage), true);
    assert.equal(J.complete(p, n.mode, n.stage), false);
  }
  assert.equal(J.current(p), null);
});
test("maze pursuer closes the route distance to a stationary player during chase", () => {
  const s = A.createMaze();
  const e = s.enemies[0];
  const before = A.path(s.grid, [e.x, e.y], [s.player.x, s.player.y]).length;
  for (let i = 0; i < 60; i++) A.stepMaze(s, 0.05);
  const after = A.path(s.grid, [e.x, e.y], [s.player.x, s.player.y]).length;
  assert.ok(after < before - 2);
  assert.equal(e.chasing, true);
  assert.ok(A.createMaze(0, {}, 2).enemies.length > s.enemies.length);
});
