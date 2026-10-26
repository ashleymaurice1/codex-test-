/* Original eight-bar woodland arcade theme. Notes are composed for this game. */
(function (root) {
  let ctx,
    master,
    filter,
    echo,
    echoGain,
    compressor,
    noise,
    nextTime = 0,
    step = 0,
    timer = null,
    muted = false,
    totalSteps = 0;
  const bpm = 112,
    eighth = 60 / bpm / 2;
  const chords = [
    [50, 53, 57, 60],
    [46, 50, 53, 57],
    [53, 57, 60, 64],
    [48, 52, 55, 59],
    [50, 53, 57, 62],
    [46, 50, 53, 60],
    [43, 46, 50, 57],
    [45, 48, 52, 57],
  ];
  const melody = [
    74,
    null,
    77,
    81,
    79,
    null,
    77,
    74,
    72,
    null,
    74,
    77,
    74,
    null,
    70,
    72,
    77,
    null,
    81,
    84,
    81,
    79,
    77,
    null,
    76,
    null,
    79,
    83,
    79,
    76,
    72,
    null,
    74,
    77,
    null,
    81,
    86,
    null,
    81,
    79,
    77,
    null,
    74,
    72,
    70,
    null,
    74,
    77,
    79,
    null,
    77,
    74,
    70,
    74,
    77,
    null,
    76,
    72,
    69,
    null,
    72,
    76,
    73,
    null,
  ];
  function frequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function note(
    midi,
    time,
    duration,
    volume,
    type = "sine",
    destination = filter,
  ) {
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency(midi);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + duration + 0.03);
  }
  function percussion(time, hat = false) {
    const source = ctx.createBufferSource(),
      hp = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = noise;
    hp.type = "highpass";
    hp.frequency.value = hat ? 6500 : 1700;
    gain.gain.setValueAtTime(hat ? 0.018 : 0.035, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (hat ? 0.035 : 0.1));
    source.connect(hp).connect(gain).connect(master);
    source.start(time);
    source.stop(time + 0.13);
  }
  function kick(time) {
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.frequency.setValueAtTime(112, time);
    o.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    g.gain.setValueAtTime(0.12, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
    o.connect(g).connect(master);
    o.start(time);
    o.stop(time + 0.2);
  }
  function schedule() {
    const now = ctx.currentTime;
    if (nextTime < now) nextTime = now + 0.025;
    while (nextTime < now + 0.28) {
      const bar = Math.floor(step / 8),
        within = step % 8,
        chord = chords[bar];
      if (within === 0) {
        chord.forEach((n, i) =>
          note(n + 12, nextTime, eighth * 7.8, 0.018, "triangle"),
        );
      }
      if (within === 0 || within === 4)
        note(chord[0] - 12, nextTime, eighth * 1.8, 0.1, "sine");
      if (melody[step] !== null) {
        note(melody[step], nextTime, eighth * 2.6, 0.105, "sine");
        note(melody[step] + 12, nextTime, eighth * 0.65, 0.012, "triangle");
      }
      if (within % 2 === 0) kick(nextTime);
      if (within === 2 || within === 6) percussion(nextTime);
      if (within % 2 === 1) percussion(nextTime, true);
      if (within === 3 || within === 7)
        note(
          chord[within === 3 ? 1 : 2] + 24,
          nextTime,
          eighth * 0.8,
          0.026,
          "triangle",
        );
      step = (step + 1) % 64;
      totalSteps++;
      nextTime += eighth;
    }
  }
  function gainForState() {
    if (!master) return;
    master.gain.setTargetAtTime(
      muted || document.hidden ? 0 : 0.36,
      ctx.currentTime,
      0.16,
    );
  }
  function start() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 5000;
      echo = ctx.createDelay(1);
      echo.delayTime.value = eighth * 1.5;
      echoGain = ctx.createGain();
      echoGain.gain.value = 0.2;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 3;
      filter.connect(master);
      filter.connect(echo);
      echo.connect(echoGain);
      echoGain.connect(master);
      master.connect(compressor).connect(ctx.destination);
      noise = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * 0.15),
        ctx.sampleRate,
      );
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      nextTime = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 80);
      schedule();
      document.addEventListener("visibilitychange", gainForState);
    }
    ctx.resume().catch(() => {});
    muted = false;
    gainForState();
  }
  function setMuted(value) {
    muted = value;
    if (!value && ctx) ctx.resume().catch(() => {});
    gainForState();
  }
  root.MidnightMusic = {
    start,
    setMuted,
    status: () => ({
      state: ctx?.state || "not-started",
      muted,
      totalSteps,
      loopStep: step,
      bpm,
      hasScheduler: !!timer,
    }),
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
