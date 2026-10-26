const crypto = require("node:crypto");
const LEVELS = require("./public/levels");
const TEAMS = ["Mach", "Slink", "Ember", "Misty"];
const RACERS = ["Stumbles", "Tutu Tina", "Barkley", "Pumpkin Pete"];
const ITEMS = [
  "Arm Toss",
  "Sugar Rush",
  "Tombstone Drop",
  "Brain Freeze",
  "Sunrise",
];
function challenge(round, now, random = Math.random, levelId = null) {
  const level = Number.isInteger(levelId) ? LEVELS[levelId] : null;
  const kind = level ? level.kinds[round % level.kinds.length] : round % 6;
  const duration = level
    ? Math.max(level.floor, level.pace - round * 18)
    : Math.max(2500, 3400 - round * 20);
  let choices, answer;
  const pick = (n) => Math.floor(random() * n);
  if (kind === 0) {
    choices = Array.from({ length: 6 }, () =>
      random() < 0.5 ? "pumpkin" : "skull",
    );
    choices[pick(6)] = "pumpkin";
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
    choices = [2, 4, 6].sort(() => random() - 0.5);
    answer = [choices.indexOf(6)];
  }
  if (kind === 5) {
    choices = Array(6).fill("ghost");
    const at = pick(6);
    choices[at] = "ghost-odd";
    answer = [at];
  }
  return {
    id: crypto.randomUUID(),
    kind,
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
    racer: Number.isInteger(racer) && racer >= 0 && racer < 4 ? racer : 0,
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
  };
}
function rank(room) {
  return [...room.players].sort(
    (a, b) =>
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
function answer(room, p, id, index, now = Date.now()) {
  const c = room.challenge;
  if (
    room.phase !== "race" ||
    !c ||
    id !== c.id ||
    p.answered === id ||
    p.finish ||
    !p.online ||
    p.blockedUntil > now ||
    p.stones ||
    now < c.opens ||
    now > c.closes
  )
    return null;
  p.answered = id;
  const ok = c.answer.includes(index) && (c.kind !== 2 || now >= c.extinguish);
  if (ok) {
    p.correct++;
    p.progress = Math.min(
      100,
      p.progress +
        6.5 +
        Math.max(0, 1 - (now - c.opens) / (c.closes - c.opens)) * 0.7,
    );
    if (p.correct % 3 === 0 && !p.item) p.item = awardItem(p, room);
    if (p.progress >= 100) p.finish = now;
  } else {
    p.blockedUntil = now + 1000;
    p.effect = "Stumble";
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
    p.progress = Math.min(100, p.progress + 13);
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
  RACERS,
  ITEMS,
  challenge,
  player,
  rank,
  answer,
  useItem,
  awardItem,
  botWantsItem,
};
