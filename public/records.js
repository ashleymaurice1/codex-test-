(function (root) {
  function top(profile, mode = "all") {
    return [...(Array.isArray(profile.highScores) ? profile.highScores : [])]
      .filter((r) => mode === "all" || r.mode === mode)
      .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
      .slice(0, 10);
  }
  function record(profile, run) {
    if (
      !run ||
      !["jump", "maze", "rhythm", "race"].includes(run.mode) ||
      !Number.isFinite(run.score) ||
      run.score < 0 ||
      !Number.isFinite(run.seconds) ||
      run.seconds < 0
    )
      return false;
    profile.highScores = Array.isArray(profile.highScores)
      ? profile.highScores
      : [];
    if (profile.highScores.some((r) => r.id === run.id)) return false;
    const previous = top(profile, run.mode)[0]?.score ?? -1;
    profile.highScores.push({
      ...run,
      score: Math.floor(run.score),
      at: run.at || new Date().toISOString(),
    });
    profile.highScores = profile.highScores
      .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
      .slice(0, 80);
    return run.score > previous && run.score > 0;
  }
  const api = { top, record };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightRecords = api;
})(globalThis);
