const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const contexts = [];
  async function page() {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    contexts.push(c);
    await c.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({
            tutorial: true,
            chosen: true,
            team: "Mach",
            mute: true,
            coins: 200,
          }),
        );
    });
    const p = await c.newPage();
    await p.goto(process.env.GAME_URL || "http://127.0.0.1:3000");
    return p;
  }
  const p = await page(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.locator("[data-action=solo]").first().click();
  await p.locator('dialog [data-action=level][data-value="0"]').click();
  assert.equal(await p.locator("input[name=character]").count(), 4);
  await p.locator("input[name=character][value=Ember]").check();
  await p.locator("#nickname").fill("Character tester");
  await p.screenshot({
    path: "/tmp/midnight-character-picker.png",
    fullPage: true,
  });
  await p.locator("#play-form button[type=submit]").click();
  await p.waitForSelector(".choices");
  assert.equal(await p.evaluate(() => me().team), "Ember");
  assert.equal(await p.locator(".full-track").getAttribute("open"), null);
  assert.equal(await p.locator("#live-race-hud .hud-player").count(), 4);
  assert.equal(await p.locator("#live-race-hud .hud-you").count(), 1);
  await p.locator(".full-track summary").click();
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const hud = await p.locator("#live-race-hud").boundingBox();
  assert.ok(
    hud.y >= -1 && hud.y < 100,
    "Live positions remain visible while scrolling",
  );
  await p.screenshot({ path: "/tmp/midnight-sticky-race.png", fullPage: true });
  await p.locator("[data-action=leave]").click();
  await p.locator("[data-action=create]").click();
  assert.equal(
    await p.locator("input[name=character][value=Ember]").isChecked(),
    true,
  );
  await p.locator("input[name=character][value=Misty]").check();
  await p.locator("#play-form button[type=submit]").click();
  await p.waitForSelector(".room-code");
  const code = await p.locator(".room-code").textContent();
  assert.equal(await p.evaluate(() => me().team), "Misty");
  const q = await page();
  await q.locator("[data-action=join]").click();
  await q.locator("input[name=character][value=Slink]").check();
  await q.locator("#nickname").fill("Guest");
  await q.locator("#room-code").fill(code);
  await q.locator("#play-form button[type=submit]").click();
  await q.waitForSelector("[data-action=ready]");
  assert.equal(await q.evaluate(() => me().team), "Slink");
  await q.locator("[data-action=ready]").click();
  await p.waitForFunction(() =>
    state.players.some((p) => p.name === "Guest" && p.ready),
  );
  await p.locator("[data-action=start]").click();
  await Promise.all([
    p.waitForSelector(".choices"),
    q.waitForSelector(".choices"),
  ]);
  assert.equal(await p.evaluate(() => me().team), "Misty");
  assert.equal(await q.evaluate(() => me().team), "Slink");
  await p.locator("[data-action=leave]").click();
  await p.reload();
  await p.locator("[data-action=shop]").click();
  await p.locator("[data-action=buy-life]").click();
  assert.equal(await p.evaluate(() => profile.extraLives), 1);
  assert.equal(await p.evaluate(() => profile.coins), 120);
  await p.locator("[data-action=buy-life]").click();
  await p.locator("[data-action=buy-life]").click();
  assert.equal(await p.evaluate(() => profile.extraLives), 2);
  assert.equal(await p.evaluate(() => profile.coins), 40);
  await p.reload();
  assert.equal(await p.evaluate(() => profile.extraLives), 2);
  await p.locator("[data-action=solo]").first().click();
  await p.locator('dialog [data-action=level][data-value="0"]').click();
  await p.locator("#play-form button[type=submit]").click();
  await p.waitForSelector(".choices");
  for (let miss = 0; miss < 5; miss++) {
    const c = await p.evaluate(() => state.challenge);
    const good = { 0: "pumpkin", 6: "moon", 7: "potion-blue", 9: "ghost" }[
      c.kind
    ];
    const wrong = c.choices.findIndex((x) => x !== good);
    await p.locator(`[data-action=answer][data-value="${wrong}"]`).click();
    await p.waitForFunction(
      (id) => state.phase === "finished" || state.challenge.id !== id,
      c.id,
    );
  }
  await p.waitForSelector(".result");
  assert.equal(await p.evaluate(() => me().eliminated), true);
  assert.equal(await p.evaluate(() => profile.extraLives), 0);
  assert.equal(await p.locator(".result h1").textContent(), "Out of glow!");
  await p.locator("[data-action=rematch]").click();
  await p.waitForSelector(".choices");
  assert.equal(await p.evaluate(() => me().lives), 3);
  assert.equal(await p.evaluate(() => me().reserveLives), 0);
  assert.equal(errors.length, 0);
  console.log(
    JSON.stringify({
      chooseAllModes: true,
      selectedCharactersReachRace: true,
      choiceRemembered: true,
      stickyPositions: true,
      buyLives: true,
      purchaseBalanceProtected: true,
      lifePurchasesPersist: true,
      spareLivesConsumed: true,
      outOfLivesAndRetry: true,
      errors,
    }),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
