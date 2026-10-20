// Hero field: a grid of dots whose sizes are drawn from a Pareto distribution
// tuned to the 80/20 rule. Scrolling through the hero raises a rank threshold,
// so the many small dots drop away and only the vital few stay lit.
(() => {
  const canvas = document.getElementById('field');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ALPHA = Math.log(5) / Math.log(4); // Pareto index where top 20% hold 80%
  const VITAL = 0.995; // rank above which a dot counts as one of the vital few
  const INK = [236, 233, 226];
  const ACCENT = [255, 90, 31];
  const $ = (id) => document.getElementById(id);

  let W = 0, H = 0, pts = [], progress = 0;
  const mouse = { x: -1e4, y: -1e4 };

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gap = W < 640 ? 18 : 24;
    const cols = Math.floor(W / gap), rows = Math.floor(H / gap);
    const ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
    pts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const m = Math.pow(1 - Math.random(), -1 / ALPHA);
        pts.push({
          x: ox + c * gap,
          y: oy + r * gap,
          m,
          r: Math.min(9, 0.6 + 1.9 * Math.log(m)),
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    const sorted = pts.slice().sort((a, b) => a.m - b.m);
    sorted.forEach((p, i) => {
      p.rank = i / (sorted.length - 1);
      p.vital = p.rank >= VITAL;
    });

    const total = sorted.reduce((s, p) => s + p.m, 0);
    const top = sorted.slice(Math.floor(sorted.length * 0.8)).reduce((s, p) => s + p.m, 0);
    $('r-n').textContent = pts.length.toLocaleString();
    $('r-share').textContent = ((top / total) * 100).toFixed(1) + '%';
  }

  function mix(k) {
    return INK.map((v, i) => Math.round(v + (ACCENT[i] - v) * k)).join(',');
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // Ease-out so the noise clears early and the vital few hold the screen longer.
    const thr = VITAL * (1 - Math.pow(1 - progress, 3));
    let visible = 0;

    for (const p of pts) {
      const f = p.vital ? 1 : Math.min(1, Math.max(0, (p.rank - thr) / 0.04));
      if (f <= 0) continue;
      visible++;

      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d = Math.hypot(dx, dy) || 1;
      let k = Math.max(0, 1 - d / 170);
      k *= k;

      const pulse = reduce ? 1 : 1 + 0.18 * Math.sin(t * 0.0012 + p.ph);
      const grow = p.vital ? 1 + progress * 1.4 : 1;
      const r = p.r * pulse * (1 + 1.6 * k) * grow;
      const x = p.x + (dx / d) * 14 * k;
      const y = p.y + (dy / d) * 14 * k;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      if (p.vital) {
        ctx.fillStyle = `rgba(${mix(1)},${f})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r + 6 + (reduce ? 0 : 3 * Math.sin(t * 0.002 + p.ph)), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${mix(1)},${0.35 * f})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const a = Math.min(1, 0.12 + 0.07 * p.r + 0.7 * k) * f;
        ctx.fillStyle = `rgba(${mix(k)},${a})`;
        ctx.fill();
      }
    }
    $('r-vis').textContent = visible.toLocaleString();
  }

  function measure() {
    const rect = hero.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    progress = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
    hero.style.setProperty('--p', progress.toFixed(3));
    return rect.bottom > 0;
  }

  function frame(t) {
    if (measure()) draw(t || 0);
    if (!reduce) requestAnimationFrame(frame);
  }

  let lastW = 0, lastH = 0;
  function resize() {
    // Ignore small height changes from mobile browser toolbars.
    if (canvas.clientWidth === lastW && Math.abs(canvas.clientHeight - lastH) < 120) return;
    lastW = canvas.clientWidth;
    lastH = canvas.clientHeight;
    build();
    if (reduce) frame();
  }

  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    if (reduce) frame();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  window.addEventListener('resize', resize);
  if (reduce) window.addEventListener('scroll', () => frame(), { passive: true });

  resize();
  frame();
})();

// Fade sections in as they enter the viewport. CSS only hides .reveal under html.js,
// so content stays visible if this script never runs.
(() => {
  document.documentElement.classList.add('js');
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
})();
