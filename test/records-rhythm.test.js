const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../public/arcade-core");
const S = require("../public/score");
const R = require("../public/records");
test("rhythm notes match the soundtrack clock and accurate playing wins", () => {
  const s = A.createRhythm();
  A.prepareRhythm(s, { time: 10, origin: 0 });
  for (const n of s.notes) {
    assert.equal(n.midi, S.noteAtBeat(n.beat));
    assert.equal(n.time, n.beat * S.beat);
    A.stepRhythm(s, n.time);
    assert.equal(A.hitRhythm(s, n.lane, n.time), true);
  }
  A.stepRhythm(s, s.endAudio);
  assert.equal(s.status, "won");
  assert.equal(s.hits, s.target);
  assert.ok(S.duration > 80);
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
test("five distinct songs each produce a complete synchronized, winnable chart", () => {
  assert.equal(S.songs.length, 5);
  assert.equal(new Set(S.songs.map((s) => s.title)).size, 5);
  assert.equal(
    new Set(
      S.songs.map((s) =>
        JSON.stringify(Array.from({ length: 32 }, (_, i) => s.noteAtBeat(i))),
      ),
    ).size,
    5,
  );
  for (let stage = 0; stage < 5; stage++) {
    const song = S.getSong(stage),
      s = A.createRhythm(stage);
    A.prepareRhythm(s, { time: 0, origin: 2 });
    assert.equal(
      s.target,
      Array.from({ length: song.length }, (_, i) => song.noteAtBeat(i)).filter(
        (n) => n !== null,
      ).length,
    );
    assert.ok(s.keys.every((k) => k.startsWith("Arrow")));
    assert.equal(s.laneCount, stage === 0 ? 2 : stage < 3 ? 3 : 4);
    for (const n of s.notes) {
      assert.equal(n.midi, song.noteAtBeat(n.beat));
      assert.equal(n.time, 2 + n.beat * song.beat);
      A.stepRhythm(s, n.time);
      assert.equal(A.hitRhythm(s, n.lane, n.time), true);
    }
    A.stepRhythm(s, s.endAudio);
    assert.equal(s.status, "won");
    assert.equal(s.hits, s.target);
  }
  assert.ok(S.songs.every((s, i) => i === 0 || s.tempo > S.songs[i - 1].tempo));
});
