(function (root) {
  let current = null,
    abort = null,
    frame = null,
    images = {},
    last = 0,
    rewarded = false,
    lastDisplay = "",
    hint = "";
  const titles = { maze: "Ghostlight Maze", jump: "Moonlit Leap" };
  const tips = {
    maze: "Collect every candy, then reach the glowing house. Arrows / WASD, swipe, or use the arrows below.",
    jump: "Jump over the obstacles. Press Space / ↑ or tap JUMP once per jump.",
  };
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    if (abort) abort.abort();
    abort = null;
    current = null;
  }
  function image(url) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
  }
  function sync() {
    if (!current) return;
    if (
      profile.totalScore !== current.totalScore ||
      profile.extraLives !== current.reserveLives
    ) {
      profile.totalScore = current.totalScore;
      profile.extraLives = current.reserveLives;
      save();
    }
  }
  function launch(mode, stage = 0, difficulty = 0) {
    stop();
    MidnightVictory.stop();
    view = "arcade";
    state = null;
    myId = null;
    sessionStorage.removeItem("midnight-session");
    if (ws) {
      transmit({ type: "leave" });
      ws.close();
      ws = null;
    }
    clearTimeout(reconnect);
    current =
      mode === "maze"
        ? MidnightArcade.createMaze(stage, profile, difficulty)
        : MidnightArcade.createJump(stage, profile, difficulty);
    current.paused = true;
    MidnightMusic.setScene(mode);
    rewarded = false;
    lastDisplay = "";
    hint = "Gathering a little moonlight…";
    abort = new AbortController();
    const signal = abort.signal;
    document.getElementById("app").innerHTML =
      `<div class="game-shell arcade-shell">${header()}<div class="race-top"><button class="text-btn" data-arcade="home">← Home</button><span>LEVEL ${stage + 1} · ${["CHILL", "SPOOKY", "FIENDISH"][difficulty]}</span><button class="text-btn" data-arcade="pause">Pause Ⅱ</button></div><main><div class="arcade-heading"><div><span class="eyebrow">${esc(profile.name || "Grave guest")} · ${profile.team}</span><h1>${titles[mode]}</h1></div>${ghost(profile.team)}</div><p class="arcade-instruction">${tips[mode]}</p><div class="arcade-stats" id="arcade-stats"></div><div class="arcade-board-wrap"><canvas id="arcade-board" class="arcade-board ${mode === "maze" ? "maze-board" : "jump-board"}" width="${mode === "maze" ? 544 : 900}" height="${mode === "maze" ? 480 : 540}" tabindex="0" aria-label="${titles[mode]} game board. ${tips[mode]}"></canvas><div class="arcade-pause" id="arcade-pause"><h2>Gathering moonlight…</h2></div></div><div class="arcade-hint" id="arcade-hint" role="status" aria-live="polite">${hint}</div>${mode === "maze" ? '<div class="maze-controls" aria-label="Maze direction controls"><button data-dir="up" aria-label="Move up">↑</button><button data-dir="left" aria-label="Move left">←</button><button data-arcade="pause" aria-label="Pause to plan your route">Ⅱ</button><button data-dir="right" aria-label="Move right">→</button><button data-dir="down" aria-label="Move down">↓</button></div>' : '<button class="jump-control" data-arcade="jump">JUMP <small>SPACE / ↑</small></button>'}<p class="arcade-footer-note">Three hearts · spare lives save your glow · +1 life every 500 score</p></main></div>`;
    const canvas = document.getElementById("arcade-board");
    let down = null;
    document.querySelectorAll("[data-dir]").forEach((b) =>
      b.addEventListener(
        "pointerdown",
        (e) => {
          e.preventDefault();
          MidnightArcade.turnMaze(current, b.dataset.dir);
        },
        { signal },
      ),
    );
    document.querySelectorAll("[data-arcade]").forEach((b) =>
      b.addEventListener(
        "click",
        () => {
          const a = b.dataset.arcade;
          if (a === "home") {
            stop();
            home();
          } else if (a === "pause") pause();
          else if (a === "jump" && current) MidnightArcade.jump(current);
        },
        { signal },
      ),
    );
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        down = { x: e.clientX, y: e.clientY };
        if (mode === "jump") MidnightArcade.jump(current);
      },
      { signal },
    );
    canvas.addEventListener(
      "pointerup",
      (e) => {
        if (mode !== "maze" || !down || !current) return;
        const dx = e.clientX - down.x,
          dy = e.clientY - down.y;
        if (Math.hypot(dx, dy) > 10)
          MidnightArcade.turnMaze(
            current,
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
                ? "down"
                : "up",
          );
        down = null;
      },
      { signal },
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (!current || e.target.matches("input,select,textarea")) return;
        if (e.target.matches("button") && e.code === "Space") return;
        const map = {
          ArrowUp: "up",
          w: "up",
          W: "up",
          ArrowDown: "down",
          s: "down",
          S: "down",
          ArrowLeft: "left",
          a: "left",
          A: "left",
          ArrowRight: "right",
          d: "right",
          D: "right",
        };
        if (e.code === "Space" || e.key.startsWith("Arrow")) e.preventDefault();
        if (e.key === "Escape") {
          pause();
          return;
        }
        if (mode === "maze" && map[e.key])
          MidnightArcade.turnMaze(current, map[e.key]);
        else if (
          mode === "jump" &&
          (e.code === "Space" || e.key === "ArrowUp") &&
          !e.repeat
        )
          MidnightArcade.jump(current);
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && current && !current.paused) pause();
      },
      { signal },
    );
    const owner = current;
    Promise.all([
      image(`/assets/characters/${profile.team.toLowerCase()}.webp`),
      image("/assets/moonlit-woodland.webp"),
      image("/assets/arcade/witch.webp"),
      image("/assets/arcade/zombie.webp"),
    ])
      .then(([player, forest, witch, zombie]) => {
        if (current !== owner) return;
        images = { player, forest, witch, zombie };
        current.paused = false;
        hint =
          mode === "maze"
            ? "Follow the candy glow. The house opens when you have them all."
            : "Watch the first obstacle. One well-timed jump—you’ve got this!";
        document.getElementById("arcade-pause").classList.add("hide");
        last = performance.now();
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (current !== owner) return;
        document.getElementById("arcade-pause").innerHTML =
          "<h2>The moonlight is taking a moment.</h2><p>Return home and try again to load the artwork.</p>";
      });
    updateStats();
  }
  function pause() {
    if (!current || current.status !== "playing") return;
    current.paused = !current.paused;
    const layer = document.getElementById("arcade-pause");
    layer.classList.toggle("hide", !current.paused);
    document.querySelectorAll('[data-arcade="pause"]').forEach((b) => {
      b.setAttribute("aria-pressed", String(current.paused));
      b.textContent = b.classList.contains("text-btn")
        ? current.paused
          ? "Resume ▶"
          : "Pause Ⅱ"
        : current.paused
          ? "▶"
          : "Ⅱ";
    });
    layer.innerHTML =
      "<h2>A little moonlit breather.</h2><p>Tap Pause again, or press Escape, to continue.</p>";
  }
  function updateStats() {
    if (!current) return;
    const s = current,
      key = [s.lives, s.reserveLives, s.totalScore, s.collected, s.passed].join(
        "/",
      );
    if (key === lastDisplay) return;
    lastDisplay = key;
    document.getElementById("arcade-stats").innerHTML =
      `<span class="hearts" aria-label="${s.lives} hearts remaining">${"♥".repeat(s.lives)}<i>${"♡".repeat(3 - s.lives)}</i></span><span>${s.mode === "maze" ? `Candy ${s.collected}/${s.target}` : `Obstacles ${s.passed}/${s.target}`}<small>Level ${s.stage + 1}</small></span><span>Score ${s.totalScore}<small>♥ ${s.reserveLives} spare · ${500 - (s.totalScore % 500)} to bonus</small></span>`;
  }
  function sprite(c, img, x, y, w, h, alpha = 1) {
    if (!img) return;
    c.save();
    c.globalAlpha = alpha;
    c.shadowColor = colors[profile.team];
    c.shadowBlur = 9;
    c.drawImage(img, x, y, w, h);
    c.restore();
  }
  function forest(c, w, h) {
    c.clearRect(0, 0, w, h);
    c.drawImage(images.forest, 0, 0, w, h);
    c.fillStyle = current.mode === "maze" ? "#071323dd" : "#07132333";
    c.fillRect(0, 0, w, h);
  }
  function drawMaze(c) {
    const s = current,
      tile = 32;
    forest(c, 544, 480);
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) {
        if (s.grid[y][x]) {
          c.fillStyle = "#173449";
          c.strokeStyle = "#4c8db766";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2, 7);
          c.fill();
          c.stroke();
          if ((x * 7 + y * 11) % 9 === 0) {
            c.fillStyle = "#83ccff";
            c.shadowColor = "#83ccff";
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(x * tile + 8, y * tile + 8, 2, 0, 7);
            c.fill();
            c.shadowBlur = 0;
          }
        }
      }
    for (const key of s.candies) {
      const [x, y] = key.split(",").map(Number);
      c.save();
      c.translate(x * tile + 16, y * tile + 16);
      c.rotate(Math.PI / 4);
      c.fillStyle = "#f1b65e";
      c.shadowColor = "#f1b65e";
      c.shadowBlur = 8;
      c.fillRect(-4, -4, 8, 8);
      c.restore();
    }
    const ex = s.exit.x * tile,
      ey = s.exit.y * tile;
    c.fillStyle = s.candies.size ? "#62758c" : "#efb565";
    c.shadowColor = c.fillStyle;
    c.shadowBlur = s.candies.size ? 0 : 15;
    c.beginPath();
    c.moveTo(ex + 3, ey + 13);
    c.lineTo(ex + 16, ey + 2);
    c.lineTo(ex + 29, ey + 13);
    c.closePath();
    c.fill();
    c.fillRect(ex + 7, ey + 13, 18, 17);
    c.fillStyle = "#233044";
    c.fillRect(ex + 14, ey + 19, 5, 11);
    c.shadowBlur = 0;
    for (const e of s.enemies) {
      if (e.kind === "spider") {
        c.fillStyle = "#b39bcc";
        c.beginPath();
        c.ellipse(e.x * 32 + 16, e.y * 32 + 17, 9, 7, 0, 0, 7);
        c.fill();
        c.strokeStyle = "#b39bcc";
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo(e.x * 32 + 9, e.y * 32 + 15 + i * 4);
          c.lineTo(e.x * 32 + 2, e.y * 32 + 12 + i * 7);
          c.moveTo(e.x * 32 + 23, e.y * 32 + 15 + i * 4);
          c.lineTo(e.x * 32 + 30, e.y * 32 + 12 + i * 7);
          c.stroke();
        }
      } else
        sprite(c, images[e.kind], e.x * 32 - 7, e.y * 32 - 4, 46, 38, 0.95);
    }
    sprite(
      c,
      images.player,
      s.player.x * 32 - 8,
      s.player.y * 32 - 3,
      48,
      38,
      s.invulnerable > 0 && Math.floor(s.elapsed * 8) % 2 ? 0.4 : 1,
    );
  }
  function drawJump(c) {
    const s = current,
      w = s.width,
      h = s.height;
    forest(c, w, h);
    c.fillStyle = "#102132";
    c.fillRect(0, s.ground, w, h - s.ground);
    c.strokeStyle = "#75b8dc";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, s.ground);
    c.lineTo(w, s.ground);
    c.stroke();
    for (let i = 0; i < 14; i++) {
      const x = (((i * 83 - s.distance * 0.2) % w) + w) % w;
      c.fillStyle = i % 2 ? "#90d3ff" : "#e9b067";
      c.shadowColor = c.fillStyle;
      c.shadowBlur = 9;
      c.beginPath();
      c.arc(x, s.ground + 20 + ((i * 17) % 80), 3, 0, 7);
      c.fill();
    }
    c.shadowBlur = 0;
    sprite(
      c,
      images.witch,
      665 + Math.sin(s.elapsed * 0.3) * 70,
      45 + Math.sin(s.elapsed * 0.7) * 14,
      165,
      110,
      0.75,
    );
    sprite(c, images.zombie, 30 - s.distance * 0.08, 330, 110, 85, 0.38);
    for (const o of s.obstacles) {
      const y = s.ground - o.height;
      if (o.kind === "pumpkin") {
        c.fillStyle = "#dd913c";
        c.beginPath();
        c.ellipse(
          o.x + o.width / 2,
          y + o.height * 0.58,
          o.width * 0.65,
          o.height * 0.43,
          0,
          0,
          7,
        );
        c.fill();
        c.fillStyle = "#21323c";
        c.fillRect(o.x + o.width * 0.22, y + o.height * 0.43, 6, 7);
        c.fillRect(o.x + o.width * 0.61, y + o.height * 0.43, 6, 7);
        c.strokeStyle = "#769955";
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(o.x + o.width / 2, y + o.height * 0.22);
        c.lineTo(o.x + o.width * 0.65, y - 3);
        c.stroke();
      } else if (o.kind === "tombstone") {
        c.fillStyle = "#7990a6";
        c.beginPath();
        c.roundRect(o.x, y, o.width, o.height, [13, 13, 2, 2]);
        c.fill();
        c.strokeStyle = "#3c5268";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(o.x + o.width / 2, y + 12);
        c.lineTo(o.x + o.width / 2, y + o.height * 0.7);
        c.moveTo(o.x + 7, y + 25);
        c.lineTo(o.x + o.width - 7, y + 25);
        c.stroke();
      } else {
        c.fillStyle = "#654f49";
        c.beginPath();
        c.moveTo(o.x - 7, s.ground);
        c.lineTo(o.x + o.width * 0.2, y + 15);
        c.lineTo(o.x + o.width * 0.5, y);
        c.lineTo(o.x + o.width * 0.7, y + 20);
        c.lineTo(o.x + o.width + 8, s.ground);
        c.closePath();
        c.fill();
        c.strokeStyle = "#a7c8d8";
        c.lineWidth = 2;
        c.stroke();
      }
    }
    sprite(
      c,
      images.player,
      s.player.x - 28,
      s.ground - s.player.y - s.player.height - 15,
      130,
      85,
      s.invulnerable > 0 && Math.floor(s.elapsed * 8) % 2 ? 0.4 : 1,
    );
    if (s.elapsed < 4) {
      c.fillStyle = "#ddeaff";
      c.font = "18px sans-serif";
      c.fillText(
        "Get ready… jump just before an obstacle reaches you.",
        45,
        45,
      );
    }
  }
  function tick(now) {
    if (!current) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const c = document.getElementById("arcade-board")?.getContext("2d");
    if (!c) return;
    if (current.mode === "maze") {
      MidnightArcade.stepMaze(current, dt);
      drawMaze(c);
    } else {
      MidnightArcade.stepJump(current, dt);
      drawJump(c);
    }
    for (const e of current.events.splice(0)) {
      if (e.type === "bonus-life")
        hint = "500 score—an extra life! Spellbinding!";
      else if (e.type === "saved") hint = "A spare life saved your glow!";
      else if (e.type === "hit")
        hint =
          current.status === "lost"
            ? "Time for another midnight."
            : "A little wobble. You’ve got this!";
      else if (e.type === "candy")
        hint = current.candies.size
          ? [
              "Boo-tiful! Follow the next glow.",
              "A-maze-ing move!",
              "That’s the spirit!",
            ][current.collected % 3]
          : "All candy collected! Follow the glowing house.";
      else if (e.type === "clear")
        hint = [
          "Spooktacular jump!",
          "Boo-tiful timing!",
          "That’s the spirit!",
        ][current.passed % 3];
    }
    sync();
    updateStats();
    document.getElementById("arcade-hint").textContent = hint;
    if (current.status !== "playing") {
      result();
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function result() {
    if (!current || rewarded) return;
    rewarded = true;
    const s = current,
      won = s.status === "won";
    sync();
    if (won) {
      profile.coins += 45 + s.stage * 10 + s.lives * 5;
      profile.points += 15 + s.stage * 5;
      profile.arcadeUnlocked = Math.max(
        profile.arcadeUnlocked || 0,
        Math.min(4, s.stage + 1),
      );
      profile.arcadeLevel = Math.min(4, s.stage + 1);
      profile.unlockedLevel = Math.max(
        profile.unlockedLevel || 0,
        Math.min(3, s.stage + 1),
      );
      profile.arcadeMedals ??= { maze: [], jump: [] };
      profile.arcadeMedals[s.mode][s.stage] = Math.max(
        profile.arcadeMedals[s.mode][s.stage] || 0,
        s.lives,
      );
      save();
    }
    if (abort) abort.abort();
    abort = null;
    document.getElementById("app").innerHTML =
      `<div class="game-shell">${header()}<main class="result arcade-result"><div class="eyebrow" style="justify-content:center">${titles[s.mode]} · LEVEL ${s.stage + 1}</div>${ghost(s.team, "victory-spirit")}<h1>${won ? (s.mode === "maze" ? "A-maze-ing!" : "A leap of moonlight!") : "Out of glow!"}</h1><p class="muted">${won ? "A well-earned win. Your ghost looks rather proud." : "Three fresh hearts are waiting on your next try."}</p><div class="result-rewards"><div>◈ ${won ? "+" + (45 + s.stage * 10 + s.lives * 5) : "0"}<small>COINS</small></div><div>+${s.runScore}<small>SCORE THIS RUN</small></div><div>♥ ${s.reserveLives}<small>SPARE LIVES</small></div></div><div class="arcade-result-actions">${won && s.difficulty < 2 ? '<button class="btn" data-arcade-result="harder">Make this style harder →</button>' : ""}${won && s.stage < 4 ? '<button class="btn secondary" data-arcade-result="next">Next level · choose any style →</button>' : ""}<button class="btn secondary" data-arcade-result="retry">${won ? "Play this level again" : "Try again"}</button><button class="text-btn" data-arcade-result="home">Home</button></div></main></div>`;
    document.querySelectorAll("[data-arcade-result]").forEach(
      (b) =>
        (b.onclick = () => {
          const a = b.dataset.arcadeResult;
          if (a === "home") {
            stop();
            home();
          } else if (a === "next") {
            stop();
            home();
            arcadeHub(s.stage + 1);
          } else
            launch(
              s.mode,
              s.stage,
              a === "harder" ? s.difficulty + 1 : s.difficulty,
            );
        }),
    );
    if (won) {
      sound(true);
      MidnightVictory.play(s.team, document.querySelector(".victory-spirit"));
    } else sound(false);
  }
  root.MidnightArcadeUI = { launch, stop, getState: () => current };
})(globalThis);
