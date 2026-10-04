const PXFX = (() => {
 const GRID = 3;
 const COL = {
  fire: [ "#fff2a0", "#ff8a1e", "#d8200a" ],
  water: [ "#e0f6ff", "#5fb2ff", "#1f4f9a" ],
  wind: [ "#f4ffe8", "#9ae07a", "#2a7a3a" ],
  earth: [ "#ffe0a8", "#c27a2c", "#5e3510" ],
  light: [ "#ffffff", "#fff3a6", "#e9b820" ],
  dark: [ "#f0d8ff", "#b07ae8", "#3a1a6e" ]
 };
 let cv = null, g = null, parts = [], running = false, last = 0, dpr = 1;
 const rnd = (a, b) => a + Math.random() * (b - a);
 const pick = a => a[Math.floor(Math.random() * a.length)];
 function ensure() {
  if (cv && cv.isConnected) return;
  cv = document.createElement("canvas");
  cv.className = "px-layer";
  document.body.appendChild(cv);
  resize();
  addEventListener("resize", resize);
 }
 function resize() {
  dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  g = cv.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.imageSmoothingEnabled = false;
 }
 function tick(f) {
  let fired = false;
  const id = requestAnimationFrame(t => {
   fired = true;
   f(t);
  });
  setTimeout(() => {
   if (!fired) {
    cancelAnimationFrame(id);
    f(performance.now());
   }
  }, 50);
 }
 function add(p) {
  ensure();
  parts.push(Object.assign({
   vx: 0,
   vy: 0,
   g: 0,
   drag: 1,
   life: 600,
   age: 0,
   size: GRID,
   delay: 0,
   glow: 0,
   grow: 0
  }, p));
  if (!running) {
   running = true;
   last = performance.now();
   tick(loop);
  }
 }
 function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  const k = dt / 16;
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => {
   if (p.delay > 0) {
    p.delay -= dt;
    return true;
   }
   p.age += dt;
   if (p.age >= p.life) return false;
   p.vx *= Math.pow(p.drag, k);
   p.vy *= Math.pow(p.drag, k);
   p.vy += p.g * k;
   p.x += p.vx * k;
   p.y += p.vy * k;
   const t = p.age / p.life;
   const a = p.hold ? t < p.hold ? 1 : 1 - (t - p.hold) / (1 - p.hold) : 1 - t;
   const s = Math.max(GRID, Math.round((p.size + p.grow * t) / GRID) * GRID);
   const x = Math.round(p.x / GRID) * GRID, y = Math.round(p.y / GRID) * GRID;
   g.globalAlpha = Math.max(0, a);
   if (p.glow) {
    g.shadowColor = p.color;
    g.shadowBlur = p.glow;
   }
   g.fillStyle = p.color;
   g.fillRect(x - s / 2, y - s / 2, s, s);
   g.shadowBlur = 0;
   return true;
  });
  g.globalAlpha = 1;
  if (parts.length) tick(loop); else {
   running = false;
   g.clearRect(0, 0, innerWidth, innerHeight);
  }
 }
 function line(x1, y1, x2, y2, opt) {
  const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / GRID));
  for (let i = 0; i <= n; i++) {
   const t = i / n;
   const q = opt.p(t, i);
   q.delay = (opt.speed || 0) * i + (q.delay || 0);
   add(Object.assign({
    x: x1 + (x2 - x1) * t,
    y: y1 + (y2 - y1) * t
   }, q));
  }
 }
 const center = r => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2
 });
 function cast(attr, r, power) {
  const c = COL[attr] || COL.light, m = center(r);
  const big = Math.min(2, .7 + (power || 4) / 10);
  if (attr === "fire") {
   for (let i = 0; i < 120 * big; i++) {
    add({
     x: m.x + rnd(-r.width * .32, r.width * .32),
     y: r.bottom - r.height * rnd(.05, .3),
     vx: rnd(-.8, .8),
     vy: rnd(-10, -4) * big,
     drag: .965,
     life: rnd(500, 900),
     color: pick(c),
     size: pick([ 6, 6, 9, 12 ]),
     grow: -3,
     glow: 10,
     delay: rnd(0, 200)
    });
   }
  } else if (attr === "water") {
   for (let i = 0; i < 60 * big; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(3, 9) * big;
    add({
     x: m.x,
     y: m.y,
     vx: Math.cos(a) * v,
     vy: Math.sin(a) * v - 3,
     g: .45,
     drag: .97,
     life: rnd(500, 900),
     color: pick(c),
     size: pick([ 3, 6 ])
    });
   }
   for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    add({
     x: m.x + Math.cos(a) * 10,
     y: m.y + Math.sin(a) * 6,
     vx: Math.cos(a) * 6,
     vy: Math.sin(a) * 3.5,
     drag: .9,
     life: 450,
     color: c[0],
     size: 6,
     glow: 6
    });
   }
  } else if (attr === "wind") {
   for (let k = 0; k < 3; k++) {
    const off = (k - 1) * r.width * .22;
    line(m.x - r.width * .4 + off, m.y - r.height * .35, m.x + r.width * .4 + off, m.y + r.height * .35, {
     speed: 2.5,
     p: t => ({
      life: 380,
      color: t < .5 ? c[0] : c[1],
      size: 6 * Math.sin(Math.PI * t) + 3,
      delay: k * 90,
      glow: 6,
      hold: .4
     })
    });
   }
   for (let i = 0; i < 30; i++) add({
    x: m.x,
    y: m.y,
    vx: rnd(-8, 8),
    vy: rnd(-4, 4),
    drag: .92,
    life: 500,
    color: pick(c),
    size: 3
   });
  } else if (attr === "earth") {
   for (let i = 0; i < 9 * big; i++) {
    const x = m.x + rnd(-r.width * .35, r.width * .35);
    add({
     x: x,
     y: r.top - rnd(40, 160),
     vy: 6,
     g: .9,
     life: 520,
     color: pick(c),
     size: pick([ 9, 12, 15 ]),
     delay: i * 45
    });
   }
   for (let i = 0; i < 40 * big; i++) add({
    x: m.x + rnd(-r.width * .4, r.width * .4),
    y: r.bottom - r.height * .2,
    vx: rnd(-4, 4),
    vy: rnd(-4, -1),
    g: .15,
    drag: .95,
    life: rnd(500, 900),
    color: pick(c),
    size: 3,
    delay: 260 + rnd(0, 120)
   });
  } else if (attr === "light") {
   let x = m.x + rnd(-30, 30), y = 0;
   const pts = [ [ x, y ] ];
   while (y < m.y) {
    y += rnd(30, 60);
    x += rnd(-40, 40);
    pts.push([ x, Math.min(y, m.y) ]);
   }
   pts.forEach((p, i) => {
    if (i) line(pts[i - 1][0], pts[i - 1][1], p[0], p[1], {
     speed: .4,
     p: () => ({
      life: 320,
      color: i % 2 ? c[0] : c[1],
      size: 6,
      glow: 14,
      hold: .5
     })
    });
   });
   for (let i = 0; i < 40 * big; i++) {
    const a = rnd(0, Math.PI * 2), v = rnd(2, 8);
    add({
     x: m.x,
     y: m.y,
     vx: Math.cos(a) * v,
     vy: Math.sin(a) * v,
     drag: .9,
     life: 500,
     color: pick(c),
     size: 3,
     glow: 6,
     delay: 120
    });
   }
  } else {
   for (let k = 0; k < 3; k++) {
    const sx = m.x - r.width * .3 + k * r.width * .2;
    const n = 18;
    for (let i = 0; i <= n; i++) {
     const t = i / n;
     add({
      x: sx + t * r.width * .25,
      y: m.y - r.height * .3 + t * r.height * .6 + Math.sin(t * Math.PI) * 10,
      life: 420,
      color: t < .5 ? c[0] : c[1],
      size: 6 * Math.sin(Math.PI * t) + 3,
      delay: k * 70 + i * 6,
      glow: 8,
      hold: .4
     });
    }
   }
   for (let i = 0; i < 40 * big; i++) add({
    x: m.x + rnd(-40, 40),
    y: m.y + rnd(-40, 40),
    vx: rnd(-1, 1),
    vy: rnd(-2, -.4),
    life: rnd(600, 1e3),
    color: pick([ c[2], "#1a0a2a", c[1] ]),
    size: pick([ 6, 9 ]),
    grow: 6,
    delay: rnd(100, 300)
   });
  }
 }
 function streak(from, to, attr) {
  const c = COL[attr] || COL.light, a = center(from), b = center(to);
  line(a.x, a.y, b.x, b.y, {
   speed: .6,
   p: t => ({
    life: 260,
    color: t > .7 ? c[0] : c[1],
    size: 6,
    glow: 10,
    hold: .3
   })
  });
 }
 function claws(r, color) {
  const m = center(r);
  for (let k = 0; k < 3; k++) {
   const off = (k - 1) * 18;
   line(m.x - 50 + off, m.y - 40, m.x + 30 + off, m.y + 40, {
    speed: 1.5,
    p: t => ({
     life: 360,
     color: t < .3 ? "#ffffff" : color || "#ff5a78",
     size: 6 * Math.sin(Math.PI * t) + 3,
     glow: 8,
     hold: .5,
     delay: k * 50
    })
   });
  }
 }
 function shock(y, color) {
  const w = innerWidth;
  for (let x = 0; x < w; x += GRID * 2) {
   const d = Math.abs(x - w / 2);
   add({
    x: x,
    y: y + rnd(-4, 4),
    vy: rnd(-1.5, 1.5),
    life: 420,
    color: d % 18 < 9 ? "#ffffff" : color || "#ff8a6a",
    size: 6,
    delay: d * .6,
    glow: 6,
    hold: .3
   });
  }
 }
 function circle(r, attr) {
  const c = COL[attr] || COL.light, m = center(r);
  const rx = r.width * .62, ry = r.width * .22, cy = r.bottom - 6;
  for (let i = 0; i < 40; i++) {
   const a = i / 40 * Math.PI * 2;
   add({
    x: m.x + Math.cos(a) * rx,
    y: cy + Math.sin(a) * ry,
    life: 700,
    color: i % 4 ? c[1] : c[0],
    size: 3,
    delay: i * 8,
    glow: 6,
    hold: .6
   });
   if (i % 5 === 0) add({
    x: m.x + Math.cos(a) * rx * .6,
    y: cy + Math.sin(a) * ry * .6,
    life: 700,
    color: c[0],
    size: 3,
    delay: 200 + i * 6,
    glow: 6,
    hold: .6
   });
  }
  for (let i = 0; i < 40; i++) add({
   x: m.x + rnd(-r.width * .3, r.width * .3),
   y: cy,
   vy: rnd(-9, -4),
   life: rnd(400, 700),
   color: pick(c),
   size: pick([ 3, 6 ]),
   glow: 8,
   delay: 250 + rnd(0, 200)
  });
 }
 function flames(r) {
  const c = COL.fire;
  for (let i = 0; i < 40; i++) add({
   x: r.left + rnd(.2, .8) * r.width,
   y: r.top + rnd(.3, .9) * r.height,
   vx: rnd(-.4, .4),
   vy: rnd(-4, -1.5),
   drag: .97,
   life: rnd(400, 700),
   color: pick(c),
   size: pick([ 3, 6 ]),
   glow: 6,
   delay: rnd(0, 200)
  });
 }
 function shine(r, color) {
  for (let y = r.top; y < r.bottom; y += GRID) {
   add({
    x: r.left - 10,
    y: y,
    vx: 14,
    life: Math.max(120, r.width / 14 * 16),
    color: color || "#bfe4ff",
    size: 3,
    glow: 6,
    delay: (y - r.top) * .8
   });
  }
 }
 function coins(from, to, n) {
  const a = center(from), b = center(to);
  for (let i = 0; i < (n || 14); i++) {
   const ang = rnd(-Math.PI, 0), v = rnd(4, 9);
   const p = {
    x: a.x,
    y: a.y,
    vx: Math.cos(ang) * v,
    vy: Math.sin(ang) * v,
    g: .3,
    drag: .96,
    life: 1100,
    color: pick([ "#ffe08a", "#e8b030", "#fff6c0" ]),
    size: 6,
    glow: 6
   };
   add(p);
   setTimeout(() => {
    p.g = 0;
    p.vx = (b.x - p.x) / 22;
    p.vy = (b.y - p.y) / 22;
    p.drag = 1;
   }, 450 + i * 25);
  }
 }
 return {
  cast: cast,
  streak: streak,
  claws: claws,
  shock: shock,
  circle: circle,
  flames: flames,
  shine: shine,
  coins: coins,
  COL: COL
 };
})();