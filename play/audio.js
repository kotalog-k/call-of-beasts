const Sound = (() => {
 let ctx = null, master = null, bgmGain = null, sfxGain = null, noiseBuf = null;
 const waves = {};
 let mute = {
  bgm: false,
  sfx: false
 };
 function unlock() {
  if (ctx) {
   if (ctx.state === "suspended") ctx.resume();
   return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC;
  master = ctx.createGain();
  master.gain.value = .55;
  master.connect(ctx.destination);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 9e3;
  lp.connect(master);
  bgmGain = ctx.createGain();
  bgmGain.gain.value = mute.bgm ? 0 : .5;
  bgmGain.connect(lp);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = mute.sfx ? 0 : .8;
  sfxGain.connect(lp);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  for (const duty of [ .125, .25, .5 ]) {
   const n = 48, re = new Float32Array(n), im = new Float32Array(n);
   for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(Math.PI * k * duty);
   waves[duty] = ctx.createPeriodicWave(re, im);
  }
  if (pending) {
   const p = pending;
   pending = null;
   bgm(p);
  }
 }
 const freq = m => 440 * Math.pow(2, (m - 69) / 12);
 const NOTE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11
 };
 function midi(s) {
  const m = s.match(/^([A-G]#?)(-?\d)$/);
  return NOTE[m[1]] + (+m[2] + 1) * 12;
 }
 function tone(out, t, f, dur, o) {
  o = o || {};
  const osc = ctx.createOscillator(), g = ctx.createGain();
  if (o.duty) osc.setPeriodicWave(waves[o.duty]); else osc.type = o.type || "square";
  osc.frequency.setValueAtTime(f, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
  if (o.vib) {
   const l = ctx.createOscillator(), lg = ctx.createGain();
   l.frequency.value = 5.5;
   lg.gain.value = f * .012;
   l.connect(lg).connect(osc.frequency);
   l.start(t + .08);
   l.stop(t + dur + .05);
  }
  const v = o.vol ?? .2, a = o.attack ?? .004, rel = o.release ?? .03;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + a);
  if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(1e-4, v * o.decay), t + dur); else g.gain.setValueAtTime(v, t + Math.max(a, dur - rel));
  g.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + .02);
 }
 function noise(out, t, dur, o) {
  o = o || {};
  const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  src.buffer = noiseBuf;
  src.loop = true;
  f.type = o.filter || "highpass";
  f.frequency.setValueAtTime(o.freq || 1e3, t);
  if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
  const v = o.vol ?? .2;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(1e-4, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * .5);
  src.stop(t + dur + .02);
 }
 const SFX = {
  card(t, o) {
   tone(o, t, 900, .07, {
    duty: .25,
    slide: 1500,
    vol: .12
   });
   noise(o, t, .08, {
    freq: 3e3,
    vol: .06
   });
  },
  hit(t, o) {
   noise(o, t, .12, {
    filter: "bandpass",
    freq: 1800,
    sweep: 400,
    vol: .35
   });
   tone(o, t, 300, .1, {
    duty: .5,
    slide: 80,
    vol: .18
   });
  },
  bigHit(t, o) {
   noise(o, t, .3, {
    filter: "lowpass",
    freq: 3e3,
    sweep: 200,
    vol: .45
   });
   tone(o, t, 180, .25, {
    duty: .5,
    slide: 40,
    vol: .25
   });
   tone(o, t + .02, 90, .3, {
    type: "triangle",
    slide: 30,
    vol: .35
   });
  },
  blocked(t, o) {
   tone(o, t, 1400, .06, {
    duty: .125,
    vol: .1
   });
   tone(o, t + .04, 1900, .12, {
    duty: .125,
    vol: .08,
    decay: .1
   });
  },
  hurt(t, o) {
   noise(o, t, .22, {
    filter: "lowpass",
    freq: 1500,
    sweep: 150,
    vol: .4
   });
   tone(o, t, 220, .2, {
    duty: .5,
    slide: 55,
    vol: .22
   });
  },
  enemyAtk(t, o) {
   tone(o, t, 120, .12, {
    type: "triangle",
    slide: 60,
    vol: .3
   });
   noise(o, t, .1, {
    freq: 600,
    vol: .1
   });
  },
  slash(t, o) {
   noise(o, t, .1, {
    filter: "bandpass",
    freq: 5e3,
    sweep: 1200,
    vol: .25
   });
  },
  summon(t, o) {
   [ 0, 4, 7, 12 ].forEach((s, i) => tone(o, t + i * .05, freq(64 + s), .1, {
    duty: .25,
    vol: .12
   }));
   noise(o, t, .3, {
    freq: 6e3,
    vol: .05
   });
  },
  unitDown(t, o) {
   tone(o, t, 500, .25, {
    duty: .5,
    slide: 90,
    vol: .15
   });
  },
  block(t, o) {
   tone(o, t, 660, .05, {
    duty: .5,
    vol: .1
   });
   tone(o, t + .05, 990, .14, {
    duty: .125,
    vol: .1,
    decay: .1
   });
  },
  heal(t, o) {
   [ 0, 4, 7, 11, 12 ].forEach((s, i) => tone(o, t + i * .045, freq(72 + s), .1, {
    type: "triangle",
    vol: .2
   }));
  },
  burn(t, o) {
   noise(o, t, .25, {
    filter: "bandpass",
    freq: 900,
    sweep: 2500,
    vol: .22
   });
   noise(o, t + .08, .15, {
    freq: 4e3,
    vol: .08
   });
  },
  debuff(t, o) {
   tone(o, t, 700, .18, {
    duty: .25,
    slide: 250,
    vol: .12
   });
  },
  buff(t, o) {
   tone(o, t, 300, .16, {
    duty: .25,
    slide: 900,
    vol: .12
   });
  },
  mana(t, o) {
   [ 0, 7, 12 ].forEach((s, i) => tone(o, t + i * .04, freq(79 + s), .08, {
    duty: .125,
    vol: .1
   }));
  },
  combo(t, o) {
   tone(o, t, freq(84), .06, {
    duty: .25,
    vol: .12
   });
   tone(o, t + .06, freq(91), .12, {
    duty: .25,
    vol: .12
   });
  },
  roar(t, o) {
   tone(o, t, 90, .7, {
    duty: .5,
    slide: 50,
    vol: .3,
    vib: true
   });
   noise(o, t, .7, {
    filter: "lowpass",
    freq: 800,
    sweep: 120,
    vol: .3
   });
  },
  curse(t, o) {
   [ 0, -1, -6 ].forEach((s, i) => tone(o, t + i * .09, freq(60 + s), .14, {
    duty: .5,
    vol: .1
   }));
  },
  turn(t, o) {
   tone(o, t, freq(81), .05, {
    duty: .125,
    vol: .07
   });
  },
  freeze(t, o) {
   tone(o, t, 2e3, .2, {
    duty: .125,
    vol: .1,
    decay: .05
   });
  },
  crack(t, o) {
   for (let i = 0; i < 5; i++) noise(o, t + i * .05, .04, {
    freq: 3e3 + i * 800,
    vol: .2
   });
  },
  shatter(t, o) {
   noise(o, t, .9, {
    filter: "lowpass",
    freq: 6e3,
    sweep: 100,
    vol: .5
   });
   tone(o, t, 140, .6, {
    type: "triangle",
    slide: 30,
    vol: .45
   });
   for (let i = 0; i < 8; i++) tone(o, t + .05 + i * .04, 1200 + Math.random() * 1500, .05, {
    duty: .125,
    vol: .05
   });
  },
  victory(t, o) {
   [ [ "C5", 0, .12 ], [ "E5", .12, .12 ], [ "G5", .24, .12 ], [ "C6", .36, .5 ] ].forEach(([n, s, d]) => tone(o, t + s, freq(midi(n)), d, {
    duty: .25,
    vol: .14,
    vib: d > .3
   }));
   [ [ "C3", 0, .36 ], [ "G3", .36, .5 ] ].forEach(([n, s, d]) => tone(o, t + s, freq(midi(n)), d, {
    type: "triangle",
    vol: .3
   }));
  },
  lose(t, o) {
   [ [ "E4", 0 ], [ "D#4", .25 ], [ "D4", .5 ], [ "C#4", .75 ] ].forEach(([n, s]) => tone(o, t + s, freq(midi(n)), .3, {
    duty: .5,
    vol: .12,
    vib: true
   }));
  },
  levelup(t, o) {
   [ "C5", "G5", "C6", "E6", "G6" ].forEach((n, i) => tone(o, t + i * .06, freq(midi(n)), i === 4 ? .3 : .07, {
    duty: .125,
    vol: .12
   }));
  },
  coin(t, o) {
   tone(o, t, freq(83), .06, {
    duty: .5,
    vol: .1
   });
   tone(o, t + .06, freq(88), .18, {
    duty: .5,
    vol: .1,
    decay: .2
   });
  },
  select(t, o) {
   tone(o, t, freq(76), .04, {
    duty: .25,
    vol: .08
   });
  },
  step(t, o) {
   tone(o, t, freq(69), .05, {
    duty: .25,
    vol: .08
   });
   tone(o, t + .06, freq(74), .07, {
    duty: .25,
    vol: .08
   });
  },
  deny(t, o) {
   tone(o, t, 160, .12, {
    duty: .5,
    vol: .1
   });
  }
 };
 function sfx(name) {
  if (location.hash === "#demo" && window.parent !== window) {
   try {
    window.parent.postMessage({
     sfx: name
    }, "*");
   } catch (e) {}
   return;
  }
  if (!ctx || mute.sfx || !SFX[name]) return;
  SFX[name](ctx.currentTime + .005, sfxGain);
 }
 const SONGS = {
  battle: {
   bpm: 138,
   chords: [ [ "A2", [ 57, 60, 64 ] ], [ "F2", [ 53, 57, 60 ] ], [ "G2", [ 55, 59, 62 ] ], [ "E2", [ 52, 55, 59 ] ], [ "A2", [ 57, 60, 64 ] ], [ "F2", [ 53, 57, 60 ] ], [ "D2", [ 50, 53, 57 ] ], [ "E2", [ 52, 56, 59 ] ] ],
   lead: [ "A4 . C5 . E5 . A5 - G5 - E5 . D5 . C5 .", "F4 . A4 . C5 . F5 - E5 - C5 . A4 . C5 .", "G4 . B4 . D5 . G5 - F5 - D5 . B4 . D5 .", "E5 - - - D5 - C5 - B4 - - - G#4 - - -", "A5 - - G5 E5 - - C5 D5 - E5 - C5 - A4 -", "F5 - - E5 C5 - - A4 C5 - D5 - C5 - A4 -", "D5 - F5 - A5 - G5 F5 E5 - D5 - C5 - D5 -", "E5 - - - B4 - - - G#4 - B4 - E5 - - -" ],
   bass: "oct8",
   drums: "rock"
  },
  boss: {
   bpm: 156,
   chords: [ [ "D2", [ 62, 65, 69 ] ], [ "A#1", [ 58, 62, 65 ] ], [ "C2", [ 60, 64, 67 ] ], [ "A1", [ 57, 61, 64 ] ], [ "D2", [ 62, 65, 69 ] ], [ "A#1", [ 58, 62, 65 ] ], [ "G1", [ 55, 58, 62 ] ], [ "A1", [ 57, 61, 64 ] ] ],
   lead: [ "D5 - - - A4 - D5 - F5 - E5 - D5 - C#5 -", "D5 - - - A#4 - D5 - F5 - G5 - F5 - D5 -", "E5 - - - C5 - E5 - G5 - A5 - G5 - E5 -", "C#5 - - - E5 - - - A5 - - - G5 - E5 -", "D6 - C6 - A#5 - A5 - G5 - A5 - F5 - D5 -", "D6 - C6 - A#5 - A5 - G5 - F5 - G5 - A5 -", "A#5 - - - A5 - G5 - F5 - G5 - A5 - A#5 -", "A5 - - - - - - - C#5 - E5 - G5 - C#6 -" ],
   bass: "gallop",
   drums: "driving"
  }
 };
 function parseBar(s) {
  const out = [];
  s.trim().split(/\s+/).forEach((tok, i) => {
   if (tok === ".") return;
   if (tok === "-") {
    if (out.length) out[out.length - 1].len++;
    return;
   }
   out.push({
    step: i,
    m: midi(tok),
    len: 1
   });
  });
  return out;
 }
 let cur = null, timer = null, nextBar = 0, barIdx = 0, pending = null, songGain = null;
 function scheduleBar(song, t, bar) {
  const sp = 60 / song.bpm / 4;
  const [root, chord] = song.chords[bar];
  const r = midi(root);
  for (const n of parseBar(song.lead[bar])) {
   tone(songGain, t + n.step * sp, freq(n.m), n.len * sp * .95, {
    duty: .25,
    vol: .09,
    vib: n.len >= 4,
    release: .02
   });
   tone(songGain, t + n.step * sp + sp * 3, freq(n.m), n.len * sp * .8, {
    duty: .125,
    vol: .025
   });
  }
  for (let i = 0; i < 16; i++) tone(songGain, t + i * sp, freq(chord[i % 3] + 12), sp * .8, {
   duty: .125,
   vol: .03
  });
  for (let i = 0; i < 16; i++) {
   let m = null;
   if (song.bass === "oct8" && i % 2 === 0) m = r + (i % 4 === 2 ? 12 : 0);
   if (song.bass === "gallop" && i % 4 !== 1) m = r + (i % 8 === 6 ? 7 : 0);
   if (m != null) tone(songGain, t + i * sp, freq(m), sp * 1.6, {
    type: "triangle",
    vol: .26,
    release: .02
   });
  }
  for (let i = 0; i < 16; i++) {
   const tt = t + i * sp;
   const kick = song.drums === "rock" ? i === 0 || i === 8 || bar % 2 && i === 10 : i % 4 === 0 || i === 14;
   const snare = i === 4 || i === 12 || song.drums === "driving" && bar % 4 === 3 && i >= 13;
   if (kick) tone(songGain, tt, 150, .12, {
    type: "sine",
    slide: 45,
    vol: .5,
    decay: .01
   });
   if (snare) noise(songGain, tt, .14, {
    filter: "bandpass",
    freq: 1800,
    vol: .22
   });
   if (i % 2 === 0) noise(songGain, tt, .03, {
    freq: 8e3,
    vol: i % 4 === 2 ? .05 : .03
   });
  }
  return 16 * sp;
 }
 function tick() {
  const song = SONGS[cur];
  if (!song) return;
  const ahead = document.hidden ? 1.6 : .6;
  while (nextBar < ctx.currentTime + ahead) {
   nextBar += scheduleBar(song, nextBar, barIdx);
   barIdx = (barIdx + 1) % song.lead.length;
  }
 }
 function bgm(name) {
  if (!ctx) {
   pending = name;
   return;
  }
  if (name === cur) return;
  if (songGain) {
   const g = songGain;
   g.gain.setTargetAtTime(0, ctx.currentTime, .15);
   setTimeout(() => g.disconnect(), 1500);
   songGain = null;
  }
  clearInterval(timer);
  cur = name;
  if (!name) return;
  songGain = ctx.createGain();
  songGain.connect(bgmGain);
  songGain.gain.setValueAtTime(0, ctx.currentTime);
  songGain.gain.linearRampToValueAtTime(1, ctx.currentTime + .4);
  nextBar = ctx.currentTime + .1;
  barIdx = 0;
  tick();
  timer = setInterval(tick, 100);
 }
 function setMute(m) {
  mute = Object.assign(mute, m);
  if (!ctx) return;
  bgmGain.gain.setTargetAtTime(mute.bgm ? 0 : .5, ctx.currentTime, .05);
  sfxGain.gain.setTargetAtTime(mute.sfx ? 0 : .8, ctx.currentTime, .05);
 }
 function level() {
  if (!ctx) return -1;
  if (!level.an) {
   level.an = ctx.createAnalyser();
   master.connect(level.an);
  }
  const a = new Float32Array(level.an.fftSize);
  level.an.getFloatTimeDomainData(a);
  return Math.max(...a.map(Math.abs));
 }
 return {
  unlock: unlock,
  bgm: bgm,
  sfx: sfx,
  setMute: setMute,
  level: level,
  get state() {
   return ctx ? ctx.state : "none";
  },
  get muted() {
   return mute;
  }
 };
})();