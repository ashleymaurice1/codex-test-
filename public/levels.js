(function (root) {
  const levels = [
    {
      id: 0,
      name: "Spiral-Hill Graveyard",
      short: "The Graveyard",
      symbol: "☾",
      description:
        "Five easy taps to the finish. Pumpkins, moons, potions and friendly ghosts.",
      kinds: [0, 6, 7, 9, 10, 11, 4, 8],
      finishHits: 5,
      pace: 5200,
      floor: 4700,
      botDelay: 1.65,
      botMiss: 0.4,
    },
    {
      id: 1,
      name: "Crooked Pumpkin Patch",
      short: "Pumpkin Patch",
      symbol: "✦",
      description: "Meet the bat and candle. One tap at the right moment.",
      kinds: [0, 1, 2, 4, 6, 7, 9, 10, 11, 8],
      finishHits: 8,
      pace: 4300,
      floor: 3800,
      botDelay: 1.25,
      botMiss: 0.2,
    },
    {
      id: 2,
      name: "Leaning Haunted House",
      short: "Haunted House",
      symbol: "⌂",
      description: "Watch the candles. Spot the odd ghost. Stay one tap ahead.",
      kinds: [0, 3, 4, 5, 2, 6, 7, 8, 9, 10, 11],
      finishHits: 12,
      pace: 3300,
      floor: 2700,
      botDelay: 1,
      botMiss: 0.1,
    },
    {
      id: 3,
      name: "Monster Bash Bell Tower",
      short: "The Monster Bash",
      symbol: "♜",
      description:
        "Twelve challenge types. Faster rivals. One spectacular entrance.",
      kinds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      finishHits: 15,
      pace: 3000,
      floor: 2400,
      botDelay: 0.9,
      botMiss: 0.06,
    },
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = levels;
  else root.MIDNIGHT_LEVELS = levels;
})(typeof globalThis !== "undefined" ? globalThis : this);
