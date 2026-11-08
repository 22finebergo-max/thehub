/* Amaan Clicker — Legacy layer (standalone module)
   Pure logic only: no DOM, no game state access. The game calls these
   functions at the reset, production and save points listed in the notes.
   Store Legacy data under its own key so it can survive a normal Transcend. */
(function (root) {
  'use strict';

  var LEGACY_KEY = 'amaan-legacy-v1';

  /* ---- Tunable numbers (playtest these) ---- */
  var KNEE = 3;          // bonus total above which each new point gives half
  var SOFT_RATE = 0.5;   // efficiency past the knee

  /* ---- Upgrade tree: 3 branches, 3 tiers each ---- */
  var UPGRADES = [
    { id: 'm1', branch: 'momentum',    cost: 1,  name: 'Early Start',      desc: 'Begin each run with +1 Halo.',                  effect: { startHalos: 1 } },
    { id: 'm2', branch: 'momentum',    cost: 3,  name: 'Quick Shifts',     desc: 'Hire Amaans shifts run 10% faster.',            effect: { shiftSpeed: 0.10 } },
    { id: 'm3', branch: 'momentum',    cost: 6,  name: 'Golden Luck',      desc: 'Golden Amaans spawn 20% more often.',           effect: { goldFreq: 0.20 } },
    { id: 'p1', branch: 'persistence', cost: 5,  name: 'Pet Memory',       desc: 'Keep your pets through Legacy resets.',         effect: { keepPets: true } },
    { id: 'p2', branch: 'persistence', cost: 8,  name: 'Team Memory',      desc: 'Keep your Hire Amaans team through resets.',    effect: { keepTeam: true } },
    { id: 'p3', branch: 'persistence', cost: 12, name: 'Essence Memory',   desc: 'Keep Essence Lab progress through resets.',     effect: { keepEssence: true } },
    { id: 'x1', branch: 'mastery',     cost: 4,  name: 'Firm Grip',        desc: '+10% click power.',                             effect: { clickPower: 0.10 } },
    { id: 'x2', branch: 'mastery',     cost: 10, name: 'Extra Pet Slot',   desc: 'Gain one more equipped pet slot.',              effect: { petSlots: 1 } },
    { id: 'x3', branch: 'mastery',     cost: 15, name: 'Legacy Rising',    desc: '+2% all production per Legacy point you hold.', effect: { prodPerPoint: 0.02 }, late: true }
  ];

  var BY_ID = {};
  UPGRADES.forEach(function (u) { BY_ID[u.id] = u; });

  /* Points earned for a run that reached `halos` Halos (tune in playtesting). */
  function pointsForRun(halos) {
    return Math.max(0, Math.max(1, Math.floor((halos - 10) / 2)));
  }

  /* Soft cap: full value up to KNEE, then reduced efficiency. */
  function soften(raw) {
    if (raw <= KNEE) return raw;
    return KNEE + (raw - KNEE) * SOFT_RATE;
  }

  /* Blank Legacy record. */
  function fresh() {
    return { v: 1, points: 0, pointsAll: 0, runs: 0, owned: {} };
  }

  function load() {
    try {
      var raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return fresh();
      var d = JSON.parse(raw);
      if (!d || d.v !== 1) return fresh();
      return Object.assign(fresh(), d);
    } catch (e) { return fresh(); }
  }

  function save(L) {
    try { localStorage.setItem(LEGACY_KEY, JSON.stringify(L)); } catch (e) {}
  }

  /* Call when the player performs a Legacy reset. */
  function recordReset(L, halosThisRun) {
    var gained = pointsForRun(halosThisRun);
    L.points += gained;
    L.pointsAll += gained;
    L.runs += 1;
    save(L);
    return gained;
  }

  function canBuy(L, id) {
    var u = BY_ID[id];
    if (!u || L.owned[id]) return false;
    return L.points >= u.cost;
  }

  function buy(L, id) {
    if (!canBuy(L, id)) return false;
    L.points -= BY_ID[id].cost;
    L.owned[id] = true;
    save(L);
    return true;
  }

  /* Combine every owned upgrade into one effects object. */
  function effects(L) {
    var e = { startHalos: 0, shiftSpeed: 0, goldFreq: 0, keepPets: false, keepTeam: false,
              keepEssence: false, clickPower: 0, petSlots: 0, prodPerPoint: 0 };
    UPGRADES.forEach(function (u) {
      if (!L.owned[u.id]) return;
      Object.keys(u.effect).forEach(function (k) {
        var v = u.effect[k];
        if (typeof v === 'boolean') e[k] = e[k] || v;
        else e[k] += v;
      });
    });
    return e;
  }

  /* Production multiplier from Legacy. Additive, then softened.
     Matches the rule that bonuses add together rather than multiply. */
  function productionMult(L) {
    var e = effects(L);
    var raw = 1 + e.prodPerPoint * L.points;
    return 1 + soften(raw - 1);
  }

  /* Migrate an older save object (v2) so nothing is lost. Adds fields only. */
  function migrateSave(s) {
    if (!s || typeof s !== 'object') return s;
    if (s.v === 2) s.legacyReady = s.legacyReady || false;
    return s;
  }

  var api = {
    KEY: LEGACY_KEY, UPGRADES: UPGRADES,
    pointsForRun: pointsForRun, soften: soften,
    fresh: fresh, load: load, save: save,
    recordReset: recordReset, canBuy: canBuy, buy: buy,
    effects: effects, productionMult: productionMult, migrateSave: migrateSave
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Legacy = api;
})(typeof window !== 'undefined' ? window : globalThis);
