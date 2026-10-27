(function (root) {
  let current = null,
    abort = null,
    frame = null,
    images = {},
    last = 0,
    countdownUntil = 0,
    countdownLabel = "",
    rewarded = false,
    lastDisplay = "",
    hint = "";
  const titles = {
    maze: "Ghostlight Maze",
    jump: "Moonlit Leap",
    rhythm: "Moonlight Melody",
  };
  const mazeScenes = [
    { name: "Moonlit Woods", asset: "/assets/moonlit-woodland.webp" },
    {
      name: "Mexican Graveyard",
      credit: "Inspired by Día de los Muertos",
      asset: "/assets/arcade/marigold-garden.webp",
      description:
        "Inspired by Día de los Muertos: a beautiful Mexican graveyard with multicolored memorial lights, decorated graves, candles and marigolds.",
    },
    {
      name: "American Graveyard",
      asset: "/assets/arcade/fogbound-cemetery.webp",
      description:
        "A classic American-style cemetery: gray headstones, bare trees and silver moonlit fog.",
    },
    {
      name: "Lantern River Garden",
      asset: "/assets/arcade/lantern-garden.webp",
      description:
        "A peaceful lantern garden inspired by Japanese Obon traditions of remembering ancestors.",
    },
    { name: "Monster Bash Woodland", asset: "/assets/moonlit-woodland.webp" },
  ];
  const tips = {
    maze: "Collect every candy, dodge the pursuers, then reach the glowing house. Arrows / WASD, swipe, or use the arrows below.",
    rhythm:
      "Hit the matching glowing notes on the line. Use the matching arrow keys (← ↓ ↑ →). Touch arrows work on phones too.",
    jump: "Run forward and jump over the obstacles. Press Space / ↑ or tap JUMP once per jump.",
  };
  function stop() {
    document.body.classList.remove("arcade-active");
    countdownUntil = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    if (abort) abort.abort();
    abort = null;
    current = null;
    MidnightMusic.setPaused(false);
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
  function launch(mode, stage = 0, difficulty = 0, playMode = "adventure") {
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
        : mode === "rhythm"
          ? MidnightArcade.createRhythm(stage, profile, difficulty)
          : MidnightArcade.createJump(stage, profile, difficulty);
    if (mode === "maze") current.scene = mazeScenes[current.stage].name;
    current.playMode = playMode;
    current.runId = crypto.randomUUID();
    if (mode === "rhythm") MidnightMusic.ensureClock(profile.mute);
    current.paused = true;
    document.body.classList.add("arcade-active");
    MidnightMusic.setScene(mode === "rhythm" ? "menu" : mode);
    rewarded = false;
    lastDisplay = "";
    hint = "Gathering a little moonlight…";
    abort = new AbortController();
    const signal = abort.signal;
    document.getElementById("app").innerHTML =
      `<div class="game-shell arcade-shell">${header()}<div class="race-top"><button class="text-btn" data-arcade="home">← Home</button><span>${playMode === "quick" ? "QUICK PLAY" : "ADVENTURE · LEVEL " + (stage + 1)} · ${["CHILL", "SPOOKY", "FIENDISH"][difficulty]}</span><button class="text-btn" data-arcade="pause">Pause Ⅱ</button></div><main><div class="arcade-heading"><div><span class="eyebrow">${esc(profile.name || "Grave guest")} · ${profile.team}</span><h1>${titles[mode]}</h1>${mode === "rhythm" ? `<span class="rhythm-song">Song ${stage + 1}/5 · ${esc(current.song)}</span>` : mode === "maze" ? `<span class="rhythm-song">${esc(current.scene)}${mazeScenes[stage].credit ? " · " + mazeScenes[stage].credit : ""}</span>` : ""}</div>${ghost(profile.team)}</div><p class="arcade-instruction">${playMode === "journey" ? "Journey · Game " + (profile.journeyStep + 1) + "/20. " : ""}${tips[mode]}${mode === "rhythm" ? ` Level ${stage + 1}: ${current.keys.map((k) => MidnightScore.arrows[k]).join(" ")}.` : ""}</p><div class="arcade-stats" id="arcade-stats"></div><div class="arcade-board-wrap"><canvas id="arcade-board" class="arcade-board ${mode === "maze" ? "maze-board" : "jump-board"}" width="${mode === "maze" ? 544 : 900}" height="${mode === "maze" ? 480 : 540}" tabindex="0" aria-label="${titles[mode]} game board. ${tips[mode]}"></canvas><div class="arcade-pause" id="arcade-pause"><h2>Gathering moonlight…</h2></div></div><div class="arcade-hint" id="arcade-hint" role="status" aria-live="polite">${hint}</div>${mode === "maze" ? '<div class="maze-controls" aria-label="Maze direction controls"><button data-dir="up" aria-label="Move up">↑</button><button data-dir="left" aria-label="Move left">←</button><button data-arcade="pause" aria-label="Pause to plan your route">Ⅱ</button><button data-dir="right" aria-label="Move right">→</button><button data-dir="down" aria-label="Move down">↓</button></div>' : mode === "rhythm" ? `<div class="rhythm-controls" aria-label="Rhythm note pads">${Array.from({ length: current.laneCount }, (_, i) => `<button data-lane="${i}" style="--note:${["#B8D4FF", "#F28C28", "#B396E2", "#9BD14B"][i]}">${MidnightScore.arrows[current.keys[i]]}<small>${current.keys[i].replace("Arrow", "").toUpperCase()}</small></button>`).join("")}</div>` : '<button class="jump-control" data-arcade="jump">JUMP <small>SPACE / ↑</small></button>'}<p class="arcade-footer-note">Three hearts · spare lives save your glow · +1 life every 2,500 score</p></main></div>`;
    if (mode === "maze") {
      const shell = document.querySelector(".arcade-shell");
      shell.classList.add("maze-scene-shell");
      shell.style.setProperty(
        "--maze-scene",
        `url("${mazeScenes[stage].asset}")`,
      );
    }
    window.scrollTo(0, 0);
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
    document.querySelectorAll("[data-lane]").forEach((b) =>
      b.addEventListener(
        "pointerdown",
        (e) => {
          e.preventDefault();
          if (current)
            MidnightArcade.hitRhythm(
              current,
              Number(b.dataset.lane),
              MidnightMusic.clock().time,
            );
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
        if (mode === "rhythm" && current.keys.includes(e.key) && !e.repeat) {
          e.preventDefault();
          MidnightArcade.hitRhythm(
            current,
            current.keys.indexOf(e.key),
            MidnightMusic.clock().time,
          );
          return;
        }
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
      MidnightCharacters.load(profile.team),
      image(
        mode === "maze"
          ? mazeScenes[stage].asset
          : "/assets/moonlit-woodland.webp",
      ),
      image("/assets/arcade/witch.webp"),
      image("/assets/arcade/zombie.webp"),
      mode === "rhythm" ? MidnightMusic.ready(stage) : Promise.resolve(),
    ])
      .then(([player, forest, witch, zombie]) => {
        if (current !== owner) return;
        images = { player, forest, witch, zombie };
        current.paused = true;
        current.countdown = 3;
        countdownLabel = "";
        hint =
          mode === "maze"
            ? "Follow the candy glow. The house opens when you have them all."
            : mode === "rhythm"
              ? "Follow the arrows. Press when each note meets the glowing line."
              : "Watch the first obstacle. One well-timed jump—you’ve got this!";
        document.getElementById("arcade-pause").classList.remove("hide");
        last = performance.now();
        countdownUntil = last + 3300;
        window.scrollTo(0, 0);
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
    if (!current || current.status !== "playing" || countdownUntil) return;
    current.paused = !current.paused;
    if (current.mode === "rhythm") MidnightMusic.setPaused(current.paused);
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
      key = [
        s.lives,
        s.reserveLives,
        s.totalScore,
        s.collected,
        s.passed,
        s.hits,
        s.combo,
      ].join("/");
    if (key === lastDisplay) return;
    lastDisplay = key;
    document.getElementById("arcade-stats").innerHTML =
      `<span class="hearts" aria-label="${s.lives} hearts remaining">${"♥".repeat(s.lives)}<i>${"♡".repeat(3 - s.lives)}</i></span><span>${s.mode === "maze" ? `Candy ${s.collected}/${s.target}` : s.mode === "rhythm" ? `Notes ${s.hits}/${s.target}` : `Obstacles ${s.passed}/${s.target}`}<small>Level ${s.stage + 1}</small></span><span>Score ${s.totalScore}<small>♥ ${s.reserveLives} spare · ${MidnightEconomy.scorePerLife - (s.totalScore % MidnightEconomy.scorePerLife)} to bonus</small></span>`;
  }
  function sprite(c, img, x, y, w, h, alpha = 1, angle = 0) {
    if (!img) return;
    c.save();
    c.globalAlpha = alpha;
    c.shadowColor = colors[profile.team];
    c.shadowBlur = 9;
    c.translate(x + w / 2, y + h / 2);
    c.rotate(angle);
    MidnightCharacters.draw(
      c,
      img,
      -w / 2,
      -h / 2,
      w,
      h,
      alpha,
      performance.now() / 1000,
      current?.invulnerable > 0 ? "sad" : "idle",
    );
    c.restore();
  }
  function forest(c, w, h) {
    c.clearRect(0, 0, w, h);
    const pan =
      current.mode === "jump" ? Math.min(160, current.cameraX * 0.06) : 0;
    c.drawImage(
      images.forest,
      -pan,
      0,
      w + (current.mode === "jump" ? 180 : 0),
      h,
    );
    c.fillStyle =
      current.mode === "maze"
        ? current.stage === 0 || current.stage === 4
          ? "#071323c9"
          : "#07132366"
        : current.mode === "rhythm"
          ? "#07132399"
          : "#07132333";
    c.fillRect(0, 0, w, h);
  }
  function drawMaze(c) {
    const s = current,
      tile = 32;
    forest(c, 544, 480);
    const memorial = s.stage === 1,
      lantern = s.stage === 3,
      fog = s.stage === 2;
    const lights = memorial
      ? ["#ffb347", "#df89e8", "#70dfcf", "#92baff"]
      : lantern
        ? ["#ffc57a", "#ffac67"]
        : ["#83ccff"];
    for (let y = 0; y < s.height; y++)
      for (let x = 0; x < s.width; x++) {
        if (s.grid[y][x]) {
          c.fillStyle = memorial
            ? "#283044b8"
            : lantern
              ? "#233a44c9"
              : fog
                ? "#35414bc9"
                : "#173449";
          c.strokeStyle = memorial
            ? "#e9a95699"
            : lantern
              ? "#ffc57a77"
              : fog
                ? "#a9b8c366"
                : "#4c8db766";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2, 7);
          c.fill();
          c.stroke();
          if ((x * 7 + y * 11) % (memorial || lantern ? 3 : 9) === 0) {
            c.fillStyle = lights[(x + y) % lights.length];
            c.shadowColor = c.fillStyle;
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
      c.fillStyle = memorial ? lights[(x + y) % lights.length] : "#f1b65e";
      c.shadowColor = c.fillStyle;
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
      if (e.chasing) {
        c.save();
        c.fillStyle = "#ffc57a";
        c.font = "bold 16px sans-serif";
        c.textAlign = "center";
        c.fillText("!", (e.px ?? e.x) * 32 + 16, (e.py ?? e.y) * 32 - 5);
        c.restore();
      }
      if (memorial || lantern) {
        const x = (e.px ?? e.x) * 32 + 16,
          y = (e.py ?? e.y) * 32 + 16;
        c.fillStyle = lights[s.enemies.indexOf(e) % lights.length];
        c.shadowColor = c.fillStyle;
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(x, y, 7, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = "#fff4d5";
        c.beginPath();
        c.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
        c.fill();
        continue;
      }
      if (e.kind === "spider") {
        c.fillStyle = "#b39bcc";
        c.beginPath();
        c.ellipse(
          (e.px ?? e.x) * 32 + 16,
          (e.py ?? e.y) * 32 + 17,
          9,
          7,
          0,
          0,
          7,
        );
        c.fill();
        c.strokeStyle = "#b39bcc";
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo((e.px ?? e.x) * 32 + 9, (e.py ?? e.y) * 32 + 15 + i * 4);
          c.lineTo((e.px ?? e.x) * 32 + 2, (e.py ?? e.y) * 32 + 12 + i * 7);
          c.moveTo((e.px ?? e.x) * 32 + 23, (e.py ?? e.y) * 32 + 15 + i * 4);
          c.lineTo((e.px ?? e.x) * 32 + 30, (e.py ?? e.y) * 32 + 12 + i * 7);
          c.stroke();
        }
      } else
        sprite(
          c,
          images[e.kind],
          (e.px ?? e.x) * 32 - 7,
          (e.py ?? e.y) * 32 - 4,
          46,
          38,
          0.95,
        );
    }
    sprite(
      c,
      images.player,
      (s.player.px ?? s.player.x) * 32 - 8,
      (s.player.py ?? s.player.y) * 32 - 3,
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
    c.save();
    c.translate(-s.cameraX, 0);
    c.fillStyle = "#102132";
    c.fillRect(s.cameraX, s.ground, w, h - s.ground);
    c.strokeStyle = "#75b8dc";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(s.cameraX, s.ground);
    c.lineTo(s.cameraX + w, s.ground);
    c.stroke();
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(s.cameraX / 83) * 83 + i * 83;
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
      s.cameraX + 665 + Math.sin(s.elapsed * 0.3) * 70,
      45 + Math.sin(s.elapsed * 0.7) * 14,
      165,
      110,
      0.75,
    );
    sprite(
      c,
      images.zombie,
      350 + Math.floor(s.cameraX / 1800) * 1800,
      330,
      110,
      85,
      0.38,
    );
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
    if (s.finishX) {
      c.strokeStyle = "#e9b86f";
      c.shadowColor = "#b8d4ff";
      c.shadowBlur = 12;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(s.finishX, s.ground);
      c.lineTo(s.finishX, s.ground - 115);
      c.quadraticCurveTo(
        s.finishX + 45,
        s.ground - 150,
        s.finishX + 90,
        s.ground - 115,
      );
      c.lineTo(s.finishX + 90, s.ground);
      c.stroke();
      c.shadowBlur = 0;
    }
    c.strokeStyle = colors[s.team];
    c.lineWidth = 3;
    c.globalAlpha = 0.25;
    c.beginPath();
    c.moveTo(s.player.x - 18, s.ground - s.player.y - 30);
    c.quadraticCurveTo(
      s.player.x - 50,
      s.ground - s.player.y - 28,
      s.player.x - 75,
      s.ground - s.player.y - 15,
    );
    c.stroke();
    c.globalAlpha = 1;
    sprite(
      c,
      images.player,
      s.player.x - 28,
      s.ground -
        s.player.y -
        s.player.height -
        15 +
        (s.player.y === 0 ? Math.sin(s.elapsed * 9) * 2 : 0),
      130,
      85,
      s.invulnerable > 0 && Math.floor(s.elapsed * 8) % 2 ? 0.4 : 1,
      s.player.y > 0
        ? Math.max(-0.08, Math.min(0.08, s.player.vy / 6000))
        : Math.sin(s.elapsed * 8) * 0.02,
    );
    c.restore();
    if (s.elapsed < 2.2) {
      c.fillStyle = "#ddeaff";
      c.font = "18px sans-serif";
      c.fillText("Run forward. Jump before each woodland obstacle.", 45, 45);
    }
  }
  function drawRhythm(c) {
    const s = current,
      w = s.width || 900,
      h = s.height || 540;
    forest(c, w, h);
    const pad = 70,
      laneWidth = (w - 140) / s.laneCount,
      hitY = 445,
      now = MidnightMusic.clock().time,
      palette = ["#B8D4FF", "#F28C28", "#B396E2", "#9BD14B"];
    for (let lane = 0; lane < s.laneCount; lane++) {
      const x = pad + lane * laneWidth;
      c.fillStyle = "#112136c9";
      c.beginPath();
      c.roundRect(x + 8, 25, laneWidth - 16, 475, 15);
      c.fill();
      c.strokeStyle = palette[lane];
      c.lineWidth = 2;
      c.globalAlpha = 0.45;
      c.stroke();
      c.globalAlpha = 1;
      c.fillStyle = palette[lane];
      c.font = "bold 28px sans-serif";
      c.textAlign = "center";
      c.fillText(MidnightScore.arrows[s.keys[lane]], x + laneWidth / 2, 490);
      c.strokeStyle = palette[lane];
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x + 20, hitY);
      c.lineTo(x + laneWidth - 20, hitY);
      c.stroke();
      if (s.lastHitLane === lane && now - s.lastHitTime < 0.2) {
        c.fillStyle = palette[lane] + "44";
        c.fillRect(x + 10, hitY - 50, laneWidth - 20, 65);
      }
    }
    for (const note of s.notes) {
      if (note.status !== "pending") continue;
      const y =
        hitY - (note.time - now) * (125 + s.stage * 13 + s.difficulty * 12);
      if (y < 20 || y > hitY + 40) continue;
      const x = pad + (note.lane + 0.5) * laneWidth;
      c.fillStyle = palette[note.lane];
      c.shadowColor = c.fillStyle;
      c.shadowBlur = 16;
      c.beginPath();
      c.arc(x, y, 22, 0, 7);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = "#122032";
      c.font = "bold 26px serif";
      c.fillText(MidnightScore.arrows[s.keys[note.lane]], x, y + 8);
    }
    c.textAlign = "left";
    c.globalAlpha = 1;
  }
  function tick(now) {
    if (!current) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const c = document.getElementById("arcade-board")?.getContext("2d");
    if (!c) return;
    if (document.hidden) {
      if (countdownUntil) countdownUntil = now + 3300;
      frame = requestAnimationFrame(tick);
      return;
    }
    if (countdownUntil) {
      current.countdown = Math.max(
        0,
        Math.ceil((countdownUntil - now - 300) / 1000),
      );
      const label = current.countdown || "GO!";
      if (label !== countdownLabel) {
        countdownLabel = label;
        document.getElementById("arcade-pause").innerHTML =
          `<h2 class="arcade-countdown">${label}</h2><p>Board and controls ready. Your adventure starts after GO!</p>`;
      }
      if (current.mode === "maze") drawMaze(c);
      else if (current.mode === "rhythm") drawRhythm(c);
      else drawJump(c);
      if (now < countdownUntil) {
        frame = requestAnimationFrame(tick);
        return;
      }
      countdownUntil = 0;
      current.paused = false;
      current.countdown = 0;
      if (current.mode === "rhythm") {
        MidnightMusic.setScene("rhythm");
        MidnightMusic.selectSong(current.stage, 2);
        MidnightArcade.prepareRhythm(current, MidnightMusic.clock());
      }
      document.getElementById("arcade-pause").classList.add("hide");
    }
    if (current.mode === "maze") {
      MidnightArcade.stepMaze(current, dt);
      drawMaze(c);
    } else if (current.mode === "rhythm") {
      MidnightArcade.stepRhythm(current, MidnightMusic.clock().time);
      drawRhythm(c);
    } else {
      MidnightArcade.stepJump(current, dt);
      drawJump(c);
    }
    for (const e of current.events.splice(0)) {
      if (e.type === "bonus-life")
        hint = "2,500 score—an extra life! Spellbinding!";
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
      else if (e.type === "perfect") hint = "Spellbinding timing! ♪";
      else if (e.type === "note")
        hint = "Boo-tiful beat! Keep the melody glowing.";
      else if (e.type === "miss")
        hint = "Watch the glowing line. You’ve got the next note.";
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
    document.body.classList.remove("arcade-active");
    rewarded = true;
    const s = current,
      won = s.status === "won";
    sync();
    const personalBest = MidnightRecords.record(profile, {
      id: s.runId,
      mode: s.mode,
      name: profile.name,
      character: s.team,
      level: s.stage + 1,
      difficulty: s.difficulty,
      score: s.runScore,
      seconds: s.elapsed,
      won,
    });
    save();
    if (won) {
      if (s.playMode === "journey")
        MidnightJourney.complete(profile, s.mode, s.stage);
      profile.coins += 45 + s.stage * 10 + s.lives * 5;
      profile.points += 15 + s.stage * 5;
      if (s.playMode !== "quick") {
        profile.arcadeUnlocked = Math.max(
          profile.arcadeUnlocked || 0,
          Math.min(4, s.stage + 1),
        );
        profile.arcadeLevel = Math.min(4, s.stage + 1);
        profile.unlockedLevel = Math.max(
          profile.unlockedLevel || 0,
          Math.min(3, s.stage + 1),
        );
      }
      profile.arcadeMedals ??= { maze: [], jump: [], rhythm: [] };
      profile.arcadeMedals[s.mode] ??= [];
      profile.arcadeMedals[s.mode][s.stage] = Math.max(
        profile.arcadeMedals[s.mode][s.stage] || 0,
        s.lives,
      );
      save();
    }
    if (abort) abort.abort();
    abort = null;
    document.getElementById("app").innerHTML =
      `<div class="game-shell">${header()}<main class="result arcade-result"><div class="eyebrow" style="justify-content:center">${titles[s.mode]} · LEVEL ${s.stage + 1}${s.mode === "rhythm" ? " · " + esc(s.song) : ""}</div>${ghost(s.team, "victory-spirit")}<h1>${won ? (s.mode === "maze" ? "A-maze-ing!" : s.mode === "rhythm" ? "Spellbinding rhythm!" : "A leap of moonlight!") : s.reason === "accuracy" ? "One more encore?" : "Out of glow!"}</h1><p class="muted">${won ? "A well-earned win. Your ghost looks rather proud." : "Three fresh hearts are waiting on your next try."}</p>${personalBest ? '<p class="personal-best">★ NEW PERSONAL HIGH SCORE</p>' : ""}<div class="result-rewards"><div>◈ ${won ? "+" + (45 + s.stage * 10 + s.lives * 5) : "0"}<small>COINS</small></div><div>+${s.runScore}<small>SCORE THIS RUN</small></div><div>♥ ${s.reserveLives}<small>SPARE LIVES</small></div></div><div class="arcade-result-actions">${won && s.playMode === "journey" ? '<button class="btn" data-arcade-result="journey">Continue journey →</button>' : ""}${won && s.mode === "rhythm" && s.stage < 4 && s.playMode !== "journey" ? '<button class="btn" data-arcade-result="next-song">Next song · Level ' + (s.stage + 2) + " →</button>" : ""}${won && s.difficulty < 2 ? '<button class="btn" data-arcade-result="harder">Make this style harder →</button>' : ""}${won && s.stage < 4 && s.playMode !== "quick" && s.playMode !== "journey" ? '<button class="btn secondary" data-arcade-result="next">Next level · choose any style →</button>' : ""}<button class="btn secondary" data-arcade-result="retry">${won ? "Play this level again" : "Try again"}</button><button class="btn secondary" data-arcade-result="styles">${s.playMode === "journey" ? "View journey route" : s.playMode === "quick" ? "Choose another single game" : "Choose a style at this level"}</button><button class="text-btn" data-action="highscores">High scores</button><button class="text-btn" data-arcade-result="home">Home</button></div></main></div>`;
    document.querySelectorAll("[data-arcade-result]").forEach(
      (b) =>
        (b.onclick = () => {
          const a = b.dataset.arcadeResult;
          if (a === "journey" || (a === "styles" && s.playMode === "journey")) {
            stop();
            home();
            journeyMenu();
          } else if (a === "home") {
            stop();
            home();
          } else if (a === "next" || a === "styles") {
            stop();
            home();
            arcadeHub(a === "next" ? s.stage + 1 : s.stage, s.playMode);
          } else
            launch(
              s.mode,
              a === "next-song" ? s.stage + 1 : s.stage,
              a === "harder" ? s.difficulty + 1 : s.difficulty,
              s.playMode,
            );
        }),
    );
    window.scrollTo(0, 0);
    if (won) {
      sound(true);
      MidnightVictory.play(s.team, document.querySelector(".victory-spirit"));
    } else sound(false);
  }
  root.MidnightArcadeUI = { launch, stop, getState: () => current, mazeScenes };
})(globalThis);
