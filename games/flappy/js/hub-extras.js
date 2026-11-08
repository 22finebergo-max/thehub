/* Flappy Haider — Game Hub add-ons: haptics, shareable score card, hub sound sync.
   Loaded BEFORE the game script so window.HUB exists when the engine starts. */
(function () {
  'use strict';

  function ls(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function soundOn() { return ls('gamehub-sound', '1') !== '0'; }
  function hapticsOn() { return ls('gamehub-haptics', '1') !== '0' && !!navigator.vibrate; }

  var PATTERN = { flap: 8, score: [0, 12], power: [0, 10, 40, 10], crash: [0, 35, 60, 90] };

  var HUB = {
    vibe: function (kind) {
      if (!hapticsOn()) return;
      try { navigator.vibrate(PATTERN[kind] || 10); } catch (e) {}
    },
    soundOn: soundOn,
    runStart: function () { hideShare(); },
    gameOver: function (score, best, info) {
      lastRun = { score: score, best: best, info: info || {} };
      try {
        var p = JSON.parse(localStorage.getItem('gamehub-profile-v1') || '{}');
        p.last = 'flappy'; p.lastAt = Date.now();
        localStorage.setItem('gamehub-profile-v1', JSON.stringify(p));
      } catch (e) {}
      showShare();
    }
  };
  window.HUB = HUB;

  /* ---------------- share button ---------------- */
  var lastRun = null, btn = null, msg = null;

  function ensureUI() {
    if (btn) return;
    var css = document.createElement('style');
    css.textContent =
      '#hubShare{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(14px);z-index:40;' +
      'display:none;opacity:0;transition:opacity .25s,transform .25s;font:700 15px/1 "Trebuchet MS",system-ui,sans-serif;' +
      'color:#07101f;background:linear-gradient(95deg,#ffd24a,#ffb347);border:0;border-radius:999px;padding:13px 24px;' +
      'cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.4)}' +
      '#hubShare.on{display:block;opacity:1;transform:translateX(-50%) translateY(0)}' +
      '#hubShare:active{transform:translateX(-50%) scale(.96)}' +
      '#hubShareMsg{position:fixed;left:50%;bottom:66px;transform:translateX(-50%);z-index:40;display:none;' +
      'font:13px "Trebuchet MS",system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.72);padding:7px 14px;border-radius:999px}';
    document.head.appendChild(css);

    btn = document.createElement('button');
    btn.id = 'hubShare';
    btn.textContent = '📤 Share score';
    btn.onclick = share;
    document.body.appendChild(btn);

    msg = document.createElement('div');
    msg.id = 'hubShareMsg';
    document.body.appendChild(msg);
  }
  function showShare() { ensureUI(); btn.classList.add('on'); }
  function hideShare() { if (btn) { btn.classList.remove('on'); } if (msg) msg.style.display = 'none'; }
  function toast(t) {
    ensureUI(); msg.textContent = t; msg.style.display = 'block';
    setTimeout(function () { msg.style.display = 'none'; }, 2600);
  }

  function medalFor(s) {
    if (s >= 40) return ['PLATINUM', '#9fe8ff'];
    if (s >= 25) return ['GOLD', '#ffd24a'];
    if (s >= 15) return ['SILVER', '#d8e2f0'];
    if (s >= 5) return ['BRONZE', '#e0995c'];
    return ['NO MEDAL', '#8d9ab8'];
  }

  function buildCard() {
    var r = lastRun || { score: 0, best: 0, info: {} };
    var c = document.createElement('canvas');
    c.width = 640; c.height = 800;
    var x = c.getContext('2d');

    var g = x.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, '#4ec0ff'); g.addColorStop(.55, '#9ae6ff'); g.addColorStop(1, '#ffe9a8');
    x.fillStyle = g; x.fillRect(0, 0, 640, 800);

    // pipes along the bottom
    for (var i = 0; i < 5; i++) {
      var ph = 34 + ((i * 29) % 46), px = 36 + i * 128;
      x.fillStyle = '#2f9e44'; x.fillRect(px, 800 - 110 - ph, 62, ph);
      x.strokeStyle = '#1b5e20'; x.lineWidth = 5; x.strokeRect(px, 800 - 110 - ph, 62, ph);
    }
    x.fillStyle = '#d9b26a'; x.fillRect(0, 690, 640, 110);
    x.fillStyle = '#c49a52'; x.fillRect(0, 690, 640, 14);

    // bird
    x.save(); x.translate(320, 250); x.rotate(-.15);
    x.fillStyle = '#ffd43b'; x.beginPath(); x.ellipse(0, 0, 42, 34, 0, 0, 6.3); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(16, -10, 13, 0, 6.3); x.fill();
    x.fillStyle = '#1d2330'; x.beginPath(); x.arc(20, -10, 6, 0, 6.3); x.fill();
    x.fillStyle = '#ff922b'; x.beginPath(); x.moveTo(34, 2); x.lineTo(60, 10); x.lineTo(34, 18); x.closePath(); x.fill();
    x.restore();

    x.textAlign = 'center';
    x.fillStyle = 'rgba(10,25,45,.75)';
    x.font = 'bold 26px "Trebuchet MS", sans-serif';
    x.fillText(r.info.mode === 'DUNKY' ? 'DUNKY HAIDER 🏀' : r.info.mode === 'REALISTIC' ? 'FLAPPY HAIDER \u00B7 REALISTIC' : 'FLAPPY HAIDER', 320, 76);
    var who = '';
    try { who = (JSON.parse(localStorage.getItem('gamehub-profile-v1') || '{}').name) || localStorage.getItem('flappyHaiderName') || ''; } catch (e) {}
    if (who) {
      x.font = 'bold 19px "Trebuchet MS", sans-serif';
      x.fillStyle = 'rgba(10,25,45,.6)';
      x.fillText(who, 320, 104);
    }

    x.fillStyle = '#0b2135';
    x.font = 'bold 150px "Trebuchet MS", sans-serif';
    x.fillText(String(r.score), 320, 470);
    x.font = 'bold 24px "Trebuchet MS", sans-serif';
    x.fillText('SCORE', 320, 510);

    var m = medalFor(r.score);
    x.fillStyle = m[1];
    x.beginPath(); x.arc(320, 566, 42, 0, 6.3); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#0b2135'; x.font = 'bold 17px "Trebuchet MS", sans-serif';
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 4; x.strokeText(m[0], 320, 628); x.fillText(m[0], 320, 628);

    x.font = 'bold 22px "Trebuchet MS", sans-serif';
    x.fillStyle = '#0b2135';
    var line = 'BEST ' + r.best + (r.info.diff ? '   ·   ' + r.info.diff : '') + (r.info.daily ? '   ·   DAILY' : '');
    if (r.info.mode === 'REALISTIC') line = 'BEST ' + r.best + '   ·   REALISTIC 30s   ·   ' + (r.info.smashes || 0) + ' SMASHED';
    if (r.info.mode === 'DUNKY') line = 'BEST ' + r.best + '   ·   BEST COMBO ×' + (r.info.combo || 1);
    x.fillText(line, 320, 740);
    x.font = '16px "Trebuchet MS", sans-serif';
    x.fillStyle = 'rgba(10,25,45,.6)';
    x.fillText('The Game Hub', 320, 772);
    return c;
  }

  function share() {
    var card = buildCard();
    var gameName = lastRun && lastRun.info && lastRun.info.mode === 'DUNKY' ? 'Dunky Haider' : 'Flappy Haider';
    var text = 'I scored ' + (lastRun ? lastRun.score : 0) + ' in ' + gameName + ' on The Game Hub!';
    card.toBlob(function (blob) {
      if (!blob) { toast('Could not build the card.'); return; }
      var file = new File([blob], 'flappy-score.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], text: text, title: 'Flappy Haider' })
          .catch(function () {});
        return;
      }
      if (navigator.share) {
        navigator.share({ text: text, url: location.href }).catch(function () {});
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flappy-score.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      toast('Score card saved as an image.');
    }, 'image/png');
  }

  /* ---------------- live sound sync from the hub ---------------- */
  function applySound() {
    try { if (window.__flappy) window.__flappy.setMuted(!soundOn()); } catch (e) {}
  }
  window.addEventListener('message', function (e) {
    if (e.data && e.data.hub) applySound();
  });
  window.addEventListener('storage', function (e) {
    if (e.key === 'gamehub-sound') applySound();
  });
  window.addEventListener('load', applySound);
})();
