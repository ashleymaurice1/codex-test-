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
  musicVolume: 0.35,
  homeSong: 0,
  level: 0,
  unlockedLevel: 0,
  levelStars: [],
  extraLives: 0,
  totalScore: 0,
  highScores: [],
  arcadeUnlocked: 0,
  arcadeLevel: 0,
  journeyStep: 0,
  arcadeMedals: { maze: [], jump: [], rhythm: [] },
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
MidnightEconomy.normalize(profile);
if (!profile.separateMusicPools || !profile.halloweenMusicV2) {
  profile.homeSong = 0;
  profile.separateMusicPools = true;
  profile.halloweenMusicV2 = true;
}
localStorage.setItem("midnight-profile", JSON.stringify(profile));
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
  racePlayMode = sessionStorage.getItem("midnight-race-mode") || "adventure",
  fullTrackOpen = window.innerWidth > 700,
  hudKey = "",
  lastEvent = "",
  heldItem = null,
  feedbackTimer,
  quizStep = 0,
  quizScore = 0;
const names = ["Mach", "Slink", "Ember", "Misty"];
profile.racer = names.indexOf(profile.team);
const species = {
  Mach: "Ghost falcon",
  Slink: "Ghost serpent",
  Ember: "Ghost wolf",
  Misty: "Tiny ghost bat",
};
const personal = [
  "Fast and fearless.",
  "Clever and slippery.",
  "Loud and loyal.",
  "Chaotic and hyper.",
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
  "Tap ONE pumpkin. Leave the skulls alone.",
  "Tap the bat ONCE before it escapes.",
  "Wait until the flame goes OUT, then tap ONCE.",
  "Tap ONCE on the door that is NOT shaking.",
  "Tap the biggest candy pile ONCE.",
  "Tap the ONE tilted ghost.",
  "Tap the crescent MOON once—not the sun or star.",
  "Tap the BLUE potion once.",
  "Tap the SPIDER once—not an empty web.",
  "Tap the friendly GHOST once—not a tombstone.",
  "Tap the LIT lantern once.",
  "Tap ONE candy corn—not a bone.",
];
const titles = [
  "Pumpkin Pick",
  "Bat Smash",
  "Candle Out",
  "Haunted Door",
  "Candy Count",
  "Odd One Out",
  "Moon Match",
  "Potion Pick",
  "Spider Spot",
  "Ghost Peek",
  "Lantern Glow",
  "Candy Corn Hunt",
];
let audioContext = null;
let lastFeedback = null,
  successStreak = 0,
  goodCursor = 0,
  missCursor = 0,
  catchupCursor = 0,
  raceFeedbackId = null,
  roundHint = "One tap per round. You’ve got this!";
const goodWords = [
  "Spooktacular tap!",
  "Boo-tiful timing!",
  "That’s the spirit!",
  "Fangtastic! Keep glowing.",
  "A wicked good tap!",
  "You’re haunting this race!",
  "Ghostly good work!",
  "Keep that magical momentum!",
];
const missWords = [
  "A little ghostly wobble. Try the next one!",
  "Boo! A fresh chance is coming.",
  "One slip won’t stop your glow.",
  "A tiny spook-up. You’ve got the next one!",
  "Shake off the cobwebs. Next round!",
];
const timeoutWords = [
  "That one drifted away. Watch for the next!",
  "Missed the moment—your next chance is coming.",
  "A fresh round is on its way. You’ve got this!",
];
const catchupWords = [
  "A little moonlight hustle—you’ve got this!",
  "One good tap at a time. Close that gap!",
  "Your next boost could turn this race around.",
  "Keep glowing—the party’s still within reach!",
];
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
  if (!profile.mute) MidnightMusic.start();
}
// Safari can require touchend to unlock sound; pointer controls can suppress click.
document.addEventListener("touchend", music, { capture: true, passive: true });
document.addEventListener("pointerup", music, { capture: true, passive: true });
function mute() {
  profile.mute = !profile.mute;
  save();
  if (profile.mute) {
    MidnightMusic.setMuted(true);
  } else music();
  document.querySelectorAll('[data-action="mute"]').forEach((b) => {
    b.textContent = profile.mute ? "♪̸" : "♫";
    b.setAttribute("aria-label", profile.mute ? "Unmute sound" : "Mute sound");
  });
}

function header() {
  return `<header><div class="brand"><span class="brand-mark">☾</span> Midnight Ghost Arcade<span style="color:#f2a04e;font-size:13px">✦</span></div><div class="header-right"><span class="season"><i></i> THE WITCHING HOUR IS HERE</span><span class="coin">◈ ${profile.coins}</span><button class="icon-btn" data-action="mute" aria-label="${profile.mute ? "Unmute" : "Mute"} sound">${profile.mute ? "♪̸" : "♫"}</button></div></header>`;
}
function journeyMenu() {
  const next = MidnightJourney.current(profile);
  if (!next)
    return modal(
      `<h2>Every midnight conquered!</h2><p>You completed all four game styles across five chapters.</p><button class="btn" data-action="restart-journey">Play the journey again →</button>`,
    );
  if (next.mode === "race") return playForm("solo", next.stage, "journey");
  return arcadeMenu(next.mode, next.stage, "journey");
}
function journeyProgress() {
  const next = MidnightJourney.current(profile);
  return `<div class="journey-order"><b>ALL FOUR GAMES · 5 CHAPTERS</b><p>Melody → Jump → Maze → Tap Race</p><small>${next ? `Chapter ${next.chapter + 1}/5 · Game ${profile.journeyStep + 1}/20 · Next: ${next.label}` : "All 20 games complete!"}</small></div>`;
}
function home() {
  MidnightArcadeUI.stop();
  MidnightVictory.stop();
  MidnightMusic.setScene("menu");
  view = "home";
  renderKey = "";
  state = null;
  document.documentElement.style.setProperty("--team", colors[profile.team]);
  app.innerHTML = `<div class="shell home-shell">${header()}<main><section class="hero">${landscape()}<div class="hero-copy"><div class="eyebrow">A little spooky. A lot of silly.</div><h1>Midnight<span>Ghost Arcade</span></h1><p>A glowing woodland. Four little spirits.<br>Your kind of Halloween adventure.</p><div class="hero-badge"><b>✦</b> MELODY <b>·</b> JUMP <b>·</b> MAZE <b>·</b> RACE</div></div>${ghost("Mach", "hero-mach")}<div class="hero-caption">MACH · YOUR GHOST FALCON<small>Follow a little moonlight.</small></div></section><div class="section-top"><div><h2>How would you like to play?</h2><p>The Journey takes you through all four games. Quick Play is one standalone game.</p></div><button class="text-btn" data-action="help">How to play →</button></div><section class="play-grid" aria-label="Choose a play mode"><button class="play-card primary" data-action="solo"><span class="card-icon">↟</span><span class="tag">SERIES OF LEVELS</span><h3>${profile.journeyStep ? "Continue Journey" : "Start Journey"}</h3><p>Melody → Jump → Maze → Tap Race. All four games across five chapters. ${profile.journeyStep || 0}/20 complete.</p><span class="arrow">→</span></button><button class="play-card" data-action="quick"><span class="card-icon">✦</span><span class="tag">ONE GAME</span><h3>Quick Play</h3><p>Pick Melody, Jump, Maze, or Tap Race. Choose your difficulty.</p><span class="arrow">→</span></button><div class="play-card friends-card"><span class="card-icon">♧</span><h3>Play with Friends</h3><p>A live tap race. Share a room code.</p><div class="friends-actions"><button class="text-btn" data-action="create">Create room →</button><button class="text-btn" data-action="join">Join room →</button></div></div></section><section class="record-panel"><div><h2>Your high scores</h2><p>Personal bests for every style, saved on this device.</p></div><button class="btn secondary" data-action="highscores">View high scores →</button></section>${teamGallery()}<section class="bottom-grid"><div class="chosen-spirit"><div class="small-heading"><span>YOUR RACING SPIRIT</span><button class="text-btn" data-action="shop">Ghost shop →</button></div><div class="chosen-spirit-preview">${racer(profile.racer, profile.team, profile.hat)}<div><h3>${profile.team}</h3><p>${species[profile.team]}</p><button class="text-btn" data-action="team">Change character →</button></div></div></div><div class="team-box"><div class="small-heading"><span>YOUR PLAYER</span><button class="text-btn" data-action="player-settings">Player settings →</button></div><h3 class="player-name">${esc(profile.name || "Pick a nickname when you start")}</h3><div class="team-progress"><span>◈ ${profile.coins} coins</span><span>♥ ${profile.extraLives} spare lives</span></div><div class="team-progress"><span>Score ${profile.totalScore}</span><span>Team ${profile.points} pts</span></div></div></section></main><footer><span>Made of moonlight & mischief.</span><button class="text-btn" data-action="music-options">Music & volume</button><button class="text-btn" data-action="race-solo">Tap-race course map →</button></footer></div>`;
}
function highScores(mode = "all") {
  const labels = {
      all: "All styles",
      jump: "Jump",
      maze: "Maze",
      rhythm: "Rhythm",
      race: "Tap Race",
    },
    rows = MidnightRecords.top(profile, mode);
  modal(
    `<h2>Your high scores.</h2><p>Saved in this browser. Each run keeps its style, level, score, and time.</p><div class="score-filters">${Object.entries(
      labels,
    )
      .map(
        ([m, label]) =>
          `<button class="text-btn ${mode === m ? "selected" : ""}" data-action="score-filter" data-value="${m}">${label}</button>`,
      )
      .join(
        "",
      )}</div>${rows.length ? `<div class="score-table-wrap"><table class="score-table"><thead><tr><th>#</th><th>Run</th><th>Score</th><th>Time</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${esc(r.name || "You")}</strong><small>${labels[r.mode]} · L${r.level} · ${["Chill", "Spooky", "Fiendish"][r.difficulty || 0]}</small></td><td>${r.score}</td><td>${r.seconds.toFixed(1)}s</td></tr>`).join("")}</tbody></table></div>` : '<p class="empty-scores">Your first high score is waiting. Play a game to set it!</p>'}`,
  );
}
function musicOptions() {
  modal(
    `<h2>Halloween music</h2><p>Home-page themes are separate from all five rhythm-game songs. Listen before choosing your background music.</p><label>HOME-PAGE MUSIC<select id="home-music">${MidnightScore.homeSongs.map((song, i) => `<option value="${i}" ${Number(profile.homeSong) === i ? "selected" : ""}>${song.title} · ${song.artist}</option>`).join("")}</select></label><button type="button" class="text-btn music-preview-toggle">▶ Listen</button><audio class="music-preview" hidden preload="none" controlslist="nodownload" src="${MidnightScore.getHomeSong(profile.homeSong).file}" aria-label="Preview background music"></audio><label for="music-volume">MUSIC VOLUME · <span id="music-volume-value">${Math.round(profile.musicVolume * 100)}%</span></label><input id="music-volume" type="range" min="0" max="100" value="${Math.round(profile.musicVolume * 100)}"><p class="muted">The music button in the top corner mutes all sound.</p><a class="music-credit-link" href="/music-credits.html" target="_blank" rel="noopener">Music credits</a>`,
  );
  $("#home-music").onchange = (e) => {
    profile.homeSong = Number(e.target.value);
    save();
    MidnightMusic.setHomeSong(profile.homeSong);
    const audio = $("dialog audio");
    audio.pause();
    audio.src = MidnightScore.getHomeSong(profile.homeSong).file;
  };
  $("#music-volume").oninput = (e) => {
    profile.musicVolume = Number(e.target.value) / 100;
    save();
    MidnightMusic.setVolume(profile.musicVolume);
    $("#music-volume-value").textContent = e.target.value + "%";
    document
      .querySelectorAll(".music-preview")
      .forEach((a) => (a.volume = profile.musicVolume));
  };
}
function playerSettings() {
  modal(
    `<h2>Your player.</h2><p>Change your nickname or start fresh on this browser.</p><form id="rename-form"><label for="player-nickname">NICKNAME</label><input id="player-nickname" name="name" value="${esc(profile.name)}" maxlength="18" required><div class="actions"><button class="btn" type="submit">Save nickname</button></div></form><button class="btn secondary" data-action="music-options">Music & volume →</button><div class="reset-player-panel"><h3>Start over</h3><p>Reset your player, coins, spare lives, score, and unlocked levels. You can keep your high-score history.</p><button class="btn secondary" data-action="reset-confirm">Reset Player…</button></div>`,
  );
  $("#rename-form").onsubmit = (e) => {
    e.preventDefault();
    profile.name =
      String(new FormData(e.target).get("name") || "")
        .trim()
        .slice(0, 18) || "Grave guest";
    save();
    document.querySelector("dialog").close();
    home();
    toast("Nickname saved.");
  };
}
function confirmPlayerReset() {
  modal(
    `<h2>Reset this player?</h2><p>Your nickname, character choice, coins, spare lives, total score, and level progress will start over on this browser. This cannot be undone.</p><label class="keep-scores"><input type="checkbox" id="reset-keep-scores" checked> Keep my high scores</label><div class="actions"><button class="btn danger" data-action="reset-player">Yes, start over</button><button class="btn secondary" data-action="close">Cancel</button></div>`,
  );
}
function resetPlayer() {
  const keep = $("#reset-keep-scores")?.checked,
    records = keep ? structuredClone(profile.highScores || []) : [],
    mute = profile.mute,
    musicVolume = profile.musicVolume,
    homeSong = profile.homeSong;
  transmit({ type: "leave" });
  state = null;
  myId = null;
  clearTimeout(reconnect);
  if (ws) {
    ws.close();
    ws = null;
  }
  sessionStorage.removeItem("midnight-session");
  sessionStorage.removeItem("midnight-race-mode");
  MidnightArcadeUI.stop();
  MidnightVictory.stop();
  profile = structuredClone(defaults);
  profile.highScores = records;
  profile.mute = mute;
  profile.musicVolume = musicVolume;
  profile.homeSong = homeSong;
  profile.separateMusicPools = true;
  profile.halloweenMusicV2 = true;
  save();
  document.querySelector("dialog")?.remove();
  home();
  toast("A fresh midnight. Your player has been reset.");
}
function journeyPreview() {
  return `<section class="journey-preview"><div><span class="eyebrow">ORIGINAL TAP-RACE COURSES</span><h2>Race you to the Monster Bash.</h2><p>Prefer the original tap challenges? Your race progress is right here.</p></div><button class="btn secondary" data-action="race-solo">${profile.unlockedLevel === 0 ? "Start your journey" : "Continue your journey"} →</button><div class="journey-path">${levels.map((l, i) => `<button class="journey-stop ${i <= profile.unlockedLevel ? "open" : "locked"} ${i === profile.level ? "current" : ""}" data-action="level" data-value="${i}" ${i > profile.unlockedLevel ? "disabled" : ""}><b>${i > profile.unlockedLevel ? "⌑" : l.symbol}</b><span>LEVEL ${i + 1}</span><strong>${l.short}</strong><small>${"★".repeat(profile.levelStars[i] || 0)}${"☆".repeat(3 - (profile.levelStars[i] || 0))}</small></button>`).join("")}</div></section>`;
}
function teamGallery() {
  return `<section class="ghost-gallery"><div class="section-top"><div><h2>Choose your character.</h2><p>Tap a ghost to race as them. Your character also selects your team.</p></div></div><div class="ghost-cards">${Object.keys(
    colors,
  )
    .map(
      (t) =>
        `<button class="ghost-card ${profile.team === t ? "selected" : ""}" aria-pressed="${profile.team === t}" data-action="choose-team" data-value="${t}" style="--spirit:${colors[t]}"><span class="spirit-halo"></span>${ghost(t)}<h3>${t}</h3><span class="ghost-species">${{ Mach: "THE GHOST FALCON", Slink: "THE GHOST SERPENT", Ember: "THE GHOST WOLF", Misty: "THE GHOST BAT" }[t]}</span><p>${traits[t]}</p><small>${profile.team === t ? "PLAYING AS " + t.toUpperCase() + " ✓" : "Choose " + t + " →"}</small></button>`,
    )
    .join("")}</div></section>`;
}
function arcadePreview() {
  return `<section class="arcade-preview"><div class="section-top"><div><h2>A little adventure between midnights.</h2><p>Start with Melody, then explore the candlelit jumping course.</p></div></div><div class="arcade-mode-cards"><button class="arcade-mode-card" data-action="arcade" data-value="rhythm"><span class="arcade-mode-symbol">♪</span><h3>Moonlight Melody</h3><p>Follow the notes through a little Halloween magic.</p><small>ARROWS / TAP · START HERE →</small></button><button class="arcade-mode-card" data-action="arcade" data-value="jump"><span class="arcade-mode-symbol">↟</span><h3>Moonlit Leap</h3><p>Jump through a candlelit graveyard inspired by Día de los Muertos.</p><small>SPACE / TAP · PLAY SECOND →</small></button></div></section>`;
}
function nicknameField() {
  return `<div class="nickname-field">${profile.name ? `<div class="nickname-summary"><span>RACING AS <strong>${esc(profile.name)}</strong></span><button class="text-btn" type="button" data-action="edit-nickname">Change nickname</button></div>` : `<label for="nickname">PICK YOUR NICKNAME · WE’LL REMEMBER IT</label><input id="nickname" name="name" maxlength="18" placeholder="Grave guest" autocomplete="nickname" required>`}</div>`;
}
function arcadeHub(level = profile.arcadeLevel || 0, playMode = "adventure") {
  const target =
    playMode === "quick"
      ? 0
      : Math.max(0, Math.min(profile.arcadeUnlocked || 0, level));
  modal(
    `<h2>${playMode === "quick" ? "Quick Play · one game." : "Adventure · Level " + (target + 1)}</h2><p>${playMode === "quick" ? "Choose one standalone game. You still earn coins and score." : "You’re playing a series. Choose a style for this level; a win opens the next."}</p><div class="style-hub">${[
      ["rhythm", "♪ Moonlight Melody · hit the notes"],
      ["jump", "↟ Moonlit Leap · Día de los Muertos"],
      ["maze", "⌘ Ghostlight Maze · collect & escape"],
    ]
      .map(
        ([m, label]) =>
          `<button class="btn ${m !== "rhythm" ? "secondary" : ""}" data-action="arcade" data-value="${m}" data-level="${target}" data-play-mode="${playMode}">${label}</button>`,
      )
      .join(
        "",
      )}<button class="btn secondary" data-action="hub-race" data-level="${Math.min(3, target)}" data-play-mode="${playMode}">✦ Tap Race · quick challenges</button></div>`,
  );
}
function arcadeMenu(
  mode = "rhythm",
  level = profile.arcadeLevel || 0,
  playMode = "adventure",
) {
  if (!["jump", "maze", "rhythm"].includes(mode)) return;
  const stage =
    playMode === "quick"
      ? ["rhythm", "maze"].includes(mode)
        ? Math.max(0, Math.min(4, level))
        : 0
      : Math.max(
          0,
          Math.min(
            playMode === "journey" ? 4 : profile.arcadeUnlocked || 0,
            level,
          ),
        );
  music();
  const title = {
      jump: "Moonlit Leap",
      maze: "Ghostlight Maze",
      rhythm: "Moonlight Melody",
    }[mode],
    description = {
      jump: "Run forward through the woods and jump over obstacles. Space or the Jump button.",
      maze: "Collect the candy, avoid woodland creatures, and enter the glowing house. Arrows / WASD or swipe.",
      rhythm:
        "Hit each glowing note on the line, in time with the Halloween melody. Use the matching arrow keys (← ↓ ↑ →), or touch arrows on your phone. Five levels, five different Halloween instrumentals.",
    }[mode];
  modal(
    `<div class="play-mode-label">${playMode === "quick" ? "QUICK PLAY · ONE STANDALONE GAME" : "ADVENTURE · SERIES OF LEVELS"}</div><h2>${title}</h2><p>${description}</p>${playMode === "journey" ? journeyProgress() : ""}${
      mode === "rhythm"
        ? `<ol class="rhythm-song-list">${MidnightScore.songs
            .map(
              (song, i) =>
                `<li><button type="button" class="song-choice ${i === stage ? "selected" : ""}" data-song="${i}" aria-pressed="${i === stage}" ${playMode !== "quick" ? "disabled" : ""}><b>${i + 1}. ${song.title}</b><span>${song.mood}</span><small>${song.tempo} BPM · ${MidnightScore.lanesFor(
                  i,
                )
                  .map((k) => MidnightScore.arrows[k])
                  .join(
                    " ",
                  )}</small></button><button type="button" class="text-btn music-preview-toggle">▶ Listen</button><audio class="music-preview" hidden preload="none" controlslist="nodownload" src="${song.file}" aria-label="Listen to ${song.title}"></audio></li>`,
            )
            .join(
              "",
            )}</ol><a class="music-credit-link" href="/music-credits.html" target="_blank" rel="noopener">Music credits</a>`
        : ""
    }${mode === "maze" ? `<div class="maze-scene-preview"><img id="maze-scene-image" src="${MidnightArcadeUI.mazeScenes[stage].asset}" alt="${MidnightArcadeUI.mazeScenes[stage].name}"><b id="maze-scene-name">${MidnightArcadeUI.mazeScenes[stage].name}</b><p id="maze-scene-description">${MidnightArcadeUI.mazeScenes[stage].description || "Follow the woodland glow to the Monster Bash."}</p></div>` : ""}<form id="arcade-form">${characterPicker()}${nicknameField()}<div class="arcade-options">${playMode === "journey" ? `<input type="hidden" name="stage" value="${stage}">` : playMode === "quick" && !["rhythm", "maze"].includes(mode) ? '<input type="hidden" name="stage" value="0">' : `<label>${mode === "rhythm" ? "SONG" : "LEVEL"}<select name="stage">${Array.from({ length: playMode === "quick" ? 5 : Math.min(4, profile.arcadeUnlocked || 0) + 1 }, (_, i) => `<option value="${i}" ${stage === i ? "selected" : ""}>${mode === "rhythm" ? "Song" : "Level"} ${i + 1}${mode === "rhythm" ? " · " + MidnightScore.getSong(i).title : mode === "maze" ? " · " + MidnightArcadeUI.mazeScenes[i].name : ""}</option>`).join("")}</select></label>`}<label>DIFFICULTY<select name="difficulty"><option value="0">Chill · start easy</option><option value="1">Spooky · a little faster</option><option value="2">Fiendish · a real challenge</option></select></label></div><div class="actions"><button class="btn" type="submit">${playMode === "quick" ? (mode === "rhythm" ? "Play selected song" : "Play this game") : "Start this adventure level"} →</button></div></form>`,
  );
  if (mode === "rhythm" && playMode === "quick") {
    const select = $("#arcade-form select[name=stage]");
    const choose = (index) => {
      select.value = String(index);
      document.querySelectorAll("[data-song]").forEach((b) => {
        const chosen = Number(b.dataset.song) === Number(index);
        b.classList.toggle("selected", chosen);
        b.setAttribute("aria-pressed", String(chosen));
      });
    };
    document
      .querySelectorAll("[data-song]")
      .forEach((b) => (b.onclick = () => choose(b.dataset.song)));
    select.onchange = () => choose(select.value);
  }
  if (mode === "maze" && $("#arcade-form select[name=stage]"))
    $("#arcade-form select[name=stage]").onchange = (e) => {
      const scene = MidnightArcadeUI.mazeScenes[Number(e.target.value)];
      $("#maze-scene-image").src = scene.asset;
      $("#maze-scene-image").alt = scene.name;
      $("#maze-scene-name").textContent = scene.name;
      $("#maze-scene-description").textContent =
        scene.description || "Follow the woodland glow to the Monster Bash.";
    };
  $("#arcade-form").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      team = f.get("character");
    if (!names.includes(team)) return;
    profile.team = team;
    profile.racer = names.indexOf(team);
    profile.name =
      String(f.get("name") || profile.name || "Grave guest")
        .trim()
        .slice(0, 18) || "Grave guest";
    profile.chosen = true;
    save();
    document.querySelector("dialog").close();
    MidnightArcadeUI.launch(
      mode,
      Number(f.get("stage")),
      Number(f.get("difficulty")),
      playMode,
    );
  };
}
function levelMap() {
  music();
  modal(
    `<h2>Your midnight journey.</h2><p>Each level is a short race. Level 1 takes 5 easy taps; later levels add more challenges and speed. Earn a podium place to open the next gate.</p><div class="level-list">${levels.map((l, i) => `<button class="level-row" data-action="level" data-value="${i}" ${i > profile.unlockedLevel ? "disabled" : ""}><b>${i > profile.unlockedLevel ? "⌑" : i + 1}</b><span><strong>${l.name}</strong><small>${i > profile.unlockedLevel ? "Complete the previous level to unlock." : l.description}</small></span><em>${"★".repeat(profile.levelStars[i] || 0)}${i <= profile.unlockedLevel ? " →" : ""}</em></button>`).join("")}</div>`,
  );
}
function modal(content) {
  document.querySelectorAll("dialog audio").forEach((a) => a.pause());
  MidnightMusic.setPreviewing(false);
  document.querySelector("dialog")?.remove();
  const d = document.createElement("dialog");
  d.innerHTML = `<button class="close" data-action="close" aria-label="Close dialog">×</button>${content}`;
  document.body.append(d);
  d.showModal();
  const previews = [...d.querySelectorAll("audio.music-preview")];
  previews.forEach((audio) => {
    const toggle = audio.previousElementSibling;
    toggle.onclick = () => {
      if (audio.paused)
        audio
          .play()
          .catch(() => toast("Tap Listen again to start the preview."));
      else audio.pause();
    };
    audio.volume = profile.musicVolume;
    audio.onplay = () => {
      toggle.textContent = "Ⅱ Pause preview";
      previews.forEach((a) => {
        if (a !== audio) a.pause();
      });
      MidnightMusic.setPreviewing(true);
    };
    const resume = () => {
      toggle.textContent = "▶ Listen";
      MidnightMusic.setPreviewing(previews.some((a) => !a.paused && !a.ended));
    };
    audio.onpause = resume;
    audio.onended = resume;
  });
  d.addEventListener("close", () => {
    previews.forEach((a) => a.pause());
    MidnightMusic.setPreviewing(false);
  });
  d.addEventListener("click", (e) => {
    if (e.target === d) d.close();
  });
  return d;
}
function help(first = false) {
  modal(
    `<div style="font-size:35px;margin-bottom:13px">☾ ✦</div><h2>Dead simple.</h2><p>Tap the right thing, fast. Every correct tap moves your ghost forward. Grab items to mess with your friends. First to the party wins!</p><p>Each challenge has one instruction. Miss one? Pull yourself together and try the next. Earn an item every 3 correct taps from Level 2.</p><p>Solo starts with 3 hearts. A missed challenge costs a heart. Spare lives save you when your hearts run out; earn one every 2,500 score points or buy one for 200 coins. You can carry up to 3 spare lives.</p><div class="actions"><button class="btn" data-action="help-done">Let’s make some mischief →</button>${first ? '<button class="btn secondary" data-action="help-done">Skip</button>' : ""}</div>`,
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
    `<h2>The costume cupboard.</h2><p>Looking dead good. ◈ ${profile.coins} coins<br>Dress your ghost or stock up on extra lives.</p><div class="life-shop"><div><strong>♥ Extra life</strong><small>You have ${profile.extraLives} spare lives. One is used automatically when your hearts run out.</small></div><button class="btn" data-action="buy-life" ${profile.extraLives >= MidnightEconomy.maxSpareLives ? "disabled" : ""}>◈ 200 · Buy</button></div><p class="life-shop-hint">Earn a free spare life every 2,500 score points (maximum 3 spares). ${MidnightEconomy.scorePerLife - (profile.totalScore % MidnightEconomy.scorePerLife)} points until your next one.</p><div class="shop-list">${[
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
function characterPicker() {
  return `<fieldset class="character-picker"><legend>CHOOSE YOUR CHARACTER</legend><div class="character-options">${names.map((t) => `<label class="character-option" style="--spirit:${colors[t]}"><input type="radio" name="character" value="${t}" ${profile.team === t ? "checked" : ""} required><span class="character-preview">${ghost(t)}</span><strong>${t}</strong><small>${species[t]}</small><span class="character-selected" aria-hidden="true">Selected ✓</span></label>`).join("")}</div></fieldset>`;
}
function playForm(mode, level = profile.level, context = "adventure") {
  if (mode === "solo") {
    racePlayMode = context;
    sessionStorage.setItem("midnight-race-mode", context);
    profile.level = Math.max(0, Math.min(profile.unlockedLevel, level));
    save();
  }
  music();
  modal(
    `<h2>${{ solo: "Your midnight awaits.", create: "Invite your favorite ghouls.", join: "Secret knock?" }[mode]}</h2><p>${mode === "solo" ? `Level ${profile.level + 1} · ${levels[profile.level].name}. You and three delightfully unreliable rivals.` : mode === "create" ? "Create a room, share its four-letter code, then race together." : "Enter the four-letter code from your host."}</p><form id="play-form">${characterPicker()}${nicknameField()}${mode === "join" ? '<label for="room-code">ROOM CODE</label><input id="room-code" name="code" pattern="[A-Za-z]{4}" maxlength="4" required placeholder="ABCD" style="text-transform:uppercase;letter-spacing:6px" autocomplete="off">' : ""}${context === "journey" ? journeyProgress() : ""}<p id="character-choice-summary" class="character-choice-summary" role="status" aria-live="polite">${profile.team} selected · ${species[profile.team]}</p><div class="actions"><button class="btn" type="submit">${mode === "solo" ? "Let’s race →" : mode === "create" ? "Create room →" : "Join the party →"}</button></div></form>`,
  );
  $("#play-form").onchange = (e) => {
    if (e.target.name === "character")
      $("#character-choice-summary").textContent =
        `${e.target.value} selected · ${species[e.target.value]}`;
  };
  $("#play-form").onsubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const character = form.get("character");
    if (!names.includes(character)) return;
    profile.team = character;
    profile.racer = names.indexOf(character);
    profile.chosen = true;
    profile.name =
      String(form.get("name") || profile.name || "Grave guest")
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
      extraLives: profile.extraLives,
      score: profile.totalScore,
    };
    e.target.querySelector('button[type="submit"]').disabled = true;
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
      const b = $('#play-form button[type="submit"]');
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
      successStreak = m.ok ? successStreak + 1 : 0;
      const text = m.lifeBonus
        ? "2,500 points—bonus life! Spooktacular!"
        : m.lifeSaved
          ? "A spare life saved your glow! Keep going."
          : m.ok
            ? successStreak >= 3 && successStreak % 3 === 0
              ? `${successStreak} in a row—spellbinding!`
              : goodWords[goodCursor++ % goodWords.length]
            : m.reason === "early"
              ? "Not yet! Wait for the flame to go out, then tap once."
              : m.reason === "timeout"
                ? timeoutWords[missCursor++ % timeoutWords.length]
                : missWords[missCursor++ % missWords.length];
      lastFeedback = { id: state?.challenge?.id, ok: m.ok, text };
      if ($("#race-status")) {
        $("#race-status").textContent = text;
        $("#race-status").className =
          "status-line " + (m.ok ? "encouraging" : "gentle-nudge");
      }
      if ($("#response-feedback")) $("#response-feedback").textContent = text;
    }
    if (m.type === "state") {
      state = m;
      const self = m.players.find((p) => p.id === myId);
      if (
        m.solo &&
        self &&
        Number.isFinite(self.totalScore) &&
        Number.isFinite(self.reserveLives) &&
        (profile.totalScore !== self.totalScore ||
          profile.extraLives !== self.reserveLives)
      ) {
        profile.totalScore = self.totalScore;
        profile.extraLives = self.reserveLives;
        save();
      }
      if (m.started && m.started !== raceFeedbackId) {
        raceFeedbackId = m.started;
        successStreak = 0;
        lastFeedback = null;
      }
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
      const b = $('#play-form button[type="submit"]');
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
          `<div class="lobby-player">${racer(p.racer, p.team)}<div><strong>${esc(p.name)} ${p.id === myId ? "(you)" : ""}</strong><small>Team ${p.team} · ${species[p.team]}</small></div><b>${!p.online ? "ASLEEP" : p.id === state.host ? "HOST" : p.ready ? "READY" : "GETTING READY"}</b></div>`,
      )
      .join(
        "",
      )}</div><label><input id="bots" type="checkbox" ${state.bots ? "checked" : ""} ${host ? "" : "disabled"} style="width:auto"> Fill empty seats with computer racers</label><div class="actions">${host ? '<button class="btn" data-action="start">Start the midnight dash →</button>' : `<button class="btn" data-action="ready">${me().ready ? "Not ready yet" : "I’m ready →"}</button>`}</div><p class="muted" style="font-size:11px;margin-top:15px">Up to 6 players. Stay on this screen until the host starts.</p></main>`,
  );
  $("#bots").onchange = (e) =>
    transmit({ type: "bots", value: e.target.checked });
}
function raceView() {
  MidnightMusic.setScene("race", state.level);
  view = "race";
  hudKey = "";
  const c = state.challenge;
  const behind = state.players[0].progress - me().progress > 16;
  roundHint = behind
    ? catchupWords[catchupCursor++ % catchupWords.length]
    : "One tap per round. You’ve got this!";
  gameFrame(
    `<div class="race-top"><span>${state.solo ? `${racePlayMode === "quick" ? "QUICK PLAY" : "ADVENTURE"} · LEVEL ${state.level + 1} · ${levels[state.level].short.toUpperCase()}` : `ROOM ${state.code}`} · TEAM ${me().team.toUpperCase()}</span><button class="text-btn" data-action="leave">Leave race →</button></div><aside id="live-race-hud" class="live-race-hud" aria-label="Live race positions"></aside>${state.solo ? '<div id="life-bar" class="life-bar" aria-live="polite"></div>' : ""}<details class="full-track" ${fullTrackOpen ? "open" : ""}><summary>Full race track <span>Show / hide</span></summary><div class="track course-${state.level}">${landscape()}<div class="track-lanes">${[
      ...state.players,
    ]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(
        (p) =>
          `<div class="lane"><div class="runner" id="runner-${p.id}"><span class="runner-name">${esc(p.name)}${p.id === myId ? " · YOU" : ""}</span>${racer(p.racer, p.team, p.id === myId ? profile.hat : "")}</div></div>`,
      )
      .join(
        "",
      )}</div></div></details><section class="race-panel level-${state.level}">${state.phase === "countdown" ? `<div style="display:flex;justify-content:center">${ghost(me().team)}</div><div class="countdown" id="countdown">3</div><p class="instruction">Tap the right thing. First to the party wins.</p>` : `<div class="round-meta"><span>ROUND ${c.round + 1} · ${levels[state.level].finishHits} CORRECT TAPS TO FINISH</span><span id="race-time"></span></div><h2>${titles[c.kind]}</h2><p class="instruction">${instructions[c.kind]}</p><div class="timer"><div id="timer-fill"></div></div><div class="choices ${c.kind === 1 || c.kind === 2 ? "single" : ""}">${c.choices.map((v, i) => `<button class="choice ${c.kind === 1 ? "bat-target" : ""} ${c.kind === 3 && c.still !== i ? "rattle" : ""} ${v === "ghost-odd" ? "odd" : ""}" data-action="answer" data-value="${i}" aria-label="${c.kind === 4 ? v + " pieces of candy" : v === "ghost-odd" ? "Tilted ghost" : v}">${c.kind === 4 ? `<span style="display:flex;flex-wrap:wrap;justify-content:center;max-width:110px;margin:auto">${spookyIcon("candy").repeat(v)}</span>` : spookyIcon(v)}</button>`).join("")}</div><div id="response-feedback" class="response-feedback" aria-live="polite"></div><div id="obstacle"></div>`}</section><div class="item-bar"><div><span id="position">4th place</span><small id="item-hint">Every 3 correct taps earns an item.</small></div><button class="item-button" data-action="item" disabled>✧ Empty item slot</button></div><div class="status-line" id="race-status">${roundHint}</div>`,
  );
  lastChallenge = c?.id;
}
function updateLiveHud() {
  const hud = $("#live-race-hud");
  if (!hud) return;
  const key =
    state.phase +
    state.players
      .map((p) => p.id + Math.floor(p.progress) + p.online + p.eliminated)
      .join("|");
  if (key === hudKey) return;
  hudKey = key;
  const leader = state.players[0],
    place = state.players.findIndex((p) => p.id === myId) + 1;
  hud.innerHTML = `<div class="hud-heading"><strong>${leader.progress === 0 ? "Ready to race!" : leader.id === myId ? "You’re in the lead!" : "Leading: " + esc(leader.name)}</strong><span>You: ${ordinal(place)}</span></div><ol class="hud-order" style="--racers:${state.players.length}">${state.players.map((p, i) => `<li class="hud-player ${p.id === myId ? "hud-you" : ""}" title="${esc(p.name)} · Team ${p.team}"><div><b>${i + 1}</b>${ghost(p.team)}</div><strong>${p.id === myId ? "YOU" : esc(p.name)}</strong><span class="hud-progress"><i style="width:${p.progress}%;background:${colors[p.team]}"></i></span><small>${p.eliminated ? "Out" : Math.round(p.progress) + "%"}</small></li>`).join("")}</ol>`;
}
document.addEventListener(
  "toggle",
  (e) => {
    if (e.target.matches?.(".full-track")) fullTrackOpen = e.target.open;
  },
  true,
);
function updateTrack() {
  updateLiveHud();
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
    const bird = $("#runner-" + p.id + " .racer-art");
    bird?.classList.add("delivering");
    setTimeout(() => bird?.classList.remove("delivering"), 750);
  }
  heldItem = p.item;
  const hearts = $("#life-bar");
  const lifeKey = [p.lives, p.totalScore, p.reserveLives].join("/");
  if (hearts && hearts.dataset.key !== lifeKey) {
    hearts.dataset.key = lifeKey;
    hearts.innerHTML = `<span class="hearts" aria-label="${p.lives} hearts remaining">${"♥".repeat(p.lives)}<span>${"♡".repeat(3 - p.lives)}</span></span><span>Score <b>${p.totalScore}</b><small>${MidnightEconomy.scorePerLife - (p.totalScore % MidnightEconomy.scorePerLife)} to a bonus life</small></span><span>♥ ${p.reserveLives}<small>spare lives</small></span>`;
  }
  $("#position").textContent =
    `${ordinal(state.players.indexOf(p) + 1)} place · ${Math.round(p.progress)}%`;
  const b = $('[data-action="item"]');
  b.textContent =
    state.level === 0
      ? "✧ Items start in Level 2"
      : p.item
        ? `${itemSymbols[p.item]} ${p.item} →`
        : "✧ Empty item slot";
  b.disabled =
    !p.item || state.phase !== "race" || p.blockedUntil > now || p.stones > 0;
  $("#item-hint").textContent =
    state.level === 0
      ? "Level 1: five easy taps. Items join the fun in Level 2."
      : p.item
        ? "A little magical trouble is ready. Tap to use it!"
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
    $("#stone-count").textContent = `Tap to smash it. ${p.stones} taps left.`;
  } else if (blocked) {
    obstacle.innerHTML = `<div class="overlay ${p.effect === "Sunrise" ? "sun-hit" : p.effect === "Brain Freeze" ? "ice-hit" : ""}"><div style="font-size:45px">${p.effect === "Sunrise" ? "☀" : p.effect === "Brain Freeze" ? "❄" : "🦴"}</div><h2>${p.effect === "Sunrise" ? "Too bright!" : p.effect === "Brain Freeze" ? "Brain freeze!" : "A little ghostly wobble!"}</h2><p>${p.effect === "Stumble" ? lastFeedback?.text || "A fresh chance is coming." : "Back in " + Math.max(1, Math.ceil((p.blockedUntil - now) / 1000)) + "s"}</p></div>`;
  } else obstacle.innerHTML = "";
  const response = lastFeedback?.id === c.id ? lastFeedback : null;
  $("#race-status").textContent = response ? response.text : roundHint;
  $("#race-status").className =
    "status-line " +
    (response ? (response.ok ? "encouraging" : "gentle-nudge") : "");
  const line = $("#response-feedback");
  if (line) {
    line.textContent = response
      ? response.text +
        (state.nextChallengeAt
          ? " Next challenge…"
          : answered
            ? " Waiting for the other racers…"
            : "")
      : "";
    line.className = "response-feedback " + (response?.ok ? "encouraging" : "");
  }
}
function ordinal(n) {
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n] || "th");
}
function finish() {
  view = "finished";
  const p = me(),
    place = state.players.indexOf(p) + 1,
    winner = state.players[0],
    elapsed = ((winner.finish || state.finishedAt) - state.started) / 1000,
    won = place === 1;
  let coins = p.eliminated ? 10 : [80, 55, 40, 30, 25, 20][place - 1] || 20;
  let raceBest = false;
  const rewardKey = state.code + state.started;
  if (lastReward !== rewardKey && !profile.awarded.includes(rewardKey)) {
    lastReward = rewardKey;
    profile.awarded.push(rewardKey);
    profile.awarded = profile.awarded.slice(-100);
    raceBest = MidnightRecords.record(profile, {
      id: rewardKey,
      mode: "race",
      name: profile.name,
      character: profile.team,
      level: state.level + 1,
      difficulty: 0,
      score: p.runScore || p.correct * 100,
      seconds: Number.isFinite(elapsed) ? elapsed : 0,
      won,
    });
    profile.coins += coins;
    profile.points += Math.max(5, 50 - (place - 1) * 10);
    if (state.solo) {
      awardMidnightLevel(profile, state.level, place, p.correct);
      if (
        racePlayMode === "journey" &&
        !p.eliminated &&
        p.correct >= levels[state.level].finishHits
      )
        MidnightJourney.complete(profile, "race", state.level);
      if (racePlayMode !== "quick" && place <= 3 && p.correct >= 5) {
        profile.arcadeUnlocked = Math.max(
          profile.arcadeUnlocked || 0,
          Math.min(4, state.level + 1),
        );
        profile.arcadeLevel = Math.min(4, state.level + 1);
      }
    }
    if (state.solo && won && elapsed > 0)
      profile.best = profile.best ? Math.min(profile.best, elapsed) : elapsed;
    save();
  }
  const top = state.players.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  gameFrame(
    `<main class="result"><div class="eyebrow" style="justify-content:center">${won ? "Fashionably dead. Right on time." : "The party waits for no ghost."}</div>${ghost(p.eliminated ? p.team : winner.team, "victory-spirit")}<h1>${p.eliminated ? "Out of glow!" : won ? "You made an entrance!" : `${esc(winner.name)} wins!`}</h1><p class="muted" style="font-size:13px;margin-top:12px">${p.eliminated ? "Your hearts ran out. Retry with three fresh hearts, or stock up on spare lives in the shop." : won ? "Team " + p.team + " is raising the roof." : `You finished ${ordinal(place)}. There’s always another midnight.`}</p>${!won && winner.progress - p.progress < 7 ? '<p style="color:#f2a04e;margin-top:10px">SO CLOSE!</p>' : ""}${raceBest ? '<p class="personal-best">★ NEW PERSONAL HIGH SCORE</p>' : ""}<div class="podium">${order.map((x) => `<div class="podium-place ${state.players.indexOf(x) > 0 ? "podium-disappointed" : "podium-proud"}">${state.players.indexOf(x) > 0 ? `<small class="podium-thought">${state.players.indexOf(x) === 1 ? "So close…" : "Next midnight…"}</small>` : ""}${racer(x.racer, x.team, x.id === myId ? profile.hat : "")}<strong>${ordinal(state.players.indexOf(x) + 1)}</strong><span>${esc(x.name)}</span></div>`).join("")}</div><div class="result-rewards"><div>◈ +${coins}<small>COINS EARNED</small></div><div>✦ +${Math.max(5, 50 - (place - 1) * 10)}<small>TEAM POINTS</small></div><div>${Number.isFinite(elapsed) && elapsed > 0 ? elapsed.toFixed(1) + "s" : "2:00"}<small>${p.eliminated ? "RUN TIME" : "WINNING TIME"}</small></div></div>${state.solo ? `<div class="level-result"><span>${"★".repeat(profile.levelStars[state.level] || 0)}${"☆".repeat(3 - (profile.levelStars[state.level] || 0))}</span><p>${profile.levelStars[state.level] ? (state.level === 3 ? "You made it through every gate. The Monster Bash is yours!" : `Next gate open: ${levels[state.level + 1].name}`) : "Place in the top three with 5 correct taps to open the next gate."}</p></div>` : ""}<div class="actions" style="max-width:580px;margin:15px auto">${state.solo && racePlayMode === "journey" && !p.eliminated && p.correct >= levels[state.level].finishHits ? '<button class="btn" data-action="journey-next">Continue journey →</button>' : ""}${state.solo && racePlayMode !== "quick" && racePlayMode !== "journey" && state.level < 3 && profile.unlockedLevel > state.level ? '<button class="btn" data-action="next-level">Next level →</button>' : ""}${state.host === myId ? '<button class="btn" data-action="rematch">One more midnight →</button>' : '<p class="muted">Waiting for the host to rematch…</p>'}<button class="btn secondary" data-action="leave">Back home</button></div></main>`,
  );
  sound(won);
  if (won) confetti();
  if (!p.eliminated)
    MidnightVictory.play(
      winner.team,
      document.querySelector(".victory-spirit"),
    );
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
  home();
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const action = b.dataset.action,
    value = b.dataset.value;
  if (action !== "mute") music();
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
  if (action === "solo") return journeyMenu();
  if (action === "journey-next") {
    leave();
    return journeyMenu();
  }
  if (action === "restart-journey") {
    profile.journeyStep = 0;
    save();
    return journeyMenu();
  }
  if (action === "quick") {
    if (state) leave();
    return arcadeHub(0, "quick");
  }
  if (action === "highscores") return highScores();
  if (action === "score-filter") return highScores(value);
  if (action === "music-options") return musicOptions();
  if (action === "player-settings") return playerSettings();
  if (action === "reset-confirm") return confirmPlayerReset();
  if (action === "reset-player") return resetPlayer();
  if (action === "race-solo") return levelMap();
  if (action === "arcade")
    return arcadeMenu(
      value,
      Number(b.dataset.level ?? profile.arcadeLevel ?? 0),
      b.dataset.playMode || "adventure",
    );
  if (action === "hub-race") {
    document.querySelector("dialog")?.close();
    return playForm(
      "solo",
      Math.min(profile.unlockedLevel, Number(b.dataset.level) || 0),
      b.dataset.playMode || "quick",
    );
  }
  if (action === "edit-nickname") {
    const field = b.closest(".nickname-field");
    field.innerHTML = `<label for="nickname">YOUR NICKNAME</label><input id="nickname" name="name" value="${esc(profile.name)}" maxlength="18" autocomplete="nickname" required>`;
    field.querySelector("input").focus();
    return;
  }
  if (action === "level") {
    const level = Number(value);
    if (level > profile.unlockedLevel) return;
    return playForm("solo", level);
  }
  if (action === "next-level") {
    const next = state.level + 1;
    leave();
    return arcadeHub(next, "adventure");
  }
  if (["create", "join"].includes(action)) return playForm(action);
  if (action === "racer") {
    profile.racer = Number(value);
    profile.team = names[profile.racer];
    save();
    home();
    toast(`${names[profile.racer]} · ${personal[profile.racer]}`);
    return;
  }
  if (action === "team") return teamMenu();
  if (action === "pick-team" || action === "choose-team") {
    profile.team = value;
    profile.racer = names.indexOf(value);
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
    profile.racer = names.indexOf(profile.team);
    profile.chosen = true;
    save();
    document.querySelector("dialog").close();
    home();
    confetti();
    return toast(`The pumpkin has spoken. Team ${profile.team}!`);
  }
  if (action === "shop") return shop();
  if (action === "buy-life") {
    if (profile.extraLives >= MidnightEconomy.maxSpareLives) return;
    if (profile.coins < MidnightEconomy.lifePrice)
      return toast("An extra life costs 200 coins. Earn more by racing!");
    profile.coins -= MidnightEconomy.lifePrice;
    profile.extraLives++;
    save();
    home();
    shop();
    toast("One extra life added to your stash!");
    return;
  }
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
                '<small class="candle-label candle-ready">FLAME OUT · TAP ONCE!</small>'
              : spookyIcon("candle") +
                '<small class="candle-label">WAIT… FLAME IS STILL LIT</small>';
          el.setAttribute(
            "aria-label",
            now >= c.extinguish
              ? "Flame out. Tap once now."
              : "Wait. The flame is still burning. Do not tap yet.",
          );
        }
      }
    }
  }
  requestAnimationFrame(animate);
}
MidnightMusic.setMuted(profile.mute);
MidnightMusic.setVolume(profile.musicVolume);
MidnightMusic.setHomeSong(profile.homeSong);
home();
requestAnimationFrame(animate);
if (sessionStorage.getItem("midnight-session")) connect();
else if (!profile.tutorial)
  setTimeout(() => {
    if (view === "home" && !document.querySelector("dialog[open]")) help(true);
  }, 500);
