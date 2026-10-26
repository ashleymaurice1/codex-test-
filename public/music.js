/* Keep the creator's supplied audio as the soundtrack; overlap its loop boundaries. */
(function (root) {
  let ctx,
    master,
    buffer,
    loading = null,
    timer = null,
    nextStart = 0,
    muted = false,
    totalLoops = 0,
    scene = "menu",
    crossfade = 1.15;
  const active = new Set();
  function updateVolume() {
    if (master)
      master.gain.setTargetAtTime(
        muted || document.hidden
          ? 0
          : scene === "maze"
            ? 0.27
            : scene === "jump"
              ? 0.36
              : 0.34,
        ctx.currentTime,
        0.12,
      );
  }
  function queueLoop(when) {
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    const fade = Math.min(crossfade, buffer.duration / 4),
      end = when + buffer.duration;
    const rise = new Float32Array(40),
      fall = new Float32Array(40);
    for (let i = 0; i < 40; i++) {
      rise[i] = Math.sin(((i / 39) * Math.PI) / 2);
      fall[i] = Math.cos(((i / 39) * Math.PI) / 2);
    }
    gain.gain.setValueAtTime(0, when);
    gain.gain.setValueCurveAtTime(rise, when, fade);
    gain.gain.setValueAtTime(1, end - fade);
    gain.gain.setValueCurveAtTime(fall, end - fade, fade);
    source.connect(gain).connect(master);
    source.start(when);
    source.stop(end + 0.02);
    active.add(source);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    totalLoops++;
    return end - fade;
  }
  function schedule() {
    if (!buffer) return;
    if (nextStart < ctx.currentTime - 0.15) nextStart = ctx.currentTime + 0.04;
    while (nextStart < ctx.currentTime + 0.6) nextStart = queueLoop(nextStart);
  }
  function start() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      document.addEventListener("visibilitychange", updateVolume);
    }
    ctx.resume().catch(() => {});
    muted = false;
    updateVolume();
    if (!loading) {
      loading = fetch("/assets/opening.m4a")
        .then((r) => {
          if (!r.ok) throw Error("Original soundtrack could not load");
          return r.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .then((decoded) => {
          buffer = decoded;
          nextStart = ctx.currentTime + 0.05;
          schedule();
          timer = setInterval(schedule, 100);
        })
        .catch(() => {
          loading = null;
        });
    }
  }
  function setMuted(value) {
    muted = value;
    if (!value && ctx) ctx.resume().catch(() => {});
    updateVolume();
  }
  root.MidnightMusic = {
    start,
    setMuted,
    setScene(value) {
      scene = value;
      updateVolume();
    },
    status: () => ({
      source: "original-opening.m4a",
      state: ctx?.state || "not-started",
      muted,
      loaded: !!buffer,
      clipDuration: buffer?.duration || 0,
      totalLoops,
      crossfadeSeconds: buffer ? Math.min(crossfade, buffer.duration / 4) : 0,
      activeSources: active.size,
      hasScheduler: !!timer,
    }),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
