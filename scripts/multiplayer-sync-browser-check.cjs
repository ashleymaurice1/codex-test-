const { chromium, devices } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [],
    pages = [],
    contexts = [];
  let maxSpread = 0,
    compared = 0;
  try {
    for (let i = 0; i < 6; i++) {
      const context = await browser.newContext(
        i % 2
          ? { ...devices["iPhone 13"] }
          : { viewport: { width: 1440, height: 1000 } },
      );
      contexts.push(context);
      await context.addInitScript(
        ({ i }) => {
          localStorage.setItem(
            "midnight-profile",
            JSON.stringify({
              tutorial: true,
              chosen: true,
              mute: true,
              name: "Sync " + (i + 1),
              team: ["Mach", "Slink", "Ember", "Misty"][i % 4],
            }),
          );
          window.syncFrames = [];
          const Native = window.WebSocket;
          window.WebSocket = class extends Native {
            constructor(...args) {
              super(...args);
              this.addEventListener("message", (event) => {
                const data = JSON.parse(event.data);
                if (data.type === "state") {
                  syncFrames.push({
                    key: [data.now, data.phase, data.challenge?.id].join("/"),
                    data,
                    received: Date.now(),
                  });
                  if (syncFrames.length > 900) syncFrames.shift();
                }
              });
            }
          };
        },
        { i },
      );
      const p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      pages.push(p);
    }
    await Promise.all(
      pages.map((p) => p.goto(process.env.GAME_URL || "http://localhost:3000")),
    );
    const host = pages[0];
    await host.locator("[data-action=create]").click();
    await host.locator("#play-form button[type=submit]").click();
    await host.waitForSelector(".room-code");
    const code = (await host.locator(".room-code").textContent()).trim();
    for (const p of pages.slice(1)) {
      await p.locator("[data-action=join]").click();
      await p.locator("#room-code").fill(code);
      await p.locator("#play-form button[type=submit]").click();
      await p.waitForSelector("[data-action=ready]");
      await p.locator("[data-action=ready]").click();
    }
    await host.waitForFunction(
      () =>
        state.players.length === 6 &&
        state.players.filter((p) => p.ready).length === 5,
      null,
      { polling: 50 },
    );
    console.log("Six players joined and ready");
    await host.locator("[data-action=start]").click();
    await Promise.all(
      pages.map((p) =>
        p.waitForFunction(() => state?.phase === "countdown", null, {
          polling: 50,
        }),
      ),
    );
    const starts = await Promise.all(
      pages.map((p) => p.evaluate(() => state.started)),
    );
    assert.equal(new Set(starts).size, 1);
    await Promise.all(pages.map((p) => p.waitForSelector(".choices")));
    async function compareFrames() {
      const logs = await Promise.all(
        pages.map((p) => p.evaluate(() => syncFrames)),
      );
      const maps = logs.map((log) => new Map(log.map((f) => [f.key, f])));
      for (const f of maps[0].values()) {
        if (f.data.now > Date.now() - 250) continue;
        if (!maps.every((m) => m.has(f.key))) continue;
        const frames = maps.map((m) => m.get(f.key));
        for (const other of frames.slice(1))
          assert.deepEqual(other.data, f.data);
        maxSpread = Math.max(
          maxSpread,
          Math.max(...frames.map((f) => f.received)) -
            Math.min(...frames.map((f) => f.received)),
        );
        compared++;
      }
    }
    await host.waitForTimeout(500);
    await compareFrames();
    assert.ok(compared >= 3);
    let rounds = 0,
      last = null;
    const deadline = Date.now() + 100000;
    while (Date.now() < deadline) {
      const data = await host.evaluate(() => ({
        phase: state.phase,
        c: state.challenge,
        now: Date.now() + offset,
      }));
      if (data.phase === "finished") break;
      if (!data.c || data.c.id === last) {
        await host.waitForTimeout(80);
        continue;
      }
      const id = data.c.id;
      await Promise.all(
        pages.map((p) =>
          p.waitForFunction((id) => state.challenge?.id === id, id, {
            polling: 50,
          }),
        ),
      );
      const panels = await Promise.all(
        pages.map((p) =>
          p.evaluate(() => ({
            instruction: document.querySelector(".race-panel .instruction")
              ?.textContent,
            choices: [...document.querySelectorAll(".choices button")].map(
              (b) =>
                state.challenge.kind === 2
                  ? "candle"
                  : b.getAttribute("aria-label"),
            ),
            rankedNames: [...document.querySelectorAll(".hud-player")].map(
              (el) => el.title,
            ),
          })),
        ),
      );
      for (const panel of panels.slice(1)) assert.deepEqual(panel, panels[0]);
      if (rounds === 1) {
        await pages[5].reload();
        await pages[5].waitForSelector(".choices");
        assert.equal(await pages[5].evaluate(() => me().name), "Sync 6");
        assert.equal(await pages[5].evaluate(() => state.challenge.id), id);
      }
      const c = data.c;
      const target =
        c.target ||
        {
          0: "pumpkin",
          6: "moon",
          7: "potion-blue",
          8: "spider",
          9: "ghost",
          10: "lantern-lit",
          11: "candy-corn",
        }[c.kind];
      const correct =
        c.kind === 4
          ? c.choices.indexOf(Math.max(...c.choices))
          : c.kind === 3
            ? c.still
            : c.kind === 5
              ? c.choices.indexOf("ghost-odd")
              : target
                ? c.choices.indexOf(target)
                : 0;
      assert.ok(correct >= 0);
      const wrong = c.choices.findIndex((v, i) =>
        c.kind === 0 ? v !== "pumpkin" : i !== correct,
      );
      await Promise.all(
        pages.map(async (p, i) => {
          const index =
            i === 0 || rounds % 3 === 0 || wrong < 0 ? correct : wrong;
          await p.waitForFunction(
            ({ id }) =>
              state.phase === "finished" ||
              (state.challenge?.id === id &&
                me().blockedUntil <= Date.now() + offset &&
                Date.now() + offset >=
                  (state.challenge.extinguish || state.challenge.opens)),
            { id },
            { polling: 50 },
          );
          await p.evaluate(
            ({ id, index }) => {
              if (state.phase === "race" && state.challenge.id === id)
                transmit({ type: "answer", id, index });
            },
            { id, index },
          );
        }),
      );
      await host.waitForTimeout(120);
      await compareFrames();
      rounds++;
      last = id;
      console.log("Compared round " + rounds);
    }
    await Promise.all(pages.map((p) => p.waitForSelector(".result")));
    const results = await Promise.all(
      pages.map((p) =>
        p.evaluate(() => ({
          phase: state.phase,
          ended: state.finishedAt,
          winner: state.players[0].id,
          order: state.players.map((p) => [
            p.id,
            p.place,
            p.progress,
            p.correct,
          ]),
          podium: [...document.querySelectorAll(".podium-place>span")].map(
            (el) => el.textContent,
          ),
        })),
      ),
    );
    for (const r of results.slice(1)) assert.deepEqual(r, results[0]);
    assert.equal(await host.evaluate(() => state.players[0].id === myId), true);
    await compareFrames();
    await host.locator("[data-action=leave]").click();
    await Promise.all(
      pages
        .slice(1)
        .map((p) =>
          p.waitForFunction(
            () =>
              state.host !== state.players.find((p) => p.name === "Sync 1").id,
          ),
        ),
    );
    const hosts = await Promise.all(
      pages.slice(1).map((p) => p.evaluate(() => state.host)),
    );
    assert.equal(new Set(hosts).size, 1);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        players: 6,
        desktopAndPhone: true,
        sharedStartTimestamp: starts[0],
        identicalBroadcastComparisons: compared,
        maxObservedLocalDeliverySpreadMs: maxSpread,
        roundsChecked: rounds,
        identicalChallengeTextAndChoices: true,
        livePositionsAndRanking: true,
        refreshRejoin: true,
        sameWinnerAndPodium: true,
        hostMigration: true,
        errors,
      }),
    );
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
