(function (root) {
  const labels = {
    jump: "Moonlit Leap",
    maze: "Ghostlight Maze",
    rhythm: "Moonlight Melody",
    race: "Tap Race",
  };
  const route = Array.from({ length: 5 }, (_, chapter) =>
    ["jump", "rhythm", "maze", "race"].map((mode) => ({
      mode,
      stage: mode === "race" ? Math.min(3, chapter) : chapter,
      chapter,
      label: labels[mode],
    })),
  ).flat();
  function current(profile) {
    return route[Math.max(0, Math.floor(profile.journeyStep) || 0)] || null;
  }
  function complete(profile, mode, stage) {
    const next = current(profile);
    if (!next || next.mode !== mode || next.stage !== stage) return false;
    profile.journeyStep = Math.max(0, Math.floor(profile.journeyStep) || 0) + 1;
    return true;
  }
  const api = { route, current, complete };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightJourney = api;
})(globalThis);
