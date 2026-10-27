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
  const sampled = new Map();
  let sampleLoad = null,
    sampleError = null;
  const instruments = {
    celesta: "acoustic_grand_piano",
    pizzicato: "orchestral_harp",
    reed: "string_ensemble_1",
    organ: "string_ensemble_1",
    bass: "contrabass",
  };
  async function ready() {
    if (sampleLoad) return sampleLoad;
    sampleLoad = (async () => {
      const response = await fetch("/assets/audio/instruments/manifest.json");
      if (!response.ok) throw new Error("Instrument library could not load");
      const manifest = await response.json();
      const decoder = new OfflineAudioContext(1, 1, 44100);
      await Promise.all(
        Object.entries(manifest).map(async ([name, notes]) => {
          const bank = await Promise.all(
            notes.map(async (midi) => {
              const r = await fetch(
                `/assets/audio/instruments/${name}-${midi}.mp3`,
              );
              if (!r.ok) throw new Error("Instrument sample could not load");
              return {
                midi,
                buffer: await decoder.decodeAudioData(await r.arrayBuffer()),
              };
            }),
          );
          sampled.set(name, bank);
        }),
      );
    })().catch((error) => {
      sampleError = error.message;
      sampleLoad = null;
      sampled.clear();
      throw error;
    });
    return sampleLoad;
  }
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
    const bank = sampled.get(instruments[instrument]);
    if (!bank) return;
    const sample = bank.reduce((best, n) =>
      Math.abs(n.midi - midi) < Math.abs(best.midi - midi) ? n : best,
    );
    const source = ac.createBufferSource(),
      gain = ac.createGain();
    source.buffer = sample.buffer;
    source.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);
    const sustained = instrument === "organ" || instrument === "reed";
    const attack = sustained ? 0.16 : 0.012,
      release = sustained ? 0.48 : 0.28;
    const level =
      volume * 4 * (sustained ? 1.6 : instrument === "bass" ? 2.3 : 2.8);
    gain.gain.setValueAtTime(0.00001, time);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.00002, level),
      time + attack,
    );
    gain.gain.setValueAtTime(
      Math.max(0.00002, level * (sustained ? 0.8 : 0.6)),
      time + Math.max(attack, duration * 0.6),
    );
    gain.gain.exponentialRampToValueAtTime(0.00001, time + duration + release);
    source.connect(gain).connect(destination);
    if (tracked) {
      tracked.add(source);
      source.onended = () => tracked.delete(source);
    }
    source.start(time);
    source.stop(time + duration + release + 0.02);
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
      const lead = song.lead === "reed" ? "organ" : song.lead;
      voice(
        ac,
        destination,
        p,
        time,
        beat * (lead === "reed" ? 1.05 : 1.45),
        0.085 * dynamic,
        lead,
        tracked,
      );
    }
    // The dancing bass-and-two-plucks pattern makes the 3/4 pulse audible.
    if (step === 0 || (song.beatsPerBar === 4 && step === 2)) {
      voice(
        ac,
        destination,
        chord[0] - 12 + (step === 2 ? 7 : 0),
        time,
        beat * 0.72,
        0.045,
        "bass",
        tracked,
      );
      if (step === 0 && bar % 4 === 0)
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
          0.012 * dynamic,
          "pizzicato",
          tracked,
        );
    }
  }
  function updateVolume() {
    if (master)
      master.gain.setTargetAtTime(
        muted || document.hidden || scene !== "rhythm"
          ? 0
          : scene === "maze"
            ? 0.3
            : scene === "rhythm"
              ? 0.46
              : 0.36,
        ctx.currentTime,
        0.6,
      );
  }
  function schedule() {
    if (!ctx || sampled.size !== 4 || scene !== "rhythm") return;
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
    filter.frequency.value = 2800;
    delay.delayTime.value = 0.19;
    send.gain.value = 0.045;
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
    ready()
      .then(() => {
        origin = ctx.currentTime + 0.08;
        nextBeat = 0;
        schedule();
      })
      .catch(() => {});
    document.addEventListener("visibilitychange", updateVolume);
  }
  function start() {
    muted = false;
    if (scene !== "rhythm") {
      root.MidnightHomeMusic.start();
      return;
    }
    ensure();
    muted = false;
    if (ctx && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
  }
  function setMuted(value) {
    muted = value;
    root.MidnightHomeMusic.setMuted(value || scene === "rhythm");
    if (ctx && !value && !transportPaused) ctx.resume().catch(() => {});
    updateVolume();
  }
  root.MidnightMusic = {
    start,
    setMuted,
    ready,
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
      const previous = scene;
      scene = value;
      root.MidnightHomeMusic.setMuted(muted || value === "rhythm");
      if (
        value !== "rhythm" &&
        !muted &&
        (previous === "rhythm" ||
          root.MidnightHomeMusic.status().state !== "not-started")
      )
        root.MidnightHomeMusic.start();
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
      arrangement: "Sampled piano, harp and strings",
      samplesReady: sampled.size === 4,
      sampleError,
      instruments: ["piano", "harp", "strings", "double bass"],
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
      await ready();
      const song = root.MidnightScore.getSong(stage),
        rate = 22050,
        ac = new OfflineAudioContext(2, Math.ceil(seconds * rate), rate),
        mix = createMix(ac, ac.destination, 0.46);
      for (let i = 0; i * song.beat < seconds; i++)
        arrangeBeat(ac, mix.filter, song, i, i * song.beat + 0.03);
      return ac.startRendering();
    },
  };
})(globalThis);
