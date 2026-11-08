/* Amaan Clicker — Game Hub add-ons
   · next-goal hint bar
   · save backup reminders
   · hub sound sync
   Reads the save from localStorage; never touches the engine's internals. */
(function () {
  'use strict';

  var SAVE_KEY = 'amaan-clicker-v2';
  var PREF_KEY = 'amaan-hub-extras-v1';
  var SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

  function fmt(n) {
    n = Number(n) || 0;
    if (n < 1000) return String(Math.floor(n));
    var i = 0;
    while (n >= 1000 && i < SUF.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + ' ' + SUF[i];
  }
  function save$() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
  function prefs() {
    var p;
    try { p = JSON.parse(localStorage.getItem(PREF_KEY)); } catch (e) {}
    if (!p || typeof p !== 'object') p = {};
    if (!p.lastBackupNag) p.lastBackupNag = 0;
    if (!p.lastExport) p.lastExport = 0;
    return p;
  }
  function setPrefs(p) { try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {} }

  /* ---------------- hub master mute ---------------- */
  function applySound() {
    try { window.__hubMute = localStorage.getItem('gamehub-sound') === '0'; } catch (e) {}
  }
  applySound();
  window.addEventListener('message', function (e) { if (e.data && e.data.hub) applySound(); });
  window.addEventListener('storage', function (e) { if (e.key === 'gamehub-sound') applySound(); });

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.textContent = [
    '#hubGoal{display:flex;align-items:center;gap:10px;margin:10px 0 2px;padding:10px 14px;border-radius:12px;',
    'border:1px solid rgba(128,140,180,.28);background:linear-gradient(95deg,rgba(54,209,255,.12),rgba(255,122,184,.09));',
    'font-size:14px;line-height:1.4}',
    '#hubGoal .gi{font-size:17px;flex:0 0 auto}',
    '#hubGoal b{white-space:nowrap}',
    '#hubGoal .bar{flex:1 1 90px;height:7px;border-radius:999px;background:rgba(128,140,180,.25);overflow:hidden;min-width:60px}',
    '#hubGoal .bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(95deg,#36d1ff,#ff7ab8);transition:width .4s}',
    '#hubBackup{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:60;max-width:min(440px,92vw);',
    'display:none;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:15px;color:#eaf0ff;',
    'background:linear-gradient(135deg,#18224a,#2a1740);border:1px solid rgba(255,210,74,.5);',
    'box-shadow:0 18px 44px rgba(0,0,0,.5);font:14px/1.45 "Trebuchet MS",system-ui,sans-serif;animation:hubUp .3s ease both}',
    '#hubBackup.on{display:flex}',
    '#hubBackup b{display:block;margin-bottom:3px;font-size:15px}',
    '#hubBackup .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}',
    '#hubBackup button{font:inherit;font-weight:700;font-size:13px;cursor:pointer;border:0;border-radius:999px;padding:8px 14px}',
    '#hubBackup .go{background:linear-gradient(95deg,#ffd24a,#ffb347);color:#1b1020}',
    '#hubBackup .later{background:rgba(255,255,255,.12);color:#dfe8ff}',
    '@keyframes hubUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%)}}'
  ].join('');
  document.head.appendChild(css);

  /* ---------------- next-goal hint ---------------- */
  var GOALS = [
    { id: 'first-million', when: function (S) { return !(S.rb > 0) && (S.eg || 0) < 1e6; },
      text: function (S) { return 'Earn <b>' + fmt(1e6 - (S.eg || 0)) + '</b> more this run to unlock your first <b>Rebirth</b> and Gold Stars.'; },
      prog: function (S) { return (S.eg || 0) / 1e6; }, icon: '⭐' },
    { id: 'do-rebirth', when: function (S) { return !(S.rb > 0); },
      text: function () { return 'You can <b>Rebirth</b> now — it unlocks <b>Hire Amaans</b> and every Gold Star is +10% production forever.'; },
      prog: function () { return 1; }, icon: '🔁' },
    { id: 'lounge', when: function (S) { return !(S.stk || {}).tl; },
      text: function (S) { return 'Buy <b>Teacher\'s Lounge</b> (30 Gold Stars) in the Sticker Book to unlock <b>Challenges</b>. You have ' + fmt(S.stars || 0) + '.'; },
      prog: function (S) { return (S.stars || 0) / 30; }, icon: '🏅' },
    { id: 'fifty-buildings', when: function (S) { return count(S) < 50; },
      text: function (S) { return 'Own <b>' + (50 - count(S)) + '</b> more buildings to finish the <b>Campus developer</b> quest (Neon Glow look).'; },
      prog: function (S) { return count(S) / 50; }, icon: '🏗️' },
    { id: 'hall-pass', when: function (S) { return !(S.stk || {}).hp; },
      text: function () { return 'Buy <b>Hall Pass</b> in the Sticker Book to unlock <b>Graduation</b> — Diplomas give +50% production each.'; },
      prog: function (S) { return Math.min(1, (S.stars || 0) / 120); }, icon: '🎓' },
    { id: 'graduate', when: function (S) { return !(S.dipAll > 0); },
      text: function (S) { return 'Reach <b>300 Gold Stars</b> since your last Graduation for your first Diploma. At ' + fmt(S.starsEver || 0) + '.'; },
      prog: function (S) { return (S.starsEver || 0) / 300; }, icon: '🎓' },
    { id: 'legacy', when: function (S) { return !(S.tro || {}).lt; },
      text: function () { return 'Buy <b>Legacy Tie</b> in the Trophy Cabinet to unlock <b>Transcendence</b> and Halos.'; },
      prog: function (S) { return Math.min(1, (S.dip || 0) / 10); }, icon: '👑' },
    { id: 'halo1', when: function (S) { return !(S.halo > 0); },
      text: function (S) { return 'Reach <b>25 Diplomas</b> for your first Halo — it unlocks the <b>Essence Lab</b>. At ' + fmt(S.dipAll || 0) + '.'; },
      prog: function (S) { return (S.dipAll || 0) / 25; }, icon: '😇' },
    { id: 'halo3', when: function (S) { return (S.halo || 0) < 3; },
      text: function (S) { return 'Reach <b>Halo 3</b> to unlock <b>Pet Amaans</b>. You have ' + (S.halo || 0) + '.'; },
      prog: function (S) { return (S.halo || 0) / 3; }, icon: '🥚' },
    { id: 'halo10', when: function (S) { return (S.halo || 0) < 10; },
      text: function (S) { return 'Reach <b>Halo 10</b> for the third pet slot. You have ' + (S.halo || 0) + '.'; },
      prog: function (S) { return (S.halo || 0) / 10; }, icon: '✨' },
    { id: 'done', when: function () { return true; },
      text: function () { return 'Everything is unlocked. Now it is just you, the tongue, and the leaderboard.'; },
      prog: function () { return 1; }, icon: '🏆' }
  ];
  function count(S) {
    var o = S.o || {}, n = 0;
    for (var k in o) n += o[k] || 0;
    return n;
  }

  var goalEl = document.createElement('div');
  goalEl.id = 'hubGoal';
  goalEl.innerHTML = '<span class="gi">🎯</span><span id="hubGoalText">Next goal…</span><span class="bar"><i id="hubGoalBar" style="width:0%"></i></span>';
  var stage = document.querySelector('.stage') || document.querySelector('main') || document.body;
  var tabsEl = document.getElementById('tabs');
  if (tabsEl && tabsEl.parentNode) tabsEl.parentNode.insertBefore(goalEl, tabsEl);
  else stage.insertBefore(goalEl, stage.firstChild);

  function renderGoal() {
    var S = save$();
    for (var i = 0; i < GOALS.length; i++) {
      if (GOALS[i].when(S)) {
        document.getElementById('hubGoalText').innerHTML = 'Next: ' + GOALS[i].text(S);
        document.getElementById('hubGoalBar').style.width = Math.max(0, Math.min(100, GOALS[i].prog(S) * 100)) + '%';
        goalEl.querySelector('.gi').textContent = GOALS[i].icon;
        return;
      }
    }
  }

  /* ---------------- backup reminder ---------------- */
  var nag = document.createElement('div');
  nag.id = 'hubBackup';
  nag.innerHTML =
    '<span style="font-size:22px">💾</span>' +
    '<div><b>Back up your save</b>' +
    '<span id="hubBackupWhy">Your progress lives in this browser only. Clearing site data would wipe it.</span>' +
    '<div class="acts"><button class="go" id="hubBackupGo">Export save now</button>' +
    '<button class="later" id="hubBackupLater">Remind me later</button></div></div>';
  document.body.appendChild(nag);

  document.getElementById('hubBackupLater').onclick = function () {
    var p = prefs(); p.lastBackupNag = Date.now(); setPrefs(p);
    nag.classList.remove('on');
  };
  document.getElementById('hubBackupGo').onclick = function () {
    var p = prefs(); p.lastBackupNag = Date.now(); p.lastExport = Date.now(); setPrefs(p);
    nag.classList.remove('on');
    var tab = document.querySelector('[data-tab="set"]');
    if (tab) tab.click();
    setTimeout(function () {
      var b = document.getElementById('btnExport');
      if (b) { b.click(); b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }, 120);
  };

  var DAY = 86400000;
  function maybeNag() {
    if (nag.classList.contains('on')) return;
    var S = save$(), p = prefs();
    if (Date.now() - p.lastBackupNag < 3 * DAY) return;

    var why = null;
    if (!S.exported && (S.t || 0) >= 1e6) why = 'You have ' + fmt(S.t) + ' amaans all-time and have never exported. Your progress lives in this browser only.';
    else if (S.exported && Date.now() - (p.lastExport || 0) > 7 * DAY && (S.rb || 0) >= 1) why = 'It has been a while since your last backup, and you have made real progress since.';
    else if ((S.dipAll || 0) >= 1 && !p.lastExport) why = 'You have Diplomas now. That is worth protecting with a save code.';
    if (!why) return;

    document.getElementById('hubBackupWhy').textContent = why;
    nag.classList.add('on');
  }

  /* fire it a minute after loading, then every 20 minutes */
  setTimeout(maybeNag, 60000);
  setInterval(maybeNag, 20 * 60000);

  /* note when the player exports by themselves */
  var btn = document.getElementById('btnExport');
  if (btn) btn.addEventListener('click', function () {
    var p = prefs(); p.lastExport = Date.now(); setPrefs(p);
    nag.classList.remove('on');
  });

  /* ---------------- hub profile ping ---------------- */
  try {
    var pr = JSON.parse(localStorage.getItem('gamehub-profile-v1') || '{}');
    pr.last = 'amaan'; pr.lastAt = Date.now();
    localStorage.setItem('gamehub-profile-v1', JSON.stringify(pr));
  } catch (e) {}

  renderGoal();
  setInterval(renderGoal, 2000);
})();
