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
          name: "Race ghost",
        }),
      );
      localStorage.setItem("midnight-language", "es");
    });
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=quick]").tap();
    await p.locator("[data-action=hub-race]").tap();
    assert.equal(await p.locator("[name=race-difficulty] option").count(), 3);
    await p.locator("[name=race-difficulty]").selectOption("2");
    await p.locator("#play-form button[type=submit]").tap();
    await p.waitForSelector(".choices");
    assert.equal(await p.evaluate(() => state.difficulty), 2);
    assert.equal(await p.evaluate(() => state.finishHits), 11);
    const kinds = [],
      answered = new Set(),
      deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      if (await p.locator(".result").count()) break;
      const c = await p.evaluate(() => state.challenge);
      if (answered.has(c.id)) {
        await p.waitForTimeout(30);
        continue;
      }
      if (c.kind === 2 && Date.now() < c.extinguish + 50) {
        await p.waitForTimeout(30);
        continue;
      }
      let index =
        c.kind === 3
          ? c.still
          : c.kind === 4
            ? c.choices.indexOf(Math.max(...c.choices))
            : c.kind === 1 || c.kind === 2
              ? 0
              : c.choices.indexOf(
                  c.target ||
                    {
                      0: "pumpkin",
                      5: "ghost-odd",
                      6: "moon",
                      7: "potion-blue",
                      8: "spider",
                      9: "ghost",
                      10: "lantern-lit",
                      11: "candy-corn",
                    }[c.kind],
                );
      if (c.kind === 7 && c.target === "potion-green")
        assert.match(await p.locator(".instruction").innerText(), /VERDE/);
      const button = p.locator(`[data-action=answer][data-value="${index}"]`);
      if (!(await button.isEnabled())) {
        await p.waitForTimeout(25);
        continue;
      }
      await button.tap({ force: true });
      answered.add(c.id);
      kinds.push(c.kind);
      await p.waitForTimeout(25);
    }
    await p.waitForSelector(".result");
    assert.ok(kinds.length >= 8);
    assert.equal(new Set(kinds).size, kinds.length);
    assert.ok(await p.evaluate(() => me().correct >= 8));
    await p.locator("[data-action=race-difficulty]").tap();
    assert.equal(await p.locator("[name=race-difficulty]").inputValue(), "2");
    await p.locator("[name=race-difficulty]").selectOption("0");
    await p.locator("#play-form button[type=submit]").tap();
    await p.waitForFunction(
      () => state?.phase === "countdown" && state.difficulty === 0,
    );
    assert.equal(await p.evaluate(() => state.finishHits), 5);
    assert.equal(await p.evaluate(() => profile.name), "Race ghost");
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        difficultySelection: true,
        uniqueChallengeKinds: kinds,
        spanishTargets: true,
        changeDifficultyReplay: true,
        nicknameRetained: true,
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
