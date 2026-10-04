const Cards = (() => {
 const ICON = {
  hp: '<svg viewBox="0 0 24 24"><path d="M12 21 C4 14 2 10 2 7 C2 4 4.5 2 7 2 C9 2 11 3.5 12 5 C13 3.5 15 2 17 2 C19.5 2 22 4 22 7 C22 10 20 14 12 21 Z" fill="#ff3a4a" stroke="#1a0904" stroke-width="2"/><path d="M6 6 C6 5 7 4 8 4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
  atk: '<svg viewBox="0 0 24 24"><path d="M3 21 L14 10 L16 4 L20 2 L22 4 L20 8 L14 10 M6 14 L10 18 M2 22 L5 19" fill="none" stroke="#1a0904" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 21 L14 10 L16 4 L20 2 L22 4 L20 8 L14 10" fill="none" stroke="#bfe4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14 L10 18" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/></svg>',
  spd: '<svg viewBox="0 0 24 24"><path d="M14 2 L5 14 L11 14 L9 22 L19 9 L13 9 Z" fill="#ffd23f" stroke="#1a0904" stroke-width="2" stroke-linejoin="round"/></svg>'
 };
 function skill(key, extra, o) {
  if (typeof o === "number") o = {
   lv: o
  };
  o = o || {};
  const c = CARDS[key], a = ATTRS[c.attr], lv = o.lv || 1, boost = o.boost || 0;
  const cost = o.cost != null ? o.cost : cardAt(key, lv, boost).cost;
  const text = cardText(key, lv, boost).replace(/【(.+?)】/g, "<em>$1</em>");
  const nameStyle = c.name.length > 5 ? ' style="font-size:' + (1.12 * 5.5 / c.name.length).toFixed(2) + 'em"' : "";
  const plain = text.replace(/<[^>]+>/g, "").length + (text.split("\n").length - 1) * 7;
  const cls = [ "card", c.unit && "unit-card", c.junk && "junk-card", c.evolved && "evo", "r" + c.rarity, plain > 30 ? "xlong" : plain > 16 && "long", extra ].filter(Boolean).join(" ");
  return '<button class="' + cls + '" data-key="' + key + '" data-kind="' + c.kind + '" style="--a:' + a.main + ";--ad:" + a.deep + ";--ag:" + a.glow + '">' + '<div class="card-face">' + '<div class="card-art">' + Art.html(c.art) + (lv > 1 ? '<div class="card-lv">LV' + lv + "</div>" : "") + (boost > 0 ? '<div class="card-boost">溜' + boost + "</div>" : "") + "</div>" + '<div class="card-name"' + nameStyle + ">" + c.name + "</div>" + '<div class="card-text"><small>' + c.kind + "</small><span>" + text + "</span></div>" + "</div>" + '<div class="card-cost' + (cost < c.cost ? " down" : "") + '">' + cost + "</div>" + '<div class="card-attr">' + a.name + "</div>" + "</button>";
 }
 function fit(root) {
  (root || document).querySelectorAll(".card-text").forEach(t => {
   t.style.fontSize = "";
   let f = parseFloat(getComputedStyle(t).fontSize) / parseFloat(getComputedStyle(t.parentElement).fontSize);
   while (t.scrollHeight > t.clientHeight + 1 && f > .5) {
    f -= .05;
    t.style.fontSize = f + "em";
   }
  });
 }
 function glossary(key, lv) {
  const t = cardText(key, lv || 1);
  return Object.keys(KEYWORDS).filter(k => t.includes(k)).map(k => "<p><b>" + k + "</b>" + KEYWORDS[k] + "</p>").join("");
 }
 function monster(key) {
  const e = ENEMIES[key], info = CARD_INFO[key], a = ATTRS[e.attr];
  return '<div class="mcard" data-key="' + key + '" style="--a:' + a.main + ";--ad:" + a.deep + '">' + '<div class="mc-glass">' + Art.html("bg_glass") + "</div>" + '<div class="mc-head"><div class="mc-emblem"><span>' + a.name + "</span></div>" + '<div class="mc-title gold"><small>' + info.title + "</small><b>" + e.name + "</b></div></div>" + '<div class="mc-stats">' + '<span class="lv"><small>LV</small>' + info.lv + "</span>" + "<span>" + ICON.hp + info.hp + "</span>" + "<span>" + ICON.atk + info.atk + "</span>" + "<span>" + ICON.spd + info.spd + "</span>" + "</div>" + '<div class="mc-art"><div class="mc-art-in">' + (Art.has(e.art + "_full") ? '<div class="mc-scene">' + Art.html(e.art + "_full") + "</div>" : '<div class="mc-scene">' + Art.html(info.bg) + "</div>" + '<div class="mc-mon"><div class="monster">' + Art.html(e.art) + "</div></div>") + '<div class="mc-stars">' + "★".repeat(info.stars) + "</div>" + '<div class="mc-type gold">' + info.type + "</div>" + "</div></div>" + '<div class="mc-ex"><i>EX</i><span>' + info.ex + "</span></div>" + '<div class="mc-text gold"><div><small>わざ・説明</small>ルールが決まったらここに入る</div></div>' + "</div>";
 }
 return {
  skill: skill,
  monster: monster,
  glossary: glossary,
  fit: fit,
  ICON: ICON
 };
})();