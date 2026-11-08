(function (root) {
  'use strict';
  var modes = {
    easy: { holes: 16, columns: 4, burst: 1, maxActive: 2, pace: 850, minPace: 550, lifetime: 1450, minLifetime: 1000 },
    medium: { holes: 20, columns: 5, burst: 2, maxActive: 4, pace: 650, minPace: 350, lifetime: 1100, minLifetime: 650 },
    hard: { holes: 25, columns: 5, burst: 3, maxActive: 7, pace: 450, minPace: 220, lifetime: 800, minLifetime: 420 }
  };
  function settings(mode) { return modes[mode] || modes.medium; }
  root.WackJoeRules = {
    modes: modes,
    settings: settings,
    duration: 30000,
    pointsPerHit: 10,
    remaining: function (started, now) { return Math.max(0, 30000 - (now - started)); },
    scoreHit: function (score, active) { return active ? score + 10 : score; },
    pace: function (elapsed, mode) { var m = settings(mode); return Math.max(m.minPace, m.pace - elapsed / 100); },
    lifetime: function (elapsed, mode) { var m = settings(mode); return Math.max(m.minLifetime, m.lifetime - elapsed / 70); }
  };
})(globalThis);
