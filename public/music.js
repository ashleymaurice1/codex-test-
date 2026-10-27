/* A long, mellow original Halloween lounge theme; the rhythm game shares this audio clock. */
(function (root) {
  let ctx,
    master,
    bus,
    echo,
    echoGain,
    compressor,
    timer = null,
    origin = 0,
    nextBeat = 0,
    muted = false,
    scene = "menu",
    transportPaused = false,
    totalNotes = 0;
  let score = root.MidnightScore.getSong(0);
  const voices = new Set();
  function hz(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }
  function updateVolume() {
    if (master)
      master.gain.setTargetAtTime(
        muted || document.hidden
          ? 0
          : scene === "maze"
            ? 0.42
            : scene === "rhythm"
              ? 0.64
              : 0.5,
        ctx.currentTime,
        0.45,
      );
  }
  function tone(midi, time, duration, volume, type = "sine") {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = type;
    o.frequency.value = hz(midi);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(volume, time + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g).connect(bus);
    voices.add(o);
    o.onended = () => voices.delete(o);
    o.start(time);
    o.stop(time + duration + 0.03);
  }
  function schedule() {
    if (!ctx) return;
    while (origin + nextBeat * score.beat < ctx.currentTime + 0.35) {
      const t = origin + nextBeat * score.beat;
      if (t >= ctx.currentTime - 0.04) {
        const p = score.noteAtBeat(nextBeat);
        if (p !== null) {
          tone(p, t, score.beat * 1.45, 0.11, score.voice);
          tone(p + 12, t, score.beat * 0.55, 0.009, "triangle");
          totalNotes++;
        }
        if (nextBeat % 4 === 0) {
          const chord =
            score.chords[Math.floor(nextBeat / 4) % score.chords.length];
          chord.forEach((n) =>
            tone(n + 12, t, score.beat * 4.2, 0.012, "triangle"),
          );
          tone(chord[0] - 12, t, score.beat * 2.5, 0.035, score.bass);
        }
      }
      nextBeat++;
    }
  }
  function ensure() {
    if (ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    bus = ctx.createBiquadFilter();
    bus.type = "lowpass";
    bus.frequency.value = 4400;
    echo = ctx.createDelay(1);
    echo.delayTime.value = score.beat * 0.75;
    echoGain = ctx.createGain();
    echoGain.gain.value = 0.13;
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.ratio.value = 2.5;
    bus.connect(master);
    bus.connect(echo);
    echo.connect(echoGain).connect(master);
    master.connect(compressor).connect(ctx.destination);
    origin = ctx.currentTime + 0.08;
    timer = setInterval(schedule, 80);
    schedule();
    document.addEventListener("visibilitychange", updateVolume);
  }
  function start() {
    ensure();
    muted = false;
    if (ctx && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
  }
  function setMuted(value) {
    muted = value;
    if (ctx && !value && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
  }
  root.MidnightMusic = {
    start,
    setMuted,
    ensureClock(value = false) {
      ensure();
      muted = value;
      if (ctx && !transportPaused) ctx.resume().catch(() => {});
      updateVolume();
    },
    selectSong(stage = 0, lead = 0.1) {
      ensure();
      score = root.MidnightScore.getSong(stage);
      for (const o of voices) {
        try {
          o.stop();
        } catch {}
      }
      voices.clear();
      origin = (ctx?.currentTime || 0) + lead;
      nextBeat = 0;
      if (echo) echo.delayTime.value = score.beat * 0.75;
      schedule();
    },
    setScene(value) {
      if (scene === "rhythm" && value !== "rhythm") this.selectSong(0);
      scene = value;
      updateVolume();
    },
    setPaused(value) {
      transportPaused = value;
      if (!ctx) return;
      if (value) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    },
    clock: () => ({
      time: ctx?.currentTime || 0,
      origin,
      beat: score.beat,
      running: ctx?.state === "running",
    }),
    status: () => ({
      source: score.title,
      state: ctx?.state || "not-started",
      muted,
      totalNotes,
      tempo: score.tempo,
      themeSeconds: score.duration,
      hasScheduler: !!timer,
      transportPaused,
    }),
  };
})(globalThis);
