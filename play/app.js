(() => {
 const $ = id => document.getElementById(id);
 const wait = ms => new Promise(r => setTimeout(r, ms * speed));
 const game = $("game");
 const ov = $("overlay");
 let run = null;
 let busy = false;
 let shownBg = null;
 let lastCard = null;
 let speed = 1;
 const DEMO = location.hash === "#demo";
 const pref = (() => {
  try {
   return JSON.parse(localStorage.getItem("roguelike-pref")) || {};
  } catch (e) {
   return {};
  }
 })();
 if (pref.auto == null) pref.auto = true;
 const savePref = () => {
  try {
   localStorage.setItem("roguelike-pref", JSON.stringify(pref));
  } catch (e) {}
 };
 speed = pref.fast ? .55 : 1;
 const cardHTML = (k, extra) => Cards.skill(k, extra, {
  lv: Rules.lv(k)
 });
 function offerHTML(k, extra) {
  const html = cardHTML(k, extra);
  if (!run || !CARDS[k].evolve) return html;
  const have = run.deck.filter(d => d === k).length + (run.partner === k ? 1 : 0);
  return have ? '<div class="offer evo-hint">' + html + "<i>進化" + (run.partner === k ? "（相棒）" : "") + "</i></div>" : html;
 }
 const pic = key => {
  const wv = worldSpr(key, (HOME[key] || {
   bg: 0
  }).bg);
  if (wv) return '<img class="spr" src="' + wv.src + '" alt="" draggable="false">';
  return Art.has(ENEMIES[key].art + "_full") ? Art.html(ENEMIES[key].art + "_full") : Art.html("spr_" + key, "spr");
 };
 const ICON = {
  atk: '<svg viewBox="0 0 32 32"><path d="M6 26 L22 10 L24 4 L28 8 L22 10 M10 18 L14 22 M4 28 L8 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  def: '<svg viewBox="0 0 32 32"><path d="M16 3 C21 6 25 6 28 6 C28 18 24 25 16 29 C8 25 4 18 4 6 C7 6 11 6 16 3 Z" fill="#4aa8ff" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  aoe: '<svg viewBox="0 0 32 32"><path d="M16 3 L19 12 L29 12 L21 18 L24 28 L16 22 L8 28 L11 18 L3 12 L13 12 Z" fill="#ff7a4a" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  buff: '<svg viewBox="0 0 32 32"><path d="M16 4 L26 16 L20 16 L20 28 L12 28 L12 16 L6 16 Z" fill="#ff4a6a" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  burn: '<svg viewBox="0 0 32 32"><path d="M16 3 C20 10 26 13 26 20 C26 26 21 29 16 29 C11 29 6 26 6 20 C6 15 10 13 11 8 C13 12 14 13 16 13 C16 9 15 6 16 3 Z" fill="#ff8a1e" stroke="#fff" stroke-width="2.2"/></svg>',
  heal: '<svg viewBox="0 0 32 32"><path d="M12 4 H20 V12 H28 V20 H20 V28 H12 V20 H4 V12 H12 Z" fill="#4ad07a" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  curse: '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" rx="3" fill="#5a2a8a" stroke="#fff" stroke-width="2.2"/><path d="M12 12 L20 20 M20 12 L12 20" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>'
 };
 let intentHold = false;
 let blockView = null;
 function intentHTML(it) {
  const parts = [];
  if (it.atk) parts.push([ "atk", ICON.atk + "<b>" + it.atk + (it.times > 1 ? "×" + it.times : "") + "</b>" ]);
  if (it.aoe) parts.push([ "atk", ICON.aoe + "<small>全体</small><b>" + it.aoe + "</b>" ]);
  if (it.block) parts.push([ "def", ICON.def + "<b>" + it.block + "</b>" ]);
  if (it.buff) parts.push([ "buff", ICON.buff + "<small>力</small><b>+" + it.buff + "</b>" ]);
  if (it.burn) parts.push([ "burn", ICON.burn + "<small>燃焼</small><b>" + it.burn + "</b>" ]);
  if (it.curse) parts.push([ "curse", ICON.curse + "<small>のろい</small><b>" + it.curse + "</b>" ]);
  if (it.heal) parts.push([ "heal", ICON.heal + "<small>回復</small><b>" + it.heal + "</b>" ]);
  return parts.map(p => '<span class="it ' + p[0] + '">' + p[1] + "</span>").join("");
 }
 const STATUS = {
  burn: [ "燃焼", "#ff7a1e" ],
  weak: [ "弱体", "#6aa8ff" ],
  vuln: [ "ひび", "#c86aff" ],
  str: [ "力", "#ff4a6a" ],
  thorns: [ "反撃", "#ffb02e" ]
 };
 function statusHTML(o) {
  return Object.keys(STATUS).filter(k => o[k] > 0).map(k => '<span class="st" style="--c:' + STATUS[k][1] + '" title="' + (KEYWORDS[STATUS[k][0]] || "攻撃のダメージが、その数だけ増える") + '">' + STATUS[k][0] + "<b>" + o[k] + "</b></span>").join("");
 }
 const AREA_SPARK = [ "#ffd0a0", "#ffffff", "#a0e0ff", "#70f0ff", "#e8ff70", "#c0b8ff", "#ff9a5a", "#ffd060", "#c080ff", "#ffb040", "#e0f8ff", "#ff80b0", "#ffb070" ];
 const AREA_LIGHT = [ "#ff9a50", "#a8d8ff", "#9a80e0", "#50c8d8", "#b0e060", "#8898f0", "#ff6a40", "#ffc060", "#b070ff", "#ff5a20", "#80e0ff", "#d04090", "#ff9a4a" ];
 function worldSpr(key, area) {
  const m = typeof WORLD_SPR !== "undefined" && WORLD_SPR[key];
  if (!m) return null;
  const areas = Object.keys(m).map(Number);
  const a = areas.includes(area) ? area : areas.sort((x, y) => Math.abs(x - area) - Math.abs(y - area))[0];
  return {
   src: "art/w/" + key + "_" + a + ".png",
   w: m[a][0],
   h: m[a][1]
  };
 }
 const HOME = {};
 MAP.enemies.forEach(t => [ ...t.pool, ...t.elite || [] ].forEach(k => {
  if (!HOME[k] && !ENEMIES[k].boss) HOME[k] = {
   bg: t.from - 1,
   name: PLACES[t.from - 1],
   floor: t.from
  };
 }));
 for (const k in BOSS_PLACE) HOME[k] = {
  bg: BOSS_PLACE[k][0],
  name: BOSS_PLACE[k][1],
  floor: MAP.floors
 };
 const DEX_ORDER = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss && HOME[k]).sort((a, b) => HOME[a].floor - HOME[b].floor).concat(BOSS_ORDER, FINAL_BOSS, LAST_BOSS);
 const DEX_CARDS = REWARD_POOL.concat(Object.keys(CARDS).filter(k => CARDS[k].unit && !CARDS[k].evolved && !CARDS[k].packOnly), LEGENDS);
 const ownCard = k => (Rules.save().collection[k] || 0) > 0 || Rules.save().dex.includes(k);
 function dexPic(k, seen) {
  const h = HOME[k] || {
   bg: 0
  };
  const wv = worldSpr(k, h.bg);
  const img = wv ? '<img class="spr" src="' + wv.src + '" alt="" draggable="false">' : Art.has("spr_" + k) ? Art.html("spr_" + k, "spr") : Art.html(ENEMIES[k].art + "_full");
  return '<span class="dx-pic' + (seen ? "" : " unseen") + '" style="background-image:url(art/bg_area' + h.bg + '.png)">' + img + "</span>";
 }
 function placeOf(floor, enemy) {
  const bp = ENEMIES[enemy] && ENEMIES[enemy].boss && BOSS_PLACE[enemy];
  const i = Math.min(PLACES.length - 1, Math.max(0, floor - 1));
  return bp ? {
   bg: bp[0],
   name: bp[1]
  } : {
   bg: i,
   name: PLACES[i]
  };
 }
 function setBg(key) {
  if (shownBg === key) return;
  shownBg = key;
  const area = key && key.startsWith("area") ? +key.slice(4) : -1;
  if (key === "title") {
   $("bg").innerHTML = '<div class="lobby-scene title-scene">' + PLACES.map((_, i) => '<img src="art/bg_area' + i + '.png" alt="" style="--i:' + i + '">').join("") + "</div>";
   FX.embers($("bg"), "#ffd0a0", 14);
  } else if (area >= 0) {
   $("bg").innerHTML = '<div class="lobby-scene area-scene"><img src="art/bg_area' + area + '.png" alt=""></div>';
   FX.embers($("bg"), AREA_SPARK[area], 16);
  } else {
   $("bg").innerHTML = key ? pic(key) : "";
   if (key) FX.embers($("bg"), FX.TONE[ENEMIES[key].attr].c2, 24);
  }
 }
 let hpView = null, fieldView = null, shownField = [];
 const copyUnit = u => Object.assign({}, u);
 const fv = id => fieldView && fieldView.find(u => u.id === id);
 const shownHp = {
  p: 0,
  e: 0
 };
 function render() {
  renderBody();
  if (coachCur) requestAnimationFrame(placeCoach);
 }
 function renderBody() {
  game.dataset.phase = run ? run.phase : "title";
  $("n-gold").textContent = Rules.save().gold;
  if (!run || !run.battle) return;
  const b = run.battle, en = ENEMIES[b.enemy.key], at = ATTRS[en.attr];
  const place = placeOf(run.floor, b.enemy.key);
  setBg("area" + place.bg);
  game.style.setProperty("--amb", AREA_LIGHT[place.bg] || "#ffffff");
  const tag = en.boss ? "ボス" : (b.elite ? "強敵 ・ " : "") + run.floor + "階 / " + MAP.floors;
  $("stage-name").innerHTML = "<span><small>" + tag + "</small>" + place.name + '<small class="turn">ターン ' + b.turn + "</small></span>";
  $("p-name").textContent = PLAYER.name;
  setBar("p", hpView ? hpView.p : run.hp, run.maxHp);
  game.classList.toggle("danger", (hpView ? hpView.p : run.hp) / run.maxHp <= .3 && run.phase === "battle");
  setBlock("p-block", blockView != null ? blockView : b.block);
  $("p-status").innerHTML = statusHTML({
   burn: b.burn,
   thorns: b.thorns
  });
  const mon = $("monster");
  if (mon.dataset.key !== b.enemy.key) {
   mon.dataset.key = b.enemy.key;
   const wv = worldSpr(b.enemy.key, place.bg);
   const spr = !wv && Art.has("spr_" + b.enemy.key);
   mon.className = "monster " + (wv ? "world" : spr ? "sprite" : "portrait") + (en.boss ? " boss" : "") + (b.elite ? " elite" : "");
   mon.innerHTML = wv ? '<img src="' + wv.src + '" alt="" draggable="false">' : spr ? Art.html("spr_" + b.enemy.key) : pic(b.enemy.key);
   if (wv) {
    mon.style.setProperty("--sw", wv.w);
    mon.style.setProperty("--sh", wv.h);
   }
   mon.style.setProperty("--spr", spr ? "url(art/spr_" + b.enemy.key + ".png)" : "none");
   FX.summon(game, mon, en.attr);
  }
  mon.classList.toggle("enraged", !!b.enemy.enraged);
  $("enemy").style.setProperty("--en", at.main);
  $("e-name").textContent = (b.elite ? "強・" : "") + en.name;
  const gem = $("e-attr");
  gem.textContent = at.name;
  gem.style.setProperty("--a", at.main);
  gem.style.setProperty("--ad", at.deep);
  setBar("e", hpView ? hpView.e : b.enemy.hp, b.enemy.maxHp);
  setBlock("e-block", b.enemy.block);
  $("e-status").innerHTML = statusHTML(b.enemy) + passiveHTML(en);
  if (!intentHold) [ ...document.querySelectorAll("#e-status .st, #p-status .st") ].forEach(el => {
   const nm = el.firstChild.textContent, desc = el.title;
   coach([ {
    id: "st-" + nm,
    el: () => [ ...document.querySelectorAll("#e-status .st, #p-status .st") ].find(x => x.firstChild.textContent === nm),
    text: "<b>" + nm + "</b>：" + desc,
    until: "next"
   } ]);
  });
  const intent = $("intent");
  if (!intentHold) {
   const nx = Rules.intentOf(run);
   let aim = "";
   if (nx.atk) {
    const t = Rules.targetOf(run);
    aim = '<span class="aim">→ ' + (t >= 0 ? CARDS[b.field[t].key].name : "あなた") + "</span>";
   }
   if (nx.aoe) aim = '<span class="aim">→ 全員</span>';
   intent.innerHTML = intentHTML(nx) + aim;
   intent.style.visibility = run.phase === "battle" ? "visible" : "hidden";
  }
  const field = fieldView || b.field;
  if (!fieldView) shownField = b.field.map(copyUnit);
  $("field").innerHTML = field.map((u, i) => {
   const c = CARDS[u.key];
   const tags = [ u.partner && '<i class="tg partner">相棒</i>', u.ward && '<i class="tg ward">守護</i>', u.rush && '<i class="tg rush">突進</i>', u.double && '<i class="tg rush">2回</i>' ].filter(Boolean).join("");
   return '<div class="unit' + (u.sleeping ? " sleeping" : "") + (u.down ? " down" : "") + (u.ward ? " ward" : "") + (u.partner ? " partner" : "") + (c.evolved ? " evo" : "") + '" data-i="' + i + '" data-id="' + u.id + '" data-key="' + u.key + '" style="--a:' + ATTRS[c.attr].main + '">' + '<div class="unit-pic">' + Art.html(c.art) + (u.sleeping ? '<span class="zz">zz</span>' : "") + (u.down ? '<span class="downmark">ダウン<b>' + u.down + "</b></span>" : "") + '<div class="unit-stats"><span class="u-atk">' + u.atk + '</span><span class="u-hp">' + Math.max(0, u.hp) + "</span></div></div>" + '<div class="unit-name">' + c.name + "</div>" + (tags ? '<div class="unit-tags">' + tags + "</div>" : "") + "</div>";
  }).join("") + Array.from({
   length: Math.max(0, PLAYER.fieldMax - field.length)
  }, () => '<div class="unit empty"></div>').join("");
  $("player").classList.remove("targeted");
  if (!intentHold && run.phase === "battle" && !fieldView) {
   const nx = Rules.intentOf(run);
   if (nx.aoe) {
    $("player").classList.add("targeted");
    $("field").querySelectorAll(".unit:not(.empty)").forEach(el => el.classList.add("targeted"));
   } else if (nx.atk) {
    const t = Rules.targetOf(run);
    if (t >= 0) {
     const el = $("field").children[t];
     if (el) el.classList.add("targeted");
    } else $("player").classList.add("targeted");
   }
  }
  if (!intentHold) {
   const hand = $("hand"), n = b.hand.length;
   const sig = b.hand.map((c, i) => {
    const h = Rules.handCard(run, i);
    return c.uid + ":" + h.cost + ":" + h.boost + ":" + (Rules.canPlay(run, i) ? 1 : 0);
   }).join(",") + "|" + hand.clientWidth;
   if (hand.dataset.sig !== sig) {
    hand.dataset.sig = sig;
    const before = new Set([ ...hand.children ].map(el => el.dataset.uid));
    hand.innerHTML = b.hand.map((c, i) => {
     const h = Rules.handCard(run, i);
     return Cards.skill(c.key, Rules.canPlay(run, i) ? "" : "off", h);
    }).join("");
    const cw = hand.firstElementChild ? hand.firstElementChild.offsetWidth : 0;
    const overlap = n > 1 ? Math.max(cw * .12, (n * cw - hand.clientWidth) / (n - 1)) : 0;
    [ ...hand.children ].forEach((el, i) => {
     const t = n > 1 ? i / (n - 1) - .5 : 0;
     el.style.marginLeft = i ? -overlap + "px" : "0";
     el.style.setProperty("--rot", (t * 10).toFixed(1));
     el.style.setProperty("--lift", (Math.abs(t) * 14).toFixed(1));
     el.dataset.index = i;
     el.dataset.uid = b.hand[i].uid;
    });
    Cards.fit(hand);
    const pile = $("n-draw").getBoundingClientRect();
    [ ...hand.children ].forEach((el, i) => {
     if (before.size && !before.has(String(b.hand[i].uid))) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--fx", pile.left - r.left + "px");
      el.style.setProperty("--fy", pile.top - r.top + "px");
      el.classList.add("drawn");
     }
    });
   }
   $("energy-n").textContent = b.mp;
   $("energy-max").textContent = "/" + b.mpMax;
   $("mp-pips").innerHTML = Array.from({
    length: PLAYER.mpMax
   }, (_, i) => '<i class="' + (i < b.mp ? "on" : i < b.mpMax ? "max" : "") + '"></i>').join("");
   $("energy").classList.toggle("empty", b.mp === 0);
   $("n-draw").textContent = b.drawPile.length;
   $("n-discard").textContent = b.discard.length;
  }
  const canAny = Rules.anyPlayable(run);
  $("end-turn").disabled = busy || run.phase !== "battle";
  $("end-turn").classList.toggle("ready", !canAny && !busy);
  $("auto").setAttribute("aria-pressed", pref.auto);
  $("fast").setAttribute("aria-pressed", !!pref.fast);
  document.querySelectorAll('.bottom [data-snd="bgm"]').forEach(x => x.setAttribute("aria-pressed", !pref.noBgm));
  document.querySelectorAll('.bottom [data-snd="sfx"]').forEach(x => x.setAttribute("aria-pressed", !pref.noSfx));
 }
 function passiveHTML(en) {
  const p = en.passive || {}, out = [];
  if (p.armor) out.push([ "かたい", "毎ターン防御+" + p.armor ]);
  if (p.hunter) out.push([ "狩人", "守護を無視して召喚獣から狙う" ]);
  if (p.spite) out.push([ "魔封じ", "あなたが魔法を使うたび力+1（+3まで）" ]);
  if (en.phase2) out.push([ "怒り", "HPが半分を切ると行動が変わる" ]);
  return out.map(o => '<span class="st passive" title="' + o[1] + '">' + o[0] + "</span>").join("");
 }
 function setBar(p, hp, max) {
  shownHp[p] = hp;
  $(p + "-hpbar").style.width = hp / max * 100 + "%";
  $(p + "-hpbar").parentElement.classList.toggle("low", hp / max <= .3);
  $(p + "-hp").textContent = hp + " / " + max;
 }
 function setBlock(id, v) {
  const el = $(id);
  el.hidden = v <= 0;
  el.textContent = v;
 }
 function centerOf(el) {
  const r = el.getBoundingClientRect();
  return {
   x: r.left + r.width / 2,
   y: r.top + r.height / 2
  };
 }
 function pop(text, cls, at, spread) {
  const el = document.createElement("div");
  el.className = "pop " + cls;
  el.textContent = text;
  el.style.left = at.x + (Math.random() - .5) * (spread ?? 60) + "px";
  el.style.top = at.y + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
 }
 function banner(text, cls) {
  game.querySelectorAll(".banner").forEach(x => x.remove());
  const el = document.createElement("div");
  el.className = "banner " + (cls || "");
  el.innerHTML = "<b>" + text + "</b>";
  game.appendChild(el);
  setTimeout(() => el.remove(), 2e3);
 }
 function retrigger(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
 }
 const unitEl = ev => $("field").querySelector(ev && ev.id != null ? '.unit[data-id="' + ev.id + '"]' : '.unit[data-i="' + ev + '"]');
 const playerAt = () => centerOf($("player"));
 async function flyCard(cardEl, toEl) {
  const r = cardEl.getBoundingClientRect();
  const fly = cardEl.cloneNode(true);
  fly.classList.add("flying");
  Object.assign(fly.style, {
   left: r.left + "px",
   top: r.top + "px",
   width: r.width + "px",
   transform: "none",
   marginLeft: "0"
  });
  document.body.appendChild(fly);
  cardEl.style.visibility = "hidden";
  const to = centerOf(toEl);
  void fly.offsetWidth;
  fly.style.transform = "translate(" + (to.x - r.left - r.width / 2) + "px," + (to.y - r.top - r.height / 2) + "px) scale(.5) rotate(-8deg)";
  fly.style.opacity = "0";
  await wait(300);
  fly.remove();
 }
 function cutIn(o) {
  return new Promise(res => {
   const el = document.createElement("div"), M = o.ms * (window._kcSlow || 1);
   el.className = "kc " + (o.img2 ? "evo" : "boss") + (o.pixel ? "" : " kc-card") + (o.style ? " kc-s-" + o.style : "") + (o.imgB ? " two" : "");
   el.style.setProperty("--ci", o.color || "#d23a5e");
   el.style.setProperty("--ms", M + "ms");
   const im = (src, cls) => '<img class="' + cls + '" src="' + src + '" alt="" draggable="false">';
   el.innerHTML = '<div class="kc-band"><i class="kc-lines"></i><i class="kc-fx"></i>' + '<div class="kc-pic"><i class="kc-circle"></i><i class="kc-pillar"></i>' + '<div class="kc-ghost g2">' + im(o.img, "") + '</div><div class="kc-ghost">' + im(o.img, "") + "</div>" + '<div class="kc-actor">' + im(o.img, "kc-a") + (o.imgB ? im(o.imgB, "kc-a kc-a2") : "") + (o.img2 ? im(o.img2, "kc-b") : "") + '<i class="kc-eye"></i></div>' + '<i class="kc-ring"></i><i class="kc-ring r2"></i></div>' + '<div class="kc-name"><small>' + o.sub + "</small><b>" + o.name + '</b></div><i class="kc-slash"></i></div>';
   document.body.appendChild(el);
   const band = el.querySelector(".kc-band"), timers = [];
   const at = (f, fn) => timers.push(setTimeout(fn, M * f));
   const peak = () => {
    retrigger(band, "hit");
    const r = el.querySelector(".kc-actor").getBoundingClientRect();
    FX.burst(el, r.left + r.width / 2, r.top + r.height * .45, o.attr || "light", 34, 1.6);
    FX.burst(el, r.left + r.width / 2, r.top + r.height * .45, "light", 16, 2.4);
   };
   if (o.img2) {
    at(.22, () => Sound.sfx("card"));
    at(.28, () => Sound.sfx("card"));
    at(.34, () => Sound.sfx("mana"));
    at(.44, () => {
     Sound.sfx("shatter");
     peak();
    });
    at(.47, () => Sound.sfx("levelup"));
   } else {
    at(.13, () => Sound.sfx("step"));
    at(.28, () => Sound.sfx("crack"));
    at(.42, () => {
     Sound.sfx("roar");
     peak();
    });
   }
   const extra = {
    earth: [ .58, "crack" ],
    fire: [ .58, "roar" ],
    light: [ .53, "shatter" ],
    slash: [ .4, "shatter" ],
    ice: [ .4, "crack" ],
    dark: [ .2, "mana" ],
    star: [ .56, "mana" ],
    wind: [ .55, "step" ],
    bounce: [ .56, "step" ]
   }[o.style];
   if (extra) at(extra[0], () => {
    Sound.sfx(extra[1]);
    if ([ "earth", "fire", "ice" ].includes(o.style) && o.img2) retrigger(band, "hit");
   });
   let done = false;
   const end = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    el.remove();
    res();
   };
   el.addEventListener("pointerdown", end);
   setTimeout(end, M);
  });
 }
 window._cutIn = cutIn;
 function bossCut(key, area, sp) {
  const en = ENEMIES[key], c = CUTIN[key] || {}, ws = worldSpr(key, area);
  return {
   img: ws ? ws.src : "art/" + en.art + ".png",
   pixel: !!ws,
   name: en.name,
   sub: "BOSS",
   color: c.color || AREA_LIGHT[area] || "#d23a5e",
   attr: en.attr,
   style: c.style,
   ms: (c.ms || 2600) * (sp || 1)
  };
 }
 function evoCut(from, to, sp, area) {
  const c = CUTIN[to] || {};
  const en = Object.keys(ENEMIES).filter(k => ENEMIES[k].card === from).sort((a, b) => !!ENEMIES[a].boss - !!ENEMIES[b].boss)[0];
  return {
   img: "art/" + CARDS[from].art + ".png",
   imgB: en ? "art/var/" + from + ".png?v=3" : null,
   img2: "art/" + CARDS[to].art + ".png",
   name: CARDS[to].name,
   sub: "相棒が進化",
   color: c.color || "#ffd36a",
   attr: CARDS[to].attr,
   style: c.style,
   ms: 2800 * (sp || 1)
  };
 }
 function cutInDemo() {
  if (location.hash !== "#cutin") return;
  document.querySelectorAll(".kc-list").forEach(n => n.remove());
  const bosses = BOSS_ORDER.concat(FINAL_BOSS, LAST_BOSS);
  const box = document.createElement("div");
  box.className = "kc-list";
  box.innerHTML = "<b>ボス</b>" + bosses.map(k => '<button class="ghost" data-kb="' + k + '">' + ENEMIES[k].name + "</button>").join("") + "<b>相棒の進化</b>" + MONSTERS.map(k => '<button class="ghost" data-ke="' + k + '">' + CARDS[CARDS[k].evolve].name + "</button>").join("") + '<button class="ghost" data-kall>ぜんぶ続けて見る</button>';
  document.body.appendChild(box);
  const one = el => el.dataset.kb ? cutIn(bossCut(el.dataset.kb, BOSS_PLACE[el.dataset.kb][0])) : cutIn(evoCut(el.dataset.ke, CARDS[el.dataset.ke].evolve));
  box.addEventListener("click", async e => {
   const b = e.target.closest("button");
   if (!b) return;
   try {
    Sound.unlock();
   } catch (err) {}
   if (b.dataset.kall == null) return one(b);
   for (const x of box.querySelectorAll("[data-kb], [data-ke]")) {
    await one(x);
    await wait(400);
   }
  });
 }
 window.addEventListener("hashchange", cutInDemo);
 setTimeout(cutInDemo, 300);
 function bossIntro(en) {
  busy = true;
  const key = run.battle.enemy.key, area = placeOf(MAP.floors, key).bg;
  return cutIn(bossCut(key, area, speed)).then(() => {
   busy = false;
  });
 }
 let slow = 1;
 const pause = ms => wait(ms * slow);
 function actText(it) {
  const out = [];
  if (it.atk) out.push("攻撃 " + it.atk + (it.times > 1 ? "×" + it.times : ""));
  if (it.aoe) out.push("全体攻撃 " + it.aoe);
  if (it.block) out.push("防御 +" + it.block);
  if (it.buff) out.push("力をためる +" + it.buff);
  if (it.burn) out.push("火をはく 燃焼" + it.burn);
  if (it.curse) out.push("のろいをかける");
  if (it.heal) out.push("回復 +" + it.heal);
  return out.join("　");
 }
 async function show(events) {
  hpView = {
   p: shownHp.p,
   e: shownHp.e
  };
  fieldView = shownField.map(copyUnit);
  try {
   await showEvents(events);
  } finally {
   hpView = null;
   fieldView = null;
  }
 }
 async function showEvents(events) {
  let unitPhase = false, lastWasUnit = false;
  const enemyAttr = () => (ENEMIES[$("monster").dataset.key] || {}).attr;
  const srcAttr = src => CARDS[src] ? CARDS[src].attr : src === "burn" ? "fire" : "light";
  const r0 = run;
  for (const ev of events) {
   if (run !== r0) return;
   switch (ev.type) {
   case "play":
    lastCard = ev.card;
    lastWasUnit = false;
    Sound.sfx("card");
    break;

   case "hit":
    if (ev.who === "enemy" && ev.hp != null) hpView.e = ev.hp;
    if (ev.who === "player" && ev.hp != null) hpView.p = ev.hp;
    if (ev.who === "player" && blockView != null) blockView = Math.max(0, blockView - (ev.absorbed || 0));
    if (ev.who === "unit" && blockView != null) blockView = Math.max(0, blockView - (ev.absorbed || 0));
    if ((ev.who === "player" || ev.who === "unit") && ev.absorbed > 0) {
     const tgt = ev.who === "unit" ? unitEl(ev) : $("player");
     if (tgt) {
      const at = centerOf(tgt);
      PXFX.shine(tgt.getBoundingClientRect(), "#bfe4ff");
      const r = tgt.getBoundingClientRect();
      pop("防御 −" + ev.absorbed, "blk guard-pop", ev.who === "unit" ? {
       x: r.right + 56,
       y: at.y
      } : {
       x: at.x,
       y: at.y - 34
      }, 0);
      retrigger($("p-block"), "crack");
     }
    }
    if (ev.who === "enemy") {
     Sound.sfx(ev.amount >= 10 ? "bigHit" : ev.amount > 0 ? "hit" : "blocked");
     retrigger($("monster"), "hit");
     const at = centerOf($("monster"));
     if (ev.src !== "burn" && !lastWasUnit) PXFX.cast(srcAttr(ev.src), $("monster").getBoundingClientRect(), ev.amount);
     FX.burst(game, at.x, at.y, srcAttr(ev.src), ev.amount > 8 ? 18 : 10, ev.amount > 8 ? 1 : .65);
     pop(ev.amount > 0 ? ev.amount : "ブロック", ev.amount > 0 ? ev.amount >= 10 ? "dmg big" : "dmg" : "zero", at);
     if (ev.amount >= 10) retrigger(game, "shake");
     render();
     await pause(220);
    } else if (ev.who === "unit") {
     {
      const u = fv(ev.id);
      if (u && ev.hp != null) u.hp = ev.hp;
     }
     Sound.sfx("hit");
     const el = unitEl(ev);
     if (el) {
      const at = centerOf(el);
      if (ev.amount > 0) {
       retrigger(el, "hurt");
       PXFX.claws(el.getBoundingClientRect());
       FX.burst(game, at.x, at.y, enemyAttr(), 8, .5);
       pop(ev.amount, "hurt", at, 20);
      } else {
       Sound.sfx("blocked");
       PXFX.shine(el.getBoundingClientRect());
       pop("ブロック", "zero", at, 0);
      }
     }
     await pause(240);
     render();
    } else {
     const at = playerAt();
     Sound.sfx(ev.amount > 0 ? "hurt" : "blocked");
     if (ev.amount > 0) PXFX.claws($("player").getBoundingClientRect()); else PXFX.shine($("player").getBoundingClientRect());
     FX.burst(game, at.x, at.y, enemyAttr(), 10, .6);
     if (ev.amount > 0) {
      pop(ev.amount, "hurt", at);
      retrigger($("flash"), "on");
      retrigger(game, "shake");
     } else pop("ブロック", "zero", at);
     render();
     await pause(300);
    }
    break;

   case "enemyAttack":
    Sound.sfx("enemyAtk");
    retrigger($("monster"), "attack");
    if (typeof ev.target === "number" && ev.target >= 0) {
     const uel = $("field").children[ev.target], u = fieldView && fieldView[ev.target];
     const hunter = ((ENEMIES[$("monster").dataset.key] || {}).passive || {}).hunter;
     if (uel && u && u.ward && !hunter) {
      retrigger(uel, "guarding");
      PXFX.streak($("monster").getBoundingClientRect(), uel.getBoundingClientRect(), "fire");
      {
       const r = uel.getBoundingClientRect();
       pop("かばう！", "ward-pop", {
        x: r.left + r.width / 2,
        y: r.top - 10
       }, 0);
      }
      await pause(160);
     }
    }
    if (ev.target === "all") {
     const r = $("monster").getBoundingClientRect();
     PXFX.shock(r.bottom - r.height * .15);
     retrigger(game, "shake");
    }
    await pause(170);
    break;

   case "summon":
    {
     Sound.sfx("summon");
     {
      const u = run.battle && run.battle.field.find(x => x.id === ev.id);
      if (u && !fv(ev.id)) fieldView.push(copyUnit(u));
     }
     render();
     const el = unitEl(ev);
     if (el) {
      retrigger(el, "appear");
      PXFX.circle(el.getBoundingClientRect(), CARDS[ev.card].attr);
      const at = centerOf(el);
      FX.burst(game, at.x, at.y, CARDS[ev.card].attr, 16, .7);
     }
     await pause(420);
     break;
    }

   case "unitAttack":
    {
     if (!unitPhase) {
      unitPhase = true;
      banner("召喚獣の攻撃", "tag");
      await pause(170);
     }
     const el = unitEl(ev);
     if (el) {
      retrigger(el, "strike");
      lastCard = el.dataset.key;
      PXFX.streak(el.getBoundingClientRect(), $("monster").getBoundingClientRect(), CARDS[el.dataset.key].attr);
     }
     Sound.sfx("slash");
     lastWasUnit = true;
     await pause(190);
     break;
    }

   case "unitAct":
    retrigger(unitEl(ev), "act");
    await pause(160);
    break;

   case "partnerDown":
    {
     TUT.partnerDown();
     {
      const u = fv(ev.id);
      if (u) {
       u.hp = 0;
       u.down = ev.turns;
      }
     }
     Sound.sfx("unitDown");
     const el = unitEl(ev);
     if (el) {
      const at = centerOf(el);
      FX.burst(game, at.x, at.y, "dark", 12, .6);
      pop("ダウン", "zero", at, 0);
     }
     render();
     await pause(380);
     break;
    }

   case "revive":
    {
     {
      const u = fv(ev.id);
      if (u) {
       u.hp = ev.hp;
       u.down = 0;
      }
     }
     Sound.sfx("heal");
     render();
     const el = unitEl(ev);
     if (el) {
      retrigger(el, "appear");
      const at = centerOf(el);
      FX.burst(game, at.x, at.y, "light", 14, .7);
      pop("復活", "heal", at, 0);
     }
     await pause(420);
     break;
    }

   case "unitDown":
    {
     Sound.sfx("unitDown");
     const el = unitEl(ev);
     if (el) {
      const at = centerOf(el);
      FX.burst(game, at.x, at.y, "dark", 14, .7);
      el.classList.add("dying");
     }
     await pause(250);
     fieldView = fieldView.filter(u => u.id !== ev.id);
     render();
     break;
    }

   case "block":
    {
     if (ev.who === "player" && blockView != null) blockView += ev.amount;
     const at = ev.who === "enemy" ? centerOf($("monster")) : playerAt();
     Sound.sfx("block");
     PXFX.shine((ev.who === "enemy" ? $("monster") : $("player")).getBoundingClientRect(), ev.who === "enemy" ? "#ffd0d8" : "#bfe4ff");
     pop("+" + ev.amount, "blk", at);
     render();
     await pause(170);
     break;
    }

   case "heal":
    if (!ev.amount) break;
    if (ev.who === "enemy") {
     hpView.e = ev.ehp;
     Sound.sfx("heal");
     pop("+" + ev.amount, "heal", centerOf($("monster")));
     render();
     await pause(200);
     break;
    }
    if (ev.hp != null) hpView.p = ev.hp;
    Sound.sfx("heal");
    pop("+" + ev.amount, "heal", playerAt());
    render();
    await pause(170);
    break;

   case "status":
    {
     const at = ev.who === "enemy" ? centerOf($("monster")) : playerAt();
     at.y -= 40;
     Sound.sfx({
      burn: "burn",
      str: "buff",
      thorns: "block"
     }[ev.s] || "debuff");
     pop(STATUS[ev.s][0] + (ev.s === "burn" && ev.amount > 0 ? "+" : "+") + ev.amount, "st-pop", at, 30);
     render();
     await pause(200);
     break;
    }

   case "burnTick":
    {
     const at = ev.who === "enemy" ? centerOf($("monster")) : playerAt();
     Sound.sfx("burn");
     PXFX.flames((ev.who === "enemy" ? $("monster") : $("player")).getBoundingClientRect());
     FX.burst(game, at.x, at.y, "fire", 14, .8);
     await pause(150);
     break;
    }

   case "rally":
    if (run.battle) run.battle.field.forEach(r => {
     const u = fv(r.id);
     if (u) {
      u.atk = r.atk;
      u.maxHp = r.maxHp;
      if (!u.down) u.hp += ev.hp || 0;
     }
    });
    Sound.sfx("buff");
    $("field").querySelectorAll(".unit:not(.empty)").forEach(el => retrigger(el, "act"));
    render();
    await pause(220);
    break;

   case "mp":
    Sound.sfx("mana");
    retrigger($("energy"), "gain");
    render();
    await pause(150);
    break;

   case "tag":
    {
     Sound.sfx("combo");
     const at = centerOf($("hand"));
     pop(ev.text, "tag-pop", {
      x: at.x,
      y: at.y - 90
     }, 30);
     await pause(140);
     break;
    }

   case "quest":
    {
     if (run.phase !== "battle") break;
     Sound.sfx("coin");
     setTimeout(() => Sound.sfx("levelup"), 150);
     banner("ミッション達成！ " + QUESTS[ev.key].text + "　+" + ev.gold + "G", "quest");
     const gp = document.querySelector(".gold-pile");
     if (gp) PXFX.coins($("player").getBoundingClientRect(), gp.getBoundingClientRect(), 10);
     await pause(1100);
     break;
    }

   case "enrage":
    Sound.sfx("roar");
    retrigger($("monster"), "charge");
    retrigger($("flash"), "on");
    banner("怒り", "rage");
    render();
    await pause(900);
    break;

   case "curse":
    Sound.sfx("curse");
    pop("のろい×" + ev.amount + " が捨て札に", "st-pop", centerOf($("n-discard")), 0);
    render();
    await pause(400);
    break;

   case "burnCard":
    pop("手札がいっぱい", "zero", centerOf($("hand")), 0);
    TUT.handFull();
    await pause(200);
    break;

   case "turn":
    slow = 1;
    intentHold = false;
    blockView = null;
    retrigger($("intent"), "next");
    retrigger($("energy"), "gain");
    Sound.sfx("turn");
    banner("あなたのターン", "turn");
    render();
    await pause(240);
    break;

   case "enemyTurn":
    slow = 1.7;
    intentHold = true;
    retrigger($("intent"), "act");
    banner("敵のターン", "foe");
    await pause(260);
    break;

   case "enemyAct":
    {
     const t = actText(ev.it);
     if (t) {
      retrigger($("monster"), "charge");
      banner(t, "act");
      await pause(320);
     }
     break;
    }

   case "defeat":
    if (ev.who === "enemy") {
     const en = ENEMIES[$("monster").dataset.key];
     $("intent").style.visibility = "hidden";
     intentHold = false;
     Sound.bgm(null);
     Sound.sfx("freeze");
     setTimeout(() => Sound.sfx("crack"), en.boss ? 420 : 220);
     setTimeout(() => Sound.sfx("shatter"), en.boss ? 940 : 520);
     await FX.shatter(game, $("monster"), en.attr, {
      boss: !!en.boss
     });
     Sound.sfx("victory");
     if (run.gain) {
      PXFX.coins($("monster").getBoundingClientRect(), document.querySelector(".gold-pile").getBoundingClientRect(), 16);
      setTimeout(() => Sound.sfx("coin"), 700);
     }
    } else {
     intentHold = false;
     Sound.bgm(null);
     Sound.sfx("lose");
     await pause(500);
    }
    slow = 1;
    break;
   }
  }
 }
 $("monster").addEventListener("animationend", e => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("hit", "attack", "appear", "charge");
 });
 $("energy").addEventListener("animationend", e => e.currentTarget.classList.remove("shake", "gain"));
 $("field").addEventListener("animationend", e => e.target.classList.remove("appear", "strike", "hurt", "act"));
 const tip = $("tip");
 function placeTip(cardEl) {
  const r = cardEl.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, gap = 12, m = 8;
  let left, top;
  if (r.right + gap + tw < innerWidth - m) left = r.right + gap; else if (r.left - gap - tw > m) left = r.left - gap - tw;
  if (left != null) top = Math.max(m, Math.min(innerHeight - th - m, r.top)); else {
   left = Math.max(m, Math.min(innerWidth - tw - m, r.left + r.width / 2 - tw / 2));
   top = r.bottom + gap + th < innerHeight - m ? r.bottom + gap : Math.max(m, r.top - gap - th);
  }
  tip.style.right = "auto";
  tip.style.left = left + "px";
  tip.style.top = top + "px";
 }
 function showTip(cardEl) {
  const key = cardEl.dataset.key, c = CARDS[key];
  if (!c) return;
  const lv = Rules.lv(key), g = Cards.glossary(key, lv);
  const learn = learnText(key, lv);
  const hi = cardEl.closest("#hand") ? Rules.handCard(run, +cardEl.dataset.index) : {
   lv: lv
  };
  tip.innerHTML = '<div class="tip-card">' + Cards.skill(key, "preview", hi) + "</div>" + "<h4>" + c.name + "<small>" + c.kind + " ・ LV" + lv + "</small></h4>" + '<div class="tip-sec eff"><span class="lbl">効果</span><p class="full">' + cardText(key, hi.lv, hi.boost).replace(/\n/g, "<br>") + "</p></div>" + (learn ? '<div class="tip-sec grow"><span class="lbl">育成</span><p>' + learn + "</p></div>" : "") + (g ? '<div class="gloss"><span class="lbl">ことばの説明</span>' + g + "</div>" : "");
  tip.hidden = false;
  const inHand = !!cardEl.closest("#hand");
  tip.classList.toggle("floating", !inHand);
  tip.style.left = tip.style.top = tip.style.right = "";
  const pc = tip.querySelector(".tip-card");
  if (!inHand) {
   pc.remove();
   Cards.fit(tip);
   placeTip(cardEl);
   return;
  }
  let cw = 150;
  const over = () => tip.scrollHeight > tip.clientHeight + 1;
  pc.style.setProperty("--cw", cw + "px");
  while (over() && cw > 96) {
   cw -= 18;
   pc.style.setProperty("--cw", cw + "px");
  }
  if (over()) pc.style.display = "none";
  Cards.fit(tip);
 }
 document.addEventListener("pointerover", e => {
  if (e.pointerType === "mouse" && e.target.closest("#hand")) return;
  const el = e.target.closest(".card, .unit[data-key]");
  if (el && e.pointerType === "mouse") showTip(el); else if (!el) tip.hidden = true;
 });
 let press = null;
 document.addEventListener("pointerdown", e => {
  const el = e.target.closest(".card, .unit[data-key]");
  if (!el || e.pointerType === "mouse" || el.closest("#hand")) return;
  press = setTimeout(() => {
   showTip(el);
   press = "shown";
  }, 380);
 });
 document.addEventListener("pointerup", () => {
  if (press && press !== "shown") clearTimeout(press);
  setTimeout(() => {
   if (press === "shown") tip.hidden = true;
   press = null;
  }, 1600);
 });
 const eGhost = document.createElement("s");
 eGhost.className = "hp-ghost";
 eGhost.hidden = true;
 $("e-hpbar").after(eGhost);
 const ePv = document.createElement("em");
 ePv.className = "pv";
 ePv.hidden = true;
 $("e-hp").parentElement.after(ePv);
 const pPv = document.createElement("em");
 pPv.className = "pv me";
 pPv.hidden = true;
 $("p-hp").parentElement.after(pPv);
 function previewCard(i) {
  if (busy || !run || run.phase !== "battle") return clearPreview();
  const pv = Rules.preview(run, i);
  if (!pv) return clearPreview();
  const b = run.battle, max = b.enemy.maxHp, cur = b.enemy.hp;
  const dmg = cur - pv.enemyHp, blk = pv.block - b.block, heal = pv.hp - run.hp;
  eGhost.hidden = dmg <= 0;
  if (dmg > 0) {
   eGhost.style.left = Math.max(0, pv.enemyHp) / max * 100 + "%";
   eGhost.style.width = Math.min(dmg, cur) / max * 100 + "%";
  }
  ePv.hidden = dmg <= 0;
  ePv.textContent = pv.kill ? "たおせる！" : "-" + dmg;
  ePv.classList.toggle("kill", !!pv.kill);
  const me = [ blk > 0 ? "防御+" + blk : "", heal > 0 ? "HP+" + heal : "" ].filter(Boolean).join(" ");
  pPv.hidden = !me;
  pPv.textContent = me;
 }
 function clearPreview() {
  eGhost.hidden = ePv.hidden = pPv.hidden = true;
 }
 $("hand").addEventListener("pointerleave", clearPreview);
 let liftEl = null, handPick = null;
 document.addEventListener("pointermove", e => {
  if (e.pointerType === "touch") return;
  const hand = $("hand");
  let pick = null;
  if (hand && run && run.phase === "battle") {
   const r = hand.getBoundingClientRect(), cards = [ ...hand.querySelectorAll(".card") ];
   const lift = cards[0] ? cards[0].offsetHeight * .5 : 0;
   if (e.clientY >= r.top - lift && e.clientY <= r.bottom + 8) {
    const x = e.clientX - r.left, base = cards[0] && cards[0].offsetParent === hand ? 0 : hand.offsetLeft;
    let best = Infinity;
    for (const c of cards) {
     const left = c.offsetLeft - base, d = Math.abs(x - (left + c.offsetWidth / 2));
     if (d < best && x >= left && x < left + c.offsetWidth) {
      best = d;
      pick = c;
     }
    }
   }
  }
  if (pick !== handPick) {
   handPick = pick;
   const up = pick && !pick.classList.contains("off") ? pick : null;
   if (up !== liftEl) {
    if (liftEl) liftEl.classList.remove("lift");
    liftEl = up;
    if (up) up.classList.add("lift");
   }
   if (pick) {
    showTip(pick);
    if (up) previewCard(+up.dataset.index); else clearPreview();
   } else {
    clearPreview();
    if (e.target.closest && !e.target.closest(".card, .unit[data-key], .tip")) tip.hidden = true;
   }
  }
 });
 let swipe = null, lastTouch = 0;
 const SWIPE = 46;
 const cardAtX = x => {
  const hand = $("hand"), r = hand.getBoundingClientRect(), cards = [ ...hand.querySelectorAll(".card") ];
  const base = cards[0] && cards[0].offsetParent === hand ? 0 : hand.offsetLeft, lx = x - r.left;
  let pick = null, best = Infinity;
  for (const c of cards) {
   const left = c.offsetLeft - base, d = Math.abs(lx - (left + c.offsetWidth / 2));
   if (d < best) {
    best = d;
    pick = c;
   }
  }
  return pick;
 };
 const touchPick = el => {
  if (liftEl && liftEl !== el) {
   liftEl.classList.remove("lift", "tlift", "armed");
   liftEl.style.removeProperty("--dy");
  }
  liftEl = handPick = el;
  if (!el) {
   clearPreview();
   tip.hidden = true;
   return;
  }
  el.classList.add("tlift");
  showTip(el);
  if (!el.classList.contains("off")) previewCard(+el.dataset.index); else clearPreview();
 };
 $("hand").addEventListener("pointerdown", e => {
  if (e.pointerType !== "touch" || busy || !run || run.phase !== "battle") return;
  const el = e.target.closest(".card");
  if (!el) return;
  lastTouch = Date.now();
  swipe = {
   id: e.pointerId,
   x: e.clientX,
   y: e.clientY,
   el: el
  };
  touchPick(el);
 });
 document.addEventListener("pointermove", e => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const dy = e.clientY - swipe.y;
  if (dy > -SWIPE / 2) {
   const el = cardAtX(e.clientX);
   if (el && el !== swipe.el) {
    swipe.el = el;
    swipe.y = e.clientY;
    touchPick(el);
    return;
   }
  }
  const up = Math.min(0, dy);
  swipe.el.style.setProperty("--dy", up + "px");
  swipe.el.classList.toggle("armed", up < -SWIPE && !swipe.el.classList.contains("off"));
 });
 const endSwipe = e => {
  if (!swipe || e.pointerId !== swipe.id) return;
  const s = swipe;
  swipe = null;
  lastTouch = Date.now();
  const used = e.type === "pointerup" && e.clientY - s.y < -SWIPE;
  s.el.classList.remove("armed");
  s.el.style.removeProperty("--dy");
  if (used) playCard(s.el);
 };
 document.addEventListener("pointerup", endSwipe);
 document.addEventListener("pointercancel", endSwipe);
 document.addEventListener("pointerdown", e => {
  if (e.pointerType === "touch" && liftEl && !e.target.closest("#hand, .tip")) touchPick(null);
 });
 $("hand").addEventListener("click", e => {
  if (Date.now() - lastTouch < 700) return;
  playCard((e.pointerType !== "touch" && handPick && handPick.isConnected ? handPick : null) || e.target.closest(".card"));
 });
 async function playCard(el) {
  if (!el || busy || press === "shown" || !run || run.phase !== "battle") return;
  const i = +el.dataset.index;
  if (!Rules.canPlay(run, i)) {
   Sound.sfx("deny");
   retrigger($("energy"), "shake");
   return;
  }
  busy = true;
  tip.hidden = true;
  clearPreview();
  const key = run.battle.hand[i].key, r0 = run;
  await flyCard(el, CARDS[key].unit ? $("field") : $("monster"));
  if (run !== r0) return;
  const events = Rules.play(run, i);
  coachEvent("play");
  await show(events);
  if (run !== r0) return;
  busy = false;
  afterAction();
 }
 async function endTurn() {
  if (busy || !run || run.phase !== "battle") return;
  busy = true;
  $("end-turn").disabled = true;
  await wait(120);
  coachEvent("endturn");
  slow = 1.45;
  intentHold = true;
  blockView = run.battle.block;
  const events = Rules.endTurn(run), r0 = run;
  await show(events);
  intentHold = false;
  blockView = null;
  if (run !== r0) return;
  busy = false;
  afterAction();
  if (run.phase === "battle") TUT.afterTurn();
 }
 $("end-turn").addEventListener("click", endTurn);
 $("auto").addEventListener("click", () => {
  pref.auto = !pref.auto;
  savePref();
  render();
  afterAction();
 });
 $("fast").addEventListener("click", () => {
  pref.fast = !pref.fast;
  speed = pref.fast ? .55 : 1;
  savePref();
  render();
 });
 if (!pref.tut) pref.tut = {};
 let coachQ = [], coachCur = null;
 const coachEl = document.createElement("div");
 coachEl.className = "coach";
 coachEl.hidden = true;
 coachEl.innerHTML = '<div class="coach-hole"></div><div class="coach-box"><p></p><div class="coach-btns"><button class="ghost coach-skip">説明を消す</button><button class="end-turn coach-next">次へ</button></div></div>';
 document.body.appendChild(coachEl);
 const coachActive = () => !!coachCur;
 function coach(steps) {
  if (DEMO) return;
  steps = steps.filter(st => !pref.tut[st.id] && !(coachCur && coachCur.id === st.id) && !coachQ.some(q => q.id === st.id));
  if (!steps.length || pref.tut.off) return;
  coachQ.push(...steps);
  if (!coachCur) coachNext();
 }
 function coachNext() {
  if (coachCur) {
   pref.tut[coachCur.id] = true;
   savePref();
  }
  coachCur = coachQ.shift() || null;
  if (!coachCur) {
   coachEl.hidden = true;
   afterCoach();
   return;
  }
  const t = coachCur.el && coachCur.el();
  if (coachCur.el && !t) return coachNext();
  const fresh = coachEl.hidden;
  coachEl.classList.toggle("snap", fresh);
  coachEl.hidden = false;
  coachEl.querySelector("p").innerHTML = coachCur.text;
  coachEl.querySelector(".coach-next").hidden = coachCur.until !== "next";
  coachEl.classList.toggle("passive", coachCur.until !== "next");
  placeCoach();
  if (fresh) {
   void coachEl.offsetWidth;
   coachEl.classList.remove("snap");
  }
 }
 function placeCoach() {
  if (!coachCur) return;
  const hole = coachEl.querySelector(".coach-hole"), box = coachEl.querySelector(".coach-box");
  const t0 = coachCur.el && coachCur.el(), t = t0 && t0.getClientRects().length ? t0 : null;
  if (coachCur.el && !t) {
   coachCur = null;
   coachQ = coachQ.filter(q => {
    const e = q.el && q.el();
    return !q.el || e && e.getClientRects().length;
   });
   return coachNext();
  }
  if (!t) {
   hole.style.cssText = "left:50%;top:50%;width:0;height:0";
   box.style.cssText = "left:50%;top:40%;transform:translate(-50%,-50%)";
   return;
  }
  const r = t.getBoundingClientRect(), pad = 8;
  hole.style.cssText = "left:" + (r.left - pad) + "px;top:" + (r.top - pad) + "px;width:" + (r.width + pad * 2) + "px;height:" + (r.height + pad * 2) + "px";
  const bw = Math.min(340, innerWidth - 24);
  const left = Math.max(12, Math.min(innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
  const below = r.bottom + pad + 14, above = r.top - pad - 14, bh = 150;
  if (below + bh < innerHeight) box.style.cssText = "width:" + bw + "px;left:" + left + "px;top:" + below + "px"; else if (above - bh > 0) box.style.cssText = "width:" + bw + "px;left:" + left + "px;bottom:" + (innerHeight - above) + "px"; else {
   const side = r.right + pad + 14 + bw < innerWidth ? r.right + pad + 14 : Math.max(12, r.left - pad - 14 - bw);
   const top = Math.max(12, Math.min(innerHeight - bh - 12, r.top + r.height / 2 - bh / 2));
   box.style.cssText = "width:" + bw + "px;left:" + side + "px;top:" + top + "px";
  }
 }
 addEventListener("resize", placeCoach);
 ov.addEventListener("scroll", placeCoach);
 coachEl.querySelector(".coach-next").addEventListener("click", () => {
  Sound.sfx("select");
  coachNext();
 });
 coachEl.querySelector(".coach-skip").addEventListener("click", () => {
  pref.tut.off = true;
  savePref();
  coachQ = [];
  coachCur = null;
  coachEl.hidden = true;
  afterCoach();
 });
 function coachEvent(kind) {
  if (coachCur && coachCur.until === kind) coachNext();
 }
 function afterCoach() {
  if (run && run.phase === "battle" && !busy) afterAction();
 }
 const TUT = {
  lobby: () => coach([ {
   id: "lobby",
   el: () => ov.querySelector("[data-adventure]"),
   text: "<b>ロビー</b>。「冒険へ」で地図を開く。",
   until: "click"
  } ]),
  quest: () => coach([ {
   id: "quest",
   el: () => ov.querySelector(".quests"),
   text: "<b>ミッション</b>。達成するとお金がもらえる。",
   until: "next"
  } ]),
  event: () => coach([ {
   id: "event",
   el: () => ov.querySelector(".node.event.ok"),
   text: "<b>？</b>は行くまで何があるか分からない。",
   until: "click"
  } ]),
  rival: () => coach([ {
   id: "rival",
   el: () => ov.querySelector(".node.rival"),
   text: "金の枠は<b>宿敵</b>。相棒と同じ種類の敵。<br>倒してカードを取ると、相棒が進化する。",
   until: "click"
  } ]),
  elite: () => coach([ {
   id: "elite",
   el: () => ov.querySelector(".node.elite.ok"),
   text: "赤い枠は<b>強敵</b>。お金が2倍。",
   until: "click"
  } ]),
  map: () => coach([ {
   id: "map",
   el: () => ov.querySelector(".node.ok"),
   text: "光っているマスへ進む。",
   until: "click"
  } ]),
  battle: () => coach([ {
   id: "b-intent",
   el: () => $("intent"),
   text: "敵が<b>次にすること</b>。<br>→ の先が狙われる。",
   until: "next"
  }, {
   id: "b-partner",
   el: () => $("field").querySelector(".unit.partner"),
   text: "<b>相棒</b>。毎ターン自動で攻撃する。",
   until: "next"
  }, {
   id: "b-mp",
   el: () => $("energy"),
   text: "<b>MP</b>。毎ターン1ずつ増える。",
   until: "next"
  }, {
   id: "b-hand",
   el: () => $("hand"),
   text: matchMedia("(hover: none)").matches ? "カードを<b>上へはじいて</b>使う。触ると説明。" : "カードを押して使う。",
   until: "play"
  }, {
   id: "b-end",
   el: () => $("end-turn"),
   text: "使い終えたら<b>ターン終了</b>。",
   until: "endturn"
  } ]),
  afterTurn: () => coach([ {
   id: "b-hp",
   el: () => $("player"),
   text: "<b>HP</b>は戦闘ごとに全回復する。",
   until: "next"
  } ]),
  reward: () => coach([ {
   id: "reward",
   el: () => ov.querySelector(".choices"),
   text: "デッキに入れる1枚をえらぶ。",
   until: "click"
  } ]),
  evolve: () => coach([ {
   id: "evolve",
   el: () => ov.querySelector(".evo-hint"),
   text: "同じモンスター2枚で<b>進化</b>する。",
   until: "click"
  } ]),
  partnerDown: () => coach([ {
   id: "p-down",
   el: () => $("field").querySelector(".unit.partner") || $("field").querySelector(".unit"),
   text: "相棒は<b>2ターン</b>で戻ってくる。",
   until: "next"
  } ]),
  handFull: () => coach([ {
   id: "hand-full",
   el: () => $("hand"),
   text: "手札は<b>" + PLAYER.handMax + "枚</b>まで。あふれたカードは捨て札へ行く。",
   until: "next"
  } ]),
  result: () => coach([ {
   id: "result",
   el: () => ov.querySelector(".gain"),
   text: "手に入れた<b>カード</b>と<b>お金</b>は持ち帰れる。",
   until: "click"
  } ]),
  shop: () => coach([ {
   id: "shop",
   el: () => ov.querySelector(".choices"),
   text: "<b>売店</b>。デッキもここで組みなおせる。",
   until: "click"
  } ]),
  train: () => coach([ {
   id: "train",
   el: () => ov.querySelector(".choices"),
   text: "<b>訓練所</b>。1枚えらんで鍛える。",
   until: "click"
  } ]),
  builder: () => coach([ {
   id: "builder",
   el: () => ov.querySelector(".col-zone"),
   text: "下のカードを押すとデッキに入る。",
   until: "click"
  } ]),
  pack: () => coach([ {
   id: "pack",
   el: () => ov.querySelector(".pack-sealed"),
   text: "押して開ける。",
   until: "click"
  } ])
 };
 document.addEventListener("click", () => {
  if (coachCur && coachCur.until === "click") setTimeout(() => coachNext(), 0);
 }, true);
 const RUN_KEY = "roguelike-run";
 function saveRun() {
  try {
   if (!run || run.phase === "won" || run.phase === "lost") localStorage.removeItem(RUN_KEY); else localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch (e) {}
 }
 function loadRun() {
  let r = null;
  try {
   r = JSON.parse(localStorage.getItem(RUN_KEY));
  } catch (e) {
   r = null;
  }
  const ok = r && CARDS[r.partner] && Array.isArray(r.map) && Array.isArray(r.deck) && Array.isArray(r.got) && [ "map", "battle", "reward", "shop", "train", "event" ].includes(r.phase) && (r.phase !== "event" || r.event) && (r.phase !== "battle" || r.battle && r.battle.field && r.battle.field.every(u => u.id != null));
  if (!ok && r) {
   try {
    localStorage.removeItem(RUN_KEY);
   } catch (e) {}
  }
  if (ok && r.gold > 0) {
   Rules.addGold(r.gold);
   r.gold = 0;
   try {
    localStorage.setItem(RUN_KEY, JSON.stringify(r));
   } catch (e) {}
  }
  return ok ? r : null;
 }
 function resume(r) {
  run = r;
  const go = {
   map: showLobby,
   shop: showShop,
   train: showTrain,
   reward: showReward,
   event: showEvent
  }[run.phase];
  if (go) return go();
  close();
  const m = $("monster");
  m.dataset.key = "";
  m.classList.remove("down", "gone");
  Sound.bgm(ENEMIES[run.battle.enemy.key].boss ? "boss" : "battle");
  render();
  afterAction();
 }
 let autoTimer = null;
 function afterAction() {
  saveRun();
  render();
  clearTimeout(autoTimer);
  if (run.phase === "reward") showReward(); else if (run.phase === "won") {
   const toResult = () => run.ending && !run._endShown ? (run._endShown = true, showEnding(() => showResult(true))) : showResult(true);
   if (run.capGet && !run._bossCap) {
    run._bossCap = true;
    run.captured = run.capGet.key;
    showCapture(toResult);
   } else toResult();
  } else if (run.phase === "lost") showResult(false); else if (run.phase === "battle" && pref.auto && !Rules.anyPlayable(run) && !coachActive()) {
   autoTimer = setTimeout(endTurn, 650 * speed);
  }
 }
 function open(html, cls, onclick) {
  game.dataset.phase = run ? run.phase : "title";
  ov.className = "overlay " + (cls || "");
  ov.innerHTML = html;
  ov.hidden = false;
  ov.onclick = onclick;
  ov.scrollTop = 0;
  tip.hidden = true;
  Cards.fit(ov);
  setTimeout(() => {
   if (ov.hidden) return;
   if (ov.querySelector("[data-adventure]")) {
    TUT.lobby();
    if (ov.querySelector(".quests")) TUT.quest();
   } else if (ov.querySelector(".map")) {
    TUT.map();
    if (ov.querySelector(".node.elite.ok")) TUT.elite();
    if (ov.querySelector(".node.event.ok")) TUT.event();
    if (ov.querySelector(".node.rival")) TUT.rival();
   } else if (ov.querySelector("[data-skip]")) {
    TUT.reward();
    if (ov.querySelector(".evo-hint")) TUT.evolve();
   } else if (ov.querySelector("[data-leave]")) TUT.shop(); else if (ov.querySelector("[data-skiptrain]")) TUT.train(); else if (ov.querySelector(".col-row")) TUT.builder(); else if (ov.querySelector(".pack-sealed")) TUT.pack(); else if (ov.querySelector(".result")) TUT.result();
  }, 400);
 }
 function close() {
  ov.hidden = true;
  ov.onclick = null;
 }
 const FIT_MIN = .4;
 let fitRaf = 0;
 function fitOverlay() {
  fitRaf = 0;
  if (ov.hidden) return;
  const kids = [ ...ov.children ].filter(k => !k.classList.contains("coach"));
  if (!kids.length) return;
  const cs = getComputedStyle(ov);
  const ah = ov.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const aw = ov.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const size = () => {
   let h = 0, w = 0;
   for (const k of kids) {
    const r = k.getBoundingClientRect();
    h += r.height;
    w = Math.max(w, r.width);
   }
   return [ h + Math.max(0, kids.length - 1) * (parseFloat(cs.rowGap) || 0), w ];
  };
  kids.forEach(k => {
   k.style.zoom = "";
  });
  let [h, w] = size();
  let z = Math.min(1, ah / h, aw / w);
  for (let i = 0; i < 3 && z < 1; i++) {
   kids.forEach(k => {
    k.style.zoom = z;
   });
   const [h2, w2] = size();
   if (h2 <= ah + 1 && w2 <= aw + 1) break;
   z = Math.max(FIT_MIN, z * Math.min(ah / h2, aw / w2) - .005);
  }
  if (z >= 1) kids.forEach(k => {
   k.style.zoom = "";
  });
  ov.classList.toggle("fitted", z < 1);
 }
 const refit = () => {
  if (!fitRaf) fitRaf = requestAnimationFrame(fitOverlay);
 };
 const fitRO = new ResizeObserver(refit);
 fitRO.observe(ov);
 ov.addEventListener("load", refit, true);
 if (document.fonts) document.fonts.ready.then(refit);
 new MutationObserver(() => {
  fitRO.disconnect();
  fitRO.observe(ov);
  [ ...ov.children ].forEach(k => fitRO.observe(k));
 }).observe(ov, {
  childList: true
 });
 new MutationObserver(refit).observe(ov, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: [ "class", "hidden" ]
 });
 window.addEventListener("resize", refit);
 function levelupHTML(list) {
  if (!list.length) return "";
  return '<div class="levelups">' + list.map(l => {
   const learned = CARDS[l.card].learn && CARDS[l.card].learn[l.lv];
   return '<span class="lvup"><b>' + CARDS[l.card].name + "</b> が LV" + l.lv + " に育った" + (learned ? "<em>わざをおぼえた</em>" : "") + "</span>";
  }).join("") + "</div>";
 }
 function soundHTML() {
  return '<div class="toggles sound"><button class="tgl" data-snd="bgm" aria-pressed="' + !pref.noBgm + '">BGM</button>' + '<button class="tgl" data-snd="sfx" aria-pressed="' + !pref.noSfx + '">効果音</button></div>';
 }
 function soundClick(e) {
  const b = e.target.closest("[data-snd]");
  if (!b) return false;
  Sound.unlock();
  if (b.dataset.snd === "bgm") pref.noBgm = !pref.noBgm; else pref.noSfx = !pref.noSfx;
  savePref();
  applySound();
  document.querySelectorAll('[data-snd="bgm"]').forEach(x => x.setAttribute("aria-pressed", !pref.noBgm));
  document.querySelectorAll('[data-snd="sfx"]').forEach(x => x.setAttribute("aria-pressed", !pref.noSfx));
  Sound.sfx("select");
  return true;
 }
 const applySound = () => Sound.setMute({
  bgm: !!pref.noBgm,
  sfx: !!pref.noSfx
 });
 applySound();
 document.addEventListener("click", e => {
  if (e.target.closest(".bottom [data-snd]")) soundClick(e);
 });
 function showGuide(back, page = 0) {
  const step = (t, d, cls) => '<div class="g-step ' + (cls || "") + '"><b>' + t + "</b><small>" + d + "</small></div>";
  const arrow = '<i class="g-arrow">→</i>';
  if (!run) setBg("dragon");
  const pages = [ [ "目的", '<p class="g-lead">カードで戦いながら<b>10階</b>まで進み、<b>ボス</b>を倒せばクリア。<br>自分の<b>HPが0</b>になると、その冒険は終わり。</p>' + '<p class="g-note">HPは戦闘のたびに全回復する。負けても、集めたカードと相棒の強さは次の冒険へ持ちこせる。</p>' ], [ "冒険の流れ", '<div class="g-flow">' + step("ロビー", "相棒と準備") + arrow + step("地図", "行き先をえらぶ") + arrow + step("戦闘・売店・訓練所・？", "マスの中身しだい。<br>ミッションを達成するとお金") + arrow + step("ほうび", "カードを1枚。<br>倒した敵のカードも手に入る") + arrow + step("ロビーへ", "これをくり返す") + '</div><p class="g-note">10階のボスを倒すか、HPが0になると冒険が終わる。</p>' ], [ "戦闘のきほん", '<div class="g-grid">' + "<div><b>MP</b><p>カード左上の数字ぶん使う。<br>最大MPはターンごとに1ずつ増える（10まで）。</p></div>" + '<div><b>カードの種類</b><p><span class="k-atk">攻撃</span> 敵にダメージ<br><span class="k-def">防御</span> 次の攻撃を防ぐ<br><span class="k-mag">魔法</span> 引く・弱らせるなど<br><span class="k-gd">召喚獣</span> 場に残って毎ターン攻撃</p></div>' + "<div><b>相棒</b><p>最初から場にいる召喚獣。<br>やられても2ターンで戻ってくる（1回の戦闘に1度）。</p></div>" + "<div><b>敵の予告</b><p>敵の上に「次にすること」が出る。<br>赤い照準が、狙われている相手。</p></div></div>" ], [ "冒険が終わると", '<div class="g-two">' + '<div class="keep"><b>残るもの</b><ul><li>カードのレベル</li><li>手に入れたカード（コレクションへ）</li><li>お金（冒険の終わりに、進んだ階ぶんのほうびも）</li><li>図鑑（相棒にえらべるモンスター）</li><li>相棒の進化</li></ul></div>' + '<div class="lost"><b>その冒険だけ</b><ul><li>冒険中に増えたデッキ</li><li>HP</li></ul></div></div>' ], [ "強くなる方法", '<div class="g-flow wrap">' + step("パック", "お金でカードを集める。<br>まれに<b>でんせつの召喚獣</b>") + step("デッキ編成", "集めたカードで15枚") + step("レベル", "カードは使うほど育つ") + step("図鑑", "倒した敵が相棒になる") + step("進化", "同じモンスター2枚で進化。<br>相棒の進化は次も使える") + "</div>" + '<div class="title-btns"><button class="ghost" data-hints>戦闘中のヒントをもう一度出す</button></div>' ] ];
  page = Math.max(0, Math.min(pages.length - 1, page));
  const tabs = pages.map((p, i) => '<button class="ghost g-tab' + (i === page ? " on" : "") + '" data-gpage="' + i + '">' + p[0] + "</button>").join("");
  open('<div class="dialog guide">' + '<h2>遊び方</h2><div class="g-tabs">' + tabs + "</div>" + '<section class="g-sec"><h3>' + pages[page][0] + "</h3>" + pages[page][1] + "</section>" + '<div class="title-btns">' + (page > 0 ? '<button class="ghost" data-gpage="' + (page - 1) + '">← 前へ</button>' : "") + (page < pages.length - 1 ? '<button class="end-turn" data-gpage="' + (page + 1) + '">次へ →</button>' : "") + '<button class="' + (page < pages.length - 1 ? "ghost" : "end-turn") + '" data-back>もどる</button></div>' + "</div>", "scroll", e => {
   if (e.target.closest("[data-hints]")) {
    pref.tut = {};
    savePref();
    Sound.sfx("select");
    e.target.closest("[data-hints]").textContent = "次の冒険でヒントが出る";
    return;
   }
   const g = e.target.closest("[data-gpage]");
   if (g) {
    Sound.sfx("select");
    return showGuide(back, +g.dataset.gpage);
   }
   if (e.target.closest("[data-back]")) {
    Sound.sfx("select");
    back();
   }
  });
 }
 function bossRowHTML() {
  const down = Rules.save().bossDown || {}, next = Rules.nextBoss();
  const all = BOSS_ORDER.concat(FINAL_BOSS, LAST_BOSS);
  const n = all.filter(k => down[k]).length;
  const cells = all.map(k => {
   const known = down[k] || k === next || BOSS_ORDER.includes(k);
   const hidden = k === FINAL_BOSS && !BOSS_ORDER.every(b => down[b]) || k === LAST_BOSS && !down[FINAL_BOSS];
   return '<div class="bs' + (down[k] ? " down" : "") + (k === next && !down[k] ? " next" : "") + (hidden ? " hidden" : "") + '">' + (hidden ? "<span>？</span>" : pic(k)) + "<small>" + (hidden ? "？？？" : known ? ENEMIES[k].name : "") + "</small>" + (down[k] ? "<i>討伐</i>" : k === next ? '<i class="bs-next">つぎ</i>' : "") + "</div>";
  }).join("");
  return '<div class="boss-row"><h3>ボス討伐 ' + n + " / " + all.length + '</h3><div class="bs-list">' + cells + "</div></div>";
 }
 function showDex(back, tab = "mon", sel, cpage = 0) {
  const sv = Rules.save(), seen = k => !!sv.seen[k];
  const nSeen = DEX_ORDER.filter(seen).length, nCard = DEX_CARDS.filter(ownCard).length;
  let body;
  if (tab === "mon") {
   sel = sel || DEX_ORDER.find(seen) || DEX_ORDER[0];
   const tiles = DEX_ORDER.map((k, i) => '<button class="dx-tile' + (k === sel ? " on" : "") + (ENEMIES[k].boss ? " boss" : "") + '" data-mon="' + k + '">' + dexPic(k, seen(k)) + "<small>" + String(i + 1).padStart(2, "0") + "</small><b>" + (seen(k) ? ENEMIES[k].name : "？？？") + "</b></button>").join("");
   const en = ENEMIES[sel], h = HOME[sel], ok = seen(sel), at = ATTRS[en.attr];
   const acts = list => '<div class="dx-acts">' + list.map(it => '<span class="intent">' + intentHTML(Object.assign({}, it, {
    times: it.times || 1
   })) + "</span>").join("") + "</div>";
   const detail = ok ? '<div class="dx-detail" style="--a:' + at.main + '">' + '<div class="dx-big">' + dexPic(sel, true) + "</div>" + '<div class="dx-head"><span class="attr-gem" style="--a:' + at.main + ";--ad:" + at.deep + '">' + at.name + "</span><b>" + en.name + "</b>" + (en.boss ? '<i class="dx-tag">' + (en.last ? "ほんとうの最後のボス" : en.final ? "最後のボス" : "ボス") + "</i>" : "") + "</div>" + '<dl class="dx-facts"><dt>住む場所</dt><dd>' + h.name + (en.boss ? "（10階）" : "（" + h.floor + "階から）") + "</dd>" + "<dt>体力</dt><dd>" + en.hp + "" + "</dd>" + "<dt>倒した数</dt><dd>" + (sv.kills[sel] || 0) + "</dd>" + "<dt>倒すと</dt><dd>" + (en.card ? CARDS[en.card].name + "のカード" + "" : "ふつうのカードから1枚") + "</dd></dl>" + (passiveHTML(en) ? '<h4>とくせい</h4><div class="dx-pass">' + passiveHTML(en).replace(/title="([^"]*)">([^<]*)</g, ">$2<small>$1</small><") + "</div>" : "") + "<h4>行動（上から順にくり返す）</h4>" + acts(en.intents) + (en.phase2 ? "<h4>HPが半分を切ると「" + en.phase2.name + "」</h4>" + acts(en.phase2.intents) : "") + "</div>" : '<div class="dx-detail unknown"><div class="dx-big">' + dexPic(sel, false) + '</div><div class="dx-head"><b>？？？</b></div>' + '<p class="dim">まだ出会っていない。' + (en.last ? ENEMIES[FINAL_BOSS].name + "を倒すと、10階に現れる。" : en.final ? "3体のボスをすべて倒すと、10階に現れる。" : en.boss ? "10階で待っている。" : h.name + "（" + h.floor + "階）あたりにいる。") + "</p></div>";
   body = '<div class="dx-mon"><div class="dx-grid">' + tiles + "</div>" + detail + "</div>";
  } else {
   const PER = 10, pages = Math.ceil(DEX_CARDS.length / PER);
   cpage = Math.max(0, Math.min(pages - 1, cpage));
   const cards = DEX_CARDS.slice(cpage * PER, cpage * PER + PER).map(k => {
    const own = ownCard(k), c = CARDS[k];
    if (!own && c.packOnly) return '<div class="dx-card legend-back"><span>でんせつ</span><small>パックからまれに</small></div>';
    return '<div class="dx-card' + (own ? "" : " unowned") + '">' + cardHTML(k) + (own ? "" : "<small>" + (c.unit ? "倒すと手に入る" : "パック・報酬") + "</small>") + "</div>";
   }).join("");
   body = '<div class="dx-cards">' + cards + "</div>" + '<div class="dx-pager"><button class="ghost" data-cpage="' + (cpage - 1) + '"' + (cpage ? "" : " disabled") + ">← 前へ</button><span>" + (cpage + 1) + " / " + pages + "</span>" + '<button class="ghost" data-cpage="' + (cpage + 1) + '"' + (cpage < pages - 1 ? "" : " disabled") + ">次へ →</button></div>";
  }
  open('<div class="dialog dex">' + '<div class="dx-top"><h2>図鑑</h2><div class="dx-tabs">' + '<button class="ghost' + (tab === "mon" ? " on" : "") + '" data-tab="mon">モンスター<b>' + nSeen + " / " + DEX_ORDER.length + "</b></button>" + '<button class="ghost' + (tab === "card" ? " on" : "") + '" data-tab="card">カード<b>' + nCard + " / " + DEX_CARDS.length + "</b></button>" + '</div><button class="end-turn" data-back>もどる</button></div>' + body + "</div>", "scroll lobby-ov dex-ov", e => {
   if (e.target.closest("[data-back]")) {
    Sound.sfx("select");
    return back();
   }
   const t = e.target.closest("[data-tab]");
   if (t) {
    Sound.sfx("select");
    return showDex(back, t.dataset.tab);
   }
   const m = e.target.closest("[data-mon]");
   if (m) {
    Sound.sfx("card");
    return showDex(back, "mon", m.dataset.mon);
   }
   const cp = e.target.closest("[data-cpage]");
   if (cp && !cp.disabled) {
    Sound.sfx("select");
    return showDex(back, "card", null, +cp.dataset.cpage);
   }
  });
 }
 function titleSides() {
  const sv = Rules.save(), seen = k => !!sv.seen[k];
  const nSeen = DEX_ORDER.filter(seen).length, nCard = DEX_CARDS.filter(ownCard).length;
  const pct = n => Math.round(n * 100);
  const left = '<aside class="lb-side ti-side">' + "<h3>図鑑</h3>" + '<div class="ti-prog"><span>モンスター</span><i><em style="width:' + pct(nSeen / DEX_ORDER.length) + '%"></em></i><b>' + nSeen + "/" + DEX_ORDER.length + "</b></div>" + '<div class="ti-prog"><span>カード</span><i><em style="width:' + pct(nCard / DEX_CARDS.length) + '%"></em></i><b>' + nCard + "/" + DEX_CARDS.length + "</b></div>" + '<div class="ti-mons">' + DEX_ORDER.map(k => '<button class="ti-mon" data-dexmon="' + k + '" title="' + (seen(k) ? ENEMIES[k].name : "？？？") + '">' + dexPic(k, seen(k)) + "</button>").join("") + "</div>" + '<button class="ghost" data-dex>図鑑をひらく</button>' + "</aside>";
  const legendOwn = LEGENDS.filter(ownCard);
  const right = '<aside class="lb-side ti-side">' + "<h3>これまでの記録</h3>" + '<div class="ti-stats"><span><small>冒険</small><b>' + (sv.runs || 0) + "</b></span><span><small>クリア</small><b>" + (sv.wins || 0) + "</b></span><span><small>いちばん深く</small><b>" + (sv.best || 0) + "<em>階</em></b></span><span><small>持ち金</small><b>" + (sv.gold || 0) + "<em>G</em></b></span></div>" + bossRowHTML() + "<h3>でんせつの召喚獣</h3>" + '<div class="ti-legends">' + LEGENDS.map(k => ownCard(k) ? '<span class="own">' + Art.html(CARDS[k].art) + "<small>" + CARDS[k].name + "</small></span>" : "<span><i>？</i><small>？？？</small></span>").join("") + "</div>" + '<p class="dim">' + legendOwn.length + " / " + LEGENDS.length + "</p>" + "</aside>";
  return [ left, right ];
 }
 function packBtn(attr) {
  const sv = Rules.save(), free = sv.freePacks > 0;
  const pay = free ? "無料" : PACK.price + '<i class="gu">G</i>';
  return '<button class="ghost pack-btn' + (free ? " free" : "") + '" ' + attr + (Rules.canPack() ? "" : " disabled") + ">" + (free ? "パックを開ける" : "パックを買う") + "<b>" + pay + "</b></button>";
 }
 function showTitle() {
  run = null;
  setBg("title");
  render();
  const sv = Rules.save();
  const tier = 0;
  const saved = loadRun();
  const partner = Rules.canPartner(pref.partner) ? pref.partner : sv.dex[0];
  const pc = CARDS[partner], ps = cardAt(partner, Rules.lv(partner)).unit;
  const pBase = pc.base || partner, evoOK = !!(sv.evo && sv.evo[pBase]);
  const tiles = MONSTERS.map(k => {
   const got = sv.dex.includes(k), ev = got && sv.evo && sv.evo[k];
   return '<button class="mon-tile' + (got ? "" : " locked") + (k === pBase ? " on" : "") + (ev ? " evo" : "") + '" data-partner="' + k + '"' + (got ? "" : " disabled") + ">" + Art.html(CARDS[ev && pref.partner === CARDS[k].evolve ? CARDS[k].evolve : k].art) + "<small>" + (got ? "LV" + Rules.lv(k) : "？") + "</small>" + (ev ? '<i class="evo-mark">進化</i>' : "") + (got && sv.clears && sv.clears[k] != null ? '<i class="clear-mark" title="この相棒でクリア">★</i>' : "") + "</button>";
  }).join("");
  const forms = evoOK ? '<div class="form-pick"><button class="ghost' + (partner === pBase ? " on" : "") + '" data-form="' + pBase + '">' + CARDS[pBase].name + "</button>" + '<button class="ghost' + (partner !== pBase ? " on" : "") + '" data-form="' + CARDS[pBase].evolve + '">進化　' + CARDS[CARDS[pBase].evolve].name + "</button></div>" : "";
  const [tLeft, tRight] = titleSides();
  open('<div class="lobby-wrap title-wrap">' + tLeft + '<div class="dialog title-screen">' + "<h2>Call of Beasts</h2>" + '<div class="partner-pick">' + '<div class="title-hero">' + Art.html(pc.art) + "</div>" + '<div class="partner-info"><small>相棒</small><b>' + pc.name + "</b><span>LV" + Rules.lv(partner) + "　攻" + ps.atk + " / 体" + ps.hp + "</span>" + "<p>" + cardText(partner, Rules.lv(partner)).split("\n").slice(1).join("<br>") + "</p>" + (learnText(partner, Rules.lv(partner)) ? '<p class="learn">' + learnText(partner, Rules.lv(partner)) + "</p>" : "") + forms + "</div>" + "</div>" + '<div class="mon-tiles">' + tiles + "</div>" + '<div class="narrow-only">' + bossRowHTML() + "</div>" + '<div class="title-btns">' + packBtn("data-pack") + (typeof Ads !== "undefined" && Ads.available() ? '<button class="ghost pack-btn ad-pack" data-adpack>広告を見てパック<b>のこり' + Ads.left() + "</b></button>" : "") + '<button class="ghost" data-builder>デッキを組む</button></div>' + (saved ? '<button class="end-turn big" data-resume>つづきから<small>' + Math.max(1, saved.floor) + "階　" + CARDS[saved.partner].name + "</small></button>" : "") + '<button class="' + (saved ? "ghost" : "end-turn big") + '" data-go>' + (saved ? "はじめから" : "冒険に出る") + "</button>" + soundHTML() + '<button class="ghost howto" data-howto>遊び方</button>' + '<button class="ghost howto narrow-only" data-dex>図鑑</button>' + '<button class="ghost howto" data-wipe>記録を消して最初から</button>' + "</div>" + tRight + "</div>", "scroll lobby-ov title-ov", e => {
   if (soundClick(e)) return;
   const wipe = e.target.closest("[data-wipe]");
   if (wipe) {
    if (!wipe.dataset.sure) {
     wipe.dataset.sure = 1;
     wipe.classList.add("warn");
     wipe.textContent = "もう一度押すと、記録がぜんぶ消える";
     Sound.sfx("deny");
     return;
    }
    [ "roguelike-save-v1", "roguelike-run", "roguelike-pref" ].forEach(k => {
     try {
      localStorage.removeItem(k);
     } catch (err) {}
    });
    return location.reload();
   }
   if (e.target.closest("[data-howto]")) {
    Sound.unlock();
    Sound.sfx("select");
    return showGuide(showTitle);
   }
   const dm = e.target.closest("[data-dexmon]");
   if (dm || e.target.closest("[data-dex]")) {
    Sound.unlock();
    Sound.sfx("select");
    return showDex(showTitle, "mon", dm && dm.dataset.dexmon);
   }
   const fm = e.target.closest("[data-form]");
   if (fm) {
    pref.partner = fm.dataset.form;
    savePref();
    Sound.sfx("select");
    return showTitle();
   }
   const pt = e.target.closest("[data-partner]:not([disabled])");
   if (pt) {
    pref.partner = pt.dataset.partner;
    savePref();
    Sound.unlock();
    Sound.sfx("select");
    return showTitle();
   }
   if (e.target.closest("[data-pack]")) {
    Sound.unlock();
    return showPack();
   }
   if (e.target.closest("[data-adpack]")) {
    Sound.unlock();
    return Ads.rewarded(ok => {
     if (ok) {
      Rules.giftPack();
      Sound.sfx("levelup");
     } else Sound.sfx("deny");
     showTitle();
    });
   }
   if (e.target.closest("[data-builder]")) {
    Sound.unlock();
    Sound.sfx("select");
    return showBuilder(showTitle);
   }
   if (e.target.closest("[data-resume]")) {
    Sound.unlock();
    Sound.sfx("select");
    return resume(saved);
   }
   const go = e.target.closest("[data-go]");
   if (!go) return;
   Sound.unlock();
   if (saved && !go.dataset.sure) {
    go.dataset.sure = 1;
    go.classList.add("warn");
    go.textContent = "もう一度押すと、途中の冒険は消える";
    Sound.sfx("deny");
    return;
   }
   Sound.sfx("select");
   if (saved) localStorage.removeItem(RUN_KEY);
   const sv2 = Rules.save();
   run = Rules.newRun(tier, partner, Rules.validDeck(sv2.deck) ? sv2.deck : Rules.autoDeck());
   showLobby();
  });
 }
 const NODE_LABEL = {
  battle: "",
  elite: "強敵",
  shop: "売店",
  train: "訓練所",
  event: "？"
 };
 function showMap() {
  saveRun();
  const can = Rules.reachable(run);
  const rows = run.map.length;
  const pos = n => ({
   x: (n.col + .5) / 3 * 100,
   y: (rows - n.floor + .5) / rows * 100
  });
  let lines = "";
  for (const fl of run.map) for (const n of fl) for (const id of n.next) {
   const m = run.map.flat().find(z => z.id === id), a = pos(n), b = pos(m);
   const on = (n.id === run.at || !run.at && false) && can.includes(id);
   lines += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" class="' + (on ? "on" : "") + '"/>';
  }
  const nodes = run.map.flat().map(n => {
   const p = pos(n), here = n.id === run.at, ok = can.includes(n.id);
   const past = n.floor <= run.floor && !here;
   const icon = n.type === "shop" ? '<span class="ic">店</span>' : n.type === "train" ? '<span class="ic">訓</span>' : n.type === "event" ? '<span class="ic ev">？</span>' : pic(n.enemy);
   const label = n.rival ? "宿敵" : NODE_LABEL[n.type] || (ENEMIES[n.enemy].boss ? "ボス" : n.floor + "階");
   return '<button class="node ' + n.type + (n.rival ? " rival" : "") + (ENEMIES[n.enemy] && ENEMIES[n.enemy].boss ? " boss" : "") + (here ? " here" : "") + (ok ? " ok" : "") + (past ? " past" : "") + '"' + ' data-id="' + n.id + '" style="left:' + p.x + "%;top:" + p.y + '%"' + (ok ? "" : ' tabindex="-1"') + ">" + icon + "<small>" + label + "</small></button>";
  }).join("");
  open('<div class="dialog map-screen">' + "<h2>地図</h2><p>お金 " + Rules.save().gold + '<i class="gu">G</i>　デッキ ' + run.deck.length + "枚</p>" + '<div class="legend"><span><i class="lg elite"></i>強敵</span><span><i class="lg shop"></i>売店</span><span><i class="lg train"></i>訓練所</span><span><i class="lg event"></i>？ できごと</span>' + (run.map.flat().some(n => n.rival && n.floor > run.floor) ? '<span><i class="lg rival"></i>宿敵</span>' : "") + "</div>" + '<div class="map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + "</svg>" + nodes + "</div>" + '<p class="map-info">光っているマスへ進む</p>' + '<div class="lobby-btns"><button class="ghost" data-deck>デッキを見る</button><button class="ghost" data-back>ロビーへもどる</button></div>' + "</div>", "scroll", e => {
   if (e.target.closest("[data-deck]")) return showDeck(showMap);
   if (e.target.closest("[data-back]")) return showLobby();
   const b = e.target.closest(".node.ok");
   if (b) goTo(b.dataset.id);
  });
  const info = ov.querySelector(".map-info");
  ov.querySelector(".map").addEventListener("pointerover", e => {
   const el = e.target.closest(".node");
   if (!el) return;
   const n = run.map.flat().find(z => z.id === el.dataset.id), en = ENEMIES[n.enemy];
   info.innerHTML = n.type === "shop" ? "<b>売店</b>" : n.type === "train" ? "<b>訓練所</b>" : n.type === "event" ? "<b>？</b>" : "<b>" + (n.rival ? n.type === "elite" ? "宿敵（強敵） " : "宿敵 " : n.type === "elite" ? "強敵 " : "") + en.name + "</b>" + (n.rival ? "　倒してカードを取ると、相棒が進化する" : "");
  });
  const here = ov.querySelector(".node.ok");
  if (here) setTimeout(() => here.scrollIntoView({
   block: "center"
  }), 50);
 }
 function goTo(id) {
  if (!Rules.choose(run, id)) return;
  intentHold = false;
  Sound.sfx("step");
  close();
  if (run.phase === "shop") showShop(); else if (run.phase === "train") showTrain(); else if (run.phase === "event") {
   Sound.sfx("mana");
   showEvent();
  } else {
   const m = $("monster");
   m.dataset.key = "";
   m.classList.remove("down", "gone");
   const en = ENEMIES[run.battle.enemy.key];
   Sound.bgm(en.boss ? "boss" : "battle");
   render();
   if (en.boss && !DEMO) bossIntro(en).then(afterAction); else {
    afterAction();
    setTimeout(TUT.battle, 900);
   }
  }
 }
 function showLobby() {
  saveRun();
  Sound.bgm(null);
  const p = run.partner, pc = CARDS[p], ps = cardAt(p, Rules.lv(p)).unit;
  if (shownBg !== "lobby") {
   setBg(null);
   $("bg").innerHTML = '<div class="lobby-scene"><img src="art/bg_lobby.png" alt="">' + '<i class="torch" style="left:32%;top:27%"></i><i class="torch" style="left:67.6%;top:27%"></i>' + "</div>";
   FX.embers($("bg"), "#ffb36a", 18);
   shownBg = "lobby";
  }
  const next = Rules.reachable(run).map(id => run.map.flat().find(n => n.id === id));
  const floorNo = next.length ? next[0].floor : run.floor;
  const pips = Array.from({
   length: MAP.floors
  }, (_, i) => '<i class="' + (i + 1 < floorNo ? "done" : i + 1 === floorNo ? "now" : "") + (i + 1 === MAP.floors ? " boss" : "") + '"></i>').join("");
  const boss = run.map[MAP.floors - 1][0];
  const nxHTML = next.map(n => {
   const en = ENEMIES[n.enemy];
   const icon = n.type === "shop" ? '<span class="ic">店</span>' : n.type === "train" ? '<span class="ic tr">訓</span>' : n.type === "event" ? '<span class="ic ev">？</span>' : pic(n.enemy);
   const name = n.type === "shop" ? "売店" : n.type === "train" ? "訓練所" : n.type === "event" ? "？" : (n.type === "elite" ? "強敵 " : "") + en.name;
   const sub = n.type === "shop" ? "カードを買う" : n.type === "train" ? "カードを鍛える" : n.type === "event" ? "何かが起きる" : ATTRS[en.attr].name + " ・ " + (en.boss ? "ボス" : n.floor + "階");
   return '<button class="nx ' + n.type + '" data-node="' + n.id + '"><span class="nx-pic">' + icon + "</span><span><b>" + name + "</b><small>" + sub + "</small></span></button>";
  }).join("");
  const left = '<aside class="lb-side">' + '<h3>次の行き先</h3><div class="nx-list">' + nxHTML + "</div>" + '<h3>10階で待つボス</h3><div class="boss-peek' + (ENEMIES[boss.enemy].final ? " final" : "") + '">' + pic(boss.enemy) + "<b>" + ENEMIES[boss.enemy].name + "</b>" + (ENEMIES[boss.enemy].final ? "<i>最後のボス</i>" : !(Rules.save().bossDown || {})[boss.enemy] ? "<i>はじめて挑む</i>" : "") + "</div>" + "</aside>";
  const kinds = [ "攻撃", "防御", "魔法", "召喚獣" ];
  const KC = {
   "攻撃": "k-atk",
   "防御": "k-def",
   "魔法": "k-mag",
   "召喚獣": "k-gd"
  };
  const kn = k => run.deck.filter(x => CARDS[x].kind === k).length;
  const bars = kinds.map(k => '<div class="kb ' + KC[k] + '"><span>' + k + '</span><i style="width:' + kn(k) / Math.max(1, run.deck.length) * 100 + '%"></i><b>' + kn(k) + "</b></div>").join("");
  const got = run.got.slice(-4).reverse();
  const right = '<aside class="lb-side">' + "<h3>デッキ " + run.deck.length + '枚</h3><div class="kbars">' + bars + "</div>" + "<h3>この冒険で手に入れた</h3>" + (got.length ? '<div class="got-row">' + got.map(k => cardHTML(k)).join("") + "</div>" : '<p class="dim">まだない。敵を倒すと手に入る</p>') + '<button class="ghost" data-deck>デッキを見る</button>' + "<h3>コレクション</h3>" + packBtn("data-lpack") + '<button class="ghost howto" data-guide>遊び方</button>' + "</aside>";
  open('<div class="lobby-wrap">' + left + '<div class="dialog lobby">' + '<div class="lobby-head"><small>' + floorNo + "階 / " + MAP.floors + "</small><b>" + (next.length === 1 && next[0].type === "battle" && ENEMIES[next[0].enemy].boss ? placeOf(floorNo, next[0].enemy).name : PLACES[floorNo - 1]) + '</b><div class="pips">' + pips + "</div></div>" + questHTML() + '<div class="lobby-stand"><div class="lobby-hero">' + Art.html(pc.art) + '</div><img class="stand-ring" src="art/rune_ring.png" alt=""></div>' + '<div class="lp-info"><small>相棒</small><b>' + pc.name + "</b><span>LV" + Rules.lv(p) + "　攻" + ps.atk + " / 体" + ps.hp + "</span></div>" + '<div class="lobby-stats"><span><small>手に入れた</small><b>' + run.got.length + "</b></span><span><small>お金</small><b>" + Rules.save().gold + "</b></span><span><small>デッキ</small><b>" + run.deck.length + "</b></span></div>" + '<button class="end-turn big" data-adventure>冒険へ</button>' + '<div class="narrow-only lobby-mini"><button class="ghost" data-deck>デッキを見る</button><button class="ghost" data-lpack' + (Rules.canPack() ? "" : " disabled") + '>パック</button><button class="ghost" data-guide>遊び方</button></div>' + "</div>" + right + "</div>", "scroll lobby-ov", e => {
   if (e.target.closest("[data-deck]")) return showDeck(showLobby);
   if (e.target.closest("[data-lpack]")) return showPack(showLobby);
   if (e.target.closest("[data-guide]")) {
    Sound.sfx("select");
    return showGuide(showLobby);
   }
   const nx = e.target.closest("[data-node]");
   if (nx) return goTo(nx.dataset.node);
   if (e.target.closest("[data-adventure]")) {
    Sound.sfx("select");
    return showMap();
   }
  });
 }
 function deckCounts() {
  const counts = {};
  run.deck.forEach(k => counts[k] = (counts[k] || 0) + 1);
  return counts;
 }
 function showPack(back = showTitle, inShop) {
  const cards = Rules.openPack();
  if (!cards) return back();
  const rar = c => CARDS[c.key].rarity;
  const best = Math.max(...cards.map(rar));
  const badge = c => c.isNew ? '<i class="new">NEW</i>' : c.exp ? '<i class="new dup">' + (c.lvUp ? "Lv" + c.lvUp + "に" : "経験値+" + c.exp) + "</i>" : "";
  const slots = cards.map((c, i) => '<div class="pack-slot r' + rar(c) + '" data-i="' + i + '" style="--i:' + i + '">' + '<div class="pack-back"></div><div class="pack-front r' + rar(c) + '">' + cardHTML(c.key) + badge(c) + "</div></div>").join("");
  const gold = () => Rules.save().gold;
  open('<div class="dialog pack-open"><h2>パック</h2><p class="pack-hint">押してあける</p>' + '<div class="pack-stage">' + '<div class="pack-sealed b' + best + '"><b>Call of Beasts</b><small>' + PACK.size + 'まい入り</small><i class="foil"></i></div>' + '<div class="pack-row">' + slots + "</div>" + "</div>" + '<div class="title-btns pack-btns"><button class="ghost" data-flipall>ぜんぶめくる</button>' + '<button class="ghost" data-again>もう1パック<b>' + (Rules.save().freePacks > 0 ? "無料" : PACK.price + '<i class="gu">G</i>') + "</b></button>" + '<button class="end-turn" data-back>もどる</button></div><p class="pack-purse">持ち金 <b>' + gold() + '<i class="gu">G</i></b></p></div>', "scroll pack-ov", e => {
   if (e.target.closest("[data-back]")) return back();
   if (e.target.closest("[data-again]")) return Rules.canPack() ? showPack(back, inShop) : Sound.sfx("deny");
   if (stage === "sealed" && e.target.closest(".pack-sealed")) return tearOpen();
   if (stage !== "dealt") return;
   const slot = e.target.closest(".pack-slot");
   if (slot) return flip(slot);
   if (e.target.closest("[data-flipall]")) flipAll();
  });
  const box = ov.querySelector(".pack-open"), sealed = ov.querySelector(".pack-sealed");
  let stage = "sealed";
  box.classList.add("stage-sealed");
  let busyN = 0;
  const busy = ms => {
   busyN++;
   box.classList.add("busy");
   setTimeout(() => {
    if (--busyN <= 0) {
     busyN = 0;
     box.classList.remove("busy");
    }
   }, ms);
  };
  Sound.sfx("summon");
  function tearOpen() {
   stage = "opening";
   busy((best >= 4 ? 1500 : 900) + 120 + PACK.size * 110 + 700);
   sealed.classList.add("shake");
   Sound.sfx("crack");
   setTimeout(() => Sound.sfx("crack"), 380);
   setTimeout(() => {
    const r = sealed.getBoundingClientRect();
    Sound.sfx(best >= 3 ? "roar" : "shatter");
    if (best >= 4) {
     PXFX.cast("light", r, 16);
     FX.burst(game, r.left + r.width / 2, r.top + r.height / 2, "light", 60, 2);
     flash("#ffe9a0");
    } else FX.burst(game, r.left + r.width / 2, r.top + r.height / 2, "light", 14, 1);
    box.classList.replace("stage-sealed", "stage-dealt");
    ov.querySelector(".pack-hint").textContent = "押すか、横になぞってめくる";
    cards.forEach((c, i) => setTimeout(() => Sound.sfx("card"), 120 + i * 110));
    setTimeout(() => {
     stage = "dealt";
    }, 120 + PACK.size * 110 + 300);
   }, best >= 4 ? 1500 : 900);
   if (best >= 4) {
    sealed.classList.add("legend");
    setTimeout(() => {
     Sound.sfx("mana");
     flash("#fff4c0");
    }, 900);
   }
  }
  function flip(el, quick) {
   if (el.classList.contains("open") || el.classList.contains("charge")) return;
   const r = rar(cards[+el.dataset.i]);
   if (r >= 3) busy(r >= 4 ? (quick ? 750 : 1100) + 2700 : (quick ? 260 : 450) + 700);
   const go = () => {
    el.classList.remove("charge");
    el.classList.add("open");
    Sound.sfx(r >= 3 ? "levelup" : r >= 2 ? "combo" : "card");
    const b = el.getBoundingClientRect();
    if (r >= 4) return legendReveal(el, b);
    if (r >= 2) PXFX.shine(b, r >= 3 ? "#ffb0d8" : "#bfe4ff");
    if (ov.querySelectorAll(".pack-slot:not(.open)").length === 0) {
     box.classList.add("all-open");
     ov.querySelector(".pack-hint").textContent = "コレクションに入った";
    }
   };
   if (r >= 4) {
    el.classList.add("charge");
    Sound.sfx("mana");
    setTimeout(() => Sound.sfx("crack"), 350);
    setTimeout(go, quick ? 750 : 1100);
   } else if (r >= 3) {
    el.classList.add("charge");
    Sound.sfx("mana");
    setTimeout(go, quick ? 260 : 450);
   } else go();
  }
  function legendReveal(el, b) {
   const key = cards[+el.dataset.i].key;
   flash("#ffffff");
   Sound.sfx("roar");
   setTimeout(() => Sound.sfx("victory"), 250);
   PXFX.cast("light", b, 18);
   PXFX.shine(b, "#fff4a0");
   FX.burst(game, b.left + b.width / 2, b.top + b.height / 2, "light", 50, 1.8);
   FX.burst(game, b.left + b.width / 2, b.top + b.height / 2, "fire", 30, 1.4);
   el.classList.add("legend-hit");
   const ban = document.createElement("div");
   ban.className = "legend-banner";
   ban.innerHTML = "<small>でんせつの召喚獣</small><b>" + CARDS[key].name + "</b>";
   ov.querySelector(".pack-stage").appendChild(ban);
   setTimeout(() => ban.remove(), 2600);
   if (ov.querySelectorAll(".pack-slot:not(.open)").length === 0) {
    box.classList.add("all-open");
    ov.querySelector(".pack-hint").textContent = "コレクションに入った";
   }
  }
  function flipAll() {
   [ ...ov.querySelectorAll(".pack-slot:not(.open)") ].forEach((el, i) => setTimeout(() => flip(el, true), i * 90));
  }
  const row = ov.querySelector(".pack-row");
  row.addEventListener("pointerdown", e => {
   if (stage !== "dealt") return;
   const sx = e.clientX;
   let all = false;
   const move = ev => {
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const slot = el && el.closest(".pack-slot");
    if (slot) flip(slot, true);
    if (!all && Math.abs(ev.clientX - sx) > row.clientWidth * .35) {
     all = true;
     flipAll();
    }
   };
   const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
   };
   window.addEventListener("pointermove", move);
   window.addEventListener("pointerup", up);
   window.addEventListener("pointercancel", up);
  });
 }
 function flash(color) {
  const f = document.createElement("div");
  f.className = "screen-flash";
  f.style.setProperty("--c", color);
  game.appendChild(f);
  setTimeout(() => f.remove(), 600);
 }
 let building = null, bFilter = "all", bCost = -1, bLast = null, bNoClick = false, bRun = false;
 const KIND_ORDER = {
  "攻撃": 0,
  "防御": 1,
  "魔法": 2,
  "召喚獣": 3
 };
 const KIND_CLS = {
  "攻撃": "k-atk",
  "防御": "k-def",
  "魔法": "k-mag",
  "召喚獣": "k-gd"
 };
 let bBack = showTitle;
 function showBuilder(back, runMode) {
  if (back) {
   bBack = back;
   bRun = !!runMode && !!run;
  }
  const sv = Rules.save();
  const pool = bRun ? Rules.runPool(run) : null;
  const col = bRun ? pool : sv.collection;
  const capOf = k => bRun ? pool[k] || 0 : Math.min(col[k] || 0, DECK_MAX_COPIES);
  if (!building) building = bRun ? run.deck.slice() : Rules.validDeck(sv.deck) ? sv.deck.slice() : Rules.autoDeck();
  const minN = DECK_SIZE, maxN = bRun ? Rules.RUN_DECK_MAX : DECK_SIZE;
  const used = {};
  building.forEach(k => used[k] = (used[k] || 0) + 1);
  const sortK = (a, b) => CARDS[a].cost - CARDS[b].cost || KIND_ORDER[CARDS[a].kind] - KIND_ORDER[CARDS[b].kind];
  const n = building.length, full = n >= maxN, ready = n >= minN && n <= maxN;
  const costOf = k => Math.min(6, CARDS[k].cost);
  const per = [ 0, 1, 2, 3, 4, 5, 6 ].map(c => building.filter(x => costOf(x) === c).length);
  const top = Math.max(4, ...per);
  const curve = per.map((m, c) => "<div><em>" + (m || "") + '</em><i style="height:' + m / top * 100 + '%"></i><span class="gem">' + (c === 6 ? "6+" : c) + "</span></div>").join("");
  const kinds = Object.keys(KIND_ORDER).map(k => '<span class="' + KIND_CLS[k] + '">' + k + " <b>" + building.filter(x => CARDS[x].kind === k).length + "</b></span>").join("");
  const deckHTML = Object.keys(used).sort(sortK).map(k => '<div class="dk' + (used[k] > 1 ? " many" : "") + (k === bLast ? " just-in" : "") + '" data-out="' + k + '">' + cardHTML(k) + (used[k] > 1 ? '<i class="cnt">×' + used[k] + "</i>" : "") + "</div>").join("") + (n >= minN ? "" : '<div class="dk-empty"><b>あと ' + (minN - n) + "枚</b><small>下のカードを<br>上へスワイプ</small></div>");
  const costBtns = [ -1, 0, 1, 2, 3, 4, 5, 6 ].map(c => '<button class="cgem' + (bCost === c ? " on" : "") + '" data-cost="' + c + '">' + (c < 0 ? "全" : c === 6 ? "6+" : c) + "</button>").join("");
  const tabs = [ [ "all", "すべて" ] ].concat(Object.keys(KIND_ORDER).map(k => [ k, k ])).map(([v, t]) => '<button class="tab' + (bFilter === v ? " on" : "") + '" data-filter="' + v + '">' + t + "</button>").join("");
  const owned = Object.keys(col).filter(k => col[k] > 0 && CARDS[k] && !CARDS[k].junk && (bFilter === "all" || CARDS[k].kind === bFilter) && (bCost < 0 || costOf(k) === bCost)).sort(sortK);
  const colHTML = owned.map(k => {
   const cap = capOf(k), u = used[k] || 0;
   const pips = Array.from({
    length: cap
   }, (_, i) => '<i class="' + (i < u ? "on" : "") + '"></i>').join("");
   return '<div class="ck' + (u >= cap ? " max" : "") + '" data-in="' + k + '">' + cardHTML(k, u >= cap ? "off" : "") + '<div class="pips">' + pips + "</div></div>";
  }).join("") || '<p class="dim">あてはまるカードを持っていない</p>';
  const keepX = [ ...ov.querySelectorAll(".b-row") ].map(r => r.scrollLeft);
  open('<div class="builder sw">' + '<header class="b-top"><button class="ghost" data-cancel>もどる</button><h2>デッキ編成' + (bRun ? '<small class="b-note">この冒険のデッキ（' + minN + "〜" + maxN + "枚）。この冒険で手に入れたカードも使える</small>" : run ? '<small class="b-note">次の冒険から使うデッキ</small>' : "") + "</h2>" + '<div class="b-count' + (ready ? " ok" : "") + '"><b>' + n + "</b><span>/ " + (bRun ? minN + "〜" + maxN : DECK_SIZE) + "</span></div>" + '<div class="curve">' + curve + '</div><div class="kind-legend">' + kinds + "</div>" + '<div class="b-btns">' + (bRun ? "" : '<button class="ghost" data-auto>おまかせ</button>') + '<button class="ghost" data-clear>ぜんぶ外す</button>' + '<button class="end-turn" data-done' + (ready ? "" : " disabled") + ">" + (ready ? "決定" : "あと " + (minN - n) + "枚") + "</button></div>" + "</header>" + '<section class="zone deck-zone"><h3>デッキ<small>下へスワイプで外す</small></h3><div class="b-row deck-row">' + deckHTML + "</div></section>" + '<div class="filters"><div class="costs">' + costBtns + '</div><div class="tabs">' + tabs + "</div></div>" + '<section class="zone col-zone"><h3>所持カード<small>' + (full ? "デッキがいっぱい" : "上へスワイプで入れる") + '</small></h3><div class="b-row col-row">' + colHTML + "</div></section>" + "</div>", "full", e => {
   if (bNoClick) {
    bNoClick = false;
    return;
   }
   const f = e.target.closest("[data-filter]");
   if (f) {
    bFilter = f.dataset.filter;
    Sound.sfx("select");
    return showBuilder();
   }
   const cb = e.target.closest("[data-cost]");
   if (cb) {
    bCost = +cb.dataset.cost;
    Sound.sfx("select");
    return showBuilder();
   }
   const out = e.target.closest("[data-out]");
   if (out) return removeCard(out.dataset.out);
   const inn = e.target.closest("[data-in]");
   if (inn) return addCard(inn.dataset.in, inn.querySelector(".card").getBoundingClientRect());
   if (e.target.closest("[data-auto]")) {
    building = Rules.autoDeck();
    bLast = null;
    Sound.sfx("select");
    return showBuilder();
   }
   if (e.target.closest("[data-clear]")) {
    building = building.filter(k => CARDS[k].junk);
    bLast = null;
    return showBuilder();
   }
   if (e.target.closest("[data-cancel]")) {
    building = null;
    return bBack();
   }
   if (e.target.closest("[data-done]")) {
    if (bRun ? Rules.setRunDeck(run, building) : Rules.setDeck(building)) {
     building = null;
     Sound.sfx("levelup");
     if (bRun) {
      saveRun();
      afterEvolve(bBack);
     } else bBack();
    } else Sound.sfx("deny");
   }
  });
  ov.querySelectorAll(".b-row").forEach((r, i) => {
   r.scrollLeft = keepX[i] || 0;
   r.addEventListener("wheel", e => {
    if (r.scrollWidth <= r.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    r.scrollLeft += e.deltaY;
    e.preventDefault();
   }, {
    passive: false
   });
  });
  const added = ov.querySelector(".deck-row .just-in");
  if (added) added.scrollIntoView({
   block: "nearest",
   inline: "nearest"
  });
  bindSwipe(ov.querySelector(".col-row"), "[data-in]", -1, ov.querySelector(".deck-zone"), (el, r) => addCard(el.dataset.in, r));
  bindSwipe(ov.querySelector(".deck-row"), "[data-out]", 1, ov.querySelector(".col-zone"), el => removeCard(el.dataset.out));
  function addCard(k, from) {
   if (full || (used[k] || 0) >= capOf(k)) {
    Sound.sfx("deny");
    return;
   }
   building.push(k);
   bLast = k;
   Sound.sfx("card");
   showBuilder();
   const to = ov.querySelector(".deck-row .just-in");
   if (to && from) flyTo(from, to.getBoundingClientRect(), CARDS[k].art);
  }
  function removeCard(k) {
   if (CARDS[k].junk) {
    Sound.sfx("deny");
    return;
   }
   building.splice(building.indexOf(k), 1);
   bLast = null;
   Sound.sfx("select");
   showBuilder();
  }
 }
 function bindSwipe(row, sel, dir, zone, commit) {
  if (!row) return;
  row.addEventListener("pointerdown", e => {
   const item = e.target.closest(sel);
   if (!item || e.button > 0) return;
   const card = item.querySelector(".card"), r = card.getBoundingClientRect();
   const sx = e.clientX, sy = e.clientY;
   let mode = null, ghost = null;
   const need = Math.min(90, r.height * .45);
   const move = ev => {
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    if (!mode) {
     if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
      mode = "drag";
      if (typeof press === "number") clearTimeout(press);
      tip.hidden = true;
      ghost = card.cloneNode(true);
      ghost.classList.add("drag-ghost");
      ghost.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      document.body.appendChild(ghost);
      item.classList.add("dragging");
      zone.classList.add("drop");
     } else if (Math.abs(dx) > 8) {
      mode = "scroll";
      return end();
     } else return;
    }
    ev.preventDefault();
    ghost.style.transform = "translate(" + dx + "px," + dy + "px) rotate(" + dx * .04 + "deg)";
    const ok = dir * dy > need;
    ghost.classList.toggle("ready", ok);
    zone.classList.toggle("ready", ok);
   };
   const end = ev => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    if (mode !== "drag") return;
    bNoClick = true;
    setTimeout(() => {
     bNoClick = false;
    }, 60);
    const dy = ev ? ev.clientY - sy : 0;
    const g = ghost.getBoundingClientRect();
    ghost.remove();
    item.classList.remove("dragging");
    zone.classList.remove("drop", "ready");
    if (dir * dy > need) commit(item, g);
   };
   window.addEventListener("pointermove", move, {
    passive: false
   });
   window.addEventListener("pointerup", end);
   window.addEventListener("pointercancel", end);
  });
 }
 function flyTo(a, b, art) {
  const el = document.createElement("div");
  el.className = "fly-card";
  el.style.cssText = "left:" + a.left + "px;top:" + a.top + "px;width:" + a.width + "px;height:" + a.height + "px;background-image:url(art/" + art + ".png)";
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
   el.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(" + Math.min(1, b.width / a.width) + ")";
   el.style.opacity = ".3";
  }));
  setTimeout(() => el.remove(), 360);
 }
 function keepScroll(fn) {
  const y = ov.scrollTop;
  fn();
  ov.scrollTop = y;
 }
 function showDeck(back) {
  const counts = deckCounts();
  open('<div class="dialog"><h2>デッキ</h2><p>' + run.deck.length + "枚</p>" + '<div class="choices small">' + Object.keys(counts).map(k => '<div class="stack">' + cardHTML(k) + "<b>×" + counts[k] + "</b></div>").join("") + "</div>" + '<button class="ghost" data-back>もどる</button></div>', "scroll", e => {
   if (e.target.closest("[data-back]")) back();
  });
 }
 function showCapture(done) {
  const key = run.captured, c = CARDS[key];
  open('<div class="dialog capture"><div class="cap-stage">' + '<div class="cap-pic">' + Art.html(c.art) + "</div>" + '<div class="cap-card">' + cardHTML(key) + "</div>" + '<div class="cap-flash"></div>' + "</div>" + '<h2 class="cap-title"><small>CARD GET</small>' + c.name + "</h2>" + (run.newDex === key ? '<p class="cap-new">図鑑に登録。次の冒険から相棒にできる</p>' : "") + (run.capGet ? '<p class="cap-new">' + (run.capGet.exp ? "もう3枚持っているので、" + c.name + "の経験値 +" + run.capGet.exp : (run.capGet.isNew ? "はじめてのカード！ " : "") + "コレクションに入った") + "</p>" : "") + "</div>", "", () => {
   clearTimeout(t);
   done();
  });
  Sound.sfx("summon");
  setTimeout(() => Sound.sfx("levelup"), 900);
  const t = setTimeout(done, 2600);
 }
 function showReward() {
  if (run.captured && !run._capShown) {
   run._capShown = true;
   return showCapture(showReward);
  }
  run._capShown = false;
  if (run.levelups.length) setTimeout(() => Sound.sfx("levelup"), 300);
  const elite = run.battle && run.battle.elite;
  open('<div class="dialog"><h2>' + (elite ? "強敵 撃破！" : "しょうり！") + "</h2>" + '<p class="gain">お金 +' + run.gain + '<i class="gu">G</i>（所持 ' + Rules.save().gold + '<i class="gu">G</i>）</p>' + questNewsHTML() + levelupHTML(run.levelups) + "<p>デッキに入れるカードを1枚えらぶ</p>" + '<div class="choices">' + run.rewards.map(k => k === run.captured ? '<div class="stack got">' + offerHTML(k) + "<b>GET</b></div>" : offerHTML(k)).join("") + "</div>" + '<button class="ghost" data-skip>えらばない</button></div>', "scroll", e => {
   const c = e.target.closest(".card");
   if (!c && !e.target.closest("[data-skip]")) return;
   Sound.sfx(c ? "coin" : "select");
   Rules.pickReward(run, c ? c.dataset.key : null);
   afterEvolve(showLobby);
  });
 }
 function afterEvolve(next) {
  const list = run.evolved.slice();
  run.evolved = [];
  const step = () => {
   const ev = list.shift();
   if (!ev) return next();
   if (ev.partner && !ev._cut) {
    ev._cut = true;
    list.unshift(ev);
    return cutIn(evoCut(ev.from, ev.to, speed, run && run.node ? placeOf(run.node.floor, Object.keys(ENEMIES).find(k => ENEMIES[k].card === ev.from) || "").bg : null)).then(step);
   }
   const from = cardHTML(ev.from), to = CARDS[ev.to];
   open('<div class="dialog evolve"><div class="evo-stage">' + '<div class="evo-a">' + from + '</div><div class="evo-b">' + from + "</div>" + '<div class="evo-to">' + cardHTML(ev.to) + '</div><div class="cap-flash"></div></div>' + '<h2 class="cap-title"><small>' + (ev.partner ? "相棒が進化" : "進化") + "</small>" + to.name + "</h2></div>", "", () => {
    clearTimeout(t);
    step();
   });
   Sound.sfx("summon");
   setTimeout(() => Sound.sfx("roar"), 700);
   setTimeout(() => Sound.sfx("levelup"), 1300);
   const t = setTimeout(step, 3e3);
  };
  step();
 }
 function showShop() {
  saveRun();
  setBg("wizard");
  render();
  const items = run.shop.map((it, i) => '<div class="ware' + (it.sold ? " sold" : "") + (it.hot ? " hot" : "") + (it.sale ? " sale" : "") + '">' + (it.hot ? '<i class="ware-tag hot">目玉</i>' : "") + (it.sale && !it.sold ? '<i class="ware-tag sale">' + Math.round(ECONOMY.sale * 100) + "%引き</i>" : "") + offerHTML(it.key, it.sold || Rules.save().gold < it.price ? "off" : "") + '<button class="price" data-buy="' + i + '"' + (it.sold || Rules.save().gold < it.price ? " disabled" : "") + ">" + (it.sold ? "売り切れ" : it.price + '<i class="gu">G</i>') + "</button></div>").join("");
  const canRemove = !run.removed && Rules.save().gold >= ECONOMY.removePrice && run.deck.length > 5;
  open('<div class="dialog"><h2>売店</h2><p>お金 ' + Rules.save().gold + '<i class="gu">G</i></p>' + '<div class="choices">' + items + "</div>" + '<div class="title-btns shop-btns">' + '<button class="ghost" data-shoptrain' + (!run.trained && Rules.save().gold >= ECONOMY.trainPrice ? "" : " disabled") + ">" + CARDS[run.partner].name + "を鍛える<b>" + (run.trained ? "済み" : ECONOMY.trainPrice + '<i class="gu">G</i>') + "</b></button>" + '<button class="ghost" data-remove' + (canRemove ? "" : " disabled") + ">カードを1枚すてる<b>" + (run.removed ? "済み" : ECONOMY.removePrice + '<i class="gu">G</i>') + "</b></button>" + packBtn("data-spack") + '<button class="ghost" data-sbuild>デッキを組みなおす</button></div>' + '<button class="ghost" data-leave>店を出る</button></div>', "scroll", e => {
   if (e.target.closest("[data-spack]")) return showPack(showShop, true);
   if (e.target.closest("[data-sbuild]")) {
    Sound.sfx("select");
    building = null;
    return showBuilder(showShop, true);
   }
   if (e.target.closest("[data-leave]")) {
    Rules.leaveShop(run);
    return showMap();
   }
   if (e.target.closest("[data-remove]") && canRemove) return showRemove();
   if (e.target.closest("[data-shoptrain]")) {
    const ups = Rules.shopTrain(run);
    if (!ups) return Sound.sfx("deny");
    Sound.sfx(ups.length ? "levelup" : "coin");
    return showShop();
   }
   const b = e.target.closest("[data-buy]") || e.target.closest(".ware");
   if (!b) return;
   const i = b.dataset.buy != null ? +b.dataset.buy : [ ...ov.querySelectorAll(".ware") ].indexOf(b);
   if (Rules.buy(run, i)) {
    Sound.sfx("coin");
    afterEvolve(showShop);
   } else Sound.sfx("deny");
  });
 }
 function showRemove() {
  const counts = deckCounts();
  open('<div class="dialog"><h2>すてるカード</h2><p>デッキから1枚なくす（' + ECONOMY.removePrice + '<i class="gu">G</i>）</p>' + '<div class="choices small">' + Object.keys(counts).map(k => '<div class="stack">' + cardHTML(k) + "<b>×" + counts[k] + "</b></div>").join("") + "</div>" + '<button class="ghost" data-back>やめる</button></div>', "scroll", e => {
   if (e.target.closest("[data-back]")) return showShop();
   const c = e.target.closest(".card");
   if (!c) return;
   Rules.removeCard(run, run.deck.indexOf(c.dataset.key));
   showShop();
  });
 }
 const EVENT_TEXT = {
  chest: [ "宝箱", "道のわきに、古い宝箱が落ちている。", "#e8c070" ],
  merchant: [ "あやしい商人", "「めずらしいカードがあるよ。お代は " + 35 + "G だ」", "#c080ff" ],
  spring: [ "ふしぎな泉", "光る泉がわいている。のぞきこむと、力がわいてくる。", "#80d8ff" ],
  altar: [ "いにしえの祭壇", "祭壇に、強い力をもつカードが置いてある。…取ると、のろわれそうだ。", "#ff6a8a" ],
  stray: [ "まいごのモンスター", "モンスターが1体、こちらを見ている。仲間になりたそうだ。", "#8af0a0" ]
 };
 function showEvent() {
  saveRun();
  setBg("area" + Math.min(PLACES.length - 1, Math.max(0, run.floor - 1)));
  const ev = run.event, [title, text, col] = EVENT_TEXT[ev.kind];
  const btn = (choice, label, sub, dis) => '<button class="ghost ev-opt" data-ev="' + choice + '"' + (dis ? " disabled" : "") + ">" + label + (sub ? "<small>" + sub + "</small>" : "") + "</button>";
  let body = "";
  if (ev.kind === "chest") body = '<p class="ev-q">中にカードが3枚。1枚えらぶか、お金を取る</p><div class="choices">' + ev.cards.map(k => cardHTML(k)).join("") + "</div>" + '<div class="ev-opts">' + btn("gold", "お金を取る", "+30G") + "</div>";
  if (ev.kind === "merchant") body = '<div class="choices">' + cardHTML(ev.card) + '</div><div class="ev-opts">' + btn("buy", "買う", ev.price + "G（所持 " + Rules.save().gold + "G）", Rules.save().gold < ev.price) + btn("leave", "買わない") + "</div>";
  if (ev.kind === "spring") body = '<div class="ev-opts">' + btn("hp", "泉の水を飲む", "この冒険のあいだ 最大HP +5") + btn("exp", "相棒に飲ませる", CARDS[run.partner].name + "の経験値 +" + GROWTH.trainExp * 2) + "</div>";
  if (ev.kind === "altar") body = '<div class="choices">' + cardHTML(ev.card) + cardHTML("curse") + '</div><div class="ev-opts">' + btn("take", "取る", "カードと、のろい1枚がデッキに入る") + btn("leave", "さわらない") + "</div>";
  if (ev.kind === "stray") body = '<div class="choices">' + cardHTML(ev.card) + '</div><div class="ev-opts">' + btn("take", "仲間にする", "デッキに入る") + btn("leave", "そっとしておく") + "</div>";
  open('<div class="dialog event" style="--ec:' + col + '"><h2><small>' + run.floor + "階 ・ できごと</small>" + title + '</h2><p class="ev-text">' + text + "</p>" + body + "</div>", "scroll", e => {
   const c = ev.kind === "chest" && e.target.closest(".card");
   const b = e.target.closest("[data-ev]:not([disabled])");
   if (!c && !b) return;
   const choice = c ? "take" : b.dataset.ev;
   const res = Rules.eventPick(run, choice, c && c.dataset.key);
   Sound.sfx(choice === "leave" ? "select" : choice === "gold" || choice === "buy" ? "coin" : "levelup");
   if (res && res.ups.length) {
    open('<div class="dialog"><h2>' + title + "</h2>" + levelupHTML(res.ups) + '<button class="ghost" data-back>地図へ</button></div>', "scroll", ev2 => {
     if (ev2.target.closest("[data-back]")) afterEvolve(showMap);
    });
   } else afterEvolve(showMap);
  });
 }
 function questNewsHTML() {
  const list = run.questNews || [];
  run.questNews = [];
  if (!list.length) return "";
  setTimeout(() => {
   Sound.sfx("coin");
   setTimeout(() => Sound.sfx("levelup"), 150);
  }, 400);
  return '<div class="q-news">' + list.map(k => "<p><small>ミッション達成</small>" + QUESTS[k].text + "<b>+" + QUESTS[k].gold + '<i class="gu">G</i></b></p>').join("") + "</div>";
 }
 function questHTML() {
  if (!run.quests || !run.quests.length) return "";
  return '<div class="quests"><small>ミッション</small>' + run.quests.map(q => '<span class="' + (q.done ? "done" : "") + '"><i>' + (q.done ? "✓" : "・") + "</i>" + QUESTS[q.key].text + "<b>+" + QUESTS[q.key].gold + "G</b></span>").join("") + "</div>";
 }
 function showTrain() {
  saveRun();
  setBg("knight");
  render();
  const counts = deckCounts();
  const keys = [ run.partner ].concat(Object.keys(counts).filter(k => !CARDS[k].junk && k !== run.partner)).filter(k => Rules.lv(k) < GROWTH.maxLv);
  open('<div class="dialog train"><h2>訓練所</h2><p>デッキのカードから1枚えらんで、経験値 +' + GROWTH.trainExp + "</p>" + '<button class="ghost" data-skiptrain>鍛えずに進む</button>' + (keys.length ? '<div class="choices small">' + keys.map(k => {
   const L = Rules.lv(k), need = GROWTH.expToNext(L), now = Rules.exp(k), up = now + GROWTH.trainExp >= need;
   return '<div class="stack">' + cardHTML(k) + '<i class="exp"><i style="width:' + now / need * 100 + '%"></i></i>' + "<b>" + (k === run.partner ? "相棒" : "デッキ×" + counts[k]) + " ・ " + now + "/" + need + (up ? ' <span class="will-up">→Lv' + (L + 1) + "</span>" : "") + "</b></div>";
  }).join("") + "</div>" : "<p>デッキのカードはぜんぶ育てきっている</p>") + "</div>", "scroll", e => {
   if (e.target.closest("[data-skiptrain]")) {
    Rules.train(run, null);
    return showMap();
   }
   const c = e.target.closest(".card:not(.off)");
   if (!c) return;
   const ups = Rules.train(run, c.dataset.key);
   Sound.sfx(ups.length ? "levelup" : "select");
   open('<div class="dialog"><h2>鍛えた！</h2><p>' + CARDS[c.dataset.key].name + " に経験値 +" + GROWTH.trainExp + "</p>" + levelupHTML(ups) + '<div class="choices">' + cardHTML(c.dataset.key) + '</div><button class="ghost" data-back>地図へ</button></div>', "scroll", ev => {
    if (ev.target.closest("[data-back]")) showMap();
   });
  });
 }
 function clearNews() {
  const out = [];
  const bk = run.battle ? run.battle.enemy.key : run.node && run.node.enemy;
  if (run.firstBoss && bk && !run.ending) out.push("<b>" + ENEMIES[bk].name + "</b> をはじめて倒した");
  if (run.finalOpened) out.push("3体のボスをすべて倒した。10階に<b>" + ENEMIES[FINAL_BOSS].name + "</b>が現れる"); else if (run.lastOpened) out.push("<b>" + ENEMIES[FINAL_BOSS].name + "</b>を倒した。10階に<b>" + ENEMIES[LAST_BOSS].name + "</b>が現れる"); else if (run.ending) out.push("<b>" + ENEMIES[LAST_BOSS].name + "</b>を倒した。これからは、どのボスも10階に出る"); else if (run.nextBoss && BOSS_ORDER.includes(run.nextBoss) && !(Rules.save().bossDown || {})[run.nextBoss]) out.push("次の冒険では <b>" + ENEMIES[run.nextBoss].name + "</b> が10階で待つ");
  if (run.firstClear) out.push("<b>" + CARDS[CARDS[run.partner].base || run.partner].name + "</b> ではじめてクリア（図鑑に★）");
  return out.length ? '<div class="news">' + out.map(t => "<p>" + t + "</p>").join("") + "</div>" : "";
 }
 function showEnding(done) {
  const sv = Rules.save();
  const seen = DEX_ORDER.filter(k => sv.seen[k]).length;
  const lines = [ [ "", ENEMIES[LAST_BOSS].name + "を倒した。よるの果てに朝が来た。" ], [ "いっしょに戦った相棒", CARDS[run.partner].name ], [ "冒険した回数", (sv.runs || 0) + " 回" ], [ "倒したボス", BOSS_ORDER.concat(FINAL_BOSS, LAST_BOSS).map(k => ENEMIES[k].name).join("・") ], [ "図鑑", "モンスター " + seen + " / " + DEX_ORDER.length ], [ "", "ボスはこれからも10階に出る。" ] ];
  setBg("area0");
  open('<div class="ending"><div class="end-roll">' + lines.map(([k, v], i) => '<p style="--i:' + i + '">' + (k ? "<small>" + k + "</small>" : "") + "<b>" + v + "</b></p>").join("") + '<h2 style="--i:' + lines.length + '">おしまい</h2>' + '<button class="end-turn big" data-end style="--i:' + (lines.length + 1) + '">記録を見る</button>' + "</div></div>", "scroll ending-ov", e => {
   if (e.target.closest("[data-end]")) {
    Sound.sfx("select");
    done();
   }
  });
  game.dataset.phase = "result";
  Sound.bgm(null);
  Sound.sfx("victory");
  setTimeout(() => Sound.sfx("levelup"), 1800);
  FX.embers($("bg"), "#fff0b0", 40);
 }
 function showResult(won) {
  saveRun();
  clearTimeout(autoTimer);
  const pc = CARDS[run.partner];
  const ups = run.allLevelups.length;
  open('<div class="dialog result">' + "<h2>" + (won ? "クリア！" : "やられた…") + "</h2>" + "<p>" + (won ? ENEMIES[run.node.enemy].name + "をたおした" : run.floor + "階・" + placeOf(run.floor, run.node && run.node.enemy).name + "で力つきた") + "</p>" + '<div class="lobby-stand"><div class="lobby-hero">' + Art.html(pc.art) + "</div></div>" + '<div class="lp-info"><small>相棒</small><b>' + pc.name + "</b><span>LV" + Rules.lv(run.partner) + "</span></div>" + '<div class="lobby-stats">' + "<span><small>到達</small><b>" + run.floor + "階</b></span>" + "<span><small>倒した敵</small><b>" + (run.kills || 0) + "</b></span>" + "<span><small>進化</small><b>" + (run.evolves || 0) + "</b></span>" + "<span><small>育った</small><b>" + ups + "</b></span>" + "</div>" + (won ? clearNews() : "") + questNewsHTML() + levelupHTML(run.allLevelups) + '<p class="gain">冒険のほうび +' + (run.goldBonus || 0) + '<i class="gu">G</i>（' + run.floor + "階まで" + (won ? "・クリア" : "") + "）　持ち金 " + Rules.save().gold + '<i class="gu">G</i>' + (run.gotCount ? "<br>手に入れたカード " + run.gotCount + "枚はコレクションへ" : "") + "</p>" + '<div class="title-btns"><button class="end-turn big" data-again>タイトルへ</button></div></div>', "scroll", e => {
   if (!e.target.closest("[data-again]")) return;
   showTitle();
  });
  game.dataset.phase = "result";
 }
 function startDemo(enemy, partner) {
  document.body.classList.add("demo");
  run = Rules.newRun(0, "g_slime");
  if (partner) run.partner = partner;
  const first = run.map[0][0];
  first.enemy = enemy || "gargoyle";
  goTo(first.id);
  clearInterval(startDemo.t);
  startDemo.t = setInterval(() => {
   if (!run || busy) return;
   if (run.phase !== "battle") {
    clearInterval(startDemo.t);
    close();
    startDemo.r = setTimeout(() => startDemo(enemy, partner), 600);
    return;
   }
   const i = run.battle.hand.findIndex((c, k) => Rules.canPlay(run, k));
   const el = i >= 0 && document.querySelector('#hand .card[data-index="' + i + '"]');
   if (el) el.click(); else endTurn();
  }, 900);
 }
 function demoReset() {
  clearInterval(startDemo.t);
  clearTimeout(startDemo.r);
  clearTimeout(demoReset.t);
  close();
  run = null;
  busy = false;
  document.querySelectorAll(".kc, .fx-layer, .pop").forEach(n => n.remove());
  const m = $("monster");
  m.dataset.key = "";
  m.classList.remove("down", "gone");
  game.dataset.phase = "title";
  setBg("title");
 }
 if (DEMO) window.addEventListener("message", e => {
  const c = e.data;
  if (![ "map", "pack", "boss", "title" ].includes(c)) return;
  demoReset();
  if (c === "map") {
   run = Rules.newRun(0, "g_slime");
   showMap();
  }
  if (c === "pack") {
   Rules.save().freePacks = 1;
   PACK.legend = 1;
   showPack(showTitle);
   demoReset.t = setTimeout(() => {
    const s = ov.querySelector(".pack-sealed");
    if (s) s.click();
   }, 300);
   const flip = n => {
    const f = ov.querySelector(".stage-dealt [data-flipall]");
    if (f && ov.querySelector(".pack-slot") && !ov.querySelector(".pack-slot.open")) f.click();
    if (n) demoReset.t = setTimeout(() => flip(n - 1), 250);
   };
   setTimeout(() => flip(8), 2900);
  }
  if (c === "boss") startDemo("dragon", "e_slime");
  if (c === "title") showTitle();
 });
 const keys = [ ...Object.values(CARDS).map(c => c.art), ...Object.values(ENEMIES).map(e => e.art + "_full"), ...Object.keys(ENEMIES).filter(k => typeof WORLD_SPR === "undefined" || !WORLD_SPR[k]).map(k => "spr_" + k) ];
 Art.probe([ ...new Set(keys) ]).then(() => {
  const drawn = k => !!worldSpr(k, 0) || Art.has("spr_" + k) || Art.has(ENEMIES[k].art + "_full");
  MAP.enemies.forEach(t => {
   [ "pool", "elite" ].forEach(f => {
    if (t[f]) {
     const l = t[f].filter(drawn);
     if (l.length) t[f] = l;
    }
   });
  });
  if (DEMO) return startDemo();
  showTitle();
 });
})();