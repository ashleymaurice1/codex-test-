const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(
    () =>
      !localStorage.getItem("midnight-profile") &&
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          team: "Mach",
          name: "Test ghoul",
          coins: 200,
          level: 3,
          unlockedLevel: 3,
        }),
      ),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.GAME_URL || "http://127.0.0.1:3000");
  await page.locator("[data-action=solo]").first().click();
  await page.locator('[data-action=level][data-value="3"]').last().click();
  await page.locator("#play-form button").click();
  await page.waitForSelector(".choices");
  const seen = new Set();
  let answered = null,
    actions = 0;
  const until = Date.now() + 125000;
  while (Date.now() < until) {
    if (await page.locator(".result").count()) break;
    const data = await page.evaluate(() => ({
      id: state?.challenge?.id,
      kind: state?.challenge?.kind,
      now: Date.now() + offset,
      ext: state?.challenge?.extinguish,
      still: state?.challenge?.still,
      choices: state?.challenge?.choices,
      stones: me()?.stones,
      blocked: me()?.blockedUntil,
      answered: me()?.answered,
      item: me()?.item,
      phase: state?.phase,
    }));
    if (data.phase === "race") seen.add(data.kind);
    if (data.stones) {
      await page
        .locator("#smash-stone")
        .click()
        .catch(() => {});
      continue;
    }
    if (data.item && (await page.locator("[data-action=item]").isEnabled())) {
      await page.locator("[data-action=item]").click();
    }
    if (
      data.id !== answered &&
      data.phase === "race" &&
      data.blocked < data.now
    ) {
      if (data.kind === 2 && data.now < data.ext + 60) {
        await page.waitForTimeout(100);
        continue;
      }
      let index =
        data.kind === 0
          ? data.choices.indexOf("pumpkin")
          : data.kind === 3
            ? data.still
            : data.kind === 4
              ? data.choices.indexOf(6)
              : data.kind === 5
                ? data.choices.indexOf("ghost-odd")
                : 0;
      const b = page.locator(`[data-action=answer][data-value="${index}"]`);
      if (await b.isEnabled()) {
        await b.click({ force: true, timeout: 1500 });
        answered = data.id;
        seen.add(data.kind);
        actions++;
      }
    }
    await page.waitForTimeout(100);
  }
  await page.waitForSelector(".result", { timeout: 3000 });
  await page.screenshot({ path: "/tmp/midnight-finish.png", fullPage: true });
  const coins = await page.evaluate(() => profile.coins);
  assert.ok(coins > 200);
  assert.equal(seen.size, 6);
  assert.equal(errors.length, 0);
  await page.reload();
  await page.waitForSelector(".result");
  assert.equal(
    await page.evaluate(() => profile.coins),
    coins,
    "reconnect must not duplicate coins",
  );
  console.log(
    JSON.stringify({
      completeSolo: true,
      challengeKinds: [...seen],
      correctTapAttempts: actions,
      coins,
      errors,
      mobileOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
