/* Amaan Clicker — GLOBAL leaderboard (Game Hub edition)
   Reads the game's save from localStorage and syncs scores to Supabase.
   Public anon/publishable key — safe to ship, protected by Row Level Security. */
(function () {
  'use strict';

  var CFG = (window.HUB_SUPA && window.HUB_SUPA.leaderboard) || {};
  var SUPA_URL = CFG.url || 'https://azmeeaghohopwdwxmvbr.supabase.co';
  var SUPA_KEY = CFG.key || 'sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw';
  var API = SUPA_URL + '/rest/v1/leaderboard';
  var HEAD = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };

  var SAVE_KEY = 'amaan-clicker-v2';
  var LB_KEY = 'amaan-hub-leaderboard-v2';
  var PUSH_EVERY = 30000;   // ms between score uploads
  var PULL_EVERY = 20000;   // ms between board refreshes while the tab is open
  var SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

  /* ---------------- helpers ---------------- */
  function fmt(n) {
    n = Number(n) || 0;
    if (n < 1000) return String(Math.floor(n));
    var i = 0;
    while (n >= 1000 && i < SUF.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + ' ' + SUF[i];
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function readSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
  function soundOn() { var s = readSave(); return !s.set || s.set.sound !== false; }
  function uid() {
    var s = '';
    for (var i = 0; i < 24; i++) s += 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)];
    return s + Date.now().toString(36);
  }

  var actx = null;
  function beep(kind) {
    if (!soundOn()) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var seq = { up: [[523, .09, 0], [784, .12, .09]], save: [[440, .06, 0], [660, .09, .06]], bad: [[200, .16, 0]] }[kind] || [[600, .06, 0]];
      seq.forEach(function (s) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = s[0];
        g.gain.setValueAtTime(.0001, actx.currentTime + s[2]);
        g.gain.exponentialRampToValueAtTime(.1, actx.currentTime + s[2] + .005);
        g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + s[2] + s[1]);
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + s[2]); o.stop(actx.currentTime + s[2] + s[1] + .02);
      });
    } catch (e) {}
  }
  function note(msg, bad) {
    var t = document.getElementById('lbNote');
    if (!t) return;
    t.textContent = msg; t.style.color = bad ? '#ff7a7a' : '#ffb347';
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  }

  var BAD = ['fuck', 'shit', 'cunt', 'nigg', 'bitch', 'wank', 'penis', 'dick', 'slut', 'rape', 'fag'];
  function cleanName(n) {
    n = String(n || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    var low = n.toLowerCase().replace(/[^a-z]/g, '');
    for (var i = 0; i < BAD.length; i++) if (low.indexOf(BAD[i]) !== -1) return null;
    return n;
  }

  /* ---------------- player stats ---------------- */
  function myStats() {
    var S = readSave();
    return {
      amaans: Number(S.t) || 0,
      clicks: Math.floor(Number(S.clicks) || 0),
      stars: Math.floor(Number(S.starsAll || S.starsTot || S.stars) || 0),
      diplomas: Math.floor(Number(S.dipAll || S.dipTot || S.dip) || 0),
      halos: Math.floor(Number(S.halo) || 0),
      trophies: S.ach ? Object.keys(S.ach).length : 0,
      rebirths: Math.floor(Number(S.rb) || 0)
    };
  }
  function rank(s) {
    if (s.halos >= 1) return '✦ Deity';
    if (s.diplomas >= 1) return '♛ Legend';
    if (s.stars >= 50) return '🎓 Graduate';
    if (s.rebirths >= 1 || s.stars > 0) return '★ Rising Star';
    if (s.amaans >= 1e6) return '☆ Humble';
    return '• Newcomer';
  }

  var COLS = [
    { k: 'amaans', label: 'All-time amaans' },
    { k: 'clicks', label: 'Total clicks' },
    { k: 'stars', label: 'Gold Stars' },
    { k: 'diplomas', label: 'Diplomas' },
    { k: 'halos', label: 'Halos' },
    { k: 'trophies', label: 'Trophies' }
  ];
  function show(k, v) { return k === 'trophies' ? (v + ' / 13') : fmt(v); }

  /* ---------------- local prefs ---------------- */
  function loadPrefs() {
    var b;
    try { b = JSON.parse(localStorage.getItem(LB_KEY)); } catch (e) {}
    if (!b || typeof b !== 'object') b = {};
    if (!b.key) b.key = uid();
    if (!b.name) b.name = '';
    if (!b.sort) b.sort = 'amaans';
    if (!Array.isArray(b.cache)) b.cache = [];
    return b;
  }
  function savePrefs() { try { localStorage.setItem(LB_KEY, JSON.stringify(P)); } catch (e) {} }
  var P = loadPrefs();

  /* ---------------- network ---------------- */
  var online = null, lastPush = 0, pushing = false, lastSent = '';

  function pull(cb) {
    var col = P.sort;
    fetch(API + '?select=name,amaans,clicks,stars,diplomas,halos,trophies,updated_at&order=' + col + '.desc&limit=100', { headers: HEAD })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (rows) { online = true; cb(rows); })
      .catch(function () { online = false; cb(null); });
  }

  function myGlobalRank(col, value, cb) {
    fetch(API + '?select=name&' + col + '=gt.' + encodeURIComponent(value), {
      headers: Object.assign({ Prefer: 'count=exact', Range: '0-0' }, HEAD)
    }).then(function (r) {
      var cr = r.headers.get('content-range') || '';
      var total = parseInt(cr.split('/')[1], 10);
      cb(isNaN(total) ? null : total + 1);
    }).catch(function () { cb(null); });
  }

  /* Plausibility guard. A determined cheat can edit this file, so the real
     limits live in supabase/leaderboard-anticheat.sql — this just stops a
     corrupted or hand-edited save from poisoning the public board. */
  var SANE = { amaans: 1e45, clicks: 5e7, stars: 1e7, diplomas: 1e6, halos: 5000, trophies: 13 };
  function implausible(s) {
    for (var k in SANE) if (!isFinite(s[k]) || s[k] < 0 || s[k] > SANE[k]) return k;
    var played = Math.max(60, Number(readSave().time) || 0);            // seconds played
    if (s.clicks > played * 25 + 5000) return 'clicks';                 // 25 cps is already inhuman
    return null;
  }

  function push(force, cb) {
    if (!P.name) { if (cb) cb(false); return; }
    var s = myStats();
    var bad = implausible(s);
    if (bad) { online = false; if (cb) cb(false, 'implausible'); return; }   // never upload junk
    var body = {
      player_key: P.key, name: P.name,
      amaans: s.amaans, clicks: s.clicks, stars: s.stars,
      diplomas: s.diplomas, halos: s.halos, trophies: s.trophies,
      updated_at: new Date().toISOString()
    };
    var sig = JSON.stringify([s.amaans, s.clicks, s.stars, s.diplomas, s.halos, s.trophies, P.name]);
    if (!force && (sig === lastSent || pushing || Date.now() - lastPush < PUSH_EVERY)) { if (cb) cb(false); return; }
    pushing = true;
    fetch(API + '?on_conflict=player_key', {
      method: 'POST', keepalive: true,
      headers: Object.assign({ Prefer: 'resolution=merge-duplicates,return=minimal' }, HEAD),
      body: JSON.stringify(body)
    }).then(function (r) {
      pushing = false; lastPush = Date.now(); online = r.ok;
      if (r.ok) lastSent = sig;
      if (cb) cb(r.ok);
    }).catch(function () { pushing = false; online = false; if (cb) cb(false); });
  }

  /* ---------------- styles ---------------- */
  var style = document.createElement('style');
  style.textContent = [
    '#p-leaderboard .lb-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:4px 0 6px}',
    '#p-leaderboard .lb-name{flex:1 1 180px;min-width:150px;padding:9px 12px;border-radius:10px;border:1px solid rgba(128,140,180,.35);background:rgba(128,140,180,.1);color:inherit;font:inherit}',
    '#p-leaderboard .lb-status{display:inline-flex;align-items:center;gap:7px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85}',
    '#p-leaderboard .lb-dot{width:9px;height:9px;border-radius:50%;background:#888}',
    '#p-leaderboard .lb-dot.live{background:#3ddc84;box-shadow:0 0 0 0 rgba(61,220,132,.7);animation:lbPulse 2s infinite}',
    '#p-leaderboard .lb-dot.off{background:#ff7a7a}',
    '#p-leaderboard .lb-seg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}',
    '#p-leaderboard .lb-seg button{cursor:pointer;font:inherit;font-size:13px;padding:7px 13px;border-radius:999px;border:1px solid rgba(128,140,180,.35);background:rgba(128,140,180,.1);color:inherit;transition:all .18s}',
    '#p-leaderboard .lb-seg button:hover{border-color:rgba(128,140,180,.7)}',
    '#p-leaderboard .lb-seg button.on{background:linear-gradient(95deg,#ffb347,#ff7ab8);border-color:transparent;color:#1b1020;font-weight:700}',
    '#p-leaderboard .lb-table{display:flex;flex-direction:column;gap:7px;min-height:60px}',
    '#p-leaderboard .lb-row{display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center;padding:11px 14px;border-radius:13px;border:1px solid rgba(128,140,180,.22);background:rgba(128,140,180,.07);animation:lbIn .3s ease both}',
    '#p-leaderboard .lb-row .pos{font-weight:800;font-size:17px;text-align:center;opacity:.8}',
    '#p-leaderboard .lb-row .who{display:flex;flex-direction:column;gap:2px;min-width:0}',
    '#p-leaderboard .lb-row .who b{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#p-leaderboard .lb-row .who small{opacity:.6;font-size:12px}',
    '#p-leaderboard .lb-row .score{font-weight:800;font-size:16px;font-variant-numeric:tabular-nums}',
    '#p-leaderboard .lb-row.me{border-color:#ffb347;background:linear-gradient(95deg,rgba(255,179,71,.2),rgba(255,122,184,.14));animation:lbIn .3s ease both,lbGlow 2.6s ease-in-out infinite}',
    '#p-leaderboard .lb-row.p1 .pos{color:#ffce3a;text-shadow:0 0 12px rgba(255,206,58,.6)}',
    '#p-leaderboard .lb-row.p2 .pos{color:#cfd8e8}',
    '#p-leaderboard .lb-row.p3 .pos{color:#e0995c}',
    '#p-leaderboard .lb-mine{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:9px;margin:14px 0 4px}',
    '#p-leaderboard .lb-mine div{padding:10px 12px;border-radius:12px;background:rgba(128,140,180,.09);border:1px solid rgba(128,140,180,.2)}',
    '#p-leaderboard .lb-mine b{display:block;font-size:17px}',
    '#p-leaderboard .lb-mine small{opacity:.65;font-size:11px;letter-spacing:.06em;text-transform:uppercase}',
    '#p-leaderboard .lb-rankcard{margin:14px 0 2px;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,179,71,.4);background:linear-gradient(95deg,rgba(255,179,71,.14),rgba(255,122,184,.1));font-size:15px}',
    '#p-leaderboard .lb-rankcard b{font-size:22px}',
    '#lbNote{min-height:18px;font-size:13px;color:#ffb347;opacity:0;margin-top:10px}',
    '#lbNote.show{animation:lbNote 4s ease forwards}',
    '@keyframes lbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes lbGlow{0%,100%{box-shadow:0 0 0 1px rgba(255,179,71,.3)}50%{box-shadow:0 0 0 1px rgba(255,179,71,.75),0 10px 30px rgba(255,122,184,.3)}}',
    '@keyframes lbPulse{0%{box-shadow:0 0 0 0 rgba(61,220,132,.7)}70%{box-shadow:0 0 0 7px rgba(61,220,132,0)}100%{box-shadow:0 0 0 0 rgba(61,220,132,0)}}',
    '@keyframes lbNote{0%{opacity:0;transform:translateY(4px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}'
  ].join('\n');
  document.head.appendChild(style);

  /* ---------------- DOM ---------------- */
  var tabs = document.getElementById('tabs');
  if (!tabs) return;
  var tabBtn = document.createElement('button');
  tabBtn.className = 'tab';
  tabBtn.setAttribute('role', 'tab');
  tabBtn.dataset.tab = 'leaderboard';
  tabBtn.innerHTML = 'Leaderboard <i class="new-tag">LIVE</i>';
  var chatTab = tabs.querySelector('[data-tab="chat"]');
  if (chatTab && chatTab.nextSibling) tabs.insertBefore(tabBtn, chatTab.nextSibling); else tabs.appendChild(tabBtn);

  var panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'p-leaderboard';
  panel.setAttribute('role', 'tabpanel');
  panel.innerHTML =
    '<div class="panel-head"><h2>🏆 Global Leaderboard</h2>' +
      '<span class="lb-status"><i class="lb-dot" id="lbDot"></i><span id="lbState">Connecting…</span></span>' +
    '</div>' +
    '<p class="muted">Everyone playing this site competes on the same board. Pick a name to join — your score uploads automatically every 30 seconds.</p>' +
    '<div class="lb-head">' +
      '<input class="lb-name" id="lbName" maxlength="20" placeholder="Your name on the board">' +
      '<button class="btn primary" id="lbSave">Join / update</button>' +
    '</div>' +
    '<div class="lb-rankcard" id="lbRankCard">Choose a name to appear on the global board.</div>' +
    '<div class="lb-mine" id="lbMine"></div>' +
    '<div class="panel-head"><h2>Top 100</h2><button class="btn" id="lbRefresh">↻ Refresh</button></div>' +
    '<div class="lb-seg" id="lbSeg"></div>' +
    '<div class="lb-table" id="lbTable"></div>' +
    '<div id="lbNote"></div>' +
    '<p class="muted" style="margin-top:14px;font-size:12px">Scores are stored anonymously: a random browser id, your chosen name and your numbers. Nothing else is collected.</p>';

  var afterChat = document.getElementById('p-chat');
  var host = (afterChat || document.querySelector('.panel')).parentNode;
  if (afterChat && afterChat.nextSibling) host.insertBefore(panel, afterChat.nextSibling); else host.appendChild(panel);

  tabBtn.onclick = function () {
    tabs.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('on', t === tabBtn);
      t.setAttribute('aria-selected', t === tabBtn);
    });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p === panel); });
    refresh(true);
  };
  tabs.querySelectorAll('.tab').forEach(function (t) {
    if (t === tabBtn) return;
    var prev = t.onclick;
    t.onclick = function (e) { tabBtn.classList.remove('on'); panel.classList.remove('on'); if (prev) prev.call(t, e); };
  });

  var segWrap = document.getElementById('lbSeg');
  COLS.forEach(function (c) {
    var b = document.createElement('button');
    b.textContent = c.label; b.dataset.k = c.k;
    b.onclick = function () { P.sort = c.k; savePrefs(); refresh(true); };
    segWrap.appendChild(b);
  });

  var nameInput = document.getElementById('lbName');
  nameInput.value = P.name;
  document.getElementById('lbSave').onclick = function () {
    var n = cleanName(nameInput.value);
    if (!n) { beep('bad'); note('Pick a different name — that one is empty or not allowed.', true); return; }
    P.name = n; nameInput.value = n; savePrefs();
    push(true, function (ok, why) {
      if (ok) { beep('save'); note('You are on the global board as ' + n + '.'); }
      else if (why === 'implausible') { beep('bad'); note('This save looks edited, so it was not uploaded. The board only accepts scores the game can actually produce.', true); }
      else { beep('bad'); note('Could not reach the leaderboard server — will retry.', true); }
      refresh(true);
    });
  };
  document.getElementById('lbRefresh').onclick = function () { push(false); refresh(true); };

  /* ---------------- render ---------------- */
  var lastRank = null;
  function paintStatus() {
    var dot = document.getElementById('lbDot'), st = document.getElementById('lbState');
    if (online === true) { dot.className = 'lb-dot live'; st.textContent = 'Live · global'; }
    else if (online === false) { dot.className = 'lb-dot off'; st.textContent = 'Offline · cached'; }
    else { dot.className = 'lb-dot'; st.textContent = 'Connecting…'; }
  }

  function paint(rows) {
    var col = P.sort, s = myStats();
    segWrap.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.dataset.k === col); });

    document.getElementById('lbMine').innerHTML =
      '<div><small>Rank</small><b>' + rank(s) + '</b></div>' +
      '<div><small>All-time</small><b>' + fmt(s.amaans) + '</b></div>' +
      '<div><small>Clicks</small><b>' + fmt(s.clicks) + '</b></div>' +
      '<div><small>Gold Stars</small><b>' + fmt(s.stars) + '</b></div>' +
      '<div><small>Diplomas</small><b>' + fmt(s.diplomas) + '</b></div>' +
      '<div><small>Halos</small><b>' + fmt(s.halos) + '</b></div>';

    var html = '';
    if (!rows || !rows.length) {
      html = '<div class="lb-row"><span class="pos">—</span><span class="who"><b>' +
        (online === false ? 'No cached scores yet' : 'Nobody on the board yet') +
        '</b><small>' + (online === false ? 'Reconnect to load the global board' : 'Pick a name above and you will be #1') + '</small></span><span class="score"></span></div>';
    } else {
      rows.forEach(function (r, i) {
        var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        var mine = P.name && r.name === P.name && Math.abs((r[col] || 0) - (s[col] || 0)) <= Math.max(1, (s[col] || 0) * 0.02);
        var when = r.updated_at ? new Date(r.updated_at) : null;
        var ago = when ? Math.max(0, Math.floor((Date.now() - when.getTime()) / 60000)) : null;
        var sub = rank(r) + (ago === null ? '' : ' · ' + (ago < 1 ? 'just now' : ago < 60 ? ago + 'm ago' : Math.floor(ago / 60) + 'h ago'));
        html += '<div class="lb-row' + (mine ? ' me' : '') + ' p' + (i + 1) + '">' +
          '<span class="pos">' + medal + '</span>' +
          '<span class="who"><b>' + esc(r.name || 'Anonymous') + '</b><small>' + sub + '</small></span>' +
          '<span class="score">' + show(col, r[col] || 0) + '</span></div>';
      });
    }
    document.getElementById('lbTable').innerHTML = html;

    var card = document.getElementById('lbRankCard');
    if (!P.name) {
      card.innerHTML = 'Choose a name above to appear on the global board.';
    } else if (online) {
      myGlobalRank(col, s[col] || 0, function (pos) {
        if (pos === null) { card.innerHTML = 'Playing as <b>' + esc(P.name) + '</b>'; return; }
        card.innerHTML = 'Playing as <b>' + esc(P.name) + '</b> — world rank <b>#' + pos + '</b> on ' +
          COLS.filter(function (c) { return c.k === col; })[0].label.toLowerCase();
        if (lastRank !== null && pos < lastRank) { beep('up'); note('You climbed to world #' + pos + '!'); }
        lastRank = pos;
      });
    } else {
      card.innerHTML = 'Playing as <b>' + esc(P.name) + '</b> — offline, scores will upload when you reconnect.';
    }
    paintStatus();
  }

  function refresh(force) {
    if (!panel.classList.contains('on') && !force) return;
    paint(P.cache);
    pull(function (rows) {
      if (rows) { P.cache = rows; savePrefs(); }
      paint(rows || P.cache);
    });
  }

  refresh(true);
  setInterval(function () { if (!document.hidden && panel.classList.contains('on')) refresh(false); }, PULL_EVERY);
  setInterval(function () { if (!document.hidden) push(false); }, PUSH_EVERY);
  window.addEventListener('pagehide', function () { push(true); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) push(true); });
})();
