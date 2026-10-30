const { test } = require("node:test");
const assert = require("node:assert/strict");
const A = require("../public/arcade-core");
const S = require("../public/score");
const R = require("../public/records");
test("recording beat times and rhythm notes share the same clock, and accurate playing wins", () => {
  const s = A.createRhythm();
  A.prepareRhythm(s, { time: 0, origin: 2 });
  const expected = (S.getSong(0).charts?.[0] || S.getSong(0).chart).filter(
    (n) => s.notes.some((note) => note.time === 2 + n.time),
  );
  assert.equal(s.notes.length, expected.length);
  for (const [i, n] of s.notes.entries()) {
    assert.equal(n.time, 2 + expected[i].time);
    A.stepRhythm(s, n.time);
    assert.equal(A.hitRhythm(s, n.lane, n.time), true);
  }
  A.stepRhythm(s, s.endAudio);
  assert.equal(s.status, "won");
  assert.equal(s.hits, s.target);
  assert.ok(S.duration > 60);
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
    assert.ok(song.duration > 60);
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
    const expected = (song.charts?.[0] || song.chart).filter((n) =>
      s.notes.some((note) => note.time === 2 + n.time),
    );
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
  assert.ok(S.jumpSongs.length >= 1);
  const rhythm = new Set(S.songs.map(fingerprint));
  assert.ok(
    S.jumpSongs.every(
      (song) => !home.has(fingerprint(song)) && !rhythm.has(fingerprint(song)),
    ),
  );
});

test("Chill uses two arrows, sparse audible notes and forgives isolated misses in every song", () => {
  for (let stage = 0; stage < 5; stage++) {
    const s = A.createRhythm(stage);
    A.prepareRhythm(s, { time: 0, origin: 1 });
    assert.equal(s.laneCount, 2);
    assert.ok(s.hitWindow >= 0.4);
    assert.ok(s.notes.length >= 10 && s.notes.length <= 43);
    assert.ok(s.notes[0].time >= 3.5);
    assert.ok(
      s.notes.every((n, i) => i === 0 || n.time - s.notes[i - 1].time >= 1.5),
    );
    const first = s.notes[0];
    A.stepRhythm(s, first.time + s.hitWindow + 0.01);
    assert.equal(s.lives, 3);
    const next = s.notes[1];
    assert.equal(A.hitRhythm(s, next.lane, next.time + 0.32), true);
    assert.equal(s.missedInRow, 0);
    const hard = A.createRhythm(stage, {}, 2);
    A.prepareRhythm(hard, { time: 0, origin: 1 });
    assert.ok(hard.notes.length > s.notes.length);
  }
});

test("every song uses every active arrow, with balanced counts and no long single-lane streak", () => {
  for (let stage = 0; stage < 5; stage++)
    for (let difficulty = 0; difficulty < 3; difficulty++) {
      const s = A.createRhythm(stage, {}, difficulty);
      A.prepareRhythm(s, { time: 0, origin: 3 });
      const counts = Array(s.laneCount).fill(0);
      let previous = -1,
        streak = 0;
      for (const note of s.notes) {
        counts[note.lane]++;
        streak = note.lane === previous ? streak + 1 : 1;
        previous = note.lane;
        assert.ok(
          streak <= 2,
          `${s.song} difficulty ${difficulty}: single-lane streak`,
        );
      }
      assert.ok(counts.every((count) => count > 0));
      assert.ok(
        Math.max(...counts) - Math.min(...counts) <= 2,
        `${s.song}: ${counts}`,
      );
      // Balancing changes only the arrow assignment, never the musical cue times.
      let last = -Infinity;
      const gap = difficulty === 0 ? 1.5 : difficulty === 1 ? 0.75 : 0.45;
      const song = S.getSong(stage);
      const times = song.charts?.[difficulty]
        ? song.charts[difficulty].map((n) => n.time + 3)
        : song.chart
            .filter((n) => {
              if (n.time - last < gap) return false;
              last = n.time;
              return true;
            })
            .map((n) => n.time + 3);
      assert.deepEqual(
        s.notes.map((n) => n.time),
        times,
      );
    }
});

test("creator song uses its full recording and separate audio-derived difficulty charts", () => {
  const song = S.getSong(0);
  assert.equal(song.title, "La Mesa Puesta Para Ti");
  assert.equal(song.creatorSupplied, true);
  assert.equal(song.sampleRate, 44100);
  assert.ok(song.playSeconds > 89 && song.playSeconds < 91);
  const counts = [];
  for (let difficulty = 0; difficulty < 3; difficulty++) {
    const state = A.createRhythm(0, {}, difficulty);
    A.prepareRhythm(state, { time: 0, origin: 2 });
    const chart = song.charts[difficulty];
    counts.push(chart.length);
    assert.equal(state.target, chart.length);
    assert.deepEqual(
      state.notes.map((n) => n.time),
      chart.map((n) => n.time + 2),
    );
    assert.ok(
      chart.every(
        (n) => n.time >= 2.5 && n.time < song.playSeconds - 1 && n.strength > 0,
      ),
    );
    for (const note of state.notes) {
      A.stepRhythm(state, note.time);
      assert.equal(A.hitRhythm(state, note.lane, note.time), true);
    }
    A.stepRhythm(state, state.endAudio);
    assert.equal(state.status, "won");
  }
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
  assert.equal(A.createRhythm(0, {}, 2).laneCount, 4);
});
