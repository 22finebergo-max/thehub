(function () {
  'use strict';
  var R = WackJoeRules, core = window.HubCore;
  var photo = 'joe.jpeg';
  var board = document.getElementById('board'), overlay = document.getElementById('overlay');
  var scoreEl = document.getElementById('score'), timeEl = document.getElementById('time');
  var startButton = document.getElementById('start'), pauseButton = document.getElementById('pause');
  var holes = [], score = 0, hits = 0, missed = 0, started = 0, nextSpawn = 0, state = 'ready', pausedAt = 0, audio;
  var difficulty = 'medium', difficultyEl = document.getElementById('difficulty');
  function bestKey() { return 'wackJoeBest-' + difficulty; }
  function read(key) { try { return Number(localStorage.getItem(key)) || 0; } catch (e) { return 0; } }
  function save(key, value) { try { localStorage.setItem(key, String(value)); } catch (e) {} }
  function paintBest() { document.getElementById('best').textContent = read(bestKey()); document.getElementById('status').textContent = difficulty[0].toUpperCase() + difficulty.slice(1) + ' · Best score: ' + read(bestKey()); }
  function tone(hit) {
    if (core && !core.soundOn()) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; if (!audio) audio = new AC(); audio.resume(); var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(hit ? 680 : 170, audio.currentTime); o.frequency.exponentialRampToValueAtTime(hit ? 220 : 90, audio.currentTime + .1); g.gain.setValueAtTime(.12, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .13); } catch (e) {}
  }
  function hit(index) {
    if (state !== 'playing') return;
    var h = holes[index], now = performance.now();
    if (R.remaining(started, now) === 0) { finish(); return; }
    var active = h.active && now < h.until;
    score = R.scoreHit(score, active);
    if (!active) { tone(false); return; }
    hits++; h.active = false; h.until = now + 180; h.el.classList.remove('up'); h.el.classList.add('hit'); scoreEl.textContent = score;
    tone(true); if (core && core.hapticsOn() && core.canVibrate()) navigator.vibrate(15);
  }
  function buildBoard() {
  board.replaceChildren(); holes = []; board.className = 'board ' + difficulty;
  board.setAttribute('aria-label', R.settings(difficulty).holes + ' Joe holes');
  for (var i = 0; i < R.settings(difficulty).holes; i++) {
    var b = document.createElement('button'); b.className = 'hole'; b.type = 'button'; b.setAttribute('aria-label', 'Wack Joe in hole ' + (i + 1));
    b.innerHTML = '<span class="pit"></span><span class="mask"><span class="joe"><img src="' + photo + '" alt="Joe" draggable="false"></span></span><span class="points">+10</span>';
    (function (index) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(index); }); b.addEventListener('click', function (e) { if (e.detail === 0) hit(index); }); })(i);
    board.appendChild(b); holes.push({ el: b, active: false, until: 0 });
  }
  }
  difficultyEl.addEventListener('change', function (e) {
    if (state === 'playing' || state === 'paused') return;
    difficulty = e.target.value; state = 'ready'; score = 0; scoreEl.textContent = '0'; timeEl.textContent = '30'; timeEl.classList.remove('late');
    document.getElementById('heading').textContent = 'Ready, Joe?'; document.getElementById('result').textContent = '30 seconds on the clock.'; startButton.textContent = 'Play now →';
    buildBoard(); paintBest();
  });
  buildBoard();
  function clear() { holes.forEach(function (h) { h.active = false; h.until = 0; h.el.classList.remove('up', 'hit'); }); }
  function start() {
    clear(); score = 0; hits = 0; missed = 0; scoreEl.textContent = '0'; timeEl.textContent = '30'; timeEl.classList.remove('late');
    started = performance.now(); nextSpawn = started; state = 'playing'; overlay.hidden = true; pauseButton.disabled = false;
    difficultyEl.disabled = true;
    document.getElementById('status').textContent = 'Go, Joe, go!'; if (core) core.markPlayed('wackjoe'); tone(true);
  }
  function finish() {
    if (state !== 'playing') return;
    state = 'ended'; clear(); timeEl.textContent = '0'; pauseButton.disabled = true;
    difficultyEl.disabled = false;
    var old = read(bestKey()); save(bestKey(), Math.max(old, score)); save('wackJoeBest', Math.max(read('wackJoeBest'), score)); save('wackJoeXP', read('wackJoeXP') + hits * 5); save('wackJoePlays', read('wackJoePlays') + 1); paintBest();
    document.getElementById('heading').textContent = score > old ? 'New best! 🎉' : 'Time’s up!';
    document.getElementById('result').textContent = score + ' points · ' + hits + ' Joes caught · ' + missed + ' escaped';
    startButton.textContent = 'Play again ↻'; overlay.hidden = false;
  }
  function pause() {
    if (state !== 'playing') return;
    state = 'paused'; pausedAt = performance.now(); document.getElementById('heading').textContent = 'Paused'; document.getElementById('result').textContent = score + ' points · ' + timeEl.textContent + ' seconds left'; startButton.textContent = 'Resume ▶'; overlay.hidden = false;
  }
  function resume() { var offset = performance.now() - pausedAt; started += offset; nextSpawn += offset; holes.forEach(function (h) { h.until += offset; }); state = 'playing'; overlay.hidden = true; }
  function tick(now) {
    if (state === 'playing') {
      var left = R.remaining(started, now), elapsed = now - started; timeEl.textContent = Math.ceil(left / 1000); timeEl.classList.toggle('late', left <= 5000);
      if (!left) finish();
      else {
        holes.forEach(function (h) { if (now >= h.until) { if (h.active) missed++; h.active = false; h.el.classList.remove('up', 'hit'); } });
        if (now >= nextSpawn) {
          var m = R.settings(difficulty), activeCount = holes.filter(function (h) { return h.active; }).length;
          var free = holes.filter(function (h) { return !h.active && now >= h.until; });
          var count = Math.min(m.burst, m.maxActive - activeCount, free.length);
          for (var n = 0; n < count; n++) { var h = free.splice(Math.floor(Math.random() * free.length), 1)[0]; h.active = true; h.until = now + R.lifetime(elapsed, difficulty); h.el.classList.add('up'); }
          nextSpawn = now + R.pace(elapsed, difficulty);
        }
      }
    }
    requestAnimationFrame(tick);
  }
  function key(code) { if (/^Digit[1-9]$/.test(code)) hit(Number(code.slice(5)) - 1); if (code === 'Space') { if (state === 'ready' || state === 'ended') start(); else if (state === 'paused') resume(); else pause(); } }
  startButton.onclick = function () { state === 'paused' ? resume() : start(); }; pauseButton.onclick = pause;
  function soundPaint() { var on = !core || core.soundOn(); var b = document.getElementById('sound'); b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on'); }
  document.getElementById('sound').onclick = function () { if (core) core.setSound(!core.soundOn()); soundPaint(); };
  window.addEventListener('message', function (e) { if (e.origin !== location.origin) return; if (e.data?.hubKey) key(e.data.hubKey); if (e.data?.hub) soundPaint(); });
  window.addEventListener('keydown', function (e) { if (e.repeat || /^(BUTTON|INPUT|TEXTAREA)$/.test(e.target.tagName)) return; if (e.code === 'Space' || /^Digit[1-9]$/.test(e.code)) { e.preventDefault(); key(e.code); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  paintBest(); soundPaint(); requestAnimationFrame(tick);
})();
