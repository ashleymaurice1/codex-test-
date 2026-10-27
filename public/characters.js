/* Fixed body poses, localized gentle blinks, and distinct result expressions. */
(function (root) {
  const cache = new Map(),
    nodes = new Set();
  let dirty = true;
  const eyeRig = {
    Mach: [{ to: [424, 152, 48, 44], from: [944, 203, 48, 44] }],
    Slink: [{ to: [410, 140, 48, 44], from: [944, 216, 48, 44] }],
    Ember: [
      { to: [418, 159, 34, 28], from: [938, 160, 34, 28] },
      { to: [460, 160, 16, 20], from: [974, 160, 16, 20] },
    ],
    Misty: [
      { to: [294, 193, 50, 50], from: [798, 226, 50, 46] },
      { to: [352, 220, 48, 48], from: [876, 251, 48, 46] },
    ],
  };
  function blinkAt(team, time) {
    const p =
      (time + { Mach: 0, Slink: 1.8, Ember: 3.1, Misty: 4.4 }[team]) % 7.2;
    if (p < 6.68) return 0;
    const t = (p - 6.68) / 0.52;
    return Math.sin(Math.PI * t) ** 2;
  }
  function prepareEyes(img) {
    img.eyePatches = (eyeRig[img.team] || []).map((r) => {
      const patch = document.createElement("canvas");
      patch.width = 64;
      patch.height = 64;
      const c = patch.getContext("2d");
      c.drawImage(img, ...r.from, 0, 0, 64, 64);
      c.globalCompositeOperation = "destination-in";
      const g = c.createRadialGradient(32, 32, 19, 32, 32, 32);
      g.addColorStop(0, "#000");
      g.addColorStop(1, "#0000");
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      return { patch, to: r.to };
    });
  }
  function drawEyes(c, img, x, y, size, time, alpha = 1) {
    const blink = blinkAt(img.team, time);
    if (!blink || !img.eyePatches) return;
    c.save();
    c.globalAlpha = alpha * blink;
    for (const { patch, to } of img.eyePatches)
      c.drawImage(
        patch,
        x + (to[0] / 512) * size,
        y + (to[1] / 512) * size,
        (to[2] / 512) * size,
        (to[3] / 512) * size,
      );
    c.restore();
  }
  function load(team) {
    if (!cache.has(team))
      cache.set(
        team,
        new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => {
            i.animationSheet = true;
            i.team = team;
            prepareEyes(i);
            resolve(i);
          };
          i.onerror = reject;
          i.src = `/assets/characters/${team.toLowerCase()}-poses.webp`;
        }),
      );
    return cache.get(team);
  }
  function frames(team, time, mood = "idle") {
    // Atlas poses are separate illustrations, not registered animation frames.
    // Hold the appropriate expression; crossfading their silhouettes causes jitter.
    const pose = mood === "sad" ? 4 : mood === "proud" ? 3 : 5;
    return { a: pose, b: pose, t: 0 };
  }
  function markup(team) {
    return `<span class="ghost-animation" data-character="${team}" aria-hidden="true"><span class="ghost-pose pose-a"></span><span class="ghost-pose pose-b"></span></span>`;
  }
  function position(index) {
    return `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`;
  }
  function scan() {
    document.querySelectorAll(".ghost-animation").forEach((el) => {
      if (nodes.has(el)) return;
      nodes.add(el);
      load(el.dataset.character)
        .then((img) => {
          if (!el.isConnected) return;
          el.querySelectorAll(".ghost-pose").forEach((p, index) => {
            p.style.backgroundImage = `url("${img.src}")`;
            p.style.backgroundPosition = position(5);
            p.style.opacity = index === 0 ? 1 : 0;
          });
          const face = document.createElement("canvas");
          face.className = "face-motion";
          face.width = 512;
          face.height = 512;
          el.append(face);
          el.faceImage = img;
          el.dataset.ready = "true";
          el.parentElement.classList.add("character-alive");
        })
        .catch(() => {});
    });
    dirty = false;
  }
  function tick(now) {
    if (dirty) scan();
    for (const el of nodes) {
      if (!el.isConnected) {
        nodes.delete(el);
        continue;
      }
      if (!el.dataset.ready) continue;
      const mood = el.closest(".podium-disappointed,.character-sad,.broken")
        ? "sad"
        : el.closest(".winner-proud,.podium-proud")
          ? "proud"
          : "idle";
      const f = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? frames(el.dataset.character, 0, mood === "idle" ? "proud" : mood)
        : frames(el.dataset.character, now / 1000, mood);
      const a = el.children[0],
        b = el.children[1];
      a.style.backgroundPosition = position(f.a);
      b.style.backgroundPosition = position(f.b);
      a.style.opacity = 1 - f.t;
      b.style.opacity = f.t;
      const face = el.querySelector(".face-motion"),
        c = face?.getContext("2d");
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (c) {
        c.clearRect(0, 0, 512, 512);
        if (mood === "idle" && !reduced)
          drawEyes(c, el.faceImage, 0, 0, 512, now / 1000);
      }
    }
    requestAnimationFrame(tick);
  }
  function draw(
    c,
    img,
    x,
    y,
    w,
    h,
    alpha = 1,
    time = performance.now() / 1000,
    mood = "idle",
  ) {
    if (!img.animationSheet) {
      c.globalAlpha = alpha;
      c.drawImage(img, x, y, w, h);
      return;
    }
    const f = frames(img.team, time, mood),
      fw = img.naturalWidth / 3,
      fh = img.naturalHeight / 2,
      size = Math.max(w, h) * 0.92,
      dx = x + (w - size) / 2,
      dy = y + (h - size) / 2;
    for (const [index, opacity] of [
      [f.a, 1 - f.t],
      [f.b, f.t],
    ]) {
      if (!opacity) continue;
      c.globalAlpha = alpha * opacity;
      c.drawImage(
        img,
        (index % 3) * fw,
        Math.floor(index / 3) * fh,
        fw,
        fh,
        dx,
        dy,
        size,
        size,
      );
    }
    if (
      mood === "idle" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      drawEyes(c, img, dx, dy, size, time, alpha);
  }
  new MutationObserver(() => (dirty = true)).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  requestAnimationFrame(tick);
  root.MidnightCharacters = { load, markup, frames, draw, blinkAt };
})(globalThis);
