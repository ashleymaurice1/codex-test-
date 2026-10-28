const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      ...devices["iPhone 13"],
      defaultBrowserType: undefined,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() =>
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          name: "Phone ghost",
          mute: false,
          team: "Mach",
        }),
      ),
    );
    await page.goto("http://localhost:3000");
    await page.locator("[data-action=quick]").tap();
    await page.locator("dialog [data-value=jump]").tap();
    await page.locator("#arcade-form button[type=submit]").tap();
    await page.waitForFunction(
      () => MidnightArcadeUI.getState()?.paused === false,
    );
    await page.waitForFunction(
      () =>
        MidnightMusic.status().state === "running" &&
        MidnightMusic.status().source === "Del Rio Bravo" &&
        MidnightMusic.status().recordingReady,
    );
    const button = page.locator("[data-arcade=jump]");
    const box = await button.boundingBox();
    // Tap the nested label, then the button edge: both must activate on contact.
    for (const point of [
      { x: box.x + box.width / 2, y: box.y + box.height - 12 },
      { x: box.x + 10, y: box.y + 15 },
    ]) {
      await page.waitForFunction(
        () => MidnightArcadeUI.getState().player.y === 0,
      );
      await page.touchscreen.tap(point.x, point.y);
      await page.waitForFunction(
        () => MidnightArcadeUI.getState().player.y > 10,
      );
      assert.equal(await page.evaluate(() => getSelection().toString()), "");
    }
    assert.equal(
      await button.evaluate((e) => getComputedStyle(e).userSelect),
      "none",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollHeight > innerHeight + 2,
      ),
      false,
    );
    await page.locator("[data-arcade=home]").tap();
    await page.locator("[data-action=mute]").tap();
    assert.equal(await page.evaluate(() => MidnightMusic.status().muted), true);
    await page.locator("[data-action=quick]").tap();
    assert.equal(await page.evaluate(() => MidnightMusic.status().muted), true);
    assert.deepEqual(errors, []);
    console.log(
      "Phone touch: label and edge taps jump, no selected text, music starts on gesture, mute persists, viewport fits.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
