const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() =>
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          name: "Lantern ghost",
          mute: true,
        }),
      ),
    );
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=quick]").click();
    await p.locator("dialog [data-value=maze]").click();
    await p.waitForFunction(() =>
      [...document.querySelectorAll("dialog .ghost-animation")].every(
        (e) => e.dataset.ready,
      ),
    );
    const before = await p
      .locator("dialog .ghost-pose")
      .evaluateAll((es) =>
        es.map((e) => [e.style.backgroundPosition, e.style.opacity]),
      );
    await p.waitForTimeout(1500);
    assert.deepEqual(
      await p
        .locator("dialog .ghost-pose")
        .evaluateAll((es) =>
          es.map((e) => [e.style.backgroundPosition, e.style.opacity]),
        ),
      before,
    );
    assert.equal(await p.locator("select[name=stage] option").count(), 5);
    await p.getByRole("button", { name: "Close dialog" }).click();
    const scenes = [];
    for (const stage of [1, 2, 3]) {
      await p.locator("[data-action=quick]").click();
      await p.locator("dialog [data-value=maze]").click();
      await p.locator("select[name=stage]").selectOption(String(stage));
      assert.ok(
        await p
          .locator("#maze-scene-image")
          .evaluate((e) => e.getAttribute("src").endsWith(".webp")),
      );
      await p.locator("#arcade-form button[type=submit]").click();
      await p.waitForFunction(() => !MidnightArcadeUI.getState()?.paused);
      const scene = await p.evaluate(() => MidnightArcadeUI.getState().scene);
      scenes.push(scene);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollHeight > innerHeight + 2,
        ),
        false,
      );
      await p.screenshot({ path: `/tmp/midnight-maze-scene-${stage}.png` });
      await p.locator("[data-arcade=home]").click();
    }
    assert.equal(new Set(scenes).size, 3);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        stableCharacterPicker: true,
        fiveMazeSettings: true,
        scenes,
        noMobileOverflow: true,
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
