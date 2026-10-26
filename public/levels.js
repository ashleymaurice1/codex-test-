(function (root) {
  const levels = [
    {
      id: 0,
      name: "Spiral-Hill Graveyard",
      short: "The Graveyard",
      symbol: "☾",
      description:
        "Find your feet. Three simple challenges and forgiving rivals.",
      kinds: [0, 1, 2],
      pace: 4000,
      floor: 3300,
      botDelay: 1.35,
      botMiss: 0.24,
    },
    {
      id: 1,
      name: "Crooked Pumpkin Patch",
      short: "Pumpkin Patch",
      symbol: "✦",
      description: "Candy piles, crooked doors, and a little more speed.",
      kinds: [0, 4, 3, 1],
      pace: 3600,
      floor: 3000,
      botDelay: 1.15,
      botMiss: 0.16,
    },
    {
      id: 2,
      name: "Leaning Haunted House",
      short: "Haunted House",
      symbol: "⌂",
      description: "Watch the candles. Spot the odd ghost. Stay one tap ahead.",
      kinds: [0, 3, 4, 5, 2],
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
        "All six challenges. Faster rivals. One spectacular entrance.",
      kinds: [0, 1, 2, 3, 4, 5],
      pace: 3000,
      floor: 2400,
      botDelay: 0.9,
      botMiss: 0.06,
    },
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = levels;
  else root.MIDNIGHT_LEVELS = levels;
})(typeof globalThis !== "undefined" ? globalThis : this);
