/* Original haunted chamber waltzes: celesta, pizzicato, reeds and soft organ. */
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
  const timbres = {
    celesta: [
      [1, 1],
      [2.76, 0.19],
      [4.12, 0.075],
      [5.43, 0.025],
    ],
    pizzicato: [
      [1, 0.8],
      [2, 0.18],
      [3, 0.07],
      [4, 0.025],
    ],
    reed: [
      [1, 0.8],
      [2, 0.08],
      [3, 0.2],
      [5, 0.045],
    ],
    organ: [
      [1, 0.7],
      [2, 0.2],
      [3, 0.075],
      [4, 0.025],
    ],
    bass: [
      [1, 1],
      [2, 0.12],
      [3, 0.025],
    ],
  };
  function voice(
    ac,
    destination,
    midi,
    time,
    duration,
    volume,
    instrument,
    tracked,
  ) {
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const attack =
      instrument === "organ" ? 0.16 : instrument === "reed" ? 0.055 : 0.008;
    const end = time + Math.max(duration, attack + 0.04);
    for (const [ratio, weight] of timbres[instrument]) {
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = "sine";
      o.frequency.value = frequency * ratio;
      g.gain.setValueAtTime(0.00001, time);
      g.gain.exponentialRampToValueAtTime(
        Math.max(0.00002, volume * weight),
        time + attack,
      );
      if (instrument === "organ" || instrument === "reed")
        g.gain.setValueAtTime(
          Math.max(0.00002, volume * weight * 0.65),
          time + Math.min(duration * 0.5, attack + 0.2),
        );
      g.gain.exponentialRampToValueAtTime(0.00001, end);
      o.connect(g).connect(destination);
      if (tracked) {
        tracked.add(o);
        o.onended = () => tracked.delete(o);
      }
      o.start(time);
      o.stop(end + 0.025);
    }
  }
  function arrangeBeat(ac, destination, song, index, time, tracked) {
    const bar = Math.floor(index / song.beatsPerBar),
      step = index % song.beatsPerBar,
      phrase = Math.floor(bar / 8) % 5,
      chord = song.chords[bar % song.chords.length],
      p = song.noteAtBeat(index),
      beat = song.beat;
    const dynamic = phrase === 2 ? 0.72 : phrase === 4 ? 0.9 : 1;
    if (p !== null) {
      const lead = phrase === 2 ? "reed" : song.lead;
      voice(
        ac,
        destination,
        p,
        time,
        beat * (lead === "reed" ? 1.05 : 1.45),
        0.12 * dynamic,
        lead,
        tracked,
      );
    }
    // The dancing bass-and-two-plucks pattern makes the 3/4 pulse audible.
    if (step === 0) {
      voice(
        ac,
        destination,
        chord[0] - 12,
        time,
        beat * 0.72,
        0.09,
        "bass",
        tracked,
      );
      if (bar % 4 === 0)
        for (const n of chord.slice(0, 3))
          voice(
            ac,
            destination,
            n + 12,
            time,
            beat * 2.85,
            0.008,
            "organ",
            tracked,
          );
    } else {
      for (const n of chord.slice(0, 3))
        voice(
          ac,
          destination,
          n + 12,
          time,
          beat * 0.48,
          0.023 * dynamic,
          "pizzicato",
          tracked,
        );
    }
    if (step === 0 && bar % 8 === 0)
      voice(
        ac,
        destination,
        chord[0] + 36,
        time,
        beat * 2.6,
        0.012,
        "celesta",
        tracked,
      );
  }
  function updateVolume() {
    if (master)
      master.gain.setTargetAtTime(
        muted || document.hidden
          ? 0
          : scene === "maze"
            ? 0.36
            : scene === "rhythm"
              ? 0.56
              : 0.44,
        ctx.currentTime,
        0.6,
      );
  }
  function schedule() {
    if (!ctx) return;
    while (origin + nextBeat * score.beat < ctx.currentTime + 0.35) {
      const t = origin + nextBeat * score.beat;
      if (t >= ctx.currentTime - 0.04) {
        arrangeBeat(ctx, bus, score, nextBeat, t, voices);
        if (score.noteAtBeat(nextBeat) !== null) totalNotes++;
      }
      nextBeat++;
    }
  }
  function createMix(ac, destination, level) {
    const out = ac.createGain(),
      filter = ac.createBiquadFilter(),
      delay = ac.createDelay(1),
      send = ac.createGain(),
      comp = ac.createDynamicsCompressor();
    out.gain.value = level;
    filter.type = "lowpass";
    filter.frequency.value = 5200;
    delay.delayTime.value = 0.19;
    send.gain.value = 0.09;
    comp.threshold.value = -18;
    comp.ratio.value = 2.5;
    filter.connect(out);
    filter.connect(delay);
    delay.connect(send).connect(out);
    out.connect(comp).connect(destination);
    return { out, filter, delay, send, comp };
  }
  function ensure() {
    if (ctx) return;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const mix = createMix(ctx, ctx.destination, 0);
    master = mix.out;
    bus = mix.filter;
    echo = mix.delay;
    echoGain = mix.send;
    compressor = mix.comp;
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
      arrangement: "Haunted chamber waltz",
      instruments: ["celesta", "pizzicato", "reed", "organ", "bass"],
      beatsPerBar: score.beatsPerBar,
      state: ctx?.state || "not-started",
      muted,
      totalNotes,
      tempo: score.tempo,
      themeSeconds: score.duration,
      hasScheduler: !!timer,
      transportPaused,
    }),
    async renderPreview(stage = 0, seconds = 12) {
      const song = root.MidnightScore.getSong(stage),
        rate = 22050,
        ac = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate),
        mix = createMix(ac, ac.destination, 0.56);
      for (let i = 0; i * song.beat < seconds; i++)
        arrangeBeat(ac, mix.filter, song, i, i * song.beat + 0.03);
      return ac.startRendering();
    },
  };
})(globalThis);
