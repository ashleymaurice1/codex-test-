const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../public/arcade-core");
test("every maze has escape loops, even when one corridor tile is occupied by a witch", () => {
  for (let stage = 0; stage < 5; stage++) {
    const s = A.createMaze(stage, {}, 2),
      cells = [];
    for (let y = 1; y < s.height - 1; y++)
      for (let x = 1; x < s.width - 1; x++)
        if (s.grid[y][x] === 0) cells.push([x, y]);
    for (const [bx, by] of cells) {
      const start = cells.find(([x, y]) => x !== bx || y !== by),
        seen = new Set([start.join(",")]),
        queue = [start];
      for (let i = 0; i < queue.length; i++)
        for (const [dx, dy] of Object.values(A.DIRS)) {
          const x = queue[i][0] + dx,
            y = queue[i][1] + dy,
            key = x + "," + y;
          if (
            s.grid[y]?.[x] === 0 &&
            !(x === bx && y === by) &&
            !seen.has(key)
          ) {
            seen.add(key);
            queue.push([x, y]);
          }
        }
      assert.equal(
        seen.size,
        cells.length - 1,
        `stage ${stage}, blocked ${bx},${by}`,
      );
    }
  }
});
test("late turns and immediate reversals stay in open corridors, without diagonal corner cuts", () => {
  const s = A.createMaze(0, {}, 2);
  s.grid = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
  ];
  s.enemies = [];
  s.candies = new Set();
  s.exit = { x: 99, y: 99 };
  A.turnMaze(s, "right");
  A.stepMaze(s, s.moveInterval * 0.08);
  A.turnMaze(s, "down");
  for (let i = 0; i < 120; i++) {
    A.stepMaze(s, 1 / 240);
    assert.ok(
      Math.abs(s.player.px - Math.round(s.player.px)) < 1e-7 ||
        Math.abs(s.player.py - Math.round(s.player.py)) < 1e-7,
    );
    assert.equal(s.grid[Math.round(s.player.py)][Math.round(s.player.px)], 0);
  }
  assert.equal(s.player.x, 1);
  assert.ok(s.player.py > 1.5);
  for (let i = 0; i < 100; i++) {
    A.turnMaze(s, i % 2 ? "up" : "down");
    A.stepMaze(s, 0.01);
    assert.equal(s.grid[Math.round(s.player.py)][Math.round(s.player.px)], 0);
  }
});
function runJump(s, stopAt = Infinity) {
  for (
    let i = 0;
    i < 30000 && s.status === "playing" && s.passed < stopAt;
    i++
  ) {
    const o = s.obstacles.find(
      (o) => !o.passed && !o.hit && o.x + o.width > s.player.x,
    );
    if (
      o &&
      o.x < s.player.x + s.player.width - 14 + s.speed * 0.25 &&
      s.player.y === 0
    )
      A.jump(s);
    A.stepJump(s, 1 / 60);
  }
  return s;
}
test("marathon runs are longer, accelerate, and remain clearable on every difficulty", () => {
  for (let difficulty = 0; difficulty < 3; difficulty++)
    for (const stage of [0, 4]) {
      const classic = A.createJump(stage, {}, difficulty),
        s = runJump(A.createJump(stage, {}, difficulty, { runLength: 4 }));
      assert.equal(s.status, "won");
      assert.equal(s.lives, 3);
      assert.ok(s.target >= classic.target + 36);
      assert.ok(s.speed > s.baseSpeed);
      assert.ok(s.elapsed > 40);
    }
});
test("endless keeps running beyond a normal finish and reaches a bounded, jumpable top speed", () => {
  const s = runJump(A.createJump(0, {}, 2, { endless: true }), 100);
  assert.equal(s.status, "playing");
  assert.ok(s.passed >= 100);
  assert.equal(s.lives, 3);
  assert.equal(s.target, Infinity);
  assert.equal(s.finishX, null);
  assert.equal(s.speed, 560);
  assert.ok(s.wave >= 20);
});
