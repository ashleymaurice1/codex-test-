/* Five original minor-key Halloween waltzes, shared by soundtrack and rhythm charts. */
(function (root) {
  const harmony = [
    [0, 3, 7],
    [8, 12, 15],
    [2, 5, 8],
    [7, 11, 14, 17],
    [0, 3, 7],
    [5, 8, 12],
    [2, 5, 8, 11],
    [7, 11, 14],
  ];
  function compose(title, tempo, tonic, motifs, lead, bars = 24) {
    const beatsPerBar = 3,
      beat = 60 / tempo,
      length = bars * beatsPerBar;
    const chords = harmony.map((c) => c.map((n) => tonic + n));
    return {
      title,
      tempo,
      beat,
      bars,
      beatsPerBar,
      length,
      duration: length * beat,
      chords,
      lead,
      noteAtBeat(index) {
        const i = ((Math.floor(index) % length) + length) % length,
          bar = Math.floor(i / 3),
          step = i % 3,
          phrase = Math.floor(bar / 8) % 5;
        if (step === 2 && bar % 4 === 3) return null;
        const motif = motifs[bar % 8];
        let degree =
          motif[phrase === 1 ? (step + 1) % 3 : phrase === 3 ? 2 - step : step];
        if (phrase === 2 && bar % 4 === 0 && step === 0)
          degree = chords[bar % 8][1] - tonic;
        if (phrase === 4 && bar % 8 === 7 && step === 1) degree = 0;
        return tonic + 12 + degree;
      },
    };
  }
  const songs = [
    compose(
      "Moonlit Lounge",
      84,
      50,
      [
        [0, 3, 7],
        [8, 7, 3],
        [2, 5, 8],
        [11, 7, 2],
        [0, 7, 3],
        [5, 8, 7],
        [8, 5, 2],
        [11, 2, 0],
      ],
      "celesta",
      40,
    ),
    compose(
      "Pumpkin Parade",
      96,
      48,
      [
        [7, 3, 0],
        [12, 8, 7],
        [5, 2, 8],
        [11, 7, 2],
        [3, 7, 12],
        [8, 5, 0],
        [2, 8, 5],
        [7, 11, 0],
      ],
      "pizzicato",
    ),
    compose(
      "Witchlight Waltz",
      104,
      52,
      [
        [0, 7, 12],
        [8, 3, 7],
        [2, 8, 5],
        [11, 14, 7],
        [12, 7, 3],
        [5, 12, 8],
        [8, 11, 5],
        [11, 7, 0],
      ],
      "celesta",
    ),
    compose(
      "Ghost Train Groove",
      112,
      45,
      [
        [0, 3, 0],
        [8, 7, 3],
        [2, 5, 2],
        [7, 11, 2],
        [7, 3, 12],
        [5, 8, 5],
        [8, 5, 2],
        [11, 7, 0],
      ],
      "reed",
    ),
    compose(
      "Monster Masquerade",
      120,
      54,
      [
        [12, 7, 3],
        [8, 12, 7],
        [5, 8, 2],
        [11, 14, 7],
        [3, 12, 7],
        [12, 8, 5],
        [8, 11, 2],
        [11, 2, 0],
      ],
      "celesta",
    ),
  ];
  function getSong(stage = 0) {
    return songs[Math.max(0, Math.min(4, Math.floor(stage) || 0))];
  }
  function lanesFor(stage, difficulty = 0) {
    return stage === 0 && difficulty === 0
      ? ["ArrowLeft", "ArrowRight"]
      : stage < 3
        ? ["ArrowLeft", "ArrowUp", "ArrowRight"]
        : ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];
  }
  const arrows = {
    ArrowLeft: "←",
    ArrowDown: "↓",
    ArrowUp: "↑",
    ArrowRight: "→",
  };
  const api = { ...songs[0], songs, getSong, lanesFor, arrows };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightHomeScore = api;
})(globalThis);
