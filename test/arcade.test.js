const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../public/arcade-core");
test("all five mazes connect every candy and the exit to the entrance", () => {
  for (let stage = 0; stage < 5; stage++) {
    const s = A.createMaze(stage);
    assert.ok(A.path(s.grid, [1, 1], [s.exit.x, s.exit.y]).length);
    for (const candy of s.candies)
      assert.ok(A.path(s.grid, [1, 1], candy.split(",").map(Number)).length);
    assert.ok(s.target >= 8);
  }
});
test("first maze is winnable with real roaming creatures and awards score and a bonus life", () => {
  const s = A.createMaze(0, { team: "Mach", totalScore: 2000 });
  for (let i = 0; i < 800 && s.status === "playing"; i++) {
    const targets = s.candies.size
        ? [...s.candies].map((k) => k.split(",").map(Number))
        : [[s.exit.x, s.exit.y]],
      route = targets
        .map((t) => A.path(s.grid, [s.player.x, s.player.y], t))
        .sort((a, b) => a.length - b.length)[0];
    if (route.length > 1) {
      const [x, y] = route[1];
      A.turnMaze(
        s,
        x > s.player.x
          ? "right"
          : x < s.player.x
            ? "left"
            : y > s.player.y
              ? "down"
              : "up",
      );
    }
    A.stepMaze(s, s.moveInterval + 0.00001);
  }
  assert.equal(s.status, "won");
  assert.equal(s.collected, s.target);
  assert.equal(s.totalScore, 2500);
  assert.equal(s.reserveLives, 1);
  const score = s.totalScore;
  A.stepMaze(s, 1);
  assert.equal(s.totalScore, score);
});
test("jump timing can clear all five courses without unavoidable damage", () => {
  for (let stage = 0; stage < 5; stage++) {
    const s = A.createJump(stage);
    for (let i = 0; i < 20000 && s.status === "playing"; i++) {
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
    assert.equal(s.status, "won");
    assert.equal(s.passed, s.target);
    assert.equal(s.lives, 3);
  }
});
test("higher difficulties increase challenge and every obstacle gap remains jumpable", () => {
  for (let stage = 0; stage < 5; stage++) {
    const easy = A.createJump(stage, {}, 0),
      hard = A.createJump(stage, {}, 2);
    assert.ok(hard.speed > easy.speed);
    assert.ok(
      A.createMaze(stage, {}, 2).enemyInterval <
        A.createMaze(stage, {}, 0).enemyInterval,
    );
    for (let i = 0; i < 20000 && hard.status === "playing"; i++) {
      const o = hard.obstacles.find(
        (o) => !o.passed && !o.hit && o.x + o.width > hard.player.x,
      );
      if (
        o &&
        o.x < hard.player.x + hard.player.width - 14 + hard.speed * 0.25 &&
        hard.player.y === 0
      )
        A.jump(hard);
      A.stepJump(hard, 1 / 60);
    }
    assert.equal(hard.status, "won");
    assert.equal(hard.lives, 3);
  }
});
test("pause freezes both games and jump cannot be repeated in midair", () => {
  for (const [create, step] of [
    [A.createMaze, A.stepMaze],
    [A.createJump, A.stepJump],
  ]) {
    const s = create();
    s.paused = true;
    step(s, 0.5);
    assert.equal(s.elapsed, 0);
  }
  const s = A.createJump();
  assert.equal(A.jump(s), true);
  A.stepJump(s, 0.1);
  assert.equal(A.jump(s), false);
});
test("unavoided obstacles consume spare lives and eventually end the run", () => {
  const s = A.createJump(0, { extraLives: 1 });
  for (let i = 0; i < 20000 && s.status === "playing"; i++)
    A.stepJump(s, 1 / 60);
  assert.equal(s.status, "lost");
  assert.equal(s.reserveLives, 0);
  assert.equal(s.lives, 0);
});
test("repeated direction key events do not restart smooth maze movement", () => {
  const s = A.createMaze(0),
    x = s.player.x,
    y = s.player.y;
  const direction = s.grid[y][x + 1] === 0 ? "right" : "down";
  for (let i = 0; i < 30; i++) {
    A.turnMaze(s, direction);
    A.stepMaze(s, 1 / 60);
  }
  assert.ok(s.player.x !== x || s.player.y !== y);
});
