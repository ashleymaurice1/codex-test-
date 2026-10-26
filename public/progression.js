(function (root) {
  function awardLevel(profile, level, place, correct) {
    if (
      !Number.isInteger(level) ||
      level < 0 ||
      level > 3 ||
      place < 1 ||
      place > 3 ||
      correct < 5
    )
      return false;
    profile.levelStars = Array.isArray(profile.levelStars)
      ? profile.levelStars
      : [];
    profile.levelStars[level] = Math.max(
      profile.levelStars[level] || 0,
      4 - place,
    );
    profile.unlockedLevel = Math.min(
      3,
      Math.max(profile.unlockedLevel || 0, level + 1),
    );
    return true;
  }
  if (typeof module !== "undefined" && module.exports)
    module.exports = { awardLevel };
  else root.awardMidnightLevel = awardLevel;
})(typeof globalThis !== "undefined" ? globalThis : this);
