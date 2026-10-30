/* Original solo bonus games; pure state transitions shared with the test suite. */
(function (root) {
  const SCORE =
    typeof module !== "undefined" && module.exports
      ? require("./score")
      : root.MidnightScore;
  const LIFE =
    typeof module !== "undefined" && module.exports
      ? require("./economy")
      : root.MidnightEconomy;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function random(seed) {
    let n = seed >>> 0;
    return () => {
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }
  function base(mode, stage, profile = {}, difficulty = 0) {
    return {
      mode,
      stage: Math.max(0, Math.min(4, Math.floor(stage) || 0)),
      difficulty: Math.max(0, Math.min(2, Math.floor(difficulty) || 0)),
      team: profile.team || "Mach",
      status: "playing",
      paused: false,
      elapsed: 0,
      lives: 3,
      reserveLives: Math.max(
        0,
        Math.min(LIFE.maxSpareLives, profile.extraLives || 0),
      ),
      totalScore: Math.max(0, profile.totalScore || 0),
      runScore: 0,
      invulnerable: 0,
      events: [],
    };
  }
  function score(s, points) {
    const old = Math.floor(s.totalScore / LIFE.scorePerLife);
    s.totalScore += points;
    s.runScore += points;
    const bonuses = Math.floor(s.totalScore / LIFE.scorePerLife) - old;
    if (bonuses && s.reserveLives < LIFE.maxSpareLives) {
      const gained = Math.min(bonuses, LIFE.maxSpareLives - s.reserveLives);
      s.reserveLives += gained;
      s.events.push({ type: "bonus-life", count: gained });
    }
  }
  function hit(s) {
    if (s.invulnerable > 0 || s.status !== "playing") return false;
    s.lives--;
    s.invulnerable = 2;
    if (s.lives === 0) {
      if (s.reserveLives > 0) {
        s.reserveLives--;
        s.lives = 1;
        s.events.push({ type: "saved" });
      } else {
        s.status = "lost";
        s.events.push({ type: "lost" });
      }
    }
    s.events.push({ type: "hit" });
    return true;
  }
  function win(s) {
    if (s.status !== "playing") return;
    s.status = "won";
    score(s, 100 + s.stage * 25);
    s.events.push({ type: "won" });
  }
  function makeGrid(stage) {
    const width = 17,
      height = 15,
      rng = random(4127 + stage * 919),
      grid = Array.from({ length: height }, () => Array(width).fill(1)),
      stack = [[1, 1]];
    grid[1][1] = 0;
    while (stack.length) {
      const [x, y] = stack.at(-1),
        options = Object.values(DIRS)
          .map(([dx, dy]) => [x + dx * 2, y + dy * 2, dx, dy])
          .filter(
            ([nx, ny]) =>
              nx > 0 &&
              ny > 0 &&
              nx < width - 1 &&
              ny < height - 1 &&
              grid[ny][nx],
          );
      if (!options.length) {
        stack.pop();
        continue;
      }
      const [nx, ny, dx, dy] = options[Math.floor(rng() * options.length)];
      grid[y + dy][x + dx] = 0;
      grid[ny][nx] = 0;
      stack.push([nx, ny]);
    }
    // Braid some dead ends into loops; every path remains connected to the entrance.
    for (let y = 1; y < height - 1; y++)
      for (let x = 1; x < width - 1; x++) {
        if (
          grid[y][x] &&
          rng() < 0.16 &&
          ((grid[y][x - 1] === 0 && grid[y][x + 1] === 0) ||
            (grid[y - 1][x] === 0 && grid[y + 1][x] === 0))
        )
          grid[y][x] = 0;
      }
    // A chasing enemy must not seal the only route out of a pocket.
    // Add real connecting corridors until no walkable tile is a chokepoint.
    function bottleneck() {
      const seen = new Map(),
        low = new Map();
      let clock = 0,
        found = null;
      function visit(x, y, parent) {
        const key = x + "," + y;
        seen.set(key, ++clock);
        low.set(key, clock);
        let children = 0;
        for (const [dx, dy] of Object.values(DIRS)) {
          const nx = x + dx,
            ny = y + dy,
            next = nx + "," + ny;
          if (grid[ny]?.[nx] !== 0 || next === parent) continue;
          if (!seen.has(next)) {
            children++;
            visit(nx, ny, key);
            low.set(key, Math.min(low.get(key), low.get(next)));
            if (parent !== null && low.get(next) >= seen.get(key))
              found = [x, y];
          } else low.set(key, Math.min(low.get(key), seen.get(next)));
        }
        if (parent === null && children > 1) found = [x, y];
      }
      visit(1, 1, null);
      return found;
    }
    for (let attempt = 0; attempt < width * height; attempt++) {
      const blocked = bottleneck();
      if (!blocked) break;
      const groups = new Map();
      let group = 0;
      for (let y = 1; y < height - 1; y++)
        for (let x = 1; x < width - 1; x++) {
          const key = x + "," + y;
          if (
            grid[y][x] ||
            groups.has(key) ||
            (x === blocked[0] && y === blocked[1])
          )
            continue;
          const queue = [[x, y]];
          groups.set(key, group);
          for (let i = 0; i < queue.length; i++)
            for (const [dx, dy] of Object.values(DIRS)) {
              const nx = queue[i][0] + dx,
                ny = queue[i][1] + dy,
                next = nx + "," + ny;
              if (
                grid[ny]?.[nx] === 0 &&
                !groups.has(next) &&
                !(nx === blocked[0] && ny === blocked[1])
              ) {
                groups.set(next, group);
                queue.push([nx, ny]);
              }
            }
          group++;
        }
      const bridges = [];
      for (let y = 1; y < height - 1; y++)
        for (let x = 1; x < width - 1; x++) {
          if (!grid[y][x]) continue;
          const adjacent = new Set(
            Object.values(DIRS)
              .map(([dx, dy]) => groups.get(x + dx + "," + (y + dy)))
              .filter((n) => n !== undefined),
          );
          if (adjacent.size > 1) bridges.push([x, y]);
        }
      if (!bridges.length) break;
      const [x, y] = bridges[Math.floor(rng() * bridges.length)];
      grid[y][x] = 0;
    }
    return grid;
  }
  function path(grid, from, to) {
    const queue = [from],
      previous = new Map([[from.join(","), null]]);
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (x === to[0] && y === to[1]) {
        const route = [];
        let at = to;
        while (at) {
          route.unshift(at);
          at = previous.get(at.join(","));
        }
        return route;
      }
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx,
          ny = y + dy,
          key = nx + "," + ny;
        if (grid[ny]?.[nx] === 0 && !previous.has(key)) {
          previous.set(key, [x, y]);
          queue.push([nx, ny]);
        }
      }
    }
    return [];
  }
  function createMaze(stage = 0, profile = {}, difficulty = 0) {
    const s = base("maze", stage, profile, difficulty);
    s.grid = makeGrid(s.stage);
    s.width = s.grid[0].length;
    s.height = s.grid.length;
    s.player = { x: 1, y: 1, px: 1, py: 1, motion: null };
    s.exit = { x: s.width - 2, y: s.height - 2 };
    s.direction = null;
    s.queuedDirection = null;
    s.moveClock = 0;
    s.enemyClock = 0;
    s.moveInterval = Math.max(
      0.25,
      0.34 - s.stage * 0.018 - s.difficulty * 0.02,
    );
    s.enemyInterval = Math.max(
      0.32,
      0.64 - s.stage * 0.05 - s.difficulty * 0.08,
    );
    s.rng = random(331 + s.stage * 71);
    const route = path(s.grid, [1, 1], [s.exit.x, s.exit.y]).slice(1, -1);
    s.candies = new Set();
    const count = 8 + s.stage * 4;
    for (let i = 1; i <= Math.min(count, route.length); i++) {
      const cell =
        route[
          Math.floor((i * route.length) / (Math.min(count, route.length) + 1))
        ];
      s.candies.add(cell.join(","));
    }
    const extra = [];
    for (let y = 1; y < s.height - 1; y++)
      for (let x = 1; x < s.width - 1; x++)
        if (
          s.grid[y][x] === 0 &&
          !(x === 1 && y === 1) &&
          !(x === s.exit.x && y === s.exit.y)
        )
          extra.push([x, y]);
    if (s.stage > 0) {
      while (s.candies.size < count && extra.length) {
        const at = Math.floor(s.rng() * extra.length),
          cell = extra.splice(at, 1)[0];
        s.candies.add(cell.join(","));
      }
    }
    s.target = s.candies.size;
    s.collected = 0;
    const far = extra.filter((c) => path(s.grid, [1, 1], c).length > 15);
    const teams = ["Mach", "Slink", "Ember", "Misty"].filter(
      (t) => t !== s.team,
    );
    s.enemies = Array.from(
      { length: Math.min(3, 1 + Math.ceil((s.stage + s.difficulty) / 2)) },
      (_, i) => {
        const cell = route[Math.min(route.length - 1, 10 + i * 8)] || [
          s.exit.x,
          s.exit.y,
        ];
        const respawn = far[Math.max(0, far.length - 1 - i * 7)] || cell;
        return {
          x: cell[0],
          y: cell[1],
          spawnX: respawn[0],
          spawnY: respawn[1],
          px: cell[0],
          py: cell[1],
          fromX: cell[0],
          fromY: cell[1],
          lastX: -1,
          lastY: -1,
          team: teams[i],
          kind: ["witch", "zombie", "spider"][i],
        };
      },
    );
    return s;
  }
  function turnMaze(s, direction) {
    const d = DIRS[direction];
    if (!d) return;
    s.queuedDirection = direction;
    const m = s.player.motion;
    if (!m || direction === s.direction) return;
    const old = DIRS[s.direction];
    if (old && d[0] === -old[0] && d[1] === -old[1]) {
      s.player.motion = {
        fromX: m.toX,
        fromY: m.toY,
        toX: m.fromX,
        toY: m.fromY,
        elapsed: s.moveInterval - m.elapsed,
      };
      s.direction = direction;
    } else if (
      m.elapsed / s.moveInterval < 0.15 &&
      m.fromX === s.player.x &&
      m.fromY === s.player.y &&
      open(s, s.player.x + d[0], s.player.y + d[1])
    ) {
      // A slightly late junction input returns along the corridor to its center,
      // then takes the queued turn; it never moves diagonally through a wall.
      s.player.motion = {
        fromX: m.toX,
        fromY: m.toY,
        toX: m.fromX,
        toY: m.fromY,
        elapsed: s.moveInterval - m.elapsed,
      };
      s.direction = Object.keys(DIRS).find(
        (key) => DIRS[key][0] === -old[0] && DIRS[key][1] === -old[1],
      );
    }
    // Perpendicular turns remain queued until a tile center. Never cut a corner.
  }

  function open(s, x, y) {
    return s.grid[y]?.[x] === 0;
  }
  function collect(s) {
    const key = s.player.x + "," + s.player.y;
    if (s.candies.delete(key)) {
      s.collected++;
      score(s, 50);
      s.events.push({ type: "candy" });
    }
    if (
      s.player.x === s.exit.x &&
      s.player.y === s.exit.y &&
      s.candies.size === 0
    )
      win(s);
  }
  function collideMaze(s) {
    if (
      s.enemies.some(
        (e) =>
          Math.hypot((e.px ?? e.x) - s.player.px, (e.py ?? e.y) - s.player.py) <
          0.58,
      ) &&
      hit(s)
    ) {
      // Keep collected progress and give a short escape window after contact.
      s.enemyClock = 0;
      for (const e of s.enemies)
        Object.assign(e, {
          x: e.spawnX,
          y: e.spawnY,
          px: e.spawnX,
          py: e.spawnY,
          fromX: e.spawnX,
          fromY: e.spawnY,
        });
    }
  }
  function mazeSlice(s, dt) {
    s.elapsed += dt;
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    let left = dt;
    while (left > 0 && s.status === "playing") {
      if (!s.player.motion) {
        const q = DIRS[s.queuedDirection];
        if (q && open(s, s.player.x + q[0], s.player.y + q[1]))
          s.direction = s.queuedDirection;
        const d = DIRS[s.direction];
        if (!d || !open(s, s.player.x + d[0], s.player.y + d[1])) break;
        s.player.motion = {
          fromX: s.player.x,
          fromY: s.player.y,
          toX: s.player.x + d[0],
          toY: s.player.y + d[1],
          elapsed: 0,
        };
      }
      const m = s.player.motion,
        n = Math.min(left, s.moveInterval - m.elapsed);
      m.elapsed += n;
      left -= n;
      const t = Math.min(1, m.elapsed / s.moveInterval);
      s.player.px = m.fromX + (m.toX - m.fromX) * t;
      s.player.py = m.fromY + (m.toY - m.fromY) * t;
      if (t >= 1 - 1e-9) {
        s.player.x = m.toX;
        s.player.y = m.toY;
        s.player.px = m.toX;
        s.player.py = m.toY;
        s.player.motion = null;
        collect(s);
      }
      collideMaze(s);
    }
    s.enemyClock += dt;
    if (s.enemyClock >= s.enemyInterval && s.status === "playing") {
      s.enemyClock %= s.enemyInterval;
      for (const e of s.enemies) {
        let options = Object.values(DIRS)
          .map(([dx, dy]) => [e.x + dx, e.y + dy])
          .filter(([x, y]) => open(s, x, y));
        if (options.length > 1)
          options = options.filter(([x, y]) => x !== e.lastX || y !== e.lastY);
        let to;
        const chasing =
          Math.floor((s.elapsed + s.enemies.indexOf(e) * 2) / 7) % 3 !== 2;
        if (chasing) {
          const pursuit = path(s.grid, [e.x, e.y], [s.player.x, s.player.y]);
          to = pursuit[1];
        }
        if (!to) to = options[Math.floor(s.rng() * options.length)];
        e.chasing = chasing;
        if (to) {
          e.fromX = e.x;
          e.fromY = e.y;
          e.lastX = e.x;
          e.lastY = e.y;
          [e.x, e.y] = to;
        }
      }
    }
    for (const e of s.enemies) {
      const t = Math.min(1, s.enemyClock / s.enemyInterval);
      e.px = e.fromX + (e.x - e.fromX) * t;
      e.py = e.fromY + (e.y - e.fromY) * t;
    }
    collideMaze(s);
  }
  function stepMaze(s, dt) {
    if (s.paused || s.status !== "playing") return;
    let remaining = Math.max(0, Math.min(1, dt));
    while (remaining > 0 && s.status === "playing") {
      const n = Math.min(0.05, remaining);
      mazeSlice(s, n);
      remaining -= n;
    }
  }
  function createJump(stage = 0, profile = {}, difficulty = 0, options = {}) {
    const s = base("jump", stage, profile, difficulty);
    s.width = 900;
    s.height = 540;
    s.ground = 425;
    s.player = { x: 155, y: 0, vy: 0, width: 75, height: 57 };
    s.baseSpeed = 180 + s.stage * 28 + s.difficulty * 85;
    s.speed = s.baseSpeed;
    s.runLength = Math.max(1, Math.min(8, Math.floor(options.runLength) || 1));
    s.endless = options.endless === true;
    s.wave = 1;
    s.target = s.endless
      ? Infinity
      : 6 + s.stage * 2 + s.difficulty * 3 + (s.runLength - 1) * 12;
    s.passed = 0;
    s.distance = 0;
    s.startX = s.player.x;
    s.cameraX = 0;
    s.cameraPan = null;
    s.finishX = null;
    s.spawned = 0;
    s.nextSpawn = 760;
    s.obstacles = [];
    s.rng = random(712 + s.stage * 131);
    return s;
  }
  function jump(s) {
    if (s.status !== "playing" || s.paused || s.player.y > 1) return false;
    s.player.vy = 640;
    s.events.push({ type: "jump" });
    return true;
  }
  function jumpSpeed(s, clears) {
    return Math.min(
      560,
      s.baseSpeed +
        (s.endless || s.runLength > 1 ? Math.floor(clears / 5) * 32 : 0),
    );
  }
  function jumpSlice(s, dt) {
    const wave = 1 + Math.floor(s.passed / 5);
    if (wave !== s.wave && (s.endless || s.runLength > 1))
      s.events.push({ type: "wave", wave });
    s.wave = wave;
    s.speed = jumpSpeed(s, s.passed);
    s.elapsed += dt;
    s.player.x += s.speed * dt;
    s.distance = s.player.x - s.startX;
    if (!s.cameraPan && s.player.x - s.cameraX > s.width * 0.66)
      s.cameraPan = {
        from: s.cameraX,
        to: s.player.x - s.width * 0.24,
        elapsed: 0,
      };
    if (s.cameraPan) {
      s.cameraPan.elapsed += dt;
      const t = Math.min(1, s.cameraPan.elapsed / 1.0),
        ease = (1 - Math.cos(Math.PI * t)) / 2;
      s.cameraX = s.cameraPan.from + (s.cameraPan.to - s.cameraPan.from) * ease;
      if (t === 1) s.cameraPan = null;
    }
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    if (s.player.y > 0 || s.player.vy > 0) {
      s.player.vy -= 1180 * dt;
      s.player.y = Math.max(0, s.player.y + s.player.vy * dt);
      if (s.player.y === 0) s.player.vy = 0;
    }
    if (s.spawned < s.target && s.player.x + s.width >= s.nextSpawn) {
      const kind = ["root", "pumpkin", "tombstone"][(s.spawned + 1) % 3];
      const height = Math.min(
        105,
        53 +
          s.difficulty * 10 +
          (s.endless || s.runLength > 1
            ? Math.min(20, Math.floor(s.spawned / 5) * 3)
            : 0) +
          Math.floor(s.rng() * (14 + s.stage * 5)),
      );
      s.obstacles.push({
        id: s.spawned++,
        x: s.nextSpawn,
        height,
        width: Math.round(
          height *
            (kind === "root" ? 0.875 : kind === "pumpkin" ? 0.727 : 0.65),
        ),
        hit: false,
        passed: false,
        kind,
      });
      if (s.spawned === s.target) s.finishX = s.nextSpawn + 80;
      s.nextSpawn +=
        Math.max(
          370 - s.stage * 18 - s.difficulty * 45,
          jumpSpeed(s, s.spawned + 5) * (1.5 - s.difficulty * 0.12),
        ) +
        s.rng() * (70 + s.difficulty * 45);
    }
    for (const o of s.obstacles) {
      const overlap =
        o.x < s.player.x + s.player.width - 14 &&
        o.x + o.width > s.player.x + 14;
      if (overlap && s.player.y < o.height - 8 && !o.hit) {
        o.hit = true;
        hit(s);
      }
      if (!o.passed && o.x + o.width < s.player.x) {
        o.passed = true;
        s.passed++;
        if (!o.hit) {
          score(s, 50);
          s.events.push({ type: "clear" });
        }
        if (s.passed >= s.target) win(s);
      }
    }
    s.obstacles = s.obstacles.filter((o) => o.x + o.width > s.cameraX - 100);
  }
  function stepJump(s, dt) {
    if (s.paused || s.status !== "playing") return;
    let remaining = Math.max(0, Math.min(1, dt));
    while (remaining > 0 && s.status === "playing") {
      const n = Math.min(0.016, remaining);
      jumpSlice(s, n);
      remaining -= n;
    }
  }
  function createRhythm(stage = 0, profile = {}, difficulty = 0) {
    const s = base("rhythm", stage, profile, difficulty);
    s.width = 900;
    s.height = 540;
    s.song = SCORE.getSong(s.stage).title;
    s.keys = SCORE.lanesFor(s.stage, s.difficulty);
    s.target = 0;
    s.hits = 0;
    s.misses = 0;
    s.combo = 0;
    s.laneCount = s.keys.length;
    s.hitWindow =
      s.difficulty === 0
        ? 0.4
        : Math.max(0.14, 0.28 - s.stage * 0.014 - (s.difficulty - 1) * 0.035);
    s.missedInRow = 0;
    s.notes = [];
    s.ready = false;
    s.lastAudio = 0;
    s.lastHitTime = -1;
    s.lastHitLane = -1;
    return s;
  }
  function prepareRhythm(s, clock) {
    const song = SCORE.getSong(s.stage);
    const gap = s.difficulty === 0 ? 1.5 : s.difficulty === 1 ? 0.75 : 0.45;
    let previous = -Infinity;
    const chart =
      song.charts?.[s.difficulty] ||
      song.chart.filter((n) => {
        if (n.time - previous < gap) return false;
        previous = n.time;
        return true;
      });
    const low = Math.min(...chart.map((n) => n.tone)),
      high = Math.max(...chart.map((n) => n.tone)),
      counts = Array(s.laneCount).fill(0);
    let lastLane = -1,
      streak = 0;
    s.notes = chart.map((n, i) => {
      // Pitch is relative to this chart, not an absolute range that can put
      // a whole melody in one lane. Keep every active arrow in regular use.
      const relative = high > low ? (n.tone - low) / (high - low) : 0.5,
        preferred = Math.min(
          s.laneCount - 1,
          Math.floor(relative * s.laneCount),
        ),
        minimum = Math.min(...counts);
      let candidates = counts
        .map((count, lane) => ({ count, lane }))
        .filter(
          ({ count, lane }) =>
            count <= minimum + 1 && !(lane === lastLane && streak >= 2),
        );
      if (!candidates.length)
        candidates = counts
          .map((count, lane) => ({ count, lane }))
          .filter(({ count }) => count === minimum);
      candidates.sort(
        (a, b) =>
          Math.abs(a.lane - preferred) - Math.abs(b.lane - preferred) ||
          a.count - b.count ||
          a.lane - b.lane,
      );
      const lane = candidates[0].lane;
      counts[lane]++;
      streak = lane === lastLane ? streak + 1 : 1;
      lastLane = lane;
      return { beat: i, time: clock.origin + n.time, lane, status: "pending" };
    });
    s.target = s.notes.length;
    s.startedAudio = clock.time;
    s.lastAudio = clock.time;
    s.endAudio = Math.max(
      (s.notes.at(-1)?.time ?? clock.origin) + s.hitWindow + 0.3,
      clock.origin + song.playSeconds,
    );
    s.ready = true;
  }
  function missNote(s, n) {
    if (n.status !== "pending") return;
    n.status = "miss";
    s.misses++;
    s.combo = 0;
    s.missedInRow++;
    if (s.difficulty > 0 || s.missedInRow % 3 === 0) hit(s);
    s.events.push({ type: "miss" });
  }
  function hitRhythm(s, lane, time) {
    if (s.paused || s.status !== "playing" || !s.ready) return false;
    const options = s.notes
        .filter((n) => n.status === "pending" && n.lane === lane)
        .sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time)),
      n = options[0];
    if (n && Math.abs(n.time - time) <= s.hitWindow) {
      n.status = "hit";
      s.hits++;
      s.missedInRow = 0;
      s.combo++;
      s.lastHitTime = time;
      s.lastHitLane = lane;
      score(s, Math.abs(n.time - time) < 0.09 ? 75 : 50);
      s.events.push({
        type: Math.abs(n.time - time) < 0.09 ? "perfect" : "note",
      });
      return true;
    }
    const nearby = s.notes.find(
      (n) => n.status === "pending" && Math.abs(n.time - time) <= s.hitWindow,
    );
    if (nearby) missNote(s, nearby);
    return false;
  }
  function stepRhythm(s, time) {
    if (s.paused || s.status !== "playing" || !s.ready) return;
    s.invulnerable = Math.max(
      0,
      s.invulnerable - Math.max(0, time - s.lastAudio),
    );
    s.lastAudio = time;
    s.elapsed = Math.max(0, time - s.startedAudio);
    for (const n of s.notes)
      if (n.status === "pending" && time > n.time + s.hitWindow) missNote(s, n);
    if (time >= s.endAudio && s.status === "playing") {
      if (s.hits >= Math.ceil(s.target * 0.65)) win(s);
      else {
        s.status = "lost";
        s.reason = "accuracy";
        s.events.push({ type: "lost" });
      }
    }
  }
  const api = {
    createMaze,
    turnMaze,
    stepMaze,
    createRhythm,
    prepareRhythm,
    hitRhythm,
    stepRhythm,
    createJump,
    jump,
    stepJump,
    path,
    DIRS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightArcade = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
