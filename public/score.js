/* Moonlit Lounge: an original 32-bar Halloween music-box composition. */
(function (root) {
  const tempo = 88,
    beat = 60 / tempo,
    bars = 32,
    length = bars * 4;
  const chords = [
    [50, 53, 57, 64],
    [46, 50, 53, 57],
    [53, 57, 60, 64],
    [48, 52, 55, 62],
    [43, 46, 50, 57],
    [46, 50, 53, 60],
    [45, 49, 52, 55],
    [50, 53, 57, 62],
  ];
  const motifs = [
    [74, 77, 76, 69],
    [70, 74, 72, 65],
    [77, 76, 72, 69],
    [72, 76, 74, 67],
    [70, 74, 77, 69],
    [74, 72, 70, 65],
    [73, 76, 69, 67],
    [74, 69, 77, 74],
  ];
  function noteAtBeat(index) {
    const i = ((Math.floor(index) % length) + length) % length,
      bar = Math.floor(i / 4),
      step = i % 4,
      v = Math.floor(bar / 8);
    if (step === 3 && bar % 4 === 3) return null;
    let p =
      motifs[bar % 8][v === 1 ? (step + 1) % 4 : v === 3 ? 3 - step : step];
    if (v === 2 && step === 0) p = chords[bar % 8][1] + 24;
    return Math.min(84, p);
  }
  const original = {
    tempo,
    beat,
    bars,
    length,
    duration: length * beat,
    chords,
    noteAtBeat,
  };
  function compose(title, tempo, motifs, chords, voice, bass) {
    const beat = 60 / tempo,
      bars = 16,
      length = bars * 4;
    return {
      title,
      tempo,
      beat,
      bars,
      length,
      duration: length * beat,
      chords,
      voice,
      bass,
      noteAtBeat(index) {
        const i = ((Math.floor(index) % length) + length) % length;
        const bar = Math.floor(i / 4),
          step = i % 4;
        if (step === 3 && bar % 4 === 3) return null;
        const motif = motifs[bar % motifs.length];
        return motif[(step + (bar >= 8 ? 1 : 0)) % 4];
      },
    };
  }
  original.title = "Moonlit Lounge";
  original.voice = "sine";
  original.bass = "sine";
  const songs = [
    original,
    compose(
      "Pumpkin Parade",
      96,
      [
        [72, 75, 79, 75],
        [70, 74, 77, 74],
        [68, 72, 75, 79],
        [67, 71, 74, 77],
      ],
      [
        [48, 51, 55, 58],
        [46, 50, 53, 57],
        [44, 48, 51, 55],
        [43, 47, 50, 53],
      ],
      "triangle",
      "sine",
    ),
    compose(
      "Witchlight Waltz",
      104,
      [
        [76, 79, 83, 81],
        [74, 78, 81, 78],
        [72, 76, 79, 76],
        [71, 75, 78, 83],
      ],
      [
        [52, 55, 59, 62],
        [50, 54, 57, 60],
        [48, 52, 55, 59],
        [47, 51, 54, 57],
      ],
      "sine",
      "triangle",
    ),
    compose(
      "Ghost Train Groove",
      112,
      [
        [69, 72, 76, 79],
        [67, 71, 74, 77],
        [65, 69, 72, 76],
        [64, 68, 71, 74],
      ],
      [
        [45, 48, 52, 55],
        [43, 47, 50, 53],
        [41, 45, 48, 52],
        [40, 44, 47, 50],
      ],
      "triangle",
      "triangle",
    ),
    compose(
      "Monster Masquerade",
      120,
      [
        [78, 81, 85, 83],
        [76, 80, 83, 80],
        [74, 78, 81, 85],
        [73, 77, 80, 83],
      ],
      [
        [54, 57, 61, 64],
        [52, 56, 59, 62],
        [50, 54, 57, 61],
        [49, 53, 56, 59],
      ],
      "sine",
      "sine",
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
  const api = { ...original, songs, getSong, lanesFor, arrows };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightScore = api;
})(globalThis);
