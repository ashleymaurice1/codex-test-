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
    await p.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          '{"tutorial":true,"chosen":true,"mute":false,"name":"Music ghost"}',
        );
    });
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=music-options]").first().click();
    await p.waitForFunction(
      () =>
        MidnightMusic.status().recordingReady &&
        MidnightMusic.status().state === "running",
    );
    await p.locator("#home-music").selectOption("1");
    await p.waitForFunction(
      () => MidnightMusic.status().source === "Witch Waltz",
    );
    await p.locator("#home-music").selectOption("0");
    await p.waitForFunction(
      () => MidnightMusic.status().source === "Creepy Hallow",
    );
    await p.locator("#music-volume").evaluate((e) => {
      e.value = 20;
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(await p.evaluate(() => profile.musicVolume), 0.2);
    await p.locator("dialog .music-preview-toggle").click();
    await p.waitForFunction(() => MidnightMusic.status().previewing);
    await p.locator("dialog .music-preview-toggle").click();
    await p.waitForFunction(() => !MidnightMusic.status().previewing);
    await p.getByRole("button", { name: "Close dialog" }).click();
    await p.locator("[data-action=quick]").click();
    await p.locator("dialog [data-value=rhythm]").click();
    assert.equal(await p.locator("dialog audio").count(), 5);
    assert.equal(await p.locator("dialog audio[controls]").count(), 0);
    assert.equal(await p.locator("dialog .music-preview-toggle").count(), 5);
    await p.locator('[data-song="1"]').click();
    await p.locator("#arcade-form button[type=submit]").click();
    await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
    assert.equal(
      await p.evaluate(() => MidnightMusic.status().source),
      "Midnight Spell",
    );
    assert.equal(await p.evaluate(() => MidnightMusic.status().mode), "rhythm");
    await p.locator("[data-arcade=home]").click();
    await p.waitForFunction(
      () => MidnightMusic.status().source === "Creepy Hallow",
    );
    assert.ok(
      await p.evaluate(() => MidnightMusic.status().recordingOffset > 0),
    );
    for (const [mode, title] of [
      ["jump", "Del Rio Bravo"],
      ["maze", "Velvet Cathedral"],
    ]) {
      await p.locator("[data-action=quick]").click();
      await p.locator(`dialog [data-value=${mode}]`).click();
      await p.locator("#arcade-form button[type=submit]").click();
      await p.waitForFunction(() => !MidnightArcadeUI.getState()?.paused);
      assert.equal(
        await p.evaluate(() => MidnightMusic.status().source),
        title,
      );
      assert.ok((await p.locator("audio[controls]").count()) === 0);
      await p.locator("[data-arcade=home]").click();
      await p.waitForFunction(
        () => MidnightMusic.status().source === "Creepy Hallow",
      );
    }
    await p.locator("[data-action=mute]").click();
    assert.equal(await p.evaluate(() => MidnightMusic.status().muted), true);
    await p.reload();
    assert.equal(await p.evaluate(() => MidnightMusic.status().muted), true);
    assert.equal(await p.evaluate(() => profile.musicVolume), 0.2);
    assert.deepEqual(errors, []);
    console.log(
      "Finished recordings, five Listen/Pause previews, background choice, saved volume/mute, beat-clock playback, and home recording resumes: passed",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
