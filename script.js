const header = document.querySelector(".site-header");
const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const canvas = document.querySelector("#bg");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const ROUTES = [
  [[0.03, 0.07], [0.16, 0.07], [0.16, 0.18]],
  [[0.24, 0.05], [0.42, 0.05], [0.42, 0.14], [0.58, 0.14]],
  [[0.7, 0.08], [0.9, 0.08], [0.9, 0.22], [0.74, 0.22]],
  [[0.05, 0.3], [0.14, 0.3], [0.14, 0.44], [0.28, 0.44]],
  [[0.52, 0.28], [0.68, 0.28], [0.68, 0.42], [0.86, 0.42], [0.86, 0.56]],
  [[0.06, 0.56], [0.22, 0.56], [0.22, 0.7], [0.38, 0.7]],
  [[0.46, 0.6], [0.64, 0.6], [0.64, 0.48], [0.8, 0.48]],
  [[0.08, 0.78], [0.08, 0.9], [0.28, 0.9], [0.28, 0.8]],
  [[0.4, 0.74], [0.56, 0.74], [0.56, 0.9], [0.76, 0.9]],
  [[0.84, 0.66], [0.97, 0.66], [0.97, 0.84]],
  [[0.2, 0.2], [0.34, 0.2], [0.34, 0.34]],
  [[0.38, 0.38], [0.5, 0.38], [0.5, 0.26]],
  [[0.02, 0.48], [0.1, 0.48], [0.1, 0.64]],
  [[0.62, 0.08], [0.62, 0.2]],
  [[0.72, 0.94], [0.94, 0.94]],
  [[0.34, 0.96], [0.52, 0.96], [0.52, 0.86]],
  [[0.16, 0.62], [0.16, 0.5], [0.3, 0.5]],
  [[0.9, 0.36], [0.96, 0.36], [0.96, 0.5]]
];

function hash(n) {
  const x = Math.sin(n * 127.1 + 31.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeSprite(r, g, b) {
  const size = 64;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const gtx = sprite.getContext("2d");
  const grad = gtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.2, `rgba(${r},${g},${b},0.7)`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.18)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  gtx.fillStyle = grad;
  gtx.fillRect(0, 0, size, size);
  return sprite;
}

if (canvas) {
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const starSprite = makeSprite(214, 236, 242);
    const warmSprite = makeSprite(232, 226, 255);
    const pulseSprite = makeSprite(170, 236, 230);
    const violetSprite = makeSprite(196, 184, 245);
    const stars = Array.from({ length: 240 }, (_, i) => ({
      nx: hash(i + 1),
      ny: hash(i + 80),
      depth: hash(i + 160),
      phase: hash(i + 240) * Math.PI * 2,
      twinkle: 0.45 + hash(i + 320) * 2.4,
      vx: (hash(i + 400) - 0.35) * (5 + hash(i + 480) * 16),
      vy: 4 + hash(i + 560) * 14,
      violet: hash(i + 640) > 0.86
    }));

    let width = 0;
    let height = 0;
    let routes = [];
    let frame = 0;
    let last = performance.now();
    let running = !reducedMotion.matches;

    const layoutRoutes = () => {
      routes = ROUTES.map((route, index) => {
        const pts = route.map(([nx, ny]) => ({ x: nx * width, y: ny * height }));
        const cum = [0];
        for (let i = 1; i < pts.length; i += 1) {
          const dx = pts[i].x - pts[i - 1].x;
          const dy = pts[i].y - pts[i - 1].y;
          cum.push(cum[i - 1] + Math.hypot(dx, dy));
        }
        const total = cum[cum.length - 1] || 1;
        const pulses = total < 80 ? [] : [0, 1].slice(0, total > 480 ? 2 : 1).map((p) => ({
          offset: (total / (total > 480 ? 2 : 1)) * p,
          speed: 70 + hash(index * 5 + p + 3) * 55,
          span: 28 + hash(index * 9 + p + 8) * 26,
          violet: (index + p) % 3 === 0
        }));
        return { pts, cum, total, pulses, alpha: 0.22 + hash(index + 11) * 0.16 };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutRoutes();
    };

    const pointAt = (route, dist) => {
      const total = route.total;
      let d = ((dist % total) + total) % total;
      let seg = 0;
      while (seg < route.pts.length - 2 && route.cum[seg + 1] < d) seg += 1;
      const segLen = route.cum[seg + 1] - route.cum[seg] || 1;
      const t = (d - route.cum[seg]) / segLen;
      const a = route.pts[seg];
      const b = route.pts[seg + 1];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    };

    const strokeHot = (route, head, span, violet) => {
      const steps = 8;
      ctx.lineWidth = 1.8;
      for (let i = steps; i >= 1; i -= 1) {
        const from = pointAt(route, head - (span * i) / steps);
        const to = pointAt(route, head - (span * (i - 1)) / steps);
        if (Math.hypot(to.x - from.x, to.y - from.y) > span * 0.55) continue;
        const alpha = (0.12 + (1 - i / steps) * 0.78).toFixed(3);
        ctx.strokeStyle = violet
          ? `rgba(198, 186, 246, ${alpha})`
          : `rgba(176, 244, 238, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    };

    const drawStars = (now, dt, motion) => {
      const count = width < 700 ? 120 : 220;
      for (let i = 0; i < count; i += 1) {
        const star = stars[i];
        if (motion) {
          star.nx += (star.vx * dt) / width;
          star.ny += (star.vy * dt) / height;
          if (star.nx > 1.02) star.nx -= 1.08;
          if (star.nx < -0.02) star.nx += 1.08;
          if (star.ny > 1.02) star.ny -= 1.08;
          if (star.ny < -0.02) star.ny += 1.08;
        }
        const wave = 0.5 + 0.5 * Math.sin(now * 0.001 * star.twinkle + star.phase);
        const sharp = star.depth > 0.9 ? wave ** 3 : wave;
        const alpha = 0.4 + sharp * (0.45 + star.depth * 0.5);
        const size = 2.8 + star.depth * 11;
        ctx.globalAlpha = alpha;
        ctx.drawImage(
          star.violet ? warmSprite : starSprite,
          star.nx * width - size,
          star.ny * height - size,
          size * 2,
          size * 2
        );
      }
      ctx.globalAlpha = 1;
    };

    const drawCircuit = (now, motion) => {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const route of routes) {
        ctx.beginPath();
        ctx.moveTo(route.pts[0].x, route.pts[0].y);
        for (let i = 1; i < route.pts.length; i += 1) ctx.lineTo(route.pts[i].x, route.pts[i].y);
        ctx.strokeStyle = `rgba(160, 226, 232, ${route.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.fillStyle = "rgba(176, 226, 232, 0.4)";
        for (const pt of route.pts) ctx.fillRect(pt.x - 1.15, pt.y - 1.15, 2.3, 2.3);
      }
      const elapsed = now * 0.001;
      for (const route of routes) {
        for (const pulse of route.pulses) {
          const head = motion ? elapsed * pulse.speed + pulse.offset : pulse.offset;
          strokeHot(route, head, pulse.span, pulse.violet);
          const tip = pointAt(route, head);
          const glow = 12;
          ctx.globalAlpha = 1;
          ctx.drawImage(pulse.violet ? violetSprite : pulseSprite, tip.x - glow, tip.y - glow, glow * 2, glow * 2);
          ctx.globalAlpha = 1;
        }
      }
    };

    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      drawStars(now, running ? dt : 0, running);
      drawCircuit(now, running);
      if (running && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!running) return;
      cancelAnimationFrame(frame);
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && running) start();
    });
    reducedMotion.addEventListener("change", (event) => {
      running = !event.matches;
      if (running) start();
      else {
        cancelAnimationFrame(frame);
        draw(performance.now());
      }
    });
    draw(performance.now());
    if (running) start();
  }
}
