/* The Game Hub — service worker
   Pre-caches the whole hub so every game works with no connection.
   Bump CACHE on every release (v1, v2, v3 …) so installed PWAs pick up
   the new files and the old cache is deleted on activate. */
var CACHE = 'game-hub-v97';

var SHELL = [
  './games/ariyanrunner/index.html',
  './games/crewcatch/index.html',
  './games/geometrydash/index.html',
  './games/geometrydash/dhyiaan.jpg',
  './games/geometrydash/bartu.jpg',
  './games/kingsshootout/index.html',
  './games/subwaygeorges/index.html',
  './games/football5v5/index.html',
  './games/football5v5/faces/amaan.jpg',
  './games/football5v5/faces/haider.png',
  './games/football5v5/faces/zainab.png',
  './games/football5v5/faces/josh.png',
  './games/football5v5/faces/austin.png',
  './games/football5v5/faces/joe.jpg',
  './games/football5v5/faces/samuel.png',
  './games/football5v5/faces/christian.png',
  './games/football5v5/faces/ariyan.png',
  './games/football5v5/faces/bartu.jpg',
  './thumbs/football-5v5.jpg',
  './js/account.js',
  './js/supabase.bundle.js',
  './games/chesscrew/index.html',
  './games/clashroyal3d/index.html',
  './games/crossyhaider/index.html',
  './games/crossyhaider/three.min.js',
  './js/three.r128.min.js',
  './games/clashroyal3d/three.min.js',
  './games/chesscrew/stockfish.js',
  './games/chesscrew/stockfish.wasm',
  './games/smashyhaider/index.html',
  './games/smashyhaider/haider.png',
  './games/smashyhaider/zainab.png',
  './games/smashyhaider/amaan.jpg',
  './',
  './index.html',
  './play.html',
  './manifest.webmanifest',
  './js/hub-core.js',
  './js/crew-rules.js',
  './js/crew-game.js',
  './games/crewarcade/index.html',
  './games/kingsnite/index.html',
  './games/snookamaan/index.html',
  './games/haiderkart/index.html',
  './games/haiderkart/style.css',
  './games/haiderkart/game.js',
  './games/amaantd/index.html',
  './games/amaantd/style.css',
  './games/amaantd/game.js',
  './games/kingstag/index.html',
  './games/kingstag/style.css',
  './games/kingstag/game.js',
  './games/speedrundash/index.html',
  './games/speedrundash/faces/amaan.jpg',
  './games/speedrundash/faces/ariyan.png',
  './games/speedrundash/faces/austin.png',
  './games/speedrundash/faces/bartu.jpg',
  './games/speedrundash/faces/ben.jpg',
  './games/speedrundash/faces/charlie.png',
  './games/speedrundash/faces/christian.png',
  './games/speedrundash/faces/dhyiaan.jpg',
  './games/speedrundash/faces/haider.png',
  './games/speedrundash/faces/joe.jpg',
  './games/speedrundash/faces/josh.png',
  './games/speedrundash/faces/samuel.png',
  './games/speedrundash/faces/zach.png',
  './games/speedrundash/faces/zainab.png',

  './js/assistant.js',
  './js/hub-online.js',
  './js/peerjs.min.js',
  './games/brawlkings/index.html',
  './games/brawlkings/style.css',
  './games/brawlkings/rules.js',
  './games/brawlkings/game.js',
  './games/brawlkings/cover.jpg',
  './games/brawlkings/vendor/phaser.min.js',
  './games/flappy/index.html',
  './games/flappy/js/hub-extras.js',
  './games/amaan/index.html',
  './games/amaan/css/style.css',
  './games/christian/index.html',
  './games/christian/head.png',
  './games/snariyan/index.html',
  './games/snariyan/ariyan.png',
  './games/snariyan/haider.png',
  './games/snariyan/amaan.png',
  './games/paccymatt/index.html',
  './games/paccymatt/charlie.png',
  './games/paccymatt/amaan.png',
  './games/paccymatt/g1.png',
  './games/paccymatt/g2.png',
  './games/paccymatt/g3.png',
  './games/paccymatt/g4.png',
  './games/stackjosh/index.html',
  './games/stackjosh/josh.png',
  './games/angryhaider/index.html',
  './games/angryhaider/haider.png',
  './games/angryhaider/zainab.png',
  './games/angryhaider/zach.png',
  './games/angryhaider/austin.png',
  './games/kickaustin/index.html',
  './games/kickaustin/austin.png',
  './games/connectsamuel/index.html',
  './games/connectsamuel/samuel.png',
  './games/wackjoe/index.html',
  './games/wackjoe/style.css',
  './games/wackjoe/rules.js',
  './games/wackjoe/game.js',
  'games/wackjoe/joe.jpeg',
  './games/amaan/js/supa-config.js',
  './games/amaan/js/legacy.js',
  './games/amaan/js/game.js',
  './games/amaan/js/leaderboard.js',
  './games/amaan/js/hub-extras.js',
  './games/amaan/js/gacha.js',
  './games/amaan/js/chat.js',
  './games/amaan/js/supabase.bundle.js',
  './games/amaan/amaan.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                                  // never touch leaderboard/chat writes
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;                        // Supabase, Google Fonts: straight to network

  // HTML: network first (so updates land), fall back to cache offline
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Everything else: cache first, refresh in the background
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
