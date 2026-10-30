/* Full-length recordings, including original sampled-instrument arrangements. No runtime synthesis. */
(function (root) {
  let ctx,
    master,
    muted = false,
    volume = 0.35,
    scene = "menu",
    previewing = false,
    source = null,
    sourceGain = null,
    sourceOffset = 0,
    origin = 0,
    playingStage = 0,
    homeStage = 0,
    homePosition = 0,
    transportPaused = false,
    generation = 0,
    ambientStage = 0;
  const tracks = [
      ...root.MidnightScore.homeSongs,
      ...root.MidnightScore.songs,
      ...root.MidnightScore.jumpSongs,
    ],
    homeCount = root.MidnightScore.homeSongs.length,
    jumpStart = homeCount + root.MidnightScore.songs.length;
  const buffers = new Map(),
    loading = new Map();
  function ensure() {
    if (ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
    } catch {}
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    document.addEventListener("visibilitychange", updateVolume);
  }
  function updateVolume() {
    if (master)
      master.gain.setTargetAtTime(
        muted || previewing || document.hidden
          ? 0
          : volume * (scene === "rhythm" ? 1 : 0.65),
        ctx.currentTime,
        0.35,
      );
  }
  async function loadTrack(stage) {
    if (buffers.has(stage)) return buffers.get(stage);
    if (loading.has(stage)) return loading.get(stage);
    const promise = (async () => {
      const r = await fetch(tracks[stage].file);
      if (!r.ok) throw Error("Music recording could not load");
      const decoder = new OfflineAudioContext(
          2,
          1,
          tracks[stage].sampleRate || 22050,
        ),
        buffer = await decoder.decodeAudioData(await r.arrayBuffer());
      buffers.set(stage, buffer);
      while (buffers.size > 2) {
        const old = [...buffers.keys()].find(
          (k) => k !== stage && k !== playingStage,
        );
        if (old === undefined) break;
        buffers.delete(old);
      }
      return buffer;
    })().finally(() => loading.delete(stage));
    loading.set(stage, promise);
    return promise;
  }
  function ready(stage = 0) {
    return loadTrack(
      homeCount +
        Math.max(
          0,
          Math.min(root.MidnightScore.songs.length - 1, Number(stage) || 0),
        ),
    );
  }
  function stopSource(fade = 0.35) {
    if (!source || !ctx) return;
    const old = source,
      g = sourceGain;
    old.onended = null;
    try {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      old.stop(ctx.currentTime + fade);
    } catch {}
    source = null;
    sourceGain = null;
  }
  function playBuffer(stage, buffer, offset = 0, lead = 0.05, ended = null) {
    ensure();
    stopSource();
    playingStage = stage;
    sourceOffset = Math.max(0, Math.min(offset, buffer.duration - 0.1));
    origin = ctx.currentTime + lead;
    const s = ctx.createBufferSource(),
      gain = ctx.createGain();
    s.buffer = buffer;
    gain.gain.setValueAtTime(0, origin);
    gain.gain.linearRampToValueAtTime(1, origin + 0.35);
    s.connect(gain).connect(master);
    source = s;
    sourceGain = gain;
    s.onended = () => {
      if (source === s) {
        source = null;
        sourceGain = null;
        if (ended) ended();
      }
    };
    s.start(origin, sourceOffset);
    updateVolume();
  }
  async function playHome() {
    const token = ++generation;
    try {
      const buffer = await loadTrack(homeStage);
      if (token !== generation || scene !== "menu" || !ctx) return;
      playBuffer(homeStage, buffer, homePosition, 0.05, () => {
        homePosition = 0;
        homeStage = (homeStage + 1) % homeCount;
        playHome();
      });
    } catch {}
  }
  async function playGameBackground() {
    const expected = scene,
      token = ++generation;
    const gameIndex =
      scene === "jump"
        ? jumpStart + (ambientStage % root.MidnightScore.jumpSongs.length)
        : scene === "maze"
          ? homeCount + (ambientStage % root.MidnightScore.songs.length)
          : homeCount + (ambientStage % root.MidnightScore.songs.length);
    try {
      const buffer = await loadTrack(gameIndex);
      if (
        token !== generation ||
        scene !== expected ||
        scene === "menu" ||
        scene === "rhythm" ||
        !ctx
      )
        return;
      playBuffer(gameIndex, buffer, 0, 0.05, () => playGameBackground());
    } catch {}
  }
  function playBackground() {
    return scene === "menu" ? playHome() : playGameBackground();
  }
  function rememberHome() {
    if (source && scene === "menu" && playingStage < homeCount && ctx)
      homePosition = Math.max(0, sourceOffset + ctx.currentTime - origin);
  }
  function start() {
    ensure();
    muted = false;
    if (ctx && !transportPaused) {
      ctx.resume().catch(() => {});
      // Unlock the output during the gesture, before a recording finishes loading.
      const unlock = ctx.createBufferSource();
      unlock.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      unlock.connect(ctx.destination);
      unlock.start();
    }
    if (!source && scene !== "rhythm") playBackground();
    updateVolume();
  }
  function setMuted(value) {
    muted = !!value;
    if (ctx && !muted && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
  }
  function playbackTime() {
    if (!ctx) return 0;
    if (ctx.state === "running" && ctx.getOutputTimestamp) {
      try {
        const stamp = ctx.getOutputTimestamp();
        const heard =
          stamp.contextTime +
          (performance.now() - stamp.performanceTime) / 1000;
        if (
          stamp.contextTime > 0 &&
          stamp.performanceTime > 0 &&
          heard <= ctx.currentTime + 0.01 &&
          heard >= ctx.currentTime - 0.5
        )
          return Math.min(heard, ctx.currentTime);
      } catch {}
    }
    return ctx.currentTime;
  }
  root.MidnightMusic = {
    start,
    setMuted,
    ready,
    setVolume(value) {
      volume = Math.max(0, Math.min(1, Number(value) || 0));
      updateVolume();
    },
    setHomeSong(stage) {
      homeStage = Math.max(0, Math.min(homeCount - 1, Number(stage) || 0));
      homePosition = 0;
      if (ctx && scene === "menu") playHome();
    },
    setPreviewing(value) {
      previewing = !!value;
      updateVolume();
    },
    ensureClock(value = false) {
      ensure();
      muted = !!value;
      if (ctx && !transportPaused) ctx.resume().catch(() => {});
      updateVolume();
    },
    selectSong(stage = 0, lead = 0.1) {
      ensure();
      const index =
        homeCount +
        Math.max(
          0,
          Math.min(root.MidnightScore.songs.length - 1, Number(stage) || 0),
        );
      const buffer = buffers.get(index);
      if (!buffer) throw Error("The music is still loading");
      ++generation;
      playBuffer(index, buffer, 0, lead);
    },
    setScene(value, stage = 0) {
      stage = Math.max(
        0,
        Math.min(root.MidnightScore.songs.length - 1, Number(stage) || 0),
      );
      if (value === scene && stage === ambientStage) return;
      rememberHome();
      ++generation;
      stopSource();
      scene = value;
      ambientStage = stage;
      if (value !== "rhythm" && ctx) playBackground();
      updateVolume();
    },
    setPaused(value) {
      transportPaused = !!value;
      if (!ctx) return;
      if (value) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    },
    clock: () => ({
      time: playbackTime(),
      origin,
      beat: tracks[playingStage].beat,
      running: ctx?.state === "running",
    }),
    status: () => ({
      source: tracks[playingStage].title,
      artist: tracks[playingStage].artist,
      mode: scene,
      recordingReady: buffers.has(playingStage),
      recordingOffset: sourceOffset,
      muted,
      volume,
      previewing,
      state: ctx?.state || "not-started",
      tempo: tracks[playingStage].tempo,
      themeSeconds: tracks[playingStage].duration,
      decodedSampleRate: buffers.get(playingStage)?.sampleRate,
      transportPaused,
    }),
    async renderPreview(stage = 0, seconds = 12) {
      const buffer = await ready(stage),
        rate = 22050,
        ac = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate),
        s = ac.createBufferSource(),
        g = ac.createGain();
      s.buffer = buffer;
      g.gain.value = 0.35;
      s.connect(g).connect(ac.destination);
      s.start();
      return ac.startRendering();
    },
  };
})(globalThis);
