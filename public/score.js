/* Full recordings and their synchronized charts share the playback clock. */
(function (root) {
  const recordings =
    typeof module !== "undefined" && module.exports
      ? require("./recordings")
      : root.MidnightRecordings;
  const songs = recordings.songs.map((song) => ({
    ...song,
    beat: 60 / song.tempo,
  }));
  const homeSongs = recordings.homeSongs.map((song) => ({
    ...song,
    beat: 60 / (song.tempo || 84),
  }));
  function getHomeSong(index = 0) {
    return homeSongs[
      Math.max(0, Math.min(homeSongs.length - 1, Math.floor(index) || 0))
    ];
  }
  function getSong(stage = 0) {
    return songs[
      Math.max(0, Math.min(songs.length - 1, Math.floor(stage) || 0))
    ];
  }
  function lanesFor(stage, difficulty = 0) {
    if (getSong(stage).charts && difficulty === 2)
      return ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];
    return difficulty === 0
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
  const api = {
    ...songs[0],
    songs,
    homeSongs,
    jumpSongs: recordings.jumpSongs,
    getSong,
    getHomeSong,
    lanesFor,
    arrows,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightScore = api;
})(globalThis);
