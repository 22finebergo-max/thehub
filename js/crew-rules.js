(function(root){
  'use strict';
  root.CrewRules = {
    raceRank: function(progress, cars, elapsed) {
      return 1 + cars.filter(function(c){ return c.finishedAt != null ? c.finishedAt < elapsed : c.p > progress; }).length;
    },
    upgradeCost: function(level){ return 65 + level * 48; },
    upgradeRange: function(range, level){ return range * (1 + (level - 1) * .08); },
    canTag: function(wait, distance, radius){ return wait <= 0 && distance < radius; }
  };
})(typeof window !== 'undefined' ? window : globalThis);