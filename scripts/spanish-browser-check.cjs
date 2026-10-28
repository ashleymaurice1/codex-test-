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
      if (!localStorage.getItem("midnight-profile"))
        localStorage.setItem(
          "midnight-profile",
          JSON.stringify({
            tutorial: true,
            chosen: true,
            name: "Moon racer",
            team: "Ember",
            coins: 350,
            mute: true,
          }),
        );
    });
    await p.goto("http://localhost:3000");
    await p.locator("[data-language]").selectOption("es");
    await p.waitForFunction(
      () =>
        document.documentElement.lang === "es" &&
        document.body.innerText.includes("Comenzar aventura"),
    );
    assert.match(
      await p.locator(".hero-copy").innerText(),
      /Tu aventura de Halloween/,
    );
    assert.equal(await p.evaluate(() => profile.coins), 350);
    await p.locator("[data-action=solo]").tap();
    assert.match(await p.locator("dialog").innerText(), /Saltos de luna/);
    assert.match(
      await p.locator(".journey-order").innerText(),
      /Saltos → Melodía → Laberinto → Carrera/,
    );
    await p.locator("#arcade-form button[type=submit]").tap();
    await p.waitForFunction(
      () => MidnightArcadeUI.getState()?.paused === false,
    );
    assert.equal(
      await p
        .locator("[data-arcade=jump]")
        .innerText()
        .then((s) => s.split("\n")[0]),
      "SALTAR",
    );
    assert.match(
      await p.locator(".arcade-instruction").innerText(),
      /Toca SALTAR/,
    );
    assert.equal(
      await p
        .locator("[data-arcade=jump]")
        .evaluate((e) => getComputedStyle(e).userSelect),
      "none",
    );
    await p.locator("[data-arcade=jump]").tap();
    await p.waitForFunction(() => MidnightArcadeUI.getState().player.y > 5);
    await p.locator("[data-arcade=pause]").first().tap();
    assert.match(await p.locator("#arcade-pause").innerText(), /descanso/);
    const distance = await p.evaluate(
      () => MidnightArcadeUI.getState().distance,
    );
    await p.locator("[data-language]").selectOption("en");
    await p.waitForFunction(
      () => document.querySelector("h1").innerText === "Moonlit Leap",
    );
    assert.equal(
      await p.evaluate(() => MidnightArcadeUI.getState().distance),
      distance,
    );
    await p.locator("[data-language]").selectOption("es");
    await p.waitForFunction(
      () => document.querySelector("h1").innerText === "Saltos de luna",
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(
      await p.evaluate(
        () => document.documentElement.scrollHeight > innerHeight + 2,
      ),
      false,
    );
    await p.screenshot({ path: "/tmp/ghost-spanish-jump.png" });
    await p.locator("[data-arcade=home]").tap();
    for (const action of [
      "shop",
      "player-settings",
      "highscores",
      "music-options",
    ]) {
      await p.locator(`[data-action=${action}]`).first().tap();
      await p.waitForTimeout(80);
      assert.ok(
        !(await p.locator("dialog").innerText()).includes("Your high scores"),
      );
      if (action === "player-settings")
        assert.equal(
          (await p.locator("#settings-name").count())
            ? await p.locator("#settings-name").inputValue()
            : await p.locator("dialog input").first().inputValue(),
          "Moon racer",
        );
      await p.locator("dialog [data-action=close]").tap();
    }
    await p.reload();
    await p.waitForFunction(
      () =>
        document.documentElement.lang === "es" &&
        document.body.innerText.includes("Comenzar aventura"),
    );
    assert.equal(await p.evaluate(() => profile.name), "Moon racer");
    assert.equal(await p.evaluate(() => profile.coins), 350);
    for (const mode of ["rhythm", "maze"]) {
      await p.locator("[data-action=quick]").tap();
      assert.deepEqual(
        await p
          .locator(".style-hub [data-value]")
          .evaluateAll((es) => es.map((e) => e.dataset.value)),
        ["jump", "rhythm", "maze"],
      );
      await p.locator(`dialog [data-value=${mode}]`).tap();
      assert.match(await p.locator("dialog").innerText(), /ELIGE TU PERSONAJE/);
      assert.match(
        await p.locator("select[name=difficulty]").innerText(),
        /Tranquilo/,
      );
      await p.locator("#arcade-form button[type=submit]").tap();
      await p.waitForFunction(
        () => MidnightArcadeUI.getState()?.paused === false,
      );
      await p.locator("[data-arcade=pause]").first().tap();
      assert.match(
        await p.locator("h1").innerText(),
        mode === "rhythm" ? /Melodía lunar/ : /Laberinto fantasmal/,
      );
      await p.locator("[data-arcade=home]").tap();
    }
    await p.locator("[data-action=race-solo]").tap();
    await p.locator('[data-action=level][data-value="0"]').tap();
    await p.locator("#play-form button[type=submit]").tap();
    await p.waitForSelector(".choices");
    await p.waitForFunction(() =>
      document.querySelector(".instruction").innerText.startsWith("Toca"),
    );
    assert.match(await p.locator(".round-meta").innerText(), /RONDA/);
    assert.equal(
      await p.evaluate(() =>
        instructions.every((s) => MidnightI18n.t(s) !== s),
      ),
      true,
    );
    await p.evaluate(() => {
      const f = document.createElement("div");
      f.id = "language-test-fixture";
      f.innerHTML =
        '<span class="room-code">JUMP</span><span data-i18n-skip>Jump</span>';
      document.body.append(f);
    });
    await p.waitForTimeout(80);
    assert.equal(
      await p.locator("#language-test-fixture .room-code").innerText(),
      "JUMP",
    );
    assert.equal(
      await p.locator("#language-test-fixture [data-i18n-skip]").innerText(),
      "Jump",
    );
    await p.goto("http://localhost:3000/music-credits.html");
    await p.waitForFunction(
      () => document.querySelector("h1").innerText === "Créditos musicales",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Spanish home, journey, touch jumping, maze, melody, shop/settings/records, credits, live English switch, saved language and unchanged player data: passed.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
