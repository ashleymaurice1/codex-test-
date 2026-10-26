const colors = {
  Mach: "#B8D4FF",
  Slink: "#9BD14B",
  Ember: "#F28C28",
  Misty: "#7B4BB7",
};
const racerAssets = ["stumbles", "tutu-tina", "barkley", "pumpkin-pete"];
const racerNames = ["Stumbles", "Tutu Tina", "Barkley", "Pumpkin Pete"];
function costume(hat, ghost = false) {
  const shapes = {
    "Witch hat":
      '<path d="M23 37L78 37L65 29L52 3L39 30Z" fill="#201b3d" stroke="#b8d4ff" stroke-width="1.2"/><path d="M39 29H65" stroke="#e7a34d" stroke-width="6"/><rect x="48" y="25" width="9" height="8" fill="none" stroke="#ede6d6"/>',
    "Party hat":
      '<path d="M33 37L53 3L74 37Z" fill="#d98a3a" stroke="#f8d79f"/><path d="M40 24L65 28M46 14L60 17" stroke="#b8d4ff" stroke-width="4"/><circle cx="53" cy="4" r="3" fill="#ede6d6"/>',
    "Propeller beanie":
      '<path d="M30 36Q52 7 77 36Z" fill="#9b7f95" stroke="#ede6d6"/><path d="M53 19V6M33 6H73" stroke="#f2a04e" stroke-width="4"/>',
    "Bow tie":
      '<path d="M23 19L50 33L78 19V49L50 33L23 49Z" fill="#e8a24d" stroke="#ffe0a4"/><circle cx="50" cy="33" r="5" fill="#b87934"/>',
  };
  return shapes[hat]
    ? `<svg class="costume-art ${ghost ? "ghost-costume" : ""} ${hat === "Bow tie" ? "bow-tie" : ""}" viewBox="0 0 100 60" aria-hidden="true">${shapes[hat]}</svg>`
    : "";
}
function ghost(team = "Mach", cls = "") {
  const dressed =
    typeof profile !== "undefined" && profile.ghostHat && team === profile.team;
  return `<span class="ghost-art rendered-ghost ghost-${team.toLowerCase()} ${cls}" role="img" aria-label="${team} ghost"><img src="/assets/characters/${team.toLowerCase()}.webp" alt="" width="1536" height="1024" decoding="async" draggable="false">${dressed ? costume("Witch hat", true) : ""}</span>`;
}
function racer(i, team = "Mach", hat = "") {
  const tinted =
    typeof profile !== "undefined" && profile.tint && team === profile.team;
  return `<span class="racer-art rendered-racer racer-${i} ${tinted ? "moonlit-tint" : ""}" role="img" aria-label="${racerNames[i]}"><img src="/assets/characters/${racerAssets[i]}.webp" alt="" decoding="async" draggable="false"><span class="team-ribbon" style="--ribbon:${colors[team]}" aria-hidden="true"></span>${costume(hat)}</span>`;
}
function landscape() {
  return '<div class="landscape cinematic-landscape" aria-hidden="true"></div>';
}

function spookyIcon(kind) {
  const shapes = {
    pumpkin:
      '<path d="M47 24Q44 10 58 8" fill="none" stroke="#8dba6e" stroke-width="6"/><path d="M47 25C4 3-4 79 33 86Q47 96 63 86C103 87 107 13 65 23Z" fill="#e49a49"/><path d="M41 28Q25 51 41 84M62 27Q80 52 62 84" fill="none" stroke="#b9693b" stroke-width="3"/><path d="M23 51L39 40L39 54ZM60 43L78 53L60 55ZM24 64L36 68L44 62L52 71L63 64L77 65L65 79L39 80Z" fill="#312535"/>',
    skull:
      '<path d="M25 65C-2 29 17 5 50 8C91 5 107 40 79 65L77 84L28 86Z" fill="#dddcca"/><ellipse cx="31" cy="44" rx="12" ry="14" fill="#302837"/><ellipse cx="69" cy="43" rx="10" ry="13" fill="#302837"/><path d="M50 55L42 67H57ZM40 77V86M53 76V86M65 76V85" stroke="#302837" stroke-width="4"/>',
    bat: '<path d="M40 42L33 17L49 31L65 15L63 43Q79 14 97 29L94 72L78 60L65 77Q50 94 37 76L24 62L5 75L3 31Q17 12 40 42Z" fill="#9b86b8"/><circle cx="45" cy="52" r="4" fill="#eee6d6"/><circle cx="59" cy="52" r="4" fill="#eee6d6"/><path d="M46 65L50 72L54 65" fill="#eee6d6"/>',
    door: '<path d="M20 91L13 14L79 5L89 91Z" fill="#684e64" stroke="#b19183" stroke-width="4"/><path d="M29 81L24 25L66 20L74 81Z" fill="#302536" stroke="#9a727d" stroke-width="2"/><circle cx="64" cy="57" r="4" fill="#edb16c"/>',
    ghost:
      '<path d="M19 78V36Q22 7 52 11Q83 9 85 39L85 85L70 75L58 89L43 76L30 89Z" fill="#c8cce1"/><ellipse cx="40" cy="40" rx="5" ry="9" fill="#302837"/><ellipse cx="64" cy="40" rx="5" ry="9" fill="#302837"/><ellipse cx="53" cy="61" rx="5" ry="7" fill="#302837"/>',
    candle:
      '<path d="M34 44H68L66 90H35Z" fill="#ede1b8"/><path d="M34 43Q46 52 47 62Q57 61 57 45" fill="#d3c291"/><path d="M51 40V31" stroke="#342738" stroke-width="3"/><path class="flame" d="M51 33Q25 26 48 3Q53 14 62 20Q66 31 51 33Z" fill="#f2ac52"/>',
    out: '<path d="M34 44H68L66 90H35Z" fill="#ede1b8"/><path d="M51 40V31" stroke="#342738" stroke-width="3"/><path d="M52 25Q72 16 54 7" fill="none" stroke="#a4a9c0" stroke-width="3"/>',
    candy:
      '<path d="M25 40L4 28L7 69L26 60M74 40L96 27L92 70L74 60" fill="#ba9acb"/><rect x="22" y="28" width="55" height="44" rx="16" fill="#edb16c" transform="rotate(-8 50 50)"/><path d="M43 28L39 74M61 28L57 73" stroke="#f0dfb9" stroke-width="9"/>',
  };
  return `<svg class="spooky-icon" viewBox="0 0 100 100" aria-hidden="true">${shapes[kind === "ghost-odd" ? "ghost" : kind] || shapes.ghost}</svg>`;
}
