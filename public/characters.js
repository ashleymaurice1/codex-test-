/* Living poses animate the anatomy and expressions, rather than rotating a still picture. */
(function (root) {
  const cache = new Map(),
    nodes = new Set();
  let dirty = true;
  const idle = [0, 2, 5, 2, 0, 1, 0, 5];
  function load(team) {
    if (!cache.has(team))
      cache.set(
        team,
        new Promise((resolve, reject) => {
          const i = new Image();
          i.onload = () => {
            i.animationSheet = true;
            i.team = team;
            resolve(i);
          };
          i.onerror = reject;
          i.src = `/assets/characters/${team.toLowerCase()}-poses.webp`;
        }),
      );
    return cache.get(team);
  }
  function frames(team, time, mood = "idle") {
    if (mood === "sad") return { a: 4, b: 4, t: 0 };
    if (mood === "proud") {
      const p = (time + team.length * 0.37) % 5.2;
      return p < 0.24 ? { a: 1, b: 3, t: p / 0.24 } : { a: 3, b: 3, t: 0 };
    }
    const cycle = team === "Mach" ? [2, 5, 2, 1, 2, 5] : idle;
    const pos = (time + team.length * 0.21) / 0.33,
      at = Math.floor(pos) % cycle.length,
      t = pos % 1;
    return {
      a: cycle[at],
      b: cycle[(at + 1) % cycle.length],
      t: t * t * (3 - 2 * t),
    };
  }
  function markup(team) {
    return `<span class="ghost-animation" data-character="${team}" aria-hidden="true"><span class="ghost-pose pose-a"></span><span class="ghost-pose pose-b"></span></span>`;
  }
  function position(index) {
    return `${(index % 3) * 50}% ${Math.floor(index / 3) * 100}%`;
  }
  function scan() {
    document.querySelectorAll(".ghost-animation").forEach((el) => {
      if (nodes.has(el) || el.closest(".home-shell")) return;
      nodes.add(el);
      load(el.dataset.character)
        .then((img) => {
          if (!el.isConnected) return;
          el.querySelectorAll(".ghost-pose").forEach(
            (p) => (p.style.backgroundImage = `url("${img.src}")`),
          );
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
  }
  new MutationObserver(() => (dirty = true)).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  requestAnimationFrame(tick);
  root.MidnightCharacters = { load, markup, frames, draw };
})(globalThis);
