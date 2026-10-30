const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 667 } }),
      errors = [],
      songs = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({
            tutorial: true,
            chosen: true,
            name: "Arrow ghost",
            mute: true,
          }),
        );
    });
    await p.goto("http://localhost:3000");
    for (let stage = 0; stage < 4; stage++) {
      await p.locator("[data-action=quick]").click();
      await p.locator("dialog [data-value=rhythm]").click();
      assert.equal(await p.locator(".rhythm-song-list li").count(), 4);
      await p.locator(`[data-song="${stage}"]`).click();
      assert.equal(
        await p.locator("select[name=stage]").inputValue(),
        String(stage),
      );
      await p.locator("#arcade-form button[type=submit]").click();
      await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
      const info = await p.evaluate(() => ({
        song: MidnightArcadeUI.getState().song,
        source: MidnightMusic.status().source,
        keys: MidnightArcadeUI.getState().keys,
        overflow: document.documentElement.scrollHeight > innerHeight + 2,
      }));
      assert.equal(info.song, info.source);
      assert.equal(info.overflow, false);
      assert.deepEqual(info.keys, ["ArrowLeft", "ArrowRight"]);
      songs.push(info.song);
      const until = Date.now() + 25000;
      while (Date.now() < until) {
        const n = await p.evaluate(() => {
          const s = MidnightArcadeUI.getState();
          if (s.hits >= 6) return null;
          const n = s.notes.find((n) => n.status === "pending");
          return n
            ? { key: s.keys[n.lane], wait: n.time - MidnightMusic.clock().time }
            : null;
        });
        if (!n) break;
        if (n.wait < 0.06 && n.wait > -0.15) await p.keyboard.press(n.key);
        await p.waitForTimeout(15);
      }
      assert.ok(await p.evaluate(() => MidnightArcadeUI.getState().hits >= 6));
      assert.equal(
        await p.evaluate(() => MidnightArcadeUI.getState().misses),
        0,
      );
      assert.equal(await p.evaluate(() => scrollY), 0);
      if (stage === 0) {
        await p.locator("[data-arcade=pause]").click();
        const before = await p.evaluate(() => MidnightMusic.clock().time);
        await p.waitForTimeout(350);
        assert.ok(
          Math.abs(
            (await p.evaluate(() => MidnightMusic.clock().time)) - before,
          ) < 0.1,
        );
        await p.screenshot({ path: "/tmp/midnight-four-arrows.png" });
      }
      await p.locator("[data-arcade=home]").click();
    }
    assert.equal(new Set(songs).size, 4);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        selectedSoundtrack: songs,
        actualArrowKeyHits: true,
        twoBeginnerLanes: true,
        noScroll: true,
        pauseFreezesSong: true,
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
