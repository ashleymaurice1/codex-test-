const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 667 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({
            name: "Moon",
            chosen: true,
            tutorial: true,
            mute: true,
            coins: 200,
            arcadeUnlocked: 2,
            arcadeLevel: 1,
            highScores: [
              {
                id: "old",
                mode: "maze",
                name: "Moon",
                score: 300,
                seconds: 20,
                level: 1,
              },
            ],
          }),
        );
    });
    await p.goto("http://127.0.0.1:3000");
    await p.locator("[data-action=quick]").click();
    await p.locator("dialog [data-value=rhythm]").click();
    await p.locator("select[name=stage]").selectOption("3");
    await p.locator("#arcade-form button[type=submit]").click();
    await p.waitForTimeout(700);
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().elapsed),
      0,
    );
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight + 2,
      ),
    );
    await p.waitForFunction(() => !MidnightArcadeUI.getState().paused);
    assert.ok(
      await p.evaluate(() => MidnightMusic.status().themeSeconds >= 32),
    );
    const end = Date.now() + 55000;
    while (Date.now() < end) {
      const n = await p.evaluate(() => {
        const s = MidnightArcadeUI.getState();
        if (s.status !== "playing") return null;
        const n = s.notes.find((n) => n.status === "pending");
        return n
          ? { key: s.keys[n.lane], wait: n.time - MidnightMusic.clock().time }
          : null;
      });
      if (!n) break;
      if (n.wait < 0.055 && n.wait > -0.15) await p.keyboard.press(n.key);
      await p.waitForTimeout(15);
    }
    await p.waitForSelector(".arcade-result");
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().status),
      "won",
    );
    assert.equal(await p.evaluate(() => profile.arcadeUnlocked), 2);
    assert.ok(
      await p.evaluate(() =>
        profile.highScores.some((r) => r.mode === "rhythm"),
      ),
    );
    await p.locator("[data-arcade-result=next-song]").click();
    await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
    assert.equal(await p.evaluate(() => MidnightArcadeUI.getState().stage), 4);
    assert.equal(
      await p.evaluate(() => MidnightMusic.status().source),
      "Monster Masquerade",
    );
    await p.locator("[data-arcade=home]").click();
    await p.locator("[data-action=player-settings]").click();
    await p.locator("[data-action=reset-confirm]").click();
    await p.getByRole("button", { name: "Cancel", exact: true }).click();
    assert.ok(await p.evaluate(() => profile.coins >= 200));
    await p.locator("[data-action=player-settings]").click();
    await p.locator("[data-action=reset-confirm]").click();
    await p.locator("[data-action=reset-player]").click();
    assert.equal(await p.evaluate(() => profile.coins), 0);
    assert.equal(await p.evaluate(() => profile.name), "");
    assert.ok(await p.evaluate(() => profile.highScores.length >= 2));
    await p.reload();
    assert.equal(await p.evaluate(() => profile.arcadeUnlocked), 0);
    await p.locator("[data-action=player-settings]").click();
    await p.locator("[data-action=reset-confirm]").click();
    await p.locator("#reset-keep-scores").uncheck();
    await p.locator("[data-action=reset-player]").click();
    assert.equal(await p.evaluate(() => profile.highScores.length), 0);
    assert.deepEqual(errors, []);
    await p.screenshot({
      path: "/tmp/midnight-updated-home.png",
      fullPage: true,
    });
    console.log(
      "Rhythm, countdown, mobile viewport, quick play, saved scores, reset cancel/keep/clear passed",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
