const header = document.querySelector('.site-header');
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const canvas = document.querySelector('#starfield');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (canvas && !reducedMotion.matches) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    let width = 0;
    let height = 0;
    let stars = [];
    let frame = 0;
    const seed = (n) => {
      const x = Math.sin(n * 127.1 + 31.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(58, Math.max(28, Math.round(width / 24)));
      stars = Array.from({ length: count }, (_, i) => ({
        x: seed(i + 1) * width,
        y: seed(i + 100) * height,
        r: .6 + seed(i + 200) * 1.25,
        phase: seed(i + 300) * Math.PI * 2,
        speed: .3 + seed(i + 400) * .5
      }));
    };
    const draw = () => {
      if (document.hidden) { frame = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, width, height);
      const t = performance.now() / 3000;
      for (const star of stars) {
        const alpha = .17 + (Math.sin(t * star.speed + star.phase) + 1) * .13;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,230,236,${alpha.toFixed(3)})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    frame = requestAnimationFrame(draw);
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) { cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height); }
      else frame = requestAnimationFrame(draw);
    });
  }
}
