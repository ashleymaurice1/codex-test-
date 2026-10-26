/* One gentle victory loop, then a still proud pose. */
(function (root) {
  let cancel = null;
  function stop() {
    if (cancel) cancel();
    cancel = null;
  }
  function play(team, element) {
    stop();
    if (!element) return;
    element.classList.add("winner-proud");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.className = "victory-trail";
    document.body.append(canvas);
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    const c = canvas.getContext("2d");
    c.scale(ratio, ratio);
    const color =
      { Mach: "#B8D4FF", Slink: "#9BD14B", Ember: "#F28C28", Misty: "#7B4BB7" }[
        team
      ] || "#B8D4FF";
    let frame,
      done = false;
    const points = [],
      start = performance.now(),
      duration = 2450;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      element.style.transform = "";
      canvas.remove();
      cancel = null;
    };
    cancel = finish;
    function draw(now) {
      if (!element.isConnected) return finish();
      const t = Math.min(1, (now - start) / duration),
        ease = (1 - Math.cos(Math.PI * t)) / 2,
        angle = ease * Math.PI * 2,
        x = Math.sin(angle) * 43,
        y = -(1 - Math.cos(angle)) * 23;
      element.style.transform = `translate(${x}px,${y}px) rotate(${Math.sin(angle) * 5}deg)`;
      const r = element.getBoundingClientRect();
      points.push({
        x: r.left + r.width * 0.36,
        y: r.top + r.height * 0.65,
        time: now,
      });
      while (points.length && now - points[0].time > 620) points.shift();
      c.clearRect(0, 0, innerWidth, innerHeight);
      c.strokeStyle = color;
      c.shadowColor = color;
      c.shadowBlur = 10;
      c.lineCap = "round";
      for (let i = 1; i < points.length; i++) {
        c.globalAlpha = (i / points.length) * 0.65 * (1 - t * 0.6);
        c.lineWidth = 3 + (i / points.length) * 6;
        c.beginPath();
        c.moveTo(points[i - 1].x, points[i - 1].y);
        c.lineTo(points[i].x, points[i].y);
        c.stroke();
      }
      if (t < 1) frame = requestAnimationFrame(draw);
      else finish();
    }
    frame = requestAnimationFrame(draw);
  }
  root.MidnightVictory = { play, stop };
})(globalThis);
