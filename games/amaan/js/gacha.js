/* Amaan Clicker — Capsule Machine (gacha)
   Battle Cats style: rarity tiers, duplicate levels, pity counter, two banners.
   Costs Diplomas. Talks to the engine through window.__amaanAPI only. */
(function () {
  'use strict';

  var KEY = 'amaan-gacha-v1';
  var MAX_LV = 30;

  /* ---------------- roster ---------------- */
  /* b = base bonus, t = 'prod' | 'click' | 'both' */
  var UNITS = [
    // Normal
    { id: 'n1', n: 'Supply Teacher Amaan', r: 0, ic: '📋', t: 'prod', b: .01, d: 'Covers every lesson. Nobody learns anything.' },
    { id: 'n2', n: 'Lost Property Amaan', r: 0, ic: '🧦', t: 'prod', b: .01, d: 'Found in a box behind the gym since Year 7.' },
    { id: 'n3', n: 'Packed Lunch Amaan', r: 0, ic: '🥪', t: 'click', b: .01, d: 'Same sandwich. Every single day.' },
    { id: 'n4', n: 'Bus Pass Amaan', r: 0, ic: '🎫', t: 'click', b: .01, d: 'Always sprinting for the 192.' },
    // Rare
    { id: 'r1', n: 'Prefect Amaan', r: 1, ic: '🎖️', t: 'prod', b: .03, d: 'A badge, a clipboard, and unlimited confidence.' },
    { id: 'r2', n: 'Goalkeeper Amaan', r: 1, ic: '🧤', t: 'prod', b: .03, d: 'Lets in six, claims four were offside.' },
    { id: 'r3', n: 'Science Lab Amaan', r: 1, ic: '🧪', t: 'click', b: .035, d: 'The bunsen burner is on the orange flame. Again.' },
    { id: 'r4', n: 'Drama Club Amaan', r: 1, ic: '🎭', t: 'click', b: .035, d: 'Projects to the back row of an empty hall.' },
    { id: 'r5', n: 'Canteen Queue Amaan', r: 1, ic: '🍟', t: 'prod', b: .03, d: 'Has perfected the art of the sneaky cut-in.' },
    { id: 'r6', n: 'Homework Club Amaan', r: 1, ic: '📚', t: 'prod', b: .035, d: 'Stays behind. Does nothing. Feels productive.' },
    { id: 'r7', n: 'Sports Day Amaan', r: 1, ic: '🏃', t: 'click', b: .035, d: 'Peaked in the Year 8 relay and talks about it daily.' },
    { id: 'r8', n: 'Photocopier Amaan', r: 1, ic: '🖨️', t: 'prod', b: .03, d: 'Jammed. Always jammed.' },
    // Super Rare
    { id: 's1', n: 'Head Boy Amaan', r: 2, ic: '👔', t: 'both', b: .10, d: 'Gave a speech. It was about himself.' },
    { id: 's2', n: 'Exam Hall Amaan', r: 2, ic: '📝', t: 'prod', b: .12, d: 'Turn over your papers… now.' },
    { id: 's3', n: 'Detention King Amaan', r: 2, ic: '⏱️', t: 'click', b: .13, d: 'Knows the detention room better than his own house.' },
    { id: 's4', n: 'Talent Show Amaan', r: 2, ic: '🎤', t: 'both', b: .10, d: 'Three encores. Nobody asked for one.' },
    { id: 's5', n: 'School Trip Amaan', r: 2, ic: '🚌', t: 'prod', b: .12, d: 'Last one back to the coach, every time.' },
    { id: 's6', n: 'Chess Captain Amaan', r: 2, ic: '♟️', t: 'click', b: .13, d: 'Mate in three. He has been saying it for an hour.' },
    { id: 's7', n: 'Assembly Amaan', r: 2, ic: '🏛️', t: 'prod', b: .12, d: 'Every announcement is somehow about him.' },
    // Uber Rare
    { id: 'u1', n: 'Headteacher Amaan', r: 3, ic: '👑', t: 'both', b: .35, d: 'Runs the school. Runs the town. Runs everything.' },
    { id: 'u2', n: 'Ofsted Amaan', r: 3, ic: '📊', t: 'prod', b: .45, d: 'Outstanding in all categories. He wrote the report.' },
    { id: 'u3', n: 'Caretaker Amaan', r: 3, ic: '🔑', t: 'click', b: .45, d: 'Has a key to every door, including ones that do not exist.' },
    { id: 'u4', n: 'Tongue Sensei Amaan', r: 3, ic: '🥋', t: 'both', b: .35, d: 'Mastered the ancient art of the stuck-out tongue.' },
    { id: 'u5', n: 'Yearbook Legend Amaan', r: 3, ic: '📸', t: 'prod', b: .45, d: 'Most likely to succeed. At being Amaan.' },
    // Legend Rare
    { id: 'l1', n: 'Amaan Prime', r: 4, ic: '🌌', t: 'both', b: 1.0, d: 'The original. Every other Amaan is a copy of a copy.' },
    { id: 'l2', n: 'The Eternal Tongue', r: 4, ic: '👅', t: 'both', b: 1.0, d: 'It was here before the school. It will outlast the sun.' }
  ];
  var UMAP = {}; UNITS.forEach(function (u) { UMAP[u.id] = u; });

  var RARITY = [
    { n: 'Normal', c: '#9aa7c4', g: 'linear-gradient(135deg,#6b7694,#aab6d2)' },
    { n: 'Rare', c: '#4ea8ff', g: 'linear-gradient(135deg,#1f6fd0,#7fd0ff)' },
    { n: 'Super Rare', c: '#ff8c42', g: 'linear-gradient(135deg,#e2552a,#ffc46b)' },
    { n: 'Uber Rare', c: '#ffd24a', g: 'linear-gradient(135deg,#b05bff,#ffd24a)' },
    { n: 'Legend Rare', c: '#7bf1c8', g: 'linear-gradient(120deg,#ff4fa3,#ffd24a,#3ddc84,#36d1ff)' }
  ];

  var BANNERS = {
    std: { id: 'std', n: 'Standard Capsule', cost: 1, ic: '🎰',
      rates: [0.10, 0.60, 0.2550, 0.0420, 0.0030],
      blurb: 'The everyday machine. One Diploma a go.' },
    fest: { id: 'fest', n: 'Uber Festival', cost: 3, ic: '🎆',
      rates: [0, 0.50, 0.3300, 0.1550, 0.0150],
      blurb: 'Triple price, no Normals, five times the Uber chance.' }
  };

  /* ---------------- state ---------------- */
  function load() {
    var g;
    try { g = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!g || typeof g !== 'object') g = {};
    if (!g.units) g.units = {};
    if (typeof g.rolls !== 'number') g.rolls = 0;
    if (typeof g.pity !== 'number') g.pity = 0;      // rolls since last Uber+
    if (!g.banner) g.banner = 'std';
    if (typeof g.spent !== 'number') g.spent = 0;
    return g;
  }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) {} }
  var G = load();

  function lv(id) { return G.units[id] ? G.units[id].lv : 0; }
  function bonusOf(u) { var l = lv(u.id); return l ? u.b * (1 + 0.1 * (l - 1)) : 0; }
  function totals() {
    var p = 0, c = 0;
    UNITS.forEach(function (u) {
      var b = bonusOf(u);
      if (!b) return;
      if (u.t === 'prod') p += b;
      else if (u.t === 'click') c += b;
      else { p += b; c += b; }
    });
    return { prod: p, click: c };
  }
  function apply() {
    var t = totals();
    window.__gachaProd = 1 + t.prod;
    window.__gachaClick = 1 + t.click;
    if (window.__amaanAPI) window.__amaanAPI.refresh();
  }
  apply();

  /* ---------------- rolling ---------------- */
  function pickRarity(banner, forceSR, forceUber) {
    if (forceUber) return 3;
    var r = Math.random(), acc = 0, rates = banner.rates.slice();
    if (forceSR) { // guaranteed Super Rare or better
      var tail = rates[2] + rates[3] + rates[4];
      rates = [0, 0, rates[2] / tail, rates[3] / tail, rates[4] / tail];
    }
    for (var i = 0; i < rates.length; i++) { acc += rates[i]; if (r < acc) return i; }
    return 1;
  }
  function pickUnit(rarity) {
    var pool = UNITS.filter(function (u) { return u.r === rarity; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function doRoll(banner, forceSR) {
    var forceUber = G.pity >= 49;
    var rar = pickRarity(banner, forceSR, forceUber);
    var u = pickUnit(rar);
    G.rolls++;
    G.pity = rar >= 3 ? 0 : G.pity + 1;
    var had = lv(u.id);
    if (!had) G.units[u.id] = { lv: 1 };
    else if (had < MAX_LV) G.units[u.id].lv = had + 1;
    return { u: u, rar: rar, isNew: !had, maxed: had >= MAX_LV, lv: lv(u.id), pityUsed: forceUber };
  }

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.textContent = [
    '#p-gacha .gBanners{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-bottom:16px}',
    '#p-gacha .gBan{cursor:pointer;text-align:left;font:inherit;color:inherit;padding:14px 16px;border-radius:16px;',
    'border:1px solid rgba(128,140,180,.3);background:rgba(128,140,180,.08);transition:all .2s}',
    '#p-gacha .gBan:hover{border-color:rgba(128,140,180,.65)}',
    '#p-gacha .gBan.on{border-color:#ffd24a;background:linear-gradient(135deg,rgba(255,210,74,.18),rgba(176,91,255,.14));box-shadow:0 10px 26px rgba(255,210,74,.14)}',
    '#p-gacha .gBan b{display:block;font-size:17px;margin-bottom:3px}',
    '#p-gacha .gBan small{display:block;opacity:.72;font-size:12.5px;line-height:1.4}',
    '#p-gacha .gBan .cost{display:inline-block;margin-top:9px;font-weight:800;font-size:12.5px;padding:4px 10px;border-radius:999px;background:rgba(176,91,255,.18);color:#b05bff;border:1px solid rgba(176,91,255,.35)}',
    '#p-gacha .gDeck{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:8px}',
    '#p-gacha .gDeck .btn.roll{background:linear-gradient(95deg,#ffd24a,#ff8c42);color:#231404;font-weight:800;border:0}',
    '#p-gacha .gDeck .btn.roll:disabled{opacity:.4}',
    '#p-gacha .gInfo{font-size:13px;opacity:.78;margin:8px 0 2px}',
    '#p-gacha .gPity{height:7px;border-radius:999px;background:rgba(128,140,180,.25);overflow:hidden;margin:7px 0 16px;max-width:340px}',
    '#p-gacha .gPity i{display:block;height:100%;background:linear-gradient(95deg,#b05bff,#ffd24a);transition:width .4s}',
    '#p-gacha .gTot{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:4px 0 16px}',
    '#p-gacha .gTot div{padding:11px 14px;border-radius:13px;background:rgba(128,140,180,.1);border:1px solid rgba(128,140,180,.22)}',
    '#p-gacha .gTot b{display:block;font-size:19px}',
    '#p-gacha .gTot small{opacity:.65;font-size:11px;letter-spacing:.06em;text-transform:uppercase}',
    '#p-gacha .gGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:11px}',
    '#p-gacha .gCard{position:relative;padding:13px 11px;border-radius:15px;text-align:center;border:1px solid rgba(128,140,180,.25);background:rgba(128,140,180,.08);overflow:hidden}',
    '#p-gacha .gCard.own{border-color:transparent}',
    '#p-gacha .gCard .ic{font-size:30px;display:block;margin-bottom:6px;filter:grayscale(1) opacity(.35)}',
    '#p-gacha .gCard.own .ic{filter:none}',
    '#p-gacha .gCard b{display:block;font-size:12.5px;line-height:1.25;min-height:31px}',
    '#p-gacha .gCard small{display:block;font-size:10.5px;opacity:.7;margin-top:4px}',
    '#p-gacha .gCard .lvb{position:absolute;top:7px;right:7px;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;background:rgba(0,0,0,.45);color:#fff}',
    '#p-gacha .gRar{display:flex;align-items:center;gap:8px;margin:18px 0 9px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;opacity:.85}',
    '#p-gacha .gRar i{flex:1 1 auto;height:1px;background:rgba(128,140,180,.3)}',
    /* machine */
    '#gachaStage{position:fixed;inset:0;z-index:80;display:none;place-items:center;background:rgba(4,7,18,.86);backdrop-filter:blur(6px)}',
    '#gachaStage.on{display:grid}',
    '#gachaStage .inner{text-align:center;max-width:min(430px,92vw);padding:22px}',
    '.capsule{width:132px;height:132px;margin:0 auto;border-radius:50%;position:relative;overflow:hidden;',
    'box-shadow:0 18px 44px rgba(0,0,0,.6);animation:capDrop .55s cubic-bezier(.3,1.5,.5,1) both,capShake .42s 0.55s 3}',
    '.capsule .top{position:absolute;inset:0 0 50% 0;background:rgba(255,255,255,.92);border-radius:132px 132px 0 0}',
    '.capsule .bot{position:absolute;inset:50% 0 0 0;border-radius:0 0 132px 132px}',
    '.capsule.open .top{animation:lidOff .5s ease forwards}',
    '.capsule.open .bot{animation:botDrop .5s ease forwards}',
    '@keyframes capDrop{from{transform:translateY(-240px) scale(.7);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes capShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-11deg)}75%{transform:rotate(11deg)}}',
    '@keyframes lidOff{to{transform:translateY(-150px) rotate(-38deg);opacity:0}}',
    '@keyframes botDrop{to{transform:translateY(130px);opacity:0}}',
    '.reveal{animation:revIn .5s cubic-bezier(.2,1.5,.4,1) both}',
    '@keyframes revIn{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}',
    '.reveal .ric{font-size:78px;filter:drop-shadow(0 10px 22px rgba(0,0,0,.5))}',
    '.reveal .rtag{display:inline-block;font-size:11.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;padding:5px 13px;border-radius:999px;color:#1a1206;margin-bottom:10px}',
    '.reveal h3{font-size:25px;margin:6px 0 4px;color:#fff}',
    '.reveal p{font-size:14px;opacity:.78;margin-bottom:10px;color:#dfe8ff}',
    '.reveal .gain{font-size:16px;font-weight:800;color:#9df5c4}',
    '.reveal .newtag{display:inline-block;margin-top:9px;font-size:12px;font-weight:800;letter-spacing:.1em;padding:4px 11px;border-radius:999px;background:#ff4fa3;color:#fff}',
    '#gachaStage .rolls{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px 0 4px;max-height:38vh;overflow:auto}',
    '#gachaStage .mini{width:72px;padding:9px 4px;border-radius:12px;text-align:center;animation:revIn .35s both}',
    '#gachaStage .mini span{display:block;font-size:24px}',
    '#gachaStage .mini small{display:block;font-size:9.5px;line-height:1.2;margin-top:3px;color:#1a1206;font-weight:700}',
    '#gachaStage .btn{margin-top:16px}',
    '.spark2{position:fixed;width:9px;height:9px;border-radius:2px;pointer-events:none;z-index:81;animation:sp2 1.1s ease-out forwards}',
    '@keyframes sp2{to{transform:translate(var(--dx),var(--dy)) rotate(420deg);opacity:0}}'
  ].join('');
  document.head.appendChild(css);

  /* ---------------- panel ---------------- */
  var tabs = document.getElementById('tabs');
  if (!tabs) return;
  var tabBtn = document.createElement('button');
  tabBtn.className = 'tab';
  tabBtn.setAttribute('role', 'tab');
  tabBtn.dataset.tab = 'gacha';
  tabBtn.innerHTML = 'Capsules <i class="new-tag">GACHA</i>';
  var after = tabs.querySelector('[data-tab="prestige"]');
  if (after && after.nextSibling) tabs.insertBefore(tabBtn, after.nextSibling); else tabs.appendChild(tabBtn);

  var panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'p-gacha';
  panel.setAttribute('role', 'tabpanel');
  panel.innerHTML =
    '<div class="panel-head"><h2>🎰 Capsule Machine</h2></div>' +
    '<p class="muted">Spend <b>Diplomas</b> on capsules. Every Amaan you pull boosts production or click power forever — duplicates level the Amaan up instead of being wasted. Nothing here resets.</p>' +
    '<div class="gBanners" id="gBanners"></div>' +
    '<div class="gDeck">' +
      '<button class="btn roll" id="gRoll1">Roll ×1</button>' +
      '<button class="btn roll" id="gRoll11">Roll ×11 <small style="opacity:.8">(10 Diplomas, SR+ guaranteed)</small></button>' +
      '<button class="btn" id="gRates">Drop rates</button>' +
    '</div>' +
    '<div class="gInfo" id="gInfo"></div>' +
    '<div class="gPity"><i id="gPityBar" style="width:0%"></i></div>' +
    '<div class="gTot" id="gTot"></div>' +
    '<div class="panel-head"><h2>Capsule Book</h2></div>' +
    '<div id="gBook"></div>';

  var host = (document.getElementById('p-prestige') || document.querySelector('.panel')).parentNode;
  var anchor = document.getElementById('p-prestige');
  if (anchor && anchor.nextSibling) host.insertBefore(panel, anchor.nextSibling); else host.appendChild(panel);

  tabBtn.onclick = function () {
    tabs.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('on', t === tabBtn);
      t.setAttribute('aria-selected', t === tabBtn);
    });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('on', p === panel); });
    render();
  };
  tabs.querySelectorAll('.tab').forEach(function (t) {
    if (t === tabBtn) return;
    var prev = t.onclick;
    t.onclick = function (e) { tabBtn.classList.remove('on'); panel.classList.remove('on'); if (prev) prev.call(t, e); };
  });

  /* stage */
  var stage = document.createElement('div');
  stage.id = 'gachaStage';
  stage.innerHTML = '<div class="inner" id="gachaInner"></div>';
  document.body.appendChild(stage);
  stage.addEventListener('click', function (e) { if (e.target === stage) closeStage(); });
  function closeStage() { stage.classList.remove('on'); render(); }

  /* ---------------- rendering ---------------- */
  function api() { return window.__amaanAPI; }
  function pct(x) { if (!x) return '0%'; return (x * 100).toFixed(x < 0.01 ? 2 : 1).replace(/\.0$/, '') + '%'; }

  function renderBanners() {
    var h = '';
    Object.keys(BANNERS).forEach(function (k) {
      var b = BANNERS[k];
      h += '<button class="gBan' + (G.banner === k ? ' on' : '') + '" data-b="' + k + '">' +
        '<b>' + b.ic + ' ' + b.n + '</b><small>' + b.blurb + '</small>' +
        '<span class="cost">' + b.cost + ' Diploma' + (b.cost > 1 ? 's' : '') + ' per roll</span></button>';
    });
    var el = document.getElementById('gBanners');
    el.innerHTML = h;
    el.querySelectorAll('.gBan').forEach(function (b) {
      b.onclick = function () { G.banner = b.dataset.b; store(); render(); };
    });
  }

  function renderBook() {
    var h = '';
    for (var r = 4; r >= 0; r--) {
      var list = UNITS.filter(function (u) { return u.r === r; });
      var ownN = list.filter(function (u) { return lv(u.id); }).length;
      h += '<div class="gRar" style="color:' + RARITY[r].c + '">' + RARITY[r].n + ' <i></i> ' + ownN + ' / ' + list.length + '</div><div class="gGrid">';
      list.forEach(function (u) {
        var l = lv(u.id), own = !!l;
        var tag = u.t === 'prod' ? 'production' : u.t === 'click' ? 'click power' : 'both';
        h += '<div class="gCard' + (own ? ' own' : '') + '"' + (own ? ' style="background:' + RARITY[u.r].g + '22;border-color:' + RARITY[u.r].c + '66"' : '') + ' title="' + (own ? u.d : 'Not collected yet') + '">' +
          (own ? '<span class="lvb">Lv ' + l + '</span>' : '') +
          '<span class="ic">' + (own ? u.ic : '❔') + '</span>' +
          '<b>' + (own ? u.n : '???') + '</b>' +
          '<small>' + (own ? '+' + pct(bonusOf(u)) + ' ' + tag : RARITY[u.r].n) + '</small>' +
          '</div>';
      });
      h += '</div>';
    }
    document.getElementById('gBook').innerHTML = h;
  }

  function render() {
    if (!panel.classList.contains('on')) return;
    renderBanners();
    var A = api(), dip = A ? A.dip : 0, b = BANNERS[G.banner];
    var t = totals(), ownN = Object.keys(G.units).length;

    document.getElementById('gRoll1').disabled = !A || dip < b.cost;
    document.getElementById('gRoll11').disabled = !A || dip < b.cost * 10;
    document.getElementById('gRoll11').innerHTML = 'Roll ×11 <small style="opacity:.8">(' + (b.cost * 10) + ' Diplomas, SR+ guaranteed)</small>';

    document.getElementById('gInfo').innerHTML =
      '<b>' + (A ? A.fmt(dip) : '0') + '</b> Diplomas available · <b>' + G.rolls + '</b> capsules opened · ' +
      'guaranteed Uber Rare in <b>' + Math.max(0, 50 - G.pity) + '</b> rolls';
    document.getElementById('gPityBar').style.width = Math.min(100, G.pity / 50 * 100) + '%';

    document.getElementById('gTot').innerHTML =
      '<div><small>Collected</small><b>' + ownN + ' / ' + UNITS.length + '</b></div>' +
      '<div><small>Production bonus</small><b>+' + pct(t.prod) + '</b></div>' +
      '<div><small>Click bonus</small><b>+' + pct(t.click) + '</b></div>' +
      '<div><small>Diplomas spent</small><b>' + G.spent + '</b></div>';

    renderBook();
  }

  function confetti(n, colors) {
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i');
      s.className = 'spark2';
      s.style.left = (window.innerWidth / 2) + 'px';
      s.style.top = (window.innerHeight / 2) + 'px';
      s.style.background = colors[i % colors.length];
      var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      document.body.appendChild(s);
      (function (e) { setTimeout(function () { e.remove(); }, 1200); })(s);
    }
  }

  function showSingle(res) {
    var R = RARITY[res.rar], u = res.u;
    var inner = document.getElementById('gachaInner');
    stage.classList.add('on');
    inner.innerHTML = '<div class="capsule"><span class="top"></span><span class="bot" style="background:' + R.g + '"></span></div>';
    var cap = inner.querySelector('.capsule');
    var A = api();
    if (A) A.snd(res.rar >= 3 ? 'prest' : res.rar === 2 ? 'gold' : 'buy');

    setTimeout(function () { cap.classList.add('open'); }, 1500);
    setTimeout(function () {
      var tag = u.t === 'prod' ? 'production' : u.t === 'click' ? 'click power' : 'production and click power';
      inner.innerHTML =
        '<div class="reveal">' +
        '<span class="rtag" style="background:' + R.g + '">' + R.n + '</span>' +
        '<div class="ric">' + u.ic + '</div>' +
        '<h3>' + u.n + '</h3><p>' + u.d + '</p>' +
        '<div class="gain">+' + pct(bonusOf(u)) + ' ' + tag + (res.isNew ? '' : ' · now level ' + res.lv) + '</div>' +
        (res.isNew ? '<div class="newtag">NEW AMAAN</div>' : res.maxed ? '<div class="newtag" style="background:#6c7aa0">MAX LEVEL</div>' : '<div class="newtag" style="background:#36d1ff;color:#07101f">LEVEL UP</div>') +
        (res.pityUsed ? '<div class="newtag" style="background:#ffd24a;color:#231404">GUARANTEED UBER</div>' : '') +
        '<div><button class="btn primary" id="gClose">Nice</button></div>' +
        '</div>';
      document.getElementById('gClose').onclick = closeStage;
      if (res.rar >= 3) confetti(res.rar === 4 ? 60 : 34, ['#ffd24a', '#b05bff', '#ff4fa3', '#36d1ff']);
      if (A && res.rar >= 3) A.snd('ach');
    }, 2000);
  }

  function showMulti(list) {
    var inner = document.getElementById('gachaInner');
    stage.classList.add('on');
    var bestR = Math.max.apply(null, list.map(function (x) { return x.rar; }));
    inner.innerHTML = '<div class="capsule"><span class="top"></span><span class="bot" style="background:' + RARITY[bestR].g + '"></span></div>';
    var cap = inner.querySelector('.capsule');
    var A = api();
    if (A) A.snd('gold');
    setTimeout(function () { cap.classList.add('open'); }, 1200);
    setTimeout(function () {
      var h = '<div class="reveal"><span class="rtag" style="background:' + RARITY[bestR].g + '">Best: ' + RARITY[bestR].n + '</span><div class="rolls">';
      list.forEach(function (res) {
        h += '<div class="mini" style="background:' + RARITY[res.rar].g + '"><span>' + res.u.ic + '</span>' +
          '<small>' + (res.isNew ? 'NEW' : 'Lv ' + res.lv) + '</small></div>';
      });
      var t = totals();
      h += '</div><div class="gain">Now +' + pct(t.prod) + ' production · +' + pct(t.click) + ' click</div>' +
        '<div><button class="btn primary" id="gClose">Nice</button></div></div>';
      inner.innerHTML = h;
      document.getElementById('gClose').onclick = closeStage;
      if (bestR >= 3) { confetti(bestR === 4 ? 60 : 34, ['#ffd24a', '#b05bff', '#ff4fa3', '#36d1ff']); if (A) A.snd('ach'); }
    }, 1700);
  }

  function roll(n) {
    var A = api();
    if (!A) return;
    var b = BANNERS[G.banner], cost = n === 11 ? b.cost * 10 : b.cost;
    if (A.dip < cost) { A.toast('Not enough Diplomas', 'You need ' + cost + '. Graduate again to earn more.'); return; }
    if (!A.spendDip(cost)) return;
    G.spent += cost;

    if (n === 1) {
      var res = doRoll(b, false);
      store(); apply(); showSingle(res);
    } else {
      var list = [], gotSR = false;
      for (var i = 0; i < 11; i++) {
        var forceSR = (i === 10 && !gotSR);
        var r = doRoll(b, forceSR);
        if (r.rar >= 2) gotSR = true;
        list.push(r);
      }
      store(); apply(); showMulti(list);
    }
    if (A) A.save();
  }

  document.getElementById('gRoll1').onclick = function () { roll(1); };
  document.getElementById('gRoll11').onclick = function () { roll(11); };
  document.getElementById('gRates').onclick = function () {
    var A = api(), h = '<p>Exact odds for every capsule. Duplicates raise an Amaan\'s level (max ' + MAX_LV + '), adding 10% of its base bonus per level.</p>';
    Object.keys(BANNERS).forEach(function (k) {
      var b = BANNERS[k];
      h += '<p style="margin-top:10px"><b>' + b.ic + ' ' + b.n + '</b> — ' + b.cost + ' Diploma' + (b.cost > 1 ? 's' : '') + '</p><ul style="margin:4px 0 0 18px">';
      b.rates.forEach(function (r, i) { if (r > 0) h += '<li>' + RARITY[i].n + ': <b>' + pct(r) + '</b></li>'; });
      h += '</ul>';
    });
    h += '<p style="margin-top:10px">A guaranteed Uber Rare arrives on your 50th roll without one. An 11-roll guarantees at least one Super Rare.</p>';
    if (A) A.modal('Drop rates', h, [{ t: 'Close', p: true }]);
  };

  /* keep the panel fresh (Diploma count changes outside this tab) */
  setInterval(render, 1500);
  render();
})();
