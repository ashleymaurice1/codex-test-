const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await c.addInitScript(() => {
    if (!localStorage.getItem("midnight-profile"))
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          team: "Mach",
          mute: true,
          name: "Campaign tester",
        }),
      );
  });
  const p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(process.env.GAME_URL || "http://127.0.0.1:3000");
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.locator("[data-action=race-solo]").first().click();
  assert.equal(await p.locator(".level-row:disabled").count(), 3);
  await p.locator('dialog [data-action=level][data-value="0"]').click();
  await p.locator("#play-form button[type=submit]").click();
  await p.waitForSelector(".choices");
  const seen = new Set();
  let answered = null;
  const until = Date.now() + 125000;
  while (Date.now() < until) {
    if (await p.locator(".result").count()) break;
    const d = await p.evaluate(() => ({
      id: state.challenge.id,
      kind: state.challenge.kind,
      choices: state.challenge.choices,
      ext: state.challenge.extinguish,
      now: Date.now() + offset,
      blocked: me().blockedUntil,
      stones: me().stones,
      item: me().item,
    }));
    seen.add(d.kind);
    if (d.stones) {
      await p
        .locator("#smash-stone")
        .click()
        .catch(() => {});
      continue;
    }
    if (d.item && (await p.locator("[data-action=item]").isEnabled()))
      await p.locator("[data-action=item]").click();
    if (answered !== d.id && d.blocked < d.now) {
      if (d.kind === 2 && d.now < d.ext + 70) {
        await p.waitForTimeout(100);
        continue;
      }
      const target = {
        0: "pumpkin",
        6: "moon",
        7: "potion-blue",
        8: "spider",
        9: "ghost",
        10: "lantern-lit",
        11: "candy-corn",
      }[d.kind];
      const index =
        d.kind === 4
          ? d.choices.indexOf(Math.max(...d.choices))
          : target
            ? d.choices.indexOf(target)
            : 0;
      const button = p.locator(`[data-action=answer][data-value="${index}"]`);
      if (await button.isEnabled()) {
        await button.click({ force: true });
        answered = d.id;
      }
    }
    await p.waitForTimeout(100);
  }
  await p.waitForSelector(".result");
  assert.equal(seen.size, 5);
  assert.ok(
    [...seen].every((kind) => [0, 4, 6, 7, 8, 9, 10, 11].includes(kind)),
  );
  assert.equal(await p.evaluate(() => profile.unlockedLevel), 1);
  assert.equal(await p.evaluate(() => profile.totalScore), 500);
  assert.equal(await p.evaluate(() => profile.extraLives), 0);
  assert.ok(await p.evaluate(() => profile.levelStars[0] > 0));
  await p.reload();
  await p.waitForSelector(".result");
  assert.equal(await p.evaluate(() => profile.unlockedLevel), 1);
  assert.equal(await p.evaluate(() => profile.totalScore), 500);
  assert.equal(await p.evaluate(() => profile.extraLives), 0);
  await p.locator("[data-action=next-level]").click();
  await p.locator("dialog [data-action=hub-race]").click();
  await p.locator("#play-form button[type=submit]").click();
  await p.waitForSelector(".choices");
  assert.equal(await p.evaluate(() => state.level), 1);
  assert.equal(errors.length, 0);
  console.log(
    JSON.stringify({
      campaign: true,
      firstLevelCompleted: true,
      nextLevelUnlocked: true,
      persistedAfterRefresh: true,
      secondLevelStarted: true,
      errors,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
