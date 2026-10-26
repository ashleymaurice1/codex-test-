const $ = (s) => document.querySelector(s),
  app = $("#app");
const defaults = {
  name: "",
  racer: 0,
  team: "Mach",
  chosen: false,
  coins: 0,
  points: 0,
  unlocks: [],
  hat: "",
  ghostHat: false,
  awarded: [],
  best: null,
  tutorial: false,
  mute: false,
  level: 0,
  unlockedLevel: 0,
  levelStars: [],
};
let profile;
try {
  profile = {
    ...defaults,
    ...JSON.parse(localStorage.getItem("midnight-profile") || "{}"),
  };
} catch {
  profile = { ...defaults };
}
if (!colors[profile.team]) profile.team = "Mach";
profile.unlockedLevel = Math.max(
  0,
  Math.min(3, Number(profile.unlockedLevel) || 0),
);
profile.level = Math.max(
  0,
  Math.min(profile.unlockedLevel, Number(profile.level) || 0),
);
if (!Array.isArray(profile.levelStars)) profile.levelStars = [];
const levels = MIDNIGHT_LEVELS;
let state = null,
  myId = null,
  ws = null,
  reconnect = null,
  offset = 0,
  view = "home",
  lastChallenge = null,
  lastCount = null,
  renderKey = "",
  lastReward = "",
  pending = null,
  lastEvent = "",
  heldItem = null,
  feedbackTimer,
  quizStep = 0,
  quizScore = 0;
const names = ["Stumbles", "Tutu Tina", "Barkley", "Pumpkin Pete"];
const personal = [
  "Always a little unstitched.",
  "Dead graceful. Mostly.",
  "A very good, very undead boy.",
  "A head full of bright ideas.",
];
const traits = {
  Mach: "Fast & fearless",
  Slink: "Clever & slippery",
  Ember: "Loud & loyal",
  Misty: "Chaotic & hyper",
};
const symbols = {
  pumpkin: "🎃",
  skull: "💀",
  bat: "🦇",
  candle: "🕯️",
  door: "🚪",
  ghost: "👻",
  "ghost-odd": "👻",
};
const itemSymbols = {
  "Arm Toss": "🦴",
  "Sugar Rush": "🍬",
  "Tombstone Drop": "🪦",
  "Brain Freeze": "❄",
  Sunrise: "☀",
};
const instructions = [
  "Tap a pumpkin. Dodge the skulls.",
  "Catch the bat before it escapes!",
  "Wait for the flame to go out. Then tap!",
  "Two doors rattle. Tap the still one.",
  "Tap the biggest pile of candy.",
  "One ghost is different. Tap it!",
];
const titles = [
  "Pumpkin Pick",
  "Bat Smash",
  "Candle Out",
  "Haunted Door",
  "Candy Count",
  "Odd One Out",
];
const opening = new Audio("/assets/opening.m4a");
opening.volume = 0.32;
opening.loop = true;
let audioContext = null;
function save() {
  try {
    localStorage.setItem("midnight-profile", JSON.stringify(profile));
  } catch {
    toast("Browser storage is unavailable. Rewards last for this visit.");
  }
}
function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("show");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => $("#toast").classList.remove("show"), 3500);
}
function sound(ok = true) {
  if (profile.mute) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime,
      o = audioContext.createOscillator(),
      g = audioContext.createGain();
    o.type = ok ? "sine" : "triangle";
    o.frequency.setValueAtTime(ok ? 520 : 130, now);
    o.frequency.exponentialRampToValueAtTime(ok ? 900 : 65, now + 0.12);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.connect(g).connect(audioContext.destination);
    o.start();
    o.stop(now + 0.2);
  } catch {}
}
function music() {
  if (!profile.mute) opening.play().catch(() => {});
}
function mute() {
  profile.mute = !profile.mute;
  save();
  if (profile.mute) opening.pause();
  else music();
  document.querySelectorAll('[data-action="mute"]').forEach((b) => {
    b.textContent = profile.mute ? "♪̸" : "♫";
    b.setAttribute("aria-label", profile.mute ? "Unmute sound" : "Mute sound");
  });
}
function header() {
  return `<header><div class="brand"><span class="brand-mark">☾</span> Midnight Zombies<span style="color:#f2a04e;font-size:13px">✦</span></div><div class="header-right"><span class="season"><i></i> THE WITCHING HOUR IS HERE</span><span class="coin">◈ ${profile.coins}</span><button class="icon-btn" data-action="mute" aria-label="${profile.mute ? "Unmute" : "Mute"} sound">${profile.mute ? "♪̸" : "♫"}</button></div></header>`;
}
function home() {
  view = "home";
  renderKey = "";
  state = null;
  document.documentElement.style.setProperty("--team", colors[profile.team]);
  app.innerHTML = `<div class="shell">${header()}<main><section class="hero">${landscape()}<div class="hero-copy"><div class="eyebrow">A little spooky. A lot of silly.</div><h1>Midnight<span>Zombies</span></h1><p>The party’s at the bell tower.<br>The sun’s almost up.<br>Better pull yourself together.</p><div class="hero-badge"><b>✦</b> ONE-TAP RACING <b>·</b> 1–2 MINUTES <b>·</b> 100% UNDEAD</div></div>${ghost("Mach", "hero-mach")}<div class="hero-caption">MEET MACH <span>→</span><small>Your ghostly partner in crime.</small></div></section><div class="section-top"><div><h2>Race you to the party.</h2><p>Quick taps. Crooked paths. Questionable friends.</p></div><button class="text-btn" data-action="help">How to play →</button></div><section class="play-grid" aria-label="Play modes"><button class="play-card primary" data-action="solo"><span class="card-icon">⚡</span><span class="tag">JUST YOU + 3 BOTS</span><h3>Play Solo</h3><p>Start easy. Unlock your path to the party.</p><span class="arrow">→</span></button><button class="play-card" data-action="create"><span class="card-icon">♧</span><h3>Create a Room</h3><p>Gather your favorite ghouls.<br>2–6 players. One party.</p><span class="arrow">→</span></button><button class="play-card" data-action="join"><span class="card-icon">⌘</span><h3>Join a Room</h3><p>Got a secret code?<br>Let yourself in.</p><span class="arrow">→</span></button></section>${journeyPreview()}${teamGallery()}<section class="bottom-grid"><div><div class="small-heading"><span>PICK YOUR PARTY ANIMAL</span><button class="text-btn" data-action="shop">The costume cupboard →</button></div><div class="racer-strip">${names.map((n, i) => `<button class="mini-racer ${profile.racer === i ? "selected" : ""}" data-action="racer" data-value="${i}" aria-pressed="${profile.racer === i}">${racer(i, profile.team, profile.hat)}<span>${n}</span></button>`).join("")}</div></div><div class="team-box"><div class="small-heading"><span>YOUR AFTERLIFE ALLIANCE</span><button class="text-btn" data-action="team">Switch team →</button></div><div class="team-detail">${ghost(profile.team)}<div><h3>Team ${profile.team}</h3><p>${traits[profile.team]}. Bad at bedtimes.</p></div></div><div class="team-progress"><span>✧ Your Midnight Cup points</span><span>${profile.points} pts ${profile.best ? ` · Best ${profile.best.toFixed(1)}s` : ""}</span></div></div></section></main><footer><span>Made of moonlight, mischief & a few loose stitches.</span><div>No login. No download. Just one more race.</div></footer></div>`;
}
function journeyPreview() {
  return `<section class="journey-preview"><div><span class="eyebrow">YOUR ROAD TO THE MONSTER BASH</span><h2>Every midnight, a little braver.</h2><p>Place in the top three with 5 correct taps to unlock the next level.</p></div><button class="btn secondary" data-action="solo">${profile.unlockedLevel === 0 ? "Start your journey" : "Continue your journey"} →</button><div class="journey-path">${levels.map((l, i) => `<button class="journey-stop ${i <= profile.unlockedLevel ? "open" : "locked"} ${i === profile.level ? "current" : ""}" data-action="level" data-value="${i}" ${i > profile.unlockedLevel ? "disabled" : ""}><b>${i > profile.unlockedLevel ? "⌑" : l.symbol}</b><span>LEVEL ${i + 1}</span><strong>${l.short}</strong><small>${"★".repeat(profile.levelStars[i] || 0)}${"☆".repeat(3 - (profile.levelStars[i] || 0))}</small></button>`).join("")}</div></section>`;
}
function teamGallery() {
  return `<section class="ghost-gallery"><div class="section-top"><div><h2>Your ghost. Your team. Your midnight.</h2><p>Four original spirits. One brilliantly bad idea.</p></div></div><div class="ghost-cards">${Object.keys(
    colors,
  )
    .map(
      (t) =>
        `<button class="ghost-card ${profile.team === t ? "selected" : ""}" data-action="choose-team" data-value="${t}" style="--spirit:${colors[t]}"><span class="spirit-halo"></span>${ghost(t)}<h3>${t}</h3><span class="ghost-species">${{ Mach: "THE GHOST FALCON", Slink: "THE GHOST SERPENT", Ember: "THE GHOST WOLF", Misty: "THE GHOST BAT" }[t]}</span><p>${traits[t]}</p><small>${profile.team === t ? "YOUR TEAM ✓" : "Choose Team " + t + " →"}</small></button>`,
    )
    .join("")}</div></section>`;
}
function levelMap() {
  music();
  modal(
    `<h2>Your midnight journey.</h2><p>Easy to learn. A little faster every level. Earn a podium place with at least 5 correct taps to open the next gate.</p><div class="level-list">${levels.map((l, i) => `<button class="level-row" data-action="level" data-value="${i}" ${i > profile.unlockedLevel ? "disabled" : ""}><b>${i > profile.unlockedLevel ? "⌑" : i + 1}</b><span><strong>${l.name}</strong><small>${i > profile.unlockedLevel ? "Complete the previous level to unlock." : l.description}</small></span><em>${"★".repeat(profile.levelStars[i] || 0)}${i <= profile.unlockedLevel ? " →" : ""}</em></button>`).join("")}</div>`,
  );
}
function modal(content) {
  document.querySelector("dialog")?.remove();
  const d = document.createElement("dialog");
  d.innerHTML = `<button class="close" data-action="close" aria-label="Close dialog">×</button>${content}`;
  document.body.append(d);
  d.showModal();
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
  return d;
}
function help(first = false) {
  modal(
    `<div style="font-size:35px;margin-bottom:13px">☾ ✦</div><h2>Dead simple.</h2><p>Tap the right thing, fast. Every correct tap moves your zombie forward. Grab items to mess with your friends. First to the party wins!</p><p>Each challenge has one instruction. Miss one? Pull yourself together and try the next. Earn an item every 3 correct taps.</p><div class="actions"><button class="btn" data-action="help-done">Let’s make some mischief →</button>${first ? '<button class="btn secondary" data-action="help-done">Skip</button>' : ""}</div>`,
  );
}
function teamMenu() {
  modal(
    `<h2>Your kind of haunt.</h2><p>Four rival teams. One very questionable trophy.</p><div class="teams">${Object.keys(
      colors,
    )
      .map(
        (t) =>
          `<button class="team-option" data-action="pick-team" data-value="${t}" style="--team:${colors[t]}">${ghost(t)}<span>Team ${t}</span><small style="color:${colors[t]}">${traits[t]}</small></button>`,
      )
      .join(
        "",
      )}</div><div class="actions"><button class="btn secondary" data-action="quiz">Let the pumpkin decide 🎃</button></div>`,
  );
}
function quiz() {
  const questions = [
    [
      "Pick a midnight snack.",
      ["Candy corn", "A crunchy bone", "A pickled toad", "Moon cheese"],
    ],
    [
      "Your party entrance?",
      [
        "Dive in first",
        "Sneak through a window",
        "Howl from the roof",
        "Hang upside down",
      ],
    ],
    [
      "Your ideal superpower?",
      [
        "Impossible speed",
        "Slipping out of trouble",
        "A legendary howl",
        "Absolute chaos",
      ],
    ],
  ];
  const [q, a] = questions[quizStep];
  modal(
    `<h2>🎃 The pumpkin asks…</h2><p>Question ${quizStep + 1} of 3 · ${q}</p><div class="quiz-answers">${a.map((x, i) => `<button class="btn secondary" data-action="quiz-answer" data-value="${i}">${x}</button>`).join("")}</div>`,
  );
}
function shop() {
  modal(
    `<h2>The costume cupboard.</h2><p>Looking dead good. ◈ ${profile.coins} coins<br>Everything here is cosmetic.</p><div class="shop-list">${[
      "Witch hat",
      "Party hat",
      "Propeller beanie",
      "Bow tie",
      "Ghost witch hat",
      "Moonlit tint",
    ]
      .map((h, i) => {
        const owned = profile.unlocks.includes(h),
          equipped =
            h === "Ghost witch hat"
              ? profile.ghostHat
              : h === "Moonlit tint"
                ? profile.tint
                : profile.hat === h;
        return `<div class="shop-item"><span>${["🧙", "🎉", "🚁", "🎀", "👻", "✦"][i]} ${h}</span><button class="btn secondary" data-action="buy" data-value="${h}">${owned ? (equipped ? "Take off" : "Wear") : "◈ " + (i > 3 ? 90 : 60)}</button></div>`;
      })
      .join("")}</div>`,
  );
}
function playForm(mode, level = profile.level) {
  if (mode === "solo") {
    profile.level = Math.max(0, Math.min(profile.unlockedLevel, level));
    save();
  }
  music();
  modal(
    `<h2>${{ solo: "Your midnight awaits.", create: "Invite your favorite ghouls.", join: "Secret knock?" }[mode]}</h2><p>${mode === "solo" ? `Level ${profile.level + 1} · ${levels[profile.level].name}. You and three delightfully unreliable rivals.` : mode === "create" ? "Create a room, share its four-letter code, then race together." : "Enter the four-letter code from your host."}</p><form id="play-form"><label for="nickname">YOUR NICKNAME</label><input id="nickname" name="name" maxlength="18" value="${esc(profile.name)}" placeholder="Grave guest" autocomplete="nickname">${mode === "join" ? '<label for="room-code">ROOM CODE</label><input id="room-code" name="code" pattern="[A-Za-z]{4}" maxlength="4" required placeholder="ABCD" style="text-transform:uppercase;letter-spacing:6px" autocomplete="off">' : ""}<p style="margin:17px 0 0">${names[profile.racer]} · Team ${profile.team}</p><div class="actions"><button class="btn" type="submit">${mode === "solo" ? "Let’s race →" : mode === "create" ? "Create room →" : "Join the party →"}</button></div></form>`,
  );
  $("#play-form").onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    profile.name =
      String(form.get("name") || "Grave guest")
        .trim()
        .slice(0, 18) || "Grave guest";
    save();
    pending = {
      type: mode === "join" ? "join" : "create",
      solo: mode === "solo",
      level: profile.level,
      name: profile.name,
      racer: profile.racer,
      team: profile.team,
      code: form.get("code"),
    };
    e.target.querySelector("button").disabled = true;
    connect();
  };
}
function transmit(data) {
  if (ws?.readyState === 1) ws.send(JSON.stringify(data));
}
function connect() {
  clearTimeout(reconnect);
  if (ws?.readyState === 1) {
    if (pending) {
      transmit(pending);
      pending = null;
    }
    return;
  }
  if (ws?.readyState === 0) return;
  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`,
  );
  ws.onopen = () => {
    if (pending) {
      transmit(pending);
      pending = null;
    } else {
      const token = sessionStorage.getItem("midnight-session");
      if (token) transmit({ type: "resume", token });
    }
  };
  ws.onmessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    if (m.type === "joined") {
      myId = m.id;
      sessionStorage.setItem("midnight-session", m.token);
      document.querySelector("dialog")?.close();
      music();
    }
    if (m.type === "expired") {
      sessionStorage.removeItem("midnight-session");
      home();
      toast("That race has drifted away. Start a new one.");
    }
    if (m.type === "error") {
      toast(m.message);
      const b = $("#play-form button");
      if (b) b.disabled = false;
    }
    if (m.type === "answer") {
      sound(m.ok);
      const p = $(".race-panel");
      if (p) {
        p.querySelector(".feedback")?.remove();
        p.insertAdjacentHTML(
          "beforeend",
          `<div class="feedback ${m.ok ? "yes" : "no"}"></div>`,
        );
      }
      toast(
        m.ok ? "Perfectly undead! + distance" : "Oops! Pull yourself together…",
      );
    }
    if (m.type === "state") {
      state = m;
      offset = m.now - Date.now();
      updateGame();
    }
  };
  ws.onclose = () => {
    if (state) {
      toast("Connection lost. Rejoining your race…");
      reconnect = setTimeout(connect, 1200);
    } else if (pending) {
      toast("Could not connect. Try again.");
      const b = $("#play-form button");
      if (b) b.disabled = false;
    }
  };
  ws.onerror = () =>
    toast("Can’t reach the race server. Check your connection.");
}
function me() {
  return state?.players.find((p) => p.id === myId);
}
function gameFrame(body) {
  app.innerHTML = `<div class="game-shell">${header()}${body}</div>`;
}
function updateGame() {
  const p = me();
  if (!p) return;
  document.documentElement.style.setProperty("--team", colors[p.team]);
  const key = state.phase + (state.challenge?.id || "");
  if (state.phase === "lobby") {
    const lk = JSON.stringify([
      state.host,
      state.players.map((p) => [p.id, p.ready, p.online]),
      state.bots,
    ]);
    if (renderKey !== lk) {
      renderKey = lk;
      lobby();
    }
    return;
  }
  if (state.phase === "finished") {
    if (renderKey !== "finished") {
      renderKey = "finished";
      finish();
    }
    return;
  }
  if (renderKey !== key) {
    renderKey = key;
    raceView();
  }
  updateTrack();
  updateControls();
  const event = state.events.at(-1);
  if (
    event &&
    event.id !== lastEvent &&
    Date.now() + offset - event.at < 2500
  ) {
    lastEvent = event.id;
    const by = state.players.find((x) => x.id === event.by);
    $("#race-status").textContent =
      `${by?.name || "A rival"} used ${event.item}!`;
    sound(false);
  }
}
function lobby() {
  view = "lobby";
  const host = state.host === myId;
  gameFrame(
    `<div class="race-top"><button class="text-btn" data-action="leave">← Leave room</button><span>THE PRE-PARTY</span></div><main class="lobby"><div class="eyebrow" style="justify-content:center">The gang’s almost here</div><h1>Gather your ghouls.</h1><p class="muted" style="font-size:12px;margin:18px">Share this room code with your friends</p><div class="room-code">${state.code}</div><button class="text-btn" data-action="copy">Copy room code →</button><div class="lobby-list">${state.players
      .filter((p) => !p.bot)
      .map(
        (p) =>
          `<div class="lobby-player">${racer(p.racer, p.team)}<div><strong>${esc(p.name)} ${p.id === myId ? "(you)" : ""}</strong><small>Team ${p.team} · ${names[p.racer]}</small></div><b>${!p.online ? "ASLEEP" : p.id === state.host ? "HOST" : p.ready ? "READY" : "GETTING READY"}</b></div>`,
      )
      .join(
        "",
      )}</div><label><input id="bots" type="checkbox" ${state.bots ? "checked" : ""} ${host ? "" : "disabled"} style="width:auto"> Fill empty seats with computer racers</label><div class="actions">${host ? '<button class="btn" data-action="start">Start the midnight dash →</button>' : `<button class="btn" data-action="ready">${me().ready ? "Not ready yet" : "I’m ready →"}</button>`}</div><p class="muted" style="font-size:11px;margin-top:15px">Up to 6 players. Stay on this screen until the host starts.</p></main>`,
  );
  $("#bots").onchange = (e) =>
    transmit({ type: "bots", value: e.target.checked });
}
function raceView() {
  view = "race";
  const c = state.challenge;
  gameFrame(
    `<div class="race-top"><span>${state.solo ? `LEVEL ${state.level + 1} · ${levels[state.level].short.toUpperCase()}` : `ROOM ${state.code}`} · TEAM ${me().team.toUpperCase()}</span><button class="text-btn" data-action="leave">Leave race →</button></div><div class="track course-${state.level}">${landscape()}<div class="track-lanes">${[
      ...state.players,
    ]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(
        (p) =>
          `<div class="lane"><div class="runner" id="runner-${p.id}"><span class="runner-name">${esc(p.name)}${p.id === myId ? " · YOU" : ""}</span>${racer(p.racer, p.team, p.id === myId ? profile.hat : "")}${ghost(p.team)}</div></div>`,
      )
      .join(
        "",
      )}</div></div><section class="race-panel">${state.phase === "countdown" ? `<div style="display:flex;justify-content:center">${ghost(me().team)}</div><div class="countdown" id="countdown">3</div><p class="instruction">Tap the right thing. First to the party wins.</p>` : `<div class="round-meta"><span>CHALLENGE ${c.round + 1}</span><span id="race-time"></span></div><h2>${titles[c.kind]}</h2><p class="instruction">${instructions[c.kind]}</p><div class="timer"><div id="timer-fill"></div></div><div class="choices ${c.kind === 1 || c.kind === 2 ? "single" : ""}">${c.choices.map((v, i) => `<button class="choice ${c.kind === 1 ? "bat-target" : ""} ${c.kind === 3 && c.still !== i ? "rattle" : ""} ${v === "ghost-odd" ? "odd" : ""}" data-action="answer" data-value="${i}" aria-label="${c.kind === 4 ? v + " pieces of candy" : v === "ghost-odd" ? "Tilted ghost" : v}">${c.kind === 4 ? `<span style="display:flex;flex-wrap:wrap;justify-content:center;max-width:110px;margin:auto">${spookyIcon("candy").repeat(v)}</span>` : spookyIcon(v)}</button>`).join("")}</div><div id="obstacle"></div>`}</section><div class="item-bar"><div><span id="position">4th place</span><small id="item-hint">Every 3 correct taps earns an item.</small></div><button class="item-button" data-action="item" disabled>✧ Empty item slot</button></div><div class="status-line" id="race-status">Your ghost has your back. Mostly.</div>`,
  );
  lastChallenge = c?.id;
}
function updateTrack() {
  for (const p of state.players) {
    const el = $(`#runner-${p.id}`);
    if (el) {
      el.style.left = `${p.progress * 0.82}%`;
      el.classList.toggle("sleep", !p.online);
      el.classList.toggle("broken", p.blockedUntil > Date.now() + offset);
    }
  }
}
function updateControls() {
  const p = me(),
    now = Date.now() + offset;
  if (!p) return;
  if (p.item && p.item !== heldItem) {
    const bird = $("#runner-" + p.id + " .ghost-art");
    bird?.classList.add("delivering");
    setTimeout(() => bird?.classList.remove("delivering"), 750);
  }
  heldItem = p.item;
  $("#position").textContent =
    `${ordinal(state.players.indexOf(p) + 1)} place · ${Math.round(p.progress)}%`;
  const b = $('[data-action="item"]');
  b.textContent = p.item
    ? `${itemSymbols[p.item]} ${p.item} →`
    : "✧ Empty item slot";
  b.disabled =
    !p.item || state.phase !== "race" || p.blockedUntil > now || p.stones > 0;
  $("#item-hint").textContent = p.item
    ? "Your sidekick delivered a little trouble."
    : `${3 - (p.correct % 3)} correct taps until your next item.`;
  if (state.phase !== "race") return;
  const c = state.challenge;
  const blocked = p.blockedUntil > now,
    answered = p.answered === c.id,
    expired = now > c.closes;
  document
    .querySelectorAll(".choice")
    .forEach(
      (x) => (x.disabled = blocked || answered || p.stones > 0 || expired),
    );
  const obstacle = $("#obstacle");
  if (p.stones) {
    if (!$("#smash-stone"))
      obstacle.innerHTML =
        '<div class="overlay"><button id="smash-stone" data-action="smash" aria-label="Smash tombstone">🪦</button><p id="stone-count"></p></div>';
    $("#stone-count").textContent = `Smash it! ${p.stones} taps left.`;
  } else if (blocked) {
    obstacle.innerHTML = `<div class="overlay ${p.effect === "Sunrise" ? "sun-hit" : p.effect === "Brain Freeze" ? "ice-hit" : ""}"><div style="font-size:45px">${p.effect === "Sunrise" ? "☀" : p.effect === "Brain Freeze" ? "❄" : "🦴"}</div><h2>${p.effect === "Sunrise" ? "Too bright!" : p.effect === "Brain Freeze" ? "Brain freeze!" : "Pull yourself together!"}</h2><p>${Math.max(1, Math.ceil((p.blockedUntil - now) / 1000))}s</p></div>`;
  } else obstacle.innerHTML = "";
  if (answered && !blocked)
    $("#race-status").textContent = "Next challenge is on its way…";
}
function ordinal(n) {
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n] || "th");
}
function finish() {
  view = "finished";
  opening.pause();
  const p = me(),
    place = state.players.indexOf(p) + 1,
    winner = state.players[0],
    elapsed = (winner.finish - state.started) / 1000,
    won = place === 1;
  let coins = [80, 55, 40, 30, 25, 20][place - 1] || 20;
  const rewardKey = state.code + state.started;
  if (lastReward !== rewardKey && !profile.awarded.includes(rewardKey)) {
    lastReward = rewardKey;
    profile.awarded.push(rewardKey);
    profile.awarded = profile.awarded.slice(-100);
    profile.coins += coins;
    profile.points += Math.max(5, 50 - (place - 1) * 10);
    if (state.solo) awardMidnightLevel(profile, state.level, place, p.correct);
    if (state.solo && won && elapsed > 0)
      profile.best = profile.best ? Math.min(profile.best, elapsed) : elapsed;
    save();
  }
  const top = state.players.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  gameFrame(
    `<main class="result"><div class="eyebrow" style="justify-content:center">${won ? "Fashionably dead. Right on time." : "The party waits for no zombie."}</div>${ghost(winner.team)}<h1>${won ? "You made an entrance!" : `${esc(winner.name)} wins!`}</h1><p class="muted" style="font-size:13px;margin-top:12px">${won ? "Team " + p.team + " is raising the roof." : `You finished ${ordinal(place)}. There’s always another midnight.`}</p>${!won && winner.progress - p.progress < 7 ? '<p style="color:#f2a04e;margin-top:10px">SO CLOSE!</p>' : ""}<div class="podium">${order.map((x) => `<div class="podium-place">${racer(x.racer, x.team, x.id === myId ? profile.hat : "")}<strong>${ordinal(state.players.indexOf(x) + 1)}</strong><span>${esc(x.name)}</span></div>`).join("")}</div><div class="result-rewards"><div>◈ +${coins}<small>COINS EARNED</small></div><div>✦ +${Math.max(5, 50 - (place - 1) * 10)}<small>TEAM POINTS</small></div><div>${Number.isFinite(elapsed) && elapsed > 0 ? elapsed.toFixed(1) + "s" : "2:00"}<small>WINNING TIME</small></div></div>${state.solo ? `<div class="level-result"><span>${"★".repeat(profile.levelStars[state.level] || 0)}${"☆".repeat(3 - (profile.levelStars[state.level] || 0))}</span><p>${profile.levelStars[state.level] ? (state.level === 3 ? "You made it through every gate. The Monster Bash is yours!" : `Next gate open: ${levels[state.level + 1].name}`) : "Place in the top three with 5 correct taps to open the next gate."}</p></div>` : ""}<div class="actions" style="max-width:580px;margin:15px auto">${state.solo && state.level < 3 && profile.unlockedLevel > state.level ? '<button class="btn" data-action="next-level">Next level →</button>' : ""}${state.host === myId ? '<button class="btn" data-action="rematch">One more midnight →</button>' : '<p class="muted">Waiting for the host to rematch…</p>'}<button class="btn secondary" data-action="leave">Back home</button></div></main>`,
  );
  sound(true);
  confetti();
}
function confetti() {
  const d = document.createElement("div");
  d.className = "confetti";
  d.innerHTML = Array.from(
    { length: 45 },
    (_, i) =>
      `<i style="left:${Math.random() * 100}%;background:${["#f2a04e", "#ede6d6", "#9bd14b", "#b8d4ff"][i % 4]};animation-delay:${Math.random() * 1.5}s"></i>`,
  ).join("");
  document.body.append(d);
  setTimeout(() => d.remove(), 6000);
}
function leave() {
  transmit({ type: "leave" });
  sessionStorage.removeItem("midnight-session");
  state = null;
  myId = null;
  opening.pause();
  home();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const action = b.dataset.action,
    value = b.dataset.value;
  if (action === "mute") return mute();
  if (action === "close") return b.closest("dialog").close();
  if (action === "help") return help();
  if (action === "help-done") {
    profile.tutorial = true;
    save();
    document.querySelector("dialog").close();
    if (!profile.chosen) teamMenu();
    return;
  }
  if (action === "solo") return levelMap();
  if (action === "level") {
    const level = Number(value);
    if (level > profile.unlockedLevel) return;
    return playForm("solo", level);
  }
  if (action === "next-level") {
    const next = state.level + 1;
    leave();
    return playForm("solo", next);
  }
  if (["create", "join"].includes(action)) return playForm(action);
  if (action === "racer") {
    profile.racer = Number(value);
    save();
    home();
    toast(`${names[profile.racer]} · ${personal[profile.racer]}`);
    return;
  }
  if (action === "team") return teamMenu();
  if (action === "pick-team" || action === "choose-team") {
    profile.team = value;
    profile.chosen = true;
    save();
    document.querySelector("dialog")?.close();
    home();
    toast(`Welcome to Team ${value}!`);
    sound();
    return;
  }
  if (action === "quiz") {
    quizStep = 0;
    quizScore = 0;
    return quiz();
  }
  if (action === "quiz-answer") {
    quizScore += Number(value);
    quizStep++;
    if (quizStep < 3) return quiz();
    profile.team = Object.keys(colors)[quizScore % 4];
    profile.chosen = true;
    save();
    document.querySelector("dialog").close();
    home();
    confetti();
    return toast(`The pumpkin has spoken. Team ${profile.team}!`);
  }
  if (action === "shop") return shop();
  if (action === "buy") {
    const owned = profile.unlocks.includes(value),
      price = ["Ghost witch hat", "Moonlit tint"].includes(value) ? 90 : 60;
    if (!owned) {
      if (profile.coins < price)
        return toast("More races, more coins. Your next look can wait.");
      profile.coins -= price;
      profile.unlocks.push(value);
    }
    if (value === "Ghost witch hat") profile.ghostHat = !profile.ghostHat;
    else if (value === "Moonlit tint") profile.tint = !profile.tint;
    else profile.hat = profile.hat === value ? "" : value;
    save();
    home();
    return shop();
  }
  if (action === "leave") return leave();
  if (action === "copy") {
    navigator.clipboard
      ?.writeText(state.code)
      .then(() => toast("Room code copied!"))
      .catch(() => toast(`Room code: ${state.code}`));
    return;
  }
  if (action === "answer")
    return transmit({
      type: "answer",
      id: state.challenge.id,
      index: Number(value),
    });
  if (action === "smash") sound();
  if (["start", "ready", "item", "smash", "rematch"].includes(action)) {
    music();
    transmit({ type: action });
  }
});
function animate() {
  if (state && view === "race") {
    const now = Date.now() + offset;
    if (state.phase === "countdown") {
      const el = $("#countdown");
      if (el) {
        const remaining = Math.ceil((state.started - now) / 1000);
        el.textContent = remaining > 0 ? remaining : "GO!";
        if (lastCount !== el.textContent) {
          lastCount = el.textContent;
          sound(true);
          el.style.animation = "none";
          void el.offsetWidth;
          el.style.animation = "count-pop .35s ease-out";
        }
      }
    } else if (state.challenge) {
      const c = state.challenge;
      const bar = $("#timer-fill");
      if (bar)
        bar.style.transform = `scaleX(${Math.max(0, (c.closes - now) / (c.closes - c.opens))})`;
      const tm = $("#race-time");
      if (tm)
        tm.textContent = `${Math.floor((now - state.started) / 1000)}s TO THE BASH`;
      if (c.kind === 2) {
        const el = $(".choice");
        if (el) {
          el.innerHTML =
            now >= c.extinguish
              ? spookyIcon("out") +
                '<small style="display:block;font-size:11px">OUT! TAP!</small>'
              : spookyIcon("candle");
          el.setAttribute(
            "aria-label",
            now >= c.extinguish
              ? "Candle out, tap now"
              : "Candle still burning",
          );
        }
      }
    }
  }
  requestAnimationFrame(animate);
}
home();
requestAnimationFrame(animate);
if (sessionStorage.getItem("midnight-session")) connect();
else if (!profile.tutorial) setTimeout(() => help(true), 500);
