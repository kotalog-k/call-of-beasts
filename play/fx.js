const FX = (() => {
 const wait = ms => new Promise(r => setTimeout(r, ms));
 const rnd = (a, b) => a + Math.random() * (b - a);
 const TONE = {
  fire: {
   c1: "#fff2a0",
   c2: "#ff8a1e",
   c3: "#d8200a",
   word: "炎"
  },
  water: {
   c1: "#e8fbff",
   c2: "#5fd0ff",
   c3: "#1a5ad0",
   word: "水"
  },
  wind: {
   c1: "#f4ffd0",
   c2: "#8fe05a",
   c3: "#1f8a3a",
   word: "風"
  },
  earth: {
   c1: "#fff0c0",
   c2: "#e0a040",
   c3: "#7a4a10",
   word: "地"
  },
  light: {
   c1: "#ffffff",
   c2: "#ffe25a",
   c3: "#c89000",
   word: "光"
  },
  dark: {
   c1: "#f0e0ff",
   c2: "#b07aff",
   c3: "#4a1a9a",
   word: "闇"
  }
 };
 function layer(host) {
  let l = host.querySelector(":scope > .fx-layer");
  if (!l) {
   l = document.createElement("div");
   l.className = "fx-layer";
   host.appendChild(l);
  }
  return l;
 }
 function spawn(parent, cls, style, life) {
  const el = document.createElement("div");
  el.className = cls;
  for (const [k, v] of Object.entries(style || {})) {
   if (k.startsWith("--")) el.style.setProperty(k, v); else el.style[k] = v;
  }
  parent.appendChild(el);
  if (life) setTimeout(() => el.remove(), life);
  return el;
 }
 function centerIn(host, el) {
  const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  return {
   x: r.left - h.left + r.width / 2,
   y: r.top - h.top + r.height / 2,
   w: r.width,
   h: r.height
  };
 }
 function restart(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
 }
 function embers(host, color, n) {
  const l = layer(host);
  l.querySelectorAll(".ember").forEach(e => e.remove());
  for (let i = 0; i < (n || 26); i++) {
   spawn(l, "ember", {
    left: rnd(0, 100) + "%",
    bottom: rnd(-10, 30) + "%",
    width: rnd(2, 6) + "px",
    background: color || "#ffcf5a",
    animationDuration: rnd(4, 9) + "s",
    animationDelay: -rnd(0, 9) + "s",
    "--dx": rnd(-60, 60) + "px"
   });
  }
 }
 function sparkles(card, n) {
  for (let i = 0; i < (n || 5); i++) {
   spawn(card, "glint", {
    left: rnd(4, 96) + "%",
    top: rnd(4, 96) + "%",
    animationDelay: rnd(0, 3) + "s",
    animationDuration: rnd(1.8, 3.2) + "s",
    "--s": rnd(.6, 1.3)
   });
  }
 }
 async function summon(host, mon, attr) {
  const t = TONE[attr] || TONE.light, c = centerIn(host, mon), l = layer(host);
  mon.classList.remove("down");
  mon.style.opacity = "0";
  spawn(l, "pillar", {
   left: c.x + "px",
   "--c1": t.c1,
   "--c2": t.c2
  }, 1100);
  burst(host, c.x, c.y + c.h * .35, attr, 18, .7);
  await wait(380);
  mon.style.opacity = "";
  restart(mon, "appear");
  spawn(l, "ring", {
   left: c.x + "px",
   top: c.y + c.h * .38 + "px",
   "--c": t.c2
  }, 800);
  await wait(700);
 }
 async function attack(host, mon, target, attr) {
  const t = TONE[attr] || TONE.light;
  restart(mon, "attack");
  await wait(180);
  const c = target ? centerIn(host, target) : centerIn(host, mon);
  const l = layer(host);
  spawn(l, "slash", {
   left: c.x + "px",
   top: c.y + "px",
   "--c": t.c2
  }, 500);
  spawn(l, "slash two", {
   left: c.x + "px",
   top: c.y + "px",
   "--c": t.c1
  }, 500);
  burst(host, c.x, c.y, attr, 12, .6);
  await wait(420);
 }
 async function hit(host, mon, amount, kind) {
  restart(mon, "hit");
  const c = centerIn(host, mon);
  burst(host, c.x, c.y, "light", 10, .5);
  if (amount != null) number(host, c.x, c.y - c.h * .1, amount, kind || "dmg");
  await wait(420);
 }
 function number(host, x, y, text, kind) {
  spawn(layer(host), "num " + kind, {
   left: x + rnd(-30, 30) + "px",
   top: y + "px"
  }, 1e3).textContent = text;
 }
 function burst(host, x, y, attr, n, scale) {
  const t = TONE[attr] || TONE.light, l = layer(host);
  for (let i = 0; i < n; i++) {
   const a = rnd(0, Math.PI * 2), d = rnd(60, 180) * (scale || 1);
   spawn(l, "spark", {
    left: x + "px",
    top: y + "px",
    background: [ t.c1, t.c2, t.c3 ][i % 3],
    "--tx": Math.cos(a) * d + "px",
    "--ty": Math.sin(a) * d + "px",
    width: rnd(5, 12) + "px"
   }, 800);
  }
 }
 async function special(host, mon, attr, name, target) {
  const t = TONE[attr] || TONE.fire, l = layer(host);
  const cut = spawn(l, "cutin", {
   "--c1": t.c1,
   "--c2": t.c2,
   "--c3": t.c3
  }, 1900);
  cut.innerHTML = '<div class="cutin-band"><span class="cutin-ex">EX</span><b>' + (name || "必殺技") + "</b></div>";
  restart(mon, "charge");
  await wait(1e3);
  const c = target ? centerIn(host, target) : centerIn(host, mon);
  if (attr === "fire") {
   for (let i = 0; i < 7; i++) {
    spawn(l, "flame", {
     left: c.x + rnd(-c.w * .4, c.w * .4) + "px",
     top: c.y + c.h * .3 + "px",
     animationDelay: i * 60 + "ms",
     "--c1": t.c1,
     "--c2": t.c2,
     "--c3": t.c3,
     "--s": rnd(.8, 1.4)
    }, 1300);
   }
  }
  spawn(l, "blast", {
   left: c.x + "px",
   top: c.y + "px",
   "--c1": t.c1,
   "--c2": t.c2
  }, 900);
  burst(host, c.x, c.y, attr, 30, 1.4);
  restart(host, "quake");
  await wait(900);
 }
 async function down(host, mon, attr) {
  const c = centerIn(host, mon);
  restart(mon, "hit");
  await wait(250);
  burst(host, c.x, c.y, attr, 24, 1.1);
  burst(host, c.x, c.y, "light", 14, .8);
  mon.classList.add("down");
  await wait(900);
 }
 const raf = f => {
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
 };
 async function shatter(host, mon, attr, opts) {
  opts = opts || {};
  const img = mon.querySelector("img");
  const t = TONE[attr] || TONE.light;
  if (!img || !img.naturalWidth) return down(host, mon, attr);
  const hr = host.getBoundingClientRect(), r = mon.getBoundingClientRect(), ir = img.getBoundingClientRect();
  const W = 144, H = 192, B = opts.boss ? 2 : 3;
  const src = document.createElement("canvas");
  src.width = W;
  src.height = H;
  const sx = src.getContext("2d", {
   willReadFrequently: true
  });
  sx.imageSmoothingEnabled = false;
  sx.drawImage(img, 0, 0, W, H);
  const data = sx.getImageData(0, 0, W, H).data;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cv = document.createElement("canvas");
  cv.className = "shatter-canvas";
  cv.width = hr.width * dpr;
  cv.height = hr.height * dpr;
  host.appendChild(cv);
  const g = cv.getContext("2d");
  g.scale(dpr, dpr);
  g.imageSmoothingEnabled = false;
  const ox = ir.left - hr.left, oy = ir.top - hr.top, px = ir.width / W;
  restart(mon, "hit");
  mon.classList.add("freeze");
  await wait(opts.boss ? 420 : 220);
  mon.style.visibility = "hidden";
  const cx = W * (.4 + Math.random() * .2), cy = H * (.42 + Math.random() * .12);
  const cracks = [];
  for (let i = 0; i < (opts.boss ? 11 : 8); i++) {
   const a = i / (opts.boss ? 11 : 8) * Math.PI * 2 + Math.random() * .5;
   let x = cx, y = cy, pts = [ [ x, y ] ];
   for (let k = 0; k < 7; k++) {
    const aa = a + (Math.random() - .5) * .9, d = 6 + Math.random() * 12;
    x += Math.cos(aa) * d;
    y += Math.sin(aa) * d;
    pts.push([ x, y ]);
   }
   cracks.push(pts);
  }
  const crackMs = opts.boss ? 520 : 300, t0 = performance.now();
  await new Promise(res => {
   (function frame(now) {
    const k = Math.min(1, (now - t0) / crackMs);
    g.clearRect(0, 0, hr.width, hr.height);
    g.save();
    g.beginPath();
    g.ellipse(ox + ir.width / 2, oy + ir.height * .48, ir.width * .62, ir.height * .66, 0, 0, Math.PI * 2);
    g.clip();
    g.drawImage(src, ox, oy, ir.width, ir.height);
    g.fillStyle = "rgba(255,255,255," + .35 * (1 - k) + ")";
    g.fillRect(ox, oy, ir.width, ir.height);
    g.restore();
    g.strokeStyle = "#fff";
    g.lineWidth = Math.max(2, px * 1.2);
    g.shadowColor = t.c1;
    g.shadowBlur = 12;
    for (const pts of cracks) {
     const n = Math.max(1, Math.floor(k * (pts.length - 1)) + 1);
     g.beginPath();
     g.moveTo(ox + pts[0][0] * px, oy + pts[0][1] * px);
     for (let i = 1; i < n; i++) g.lineTo(ox + pts[i][0] * px, oy + pts[i][1] * px);
     g.stroke();
    }
    g.shadowBlur = 0;
    if (k < 1) raf(frame); else res();
   })(t0);
  });
  restart(host, "quake");
  const flash = spawn(layer(host), "kill-flash", {
   "--c1": t.c1
  }, 700);
  const parts = [];
  for (let y = 0; y < H; y += B) for (let x = 0; x < W; x += B) {
   const i = ((y + (B >> 1)) * W + x + (B >> 1)) * 4;
   if (data[i + 3] < 10) continue;
   const ex = (x - W / 2) / (W * .62), ey = (y - H * .48) / (H * .66);
   if (ex * ex + ey * ey > 1 || ex * ex + ey * ey > .5 && Math.random() < .5) continue;
   const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) + 4;
   const sp = (opts.boss ? 9 : 6) * (.4 + Math.random()) * (60 / (d + 30));
   parts.push({
    x: ox + x * px,
    y: oy + y * px,
    vx: dx / d * sp * px * 1.3 + (Math.random() - .5) * 1.5,
    vy: dy / d * sp * px * 1.1 - Math.random() * 4 - 1.5,
    c: "rgb(" + data[i] + "," + data[i + 1] + "," + data[i + 2] + ")",
    s: B * px,
    delay: d * .9,
    life: 0,
    spin: Math.random() < .25
   });
  }
  for (let k = 0; k < (opts.boss ? 90 : 50); k++) {
   const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 10;
   parts.push({
    x: ox + cx * px,
    y: oy + cy * px,
    vx: Math.cos(a) * v,
    vy: Math.sin(a) * v - 3,
    c: Math.random() < .5 ? t.c1 : "#fff",
    s: px * (1 + Math.random() * 2),
    delay: 0,
    life: 0,
    glow: true
   });
  }
  const dur = opts.boss ? 1700 : 1150, t1 = performance.now();
  const label = spawn(layer(host), "kill-label" + (opts.boss ? " boss" : ""), {
   left: r.left - hr.left + r.width / 2 + "px",
   top: r.top - hr.top + r.height * .45 + "px",
   "--c1": t.c1,
   "--c2": t.c2
  }, dur + 600);
  label.innerHTML = "<b>" + (opts.boss ? "討伐" : "撃破") + "</b>";
  spawn(layer(host), "ring", {
   left: ox + cx * px + "px",
   top: oy + cy * px + "px",
   "--c": t.c1
  }, 900);
  await new Promise(res => {
   (function frame(now) {
    const el = now - t1, k = el / dur;
    g.clearRect(0, 0, hr.width, hr.height);
    for (const p of parts) {
     if (el < p.delay) {
      g.fillStyle = p.c;
      g.fillRect(p.x, p.y, p.s, p.s);
      continue;
     }
     p.vy += .42;
     p.vx *= .97;
     p.x += p.vx;
     p.y += p.vy;
     const a = Math.max(0, 1 - k * (p.glow ? 1.6 : 1.1));
     if (a <= 0) continue;
     g.globalAlpha = a;
     if (p.glow) {
      g.shadowColor = p.c;
      g.shadowBlur = 10;
     }
     g.fillStyle = p.c;
     const s = p.spin ? p.s * (.6 + .4 * Math.abs(Math.sin(el / 60))) : p.s;
     g.fillRect(p.x, p.y, s, s);
     g.shadowBlur = 0;
    }
    g.globalAlpha = 1;
    if (k < 1) raf(frame); else res();
   })(t1);
  });
  cv.remove();
  flash.remove();
  mon.classList.remove("freeze");
  mon.classList.add("gone");
  mon.style.visibility = "";
 }
 return {
  embers: embers,
  sparkles: sparkles,
  summon: summon,
  attack: attack,
  hit: hit,
  special: special,
  down: down,
  shatter: shatter,
  number: number,
  burst: burst,
  TONE: TONE
 };
})();