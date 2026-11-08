/* Top-10 boards for the newer games (Crew Catch, Ariyan Runner, Kings Shootout).
   Uses the shared "game_scores" table. The public key is safe to ship: row-level
   security allows adding and reading scores only. */
(function () {
  var URL = 'https://azmeeaghohopwdwxmvbr.supabase.co';
  var KEY = 'sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw';
  var H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  function name() {
    try {
      var p = JSON.parse(localStorage.getItem('gamehub-profile-v1') || '{}');
      var n = String(p.name || '').trim();
      if (n) return n.slice(0, 20);
    } catch (e) {}
    var saved = localStorage.getItem('hub-board-name');
    if (!saved) { saved = 'Player' + Math.floor(1000 + Math.random() * 9000); localStorage.setItem('hub-board-name', saved); }
    return saved;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  window.HubBoard = {
    submit: function (game, score) {
      if (!(score >= 0)) return Promise.resolve(false);
      return fetch(URL + '/rest/v1/game_scores', {
        method: 'POST',
        headers: Object.assign({ Prefer: 'return=minimal' }, H),
        body: JSON.stringify({ game: game, name: name(), score: Math.floor(score) }),
        keepalive: true
      }).then(function (r) { return r.ok; }).catch(function () { return false; });
    },
    show: function (game, el) {
      if (!el) return Promise.resolve();
      el.innerHTML = '<p style="color:#6b7a99;font-size:13px">Loading top 10…</p>';
      return fetch(URL + '/rest/v1/game_scores?select=name,score&game=eq.' + game + '&order=score.desc&limit=50', { headers: H })
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          var seen = {}, out = [];
          rows.forEach(function (r) { if (!seen[r.name] && out.length < 10) { seen[r.name] = 1; out.push(r); } });
          if (!out.length) { el.innerHTML = '<p style="color:#6b7a99;font-size:13px">No scores yet. Be the first!</p>'; return; }
          el.innerHTML = '<h3 style="font-size:14px;font-weight:900;margin:12px 0 6px">🏆 Top 10</h3>' +
            '<ol style="text-align:left;padding-left:22px;font-size:14px;line-height:1.6">' +
            out.map(function (r) { return '<li><b>' + esc(r.name) + '</b> — ' + r.score + '</li>'; }).join('') + '</ol>';
        })
        .catch(function () { el.innerHTML = '<p style="color:#6b7a99;font-size:13px">Leaderboard offline right now</p>'; });
    },
    submitAndShow: function (game, score, el) {
      return this.submit(game, score).then(function () { return window.HubBoard.show(game, el); });
    }
  };
})();
