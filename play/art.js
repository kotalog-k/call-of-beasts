const Art = (() => {
 const OL = "#1a0904";
 const found = {};
 function probe(keys) {
  return Promise.all(keys.map(k => new Promise(res => {
   const img = new Image;
   img.onload = () => {
    found[k] = true;
    res();
   };
   img.onerror = () => {
    found[k] = false;
    res();
   };
   img.src = "art/" + k + ".png";
  })));
 }
 function html(key, cls) {
  if (found[key]) return '<img class="' + (cls || "") + '" src="art/' + key + '.png" alt="" draggable="false">';
  const f = SVG[key];
  return f ? f() : "";
 }
 const stops = s => s.map(([o, c, a]) => '<stop offset="' + o + '" stop-color="' + c + '"' + (a != null ? ' stop-opacity="' + a + '"' : "") + "/>").join("");
 const lin = (id, s, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stops(s) + "</linearGradient>";
 const rad = (id, s, cx = .5, cy = .5, r = .5) => '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">' + stops(s) + "</radialGradient>";
 const P = (d, f, w) => '<path d="' + d + '" fill="' + f + '" stroke="' + OL + '" stroke-width="' + (w || 5) + '" stroke-linejoin="round" stroke-linecap="round"/>';
 const F = (d, f, op) => '<path d="' + d + '" fill="' + f + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>";
 const L = (d, w, c, op) => '<path d="' + d + '" fill="none" stroke="' + (c || OL) + '" stroke-width="' + (w || 2.5) + '" stroke-linejoin="round" stroke-linecap="round"' + (op != null ? ' opacity="' + op + '"' : "") + "/>";
 const rim = (d, w) => L(d, w || 3.5, "#ffe680", .95);
 const hatch = (p, d) => F(d, "url(#" + p + "hatch)", .55);
 const glint = (x, y, s, c) => '<path d="M' + x + " " + (y - s) + " Q" + x + " " + y + " " + (x + s * .28) + " " + y + " Q" + x + " " + y + " " + x + " " + (y + s) + " Q" + x + " " + y + " " + (x - s * .28) + " " + y + " Q" + x + " " + y + " " + x + " " + (y - s) + " Z M" + (x - s) + " " + y + " Q" + x + " " + y + " " + x + " " + (y - s * .28) + " Q" + x + " " + y + " " + (x + s) + " " + y + " Q" + x + " " + y + " " + x + " " + (y + s * .28) + " Q" + x + " " + y + " " + (x - s) + " " + y + ' Z" fill="' + (c || "#fff") + '"/>';
 const commonDefs = p => '<pattern id="' + p + 'hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="7" height="7" fill="none"/><line x1="0" y1="0" x2="0" y2="7" stroke="' + OL + '" stroke-width="1.6"/></pattern>' + '<filter id="' + p + 'tex" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>' + '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in" result="t"/>' + '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="t"/></feMerge></filter>' + '<filter id="' + p + 'glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
 const mon = (p, defs, body) => '<svg class="mon-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs>' + commonDefs(p) + defs + "</defs>" + '<ellipse cx="200" cy="378" rx="128" ry="14" fill="rgba(0,0,0,.35)"/>' + '<g filter="url(#' + p + 'tex)">' + body + "</g></svg>";
 const SVG = {};
 SVG.mon_dragon = () => {
  const p = "dr";
  const defs = lin(p + "body", [ [ 0, "#ffb05a" ], [ .35, "#f0441c" ], [ .75, "#a8160a" ], [ 1, "#5c0804" ] ], 0, 0, 1, 1) + lin(p + "belly", [ [ 0, "#fff6c8" ], [ .45, "#ffd06a" ], [ 1, "#d8761e" ] ]) + rad(p + "wing", [ [ 0, "#ffcf5a" ], [ .35, "#f05a1c" ], [ .75, "#a0180a" ], [ 1, "#4a0602" ] ], .5, .8, .75) + lin(p + "horn", [ [ 0, "#fffbe8" ], [ .5, "#f0d89a" ], [ 1, "#8a5a24" ] ], 0, 0, 1, 1) + lin(p + "claw", [ [ 0, "#fff3c0" ], [ .4, "#e8b440" ], [ 1, "#5a3008" ] ], 0, 0, 1, 1) + rad(p + "eye", [ [ 0, "#ffffff" ], [ .3, "#fff27a" ], [ .75, "#ffa000" ], [ 1, "#b84800" ] ]) + rad(p + "maw", [ [ 0, "#fff8d0" ], [ .3, "#ffd23a" ], [ .7, "#ff6a10" ], [ 1, "#8a1000" ] ]) + lin(p + "gem", [ [ 0, "#f4d8ff" ], [ .4, "#a85cff" ], [ 1, "#3a0a7a" ] ], 0, 0, 1, 1);
  const wingL = "M168 176 L64 30 C58 72 40 108 14 140 C42 142 54 160 50 196 C72 186 92 200 98 232 C116 214 138 208 160 214 Z";
  const wingR = "M232 176 L336 30 C342 72 360 108 386 140 C358 142 346 160 350 196 C328 186 308 200 302 232 C284 214 262 208 240 214 Z";
  const tail = "M244 300 C290 334 342 356 368 320 C382 300 374 278 356 270 C366 294 352 316 328 316 C298 316 270 296 254 276 Z";
  const body = "M150 172 C130 206 132 266 148 304 C164 340 236 340 252 304 C268 266 270 206 250 172 C232 150 168 150 150 172 Z";
  const belly = "M176 176 C164 214 166 274 180 312 C192 326 208 326 220 312 C234 274 236 214 224 176 Z";
  const legL = "M152 276 C118 286 110 336 128 360 L176 360 C178 330 178 300 172 280 Z";
  const legR = "M248 276 C282 286 290 336 272 360 L224 360 C222 330 222 300 228 280 Z";
  const armL = "M160 190 C132 204 116 234 118 262 L142 266 C146 240 158 220 176 210 Z";
  const armR = "M240 190 C268 204 284 234 282 262 L258 266 C254 240 242 220 224 210 Z";
  const neck = "M156 196 C162 160 174 128 184 108 L216 108 C226 128 238 160 244 196 Z";
  const skull = "M146 86 C146 50 172 32 200 32 C228 32 254 50 254 86 C254 104 242 116 230 122 L170 122 C158 116 146 104 146 86 Z";
  const muzzle = "M164 96 C162 126 178 150 200 152 C222 150 238 126 236 96 C224 104 176 104 164 96 Z";
  const hornL1 = "M166 58 C144 44 128 22 124 2 C140 16 160 28 182 42 Z";
  const hornR1 = "M234 58 C256 44 272 22 276 2 C260 16 240 28 218 42 Z";
  const hornL2 = "M154 76 C134 72 118 60 108 44 C126 52 142 56 160 62 Z";
  const hornR2 = "M246 76 C266 72 282 60 292 44 C274 52 258 56 240 62 Z";
  const claws = (x, y, dir) => [ 0, 1, 2 ].map(i => {
   const cx = x + i * 10 * dir;
   return P("M" + cx + " " + y + " C" + (cx - 2 * dir) + " " + (y + 10) + " " + (cx + 2 * dir) + " " + (y + 18) + " " + (cx + 8 * dir) + " " + (y + 22) + " C" + (cx + 6 * dir) + " " + (y + 12) + " " + (cx + 8 * dir) + " " + (y + 6) + " " + (cx + 8 * dir) + " " + y + " Z", "url(#" + p + "claw)", 3);
  }).join("");
  const spikes = [ [ 262, 300 ], [ 292, 322 ], [ 322, 332 ], [ 350, 318 ] ].map(([x, y]) => P("M" + (x - 8) + " " + y + " L" + x + " " + (y - 18) + " L" + (x + 8) + " " + (y - 2) + " Z", "url(#" + p + "horn)", 3)).join("");
  return mon(p, defs, P(tail, "url(#" + p + "body)") + rim("M296 330 C330 338 356 330 366 308") + spikes + P(wingL, "url(#" + p + "wing)") + hatch(p, "M50 196 C72 186 92 200 98 232 C116 214 138 208 160 214 L140 190 C110 186 80 180 56 170 Z") + L("M168 176 L64 30 M126 118 L14 140 M136 150 L50 196 M152 182 L98 232", 6) + L("M166 172 L66 36 M126 116 L22 138", 2, "#ffd27a", .9) + P(wingR, "url(#" + p + "wing)") + hatch(p, "M350 196 C328 186 308 200 302 232 C284 214 262 208 240 214 L260 190 C290 186 320 180 344 170 Z") + L("M232 176 L336 30 M274 118 L386 140 M264 150 L350 196 M248 182 L302 232", 6) + L("M234 172 L334 36 M274 116 L378 138", 2, "#ffd27a", .9) + P(legL, "url(#" + p + "body)") + hatch(p, "M128 360 C116 340 118 310 132 292 C140 316 150 340 176 360 Z") + P(legR, "url(#" + p + "body)") + hatch(p, "M272 360 C284 340 282 310 268 292 C260 316 250 340 224 360 Z") + rim("M280 300 C290 320 288 340 276 356") + claws(126, 356, 1) + claws(274, 356, -1) + P(neck, "url(#" + p + "body)") + F("M188 116 C182 140 180 166 182 190 L218 190 C220 166 218 140 212 116 Z", "url(#" + p + "belly)", .9) + L("M188 136 C196 140 204 140 212 136 M184 156 C194 160 206 160 216 156", 2.5) + hatch(p, "M156 196 C162 160 174 128 184 108 L190 108 C180 136 174 166 172 196 Z") + P(body, "url(#" + p + "body)") + hatch(p, "M150 172 C130 206 132 266 148 304 C156 322 172 332 186 334 C164 300 156 240 170 168 Z") + F(belly, "url(#" + p + "belly)") + L("M172 196 C190 204 210 204 228 196 M170 222 C190 230 210 230 230 222 M170 248 C190 256 210 256 230 248 M172 274 C190 282 210 282 228 274 M178 298 C192 306 208 306 222 298", 3) + L(belly, 3) + rim("M252 180 C266 214 266 262 252 300") + P("M200 168 L214 184 L200 204 L186 184 Z", "url(#" + p + "gem)", 3.5) + F("M196 176 L200 172 L206 180 L198 184 Z", "#fff", .9) + P(armL, "url(#" + p + "body)") + hatch(p, "M118 262 C116 240 126 218 142 204 C140 226 140 248 142 266 Z") + claws(116, 258, 1) + P(armR, "url(#" + p + "body)") + rim("M270 214 C282 232 286 248 284 260") + claws(284, 258, -1) + P(hornL2, "url(#" + p + "horn)", 4) + P(hornR2, "url(#" + p + "horn)", 4) + P(hornL1, "url(#" + p + "horn)", 4) + P(hornR1, "url(#" + p + "horn)", 4) + L("M140 32 C150 40 160 46 172 50 M260 32 C250 40 240 46 228 50", 2) + P(skull, "url(#" + p + "body)") + hatch(p, "M146 86 C146 104 158 116 170 122 L180 122 C164 108 158 88 160 60 C152 66 146 76 146 86 Z") + P("M148 88 L122 98 L146 108 Z", "url(#" + p + "horn)", 3.5) + P("M252 88 L278 98 L254 108 Z", "url(#" + p + "horn)", 3.5) + P(muzzle, "url(#" + p + "body)") + '<g filter="url(#' + p + 'glow)">' + P("M180 128 C186 146 214 146 220 128 C212 134 188 134 180 128 Z", "url(#" + p + "maw)", 3.5) + "</g>" + F("M186 130 L190 138 L194 131 Z M206 131 L210 138 L214 130 Z", "#fffbe8") + F("M188 108 C186 112 190 114 192 112 Z M212 108 C214 112 210 114 208 112 Z", OL) + P("M162 70 L194 80 L190 90 L160 80 Z", "#7a0e06", 3.5) + P("M238 70 L206 80 L210 90 L240 80 Z", "#7a0e06", 3.5) + '<g filter="url(#' + p + 'glow)">' + '<path d="M166 88 C172 82 186 84 192 92 C184 98 172 96 166 88 Z" fill="url(#' + p + 'eye)" stroke="' + OL + '" stroke-width="3"/>' + '<path d="M234 88 C228 82 214 84 208 92 C216 98 228 96 234 88 Z" fill="url(#' + p + 'eye)" stroke="' + OL + '" stroke-width="3"/>' + "</g>" + F("M178 84 C180 88 180 94 178 96 C176 92 176 88 178 84 Z M222 84 C220 88 220 94 222 96 C224 92 224 88 222 84 Z", OL) + rim("M244 58 C254 72 256 90 248 106") + rim("M232 104 C234 120 226 138 214 148", 2.5) + F("M166 52 C176 42 192 40 200 42 C186 46 176 52 170 60 Z", "#ffd9a0", .8) + F("M160 186 C152 210 150 236 152 256 C146 234 148 206 160 186 Z", "#ffcc80", .6) + glint(204, 176, 7) + glint(184, 86, 4));
 };
 SVG.mon_slime = () => {
  const p = "sl";
  const defs = rad(p + "body", [ [ 0, "#e8fbff" ], [ .25, "#7fd8ff" ], [ .65, "#1f8fe0" ], [ 1, "#0a3a8a" ] ], .38, .32, .78) + lin(p + "crown", [ [ 0, "#fff8c8" ], [ .45, "#f2c230" ], [ 1, "#8a5a00" ] ], 0, 0, 1, 1) + rad(p + "core", [ [ 0, "#ffffff" ], [ .4, "#9ff0ff" ], [ 1, "#2aa0e0", 0 ] ]) + lin(p + "gem", [ [ 0, "#ffd6e0" ], [ .4, "#ff3a6a" ], [ 1, "#6a0020" ] ], 0, 0, 1, 1);
  const body = "M70 354 C40 330 40 262 74 214 C104 170 150 140 176 132 C182 112 196 96 214 84 C210 104 214 120 226 134 C282 150 340 206 350 268 C358 316 340 346 316 356 C260 370 130 372 70 354 Z";
  return mon(p, defs, P(body, "url(#" + p + "body)", 6) + F("M300 190 C340 230 352 300 320 352 C296 362 270 364 250 364 C300 330 316 260 300 190 Z", "#0a3a8a", .55) + hatch(p, "M330 230 C352 280 346 336 316 356 C290 362 270 364 256 364 C306 330 324 280 330 230 Z") + F("M70 330 C120 350 270 352 336 330 C330 346 320 354 310 357 C250 370 130 370 72 354 Z", "#0a2e70", .6) + '<circle cx="150" cy="300" r="14" fill="url(#' + p + 'core)" opacity=".8"/><circle cx="270" cy="250" r="9" fill="url(#' + p + 'core)" opacity=".7"/><circle cx="118" cy="250" r="6" fill="#dff8ff" opacity=".8"/>' + F("M104 220 C122 186 150 164 178 152 C160 172 140 196 124 230 C118 240 98 234 104 220 Z", "#ffffff", .9) + F("M92 262 C90 252 100 246 104 254 C106 262 96 270 92 262 Z", "#ffffff", .85) + rim("M318 200 C342 232 352 276 344 316", 4) + P("M170 120 L176 74 L196 98 L212 62 L228 98 L250 76 L250 124 C226 132 192 130 170 120 Z", "url(#" + p + "crown)", 4) + L("M172 112 C196 120 228 120 250 114", 2.5) + P("M204 102 L212 90 L220 102 L212 112 Z", "url(#" + p + "gem)", 2.5) + '<circle cx="176" cy="74" r="5" fill="#ff3a6a" stroke="' + OL + '" stroke-width="2.5"/><circle cx="250" cy="76" r="5" fill="#ff3a6a" stroke="' + OL + '" stroke-width="2.5"/><circle cx="212" cy="60" r="6" fill="#ff3a6a" stroke="' + OL + '" stroke-width="2.5"/>' + P("M140 232 C142 206 172 200 184 222 C190 240 178 262 160 262 C146 262 138 248 140 232 Z", "#ffffff", 4) + P("M234 222 C246 200 276 206 278 232 C280 248 272 262 258 262 C240 262 228 240 234 222 Z", "#ffffff", 4) + '<ellipse cx="166" cy="236" rx="13" ry="17" fill="#0a1a3a"/><ellipse cx="252" cy="236" rx="13" ry="17" fill="#0a1a3a"/>' + '<ellipse cx="166" cy="242" rx="9" ry="10" fill="#2a8aff"/><ellipse cx="252" cy="242" rx="9" ry="10" fill="#2a8aff"/>' + '<circle cx="171" cy="228" r="6" fill="#fff"/><circle cx="257" cy="228" r="6" fill="#fff"/><circle cx="160" cy="246" r="2.5" fill="#fff"/><circle cx="246" cy="246" r="2.5" fill="#fff"/>' + L("M136 204 L170 212 M282 204 L248 212", 4) + P("M186 274 C196 296 222 296 232 274 C220 280 198 280 186 274 Z", "#5a0a1a", 3.5) + F("M196 286 C204 292 214 292 222 286 C214 282 204 282 196 286 Z", "#ff6a8a") + F("M120 266 C130 260 146 262 148 270 C140 276 126 276 120 266 Z M268 270 C272 262 288 260 298 266 C292 276 278 276 268 270 Z", "#ff7aa0", .6) + glint(120, 210, 9) + glint(300, 180, 6) + glint(212, 64, 6));
 };
 SVG.mon_bird = () => {
  const p = "bd";
  const defs = lin(p + "feather", [ [ 0, "#d8ff8a" ], [ .35, "#5fd04a" ], [ .75, "#1f8a3a" ], [ 1, "#0a3a1a" ] ], 0, 0, 1, 1) + lin(p + "wing", [ [ 0, "#eaffc0" ], [ .3, "#7ad85a" ], [ .7, "#1f8a3a" ], [ 1, "#08361a" ] ], .5, 0, .5, 1) + lin(p + "chest", [ [ 0, "#ffffff" ], [ .5, "#f2f8e0" ], [ 1, "#b8c890" ] ]) + lin(p + "beak", [ [ 0, "#fff3c0" ], [ .4, "#ffc23a" ], [ 1, "#b06000" ] ], 0, 0, 1, 1) + lin(p + "gold", [ [ 0, "#fff8c8" ], [ .45, "#f2c230" ], [ 1, "#8a5a00" ] ], 0, 0, 1, 1) + rad(p + "eye", [ [ 0, "#ffffff" ], [ .35, "#ffef5a" ], [ 1, "#e08a00" ] ]);
  const feathers = side => {
   let s = "";
   for (let i = 0; i < 5; i++) {
    const x0 = 200 + side * (40 + i * 6), y0 = 150 + i * 14;
    const x1 = 200 + side * (150 + i * 8), y1 = 30 + i * 40;
    const x2 = 200 + side * (120 + i * 4), y2 = 70 + i * 42;
    s += P("M" + x0 + " " + y0 + " C" + (x0 + side * 40) + " " + (y0 - 60) + " " + (x1 - side * 20) + " " + (y1 + 4) + " " + x1 + " " + y1 + " C" + (x1 - side * 4) + " " + (y1 + 30) + " " + x2 + " " + (y2 + 10) + " " + (x0 + side * 10) + " " + (y0 + 30) + " Z", "url(#" + p + "wing)", 4);
    s += L("M" + (x0 + side * 6) + " " + (y0 + 10) + " C" + (x0 + side * 50) + " " + (y0 - 40) + " " + (x1 - side * 30) + " " + (y1 + 16) + " " + (x1 - side * 6) + " " + (y1 + 6), 2, OL, .7);
   }
   return s;
  };
  const body = "M200 120 C252 120 276 168 272 222 C268 286 236 326 200 326 C164 326 132 286 128 222 C124 168 148 120 200 120 Z";
  const head = "M200 58 C236 58 254 84 252 116 C250 146 228 164 200 164 C172 164 150 146 148 116 C146 84 164 58 200 58 Z";
  return mon(p, defs, P("M176 300 L150 372 L184 336 L200 378 L216 336 L250 372 L224 300 Z", "url(#" + p + "feather)", 4) + L("M200 310 L200 368 M186 314 L160 360 M214 314 L240 360", 2) + feathers(-1) + feathers(1) + P("M170 310 L162 352 L146 362 M162 352 L166 366 M162 352 L178 362", "none", 6) + L("M170 310 L162 352 L146 362 M162 352 L166 366 M162 352 L178 362", 3, "#ffc23a") + P("M230 310 L238 352 L254 362 M238 352 L234 366 M238 352 L222 362", "none", 6) + L("M230 310 L238 352 L254 362 M238 352 L234 366 M238 352 L222 362", 3, "#ffc23a") + P(body, "url(#" + p + "feather)") + F("M168 160 C158 200 162 270 184 314 C194 320 206 320 216 314 C238 270 242 200 232 160 C214 170 186 170 168 160 Z", "url(#" + p + "chest)") + L("M174 196 C182 202 190 202 196 196 M204 196 C210 202 218 202 226 196 M172 230 C180 236 190 236 196 230 M204 230 C210 236 220 236 228 230 M178 264 C186 270 194 270 198 264 M202 264 C206 270 214 270 222 264", 2.2, "#7a8a5a") + hatch(p, "M128 222 C130 270 160 320 196 326 C160 300 146 250 150 180 C138 190 128 204 128 222 Z") + rim("M262 180 C272 210 270 256 254 290") + P("M156 152 C180 170 220 170 244 152 L246 164 C220 184 180 184 154 164 Z", "url(#" + p + "gold)", 3.5) + P("M200 168 L210 182 L200 196 L190 182 Z", "#3ad0ff", 3) + F("M196 176 L200 172 L204 178 Z", "#fff") + P("M176 70 C168 44 172 20 184 4 C186 26 192 44 200 58 Z", "url(#" + p + "feather)", 4) + P("M200 58 C204 34 214 16 230 6 C226 30 222 48 214 64 Z", "url(#" + p + "feather)", 4) + P("M218 66 C232 50 250 42 268 42 C256 56 246 70 232 80 Z", "url(#" + p + "feather)", 4) + P(head, "url(#" + p + "feather)") + hatch(p, "M148 116 C150 146 172 164 200 164 C176 150 164 128 166 90 C154 96 148 104 148 116 Z") + F("M164 96 C176 82 194 78 210 80 C192 84 178 90 170 100 Z", "#eaffc0", .8) + P("M160 108 C168 96 184 96 192 108 C184 118 168 118 160 108 Z", "url(#" + p + "eye)", 3.5) + P("M240 108 C232 96 216 96 208 108 C216 118 232 118 240 108 Z", "url(#" + p + "eye)", 3.5) + '<circle cx="178" cy="108" r="5" fill="' + OL + '"/><circle cx="222" cy="108" r="5" fill="' + OL + '"/><circle cx="180" cy="105" r="2" fill="#fff"/><circle cx="224" cy="105" r="2" fill="#fff"/>' + L("M154 94 L190 102 M246 94 L210 102", 4.5) + P("M184 120 C190 114 210 114 216 120 L200 160 Z", "url(#" + p + "beak)", 4) + L("M188 128 L200 132 L212 128", 2.5) + F("M192 120 C196 118 200 118 202 120 L196 136 Z", "#fff8d8", .9) + rim("M246 96 C252 116 246 140 232 154", 3) + glint(200, 176, 6) + glint(92, 60, 8) + glint(318, 90, 6));
 };
 SVG.mon_golem = () => {
  const p = "gl";
  const defs = lin(p + "rock", [ [ 0, "#f2d6a8" ], [ .35, "#c9925a" ], [ .75, "#7a4a22" ], [ 1, "#3a200c" ] ], 0, 0, 1, 1) + lin(p + "rock2", [ [ 0, "#e0bc88" ], [ .5, "#a8743e" ], [ 1, "#4a2a10" ] ], 0, 0, 1, 1) + lin(p + "moss", [ [ 0, "#d8ff8a" ], [ .5, "#5fbf3a" ], [ 1, "#1f6a1a" ] ]) + rad(p + "eye", [ [ 0, "#ffffff" ], [ .3, "#fff27a" ], [ .8, "#ff9a00" ], [ 1, "#ff6a00", 0 ] ]) + lin(p + "gem", [ [ 0, "#e8fff8" ], [ .4, "#3ae0b0" ], [ 1, "#0a5a4a" ] ], 0, 0, 1, 1) + lin(p + "gold", [ [ 0, "#fff8c8" ], [ .45, "#f2c230" ], [ 1, "#8a5a00" ] ], 0, 0, 1, 1);
  const shoulderL = "M110 136 L70 150 L52 200 L80 228 L124 214 L136 166 Z";
  const shoulderR = "M290 136 L330 150 L348 200 L320 228 L276 214 L264 166 Z";
  const armL = "M70 214 L44 246 L36 300 L62 330 L100 322 L108 272 L96 226 Z";
  const armR = "M330 214 L356 246 L364 300 L338 330 L300 322 L292 272 L304 226 Z";
  const body = "M118 124 L162 100 L238 100 L282 124 L298 200 L284 290 L240 322 L160 322 L116 290 L102 200 Z";
  const head = "M154 42 L184 22 L222 22 L250 42 L256 96 L232 114 L168 114 L144 96 Z";
  const legL = "M140 300 L124 366 L182 366 L190 310 Z";
  const legR = "M260 300 L276 366 L218 366 L210 310 Z";
  const crack = d => L(d, 3) + L(d.replace(/(\d+) (\d+)/g, (m, x, y) => +x + 1.5 + " " + (+y + 1.5)), 1.4, "#ffd9a0", .7);
  return mon(p, defs, P(legL, "url(#" + p + "rock2)") + P(legR, "url(#" + p + "rock2)") + hatch(p, "M124 366 L140 300 L160 304 L150 366 Z") + P(armL, "url(#" + p + "rock)") + hatch(p, "M36 300 L62 330 L100 322 L70 304 L50 270 Z") + crack("M60 250 L74 270 L68 290") + P(armR, "url(#" + p + "rock)") + hatch(p, "M364 300 L338 330 L300 322 L330 304 L350 270 Z") + rim("M346 236 L360 262 L362 300") + P(body, "url(#" + p + "rock)") + hatch(p, "M102 200 L116 290 L160 322 L172 322 C140 280 128 230 136 150 L118 124 Z") + F("M238 100 L282 124 L298 200 L284 290 L240 322 L254 250 L262 170 Z", "#3a200c", .35) + crack("M150 160 L168 190 L160 214 L176 236") + crack("M240 220 L226 250 L236 276") + rim("M286 132 L298 200 L286 280") + P("M118 124 L162 100 L200 100 C190 116 170 120 158 132 C146 128 132 136 122 146 Z", "url(#" + p + "moss)", 3) + F("M140 112 C146 120 140 128 146 136 C150 128 152 120 150 112 Z", "#1f6a1a", .6) + P("M200 150 L226 180 L214 236 L186 236 L174 180 Z", "url(#" + p + "gem)", 4) + L("M200 150 L200 236 M174 180 L226 180", 2) + F("M190 166 L200 156 L206 172 L194 184 Z", "#ffffff", .85) + P("M168 140 L232 140 L240 156 L160 156 Z", "url(#" + p + "gold)", 3) + P(shoulderL, "url(#" + p + "rock)") + hatch(p, "M52 200 L80 228 L124 214 L90 206 Z") + P("M82 150 L104 140 L116 160 L92 176 Z", "url(#" + p + "moss)", 3) + P(shoulderR, "url(#" + p + "rock)") + rim("M330 154 L346 198") + P(head, "url(#" + p + "rock)") + hatch(p, "M144 96 L168 114 L176 114 C162 92 160 70 166 40 L154 42 Z") + P("M154 42 L184 22 L222 22 L250 42 C230 50 200 40 172 52 C164 48 158 46 154 42 Z", "url(#" + p + "moss)", 3) + F("M160 66 L196 74 L194 84 L158 76 Z M240 66 L204 74 L206 84 L242 76 Z", OL) + '<ellipse cx="180" cy="86" rx="18" ry="10" fill="url(#' + p + 'eye)"/><ellipse cx="220" cy="86" rx="18" ry="10" fill="url(#' + p + 'eye)"/>' + '<rect x="172" y="81" width="16" height="9" rx="2" fill="#fff8c0" stroke="' + OL + '" stroke-width="2.5"/><rect x="212" y="81" width="16" height="9" rx="2" fill="#fff8c0" stroke="' + OL + '" stroke-width="2.5"/>' + L("M180 104 L220 104", 3.5) + rim("M248 48 L254 92", 3) + glint(196, 168, 8) + glint(70, 120, 6));
 };
 const card = (glow, deep, body) => {
  const id = "cg" + glow.slice(1);
  return '<svg class="card-svg" viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + "<defs>" + rad(id, [ [ 0, "#ffffff" ], [ .25, glow ], [ .7, deep ], [ 1, "#1a0904" ] ], .5, .55, .75) + "</defs>" + '<rect width="160" height="120" fill="url(#' + id + ')"/>' + rays(80, 62, 16, 0, 120, "rgba(255,255,255,.18)") + body + glint(22, 20, 6) + glint(140, 100, 5) + "</svg>";
 };
 const rays = (cx, cy, n, r1, r2, c) => {
  let s = "";
  for (let i = 0; i < n; i++) {
   const a = i / n * Math.PI * 2, b = a + Math.PI / n / 2;
   s += "M" + cx + " " + cy + " L" + (cx + Math.cos(a) * r2).toFixed(1) + " " + (cy + Math.sin(a) * r2).toFixed(1) + " L" + (cx + Math.cos(b) * r2).toFixed(1) + " " + (cy + Math.sin(b) * r2).toFixed(1) + " Z ";
  }
  return F(s, c);
 };
 const p4 = (d, f, w) => P(d, f, w || 3.5);
 SVG.card_tackle = () => card("#ffd27a", "#a85a10", rays(80, 62, 12, 0, 50, "#fff3c0") + p4("M80 22 L92 48 L120 44 L100 64 L116 92 L84 78 L62 100 L64 72 L38 60 L66 50 Z", "#ff9f2e") + F("M80 34 L88 52 L106 50 L92 62 L100 80 L82 72 L68 86 L70 68 L54 60 L72 54 Z", "#fff3a0") + L("M14 40 L40 52 M8 66 L36 66 M14 92 L40 80", 4));
 SVG.card_guard = () => card("#8fe3ff", "#0a3a8a", p4("M80 12 C96 20 112 22 126 22 C126 64 110 94 80 110 C50 94 34 64 34 22 C48 22 64 20 80 12 Z", "#2f8fe0") + F("M80 24 C92 30 104 32 114 32 C114 64 102 86 80 98 Z", "#0a4a9a") + p4("M80 22 C92 28 104 30 114 30", "none", 2.5) + p4("M80 38 L88 56 L106 58 L92 70 L96 88 L80 78 L64 88 L68 70 L54 58 L72 56 Z", "#ffd23f", 3) + F("M80 44 L84 56 L76 58 Z", "#fff"));
 SVG.card_fireball = () => card("#ffb35c", "#8a1000", p4("M80 112 C48 112 34 88 40 64 C44 48 56 42 58 26 C66 36 68 46 66 56 C74 42 84 28 82 6 C102 22 120 46 120 72 C120 96 104 112 80 112 Z", "#e8301c") + F("M80 104 C60 104 52 88 56 74 C58 64 66 60 68 50 C72 58 72 66 72 72 C80 62 88 52 88 40 C100 54 106 68 106 80 C106 96 96 104 80 104 Z", "#ff8a1e") + F("M80 98 C70 98 66 90 68 82 C70 76 76 72 78 66 C84 74 92 80 92 88 C92 94 88 98 80 98 Z", "#fff2a0"));
 SVG.card_gust = () => card("#c6f58a", "#0a4a1a", L("M20 40 C60 40 100 40 112 30 C122 22 112 8 100 14 C92 18 96 30 106 28", 8) + L("M20 40 C60 40 100 40 112 30 C122 22 112 8 100 14 C92 18 96 30 106 28", 3.5, "#eaffd8") + L("M14 68 C70 68 120 68 136 82 C148 94 136 112 120 104 C110 98 116 86 128 90", 8) + L("M14 68 C70 68 120 68 136 82 C148 94 136 112 120 104 C110 98 116 86 128 90", 3.5, "#5fd04a") + L("M30 92 C56 92 76 92 88 96", 7) + L("M30 92 C56 92 76 92 88 96", 3, "#eaffd8"));
 SVG.card_wall = () => card("#ffd27a", "#5a2a08", p4("M18 112 L22 54 L58 40 L96 46 L140 38 L144 112 Z", "#c9925a") + F("M96 46 L140 38 L144 112 L100 112 Z", "#7a4a22") + L("M20 78 L144 74 M58 40 L56 78 M100 46 L102 76 M36 78 L38 112 M80 76 L80 112 M122 75 L120 112", 3) + F("M22 54 L58 40 L70 44 C50 52 36 54 22 60 Z", "#6cc04a"));
 SVG.card_drop = () => card("#fff3a6", "#8a6400", rays(80, 62, 8, 0, 46, "#fffbe0") + p4("M80 14 C92 38 112 56 112 78 C112 98 98 110 80 110 C62 110 48 98 48 78 C48 56 68 38 80 14 Z", "#ffd23f") + F("M96 60 C104 72 106 88 98 100 C108 86 106 70 96 60 Z", "#c08a00") + '<ellipse cx="68" cy="72" rx="6" ry="12" fill="#fff" transform="rotate(20 68 72)"/>' + glint(128, 34, 9) + glint(32, 90, 7));
 SVG.card_spark = () => card("#fff3a6", "#8a5a00", rays(80, 56, 10, 0, 52, "#fff9d0") + p4("M88 8 L58 64 L78 64 L68 112 L106 50 L84 50 L98 8 Z", "#ffd23f", 4) + F("M88 8 L98 8 L84 50 L106 50 L96 64 L80 58 Z", "#fff3a6"));
 SVG.card_shadow = () => card("#d6b3ff", "#2a0a5a", p4("M96 14 C70 18 52 40 52 64 C52 90 72 110 98 110 C80 100 70 82 70 62 C70 42 80 24 96 14 Z", "#7a4bc4") + F("M60 52 C58 72 66 94 86 106 C70 104 56 88 56 66 Z", "#3a1a7a") + p4("M100 30 L132 92 L124 96 Z", "#efeaff", 3) + p4("M118 26 L142 64 L136 66 Z", "#efeaff", 3));
 function scene(p) {
  const W = 1600, H = 900, id = p.id;
  let embers = "";
  for (let i = 0; i < 70; i++) {
   const x = i * 397 % W, y = i * 211 % (H * .8), r = 1 + i * 7 % 4;
   embers += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + p.ember + '" opacity="' + (.35 + i % 5 * .13).toFixed(2) + '"/>';
  }
  return '<svg class="bg-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"><defs>' + lin(id + "s", p.sky) + rad(id + "l", [ [ 0, p.light ], [ .4, p.light, .5 ], [ 1, p.light, 0 ] ]) + lin(id + "g", p.ground) + "</defs>" + '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 's)"/>' + rays(800, 560, 28, 0, 1400, p.ray) + '<ellipse cx="800" cy="520" rx="760" ry="420" fill="url(#' + id + 'l)"/>' + (p.far ? F(p.far, p.farC) : "") + (p.mid ? F(p.mid, p.midC) + L(p.mid, 4, "#1a0904", .5) : "") + F("M0 700 C300 664 600 684 800 680 C1000 676 1300 664 1600 694 L1600 900 L0 900 Z", "url(#" + id + "g)") + L("M0 700 C300 664 600 684 800 680 C1000 676 1300 664 1600 694", 5, "#1a0904", .6) + '<ellipse cx="800" cy="720" rx="420" ry="40" fill="' + p.light + '" opacity=".35"/>' + (p.extra || "") + embers + "</svg>";
 }
 SVG.bg_meadow = () => scene({
  id: "bm",
  sky: [ [ 0, "#2a8fe0" ], [ .55, "#8fd8ff" ], [ 1, "#fff6c8" ] ],
  light: "#fffbe0",
  ray: "rgba(255,255,255,.14)",
  ember: "#ffffff",
  far: "M0 560 L180 380 L320 470 L490 300 L660 460 L800 360 L980 480 L1140 330 L1320 450 L1460 360 L1600 440 L1600 900 L0 900 Z",
  farC: "#6aa8d0",
  mid: "M0 640 C200 560 380 600 560 580 C760 556 900 610 1080 590 C1260 570 1420 600 1600 580 L1600 900 L0 900 Z",
  midC: "#4aa83a",
  ground: [ [ 0, "#8fe05a" ], [ 1, "#2a7a1a" ] ]
 });
 SVG.bg_cliff = () => scene({
  id: "bc",
  sky: [ [ 0, "#0a6a8a" ], [ .5, "#5fd0c0" ], [ 1, "#f8f0b0" ] ],
  light: "#f8ffd0",
  ray: "rgba(255,255,255,.16)",
  ember: "#eaffd8",
  far: "M0 520 L120 300 L240 420 L380 220 L520 400 L700 300 L860 440 L1020 260 L1180 420 L1340 240 L1480 380 L1600 300 L1600 900 L0 900 Z",
  farC: "#3a8a7a",
  mid: "M0 620 L180 520 L360 600 L560 540 L760 610 L980 530 L1200 600 L1420 520 L1600 590 L1600 900 L0 900 Z",
  midC: "#6a9a5a",
  ground: [ [ 0, "#b8d070" ], [ 1, "#4a6a2a" ] ]
 });
 SVG.bg_cave = () => scene({
  id: "bv",
  sky: [ [ 0, "#1a0c04" ], [ .6, "#5a2c10" ], [ 1, "#a85a1a" ] ],
  light: "#ffb84a",
  ray: "rgba(255,200,120,.08)",
  ember: "#7af0ff",
  far: "M0 0 L1600 0 L1600 150 L1500 230 L1430 140 L1300 250 L1180 120 L1040 210 L900 110 L760 220 L620 120 L480 240 L340 130 L200 220 L80 120 L0 190 Z",
  farC: "#140804",
  mid: "M0 620 L140 470 L260 600 L400 520 L560 610 L1040 610 L1200 500 L1340 600 L1480 480 L1600 560 L1600 900 L0 900 Z",
  midC: "#4a2410",
  ground: [ [ 0, "#a86a30" ], [ 1, "#3a1a08" ] ],
  extra: P("M240 700 L264 590 L288 700 Z M1330 690 L1358 570 L1384 690 Z M1300 700 L1316 630 L1332 700 Z", "#5af0ff", 4)
 });
 SVG.bg_volcano = () => scene({
  id: "bo",
  sky: [ [ 0, "#3a0402" ], [ .45, "#b8200a" ], [ .8, "#ff7a1a" ], [ 1, "#ffd25a" ] ],
  light: "#ffe27a",
  ray: "rgba(255,220,120,.12)",
  ember: "#ffd25a",
  far: "M0 600 L260 520 L520 260 L640 240 L700 300 L900 300 L960 240 L1080 260 L1340 520 L1600 600 L1600 900 L0 900 Z",
  farC: "#2a0604",
  mid: "M0 660 C200 620 340 640 480 630 L1120 630 C1260 640 1400 620 1600 660 L1600 900 L0 900 Z",
  midC: "#5a0e06",
  ground: [ [ 0, "#7a1a08" ], [ 1, "#1a0402" ] ],
  extra: F("M640 240 C660 280 700 300 760 300 C800 300 840 300 900 300 C930 280 950 260 960 240 C900 250 700 250 640 240 Z", "#ffb02a") + F("M0 760 C200 748 260 770 400 762 C520 756 560 776 700 770 L700 790 C560 796 520 778 400 784 C260 790 200 770 0 782 Z", "#ff8a1a", .9)
 });
 SVG.bg_glass = () => {
  let cells = "";
  const cols = 7, rows = 10;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
   const x = c * 100 + r % 2 * 50, y = r * 86;
   const j = (r * 31 + c * 17) % 7;
   cells += '<path d="M' + (x + 4) + " " + (y + 10 + j) + " L" + (x + 50 - j) + " " + (y - 8) + " L" + (x + 96) + " " + (y + 12 - j) + " L" + (x + 92 + j) + " " + (y + 70) + " L" + (x + 50) + " " + (y + 90 - j) + " L" + (x + 6 - j) + " " + (y + 72) + ' Z" fill="url(#gls' + j % 3 + ')" stroke="#140101" stroke-width="7" stroke-linejoin="round"/>' + '<path d="M' + (x + 22) + " " + (y + 18) + " Q" + (x + 40) + " " + (y + 8) + " " + (x + 58) + " " + (y + 12) + '" stroke="rgba(255,220,200,.55)" stroke-width="5" fill="none" stroke-linecap="round"/>';
  }
  return '<svg class="bg-svg" viewBox="0 0 640 860" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>' + rad("gls0", [ [ 0, "#ff6a4a" ], [ .6, "#c41a10" ], [ 1, "#5a0404" ] ], .4, .35, .7) + rad("gls1", [ [ 0, "#ff8a6a" ], [ .6, "#d8281a" ], [ 1, "#6a0606" ] ], .45, .4, .7) + rad("gls2", [ [ 0, "#ff4a3a" ], [ .6, "#a80e0a" ], [ 1, "#3a0202" ] ], .5, .35, .7) + '</defs><rect width="640" height="860" fill="#1a0202"/>' + cells + "</svg>";
 };
 return {
  probe: probe,
  html: html,
  has: k => !!found[k],
  glint: glint
 };
})();