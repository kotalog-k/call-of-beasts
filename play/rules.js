const Rules = (() => {
 const SAVE_KEY = "roguelike-save-v1";
 let rand = Math.random;
 function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
   const j = Math.floor(rand() * (i + 1));
   [a[i], a[j]] = [ a[j], a[i] ];
  }
  return a;
 }
 const pick = a => a[Math.floor(rand() * a.length)];
 function weighted(obj) {
  const tot = Object.values(obj).reduce((s, v) => s + v, 0);
  let r = rand() * tot;
  for (const k in obj) {
   r -= obj[k];
   if (r < 0) return k;
  }
  return Object.keys(obj)[0];
 }
 function drawCards(n, minRarity) {
  const pool = REWARD_POOL.filter(k => CARDS[k].rarity >= (minRarity || 1));
  const out = [];
  while (out.length < n && out.length < pool.length) {
   const w = {};
   pool.filter(k => !out.includes(k)).forEach(k => w[k] = RARITY_WEIGHT[CARDS[k].rarity]);
   out.push(weighted(w));
  }
  return out;
 }
 let saveData = null;
 function save() {
  if (saveData) return saveData;
  try {
   saveData = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch (e) {
   saveData = null;
  }
  if (!saveData || !saveData.cards) saveData = {
   cards: {},
   runs: 0,
   best: 0,
   wins: 0
  };
  if (saveData.unlocked == null) saveData.unlocked = 0;
  if (!saveData.dex) saveData.dex = STARTERS.slice();
  if (!saveData.collection) saveData.collection = Object.assign({}, START_COLLECTION);
  if (saveData.gold == null) {
   saveData.gold = PACK.startGold + (saveData.tickets || 0) * PACK.price;
   saveData.freePacks = PACK.freePacks;
  }
  delete saveData.tickets;
  if (saveData.packV !== 2) {
   for (const k in START_COLLECTION) saveData.collection[k] = Math.max(saveData.collection[k] || 0, START_COLLECTION[k]);
   saveData.packV = 2;
  }
  if (saveData.deck && saveData.deck.length !== DECK_SIZE) delete saveData.deck;
  if (!saveData.seen) {
   saveData.seen = {};
   for (const k in ENEMIES) if ((saveData.bossDown || {})[k] || !ENEMIES[k].boss && saveData.dex.includes(ENEMIES[k].card) && !STARTERS.includes(ENEMIES[k].card)) saveData.seen[k] = true;
  }
  if (!saveData.kills) saveData.kills = {};
  return saveData;
 }
 let noStore = false;
 function store() {
  if (noStore) return;
  try {
   localStorage.setItem(SAVE_KEY, JSON.stringify(save()));
  } catch (e) {}
 }
 const base = key => CARDS[key] && CARDS[key].base || key;
 function rec(key) {
  key = base(key);
  const c = save().cards;
  return c[key] || (c[key] = {
   lv: 1,
   exp: 0
  });
 }
 const lv = key => (save().cards[base(key)] || {
  lv: 1
 }).lv;
 const exp = key => (save().cards[base(key)] || {
  exp: 0
 }).exp;
 function gainExp(key, n, out) {
  if (CARDS[key].junk) return;
  const r = rec(key);
  for (let i = 0; i < n && r.lv < GROWTH.maxLv; i++) {
   r.exp++;
   if (r.exp >= GROWTH.expToNext(r.lv)) {
    r.exp = 0;
    r.lv++;
    out.push({
     card: base(key),
     lv: r.lv
    });
   }
  }
 }
 function makeMap(partner) {
  const floors = [];
  const rv = RIVAL[partner], kinFrom = rv && rv.kinFrom || MAP.kinFrom;
  const notKin = (list, f) => {
   if (f >= kinFrom) return list;
   const l = list.filter(e => ENEMIES[e].card !== partner);
   return l.length ? l : list;
  };
  for (let f = 1; f <= MAP.floors; f++) {
   const cols = f === 1 || f === MAP.floors ? [ 1 ] : pick([ [ 0, 1, 2 ], [ 0, 2 ], [ 0, 1 ], [ 1, 2 ], [ 0, 1, 2 ] ]);
   const tier = MAP.enemies.find(t => f >= t.from && f <= t.to);
   const nodes = cols.map(c => {
    let type = "battle";
    if (f > 1 && f < MAP.floors) {
     const w = Object.assign({}, MAP.weights);
     if (f < MAP.noEliteBefore) delete w.elite;
     if (f < MAP.noEventBefore) delete w.event;
     type = weighted(w);
    }
    const enemy = f === MAP.floors ? nextBoss() : type === "elite" ? pick(notKin(tier.elite, f)) : pick(notKin(tier.pool, f));
    return {
     id: f + "-" + c,
     floor: f,
     col: c,
     type: type,
     enemy: enemy,
     next: []
    };
   });
   if (MAP.shopFloors.includes(f) && !nodes.some(n => n.type === "shop")) pick(nodes).type = "shop";
   if (MAP.trainFloors.includes(f) && !nodes.some(n => n.type === "train")) (pick(nodes.filter(n => n.type !== "shop")) || nodes[nodes.length - 1]).type = "train";
   for (const t of [ "shop", "train" ]) nodes.filter(n => n.type === t).slice(1).forEach(n => n.type = "battle");
   floors.push(nodes);
  }
  for (let i = 0; i < floors.length - 1; i++) {
   for (const n of floors[i]) {
    n.next = floors[i + 1].filter(m => floors[i].length === 1 || floors[i + 1].length === 1 || Math.abs(m.col - n.col) <= 1).map(m => m.id);
   }
  }
  for (let i = 1; i < floors.length; i++) {
   for (const n of floors[i]) {
    if (n.type !== "shop" && n.type !== "train") continue;
    const forced = (n.type === "shop" ? MAP.shopFloors : MAP.trainFloors).includes(n.floor);
    if (!forced && floors[i - 1].some(p => p.type === n.type && p.next.includes(n.id))) n.type = "battle";
   }
  }
  const used = {};
  let prev = [];
  for (const nodes of floors) {
   const here = [];
   for (const n of nodes) {
    if (n.floor === MAP.floors || n.type !== "battle" && n.type !== "elite") continue;
    const tier = MAP.enemies.find(t => n.floor >= t.from && n.floor <= t.to);
    const list = notKin(n.type === "elite" ? tier.elite : tier.pool, n.floor);
    const sc = {};
    for (const e of list) sc[e] = (used[e] || 0) * 2 + (here.includes(e) ? 10 : 0) + (prev.includes(e) ? 3 : 0) + rand();
    n.enemy = list.slice().sort((x, y) => sc[x] - sc[y])[0];
    here.push(n.enemy);
    used[n.enemy] = (used[n.enemy] || 0) + 1;
   }
   prev = here;
  }
  const rk = CARDS[partner] && CARDS[partner].evolve && Object.keys(ENEMIES).find(k => ENEMIES[k].card === partner && !ENEMIES[k].boss);
  if (rk && rv) {
   const fights = n => n.floor > 1 && n.floor < MAP.floors && (n.type === "battle" || n.type === "elite");
   const inFl = n => rv.floors.includes(n.floor);
   let node = floors.flat().find(n => fights(n) && inFl(n) && n.enemy === rk && (!rv.elite || n.type === "elite"));
   if (!node) {
    const cand = floors.flat().filter(n => fights(n) && inFl(n));
    node = cand.length ? pick(cand) : pick(floors.flat().filter(n => fights(n) && n.floor <= 7));
    node.enemy = rk;
   }
   if (rv.elite) node.type = "elite";
   node.rival = true;
  }
  return floors;
 }
 const nodeById = (run, id) => run.map.flat().find(n => n.id === id);
 function nextBoss() {
  const down = save().bossDown || {};
  const left = BOSS_ORDER.filter(k => !down[k]);
  if (left.length) return left[0];
  if (!down[FINAL_BOSS]) return FINAL_BOSS;
  if (!down[LAST_BOSS]) return LAST_BOSS;
  return pick(BOSS_ORDER.concat(FINAL_BOSS, LAST_BOSS));
 }
 function canPartner(key) {
  const c = CARDS[key];
  if (!c) return false;
  const b = c.base || key, sv = save();
  return sv.dex.includes(b) && (b === key || !!(sv.evo && sv.evo[b]));
 }
 function newRun(tier, partner, deck) {
  if (!canPartner(partner)) partner = save().dex[0];
  save().runs++;
  store();
  const sv0 = save();
  tier = Math.min(AFTER_END.max, (sv0.afterEnd || 0) * AFTER_END.step);
  const qk = Object.keys(QUESTS), quests = [];
  while (quests.length < 2) {
   const k = pick(qk);
   if (!quests.some(q => q.key === k)) quests.push({
    key: k,
    done: false
   });
  }
  return {
   quests: quests,
   tier: tier,
   partner: partner,
   evolved: [],
   hp: PLAYER.hp,
   maxHp: PLAYER.hp,
   deck: validDeck(deck) ? deck.slice() : autoDeck(),
   got: [],
   map: makeMap(partner),
   at: null,
   floor: 0,
   phase: "map",
   battle: null,
   rewards: [],
   gain: 0,
   levelups: [],
   allLevelups: [],
   shop: [],
   removed: false,
   node: null
  };
 }
 function reachable(run) {
  if (!run.at) return run.map[0].map(n => n.id);
  return nodeById(run, run.at).next;
 }
 function choose(run, id) {
  if (run.phase !== "map" || !reachable(run).includes(id)) return false;
  const node = nodeById(run, id);
  run.at = id;
  run.floor = node.floor;
  run.node = node;
  if (node.type === "shop") {
   run.phase = "shop";
   run.removed = false;
   run.trained = false;
   const hot = drawCards(1, 3)[0];
   run.shop = drawCards(ECONOMY.shopSize + 2).filter(k => k !== hot).slice(0, ECONOMY.shopSize - 1).concat(hot).map(k => ({
    key: k,
    price: ECONOMY.price(k),
    sold: false,
    hot: k === hot
   }));
   const sale = run.shop[Math.floor(rand() * run.shop.length)];
   sale.sale = true;
   sale.price = Math.round(sale.price * (1 - ECONOMY.sale));
  } else if (node.type === "train") {
   run.phase = "train";
  } else if (node.type === "event") {
   run.phase = "event";
   run.event = makeEvent(run, node);
  } else startBattle(run, node);
  return true;
 }
 function makeEvent(run, node) {
  const kinds = [ "chest", "merchant", "spring", "altar", "stray" ].filter(k => k !== run.lastEvent);
  const kind = pick(kinds);
  run.lastEvent = kind;
  const ev = {
   kind: kind
  };
  if (kind === "chest") ev.cards = drawCards(3, 2);
  if (kind === "merchant") {
   ev.card = drawCards(1, 3)[0];
   ev.price = 35;
  }
  if (kind === "altar") ev.card = drawCards(1, 3)[0];
  if (kind === "stray") {
   const tier = MAP.enemies.find(t => node.floor >= t.from && node.floor <= t.to);
   const caps = tier.pool.map(e => ENEMIES[e].card).filter(Boolean);
   ev.card = pick(caps.length ? caps : [ "g_slime" ]);
  }
  return ev;
 }
 function eventPick(run, choice, key) {
  if (run.phase !== "event") return null;
  const ev = run.event, out = {
   ups: []
  };
  const add = k => {
   run.deck.push(k);
   run.got.push(k);
  };
  if (ev.kind === "chest") {
   if (choice === "take" && ev.cards.includes(key)) add(key);
   if (choice === "gold") save().gold += 30;
  }
  if (ev.kind === "merchant" && choice === "buy" && save().gold >= ev.price) {
   save().gold -= ev.price;
   add(ev.card);
  }
  if (ev.kind === "spring") {
   if (choice === "hp") {
    run.maxHp += 5;
    run.hp = run.maxHp;
   }
   if (choice === "exp") gainExp(run.partner, GROWTH.trainExp * 2, out.ups);
  }
  if (ev.kind === "altar" && choice === "take") {
   add(ev.card);
   run.deck.push("curse");
  }
  if (ev.kind === "stray" && choice === "take") add(ev.card);
  checkEvolve(run);
  store();
  run.event = null;
  backToMap(run);
  return out;
 }
 let uid = 0;
 const handItem = key => ({
  key: key,
  boost: 0,
  uid: ++uid
 });
 function makeUnit(key, partner) {
  const s = cardAt(key, lv(key));
  return Object.assign({
   id: ++uid,
   key: key,
   maxHp: s.unit.hp,
   sleeping: !partner && !s.unit.rush,
   item: null,
   partner: !!partner,
   hits: 0
  }, s.unit);
 }
 function startBattle(run, node) {
  const e = ENEMIES[node.enemy], f = e.boss ? 0 : node.floor - 1, elite = node.type === "elite";
  const sv = save();
  sv.seen = sv.seen || {};
  if (!sv.seen[node.enemy]) {
   sv.seen[node.enemy] = true;
   run.firstSeen = node.enemy;
   store();
  } else run.firstSeen = null;
  const tm = (1 + CHALLENGE.hp * run.tier) * ENEMY_MUL.hp, ta = (1 + CHALLENGE.atk * run.tier) * ENEMY_MUL.atk;
  const hp = Math.round(e.hp * (1 + FLOOR_SCALE.hp * f) * (elite ? ELITE.hp : 1) * tm);
  run.phase = "battle";
  run.hp = run.maxHp;
  run.battle = {
   elite: elite,
   enemy: {
    key: node.enemy,
    hp: hp,
    maxHp: hp,
    block: 0,
    step: 0,
    str: 0,
    burn: 0,
    weak: 0,
    vuln: 0,
    enraged: false,
    atkMul: (1 + FLOOR_SCALE.atk * f) * (elite ? ELITE.atk : 1) * ta
   },
   block: 0,
   thorns: 0,
   burn: 0,
   turn: 1,
   mpMax: 1,
   mp: 1,
   playedThisTurn: 0,
   field: [ makeUnit(run.partner, true) ],
   drawPile: shuffle(run.deck.map(handItem)),
   hand: [],
   discard: [],
   gone: [],
   played: [],
   unitHits: {}
  };
  draw(run, PLAYER.firstHand, []);
  const b = run.battle, cheap = c => cardAt(c.key, lv(c.key), 0).cost <= 1 && !CARDS[c.key].junk;
  if (!b.hand.some(cheap)) {
   const j = b.drawPile.findIndex(cheap);
   if (j >= 0) {
    const hi = b.hand.reduce((m, c, i) => cardAt(c.key, lv(c.key), 0).cost > cardAt(b.hand[m].key, lv(b.hand[m].key), 0).cost ? i : m, 0);
    const [c] = b.drawPile.splice(j, 1);
    b.drawPile.splice(Math.floor(rand() * (b.drawPile.length + 1)), 0, b.hand[hi]);
    b.hand[hi] = c;
   }
  }
 }
 function draw(run, n, events) {
  const b = run.battle;
  for (let i = 0; i < n; i++) {
   if (b.drawPile.length === 0) {
    if (b.discard.length === 0) break;
    b.drawPile = shuffle(b.discard);
    b.discard = [];
    events.push({
     type: "reshuffle"
    });
   }
   const c = b.drawPile.pop();
   c.boost = 0;
   if (b.hand.length >= PLAYER.handMax) {
    b.discard.push(c);
    events.push({
     type: "burnCard",
     card: c.key
    });
    continue;
   }
   b.hand.push(c);
  }
  events.push({
   type: "draw"
  });
 }
 function handCard(run, i) {
  const c = run.battle.hand[i];
  if (!c) return null;
  const L = lv(c.key);
  return {
   key: c.key,
   lv: L,
   boost: c.boost,
   cost: cardAt(c.key, L, c.boost).cost
  };
 }
 function canPlay(run, i) {
  if (run.phase !== "battle") return false;
  const b = run.battle, h = handCard(run, i);
  if (!h || h.cost > b.mp) return false;
  if (CARDS[h.key].unit && b.field.length >= PLAYER.fieldMax) return false;
  return true;
 }
 const anyPlayable = run => run.phase === "battle" && run.battle.hand.some((_, i) => canPlay(run, i));
 function quest(run, key, events) {
  const q = (run.quests || []).find(x => x.key === key && !x.done);
  if (!q) return;
  q.done = true;
  save().gold += QUESTS[key].gold;
  store();
  (run.questNews = run.questNews || []).push(key);
  events.push({
   type: "quest",
   key: key,
   gold: QUESTS[key].gold
  });
 }
 function hitEnemy(run, amount, pierce, events, src) {
  const en = run.battle.enemy;
  if (en.vuln > 0) amount = Math.floor(amount * 1.5);
  const absorbed = pierce ? 0 : Math.min(en.block, amount);
  en.block -= absorbed;
  const dmg = amount - absorbed;
  en.hp = Math.max(0, en.hp - dmg);
  events.push({
   type: "hit",
   who: "enemy",
   amount: dmg,
   absorbed: absorbed,
   src: src,
   hp: en.hp
  });
  if (amount >= 10) quest(run, "big", events);
  checkPhase(run, events);
 }
 function checkPhase(run, events) {
  const en = run.battle.enemy, e = ENEMIES[en.key];
  if (e.phase2 && !en.enraged && en.hp > 0 && en.hp <= en.maxHp / 2) {
   en.enraged = true;
   en.step = 0;
   events.push({
    type: "enrage",
    name: e.phase2.name
   });
  }
 }
 const dead = run => run.battle.enemy.hp <= 0;
 function apply(run, o, ctx, events) {
  const b = run.battle, en = b.enemy;
  if (dead(run)) return;
  switch (o.op) {
  case "dmg":
   for (let k = 0; k < (o.times || 1) && !dead(run); k++) hitEnemy(run, o.n, false, events, ctx.src);
   break;

  case "pierce":
   hitEnemy(run, o.n, true, events, ctx.src);
   break;

  case "flurry":
   for (let k = 0; k < ctx.before + 1 && !dead(run); k++) hitEnemy(run, o.n, false, events, ctx.src);
   break;

  case "execute":
   hitEnemy(run, en.hp <= en.maxHp * .3 ? o.n * 3 : o.n, false, events, ctx.src);
   break;

  case "shatter":
   hitEnemy(run, en.vuln > 0 ? o.n * 2 : o.n, false, events, ctx.src);
   break;

  case "ignite":
   en.burn *= 2;
   events.push({
    type: "status",
    who: "enemy",
    s: "burn",
    amount: en.burn
   });
   if (en.burn) hitEnemy(run, en.burn, false, events, ctx.src);
   break;

  case "block":
   b.block += o.n;
   events.push({
    type: "block",
    who: "player",
    amount: o.n
   });
   break;

  case "heal":
   {
    const before = run.hp;
    run.hp = Math.min(run.maxHp, run.hp + o.n);
    events.push({
     type: "heal",
     who: "player",
     amount: run.hp - before,
     hp: run.hp
    });
    break;
   }

  case "draw":
   draw(run, o.n, events);
   break;

  case "mp":
   b.mp += o.n;
   events.push({
    type: "mp",
    amount: o.n
   });
   break;

  case "burn":
   en.burn += o.n;
   events.push({
    type: "status",
    who: "enemy",
    s: "burn",
    amount: o.n
   });
   break;

  case "weak":
   en.weak += o.n;
   events.push({
    type: "status",
    who: "enemy",
    s: "weak",
    amount: o.n
   });
   break;

  case "vuln":
   en.vuln += o.n;
   events.push({
    type: "status",
    who: "enemy",
    s: "vuln",
    amount: o.n
   });
   break;

  case "thorns":
   b.thorns += o.n;
   events.push({
    type: "status",
    who: "player",
    s: "thorns",
    amount: o.n
   });
   break;

  case "rally":
   b.field.forEach(u => {
    u.atk += o.atk;
    u.maxHp += o.hp;
    if (!u.down) u.hp += o.hp;
   });
   if (b.field.length) events.push({
    type: "rally",
    atk: o.atk,
    hp: o.hp
   });
   break;
  }
 }
 const applyAll = (run, ops, ctx, events) => (ops || []).forEach(o => apply(run, o, ctx, events));
 function play(run, i) {
  const events = [];
  if (!canPlay(run, i)) return events;
  const b = run.battle;
  const h = handCard(run, i);
  const item = b.hand.splice(i, 1)[0];
  const card = CARDS[item.key], s = cardAt(item.key, h.lv, item.boost);
  b.mp -= s.cost;
  b.played.push(item.key);
  const ctx = {
   src: item.key,
   before: b.playedThisTurn
  };
  b.playedThisTurn++;
  events.push({
   type: "play",
   card: item.key
  });
  if (s.unit) {
   const u = makeUnit(item.key, false);
   u.item = item;
   b.field.push(u);
   events.push({
    type: "summon",
    card: item.key,
    index: b.field.length - 1,
    id: u.id
   });
   applyAll(run, u.onSummon, ctx, events);
  } else {
   applyAll(run, s.fx, ctx, events);
   if (s.combo && ctx.before >= 1) {
    events.push({
     type: "tag",
     text: "連鎖"
    });
    applyAll(run, s.combo, ctx, events);
   }
   if (s.awaken && b.mpMax >= AWAKEN_MP) {
    events.push({
     type: "tag",
     text: "咆哮"
    });
    applyAll(run, s.awaken, ctx, events);
   }
   (card.exhaust ? b.gone : b.discard).push(item);
  }
  if (b.playedThisTurn >= 4) quest(run, "combo", events);
  if (b.field.filter(u => !u.down).length >= 3) quest(run, "army", events);
  if (card.kind === "魔法" && !card.junk && !dead(run)) {
   b.hand.forEach(c => {
    if (CARDS[c.key].boost) c.boost++;
   });
   b.field.forEach((u, ui) => {
    if (u.onSpell && !u.down) {
     events.push({
      type: "unitAct",
      index: ui,
      id: u.id
     });
     applyAll(run, u.onSpell, {
      src: u.key,
      before: 0
     }, events);
    }
   });
   if (ENEMIES[b.enemy.key].passive && ENEMIES[b.enemy.key].passive.spite && b.enemy.str < 3 && !dead(run)) {
    b.enemy.str++;
    events.push({
     type: "status",
     who: "enemy",
     s: "str",
     amount: 1
    });
   }
  }
  if (dead(run)) finishBattle(run, events);
  return events;
 }
 function finishBattle(run, events) {
  const b = run.battle;
  events.push({
   type: "defeat",
   who: "enemy"
  });
  run.kills = (run.kills || 0) + 1;
  if (b.elite) quest(run, "elite", events);
  if (run.hp >= run.maxHp) quest(run, "flawless", events);
  if (b.turn <= 4) quest(run, "quick", events);
  const kl = save().kills || (save().kills = {});
  kl[b.enemy.key] = (kl[b.enemy.key] || 0) + 1;
  const ups = [];
  for (const k of b.played) gainExp(k, 1, ups);
  for (const k in b.unitHits) gainExp(k, b.unitHits[k], ups);
  const got = ENEMIES[b.enemy.key].card;
  if (got && MONSTERS.includes(got) && !save().dex.includes(got)) {
   save().dex.push(got);
   run.newDex = got;
  } else run.newDex = null;
  run.capGet = null;
  if (got) {
   const sv = save(), c = {
    key: got,
    isNew: !sv.collection[got]
   };
   if ((sv.collection[got] || 0) >= DECK_MAX_COPIES) {
    const u = [];
    gainExp(got, PACK.dupExp, u);
    ups.push(...u);
    c.exp = PACK.dupExp;
   } else sv.collection[got] = (sv.collection[got] || 0) + 1;
   run.capGet = c;
  }
  run.levelups = ups;
  run.allLevelups.push(...ups);
  store();
  if (run.floor >= MAP.floors) {
   run.phase = "won";
   endRun(run, true);
   const sv = save();
   sv.best = Math.max(sv.best, run.floor);
   sv.wins = (sv.wins || 0) + 1;
   const bk = b.enemy.key, pb = CARDS[run.partner].base || run.partner;
   sv.bossDown = sv.bossDown || {};
   if (sv.bossDown[LAST_BOSS]) sv.afterEnd = (sv.afterEnd || 0) + 1;
   run.firstBoss = !sv.bossDown[bk];
   sv.bossDown[bk] = true;
   run.finalOpened = run.firstBoss && BOSS_ORDER.includes(bk) && BOSS_ORDER.every(k => sv.bossDown[k]);
   run.lastOpened = run.firstBoss && bk === FINAL_BOSS;
   run.ending = run.firstBoss && bk === LAST_BOSS;
   run.nextBoss = nextBoss();
   sv.clears = sv.clears || {};
   run.firstClear = sv.clears[pb] == null;
   sv.clears[pb] = Math.max(sv.clears[pb] == null ? -1 : sv.clears[pb], run.tier);
   store();
   return;
  }
  run.gain = Math.round(ECONOMY.goldPerWin(run.floor) * (b.elite ? ELITE.goldMul : 1));
  save().gold += run.gain;
  store();
  run.phase = "reward";
  const cap = ENEMIES[b.enemy.key].card;
  run.captured = cap || null;
  run.rewards = (cap ? [ cap ] : []).concat(drawCards(4, b.elite ? 2 : 1).filter(k => k !== cap)).slice(0, 3);
 }
 function enemyIntents(en) {
  const e = ENEMIES[en.key];
  return en.enraged ? e.phase2.intents : e.intents;
 }
 function hitValue(en, base) {
  let v = Math.round(base * en.atkMul) + en.str;
  if (en.weak > 0) v = Math.floor(v * .7);
  return Math.max(0, v);
 }
 function intentOf(run) {
  const en = run.battle.enemy, list = enemyIntents(en), it = list[en.step % list.length], out = {};
  if (it.atk) {
   out.atk = hitValue(en, it.atk);
   out.times = it.times || 1;
  }
  if (it.aoe) out.aoe = hitValue(en, it.aoe);
  for (const k of [ "block", "buff", "burn", "curse", "heal" ]) if (it[k]) out[k] = it[k];
  return out;
 }
 function hitPlayer(run, amount, events) {
  const b = run.battle;
  const absorbed = Math.min(b.block, amount);
  b.block -= absorbed;
  const dmg = amount - absorbed;
  run.hp = Math.max(0, run.hp - dmg);
  events.push({
   type: "hit",
   who: "player",
   amount: dmg,
   absorbed: absorbed,
   hp: run.hp
  });
  if (b.thorns > 0 && !dead(run)) {
   events.push({
    type: "tag",
    text: "反撃"
   });
   hitEnemy(run, b.thorns, false, events, "thorns");
  }
 }
 function hitUnit(run, ui, amount, events) {
  const b = run.battle, u = b.field[ui];
  const absorbed = Math.min(b.block, amount);
  b.block -= absorbed;
  amount -= absorbed;
  u.hp -= amount;
  events.push({
   type: "hit",
   who: "unit",
   index: ui,
   id: u.id,
   amount: amount,
   absorbed: absorbed,
   hp: Math.max(0, u.hp)
  });
  if (u.thorns && !dead(run)) {
   events.push({
    type: "tag",
    text: "反撃"
   });
   hitEnemy(run, u.thorns, false, events, u.key);
  }
  if (b.thorns > 0 && !dead(run)) {
   events.push({
    type: "tag",
    text: "反撃"
   });
   hitEnemy(run, b.thorns, false, events, "thorns");
  }
  if (u.hp <= 0 && u.partner && !u.revived) {
   u.hp = 0;
   u.down = PARTNER_DOWN;
   u.revived = true;
   events.push({
    type: "partnerDown",
    index: ui,
    id: u.id,
    turns: PARTNER_DOWN
   });
   return;
  }
  if (u.hp <= 0) {
   b.field.splice(ui, 1);
   if (u.item) b.discard.push(u.item);
   events.push({
    type: "unitDown",
    key: u.key,
    index: ui,
    id: u.id
   });
   if (u.onDeath) applyAll(run, u.onDeath, {
    src: u.key,
    before: 0
   }, events);
  }
 }
 function targetOf(run) {
  const b = run.battle, p = ENEMIES[b.enemy.key].passive || {};
  if (!b.field.some(u => !u.down)) return -1;
  if (p.hunter) return b.field.findIndex(u => !u.down);
  return b.field.findIndex(u => u.ward && !u.down && u.hp * 2 >= u.maxHp);
 }
 function endTurn(run) {
  const events = [];
  if (run.phase !== "battle") return events;
  const b = run.battle, en = b.enemy, e = ENEMIES[en.key];
  for (let i = 0; i < b.field.length && !dead(run); i++) {
   const u = b.field[i];
   if (u.sleeping || u.down) continue;
   for (let h = 0; h < (u.double ? 2 : 1) && !dead(run); h++) {
    events.push({
     type: "unitAttack",
     index: i,
     id: u.id
    });
    hitEnemy(run, u.atk, false, events, u.key);
    if (u.onAttack) applyAll(run, u.onAttack, {
     src: u.key,
     before: 0
    }, events);
   }
   u.hits++;
   b.unitHits[u.key] = (b.unitHits[u.key] || 0) + 1;
  }
  for (let i = 0; i < b.field.length && !dead(run); i++) {
   const u = b.field[i];
   if (u.onTurnEnd && !u.down) {
    events.push({
     type: "unitAct",
     index: i,
     id: u.id
    });
    applyAll(run, u.onTurnEnd, {
     src: u.key,
     before: 0
    }, events);
   }
   u.sleeping = false;
  }
  if (dead(run)) {
   finishBattle(run, events);
   return events;
  }
  events.push({
   type: "enemyTurn"
  });
  if (en.burn > 0) {
   events.push({
    type: "burnTick",
    who: "enemy",
    amount: en.burn
   });
   hitEnemy(run, en.burn, true, events, "burn");
   en.burn--;
   if (dead(run)) {
    finishBattle(run, events);
    return events;
   }
  }
  en.block = 0;
  if (e.passive && e.passive.armor) {
   en.block += e.passive.armor;
   events.push({
    type: "block",
    who: "enemy",
    amount: e.passive.armor
   });
  }
  const it = intentOf(run);
  events.push({
   type: "enemyAct",
   it: it
  });
  if (it.block) {
   en.block += it.block;
   events.push({
    type: "block",
    who: "enemy",
    amount: it.block
   });
  }
  if (it.buff) {
   en.str += it.buff;
   events.push({
    type: "status",
    who: "enemy",
    s: "str",
    amount: it.buff
   });
  }
  if (it.heal) {
   const before = en.hp;
   en.hp = Math.min(en.maxHp, en.hp + it.heal);
   events.push({
    type: "heal",
    who: "enemy",
    amount: en.hp - before,
    ehp: en.hp
   });
  }
  if (it.atk) {
   for (let k = 0; k < it.times && run.hp > 0 && !dead(run); k++) {
    const t = targetOf(run);
    events.push({
     type: "enemyAttack",
     target: t
    });
    if (t >= 0) hitUnit(run, t, it.atk, events); else hitPlayer(run, it.atk, events);
   }
  }
  if (it.aoe && !dead(run)) {
   events.push({
    type: "enemyAttack",
    target: "all"
   });
   for (let i = b.field.length - 1; i >= 0; i--) if (!b.field[i].down) hitUnit(run, i, it.aoe, events);
   if (!dead(run)) hitPlayer(run, it.aoe, events);
  }
  if (it.burn) {
   b.burn += it.burn;
   events.push({
    type: "status",
    who: "player",
    s: "burn",
    amount: it.burn
   });
  }
  if (it.curse) {
   for (let k = 0; k < it.curse; k++) b.discard.push(handItem("curse"));
   events.push({
    type: "curse",
    amount: it.curse
   });
  }
  en.step++;
  if (en.weak > 0) en.weak--;
  if (en.vuln > 0) en.vuln--;
  if (dead(run)) {
   finishBattle(run, events);
   return events;
  }
  if (run.hp <= 0) return lose(run, events);
  b.thorns = 0;
  if (b.burn > 0) {
   events.push({
    type: "burnTick",
    who: "player",
    amount: b.burn
   });
   run.hp = Math.max(0, run.hp - b.burn);
   events.push({
    type: "hit",
    who: "player",
    amount: b.burn,
    absorbed: 0,
    hp: run.hp
   });
   b.burn--;
   if (run.hp <= 0) return lose(run, events);
  }
  b.field.forEach((u, i) => {
   if (!u.down) return;
   u.down--;
   if (!u.down) {
    u.hp = Math.ceil(u.maxHp / 2);
    events.push({
     type: "revive",
     index: i,
     id: u.id,
     hp: u.hp
    });
   }
  });
  b.turn++;
  b.block = 0;
  b.playedThisTurn = 0;
  b.mpMax = Math.min(PLAYER.mpMax, b.mpMax + 1);
  b.mp = b.mpMax;
  draw(run, PLAYER.drawPerTurn, events);
  events.push({
   type: "turn",
   turn: b.turn
  });
  return events;
 }
 function endRun(run, won) {
  const sv = save();
  run.goldKept = 0;
  run.goldBonus = Math.round(PACK.bonus(run.floor, won) * (1 + CHALLENGE.reward * (run.tier || 0)));
  sv.gold = (sv.gold || 0) + run.goldBonus;
  for (const k of run.got) if (CARDS[k] && !CARDS[k].junk && !CARDS[k].evolved) sv.collection[k] = (sv.collection[k] || 0) + 1;
  run.gotCount = run.got.length;
  store();
 }
 function lose(run, events) {
  run.phase = "lost";
  endRun(run, false);
  const ups = [];
  for (const k of run.battle.played) gainExp(k, 1, ups);
  run.levelups = ups;
  run.allLevelups.push(...ups);
  const sv = save();
  sv.best = Math.max(sv.best, run.floor - 1);
  store();
  events.push({
   type: "defeat",
   who: "player"
  });
  return events;
 }
 function backToMap(run) {
  run.phase = "map";
  run.battle = null;
 }
 function giftPack() {
  save().freePacks = (save().freePacks || 0) + 1;
  store();
 }
 function openPack(run) {
  const sv = save();
  if (sv.freePacks > 0) sv.freePacks--; else if ((sv.gold || 0) < PACK.price) return null; else sv.gold -= PACK.price;
  const pool = REWARD_POOL.filter(k => CARDS[k].rarity >= 1);
  const out = [];
  for (let i = 0; i < PACK.size; i++) {
   const w = {};
   pool.filter(k => i < PACK.size - 1 || CARDS[k].rarity >= 2).forEach(k => w[k] = PACK.weight[CARDS[k].rarity]);
   out.push(weighted(w));
  }
  sv.sinceLegend = (sv.sinceLegend || 0) + 1;
  if (rand() < PACK.legend || sv.sinceLegend >= PACK.pity) {
   out[PACK.size - 1] = pick(LEGENDS);
   sv.sinceLegend = 0;
  }
  const cards = out.map(k => {
   const c = {
    key: k,
    isNew: !sv.collection[k]
   };
   if ((sv.collection[k] || 0) >= DECK_MAX_COPIES) {
    const ups = [];
    gainExp(k, PACK.dupExp, ups);
    c.exp = PACK.dupExp;
    c.lvUp = ups.length ? ups[ups.length - 1].lv : 0;
   } else sv.collection[k] = (sv.collection[k] || 0) + 1;
   return c;
  });
  store();
  return cards;
 }
 const RUN_DECK_MAX = DECK_SIZE + 10;
 function runPool(run) {
  const col = save().collection, pool = {};
  for (const k in col) if (col[k] > 0 && CARDS[k]) pool[k] = Math.min(DECK_MAX_COPIES, col[k]);
  const got = {};
  run.got.forEach(k => got[k] = (got[k] || 0) + 1);
  for (const k in got) pool[k] = Math.min(DECK_MAX_COPIES, (col[k] || 0) + got[k]);
  run.deck.forEach(k => {
   if (CARDS[k].evolved || CARDS[k].junk) pool[k] = run.deck.filter(x => x === k).length;
  });
  return pool;
 }
 function setRunDeck(run, deck) {
  if (!run || !Array.isArray(deck) || deck.length < DECK_SIZE || deck.length > RUN_DECK_MAX) return false;
  const pool = runPool(run), n = {};
  for (const k of deck) {
   n[k] = (n[k] || 0) + 1;
   if (!CARDS[k] || n[k] > (pool[k] || 0)) return false;
  }
  const curses = run.deck.filter(k => CARDS[k].junk).length;
  if (deck.filter(k => CARDS[k].junk).length !== curses) return false;
  run.deck = deck.slice();
  checkEvolve(run);
  return true;
 }
 const addGold = n => {
  save().gold = (save().gold || 0) + n;
  store();
 };
 const canPack = () => save().freePacks > 0 || (save().gold || 0) >= PACK.price;
 function validDeck(deck) {
  if (!Array.isArray(deck) || deck.length !== DECK_SIZE) return false;
  const col = save().collection, n = {};
  for (const k of deck) {
   n[k] = (n[k] || 0) + 1;
   if (!CARDS[k] || n[k] > (col[k] || 0) || n[k] > DECK_MAX_COPIES) return false;
  }
  return true;
 }
 function autoDeck() {
  const col = save().collection;
  const want = {
   "攻撃": 6,
   "防御": 4,
   "魔法": 3,
   "召喚獣": 2
  };
  const score = k => CARDS[k].rarity * 3 + lv(k) * 2 + rand();
  const owned = Object.keys(col).filter(k => col[k] > 0 && CARDS[k]).sort((a, b) => score(b) - score(a));
  const deck = [], n = {};
  const take = k => {
   if ((n[k] || 0) < Math.min(col[k], DECK_MAX_COPIES) && deck.length < DECK_SIZE) {
    deck.push(k);
    n[k] = (n[k] || 0) + 1;
    return true;
   }
   return false;
  };
  for (const kind in want) {
   let c = 0;
   for (let pass = 0; pass < 3 && c < want[kind]; pass++) for (const k of owned) if (CARDS[k].kind === kind && c < want[kind] && take(k)) c++;
  }
  for (let pass = 0; pass < 3 && deck.length < DECK_SIZE; pass++) for (const k of owned) take(k);
  return deck;
 }
 function setDeck(deck) {
  if (!validDeck(deck)) return false;
  save().deck = deck.slice();
  store();
  return true;
 }
 function checkEvolve(run) {
  run.evolved = [];
  for (const g of MONSTERS) {
   const e = CARDS[g].evolve;
   if (!e) continue;
   const n = run.deck.filter(k => k === g).length + (run.partner === g ? 1 : 0);
   if (n < 2) continue;
   if (!run.got.includes(g)) continue;
   if (run.partner === g) {
    run.deck.splice(run.deck.indexOf(g), 1);
    run.partner = e;
    const sv = save();
    sv.evo = sv.evo || {};
    sv.evo[g] = true;
    store();
   } else {
    run.deck.splice(run.deck.indexOf(g), 1);
    run.deck.splice(run.deck.indexOf(g), 1);
    run.deck.push(e);
   }
   run.evolved.push({
    from: g,
    to: e,
    partner: run.partner === e
   });
   run.evolves = (run.evolves || 0) + 1;
  }
  return run.evolved;
 }
 function pickReward(run, key) {
  if (run.phase !== "reward") return;
  if (key) {
   run.deck.push(key);
   run.got.push(key);
  }
  checkEvolve(run);
  backToMap(run);
 }
 function buy(run, i) {
  const item = run.shop[i];
  if (run.phase !== "shop" || !item || item.sold || save().gold < item.price) return false;
  save().gold -= item.price;
  store();
  item.sold = true;
  run.deck.push(item.key);
  run.got.push(item.key);
  checkEvolve(run);
  return true;
 }
 function removeCard(run, deckIndex) {
  if (run.phase !== "shop" || run.removed || save().gold < ECONOMY.removePrice || run.deck.length <= 5) return false;
  save().gold -= ECONOMY.removePrice;
  store();
  run.deck.splice(deckIndex, 1);
  run.removed = true;
  return true;
 }
 function shopTrain(run) {
  if (run.phase !== "shop" || run.trained || save().gold < ECONOMY.trainPrice) return null;
  save().gold -= ECONOMY.trainPrice;
  store();
  run.trained = true;
  const ups = [];
  gainExp(run.partner, Math.ceil(GROWTH.trainExp / 2), ups);
  run.allLevelups.push(...ups);
  store();
  return ups;
 }
 function leaveShop(run) {
  if (run.phase === "shop") backToMap(run);
 }
 function train(run, key) {
  if (run.phase !== "train") return [];
  if (!key || !(run.deck.includes(key) || run.partner === key)) {
   backToMap(run);
   return [];
  }
  const ups = [];
  gainExp(key, GROWTH.trainExp, ups);
  run.allLevelups.push(...ups);
  store();
  backToMap(run);
  return ups;
 }
 function preview(run, i) {
  if (!canPlay(run, i)) return null;
  const keepSave = saveData, keepRand = rand;
  let seed = 7;
  noStore = true;
  saveData = JSON.parse(JSON.stringify(save()));
  rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const r = JSON.parse(JSON.stringify(run));
  try {
   play(r, i);
  } finally {
   saveData = keepSave;
   rand = keepRand;
   noStore = false;
  }
  const b = r.battle;
  return {
   enemyHp: b ? b.enemy.hp : 0,
   enemyBlock: b ? b.enemy.block : 0,
   block: b ? b.block : 0,
   hp: r.hp,
   kill: r.phase === "won" || (b ? b.enemy.hp <= 0 : true)
  };
 }
 function _sim(rng, data) {
  if (rng) rand = rng;
  saveData = data || {
   cards: {},
   runs: 0,
   best: 0,
   wins: 0,
   unlocked: 0
  };
  if (!saveData.dex) saveData.dex = STARTERS.slice();
  if (!saveData.collection) saveData.collection = Object.assign({}, START_COLLECTION);
  if (saveData.gold == null) saveData.gold = PACK.startGold;
  saveData.packV = 2;
 }
 return {
  addGold: addGold,
  runPool: runPool,
  setRunDeck: setRunDeck,
  RUN_DECK_MAX: RUN_DECK_MAX,
  canPack: canPack,
  eventPick: eventPick,
  newRun: newRun,
  reachable: reachable,
  choose: choose,
  play: play,
  endTurn: endTurn,
  canPlay: canPlay,
  anyPlayable: anyPlayable,
  handCard: handCard,
  intentOf: intentOf,
  targetOf: targetOf,
  pickReward: pickReward,
  buy: buy,
  removeCard: removeCard,
  shopTrain: shopTrain,
  leaveShop: leaveShop,
  train: train,
  openPack: openPack,
  giftPack: giftPack,
  validDeck: validDeck,
  autoDeck: autoDeck,
  setDeck: setDeck,
  lv: lv,
  exp: exp,
  save: save,
  preview: preview,
  canPartner: canPartner,
  nextBoss: nextBoss,
  _sim: _sim
 };
})();