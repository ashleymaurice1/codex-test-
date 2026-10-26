const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const contexts = await Promise.all([
    b.newContext({ viewport: { width: 1440, height: 1000 } }),
    b.newContext({ viewport: { width: 390, height: 844 } }),
  ]);
  for (const c of contexts)
    await c.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({ tutorial: true, chosen: true, team: "Mach" }),
        );
    });
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  const [a, z] = pages;
  const errors = [];
  pages.forEach((p) => p.on("pageerror", (e) => errors.push(e.message)));
  await Promise.all(
    pages.map((p) => p.goto(process.env.GAME_URL || "http://127.0.0.1:3000")),
  );
  await a.locator("[data-action=create]").click();
  await a.locator("#nickname").fill("Host");
  await a.locator("#play-form button[type=submit]").click();
  await a.waitForSelector(".room-code");
  const code = await a.locator(".room-code").textContent();
  await z.locator("[data-action=join]").click();
  await z.locator("#nickname").fill("Phone friend");
  await z.locator("#room-code").fill(code);
  await z.locator("#play-form button[type=submit]").click();
  await z.waitForSelector("[data-action=ready]");
  await z.locator("[data-action=ready]").click();
  await a.waitForFunction(() =>
    state.players.some((p) => p.name === "Phone friend" && p.ready),
  );
  await a.locator("[data-action=start]").click();
  await Promise.all(pages.map((p) => p.waitForSelector(".choices")));
  assert.equal(
    await a.evaluate(() => state.challenge.id),
    await z.evaluate(() => state.challenge.id),
  );
  await z.reload();
  await z.waitForSelector(".choices");
  assert.equal(await z.evaluate(() => me().name), "Phone friend");
  await a.locator("[data-action=leave]").click();
  await z.waitForFunction(() => state.host === myId);
  assert.equal(errors.length, 0);
  console.log(
    JSON.stringify({
      browserRoom: true,
      sharedChallenge: true,
      refreshRejoin: true,
      hostMigration: true,
      errors,
    }),
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
