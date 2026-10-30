const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() =>
      localStorage.setItem(
        "midnight-profile",
        '{"tutorial":true,"chosen":true,"mute":true}',
      ),
    );
    await p.goto("http://localhost:3000");
    const rendered = await p.evaluate(async () => {
      const out = [];
      for (let stage = 0; stage < MidnightScore.songs.length; stage++) {
        const b = await MidnightMusic.renderPreview(stage, 18),
          d = b.getChannelData(0);
        let peak = 0,
          sum = 0,
          difference = 0;
        for (let i = 0; i < d.length; i++) {
          peak = Math.max(peak, Math.abs(d[i]));
          sum += d[i] * d[i];
          if (i < d.length / 3)
            difference += Math.abs(d[i] - d[i + Math.floor(b.sampleRate * 10)]);
        }
        out.push({
          song: MidnightScore.getSong(stage).title,
          artist: MidnightScore.getSong(stage).artist,
          duration: MidnightScore.getSong(stage).duration,
          peak,
          rms: Math.sqrt(sum / d.length),
          difference,
        });
      }
      return out;
    });
    for (const r of rendered) {
      assert.ok(r.duration > 60);
      assert.ok(r.artist.length > 3);
      assert.ok(r.peak < 0.6 && r.peak > 0.02);
      assert.ok(r.rms > 0.002 && r.rms < 0.15);
      assert.ok(r.difference > 1);
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        fullSongRecordings: rendered,
        noClipping: true,
        noShortExactRepeat: true,
        errors,
      }),
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
