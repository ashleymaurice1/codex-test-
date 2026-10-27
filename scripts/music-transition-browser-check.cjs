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
    await p.locator("[data-action=quick]").click();
    await p.waitForFunction(
      () => MidnightHomeMusic.status().state === "running",
    );
    const before = await p.evaluate(() => ({
      source: MidnightHomeMusic.status().source,
      melody: Array.from({ length: 32 }, (_, i) =>
        MidnightHomeScore.noteAtBeat(i),
      ),
      tempo: MidnightHomeScore.tempo,
    }));
    assert.equal(
      await p.evaluate(() => MidnightHomeMusic.status().muted),
      false,
    );
    await p.locator("dialog [data-value=rhythm]").click();
    await p.locator('[data-song="1"]').click();
    assert.equal(await p.locator("select[name=stage]").inputValue(), "1");
    await p.locator("#arcade-form button[type=submit]").click();
    await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
    assert.equal(
      await p.evaluate(() => MidnightHomeMusic.status().muted),
      true,
    );
    assert.equal(
      await p.evaluate(() => MidnightMusic.status().samplesReady),
      true,
    );
    assert.equal(
      await p.evaluate(() => MidnightMusic.status().source),
      "Pumpkin Parade",
    );
    await p.locator("[data-arcade=home]").click();
    assert.equal(
      await p.evaluate(() => MidnightHomeMusic.status().muted),
      false,
    );
    const after = await p.evaluate(() => ({
      source: MidnightHomeMusic.status().source,
      melody: Array.from({ length: 32 }, (_, i) =>
        MidnightHomeScore.noteAtBeat(i),
      ),
      tempo: MidnightHomeScore.tempo,
    }));
    assert.deepEqual(after, before);
    await p.locator("[data-action=mute]").click();
    assert.equal(
      await p.evaluate(() => MidnightHomeMusic.status().muted),
      true,
    );
    await p.reload();
    assert.equal(
      await p.evaluate(() => MidnightHomeMusic.status().muted),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      "Homepage waltz preserved; five-song picker works; sampled rhythm music replaces ambience during play; home waltz resumes; mute persists",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
