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
  const api = {
    tempo,
    beat,
    bars,
    length,
    duration: length * beat,
    chords,
    noteAtBeat,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightScore = api;
})(globalThis);
