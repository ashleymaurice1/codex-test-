const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript(() => {
    if (!localStorage.getItem("midnight-profile"))
      localStorage.setItem(
        "midnight-profile",
        JSON.stringify({
          tutorial: true,
          chosen: true,
          team: "Mach",
          mute: true,
        }),
      );
  });
  await p.goto(process.env.GAME_URL || "http://127.0.0.1:3000");
  await p.locator("[data-action=solo]").first().click();
  await p.locator("#nickname").fill("Moon racer");
  await p.locator("input[name=character][value=Ember]").check();
  await p.locator("#arcade-form button[type=submit]").click();
  await p.waitForFunction(() => MidnightArcadeUI.getState()?.paused === false);
  assert.equal(
    await p.evaluate(() => MidnightArcadeUI.getState().mode),
    "jump",
  );
  const until = Date.now() + 60000;
  while (Date.now() < until) {
    const s = await p.evaluate(() => {
      const s = MidnightArcadeUI.getState();
      return (
        s && {
          status: s.status,
          y: s.player.y,
          x: s.player.x,
          w: s.player.width,
          speed: s.speed,
          obstacle: s.obstacles.find(
            (o) => !o.passed && !o.hit && o.x + o.width > s.player.x,
          ),
        }
      );
    });
    if (s.status !== "playing") break;
    if (
      s.obstacle &&
      s.y === 0 &&
      s.obstacle.x < s.x + s.w - 14 + s.speed * 0.25
    )
      await p.keyboard.press("Space");
    await p.waitForTimeout(25);
  }
  await p.waitForSelector(".arcade-result");
  assert.equal(
    await p.evaluate(() => MidnightArcadeUI.getState().status),
    "won",
  );
  assert.equal(await p.locator("[data-arcade-result=harder]").count(), 1);
  await p.waitForTimeout(2800);
  assert.equal(await p.locator(".victory-trail").count(), 0);
  assert.equal(
    await p
      .locator(".victory-spirit")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await p.screenshot({ path: "/tmp/midnight-jump-win.png", fullPage: true });
  await p.locator("[data-arcade-result=journey]").click();
  assert.equal(await p.locator("#nickname").count(), 0);
  assert.equal(await p.locator("input[name=stage]").inputValue(), "0");
  await p.locator("#arcade-form button[type=submit]").click();
  await p.waitForFunction(() => MidnightArcadeUI.getState()?.paused === false);
  await p.screenshot({ path: "/tmp/midnight-maze.png", fullPage: true });
  const end = Date.now() + 60000;
  while (Date.now() < end) {
    const d = await p.evaluate(() => {
      const s = MidnightArcadeUI.getState();
      if (s.status !== "playing") return { status: s.status };
      const targets = s.candies.size
          ? [...s.candies].map((k) => k.split(",").map(Number))
          : [[s.exit.x, s.exit.y]],
        route = targets
          .map((t) => MidnightArcade.path(s.grid, [s.player.x, s.player.y], t))
          .sort((a, b) => a.length - b.length)[0];
      if (route.length < 2) return { status: s.status };
      const [x, y] = route[1];
      return {
        status: s.status,
        key:
          x > s.player.x
            ? "ArrowRight"
            : x < s.player.x
              ? "ArrowLeft"
              : y > s.player.y
                ? "ArrowDown"
                : "ArrowUp",
      };
    });
    if (d.status !== "playing") break;
    if (d.key) await p.keyboard.press(d.key);
    await p.waitForTimeout(30);
  }
  await p.waitForSelector(".arcade-result");
  assert.equal(
    await p.evaluate(() => MidnightArcadeUI.getState().status),
    "won",
  );
  const interval = await p.evaluate(
    () => MidnightArcadeUI.getState().enemyInterval,
  );
  await p.locator("[data-arcade-result=harder]").click();
  await p.waitForFunction(() => MidnightArcadeUI.getState()?.paused === false);
  assert.equal(
    await p.evaluate(() => MidnightArcadeUI.getState().difficulty),
    1,
  );
  assert.ok(
    (await p.evaluate(() => MidnightArcadeUI.getState().enemyInterval)) <
      interval,
  );
  await p.locator("[data-arcade=home]").click();
  await p.locator("[data-action=race-solo]").click();
  await p.locator('dialog [data-action=level][data-value="0"]').click();
  assert.equal(await p.locator("#nickname").count(), 0);
  assert.match(
    await p.locator(".nickname-summary").textContent(),
    /Moon racer/,
  );
  assert.equal(await p.evaluate(() => profile.arcadeUnlocked), 1);
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  assert.equal(errors.length, 0);
  console.log(
    JSON.stringify({
      jumpWinUsingSpace: true,
      mazeWinUsingArrows: true,
      harderSameStyle: true,
      journeySwitchesGames: true,
      nicknameOnlyOnce: true,
      victorySwirlStops: true,
      noOverflow: true,
      errors,
    }),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
