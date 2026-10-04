(() => {
 const KINDS = {
  "#ad": {
   dir: "art/ad/orbit/",
   data: () => typeof AD_ORBIT !== "undefined" && AD_ORBIT
  },
  "#ad2": {
   dir: "art/ad/class/",
   data: () => typeof AD_CLASS !== "undefined" && AD_CLASS,
   amb: classroomSound,
   boss: 12
  }
 };
 let FPS = 12, DIR = "", DATA = null, KIND = null;
 const AD_VER = 2;
 const EMBED = /[?&]embed=1/.test(location.search) && window.parent !== window;
 let el = null, raf = 0, timers = [], amb = null;
 function classroomSound() {
  let ac;
  try {
   ac = new (window.AudioContext || window.webkitAudioContext);
  } catch (e) {
   return null;
  }
  const out = ac.createGain();
  out.gain.value = 0;
  out.connect(ac.destination);
  out.gain.linearRampToValueAtTime(.9, ac.currentTime + .6);
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const ch = noise.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  const src = () => {
   const s = ac.createBufferSource();
   s.buffer = noise;
   s.loop = true;
   s.start();
   return s;
  };
  [ [ 4300, 6.2, .06 ], [ 3700, 4.1, .04 ] ].forEach(([f, rate, vol]) => {
   const bp = ac.createBiquadFilter();
   bp.type = "bandpass";
   bp.frequency.value = f;
   bp.Q.value = 9;
   const g = ac.createGain();
   g.gain.value = vol;
   const lfo = ac.createOscillator();
   lfo.frequency.value = rate;
   const lg = ac.createGain();
   lg.gain.value = vol * .9;
   lfo.connect(lg).connect(g.gain);
   lfo.start();
   src().connect(bp).connect(g).connect(out);
  });
  {
   const bp = ac.createBiquadFilter();
   bp.type = "bandpass";
   bp.frequency.value = 5200;
   bp.Q.value = 2;
   const g = ac.createGain();
   g.gain.value = .018;
   src().connect(bp).connect(g).connect(out);
  }
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  const wg = ac.createGain();
  wg.gain.value = 0;
  src().connect(lp).connect(wg).connect(out);
  const t0 = ac.currentTime;
  for (let t = 0; t < 12; t += .1) wg.gain.setValueAtTime(.05 + .045 * Math.sin(t * 1.25) + .02 * Math.sin(t * 3.1 + 1), t0 + t);
  const tick = ac.createBiquadFilter();
  tick.type = "highpass";
  tick.frequency.value = 2400;
  tick.connect(out);
  for (let t = .4; t < 9; t += .22 + Math.random() * .3) {
   const s = ac.createBufferSource();
   s.buffer = noise;
   const g = ac.createGain();
   g.gain.setValueAtTime(0, t0 + t);
   g.gain.linearRampToValueAtTime(.05, t0 + t + .004);
   g.gain.exponentialRampToValueAtTime(.001, t0 + t + .05);
   s.connect(g).connect(tick);
   s.start(t0 + t, Math.random(), .06);
  }
  return {
   stop(sec) {
    const n = ac.currentTime;
    out.gain.cancelScheduledValues(n);
    out.gain.setValueAtTime(out.gain.value, n);
    out.gain.linearRampToValueAtTime(0, n + (sec || .1));
    setTimeout(() => ac.close(), (sec || .1) * 1e3 + 200);
   }
  };
 }
 const css = (node, o) => Object.assign(node.style, o);
 const div = (cls, html) => {
  const d = document.createElement("div");
  d.className = cls;
  if (html) d.innerHTML = html;
  return d;
 };
 function quadMatrix(w, h, q) {
  const src = [ [ 0, 0 ], [ w, 0 ], [ w, h ], [ 0, h ] ];
  const A = [], B = [];
  for (let i = 0; i < 4; i++) {
   const [x, y] = src[i], [u, v] = q[i];
   A.push([ x, y, 1, 0, 0, 0, -u * x, -u * y ]);
   B.push(u);
   A.push([ 0, 0, 0, x, y, 1, -v * x, -v * y ]);
   B.push(v);
  }
  for (let c = 0; c < 8; c++) {
   let p = c;
   for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
   [A[c], A[p]] = [ A[p], A[c] ];
   [B[c], B[p]] = [ B[p], B[c] ];
   for (let r = 0; r < 8; r++) {
    if (r === c) continue;
    const f = A[r][c] / A[c][c];
    for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
    B[r] -= f * B[c];
   }
  }
  const [a, b, c, d, e, f, g, hh] = B.map((v, i) => v / A[i][i]);
  return "matrix3d(" + [ a, d, 0, g, b, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1 ].join(",") + ")";
 }
 function stop() {
  cancelAnimationFrame(raf);
  timers.forEach(clearTimeout);
  timers = [];
  if (amb) {
   amb.stop(.1);
   amb = null;
  }
  if (el) el.remove();
  el = null;
 }
 function play() {
  stop();
  if (!DATA) return;
  el = div("ad");
  document.body.appendChild(el);
  const game = document.createElement("iframe");
  game.className = "ad-game";
  game.src = "index.html?demo=" + Date.now() + "#demo";
  game.setAttribute("tabindex", "-1");
  css(game, {
   width: "1280px",
   height: "720px"
  });
  const ready = new Promise(r => {
   const t0 = Date.now();
   const poll = () => {
    let ok = false;
    try {
     ok = !!game.contentDocument.querySelector("#hand .card");
    } catch (e) {}
    if (ok || Date.now() - t0 > 8e3) r(); else setTimeout(poll, 150);
   };
   game.onload = poll;
  });
  const frames = Array.from({
   length: DATA.n
  }, (_, i) => DIR + "f" + String(i).padStart(3, "0") + ".webp?v=" + AD_VER);
  const bar = div("ad-load", "<i></i>");
  el.appendChild(bar);
  let got = 0;
  const keep = [];
  const pre = Promise.all(frames.map(src => new Promise(r => {
   const i = new Image;
   keep.push(i);
   i.onload = i.onerror = () => {
    got++;
    bar.firstChild.style.width = got / frames.length * 100 + "%";
    r();
   };
   i.src = src;
  })));
  const box = div("ad-orbit");
  el.appendChild(box);
  box.appendChild(game);
  const pic = document.createElement("img");
  pic.className = "ad-frame";
  pic.alt = "";
  box.appendChild(pic);
  Promise.all([ pre, ready ]).then(() => {
   bar.remove();
   start(game, box, pic, frames);
  });
 }
 function start(game, box, pic, frames) {
  if (KIND.amb) amb = KIND.amb();
  const at = (s, fn) => timers.push(setTimeout(fn, s * 1e3));
  const send = c => {
   try {
    game.contentWindow.postMessage(c, "*");
   } catch (e) {}
  };
  const fit = () => {
   const w = Math.min(innerWidth, innerHeight * 16 / 9), h = w * 9 / 16;
   css(box, {
    width: w + "px",
    height: h + "px",
    left: (innerWidth - w) / 2 + "px",
    top: (innerHeight - h) / 2 + "px"
   });
   return w / 320;
  };
  const N = DATA.n, t0 = performance.now();
  let last = -1, full = false;
  const frame = now => {
   const t = (now - t0) / 1e3, k = fit();
   if (!full) {
    const i = Math.max(0, Math.min(N - 1, Math.floor(t * FPS)));
    if (i !== last) {
     last = i;
     pic.src = frames[i];
     game.style.transform = quadMatrix(1280, 720, DATA.quads[i].map(([x, y]) => [ x * k, y * k ]));
    }
   } else game.style.transform = "scale(" + box.clientWidth / 1280 + ")";
   raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const tEnd = N / FPS;
  const BOSS_END = 9.3 + (KIND.boss || 3.5);
  at(tEnd, () => {
   full = true;
   box.classList.add("full");
   if (amb) {
    amb.stop(1.2);
    amb = null;
   }
   try {
    Sound.bgm("battle");
   } catch (e) {}
  });
  at(tEnd + 2.7, () => send("map"));
  at(tEnd + 4.1, () => {
   send("pack");
   try {
    Sound.bgm(null);
   } catch (e) {}
  });
  at(tEnd + 9.3, () => {
   send("boss");
   try {
    Sound.bgm("boss");
   } catch (e) {}
  });
  if (EMBED) {
   at(tEnd + BOSS_END, () => {
    try {
     Sound.bgm(null);
    } catch (e) {}
    el && el.classList.add("out");
   });
   at(tEnd + BOSS_END + .7, () => {
    try {
     parent.postMessage("cob-ad-done", location.origin);
    } catch (e) {}
   });
   return;
  }
  at(tEnd + BOSS_END, () => {
   send("title");
   try {
    Sound.bgm(null);
   } catch (e) {}
  });
  at(tEnd + BOSS_END + .9, () => el && el.classList.add("out"));
  at(tEnd + BOSS_END + 1.6, () => {
   cancelAnimationFrame(raf);
   if (el) el.remove();
   el = null;
  });
 }
 function ready() {
  stop();
  KIND = KINDS[location.hash] || KINDS["#ad"];
  DIR = KIND.dir;
  DATA = KIND.data();
  FPS = DATA && DATA.fps || 12;
  el = div("ad ad-ready", '<i class="ad-play"></i>');
  document.body.appendChild(el);
  el.addEventListener("pointerdown", () => {
   try {
    Sound.unlock();
   } catch (e) {}
   play();
  }, {
   once: true
  });
 }
 if (EMBED && KINDS[location.hash]) {
  KIND = KINDS[location.hash];
  DIR = KIND.dir;
  DATA = KIND.data();
  FPS = DATA && DATA.fps || 12;
  try {
   Sound.unlock();
  } catch (e) {}
  play();
 } else if (KINDS[location.hash]) window.addEventListener("load", () => setTimeout(ready, 300));
 window.addEventListener("hashchange", () => {
  if (KINDS[location.hash]) ready();
 });
 document.addEventListener("keydown", e => {
  if (e.key === "r" && el) ready();
 });
 window.addEventListener("message", e => {
  if (el && e.data && e.data.sfx) try {
   Sound.sfx(e.data.sfx);
  } catch (er) {}
 });
 window._adPlay = () => {
  KIND = KINDS[location.hash] || KINDS["#ad"];
  DIR = KIND.dir;
  DATA = KIND.data();
  FPS = DATA && DATA.fps || 12;
  play();
 };
})();