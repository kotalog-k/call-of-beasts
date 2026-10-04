const Ads = (() => {
 const C = typeof ADS_CONFIG !== "undefined" && ADS_CONFIG || {};
 const cap = window.Capacitor;
 const native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
 const test = /[?&]adtest=1/.test(location.search);
 const demo = location.hash === "#demo" || /[?&]demo=/.test(location.search);
 const mode = demo ? "none" : native ? "admob" : C.adsenseClient ? "h5" : test ? "test" : "none";
 const KEY = "cob_ads";
 const TEST_IDS = {
  android: {
   banner: "ca-app-pub-3940256099942544/6300978111",
   reward: "ca-app-pub-3940256099942544/5224354917"
  },
  ios: {
   banner: "ca-app-pub-3940256099942544/2934735716",
   reward: "ca-app-pub-3940256099942544/1712485313"
  }
 };
 const today = () => (new Date).toISOString().slice(0, 10);
 function count() {
  try {
   const s = JSON.parse(localStorage.getItem(KEY) || "{}");
   return s.day === today() ? s.n || 0 : 0;
  } catch (e) {
   return 0;
  }
 }
 function bump() {
  try {
   localStorage.setItem(KEY, JSON.stringify({
    day: today(),
    n: count() + 1
   }));
  } catch (e) {}
 }
 const left = () => Math.max(0, (C.rewardPerDay || 3) - count());
 const available = () => mode !== "none" && !!C.reward && left() > 0;
 let admob = null, admobReady = null;
 function admobIds() {
  const plat = cap.getPlatform() === "ios" ? "ios" : "android";
  const mine = C.admob && C.admob[plat] || {};
  return {
   banner: mine.banner || TEST_IDS[plat].banner,
   reward: mine.reward || TEST_IDS[plat].reward,
   testing: !mine.reward
  };
 }
 function admobInit() {
  if (admobReady) return admobReady;
  admob = cap.Plugins && cap.Plugins.AdMob;
  if (!admob) return admobReady = Promise.resolve(false);
  admobReady = admob.initialize({
   initializeForTesting: admobIds().testing
  }).then(() => admob.requestConsentInfo ? admob.requestConsentInfo().then(ci => ci.isConsentFormAvailable && ci.status === "REQUIRED" ? admob.showConsentForm() : null).catch(() => null) : null).then(() => true).catch(() => false);
  return admobReady;
 }
 let h5Loaded = false;
 function h5Load() {
  if (h5Loaded) return;
  h5Loaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(C.adsenseClient);
  s.setAttribute("data-ad-frequency-hint", "60s");
  if (test) s.setAttribute("data-adbreak-test", "on");
  document.head.appendChild(s);
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = o => window.adsbygoogle.push(o);
  window.adConfig({
   preloadAdBreaks: "on",
   sound: "on"
  });
 }
 let busy = false;
 function rewarded(done) {
  if (busy || !available()) return done(false);
  busy = true;
  const fin = ok => {
   busy = false;
   if (ok) bump();
   done(ok);
  };
  try {
   Sound.bgm(null);
  } catch (e) {}
  if (mode === "test") return testAd(fin);
  if (mode === "admob") {
   admobInit().then(ok => {
    if (!ok) return fin(false);
    let got = false;
    const sub = admob.addListener("onRewardedVideoAdReward", () => {
     got = true;
    });
    admob.prepareRewardVideoAd({
     adId: admobIds().reward,
     isTesting: admobIds().testing
    }).then(() => admob.showRewardVideoAd()).then(r => {
     got = got || !!r;
    }).catch(() => {}).finally(() => {
     Promise.resolve(sub).then(s => s && s.remove && s.remove());
     fin(got);
    });
   });
   return;
  }
  if (mode === "h5") {
   h5Load();
   let got = false, was = null;
   window.adBreak({
    type: "reward",
    name: "free_pack",
    beforeAd: () => {
     try {
      was = Object.assign({}, Sound.muted);
      Sound.setMute({
       bgm: true,
       sfx: true
      });
     } catch (e) {}
    },
    afterAd: () => {
     try {
      if (was) Sound.setMute(was);
     } catch (e) {}
    },
    beforeReward: show => show(),
    adViewed: () => {
     got = true;
    },
    adDismissed: () => {},
    adBreakDone: () => fin(got)
   });
  }
 }
 function testAd(fin) {
  const el = document.createElement("div");
  el.className = "ad-test";
  el.innerHTML = "<div><small>テスト広告</small><b>3</b><button hidden>とじる</button></div>";
  document.body.appendChild(el);
  let n = 3;
  const t = setInterval(() => {
   n--;
   el.querySelector("b").textContent = n > 0 ? n : "見おわった";
   if (n <= 0) {
    clearInterval(t);
    const b = el.querySelector("button");
    b.hidden = false;
    b.onclick = () => {
     el.remove();
     fin(true);
    };
   }
  }, 1e3);
 }
 let bannerOn = false, bannerEl = null;
 function banner(on) {
  if (on === bannerOn || mode === "none") return;
  bannerOn = on;
  if (mode === "admob") {
   admobInit().then(ok => {
    if (!ok) return;
    if (on) admob.showBanner({
     adId: admobIds().banner,
     adSize: "ADAPTIVE_BANNER",
     position: "BOTTOM_CENTER",
     margin: 0,
     isTesting: admobIds().testing
    }).catch(() => {}); else admob.hideBanner().catch(() => {});
   });
   return;
  }
  if (!bannerEl) {
   bannerEl = document.createElement("div");
   bannerEl.className = "ad-banner";
   if (mode === "h5" && C.adsenseBannerSlot) {
    h5Load();
    bannerEl.innerHTML = '<ins class="adsbygoogle" style="display:block;width:100%;height:60px" data-ad-client="' + C.adsenseClient + '" data-ad-slot="' + C.adsenseBannerSlot + '"></ins>';
    document.body.appendChild(bannerEl);
    try {
     (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
   } else if (mode === "test") {
    bannerEl.innerHTML = "<span>テスト広告（はしの広告）</span>";
    document.body.appendChild(bannerEl);
   } else return;
  }
  bannerEl.classList.toggle("on", on);
  document.body.classList.toggle("has-banner", on);
 }
 function watch() {
  const ov = document.getElementById("overlay");
  if (!ov) return;
  const upd = () => banner(!ov.hidden && ov.classList.contains("title-ov"));
  new MutationObserver(upd).observe(ov, {
   attributes: true,
   attributeFilter: [ "class", "hidden" ]
  });
  upd();
 }
 if (mode !== "none") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
 }
 return {
  rewarded: rewarded,
  available: available,
  left: left,
  mode: mode
 };
})();