const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 667 },
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          mute: false,
          name: "Song ghost",
        }),
      );
    });
    await p.goto("http://localhost:3000");
    async function start(difficulty) {
      await p.locator("[data-action=quick]").tap();
      await p.locator("dialog [data-value=rhythm]").tap();
      assert.match(
        await p.locator('[data-song="0"]').innerText(),
        /Four Strange Footsteps/,
      );
      await p.locator("[name=difficulty]").selectOption(String(difficulty));
      await p.locator("#arcade-form button[type=submit]").tap();
      await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
    }
    async function play(target) {
      const deadline = Date.now() + 165000,
        seen = new Set();
      while (Date.now() < deadline) {
        const n = await p.evaluate((target) => {
          const s = MidnightArcadeUI.getState();
          if (s.status !== "playing" || s.hits >= target) return null;
          const n = s.notes.find((n) => n.status === "pending");
          return n
            ? {
                lane: n.lane,
                key: s.keys[n.lane],
                wait: n.time - MidnightMusic.clock().time,
              }
            : null;
        }, target);
        if (!n) break;
        if (n.wait < 0.04 && n.wait > -0.12) {
          await p.locator(`[data-lane="${n.lane}"]`).tap({ force: true });
          seen.add(n.lane);
        }
        await p.waitForTimeout(12);
      }
      return seen;
    }
    await start(2);
    assert.equal(await p.locator("[data-lane]").count(), 4);
    assert.equal(
      await p.evaluate(() => MidnightMusic.status().decodedSampleRate),
      44100,
    );
    await p.evaluate(() => {
      window.noteDebug = [];
      const original = MidnightArcade.hitRhythm;
      MidnightArcade.hitRhythm = (s, l, t) => {
        const n = s.notes
          .filter((n) => n.status === "pending" && n.lane === l)
          .sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t))[0];
        const ok = original(s, l, t);
        noteDebug.push({
          lane: l,
          time: t,
          note: n?.time,
          error: n ? t - n.time : null,
          ok,
        });
        return ok;
      };
    });
    const lanes = await play(12);
    assert.equal(await p.evaluate(() => MidnightArcadeUI.getState().hits), 12);
    assert.equal(await p.evaluate(() => noteDebug.every((n) => n.ok)), true);
    assert.equal(lanes.size, 4);
    assert.equal(await p.evaluate(() => MidnightArcadeUI.getState().misses), 0);
    await p.locator("[data-arcade=pause]").tap();
    const before = await p.evaluate(() => MidnightMusic.clock().time);
    await p.waitForTimeout(300);
    assert.ok(
      Math.abs((await p.evaluate(() => MidnightMusic.clock().time)) - before) <
        0.1,
    );
    await p.locator("[data-arcade=pause]").tap();
    await p.waitForTimeout(200);
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollHeight > innerHeight + 2,
      ),
      false,
    );
    await p.screenshot({ path: "/tmp/la-mesa-hard-phone.png" });
    await p.locator("[data-arcade=home]").tap();
    await start(0);
    assert.equal(await p.locator("[data-lane]").count(), 2);
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().target),
      80,
    );
    const easyLanes = await play(1000);
    await p.waitForSelector(".arcade-result", { timeout: 15000 });
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().status),
      "won",
    );
    assert.equal(await p.evaluate(() => MidnightArcadeUI.getState().misses), 0);
    assert.equal(easyLanes.size, 2);
    assert.ok(
      await p.evaluate(() => MidnightArcadeUI.getState().elapsed > 144),
    );
    await p.goto("http://localhost:3000/story.html");
    const image = p.locator("img");
    await image.waitFor();
    assert.ok(
      await image.evaluate(
        (e) =>
          e.complete &&
          e.naturalWidth > 500 &&
          Math.abs(e.naturalHeight / e.naturalWidth - 16 / 9) < 0.1,
      ),
    );
    assert.equal(await p.locator("a[download]").count(), 1);
    assert.deepEqual(errors, []);
    console.log(
      "Creator song: 44.1kHz playback, four hard touch lanes, pause/resume clock, complete 145-second easy win with both lanes and zero misses; Story image loads in browser: passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
