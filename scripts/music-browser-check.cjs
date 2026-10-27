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
      for (let stage = 0; stage < 5; stage++) {
        const b = await MidnightMusic.renderPreview(stage, 12),
          data = b.getChannelData(0);
        let peak = 0,
          sum = 0;
        for (const v of data) {
          peak = Math.max(peak, Math.abs(v));
          sum += v * v;
        }
        out.push({
          song: MidnightScore.getSong(stage).title,
          meter: MidnightScore.getSong(stage).beatsPerBar,
          peak,
          rms: Math.sqrt(sum / data.length),
        });
      }
      return out;
    });
    for (const r of rendered) {
      assert.equal(r.meter, 3);
      assert.ok(r.peak < 0.8 && r.peak > 0.02);
      assert.ok(r.rms > 0.008 && r.rms < 0.15);
    }
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        fiveOriginalHauntedWaltzes: rendered,
        noClipping: true,
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
