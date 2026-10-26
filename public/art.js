const colors = {
  Mach: "#B8D4FF",
  Slink: "#9BD14B",
  Ember: "#F28C28",
  Misty: "#B396E2",
};
function ghost(team = "Mach", cls = "") {
  const c = colors[team];
  const body =
    team === "Mach"
      ? `<path d="M20 92Q56 101 91 72Q55 88 49 61Q49 44 75 41Q85 17 111 34L138 39L113 48Q109 75 90 79Q67 106 20 92Z"/><path d="M70 41Q45 24 24 39Q45 14 85 29M59 61Q22 41 10 64Q30 46 48 76M90 79Q61 116 3 107Q48 128 101 86" fill="none" stroke-width="5"/><path d="M96 53L113 48" stroke="#3E6AFF" stroke-width="7"/><circle cx="107" cy="60" r="6" fill="#3E6AFF"/><text x="104" y="63" font-size="8" fill="white" stroke="none">M</text><circle cx="107" cy="36" r="3" fill="#111c31"/><path d="M94 74L98 86L104 80" fill="none"/>`
      : team === "Slink"
        ? '<path d="M15 88C120 150 150 17 70 32S4 93 110 65Q151 54 131 32L150 34L136 17Q109 4 100 24C171 109 33 142 15 88Z"/><circle cx="131" cy="25" r="3" fill="#121019"/>'
        : team === "Ember"
          ? '<path d="M12 98Q69 89 67 50L90 43L88 20L104 33L123 21L126 43L150 58L125 69L113 103L91 82L72 102L40 110Z"/><circle cx="123" cy="47" r="3" fill="#f2ac32"/>'
          : '<path d="M78 58L58 16L87 39L111 15L107 60Q138 23 153 48L143 92L115 76Q99 114 79 77L44 94L29 47Q43 27 78 58Z"/><circle cx="86" cy="61" r="3" fill="#121019"/><circle cx="101" cy="61" r="3" fill="#121019"/>';
  return `<svg class="ghost-art ${cls}" viewBox="0 0 160 130" aria-label="${team} ghost" role="img"><g fill="${c}" fill-opacity=".76" stroke="${c}" stroke-width="1.5">${body}</g><g fill="${c}"><circle cx="20" cy="40" r="2"/><circle cx="8" cy="80" r="1.5"/><path d="M40 10v10m-5-5h10"/></g></svg>`;
}
function racer(i, team = "Mach", hat = "") {
  const c = colors[team];
  const head =
    i === 3 ? "#ef9337" : i === 1 ? "#a4b7a2" : i === 2 ? "#91a881" : "#adc6a5";
  return `<svg class="racer-art racer-${i}" viewBox="0 0 120 150" role="img" aria-label="${["Stumbles", "Tutu Tina", "Barkley", "Pumpkin Pete"][i]}"><g stroke="#24202b" stroke-width="3" stroke-linejoin="round"><path d="M47 103L40 133L24 137M69 105L76 136L91 138" fill="none" stroke="#9baf92" stroke-width="9"/><path d="M43 66L24 89L16 80M77 68L95 90L105 72" fill="none" stroke="#a3b797" stroke-width="8"/><path d="M43 62L77 63L81 106L38 106Z" fill="${i === 1 ? "#ae7fa7" : "#61566f"}"/>${i === 1 ? '<path d="M39 91L20 110Q59 126 99 109L78 91" fill="#b394bf"/>' : ""}<path d="M37 24Q57 10 80 26L82 57Q63 74 37 55Z" fill="${head}"/>${i === 2 ? '<path d="M36 28Q12 24 19 68L33 70Z" fill="#66735c"/><ellipse cx="65" cy="53" rx="25" ry="12" fill="#b5bea0"/>' : ""}<circle cx="49" cy="39" r="8" fill="#eee6d5"/><circle cx="70" cy="38" r="7" fill="#eee6d5"/><circle cx="51" cy="40" r="3" fill="#211c2c"/><circle cx="69" cy="39" r="3" fill="#211c2c"/><path d="M47 54L71 53M51 49L52 58M60 49V58M69 49L68 57M55 23L61 30M59 21L53 30" fill="none" stroke-width="2"/><path d="M35 64L79 61L80 72L35 75Z" fill="${c}"/><path d="M71 69L88 97L76 99L62 73Z" fill="${c}"/>${i === 3 ? '<path d="M58 23L63 10L72 12" fill="none" stroke="#76914c" stroke-width="7"/>' : ""}${hat === "Witch hat" ? '<path d="M23 26L90 26L70 19L55 0L45 20Z" fill="#433158"/>' : hat === "Party hat" ? '<path d="M39 25L61 0L79 25Z" fill="#f2a838"/>' : hat === "Propeller beanie" ? '<path d="M36 26Q60 0 82 26Z" fill="#bc6c7a"/><path d="M60 12V3M42 3H78" stroke="#f2a838"/>' : hat === "Bow tie" ? '<path d="M44 72L59 79L75 71V87L59 79L44 88Z" fill="#e89c52"/>' : ""}</g></svg>`;
}
function landscape() {
  return `<svg class="landscape" viewBox="0 0 1400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="moon"><stop stop-color="#eee8cb"/><stop offset="1" stop-color="#bec7c6"/></radialGradient><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#101421"/><stop offset="1" stop-color="#302444"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="18"/></filter></defs><path fill="url(#sky)" d="M0 0H1400V600H0Z"/><circle cx="927" cy="200" r="130" fill="#9fb4cd" opacity=".12" filter="url(#glow)"/><circle cx="927" cy="200" r="105" fill="url(#moon)"/><g fill="#a1acac" opacity=".22"><circle cx="890" cy="156" r="24"/><circle cx="976" cy="213" r="33"/><circle cx="907" cy="259" r="13"/></g><g fill="#282a3c"><path d="M0 384Q160 270 354 389T758 357T1170 351T1500 300V600H0Z"/></g><path d="M0 465Q240 350 405 453T785 428T1160 410T1400 459V600H0Z" fill="#1b1e2e"/><path d="M0 557Q193 424 440 510T887 502T1400 457V600H0Z" fill="#111622"/><g fill="#111622" stroke="#111622" stroke-width="9"><path d="M1070 430L1090 220L1135 194L1180 224L1198 430Z"/><path d="M1063 227L1128 147L1192 227Z"/><path d="M1205 433L1220 315L1271 283L1304 437Z"/><path d="M1205 318L1268 265L1317 328Z"/><path d="M220 460Q184 274 149 207Q113 144 159 113Q186 103 188 129Q180 150 165 139M166 242Q260 186 230 153Q200 130 205 161M176 294Q107 262 100 213M186 340Q263 305 278 266" fill="none" stroke-width="17"/><path d="M1326 480Q1280 177 1360 130Q1410 100 1381 72Q1355 49 1343 83M1310 287Q1230 221 1268 188M1334 211Q1410 189 1405 157" fill="none" stroke-width="20"/></g><g fill="#eab06c"><path d="M1111 256H1125V281H1111Z"/><path d="M1152 301H1164V322H1152Z"/><path d="M1244 340H1256V363H1244Z"/></g><g fill="#50616b" stroke="#111622" stroke-width="4"><path d="M324 456L314 418Q326 397 342 414L353 454Z"/><path d="M378 469L383 429H406L411 475Z"/><path d="M988 479L975 440Q987 420 1002 437L1016 477Z"/></g><path d="M614 600Q500 518 674 472Q834 420 1081 439" stroke="#9a8174" stroke-width="30" fill="none" opacity=".24"/><g fill="#cc8346"><ellipse cx="295" cy="491" rx="20" ry="15"/><ellipse cx="1018" cy="493" rx="14" ry="12"/></g><g fill="#b8d4ff" opacity=".7"><circle cx="83" cy="141" r="2"/><circle cx="503" cy="83" r="2"/><circle cx="1160" cy="91" r="2"/><circle cx="745" cy="190" r="1.5"/><circle cx="360" cy="210" r="2"/></g></svg>`;
}
const puppetRacer = racer;
racer = function (i, team = "Mach", hat = "") {
  let art;
  if (i !== 2) art = puppetRacer(i, team, hat);
  else
    art = `<svg class="racer-art racer-2" viewBox="0 0 120 150" role="img" aria-label="Barkley"><g stroke="#24202b" stroke-width="3" stroke-linejoin="round"><path d="M22 103L17 126L7 127M43 103L47 129H58M78 103L74 127H84M98 98L105 122L115 126" stroke="#9db48b" stroke-width="7" fill="none"/><path d="M18 91Q7 80 10 66" stroke="#91a17d" stroke-width="6" fill="none"/><path d="M18 82Q45 69 80 81L87 67L103 71L106 99Q74 120 22 105Z" fill="#91a17d"/><path d="M72 53Q87 39 104 52L110 73L117 78L113 89L82 87L73 75Z" fill="#b5c3a3"/><path d="M77 51Q54 46 60 91Q69 111 78 89Z" fill="#61735c"/><ellipse cx="97" cy="64" rx="9" ry="10" fill="#ede6d6"/><circle cx="99" cy="66" r="4" fill="#24202b"/><path d="M109 77L117 78L114 83Z" fill="#24202b"/><path d="M88 82H104M93 77V87M101 78V87M35 83L53 99M39 88L45 82M47 97L54 91" stroke-width="2" fill="none"/><path d="M79 83L89 88L80 99L70 92Z" fill="${colors[team]}"/><path d="M73 92L52 108L49 98L72 86Z" fill="${colors[team]}"/>${hat ? `<path d="M70 52L108 52L94 44L88 ${hat === "Witch hat" ? "17" : "29"}L78 45Z" fill="${hat === "Witch hat" ? "#433158" : "#efac64"}"/>` : ""}</g></svg>`;
  if (typeof profile !== "undefined" && profile.tint && team === profile.team)
    art = art.replace(
      'class="racer-art',
      'style="filter:hue-rotate(45deg) brightness(1.1)" class="racer-art',
    );
  return art;
};
const bareGhost = ghost;
ghost = function (team = "Mach", cls = "") {
  let art = bareGhost(team, cls);
  if (
    typeof profile !== "undefined" &&
    profile.ghostHat &&
    team === profile.team
  )
    art = art.replace(
      "</svg>",
      '<path d="M80 34L124 34L110 26L102 7L92 27Z" fill="#45315c" stroke="#b8a3ce" stroke-width="1.5"/><path d="M92 28H112" stroke="#f2a04e" stroke-width="4"/></svg>',
    );
  return art;
};
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
