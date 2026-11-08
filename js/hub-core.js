/* The Game Hub — shared layer used by the hub pages and by both games.
   One profile, one sound switch, one badge. Everything is same-origin
   localStorage, so the games and the hub always see the same data. */
(function (root) {
  'use strict';

  var PROFILE_KEY = 'gamehub-profile-v1';
  var SOUND_KEY = 'gamehub-sound';
  var HAPTIC_KEY = 'gamehub-haptics';

  function ls(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function num(k, d) { var v = parseFloat(ls(k, d)); return isNaN(v) ? (d || 0) : v; }
  function json(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

  function todayFlappy() {
    var d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------------- profile ---------------- */
  function loadProfile() {
    var p = json(PROFILE_KEY) || {};
    if (!p.name) p.name = '';
    if (!p.last) p.last = '';
    if (!p.lastAt) p.lastAt = 0;
    return p;
  }
  function saveProfile(p) { lsSet(PROFILE_KEY, JSON.stringify(p)); }

  function setName(name) {
    name = String(name || '').trim().slice(0, 20);
    var p = loadProfile();
    p.name = name;
    saveProfile(p);
    // push the same name into both games
    lsSet('flappyHaiderName', name);
    var lb = json('amaan-hub-leaderboard-v2');
    if (lb) { lb.name = name; lsSet('amaan-hub-leaderboard-v2', JSON.stringify(lb)); }
    return name;
  }
  function markPlayed(game) {
    var p = loadProfile();
    p.last = game; p.lastAt = Date.now();
    saveProfile(p);
  }

  /* XP is derived from each game's own save, so it can never drift out of sync. */
  function flappyStats() {
    return {
      xp: num('flappyHaiderXP', 0),
      best: num('flappyHaiderBest', 0),
      coins: num('flappyHaiderCoins', 0),
      dailyDone: localStorage.getItem('fhDaily_' + todayFlappy()) !== null
    };
  }
  function amaanStats() {
    var S = json('amaan-clicker-v2') || {};
    var all = Number(S.t) || 0;
    var clicks = Number(S.clicks) || 0;
    var stars = Number(S.starsAll || S.starsTot || S.stars) || 0;
    // XP: 100 per order of magnitude earned, plus clicks and prestige
    var xp = Math.floor((all > 1 ? Math.log10(all) * 120 : 0) + clicks / 20 + stars * 25 + (Number(S.dipAll) || 0) * 400);
    var login = S.login || {};
    return {
      xp: xp,
      all: all,
      clicks: clicks,
      stars: stars,
      diplomas: Number(S.dipAll || S.dip) || 0,
      halos: Number(S.halo) || 0,
      dailyReady: login.last !== todayLocal(),
      questsLeft: (function () {
        var d = S.daily;
        if (!d || d.day !== todayLocal()) return 3;
        var c = d.claimed || {};
        return 3 - ['warm', 'dedicated', 'builder'].filter(function (q) { return c[q]; }).length;
      })(),
      started: !!(all || clicks)
    };
  }
  function levelOf(xp) { return Math.max(1, Math.floor(Math.sqrt(xp / 60)) + 1); }
  function xpForLevel(l) { return Math.pow(l - 1, 2) * 60; }

  function christianStats() {
    return {
      xp: num('christianXP', 0),
      best: num('christianBest', 0),
      perfects: num('christianPerfects', 0),
      plays: num('christianPlays', 0),
      started: num('christianPlays', 0) > 0
    };
  }
  function snariyanStats() {
    return {
      xp: num('snariyanXP', 0),
      best: num('snariyanBest', 0),
      plays: num('snariyanPlays', 0),
      started: num('snariyanPlays', 0) > 0
    };
  }
  function paccymattStats() {
    return {
      xp: num('paccyXP', 0),
      best: num('paccyBest', 0),
      plays: num('paccyPlays', 0),
      ghosts: num('paccyGhosts', 0),
      started: num('paccyPlays', 0) > 0
    };
  }
  function stackjoshStats() {
    return {
      xp: num('stackJoshXP', 0),
      best: num('stackJoshBest', 0),
      plays: num('stackJoshPlays', 0),
      perfects: num('stackJoshPerfects', 0),
      started: num('stackJoshPlays', 0) > 0
    };
  }
  function angryhaiderStats() {
    return {
      xp: num('angryHaiderXP', 0),
      best: num('angryHaiderBest', 0),
      plays: num('angryHaiderPlays', 0),
      fort: num('angryHaiderLevel', 0),
      started: num('angryHaiderPlays', 0) > 0 || num('angryHaiderLevel', 0) > 0
    };
  }

  function wackjoeStats() {
    return { xp: num('wackJoeXP', 0), best: num('wackJoeBest', 0), plays: num('wackJoePlays', 0), started: num('wackJoePlays', 0) > 0 };
  }
  function brawlkingsStats() {
    return { xp: num('brawlKingsXP', 0), wins: num('brawlKingsWins', 0), plays: num('brawlKingsPlays', 0), started: num('brawlKingsPlays', 0) > 0 };
  }

  function crewStats(xpKey,bestKey,playsKey){return {xp:num(xpKey,0),best:num(bestKey,0),plays:num(playsKey,0),started:num(playsKey,0)>0}}
  function profile() {
    var p = loadProfile(), f = flappyStats(), a = amaanStats(), c = christianStats(),
        s = snariyanStats(), m = paccymattStats(), j = stackjoshStats(), h = angryhaiderStats();
    var cs = crewStats('connectSamuelXP','connectSamuelBest','connectSamuelPlays'),
        ka = crewStats('kickAustinXP','kickAustinBest','kickAustinPlays');
    var w = wackjoeStats();
    var b = brawlkingsStats();
    var kart=crewStats('haiderKartXP','haiderKartBest','haiderKartPlays'),td=crewStats('amaanTowerXP','amaanTowerBestWave','amaanTowerPlays'),tag=crewStats('kingsTagXP','kingsTagBest','kingsTagPlays');
    var cc = crewStats('crewCatchXP','crewCatchBest','crewCatchPlays'),
        ar = crewStats('ariyanRunnerXP','ariyanRunnerBest','ariyanRunnerPlays'),
        ks = crewStats('kingsShootoutXP','kingsShootoutBest','kingsShootoutPlays'),
        gm = crewStats('geoMetryXP','geoMetryBest','geoMetryPlays');
    var xp = Math.floor(f.xp + a.xp + c.xp + s.xp + m.xp + j.xp + h.xp + w.xp + b.xp + kart.xp + td.xp + tag.xp + cs.xp + ka.xp + cc.xp + ar.xp + ks.xp + gm.xp);
    var lvl = levelOf(xp);
    return {
      name: p.name, last: p.last, lastAt: p.lastAt,
      brawlkings: b, haiderkart:kart, amaantd:td, kingstag:tag, connectsamuel: cs, kickaustin: ka,
      crewcatch: cc, ariyanrunner: ar, kingsshootout: ks, geometrydash: gm,
      flappy: f, amaan: a, christian: c, snariyan: s, paccymatt: m, stackjosh: j, angryhaider: h, wackjoe: w,
      xp: xp, level: lvl,
      intoLevel: xp - xpForLevel(lvl),
      levelSpan: Math.max(1, xpForLevel(lvl + 1) - xpForLevel(lvl))
    };
  }

  /* ---------------- sound / haptics ---------------- */
  function soundOn() { return ls(SOUND_KEY, '1') !== '0'; }
  function setSound(on) { lsSet(SOUND_KEY, on ? '1' : '0'); broadcast(); }
  function hapticsOn() { return ls(HAPTIC_KEY, '1') !== '0'; }
  function setHaptics(on) { lsSet(HAPTIC_KEY, on ? '1' : '0'); broadcast(); }
  function canVibrate() { return typeof navigator !== 'undefined' && !!navigator.vibrate; }

  function broadcast() {
    var msg = { hub: true, sound: soundOn(), haptics: hapticsOn() };
    try { window.postMessage(msg, '*'); } catch (e) {}
    try {
      var fr = document.querySelectorAll('iframe');
      for (var i = 0; i < fr.length; i++) fr[i].contentWindow.postMessage(msg, '*');
    } catch (e) {}
    try { if (window.parent !== window) window.parent.postMessage(msg, '*'); } catch (e) {}
  }

  /* ---------------- app badge (installed PWA only) ---------------- */
  function pendingRewards() {
    var a = amaanStats(), f = flappyStats(), n = 0;
    if (a.started && a.dailyReady) n++;
    if (!f.dailyDone) n++;
    return n;
  }
  function updateBadge() {
    try {
      var n = pendingRewards();
      if (navigator.setAppBadge) { n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge(); }
    } catch (e) {}
    return 0;
  }

  root.HubCore = {
    PROFILE_KEY: PROFILE_KEY,
    profile: profile, setName: setName, markPlayed: markPlayed,
    flappyStats: flappyStats, amaanStats: amaanStats, christianStats: christianStats,
    snariyanStats: snariyanStats, paccymattStats: paccymattStats, stackjoshStats: stackjoshStats,
    angryhaiderStats: angryhaiderStats, wackjoeStats: wackjoeStats,
    brawlkingsStats: brawlkingsStats,
    levelOf: levelOf,
    soundOn: soundOn, setSound: setSound,
    hapticsOn: hapticsOn, setHaptics: setHaptics, canVibrate: canVibrate,
    pendingRewards: pendingRewards, updateBadge: updateBadge,
    todayLocal: todayLocal, todayFlappy: todayFlappy
  };
})(window);
