const crypto = require("node:crypto");
const LIFE = require("./public/economy");
const LEVELS = require("./public/levels");
const TEAMS = ["Mach", "Slink", "Ember", "Misty"];
const RACERS = [...TEAMS];
const ITEMS = [
  "Arm Toss",
  "Sugar Rush",
  "Tombstone Drop",
  "Brain Freeze",
  "Sunrise",
];
function raceSettings(levelId = 0, difficulty = 0) {
  const level = LEVELS[levelId] || LEVELS[0];
  const d = Math.max(0, Math.min(2, Math.floor(Number(difficulty)) || 0));
  const factor = [1, 0.82, 0.65][d];
  const floor = Math.max(2200, Math.round(level.floor * factor));
  return {
    ...level,
    difficulty: d,
    floor,
    pace: Math.max(floor, Math.round(level.pace * factor)),
    finishHits: level.finishHits + d * 3,
    botDelay: level.botDelay * [1, 0.8, 0.6][d],
    botMiss: Math.max(0.03, level.botMiss - d * 0.08),
    kinds: d ? Array.from({ length: 12 }, (_, i) => i) : level.kinds,
  };
}
function challengeOrder(
  levelId,
  difficulty = 0,
  random = Math.random,
  previous = null,
  tutorial = false,
) {
  const order = [...raceSettings(levelId, difficulty).kinds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (tutorial) {
    const at = order.indexOf(0);
    [order[0], order[at]] = [order[at], order[0]];
  } else if (order[0] === previous && order.length > 1)
    [order[0], order[1]] = [order[1], order[0]];
  return order;
}
function challenge(
  round,
  now,
  random = Math.random,
  levelId = null,
  order = null,
  difficulty = 0,
) {
  const level = Number.isInteger(levelId)
    ? raceSettings(levelId, difficulty)
    : null;
  const pool = order || level?.kinds;
  const kind = pool ? pool[round % pool.length] : round % 12;
  const duration = level
    ? Math.max(level.floor, level.pace - round * 18)
    : Math.max(2500, 3400 - round * 20);
  let choices, answer;
  const pick = (n) => Math.floor(random() * n);
  if (kind === 0) {
    choices = Array.from({ length: 6 }, () =>
      random() < 0.5 ? "pumpkin" : "skull",
    );
    if (levelId === 0 && difficulty === 0)
      choices = ["pumpkin", "pumpkin", "skull"].sort(() => random() - 0.5);
    else {
      if (difficulty === 2) choices = Array(6).fill("skull");
      choices[pick(6)] = "pumpkin";
    }
    answer = choices
      .map((v, i) => (v === "pumpkin" ? i : -1))
      .filter((i) => i >= 0);
  }
  if (kind === 1) {
    choices = ["bat"];
    answer = [0];
  }
  if (kind === 2) {
    choices = ["candle"];
    answer = [0];
  }
  if (kind === 3) {
    choices = ["door", "door", "door"];
    answer = [pick(3)];
  }
  if (kind === 4) {
    choices = (
      difficulty > 0 || levelId > 0
        ? [1 + pick(3), 4 + pick(2), 6 + pick(3)]
        : [2, 4, 6]
    ).sort(() => random() - 0.5);
    answer = [choices.indexOf(Math.max(...choices))];
  }
  if (kind === 5) {
    choices = Array(6).fill("ghost");
    const at = pick(6);
    choices[at] = "ghost-odd";
    answer = [at];
  }
  const targets = {
    6: ["moon", "sun", "star"],
    7: ["potion-blue", "potion-orange", "potion-green"],
    8: ["web", "spider", "web", "web"],
    9: ["tombstone", "ghost", "tombstone"],
    10: ["lantern-off", "lantern-lit", "lantern-off"],
    11: ["bone", "candy-corn", "bone", "candy-corn"],
  };
  const winning = {
    6: "moon",
    7: "potion-blue",
    8: "spider",
    9: "ghost",
    10: "lantern-lit",
    11: "candy-corn",
  };
  if (difficulty > 0 || levelId > 0) {
    if (kind === 6) winning[6] = ["moon", "sun", "star"][pick(3)];
    if (kind === 7)
      winning[7] = ["potion-blue", "potion-orange", "potion-green"][pick(3)];
  }
  if (targets[kind]) {
    choices = [...targets[kind]];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = pick(i + 1);
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    answer = choices
      .map((v, i) => (v === winning[kind] ? i : -1))
      .filter((i) => i >= 0);
  }
  return {
    id: crypto.randomUUID(),
    kind,
    target: winning[kind],
    choices,
    answer,
    round,
    opens: now,
    closes: now + duration,
    extinguish: now + 1100 + pick(500),
  };
}
function player(name, racer, team, bot = false) {
  return {
    id: crypto.randomUUID(),
    name:
      String(name || "Grave guest")
        .trim()
        .slice(0, 18) || "Grave guest",
    racer: TEAMS.indexOf(TEAMS.includes(team) ? team : "Mach"),
    team: TEAMS.includes(team) ? team : "Mach",
    bot,
    online: true,
    ready: bot,
    progress: 0,
    correct: 0,
    item: null,
    blockedUntil: 0,
    stones: 0,
    answered: null,
    finish: null,
    lives: 3,
    reserveLives: 0,
    totalScore: 0,
    runScore: 0,
    bonusLivesEarned: 0,
    eliminated: false,
    lifeSaved: false,
  };
}
function rank(room) {
  return [...room.players].sort(
    (a, b) =>
      Number(a.eliminated) - Number(b.eliminated) ||
      (a.finish ?? Infinity) - (b.finish ?? Infinity) ||
      b.progress - a.progress,
  );
}
function awardItem(p, room, random = Math.random) {
  const pos = rank(room).indexOf(p);
  const pool =
    pos < 2
      ? ITEMS.slice(0, 2)
      : pos >= room.players.length - 2
        ? ITEMS
        : ITEMS.slice(0, 4);
  return pool[Math.floor(random() * pool.length)];
}
function loseLife(room, p) {
  if (!room.solo || p.bot || p.eliminated) return;
  p.lifeSaved = false;
  p.lives = Math.max(0, p.lives - 1);
  if (p.lives === 0) {
    if (p.reserveLives > 0) {
      p.reserveLives--;
      p.lives = 1;
      p.lifeSaved = true;
    } else p.eliminated = true;
  }
}
function answer(room, p, id, index, now = Date.now()) {
  const c = room.challenge;
  if (
    room.phase !== "race" ||
    !c ||
    id !== c.id ||
    p.answered === id ||
    p.finish ||
    p.eliminated ||
    !p.online ||
    p.blockedUntil > now ||
    p.stones ||
    now < c.opens ||
    now > c.closes
  )
    return null;
  p.answered = id;
  p.lifeSaved = false;
  const ok = c.answer.includes(index) && (c.kind !== 2 || now >= c.extinguish);
  if (ok) {
    p.correct++;
    if (room.solo && !p.bot) {
      const before = Math.floor(p.totalScore / LIFE.scorePerLife);
      p.totalScore += 100;
      p.runScore += 100;
      const bonus = Math.floor(p.totalScore / LIFE.scorePerLife) - before;
      if (bonus && p.reserveLives < LIFE.maxSpareLives) {
        const gained = Math.min(bonus, LIFE.maxSpareLives - p.reserveLives);
        p.reserveLives = Math.min(LIFE.maxSpareLives, p.reserveLives + bonus);
        p.bonusLivesEarned += gained;
      }
    }
    p.progress = Math.min(
      100,
      p.progress +
        (LEVELS[room.level]
          ? 100 / raceSettings(room.level, room.difficulty).finishHits
          : 6.5) +
        Math.max(0, 1 - (now - c.opens) / (c.closes - c.opens)) * 0.7,
    );
    if (p.correct % 3 === 0 && !p.item && room.level !== 0)
      p.item = awardItem(p, room);
    if (p.progress >= 100) p.finish = now;
  } else {
    p.blockedUntil = now + 1000;
    p.effect = "Stumble";
    loseLife(room, p);
  }
  return ok;
}
function botWantsItem(room, p) {
  if (!p.item || p.finish || !p.online) return false;
  if (p.item === "Sugar Rush") return true;
  if (p.item === "Tombstone Drop")
    return room.players.some((x) => x !== p && !x.finish && x.online);
  return rank(room).indexOf(p) > 0;
}
function useItem(room, p, now = Date.now()) {
  if (
    room.phase !== "race" ||
    !p.online ||
    !p.item ||
    p.finish ||
    p.blockedUntil > now ||
    p.stones
  )
    return null;
  const item = p.item;
  p.item = null;
  const ordered = rank(room),
    pos = ordered.indexOf(p);
  let target = ordered[Math.max(0, pos - 1)];
  if (item === "Sugar Rush") {
    p.progress = Math.min(
      100,
      p.progress +
        (LEVELS[room.level]
          ? 200 / raceSettings(room.level, room.difficulty).finishHits
          : 13),
    );
    if (p.progress >= 100) p.finish = now;
  } else if (item === "Tombstone Drop") {
    const rivals = ordered.filter((x) => x !== p && !x.finish);
    target = rivals[Math.floor(Math.random() * rivals.length)];
    if (target) target.stones = 3;
  } else if (item === "Sunrise") {
    target = ordered[0];
    if (target !== p)
      target.blockedUntil = Math.max(target.blockedUntil, now + 3000);
  } else if (target && target !== p)
    target.blockedUntil = Math.max(
      target.blockedUntil,
      now + (item === "Brain Freeze" ? 2000 : 1000),
    );
  if (target && target !== p && item !== "Sugar Rush") target.effect = item;
  return { item, target: target?.id };
}
module.exports = {
  TEAMS,
  LEVELS,
  raceSettings,
  challengeOrder,
  RACERS,
  ITEMS,
  challenge,
  player,
  rank,
  answer,
  useItem,
  awardItem,
  botWantsItem,
  loseLife,
};
