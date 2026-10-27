/* Finished, full-length instrumental recordings. No synthesized music or short-note loops. */
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
    generation = 0;
  const buffers = new Map(),
    loading = new Map();
  function ensure() {
    if (ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
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
  async function ready(stage = 0) {
    stage = Math.max(0, Math.min(4, Number(stage) || 0));
    if (buffers.has(stage)) return buffers.get(stage);
    if (loading.has(stage)) return loading.get(stage);
    const promise = (async () => {
      const r = await fetch(root.MidnightScore.getSong(stage).file);
      if (!r.ok) throw Error("Music recording could not load");
      const decoder = new OfflineAudioContext(2, 1, 22050),
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
      const buffer = await ready(homeStage);
      if (token !== generation || scene === "rhythm" || !ctx) return;
      playBuffer(homeStage, buffer, homePosition, 0.05, () => {
        homePosition = 0;
        homeStage = (homeStage + 1) % 5;
        playHome();
      });
    } catch {}
  }
  function rememberHome() {
    if (source && scene !== "rhythm" && ctx)
      homePosition = Math.max(0, sourceOffset + ctx.currentTime - origin);
  }
  function start() {
    ensure();
    muted = false;
    if (ctx && !transportPaused) ctx.resume().catch(() => {});
    if (!source && scene !== "rhythm") playHome();
    updateVolume();
  }
  function setMuted(value) {
    muted = !!value;
    if (ctx && !muted && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
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
      homeStage = Math.max(0, Math.min(4, Number(stage) || 0));
      homePosition = 0;
      if (ctx && scene !== "rhythm") playHome();
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
      const buffer = buffers.get(stage);
      if (!buffer) throw Error("The music is still loading");
      ++generation;
      playBuffer(stage, buffer, 0, lead);
    },
    setScene(value) {
      if (value === scene) return;
      const previous = scene;
      if (value === "rhythm") {
        rememberHome();
        ++generation;
        stopSource();
      }
      scene = value;
      if (previous === "rhythm" && value !== "rhythm" && ctx) playHome();
      updateVolume();
    },
    setPaused(value) {
      transportPaused = !!value;
      if (!ctx) return;
      if (value) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    },
    clock: () => ({
      time: ctx?.currentTime || 0,
      origin,
      beat: root.MidnightScore.getSong(playingStage).beat,
      running: ctx?.state === "running",
    }),
    status: () => ({
      source: root.MidnightScore.getSong(playingStage).title,
      artist: root.MidnightScore.getSong(playingStage).artist,
      mode: scene,
      recordingReady: buffers.has(playingStage),
      recordingOffset: sourceOffset,
      muted,
      volume,
      previewing,
      state: ctx?.state || "not-started",
      tempo: root.MidnightScore.getSong(playingStage).tempo,
      themeSeconds: root.MidnightScore.getSong(playingStage).duration,
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
