const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../public/arcade-core");
const S = require("../public/score");
const R = require("../public/records");
test("recording beat times and rhythm notes share the same clock, and accurate playing wins", () => {
  const s = A.createRhythm();
  A.prepareRhythm(s, { time: 0, origin: 2 });
  const expected = S.getSong(0).chart.filter((_, i) => i % 2 === 0);
  assert.equal(s.notes.length, expected.length);
  for (const [i, n] of s.notes.entries()) {
    assert.equal(n.time, 2 + expected[i].time);
    A.stepRhythm(s, n.time);
    assert.equal(A.hitRhythm(s, n.lane, n.time), true);
  }
  A.stepRhythm(s, s.endAudio);
  assert.equal(s.status, "won");
  assert.equal(s.hits, s.target);
  assert.ok(S.duration > 120);
});
test("rhythm pauses and missed notes cannot win", () => {
  const s = A.createRhythm();
  A.prepareRhythm(s, { time: 0, origin: 0 });
  s.paused = true;
  A.stepRhythm(s, 100);
  assert.equal(s.misses, 0);
  s.paused = false;
  A.stepRhythm(s, s.endAudio);
  assert.equal(s.status, "lost");
});
test("personal records deduplicate runs and sort equal scores by time", () => {
  const p = {};
  const r = { id: "a", mode: "maze", score: 500, seconds: 12 };
  assert.equal(R.record(p, r), true);
  R.record(p, r);
  R.record(p, { ...r, id: "b", seconds: 10 });
  R.record(p, { ...r, id: "c", mode: "jump", score: 800 });
  assert.equal(p.highScores.length, 3);
  assert.equal(R.top(p, "maze")[0].id, "b");
  assert.equal(R.record(p, { ...r, id: "bad", score: NaN }), false);
});
test("jump advances through stationary obstacles and has a higher arc", () => {
  const s = A.createJump();
  A.stepJump(s, 1 / 60);
  const x = s.player.x,
    o = s.obstacles[0].x;
  A.jump(s);
  let peak = 0;
  for (let i = 0; i < 55; i++) {
    A.stepJump(s, 1 / 60);
    peak = Math.max(peak, s.player.y);
  }
  assert.equal(s.obstacles[0].x, o);
  assert.ok(s.player.x > x);
  assert.ok(peak > 165);
});
test("five full recordings each have valid beat charts and are winnable on their recording clock", () => {
  const fs = require("node:fs"),
    path = require("node:path");
  assert.equal(S.songs.length, 5);
  assert.equal(new Set(S.songs.map((s) => s.file)).size, 5);
  for (let stage = 0; stage < 5; stage++) {
    const song = S.getSong(stage),
      s = A.createRhythm(stage);
    A.prepareRhythm(s, { time: 0, origin: 2 });
    assert.ok(song.duration > 120);
    assert.ok(
      fs.statSync(path.join(__dirname, "../public", song.file)).size > 1000000,
    );
    assert.ok(song.chart.length > 30);
    assert.ok(
      song.chart.every(
        (n, i) =>
          n.time > 0 &&
          n.time < song.playSeconds &&
          (i === 0 || n.time > song.chart[i - 1].time),
      ),
    );
    const expected = song.chart.filter((_, i) => !(stage < 2 && i % 2));
    assert.equal(s.target, expected.length);
    for (const [i, n] of s.notes.entries()) {
      assert.equal(n.time, 2 + expected[i].time);
      assert.ok(n.lane >= 0 && n.lane < s.laneCount);
      A.stepRhythm(s, n.time);
      assert.equal(A.hitRhythm(s, n.lane, n.time), true);
    }
    A.stepRhythm(s, s.endAudio);
    assert.equal(s.status, "won");
    assert.equal(s.hits, s.target);
  }
});

test("home-page music and the five rhythm songs never share a recording", () => {
  const fs = require("node:fs"),
    path = require("node:path"),
    crypto = require("node:crypto");
  const fingerprint = (song) =>
    crypto
      .createHash("sha256")
      .update(fs.readFileSync(path.join(__dirname, "../public", song.file)))
      .digest("hex");
  const home = new Set(S.homeSongs.map(fingerprint));
  assert.ok(S.homeSongs.length >= 1);
  assert.ok(S.songs.every((song) => !home.has(fingerprint(song))));
  assert.equal(new Set(S.songs.map(fingerprint)).size, 5);
});
