/* Haider Kart — three laps round The Game Hub circuit.
   Steer with the wheel (drag it), the arrow keys, or A/D. Hold TURBO (or Space) for a boost.
   Race rules, XP and best-time saves match the earlier version. */
(function () {
  'use strict';

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var W = 0, H = 0, D = 1, cx = 0, cy = 0, rx = 0, ry = 0, road = 66;
  var TAU = Math.PI * 2, LAPS = 3, FINISH = TAU * LAPS;

  var state = 'title', paused = false, last = 0, elapsed = 0, countT = 0, banner = 0, lapShown = 1;
  var progress = 0, speed = 0.58, lane = 0, turbo = 0, boosting = false, bumpWait = 0;
  var wheelAngle = 0, wheelDown = false, wheelPid = null, wa0 = 0, wcx = 0, wcy = 0;
  var keys = { left: false, right: false, boost: false };
  var cars = [], stars = [], parts = [], skids = [];
  var best = +(CrewGame.read('haiderKartBest') || 0);
  var names = ['Amaan', 'Zainab', 'Josh'], colors = ['#ff62c9', '#ffca43', '#85eb74'], faces = ['🚙', '🏎️', '🚗'];
  var PLAYER_COL = '#2bd8ff', PLAYER_NAME = 'Haider';

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function angleDiff(a, b) { return Math.atan2(Math.sin(a - b), Math.cos(a - b)); }
  function pos(t, l) { return [cx + (rx + l) * Math.cos(t), cy + (ry + l) * Math.sin(t)]; }
  // direction the kart points at track position t
  function heading(t) { return Math.atan2(ry * Math.cos(t), -rx * Math.sin(t)); }

  function fit() {
    D = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * D; cv.height = H * D;
    ctx.setTransform(D, 0, 0, D, 0, 0);
    cx = W / 2;
    var availH = Math.max(220, H - 190);
    cy = 70 + availH / 2;
    ry = Math.max(60, Math.min(availH * 0.42, W * 0.24));
    rx = Math.max(90, Math.min(W * 0.4, ry * 1.6));
    road = Math.max(54, Math.min(84, W * 0.15));
  }
  addEventListener('resize', fit);
  fit();

  function rr(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function spawn(x, y, o) {
    parts.push(Object.assign({ x: x, y: y, vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 6, col: '#fff', rot: 0, vr: 0, shape: 'dot' }, o));
  }
  function burst(t, l, col, n) {
    var p = pos(t, l);
    for (var i = 0; i < n; i++) spawn(p[0], p[1], { vx: rnd(-120, 120), vy: rnd(-120, 120), life: 0.6, max: 0.6, size: rnd(3, 6), col: col });
  }

  function reset() {
    paused = false;
    document.body.classList.remove('paused');
    keys = { left: false, right: false, boost: false };
    progress = 0; speed = 0.57; lane = 0; turbo = 0; boosting = false; elapsed = 0; bumpWait = 0;
    wheelAngle = 0; wheelDown = false;
    cars = [];
    for (var i = 0; i < 3; i++) {
      cars.push({ name: names[i], color: colors[i], face: faces[i], p: -0.2 * (i + 1),
        pace: 0.48 + Math.random() * 0.09, lane: (i - 1) * road * 0.24, finishedAt: null });
    }
    stars = [];
    for (var j = 0; j < 4; j++) stars.push({ a: 0.8 + j * 1.55, live: true, lap: 0, lane: ((j % 3) - 1) * road * 0.18 });
    parts = []; skids = []; banner = 0; lapShown = 1;
    state = 'count'; countT = 3.6;
    last = performance.now();
    document.getElementById('intro').classList.remove('on');
    document.getElementById('finish').classList.remove('on');
  }

  function finish() {
    if (state !== 'race') return;
    state = 'finish';
    var rank = CrewRules.raceRank(progress, cars, elapsed);
    var xp = rank === 1 ? 100 : rank === 2 ? 70 : rank === 3 ? 45 : 25;
    xp += Math.max(0, Math.floor(30 - elapsed / 10));
    var played = +(CrewGame.read('haiderKartPlays') || 0) + 1;
    CrewGame.save('haiderKartPlays', played);
    var total = +(CrewGame.read('haiderKartXP') || 0) + xp;
    CrewGame.save('haiderKartXP', total);
    best = !best ? elapsed : Math.min(best, elapsed);
    CrewGame.save('haiderKartBest', best);
    CrewGame.save('haiderKartBestPlace', Math.min(+(CrewGame.read('haiderKartBestPlace') || 4), rank));
    try {
      var p = JSON.parse(CrewGame.read('gamehub-profile-v1') || '{}');
      p.last = 'haiderkart'; p.lastAt = Date.now();
      CrewGame.save('gamehub-profile-v1', JSON.stringify(p));
    } catch (e) {}
    var suffix = ['st', 'nd', 'rd', 'th'][Math.min(3, rank - 1)];
    // confetti
    var cols = ['#ffe66b', '#ff62c9', '#2bd8ff', '#85eb74', '#ffffff'];
    for (var i = 0; i < 140; i++) {
      spawn(rnd(0, W), rnd(-40, -5), { vx: rnd(-90, 90), vy: rnd(120, 260), g: 260, life: 3.2, max: 3.2,
        size: rnd(6, 10), col: cols[i % cols.length], shape: 'rect', vr: rnd(-8, 8) });
    }
    setTimeout(function () {
      document.getElementById('result').textContent = rank === 1 ? '🏆 Haider takes the cup!' : '🏁 Race complete!';
      document.getElementById('summary').textContent = 'You finished ' + rank + suffix + ' · ' + Math.floor(elapsed) +
        ' seconds · +' + xp + ' XP · Best time ' + best.toFixed(1) + 's';
      document.getElementById('finish').classList.add('on');
    }, 1400);
  }

  function raceStep(dt) {
    elapsed += dt;
    bumpWait = Math.max(0, bumpWait - dt);
    banner = Math.max(0, banner - dt);

    // wheel springs back to centre when released
    if (!wheelDown) wheelAngle *= Math.max(0, 1 - dt * 5);
    var kb = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    var steer = clamp(wheelAngle / 0.85 + kb, -1, 1);
    lane = clamp(lane + steer * dt * 150, -road * 0.38, road * 0.38);
    var offroad = Math.abs(lane) > road * 0.29;

    var throttle = keys.boost && turbo > 0;
    boosting = throttle;
    if (throttle) { speed = Math.min(1.18, speed + dt * 0.7); turbo = Math.max(0, turbo - dt * 27); }
    else speed += (0.58 - speed) * Math.min(1, dt * 1.5);
    if (offroad) speed = Math.min(speed, 0.38);
    progress += speed * dt * (throttle ? 1.35 : 1);

    cars.forEach(function (c) {
      if (c.finishedAt != null) return;
      c.p += c.pace * dt;
      if (c.p >= FINISH) { c.p = FINISH; c.finishedAt = elapsed; }
    });

    stars.forEach(function (s) {
      var lap = Math.floor(progress / TAU);
      if (lap > s.lap) { s.lap = lap; s.live = true; }
      if (s.live && Math.abs(angleDiff(progress, s.a)) < 0.12 && Math.abs(lane - s.lane) < road * 0.24) {
        s.live = false;
        turbo = Math.min(100, turbo + 35);
        burst(s.a, s.lane, '#ffe66b', 14);
      }
    });

    if (bumpWait === 0) {
      cars.forEach(function (c) {
        if (c.finishedAt == null && Math.abs(c.p - progress) < 0.07 && Math.abs(c.lane - lane) < 15) {
          speed *= 0.72; bumpWait = 0.8;
          burst(progress, lane, '#ff7a59', 18);
        }
      });
    }

    // exhaust, dust and skid marks
    var p = pos(progress, lane), a = heading(progress), bx = Math.cos(a), by = Math.sin(a);
    if (boosting) spawn(p[0] - bx * 22 + rnd(-3, 3), p[1] - by * 22 + rnd(-3, 3),
      { vx: -bx * 30, vy: -by * 30, life: 0.5, max: 0.5, size: 7, col: '#ffb347' });
    if (offroad && speed > 0.35) spawn(p[0] + rnd(-8, 8), p[1] + rnd(-8, 8),
      { vx: rnd(-20, 20), vy: -30, life: 0.6, max: 0.6, size: 6, col: '#c9a66b' });
    if (Math.abs(steer) > 0.55 && speed > 0.6 && !offroad) {
      skids.push({ x: p[0], y: p[1], life: 3 });
      if (skids.length > 240) skids.shift();
    }

    var lap = Math.min(LAPS, Math.floor(progress / TAU) + 1);
    if (lap !== lapShown) { lapShown = lap; banner = 1.5; }
    if (progress >= FINISH) finish();
  }

  function updateParts(dt) {
    parts.forEach(function (p) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt;
    });
    parts = parts.filter(function (p) { return p.life > 0 && p.y < H + 40; });
    skids.forEach(function (s) { s.life -= dt; });
    skids = skids.filter(function (s) { return s.life > 0; });
  }

  function update(dt) {
    if (state === 'count') {
      countT -= dt;
      if (countT <= 0) { state = 'race'; banner = 0; }
    } else if (state === 'race') {
      raceStep(dt);
    }
    updateParts(dt);
  }

  /* ---------- drawing ---------- */

  function drawGround() {
    var g = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.4, cx, cy, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#3fb86a'); g.addColorStop(1, '#1b5e3c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // trees around the outside of the circuit
    for (var i = 0; i < 36; i++) {
      var a = i / 36 * TAU;
      var x = cx + Math.cos(a) * (rx + road * 1.6) * 1.02, y = cy + Math.sin(a) * (ry + road * 1.6) * 1.02;
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      var r = 14 + (i % 3) * 5;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r * 1.05, r * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#17532f'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2e8c4f'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.6, 0, TAU); ctx.fill();
    }
  }

  function drawTrack() {
    // drop shadow under the asphalt
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = road + 12;
    ctx.beginPath(); ctx.ellipse(cx + 2, cy + 9, rx, ry, 0, 0, TAU); ctx.stroke();
    // asphalt with a glossy highlight
    ctx.strokeStyle = '#3a4a63'; ctx.lineWidth = road;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = road * 0.45;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    // red and white kerbs on both edges
    function kerb(r1, r2) {
      ctx.lineWidth = 8; ctx.setLineDash([18, 18]);
      ctx.strokeStyle = '#ff4d5e'; ctx.lineDashOffset = 0;
      ctx.beginPath(); ctx.ellipse(cx, cy, r1, r2, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineDashOffset = 18;
      ctx.beginPath(); ctx.ellipse(cx, cy, r1, r2, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    kerb(rx + road / 2 - 4, ry + road / 2 - 4);
    kerb(rx - road / 2 + 4, ry - road / 2 + 4);
    // centre dashes
    ctx.strokeStyle = 'rgba(255,246,200,.85)'; ctx.lineWidth = 3; ctx.setLineDash([16, 16]);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // infield with the hub badge
    ctx.fillStyle = '#5fd17e';
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(10, rx - road * 0.7), Math.max(8, ry - road * 0.7), 0, 0, TAU); ctx.fill();
    rr(cx - 78, cy - 26, 156, 52, 16, 'rgba(255,255,255,.94)');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0b4d2c'; ctx.font = '900 15px system-ui';
    ctx.fillText('THE GAME HUB', cx, cy + 2);
    ctx.font = '26px system-ui'; ctx.fillText('🏁', cx, cy - 44);
    // start / finish line, checkered across the track
    var s = pos(0, 0);
    for (var j = 0; j < 6; j++) {
      ctx.fillStyle = j % 2 ? '#ffffff' : '#13213a';
      ctx.fillRect(s[0] - road / 2 + j * road / 6, s[1] - 7, road / 6, 14);
    }
  }

  function drawSkids() {
    skids.forEach(function (s) {
      ctx.fillStyle = 'rgba(12,16,24,' + (s.life / 3 * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, TAU); ctx.fill();
    });
  }

  function drawStars() {
    stars.forEach(function (s) {
      if (!s.live) return;
      var q = pos(s.a, s.lane);
      ctx.save();
      ctx.shadowColor = '#ffe66b'; ctx.shadowBlur = 14;
      ctx.font = '24px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⭐', q[0], q[1]);
      ctx.restore();
    });
  }

  function drawCar(c) {
    var p = pos(c.p, c.lane), a = heading(c.p);
    ctx.save();
    ctx.translate(p[0], p[1]);
    // shadow on the track
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(3, 7, 22, 10, a, 0, TAU); ctx.fill();
    ctx.rotate(a);
    if (c.player && boosting) {
      var fl = 12 + Math.random() * 7;
      ctx.fillStyle = 'rgba(255,160,60,.92)';
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-18 - fl, 0); ctx.lineTo(-18, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,170,.95)';
      ctx.beginPath(); ctx.moveTo(-18, -3); ctx.lineTo(-18 - fl * 0.55, 0); ctx.lineTo(-18, 3); ctx.fill();
    }
    // wheels
    [[-15, -14], [7, -14], [-15, 8], [7, 8]].forEach(function (w) { rr(w[0], w[1], 9, 6, 2, '#0d1320'); });
    // body with a highlight band
    rr(-19, -11, 38, 22, 9, c.color);
    rr(-16, -9, 32, 6, 4, 'rgba(255,255,255,.3)');
    rr(-6, -7, 15, 14, 4, '#1d2c47');
    rr(-3, -5, 8, 4, 2, '#8fe8ff');
    rr(16, -8, 3, 4, 1, '#fff7c9');
    rr(16, 4, 3, 4, 1, '#fff7c9');
    if (c.player) {
      ctx.strokeStyle = PLAYER_COL; ctx.lineWidth = 2.5;
      ctx.shadowColor = PLAYER_COL; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.roundRect(-21, -13, 42, 26, 11); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // driver avatar and name tag above the kart
    CrewGame.face(ctx, c.player ? PLAYER_NAME : c.name, p[0], p[1] - 27, 14, c.face);
    var label = c.player ? 'YOU' : c.name;
    ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(label).width + 14;
    rr(p[0] - w / 2, p[1] - 47, w, 16, 8, c.player ? PLAYER_COL : 'rgba(8,20,40,.72)');
    ctx.fillStyle = c.player ? '#06202b' : '#ffffff';
    ctx.fillText(label, p[0], p[1] - 39);
  }

  function drawParts(list) {
    list.forEach(function (p) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.col;
      if (p.shape === 'rect') {
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + 0.5 * p.life / p.max), 0, TAU); ctx.fill();
      }
      ctx.restore();
    });
  }

  function drawSpeedLines() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    var R = Math.max(rx, ry) * 1.05;
    for (var i = 0; i < 18; i++) {
      var a = i / 18 * TAU + Math.sin(elapsed * 2 + i) * 0.02;
      var r2 = R + 50 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.7);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function bigText(txt, x, y, col, size) {
    ctx.save();
    ctx.font = '900 ' + (size || 64) + 'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineJoin = 'round';
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = col; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGround();
    drawTrack();
    drawSkids();
    drawStars();
    var order = cars.concat([{ p: progress, lane: lane, player: true, color: PLAYER_COL, face: faces[0], name: PLAYER_NAME }]);
    order.sort(function (a, b) { return a.p - b.p; });
    order.forEach(drawCar);
    drawParts(parts);
    if (boosting) drawSpeedLines();
    if (state === 'count') {
      var t = countT > 2.6 ? '3' : countT > 1.6 ? '2' : countT > 0.6 ? '1' : 'GO!';
      bigText(t, cx, cy - 130, t === 'GO!' ? '#85eb74' : '#ffffff', 72);
    } else if (state === 'race' && banner > 0) {
      bigText('LAP ' + lapShown + '!', cx, cy - 130, '#ffe66b', 54);
    }
  }

  function updateHUD() {
    var rank = CrewRules.raceRank(progress, cars, elapsed);
    if (state === 'race' || state === 'finish') {
      document.getElementById('lap').textContent = 'LAP ' + Math.min(LAPS, Math.floor(progress / TAU) + 1) + ' / ' + LAPS;
      document.getElementById('place').textContent = '🏁 ' + rank + ['st', 'nd', 'rd', 'th'][Math.min(3, rank - 1)];
    }
    var tp = Math.floor(turbo);
    document.getElementById('turbo').textContent = '⚡ ' + tp + '%';
    document.getElementById('tfill').style.width = tp + '%';
    wheel.style.transform = 'rotate(' + (wheelAngle * 180 / Math.PI).toFixed(1) + 'deg)';
  }

  /* ---------- input ---------- */

  var wheel = document.getElementById('wheel');
  wheel.addEventListener('pointerdown', function (e) {
    var r = wheel.getBoundingClientRect();
    wcx = r.left + r.width / 2; wcy = r.top + r.height / 2;
    wa0 = Math.atan2(e.clientY - wcy, e.clientX - wcx);
    wheelDown = true; wheelPid = e.pointerId;
    wheel.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  wheel.addEventListener('pointermove', function (e) {
    if (!wheelDown || e.pointerId !== wheelPid) return;
    var a = Math.atan2(e.clientY - wcy, e.clientX - wcx);
    wheelAngle = clamp(wheelAngle + angleDiff(a, wa0), -1.4, 1.4);
    wa0 = a;
    e.preventDefault();
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
    wheel.addEventListener(ev, function (e) { if (e.pointerId === wheelPid) wheelDown = false; });
  });

  var turboBtn = document.getElementById('turbo-btn');
  turboBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault(); keys.boost = true; turboBtn.setPointerCapture(e.pointerId);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
    turboBtn.addEventListener(ev, function () { keys.boost = false; });
  });

  var KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'boost' };
  addEventListener('keydown', function (e) {
    var k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
  });
  addEventListener('keyup', function (e) {
    var k = KEYMAP[e.code];
    if (k) keys[k] = false;
  });
  // keys sent from the hub (same-origin only)
  addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.hubResetKeys) keys = { left: false, right: false, boost: false };
    var hk = KEYMAP[e.data.hubKey], hu = KEYMAP[e.data.hubKeyUp];
    if (hk) keys[hk] = true;
    if (hu) keys[hu] = false;
  });

  document.getElementById('start').onclick = reset;
  document.getElementById('again').onclick = reset;

  // pause from the shared pause button
  document.addEventListener('crewPause', function (e) {
    if (state !== 'race' && state !== 'count') return;
    if (e.detail === 'auto' && paused) return;
    paused = !paused;
    keys = { left: false, right: false, boost: false };
    var btn = document.getElementById('pause');
    if (btn) { btn.textContent = paused ? '▶' : '⏸'; btn.title = paused ? 'Resume game' : 'Pause game'; btn.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game'); }
    document.body.classList.toggle('paused', paused);
  });

  function tick(now) {
    var dt = Math.min(0.035, (now - last) / 1000 || 0);
    last = now;
    if (!paused) update(dt);
    draw();
    updateHUD();
    requestAnimationFrame(tick);
  }
  last = performance.now();
  requestAnimationFrame(tick);
})();
