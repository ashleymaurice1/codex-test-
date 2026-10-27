(function (root) {
  const rules = { scorePerLife: 2500, maxSpareLives: 3, lifePrice: 200 };
  function normalize(profile) {
    const previous = Math.max(0, Math.floor(Number(profile.extraLives) || 0));
    if (profile.lifeEconomyVersion !== 2) {
      // Preserve the value of old surplus lives at their original shop price.
      profile.coins =
        Math.max(0, Number(profile.coins) || 0) +
        Math.max(0, previous - rules.maxSpareLives) * 80;
      profile.lifeEconomyVersion = 2;
    }
    profile.extraLives = Math.min(rules.maxSpareLives, previous);
    return profile;
  }
  const api = { ...rules, normalize };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightEconomy = api;
})(globalThis);
