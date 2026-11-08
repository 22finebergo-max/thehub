/* Sound guard: makes the hub's Sound switch silence any game, including ones
   written before the switch existed. Loaded first in each game. */
(function () {
  var KEY = 'gamehub-sound';
  function on() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  var ctxs = [];
  var Base = window.AudioContext || window.webkitAudioContext;
  if (Base) {
    var Tracked = function () {
      var c = Reflect.construct(Base, arguments, Tracked);
      ctxs.push(c);
      if (!on()) { try { c.suspend(); } catch (e) {} }
      return c;
    };
    Tracked.prototype = Base.prototype;
    window.AudioContext = Tracked;
    window.webkitAudioContext = Tracked;
    var origResume = Base.prototype.resume;
    Base.prototype.resume = function () { if (!on()) return Promise.resolve(); return origResume.apply(this, arguments); };
  }
  var origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.muted = !on(); return origPlay.apply(this, arguments); };
  function apply() {
    var v = on();
    ctxs.forEach(function (c) {
      try { if (v) { if (c.state !== 'running') c.resume(); } else { if (c.state === 'running') c.suspend(); } } catch (e) {}
    });
    document.querySelectorAll('audio,video').forEach(function (m) { m.muted = !v; });
  }
  window.addEventListener('message', function (e) { if (e.data && e.data.hub) apply(); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); });
  document.addEventListener('pointerdown', function () { if (on()) apply(); }, true);
})();
