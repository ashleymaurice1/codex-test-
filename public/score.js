/* Full instrumental recordings and their detected beat charts share the playback clock. */
(function (root) {
  const recordings =
    typeof module !== "undefined" && module.exports
      ? require("./recordings")
      : root.MidnightRecordings;
  const songs = recordings.map((song) => ({ ...song, beat: 60 / song.tempo }));
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
  else root.MidnightScore = api;
})(globalThis);
