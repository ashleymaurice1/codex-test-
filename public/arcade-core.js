/* Original solo bonus games; pure state transitions shared with the test suite. */
(function (root) {
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
      reserveLives: Math.max(0, Math.min(99, profile.extraLives || 0)),
      totalScore: Math.max(0, profile.totalScore || 0),
      runScore: 0,
      invulnerable: 0,
      events: [],
    };
  }
  function score(s, points) {
    const old = Math.floor(s.totalScore / 500);
    s.totalScore += points;
    s.runScore += points;
    const bonuses = Math.floor(s.totalScore / 500) - old;
    if (bonuses) {
      s.reserveLives = Math.min(99, s.reserveLives + bonuses);
      s.events.push({ type: "bonus-life", count: bonuses });
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
    s.player = { x: 1, y: 1 };
    s.exit = { x: s.width - 2, y: s.height - 2 };
    s.direction = null;
    s.queuedDirection = null;
    s.moveClock = 0;
    s.enemyClock = 0;
    s.moveInterval = 0.21;
    s.enemyInterval = Math.max(
      0.32,
      0.95 - s.stage * 0.12 - s.difficulty * 0.13,
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
      { length: Math.min(3, 1 + Math.floor((s.stage + s.difficulty) / 2)) },
      (_, i) => {
        const cell = far[Math.max(0, far.length - 1 - i * 7)] || [
          s.exit.x,
          s.exit.y,
        ];
        return {
          x: cell[0],
          y: cell[1],
          spawnX: cell[0],
          spawnY: cell[1],
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
    if (DIRS[direction]) s.queuedDirection = direction;
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
      s.enemies.some((e) => e.x === s.player.x && e.y === s.player.y) &&
      hit(s)
    ) {
      s.player.x = 1;
      s.player.y = 1;
      s.direction = null;
      s.queuedDirection = null;
      for (const e of s.enemies) {
        e.x = e.spawnX;
        e.y = e.spawnY;
      }
    }
  }
  function mazeSlice(s, dt) {
    s.elapsed += dt;
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    s.moveClock += dt;
    s.enemyClock += dt;
    while (s.moveClock >= s.moveInterval && s.status === "playing") {
      s.moveClock -= s.moveInterval;
      const q = DIRS[s.queuedDirection];
      if (q && open(s, s.player.x + q[0], s.player.y + q[1]))
        s.direction = s.queuedDirection;
      const d = DIRS[s.direction];
      if (d && open(s, s.player.x + d[0], s.player.y + d[1])) {
        s.player.x += d[0];
        s.player.y += d[1];
        collect(s);
        collideMaze(s);
      }
    }
    if (s.enemyClock >= s.enemyInterval && s.status === "playing") {
      s.enemyClock %= s.enemyInterval;
      for (const e of s.enemies) {
        let options = Object.values(DIRS)
          .map(([dx, dy]) => [e.x + dx, e.y + dy])
          .filter(([x, y]) => open(s, x, y));
        if (options.length > 1)
          options = options.filter(([x, y]) => x !== e.lastX || y !== e.lastY);
        let to;
        if (s.rng() < 0.2 + s.stage * 0.1 + s.difficulty * 0.08)
          to = options.sort(
            (a, b) =>
              Math.abs(a[0] - s.player.x) +
              Math.abs(a[1] - s.player.y) -
              (Math.abs(b[0] - s.player.x) + Math.abs(b[1] - s.player.y)),
          )[0];
        else to = options[Math.floor(s.rng() * options.length)];
        if (to) {
          e.lastX = e.x;
          e.lastY = e.y;
          [e.x, e.y] = to;
        }
      }
      collideMaze(s);
    }
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
  function createJump(stage = 0, profile = {}, difficulty = 0) {
    const s = base("jump", stage, profile, difficulty);
    s.width = 900;
    s.height = 540;
    s.ground = 425;
    s.player = { x: 155, y: 0, vy: 0, width: 75, height: 57 };
    s.speed = 180 + s.stage * 28 + s.difficulty * 35;
    s.target = 6 + s.stage * 2;
    s.passed = 0;
    s.distance = 0;
    s.spawned = 0;
    s.nextSpawn = 1050;
    s.obstacles = [];
    s.rng = random(712 + s.stage * 131);
    return s;
  }
  function jump(s) {
    if (s.status !== "playing" || s.paused || s.player.y > 1) return false;
    s.player.vy = 530;
    s.events.push({ type: "jump" });
    return true;
  }
  function jumpSlice(s, dt) {
    s.elapsed += dt;
    s.distance += s.speed * dt;
    s.invulnerable = Math.max(0, s.invulnerable - dt);
    if (s.player.y > 0 || s.player.vy > 0) {
      s.player.vy -= 1180 * dt;
      s.player.y = Math.max(0, s.player.y + s.player.vy * dt);
      if (s.player.y === 0) s.player.vy = 0;
    }
    if (s.spawned < s.target && s.distance + s.width >= s.nextSpawn) {
      s.obstacles.push({
        id: s.spawned++,
        x: s.nextSpawn - s.distance,
        width: 34 + s.stage * 2,
        height: 53 + Math.floor(s.rng() * (14 + s.stage * 5)),
        hit: false,
        passed: false,
        kind: ["root", "pumpkin", "tombstone"][s.spawned % 3],
      });
      s.nextSpawn += Math.max(370 - s.stage * 18, s.speed * 1.1) + s.rng() * 70;
    }
    for (const o of s.obstacles) {
      o.x -= s.speed * dt;
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
    s.obstacles = s.obstacles.filter((o) => o.x + o.width > -40);
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
  const api = {
    createMaze,
    turnMaze,
    stepMaze,
    createJump,
    jump,
    stepJump,
    path,
    DIRS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MidnightArcade = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
