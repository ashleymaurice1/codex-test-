const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage({ ...devices["iPhone 13"] }),
      errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.addInitScript(() => {
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          mute: true,
          name: "Moon ghost",
        }),
      );
      localStorage.setItem("midnight-language", "es");
    });
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=quick]").tap();
    await p.locator("dialog [data-value=jump]").tap();
    assert.equal(await p.locator("[name=run-mode]").inputValue(), "marathon");
    assert.match(await p.locator("[name=run-mode]").innerText(), /Maratón/);
    await p.locator("[name=run-mode]").selectOption("endless");
    await p.locator("[name=difficulty]").selectOption("2");
    await p.locator("#arcade-form button[type=submit]").tap();
    await p.waitForFunction(
      () => MidnightArcadeUI.getState()?.paused === false,
    );
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().endless),
      true,
    );
    assert.ok(
      !(await p.locator("#arcade-stats").innerText()).includes("Infinity"),
    );
    await p.locator("[data-arcade=jump]").tap();
    await p.waitForFunction(() => MidnightArcadeUI.getState().player.y > 5);
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollHeight > innerHeight + 2,
      ),
      false,
    );
    // Fast-forward through the real state machine without jumps to test the results/retry wiring.
    await p.evaluate(() => {
      const s = MidnightArcadeUI.getState();
      for (let i = 0; i < 100 && s.status === "playing"; i++)
        MidnightArcade.stepJump(s, 1);
    });
    await p.waitForSelector(".arcade-result");
    await p.locator("[data-arcade-result=longer]").tap();
    await p.waitForFunction(
      () => MidnightArcadeUI.getState()?.paused === false,
    );
    assert.ok(
      await p.evaluate(() => MidnightArcadeUI.getState().runLength >= 3),
    );
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().endless),
      false,
    );
    await p.locator("[data-arcade=home]").tap();
    for (const stage of [0, 4]) {
      await p.locator("[data-action=quick]").tap();
      await p.locator("dialog [data-value=maze]").tap();
      await p.locator("[name=stage]").selectOption(String(stage));
      await p.locator("[name=difficulty]").selectOption("2");
      await p.locator("#arcade-form button[type=submit]").tap();
      await p.waitForFunction(
        () => MidnightArcadeUI.getState()?.paused === false,
      );
      await p.keyboard.press("ArrowRight");
      await p.waitForTimeout(35);
      await p.keyboard.press("ArrowDown");
      await p.waitForTimeout(35);
      await p.keyboard.press("ArrowLeft");
      assert.equal(
        await p.evaluate(() => {
          const s = MidnightArcadeUI.getState();
          return s.grid[Math.round(s.player.py)][Math.round(s.player.px)];
        }),
        0,
      );
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollHeight > innerHeight + 2,
        ),
        false,
      );
      await p.screenshot({ path: `/tmp/ghost-maze-fixed-${stage}.png` });
      await p.locator("[data-arcade=home]").tap();
    }
    assert.deepEqual(errors, []);
    console.log(
      "Spanish phone: Marathon default, Endless touch play/results/longer replay, clear hard-maze turns, no overflow or JS errors: passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
