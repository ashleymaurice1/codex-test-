const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const p = await b.newPage();
    await p.addInitScript(() =>
      localStorage.setItem(
        "midnight-profile",
        '{"tutorial":true,"chosen":true,"mute":true}',
      ),
    );
    await p.goto("http://localhost:3000");
    await p.locator("[data-action=quick]").click();
    await p.locator("dialog [data-value=rhythm]").click();
    await p.waitForFunction(
      () => document.querySelectorAll("dialog .face-motion").length === 4,
    );
    const seen = new Set();
    let first;
    for (let i = 0; i < 82; i++) {
      const data = await p
        .locator("dialog .ghost-animation")
        .evaluateAll((es) =>
          es.map((e) => {
            const c = e.querySelector("canvas"),
              pixels = c.getContext("2d").getImageData(0, 0, 512, 512).data;
            let count = 0;
            for (let j = 3; j < pixels.length; j += 4) if (pixels[j]) count++;
            return {
              team: e.dataset.character,
              pose: e.children[0].style.backgroundPosition,
              count,
            };
          }),
        );
      if (!first) first = data.map((x) => x.pose);
      assert.deepEqual(
        data.map((x) => x.pose),
        first,
      );
      for (const d of data) {
        assert.ok(d.count < 512 * 512 * 0.03);
        if (d.count) seen.add(d.team);
      }
      await p.waitForTimeout(100);
    }
    assert.equal(seen.size, 4);
    console.log(
      "Four subtle facial blinks; body poses unchanged; changes confined to <3% of portrait pixels",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
