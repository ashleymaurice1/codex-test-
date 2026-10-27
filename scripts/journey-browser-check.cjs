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
    await p.addInitScript(() => {
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({
            tutorial: true,
            chosen: true,
            name: "Journey ghost",
            mute: true,
            journeyStep: 2,
          }),
        );
    });
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=solo]").click();
    assert.match(
      await p.locator(".journey-order").innerText(),
      /Moonlight Melody/,
    );
    await p.locator("#arcade-form button[type=submit]").click();
    await p.waitForFunction(() => MidnightArcadeUI.getState()?.ready);
    const until = Date.now() + 100000;
    while (Date.now() < until) {
      const n = await p.evaluate(() => {
        const s = MidnightArcadeUI.getState();
        if (s.status !== "playing") return null;
        const n = s.notes.find((n) => n.status === "pending");
        return n
          ? { key: s.keys[n.lane], wait: n.time - MidnightMusic.clock().time }
          : null;
      });
      if (!n) break;
      if (n.wait < 0.06 && n.wait > -0.15) await p.keyboard.press(n.key);
      await p.waitForTimeout(15);
    }
    await p.waitForSelector(".arcade-result");
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().status),
      "won",
    );
    assert.equal(await p.evaluate(() => profile.journeyStep), 3);
    await p.locator("[data-arcade-result=journey]").click();
    assert.equal(await p.locator("#nickname").count(), 0);
    await p.locator("#play-form button[type=submit]").click();
    await p.waitForSelector(".choices");
    let answered;
    const end = Date.now() + 35000;
    while (Date.now() < end) {
      if (await p.locator(".result").count()) break;
      const d = await p.evaluate(() => ({
        id: state.challenge.id,
        kind: state.challenge.kind,
        choices: state.challenge.choices,
      }));
      if (d.id !== answered) {
        const good = { 0: "pumpkin", 6: "moon", 7: "potion-blue", 9: "ghost" }[
          d.kind
        ];
        await p
          .locator(
            `[data-action=answer][data-value="${d.choices.indexOf(good)}"]`,
          )
          .click();
        answered = d.id;
      }
      await p.waitForTimeout(100);
    }
    await p.waitForSelector(".result");
    assert.equal(await p.evaluate(() => profile.journeyStep), 4);
    await p.locator("[data-action=journey-next]").click();
    assert.equal(await p.locator("input[name=stage]").inputValue(), "1");
    assert.match(
      await p.locator(".journey-order").innerText(),
      /Chapter 2\/5.*Moonlit Leap/,
    );
    await p.reload();
    await p.locator("[data-action=solo]").click();
    assert.equal(await p.locator("input[name=stage]").inputValue(), "1");
    assert.deepEqual(errors, []);
    console.log(
      "Journey rhythm → tap race → next chapter Jump, saved progress, nickname reused: passed",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
