const colors = {
  Mach: "#B8D4FF",
  Slink: "#9BD14B",
  Ember: "#F28C28",
  Misty: "#7B4BB7",
};
const racerAssets = ["mach", "slink", "ember", "misty"];
const racerNames = ["Mach", "Slink", "Ember", "Misty"];
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
  const chosen = colors[team] ? team : racerNames[i] || "Mach";
  return `<span class="racer-art rendered-racer playable-ghost ghost-${chosen.toLowerCase()} ${tinted ? "moonlit-tint" : ""}" role="img" aria-label="${chosen}, the ghost ${{ Mach: "falcon", Slink: "serpent", Ember: "wolf", Misty: "bat" }[chosen]}"><img src="/assets/characters/${chosen.toLowerCase()}.webp" alt="" decoding="async" draggable="false">${costume(hat, true)}</span>`;
}
function landscape() {
  return '<div class="landscape cinematic-landscape" aria-hidden="true"></div>';
}

function spookyIcon(kind) {
  const potion = (color) =>
    `<path d="M38 8H63V28L83 62Q98 90 51 93Q5 90 20 62L38 28Z" fill="#b8d4ff22" stroke="#c3d5e8" stroke-width="3"/><path d="M26 62H78Q95 86 51 88Q10 86 26 62Z" fill="${color}"/><path d="M35 10H66" stroke="#e6c99c" stroke-width="8"/><circle cx="48" cy="72" r="4" fill="#fff9"/><circle cx="61" cy="80" r="3" fill="#fff9"/>`;
  const lantern = (lit) =>
    `<path d="M37 23Q35 4 51 5Q68 6 64 23" fill="none" stroke="#b9a081" stroke-width="4"/><path d="M21 27H80L72 86H29Z" fill="${lit ? "#f7be59" : "#364154"}" stroke="#a98c6b" stroke-width="4"/><path d="M26 40H76M30 74H72M39 29V85M63 29V85" stroke="#7b695b" stroke-width="4"/>${lit ? '<path d="M51 66Q35 55 51 40Q65 54 51 66Z" fill="#fff3c5"/>' : ""}`;
  const shapes = {
    moon: '<path d="M65 7C7 11 4 89 64 93Q32 75 34 48Q35 22 65 7Z" fill="#c6e4ff" stroke="#8eb9ed" stroke-width="2"/>',
    sun: '<circle cx="50" cy="50" r="23" fill="#f4b258"/><path d="M50 4V17M50 83V96M4 50H17M83 50H96M17 17L27 27M74 74L84 84M17 84L27 74M74 27L84 17" stroke="#f4b258" stroke-width="5"/>',
    star: '<path d="M50 7L62 35L93 38L69 59L77 90L50 74L23 90L30 59L7 38L38 35Z" fill="#e7d48a"/>',
    "potion-blue": potion("#7fbaff"),
    "potion-orange": potion("#efa14d"),
    "potion-green": potion("#9bd14b"),
    web: '<g fill="none" stroke="#b1bbd3" stroke-width="2"><path d="M50 5V95M5 50H95M16 16L84 84M16 84L84 16M28 28Q50 37 72 28Q63 50 72 72Q50 63 28 72Q37 50 28 28ZM14 14Q50 27 86 14Q73 50 86 86Q50 73 14 86Q27 50 14 14Z"/></g>',
    spider:
      '<path d="M50 0V30M34 47L15 34L7 46M33 57L9 58L5 71M66 47L85 34L93 46M67 57L91 58L95 71M36 67L20 80L23 93M64 67L80 80L77 93" stroke="#a88ac7" stroke-width="5" fill="none"/><ellipse cx="50" cy="57" rx="20" ry="25" fill="#a88ac7"/><circle cx="43" cy="47" r="5" fill="#efe6d6"/><circle cx="57" cy="47" r="5" fill="#efe6d6"/><circle cx="44" cy="48" r="2" fill="#121019"/><circle cx="56" cy="48" r="2" fill="#121019"/>',
    tombstone:
      '<path d="M25 91V35Q25 7 51 7Q78 7 78 35V91Z" fill="#78899e" stroke="#b2c0d0" stroke-width="3"/><path d="M39 42H65M51 30V61M31 84H73" stroke="#3c4a5e" stroke-width="4"/>',
    "lantern-lit": lantern(true),
    "lantern-off": lantern(false),
    bone: '<path d="M24 30C3 32 7 8 23 12Q37 4 39 23L73 62Q92 54 93 73Q101 94 79 92Q62 99 61 80Z" fill="#e5deca" stroke="#a69f8d" stroke-width="3"/>',
    "candy-corn":
      '<path d="M43 10Q50-3 58 10L92 82Q97 94 82 95H18Q4 95 10 82Z" fill="#f2ca5f"/><path d="M25 49H76L86 71H15Z" fill="#ee963f"/><path d="M43 10Q50-3 58 10L65 28H35Z" fill="#f0ebdf"/>',
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
