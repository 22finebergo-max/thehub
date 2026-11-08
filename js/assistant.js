/* The Game Hub — hub assistant ("Ask the Hub")
   ---------------------------------------------------------------
   Lives on the hub home page only (the games stay clean), and knows about
   every game on the site. Works with no network, no API key and no cost:
   a curated knowledge base plus a small matching engine, and it can read
   the live saves so answers use the player's real numbers.

   Optional upgrade: if you deploy the serverless function in
   netlify/functions/ask.js and set

       window.HUB_AI = { endpoint: '/.netlify/functions/ask' };

   then anything the built-in brain cannot answer is forwarded to a real
   model. Never put a provider API key in this file — it is public. */
(function () {
  'use strict';
  if (window.__hubAssistant) return;

  /* ---------------- which game are we inside? ---------------- */
  var GAME = window.HUB_GAME === 'christian' ? 'christian'
           : (document.getElementById('hit') ? 'amaan'
           : (document.getElementById('game') ? 'flappy' : 'hub'));

  var THEME = GAME === 'flappy'
    ? { accent: '#f0a04b', deep: '#2b4a63', name: 'Ask Haider', icon: '\uD83D\uDC24' }
    : GAME === 'christian'
    ? { accent: '#4aa8e0', deep: '#1b2545', name: 'Ask Christian', icon: '\uD83E\uDDF1' }
    : GAME === 'amaan' ? { accent: '#f0c457', deep: '#161f3d', name: 'Ask Amaan',  icon: '\uD83C\uDF93' }
    : { accent: '#36d1ff', deep: '#1b2545', name: 'Ask the Hub', icon: '\uD83C\uDFAE' };

  var GAMENAME = { flappy: 'Flappy Haider', amaan: 'Amaan Clicker', christian: 'Like a Christian',
                   snariyan: 'Snariyan', paccymatt: 'paccymatt', stackjosh: 'Stack a Josh',
                   angryhaider: 'Angry Haider', kickaustin: 'Kick the Austin', connectsamuel: 'Connect Samuel', hub: 'The Game Hub' };

  function n(x) { return Number(x) || 0; }
  function fmt(x) {
    x = n(x);
    if (x < 1000) return String(Math.floor(x));
    var s = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'], i = 0;
    while (x >= 1000 && i < s.length - 1) { x /= 1000; i++; }
    return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0) + ' ' + s[i];
  }
  function save() { try { return JSON.parse(localStorage.getItem('amaan-clicker-v2')) || {}; } catch (e) { return {}; } }
  function ls(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }

  /* ================= KNOWLEDGE BASE =================
     k = keywords the matcher scores against, a = answer (string or function) */
  var HUB_KB = [
    { k: 'what is the game hub about site games together who snariyan paccymatt stack josh christian flappy amaan list all', t: 'What is The Game Hub?',
      a: 'The Game Hub puts <b>seven games</b> under one roof: <b>Flappy Haider</b> (one-tap arcade, with the 🏀 Dunky Haider mode), <b>Amaan Clicker</b> (the full idle empire), <b>Like a Christian</b> (rhythm stacking), <b>Snariyan</b> (snake), <b>paccymatt</b> (maze chase), <b>Stack a Josh</b> (timing tower) and <b>Angry Haider</b> (slingshot physics — fling Haider and Zainab at Zach and Austin\'s forts). They share one profile, one level and XP bar, one sound setting and one "continue playing" card — playing any game raises the same hub level.' },
    { k: 'continue playing resume last game played recently', t: 'Continue playing',
      a: 'The home page keeps a <b>Continue playing</b> card: it shows the last game you had open, your best in it, and when you last played, with a Resume button that drops you straight back in. It works from the same save the rest of the hub reads, so no setup is needed.' },
    { k: 'legacy points reset layer after transcendence above halos permanent upgrades branches momentum persistence mastery early start quick shifts golden luck pet memory team memory essence memory firm grip extra pet slot legacy rising keep through resets',
      t: 'The Legacy layer',
      a: function () {
        var L = {}; try { L = JSON.parse(localStorage.getItem('amaan-legacy-v1')) || {}; } catch (e) {}
        var s = save(), halo = n(s.halo);
        var pts = n(L.points), all = n(L.pointsAll), runs = n(L.runs);
        var gain = Math.max(0, Math.max(1, Math.floor((halo - 10) / 2)));
        var you = runs || all ? 'You hold <b>' + pts + '</b> Legacy point' + (pts === 1 ? '' : 's') + ' (' + all + ' earned over ' + runs + ' reset' + (runs === 1 ? '' : 's') + '). ' : '';
        return 'Legacy sits <b>above Transcendence</b>. A Legacy reset wipes everything — amaans, buildings, Gold Stars, Diplomas, Halos and the Trophy Cabinet — and pays <b>Legacy points</b> based on the Halos you reached: max(1, (Halos \u2212 10) \u00f7 2), rounded down. Points live in their own save and are never lost.<br>' + you +
          'Spend them on three branches:<br>\u2022 <b>Momentum</b> \u2014 Early Start (1): begin runs with +1 Halo \u00b7 Quick Shifts (3): Hire Amaans shifts 10% faster \u00b7 Golden Luck (6): +20% Golden Amaans.<br>\u2022 <b>Persistence</b> \u2014 Pet Memory (5), Team Memory (8), Essence Memory (12): keep pets, your Hire Amaans team and Essence Lab progress through Legacy resets.<br>\u2022 <b>Mastery</b> \u2014 Firm Grip (4): +10% click power \u00b7 Extra Pet Slot (10) \u00b7 Legacy Rising (15): +2% production per Legacy point held.<br>' +
          'Find it at the bottom of the <b>Prestige</b> tab. It unlocks with your first Halo' + (halo >= 1 ? ' \u2014 which you already have, so a reset now would pay <b>+' + gain + '</b>.' : '.');
      } },
    { k: 'christian like a christian dino tiles tile blocks block neck head stack stacking tower catch catching falling drop drag slide perfect perfects hymn music notes song amazing grace third game new game toppled topple miss',
      t: 'Like a Christian',
      a: function () {
        var best = n(localStorage.getItem('christianBest')), perf = n(localStorage.getItem('christianPerfects')), plays = n(localStorage.getItem('christianPlays'));
        var you = plays ? 'You have played <b>' + plays + '</b> time' + (plays === 1 ? '' : 's') + ', best tower <b>' + best + '</b> with <b>' + perf + '</b> perfect catches. ' : 'You have not played it yet. ';
        return '<b>Like a Christian</b> is one of the seven games in the hub. Bars fall from the top in time with a song, and you slide Christian left and right so each one lands on top of his head. Every catch becomes part of his neck, which grows downwards from his chin. Christian himself never moves up; the neck keeps growing and can run off the bottom of the screen.<br>' +
          'Each game has three songs, and each one has its own tiles: Sunny Steps has soft green tiles, Night Walk has blue rounded tiles, and Brass Parade has gold blocky tiles. Use the Song button on the title screen to switch.<br>' +
          'Catch a bar dead centre for a <b>PERFECT</b> worth double, with sparkles. Three misses and the run ends.<br>' + you +
          'It earns hub XP too: score \u00d7 3 plus 2 per perfect catch.';
      } },
    { k: 'install app home screen pwa download phone play offline no internet connection signal aeroplane plane tube',
      t: 'Install it / play offline',
      a: 'On the hub page tap <b>Install</b> (Android/Chrome) or Share → <b>Add to Home Screen</b> (iPhone). After the first visit a service worker caches every game, so they keep working with no signal. The install prompt only appears on a real HTTPS page — not inside a preview frame.' },
    { k: 'save data lost saves where stored cloud backup reset delete progress',
      t: 'Where is my progress saved?',
      a: 'Everything in all seven games is stored in your browser\'s <b>localStorage</b> on this device — there is no account and nothing is uploaded except the leaderboard name/score and chat messages. Clearing site data or using private browsing wipes it. Amaan Clicker has <b>Settings → Export save</b> which gives you a code you can paste into Import on another device. Do that before clearing anything.' },
    { k: 'sound mute music off volume haptics vibration',
      t: 'Sound and vibration',
      a: 'The hub\'s sound and haptics toggles control every game at once (top of the hub page, and the speaker icon in the game bar). In Flappy you can also press <b>M</b> to mute. Haptics only do anything on phones that support vibration.' },
    { k: 'level xp profile name rank levelling hub level how do i level up',
      t: 'Level and XP',
      a: function () {
        var core = window.HubCore, line = '';
        if (core) {
          var p = core.profile();
          line = 'You are <b>level ' + p.level + '</b> with ' + Math.round(p.xp) + ' XP right now. ';
        }
        return line + 'Your hub level is worked out from <b>all seven games</b> at once: Flappy XP (every run), Amaan Clicker progress (amaans, clicks, stars, diplomas), and the newer games pay XP every time a run ends — Like a Christian pays score × 3 (+2 per perfect), Snariyan pays 5 × pieces eaten, paccymatt pays about a quarter of your score, Stack a Josh pays score × 3 (+2 per perfect), and Angry Haider pays about 2% of your fort score plus +12 per fort cleared. Level = floor(sqrt(XP / 60)) + 1, so each level needs a bit more than the last. Playing any game moves the same bar, fills the install-app badge and feeds the daily-reward chips. Set your display name in the profile strip on the hub page.';
      } },
    { k: 'leaderboard global online board scores rank cheating fake name public other people see visible privacy',
      t: 'The global leaderboards',
      a: 'Two games compete world-wide, both backed by the same Supabase project. <b>Amaan Clicker</b> has the big global board (Leaderboard tab): pick a name and your amaans/clicks/stars/diplomas upload every ~30 seconds. <b>Stack a Josh</b> has a "how high did you stack?" board — tap 🏆 Leaderboard on its title or game-over screen, pick a name, and your best tower uploads after every run. Scores that could not have been produced by actually playing are rejected in the browser and in the database, so edited saves do not make either board.' },
    { k: 'share card image score post tweet friends show off',
      t: 'Share cards',
      a: '<b>Flappy Haider</b>, <b>Snariyan</b> and <b>Stack a Josh</b> can all build a shareable 640×800 score card after a run: Flappy shows a medal, Snariyan shows how many Amaans you ate, and Stack a Josh shows how high you stacked. The button appears on the game-over panel — it uses your system share sheet on phones, or downloads the image on desktop.' },
    { k: 'chat rules safe report block banned swearing',
      t: 'Global chat rules',
      a: 'Chat is anonymous sign-in, 3–16 character names, 250 characters a message. Swearing, slurs, links, emails, phone numbers and social handles are blocked before sending, and again on the server. You can <b>Report</b> or <b>Block</b> any message; three reports from different players hides a message automatically. Do not share personal information — anyone in the world can read it.' },
    { k: 'who made created built developer credits author fan project amaan haider real people behind',
      t: 'Who made this?',
      a: 'It is a fan project built around two friends, Haider and Amaan. Flappy Haider and Amaan Clicker started as two separate sites and were merged into this hub.' }
  ];

  var FLAPPY_KB = [
    { k: 'how to play controls tap flap jump space start basics rules new beginner',
      t: 'How to play',
      a: 'Tap the screen, click, or press <b>Space</b>/<b>Up arrow</b> to flap. Every pipe you clear is a point. Hitting a pipe or the ground ends the run — except in Realistic mode, where pipes get smashed instead. Keyboard shortcuts: <b>1/2/3</b> difficulty, <b>R</b> switch mode, <b>D</b> daily challenge, <b>M</b> mute.' },
    { k: 'modes normal realistic difference which mode',
      t: 'Normal vs Realistic mode',
      a: '<b>Normal</b> is the classic game: dodge pipes, survive as long as you can, one mistake ends it.<br><b>Realistic</b> gives you <b>30 seconds</b> and lets Haider <b>smash straight through pipes</b> — they break apart and topple off the screen and you keep flying. The goal is the highest score in that window. The ground still ends the run, and Realistic keeps its own best score separate from Normal.' },
    { k: 'realistic timer 30 seconds smash pipes break through time limit',
      t: 'Realistic mode in detail',
      a: 'The timer starts at 30.0s and the bar under the score turns red in the last 5 seconds. Each pipe you smash scores points (double while ×2 is active) and adds to the "pipes smashed" counter shown at the end. The world runs about 15% faster and the orb pool favours speed, ×2 and slow-mo. Best strategy: grab every ⚡ orb and aim straight at pipes rather than through the gaps.' },
    { k: 'powerups power ups orbs shield slow motion x2 double speed lightning',
      t: 'Power-up orbs',
      a: 'Four orbs float between the pipes:<br>🛡 <b>Shield</b> — saves you from one crash, then 1.4s of invulnerability.<br>⏱ <b>Slow-mo</b> — world slows to 55% speed for 5 seconds.<br>×2 <b>Double score</b> — every pipe scores 2 for 8 seconds.<br>⚡ <b>Speed</b> — world runs at 1.75× for 5 seconds. Risky in Normal mode, but it is the best way to pump your score in Realistic.<br>Orb chance depends on difficulty: Easy 45%, Medium 33%, Hard 22% per pipe. The Lucky Charm shop item adds 60% on top.' },
    { k: 'difficulty easy medium hard which should i pick gap speed',
      t: 'Difficulty settings',
      a: '<b>Easy</b> — 125 speed, 208px gap, orbs 45%, 50 coins per run bonus.<br><b>Medium</b> — 150 speed, 184px gap, orbs 33%, 20 coins.<br><b>Hard</b> — 178 speed, 162px gap, orbs 22%, 5 coins. Hard also moves pipes up and down from pipe 3 onwards (55% of them). Learn on Easy, farm coins on Easy, chase real scores on Medium.' },
    { k: 'coins shop buy items emerald galaxy rainbow head start lucky charm shield start',
      t: 'Coins and the shop',
      a: 'Coins come from runs (bonus based on difficulty) and are spent in the shop (💲 button, top-left of the title screen):<br>• Emerald ring — 3<br>• Rainbow sky — 6<br>• Galaxy ring — 8<br>• Head Start (first 3 points run at 55% speed) — 4<br>• Lucky Charm (power-ups 60% more often) — 5<br>• Shield Start (begin every run shielded) — 6<br>Head Start first, then Lucky Charm, is the fastest route to better scores.' },
    { k: 'skins photo ring unlock gold titanium fire rainbow mystery change look',
      t: 'Skins and how to unlock them',
      a: 'Tap Haider\'s photo on the title screen to cycle rings. <b>Gold</b> from the start, <b>Titanium</b> at best 10, <b>Fire</b> at best 20, <b>Rainbow</b> at best 35, <b>Mystery</b> at hub level 30, and <b>Emerald</b>/<b>Galaxy</b> from the coin shop.' },
    { k: 'daily challenge seed same pipes today',
      t: 'Daily challenge',
      a: 'The Daily Challenge pill on the title screen (or key <b>D</b>) plays a fixed Medium-difficulty layout generated from today\'s date — the same pipes for everyone, all day. It keeps its own daily best, and resets at midnight.' },
    { k: 'tips improve get better advice strategy stuck struggling practise good at keep dying',
      t: 'Tips to score higher',
      a: function () {
        var best = n(ls('flappyHaiderBest', 0)), bestR = n(ls('flappyHaiderBestReal', 0));
        var you = best ? 'Your Normal best is <b>' + best + '</b>' + (bestR ? ' and your Realistic best is <b>' + bestR + '</b>' : '') + '. ' : '';
        return you + 'Five things that actually help:<br>1. Tap in a steady rhythm instead of reacting late — aim for the <i>middle</i> of the next gap, not the pipe you are passing.<br>2. Keep Haider in the upper third; falling is faster than climbing.<br>3. On moving pipes, wait for the gap to come to you rather than chasing it.<br>4. Buy Head Start (4 coins) — the slow opening gets you past the nervy first pipes.<br>5. Take ⏱ slow-mo when you are flustered and ⚡ speed only when you are settled.';
      } },
    { k: 'my best score record high personal how am i doing stats progress numbers',
      t: 'Your scores',
      a: function () {
        var best = n(ls('flappyHaiderBest', 0)), bestR = n(ls('flappyHaiderBestReal', 0)), coins = n(ls('flappyHaiderCoins', 0));
        var next = [10, 20, 35].filter(function (r) { return r > best; })[0];
        return 'Normal best: <b>' + best + '</b><br>Realistic best: <b>' + bestR + '</b><br>Coins: <b>' + coins + '</b>' +
          (next ? '<br>Next skin unlocks at a best of <b>' + next + '</b> — ' + (next - best) + ' to go.' : '<br>You have unlocked every score-based skin. 🏆');
      } },
    { k: 'trophy board local leaderboard runs history',
      t: 'The trophy board',
      a: 'The 🏆 button on the title screen shows your best runs — "Today" and "All time" tabs. It is stored on this device only, so it is yours alone and works offline.' },
    { k: 'tic tac toe noughts crosses mini game',
      t: 'Tic-tac-toe',
      a: 'The board button on the left of the title screen opens a tic-tac-toe game against the computer — a breather between runs. Press Escape to leave.' },
    { k: 'theme sky day night sunset background look of the game',
      t: 'Themes',
      a: 'The selector at the top-right of the title screen switches the sky: Day, Sunset, Night and (once bought) Rainbow. It is purely cosmetic.' },
    { k: 'share score card image screenshot post',
      t: 'Sharing a score',
      a: 'After a run, the Share button builds a 640×800 score card image you can save or share. In Realistic mode the card says REALISTIC and shows how many pipes you destroyed.' }
  ];

  var AMAAN_KB = [
    { k: 'how to play basics start rules new beginner what do i do clicker',
      t: 'How to play',
      a: 'Click Amaan to earn <b>amaans</b>. Spend them on <b>Click power</b> (more per click) and <b>Buildings</b> (amaans per second, even while you are away). When progress slows, that is the signal to prestige — Rebirth first, then Graduation, then Transcendence.' },
    { k: 'combo heat fever bar clicking fast multiplier what is fever',
      t: 'Combo and Fever',
      a: 'Clicking quickly fills the combo bar under Amaan. It multiplies your click power, and filling it to 100% triggers <b>FEVER</b> — a short burst where everything pays far more and the card glows. Stop clicking and it drains back down.' },
    { k: 'golden amaan gold appears click bonus frenzy lucky',
      t: 'Golden Amaans',
      a: 'A sepia Golden Amaan appears on the stage every so often and floats for a few seconds. Click it for a random buff: a production frenzy, a click frenzy, a lump of amaans or a sugar rush. The Lucky Charm upgrade makes them 25% more common.' },
    { k: 'buildings best value what should i buy next upgrade order efficient',
      t: 'What should I buy next?',
      a: function () {
        var s = save();
        var tip = 'Rule of thumb: buy the <b>cheapest thing you can afford that you do not own yet</b>, keep every click-power upgrade bought, and use the <b>⚡ Buy best value</b> button in the Shop tab — it picks the building with the best production per amaan for you.';
        if (!s.balance) return tip;
        return 'You have <b>' + fmt(s.balance) + '</b> amaans right now. ' + tip + '<br>If a building would take more than about 10 minutes of your current income to pay for itself, buy upgrades instead — upgrades are almost always the better deal because they multiply everything you already own.';
      } },
    { k: 'rebirth gold stars reset when should i prestige first',
      t: 'Rebirth and Gold Stars',
      a: function () {
        var s = save();
        var line = '';
        if (s.eg) {
          var pending = Math.floor(Math.sqrt(n(s.eg) / 1e6));
          line = 'Based on this cycle you would get roughly <b>' + fmt(pending) + '</b> Gold Star' + (pending === 1 ? '' : 's') + ' right now. ';
        }
        return 'Rebirth restarts the school year: you lose amaans, buildings and upgrades, but keep <b>Gold Stars</b>, trophies and the Sticker Book. Each star is a permanent <b>+10%</b> production. Stars earned = √(amaans earned this cycle ÷ 1,000,000) × your star multipliers. ' + line +
          'Because earning is cumulative, rebirthing early or late gives the same total — so rebirth as soon as the gain feels worth it (a good rule: when you would gain at least 10% more stars than you already have).';
      } },
    { k: 'sticker book spend gold stars what to buy first star upgrades order priority',
      t: 'Sticker Book priorities',
      a: 'Spending Gold Stars does <b>not</b> reduce your production bonus, so spend them all. Good order: <b>Head Start</b> (3) → <b>Pocket Money</b> (5) → <b>Sticky Fingers</b> (8) → <b>Golden Memory</b> (12) → <b>Remembered Tricks</b> (20) → <b>Lunch Money</b> (20) → <b>Teacher\'s Lounge</b> (30, unlocks Challenges) → <b>Auto-Tongue</b> (40) → <b>Report Card</b> (60) → <b>Hall Pass</b> (500, unlocks Graduation).' },
    { k: 'graduation diplomas second prestige hall pass unlock',
      t: 'Graduation and Diplomas',
      a: function () {
        var s = save();
        var have = n(s.dip), all = n(s.dipAll);
        return 'Graduation is the second prestige layer. You need <b>Hall Pass</b> (500 Gold Stars) in the Sticker Book to unlock it. Diplomas earned = √(all-time Gold Stars ÷ 300) × your diploma multipliers, and each Diploma adds <b>+50% base production</b> forever. Diplomas are also the currency for the Capsule Machine.' +
          (all ? '<br>You currently hold <b>' + fmt(have) + '</b> unspent of <b>' + fmt(all) + '</b> ever earned.' : '');
      } },
    { k: 'transcend halos third prestige endgame',
      t: 'Transcendence and Halos',
      a: 'The third layer. Halos = √(all-time Diplomas ÷ 25), and they feed the deepest multipliers in the game. Do not rush it — transcending with a handful of Diplomas wastes the run.' },
    { k: 'capsules gacha rates pity roll diplomas units collection',
      t: 'The Capsule Machine',
      a: function () {
        var g = {}; try { g = JSON.parse(localStorage.getItem('amaan-gacha-v1')) || {}; } catch (e) {}
        var rolls = n(g.rolls), pity = n(g.pity);
        return 'Spend Diplomas on capsules for 26 collectable Amaans across Normal → Rare → Super Rare → Uber Rare → Legend Rare. <b>Standard Capsule</b> costs 1 Diploma (10 / 60 / 25.5 / 4.2 / 0.3%). <b>Uber Festival</b> costs 3 and drops no Normals (0 / 50 / 33 / 15.5 / 1.5%). An 11-roll costs 10 and guarantees at least a Super Rare. A guaranteed Uber Rare lands at 50 rolls.' +
          (rolls ? '<br>You have opened <b>' + rolls + '</b> capsules; pity is at <b>' + pity + '</b>/50.' : '') +
          '<br>Duplicates are never wasted — they level a unit up to 30, each level adding 10% of its base bonus.';
      } },
    { k: 'pets eggs hatch rarity mythic',
      t: 'Pets',
      a: 'Hatch eggs in the Pets tab for companions that sit in slots and add passive bonuses. Rarer pets give bigger buffs, and duplicates still help. Keep the best ones equipped in the slots at the top of the tab.' },
    { k: 'minions hire amaans guild roster recruit team tokens perks',
      t: 'Hire Amaans',
      a: 'Found your guild, then recruit Amaans into a roster and send a team out to work. Completed cycles pay tokens which buy permanent perks. It runs in the background, so set a team going before you close the tab.' },
    { k: 'essence lab daily research',
      t: 'Essence Lab',
      a: 'The Essence Lab converts long play sessions into essence, which you spend on lab upgrades (including a bigger offline cap). It has a daily component, so check in once a day.' },
    { k: 'challenges locked how to unlock teachers lounge',
      t: 'Challenges',
      a: 'The Challenges tab unlocks with <b>Teacher\'s Lounge</b> (30 Gold Stars). Each challenge is a restricted run — no clicking, no buildings and so on — and completing one gives a permanent reward. There are 30.' },
    { k: 'extra credit mini games arcade catch tongue reaction',
      t: 'Extra credit mini-games',
      a: 'Three score-only mini-games: Catch Amaan, the Tongue meter and the Reaction pad. They are a break from clicking and track personal bests — they deliberately do not pay amaans, so the main game stays honest.' },
    { k: 'offline earnings earn while away afk closed cap hours idle sleeping',
      t: 'Offline earnings',
      a: 'You earn <b>50%</b> of your normal rate while the game is closed, capped at <b>8 hours</b>. The <b>Homework Diary</b> upgrade raises the rate to 75%, the <b>Alarm Clock</b> upgrade raises the cap to 24 hours, and Essence Lab clock levels add more on top.<br><i>If you meant playing with no connection:</i> install the hub from its home page and both games run offline.' },
    { k: 'wardrobe skins story worldbreaker cosmetic outfits',
      t: 'Wardrobe & Story',
      a: 'Cosmetic Amaan skins (including the Worldbreaker) plus the story log you unlock as you prestige. Purely visual — pick whichever makes you laugh most.' },
    { k: 'trophies achievements how many list',
      t: 'Trophies',
      a: 'Trophies are permanent achievements across clicking, buildings, prestige and the odd secret. They give a global production bonus, so they are worth chasing — the Trophies tab shows which are close.' },
    { k: 'export import save code transfer another device backup back up copy restore',
      t: 'Backing up your save',
      a: 'Settings → <b>Export save</b> copies a long code to your clipboard. Paste that into <b>Import save</b> on another device (or after clearing your browser) to restore everything. Do it before you clear site data — there is no cloud backup.' },
    { k: 'theme dark light appearance colour scheme night eyes',
      t: 'Dark and light mode',
      a: 'The game follows your device theme by default and you can force light or dark in Settings. Both have been tuned, so pick whichever is easier on your eyes.' },
    { k: 'how am i doing stats progress summary my numbers',
      t: 'Your progress',
      a: function () {
        var s = save();
        if (!s.v) return 'I cannot see a save yet — click Amaan a few times and ask me again.';
        return 'Here is where you are:<br>• Amaans now: <b>' + fmt(s.balance) + '</b><br>• All-time: <b>' + fmt(s.t) + '</b><br>• Clicks: <b>' + n(s.clicks).toLocaleString() + '</b><br>• Gold Stars: <b>' + fmt(s.stars) + '</b><br>• Diplomas: <b>' + fmt(s.dip) + '</b> (ever: ' + fmt(s.dipAll) + ')<br>• Halos: <b>' + fmt(s.halo) + '</b>';
      } }
  ];

  /* ---- Like a Christian ---- */
  function chStats() {
    return { best: n(ls('christianBest', 0)), perf: n(ls('christianPerfects', 0)),
             plays: n(ls('christianPlays', 0)), xp: n(ls('christianXP', 0)) };
  }
  var CHRISTIAN_KB = [
    { k: 'play playing how to play christian controls control move drag slide left right arrow keys finger mouse touch steer aim basics beginner start rules objective goal instructions what do i do',
      t: 'How to play Like a Christian',
      a: 'Bars fall from the top in time with the song. <b>Drag anywhere on the screen</b> to slide Christian left and right (arrow keys work too) so each one lands on top of his head.<br>Every bar you catch becomes part of his neck. The neck grows <b>downwards</b> from his chin, and Christian himself stays where he is, so the neck can run off the bottom of the screen.<br>You have <b>three lives</b> (the little heads in the top-right corner). Miss a bar and you lose one; lose all three and the song stops.' },
    { k: 'perfect perfects centre center dead on bonus sparkles double points flash accuracy sloppy off centre edge combo in a row streak',
      t: 'Perfect catches',
      a: function () {
        var c = chStats();
        return 'Land a bar within a few pixels of dead centre and it counts as a <b>Perfect!</b>: the word flashes, sparkles fly off and the catch is worth <b>double</b> (+2 instead of +1), plus extra hub XP.<br>An off-centre catch still counts and still grows the neck \u2014 it just leaves a kink in it. Every tenth catch in a row gets a little cheer of its own.' +
          (c.plays ? '<br>You have landed <b>' + c.perf + '</b> perfect catch' + (c.perf === 1 ? '' : 'es') + ' so far.' : '');
      } },
    { k: 'music song songs melody tune singing sound audio speed tempo quick faster sunny steps night walk brass parade which song change button tiles tile look style',
      t: 'The music and songs',
      a: 'Each game has <b>three original songs</b>, and each one has its own sound and its own tiles. <b>Sunny Steps</b> is bright and quick, with soft green tiles. <b>Night Walk</b> is slower and smoother, with blue rounded tiles. <b>Brass Parade</b> is the fastest and punchiest, with gold blocky tiles. Press the <b>Song</b> button on the title screen to switch; your choice is remembered.<br>Each song loops and speeds up every time it comes round again, and the bars fall faster with it. Mute the sound from the <b>Settings</b> gear in the bottom-left corner.' },
    { k: 'harder faster difficulty speed speeds drift drifting sideways side blocks block tiles moving move swing wind tips tip strategy better higher taller longer neck grow growing score improve advice stuck keep failing falling over topple lean leaning',
      t: 'Getting a higher tower',
      a: function () {
        var c = chStats();
        return 'Everything is tied to the song, so it gets harder each time the tune loops round: 1.2x, 1.4x, 1.6x \u2026 and the bars fall that much quicker.<br>Tips that work:<br>\u2022 <b>Listen</b> rather than watch \u2014 bars land on the beat, so move on the beat before.<br>\u2022 Move <b>early</b> and settle. A late lunge arrives after the bar does.<br>\u2022 Aim dead centre for perfects; they are worth double and they keep the neck straight.<br>\u2022 Think ahead to the next bar as soon as you catch one \u2014 at 1.6x there is no time to react from scratch.<br>\u2022 You have three lives, so one miss is not the end: reset your rhythm and carry on.' +
          (c.plays ? '<br>Your best tower so far is <b>' + c.best + '</b> block' + (c.best === 1 ? '' : 's') + '.' : '');
      } },
    { k: 'score scoring xp points level progress stats best record high score christianbest how am i doing progress profile',
      t: 'Score, XP and your record',
      a: function () {
        var c = chStats();
        if (!c.plays) return 'Each catch is <b>+1</b>, each perfect <b>+2</b>. When a run ends it pays hub XP worth <b>score \u00d7 3 + 2 per perfect</b>, which feeds the same level bar the other two games use. Your best tower, total perfects and play count are saved on this device.<br>You have not finished a run yet \u2014 play one and ask me again for your numbers.';
        return 'Here is your record:<br>\u2022 Best tower: <b>' + c.best + '</b><br>\u2022 Perfect catches: <b>' + c.perf + '</b><br>\u2022 Runs played: <b>' + c.plays + '</b><br>\u2022 XP earned here: <b>' + c.xp + '</b><br>Scoring is +1 per catch, +2 per perfect, and a finished run pays score \u00d7 3 + 2 per perfect into your hub level.';
      } },
    { k: 'who christian character head face photo picture boy blazer tie person avatar guy kid him',
      t: 'Who is Christian?',
      a: 'Christian is the star of the game, and the default person. The Person button also lets you play as Charlie, Amaan or Haider. The neck grows downwards from the chin of whoever you pick. The Difficulty button sets Easy, Medium or Hard: Easy gives 4 lives and a wider catch window, Medium is the standard game, and Hard gives 3 lives with tighter catch windows and faster songs.' },
    { k: 'lives life tries chances miss missed game over topple fell collapse restart retry again pause resume lost died end run finished settings gear',
      t: 'Game over and restarting',
      a: 'Each bar that goes past the head costs a life \u2014 you can see them counted down in the top-right. On the third miss the song stops and the run ends. The panel shows your score, best, perfects and the tallest neck you grew, and <b>Play again</b> starts a fresh one.<br>The <b>Settings</b> gear in the bottom-left pauses the run, and holds the sound switch, a restart and the way back to the hub.' }
  ];

  /* ---- Snariyan ---- */
  var SNARIYAN_KB = [
    { k: 'snariyan snake ariyan how to play controls swipe arrow keys wasd eat grow walls tail',
      t: 'How to play Snariyan',
      a: '<b>Snariyan</b> is classic snake with a twist: Ariyan is the snake, and the apples are Amaan. <b>Swipe</b> or use the <b>arrow keys / WASD</b> to steer. Every Amaan you eat grows the snake by one and speeds the game up a notch. Hit the walls or your own tail and the run ends. The board sits on a photo of Haider.' },
    { k: 'snariyan score scoring xp best pieces eaten grow',
      t: 'Snariyan scoring and XP',
      a: function () {
        var best = n(ls('snariyanBest', 0)), plays = n(ls('snariyanPlays', 0)), xp = n(ls('snariyanXP', 0));
        return 'Your score is simply how many Amaans you ate in the run. A finished run pays <b>5 × pieces eaten</b> of hub XP and counts towards your hub level, best and play count.<br>' +
          (plays ? 'Your record: best <b>' + best + '</b>, runs <b>' + plays + '</b>, XP earned here <b>' + xp + '</b>.' : 'You have not finished a run yet.');
      } },
    { k: 'snariyan tips strategy walls tail corners fast speed better advice',
      t: 'Snariyan tips',
      a: 'Keep the centre open: as the snake gets long, hugging the walls leaves no escape when an Amaan spawns on the far side. You can <b>queue</b> up to three turns, so plan the whole route at crossings. The game speeds up every meal — if it gets frantic, aim for wide loops and stop cutting corners. Share your best: the game-over panel has a 📤 Share button that builds a card image.' }
  ];

  /* ---- paccymatt ---- */
  var PACCYMATT_KB = [
    { k: 'paccymatt pac man pacman charlie maze pellets ghosts how to play controls swipe arrow keys wasd',
      t: 'How to play paccymatt',
      a: '<b>paccymatt</b> is a Pac-Man-style maze chase: Charlie eats every pellet while four ghosts hunt him. <b>Swipe</b> or use the <b>arrow keys / WASD</b>. Big corner pellets are Amaan — eat one and the ghosts turn blue and scatter for <b>7 seconds</b>; eating a blue ghost is worth <b>200</b>. Clear the maze to reach the next level, where the ghosts get faster. Three lives.' },
    { k: 'paccymatt score scoring xp level ghosts best record',
      t: 'paccymatt scoring and XP',
      a: function () {
        var best = n(ls('paccyBest', 0)), plays = n(ls('paccyPlays', 0)), xp = n(ls('paccyXP', 0)), ghosts = n(ls('paccyGhosts', 0));
        return 'Pellets are <b>10</b> each, fruit <b>20</b>, power pellets <b>50</b> and blue ghosts <b>200</b>. A finished run pays roughly a quarter of your score as <b>hub XP</b> (plus a small flat bonus) — it all feeds the same hub level.<br>' +
          (plays ? 'Your record: best <b>' + best + '</b>, runs <b>' + plays + '</b>, ghosts eaten <b>' + ghosts + '</b>, XP here <b>' + xp + '</b>.' : 'You have not finished a run yet.');
      } },
    { k: 'paccymatt tips strategy ghosts dodge corridors power pellet timing',
      t: 'paccymatt tips',
      a: 'The ghosts only scatter when an Amaan power pellet is fresh — eat them <i>while</i> blue for 200 a pop, but save one pellet as an escape hatch for when two ghosts trap a corridor. Watch which ghost is behind you: each one chases a little differently, and corners are where you lose them. Turns can be queued early — hold the direction a beat before the junction and Charlie takes it instantly.' }
  ];

  /* ---- Stack a Josh ---- */
  var STACKJOSH_KB = [
    { k: 'stack a josh stack tower tile how to play controls tap space drop ketchapp',
      t: 'How to play Stack a Josh',
      a: '<b>Stack a Josh</b> works exactly like the game Stack, except every tile is a picture of Josh: a slab slides back and forth, you <b>tap or press Space</b> to drop it on the tower, and any overhang gets sliced off and falls. Slabs alternate axis every floor and speed up as you climb. Miss the tower completely and the whole slab tumbles — game over.' },
    { k: 'stack josh perfect streak combo grow back sliced overhang',
      t: 'Perfects and streaks',
      a: 'Drop the slab dead aligned and it snaps into place as a <b>PERFECT</b>, with a pop and sparks. Chain PERFECTs and every <b>4th streak</b> grows the tower back wider (up to the starting size) — streaks are the only way to undo unlucky slices. The 🔥 PERFECT ×N pill shows your current streak; one sloppy drop resets it.' },
    { k: 'stack josh score scoring xp best leaderboard board world rank',
      t: 'Stack a Josh scoring, XP and the board',
      a: function () {
        var best = n(ls('stackJoshBest', 0)), plays = n(ls('stackJoshPlays', 0)), xp = n(ls('stackJoshXP', 0));
        return 'Each floor is <b>+1</b>; a run pays <b>score × 3 plus 2 per perfect</b> into your hub level. There is also a <b>global leaderboard</b> — tap 🏆 on the title or game-over screen, pick a name, and your best tower uploads after every run (same Supabase backend as Amaan Clicker\'s board).<br>' +
          (plays ? 'Your record: best tower <b>' + best + '</b>, runs <b>' + plays + '</b>, XP here <b>' + xp + '</b>.' : 'You have not stacked a single Josh yet — the board is waiting.');
      } },
    { k: 'stack josh tips strategy timing better higher tower advice',
      t: 'Stack a Josh tips',
      a: 'Watch the rhythm, not the slab: the speed is constant within a floor, so tap on the <i>beat</i> as the tile reaches the centre past its bounce. Sacrificing a sliver on purpose keeps the streak alive more often than chasing a risky PERFECT. When the tower thins close to nothing, aim for survival alignment — one PERFECT starts the grow-back at 4. The 📤 button on game over builds a share card with your tower.' }
  ];

  /* ---- Angry Haider ---- */
  var ANGRYHAIDER_KB = [
    { k: 'angry haider slingshot sling how to play aim drag pull launch fort pigs zach austin',
      t: 'How to play Angry Haider',
      a: '<b>Angry Haider</b> is a slingshot physics game: <b>drag the bird backwards</b> from the sling (a dotted arc previews the flight) and let go to fling. Smash the wooden, glass and stone fort so it collapses on the green pigs — that\'s <b>Zach and Austin</b> — and pop them all before you run out of birds. Pop a pig for <b>+1000</b>; rubble pays 50–150 per block. Three forts make one campaign, and the campaign remembers which fort you reached.' },
    { k: 'angry haider birds abilities slam dash haider zainab tap mid air midair',
      t: 'Haider vs Zainab — the abilities',
      a: 'The bird queue alternates between Haider and Zainab. <b>Tap while the bird is flying</b> to fire its ability once: <b>Haider SLAMs</b> — he stops, drops like a rock and hits about 60% harder, perfect for crushing a roof onto a pig hiding inside. <b>Zainab DASHes</b> — she surges forward at 145% speed, ideal for spearing straight through a sidewall. The little 💥 badge lights up when an ability is ready.' },
    { k: 'angry haider materials glass wood stone strong damage hp heavy',
      t: 'What breaks what',
      a: '<b>Glass</b> shatters from almost anything — it\'s mostly decoration and windows. <b>Wood</b> takes a solid hit but one bird usually finishes a post. <b>Stone</b> is heavy: you want it falling <i>on</i> pigs, not standing between you and them, so hit the wood holding it up. Falling rubble hurts pigs one and a half times as much as blocks, and a bird moving fast hits much harder than a slow one — a full-power pull is often better than a soft lob.' },
    { k: 'angry haider score scoring xp best forts campaign level progress save',
      t: 'Angry Haider scoring, XP and progress',
      a: function () {
        var best = n(ls('angryHaiderBest', 0)), plays = n(ls('angryHaiderPlays', 0)), xp = n(ls('angryHaiderXP', 0)), fort = n(ls('angryHaiderLevel', 0));
        return 'Every cleared fort pays <b>about 2% of your fort score plus +12 XP</b> into the shared hub bar; a failed fort still pays 2% of whatever you smashed. The campaign auto-saves the fort you reached, so you can come back later. Popping the last pig a bird early leaves the rest of the queue as bonus bragging rights.<br>' +
          (plays || fort ? 'Your campaign: best score <b>' + best + '</b>, campaigns ended <b>' + plays + '</b>, fort <b>' + Math.min(3, Math.max(1, fort)) + '/3</b>, XP here <b>' + xp + '</b>.' : 'The forts are undefeated so far.');
      } },
    { k: 'angry haider tips strategy stuck fort 3 castle cant beat advice help',
      t: 'Angry Haider tips',
      a: 'Aim for <b>Feet, not faces</b> — take out a posts at the bottom and gravity does the rest. On fort 3, use the easy starter pig on the little hut for points, then send one bird <i>under</i> the stone slab: pop either wooden support and the slab buries Austin itself. Save Haider\'s SLAM for anything still sheltered after the dust settles. And drag <b>as far back as the band stretches</b> — short pulls just feed the pigs.' }
  ];

  function tag(list, w) { return list.map(function (e) { e.w = w; return e; }); }
  var BY_GAME = { flappy: FLAPPY_KB, amaan: AMAAN_KB, christian: CHRISTIAN_KB, snariyan: SNARIYAN_KB, paccymatt: PACCYMATT_KB, stackjosh: STACKJOSH_KB, angryhaider: ANGRYHAIDER_KB };
  var KB;
  if (GAME === 'hub') {
    /* the hub assistant knows every game on the site equally well */
    var ALL = HUB_KB;
    Object.keys(BY_GAME).forEach(function (g) { ALL = ALL.concat(BY_GAME[g]); });
    KB = tag(ALL, 1.15);
  } else {
    var MINE = BY_GAME[GAME] || [];
    var OTHERS = [];
    var othersFirst3 = ['flappy', 'amaan', 'christian'];
    othersFirst3.forEach(function (g) { if (g !== GAME && BY_GAME[g]) OTHERS = OTHERS.concat(BY_GAME[g].slice(0, 3)); });
    KB = tag(HUB_KB, 1).concat(tag(MINE, 1.4)).concat(tag(OTHERS, 0.6));
  }

  /* ---------------- matching engine ----------------
     Tiny TF-IDF retriever: rare words count for more than common ones, long
     entries do not win just by being long, and a question that matches
     nothing gets an honest "I do not know" instead of a wrong answer. */
  var STOP = (' a an the and or but if then than as of for in on at to do does did is are am be been was were ' +
    'i me my mine you your yours it its this that these those there here what which how when where why ' +
    'can could should would will shall may might must get got give tell show know about please thanks ' +
    'want need use using any some more most very just really also too so work works working mean means thing stuff ').split(' ');
  var SYN = {
    powerup: 'orb orbs power powerups pickup buff', pipe: 'pipes tube obstacle',
    score: 'points point scoring', difficulty: 'difficult hard easy medium',
    mode: 'modes realistic normal', coin: 'coins money currency cost price',
    skin: 'skins ring colour color appearance cosmetic', diploma: 'diplomas graduate graduation',
    star: 'stars rebirth prestige', halo: 'halos transcend transcendence',
    capsule: 'capsules gacha roll rolls pull pulls summon banner pity',
    building: 'buildings structures', upgrade: 'upgrades upgrading',
    save: 'saves saving progress backup export import', offline: 'afk away idle closed',
    sound: 'audio mute music volume', install: 'app download pwa homescreen',
    leaderboard: 'board ranking global', chat: 'message messages talk',
    tip: 'tips advice strategy improve better stuck struggling',
    snake: 'snariyan ariyan serpent', maze: 'paccymatt pacman pac pellets labyrinth ghost ghosts',
    tower: 'stack slabs tile tiles josh ketchapp', perfect: 'perfects streak combo'
  };
  function words(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
      .filter(function (w) { return w && STOP.indexOf(w) === -1; })
      .map(function (w) { return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/(s|es|ing|ed)$/, '') : w; });
  }
  function expand(ws) {
    var out = {};
    ws.forEach(function (w) { out[w] = Math.max(out[w] || 0, 1); });
    ws.forEach(function (w) {
      for (var key in SYN) {
        if (w === key || SYN[key].split(' ').indexOf(w) !== -1) {
          out[key] = Math.max(out[key] || 0, 0.75);
          SYN[key].split(' ').forEach(function (t) { out[t] = Math.max(out[t] || 0, 0.5); });
        }
      }
    });
    return out;
  }

  var DF = {}, IDF = {};
  KB.forEach(function (e) {
    e.toks = {};
    words(e.k + ' ' + e.t).forEach(function (w) { e.toks[w] = 1; });
    e.size = Object.keys(e.toks).length || 1;
    for (var w in e.toks) DF[w] = (DF[w] || 0) + 1;
  });
  for (var w0 in DF) IDF[w0] = Math.log(1 + KB.length / DF[w0]);

  /* questions that are plainly not about the games — answer honestly rather
     than forcing the closest keyword match */
  var OFFTOPIC = [
    /\bwhat (is the )?time\b/i, /\bweather\b/i, /\bwho is (the )?(prime minister|president|king|queen)\b/i,
    /\bhow old\b/i, /\btell me a joke\b/i, /\bwhat day is\b/i, /\b\d+\s*[-+*\/x]\s*\d+\b/,
    /\bcapital of\b/i, /\btranslate\b/i, /\bhomework\b.*\banswer\b/i
  ];
  var SMALLTALK = [
    { re: /^(hi|hey|hello|yo|sup|hiya)\b/i, a: 'Hello! Ask me anything about the game — how something works, what to do next, or how to get better.' },
    { re: /\b(thanks|thank you|ta|cheers)\b/i, a: 'Any time. Ask me again whenever you are stuck.' },
    { re: /\b(who|what) are you\b/i, a: 'I am the helper for this hub. I know all seven games inside out, and I can also answer general questions when I am online. The game answers work even with no internet.' },
    { re: /\b(are you (an? )?(ai|robot|real|human))\b/i, a: 'I am a small built-in helper, not a person and not a cloud AI. Everything I say comes from a knowledge base baked into the game, plus your own save file.' },
    { re: /\b(bye|goodbye|see ya)\b/i, a: 'See you — go beat your best score. 👋' }
  ];

  function rank(q) {
    var raw = words(q);
    if (!raw.length) return [];
    var qt = expand(raw), flat = ' ' + String(q).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    return KB.map(function (e) {
      var sum = 0, hits = 0;
      for (var t in qt) {
        if (e.toks[t]) { sum += (IDF[t] || 1) * qt[t]; if (qt[t] >= 1) hits++; }
      }
      if (hits > 1) sum += 0.3 * (hits - 1);
      if (sum && (' ' + e.k + ' ' + e.t.toLowerCase() + ' ').indexOf(flat.trim()) !== -1) sum += 1.4;
      return { e: e, s: (sum / Math.sqrt(e.size)) * (e.w || 1), hits: hits, raw: raw.length };
    }).sort(function (a, b) { return b.s - a.s; });
  }

  function answer(q) {
    for (var i = 0; i < SMALLTALK.length; i++) {
      if (SMALLTALK[i].re.test(q)) return { title: 'Hello', body: SMALLTALK[i].a, also: [] };
    }
    for (var j = 0; j < OFFTOPIC.length; j++) {
      if (OFFTOPIC[j].test(q)) return null;
    }
    var ranked = rank(q);
    if (!ranked.length) return null;
    var top = ranked[0];
    if (!top || top.s <= 0) return null;
    if (top.hits < 2 && top.raw >= 3) return null;         // one stray word is not an answer
    if (top.s < 0.42) return null;
    var body = typeof top.e.a === 'function' ? top.e.a() : top.e.a;
    var also = ranked.slice(1, 4).filter(function (r) { return r.s >= top.s * 0.6 && r.hits >= 1; });
    return { title: top.e.t, body: body, also: also.map(function (r) { return r.e.t; }) };
  }

  /* ---------------- optional real-AI bridge ---------------- */

  function plain(html) {
    return String(html).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* (1) RETRIEVAL — hand the model the three most relevant KB entries so it
     answers from the real numbers instead of inventing plausible ones. */
  function contextFor(q) {
    var ranked = rank(q), out = [];
    for (var i = 0; i < ranked.length && out.length < 3; i++) {
      var r = ranked[i];
      if (r.s <= 0.02) break;
      var body = typeof r.e.a === 'function' ? r.e.a() : r.e.a;
      out.push({ title: r.e.t, text: plain(body).slice(0, 500) });
    }
    return out;
  }

  /* (2) LIVE SAVE STATS — turns generic tips into personal coaching. */
  function stats() {
    var out = {};
    try {
      var core = window.HubCore || (window.parent && window.parent !== window ? window.parent.HubCore : null);
      var hub = core && core.profile ? core.profile() : null;
      if (hub && hub.level) { out.hubLevel = hub.level; out.hubXp = Math.round(hub.xp); }
    } catch (e) { /* hub-core absent */ }
    if (GAME === 'flappy' || GAME === 'hub') {
      out.bestNormal = n(ls('flappyHaiderBest', 0));
      out.bestRealistic = n(ls('flappyHaiderBestReal', 0));
      out.coins = n(ls('flappyHaiderCoins', 0));
    }
    if (GAME === 'christian' || GAME === 'hub') {
      var ch = chStats();
      out.christianBestTower = ch.best; out.christianPerfects = ch.perf; out.christianPlays = ch.plays; out.christianXp = ch.xp;
    }
    if (GAME === 'amaan' || GAME === 'hub') {
      var s = save();
      if (s && (s.balance || s.t || s.stars)) {
        out.amaansNow = fmt(s.balance);
        out.amaansAllTime = fmt(s.t);
        out.clicks = n(s.clicks);
        out.goldStars = n(s.stars);
        out.diplomas = n(s.dip);
        out.diplomasEver = n(s.dipAll);
        out.halos = n(s.halo);
        out.buildingsOwned = s.o ? Object.keys(s.o).length : 0;
        out.upgradesOwned = s.up ? Object.keys(s.up).length : 0;
      }
    }
    if (GAME === 'hub') {
      out.snariyanBest = n(ls('snariyanBest', 0));
      out.snariyanPlays = n(ls('snariyanPlays', 0));
      out.paccyBest = n(ls('paccyBest', 0));
      out.paccyPlays = n(ls('paccyPlays', 0));
      out.stackJoshBest = n(ls('stackJoshBest', 0));
      out.stackJoshPlays = n(ls('stackJoshPlays', 0));
      out.angryHaiderBest = n(ls('angryHaiderBest', 0));
      out.angryHaiderPlays = n(ls('angryHaiderPlays', 0));
      out.angryHaiderFort = n(ls('angryHaiderLevel', 0));
      try { if (core && core.profile) { var pr = core.profile(); out.lastGame = pr.last; } } catch (e) {}
    }
    return out;
  }

  /* (4) SHORT MEMORY — the last three exchanges, so "no, the other one" works. */
  var HISTORY = [];
  function remember(q, a) {
    HISTORY.push({ q: String(q).slice(0, 200), a: plain(a).slice(0, 400) });
    while (HISTORY.length > 3) HISTORY.shift();
  }

  function remote(q) {
    var cfg = window.HUB_AI;
    if (!cfg || !cfg.endpoint) return Promise.resolve(null);
    return fetch(cfg.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q, game: GAME,
        context: contextFor(q),
        stats: stats(),
        history: HISTORY.slice()
      })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && (d.answer || d.text) ? String(d.answer || d.text) : null; })
      .catch(function () { return null; });
  }

  /* ---------------- UI ---------------- */
  var SUGGEST = GAME === 'flappy'
    ? ['What is Realistic mode?', 'What do the orbs do?', 'How do I score higher?', 'How do I unlock skins?', 'What is my best score?']
    : GAME === 'christian'
    ? ['How do I play?', 'What is a perfect catch?', 'Why does the music change?', 'How do I build a taller tower?', 'How am I doing?']
    : GAME === 'amaan'
    ? ['What should I buy next?', 'When should I rebirth?', 'How do Diplomas work?', 'What are the capsule rates?', 'How am I doing?']
    : ['What is The Game Hub?', 'How does hub level work?', 'How do I play Angry Haider?', 'How do I play Stack a Josh?', 'What is the paccymatt game?'];

  var css = [
    '#hubAsk{position:fixed;z-index:9000;right:14px;bottom:14px;border:0;cursor:pointer;border-radius:999px;',
    'padding:11px 16px;font:800 14px "Trebuchet MS","Segoe UI",system-ui,sans-serif;color:#fff;',
    'background:linear-gradient(135deg,' + THEME.accent + ',' + THEME.deep + ');box-shadow:0 8px 22px rgba(0,0,0,.35);display:flex;align-items:center;gap:7px}',
    '#hubAsk:hover{transform:translateY(-2px)}#hubAsk:active{transform:scale(.97)}',
    '#hubAskWrap{position:fixed;inset:0;z-index:9001;display:none;background:rgba(6,14,26,.55);backdrop-filter:blur(2px)}',
    '#hubAskWrap.on{display:block}',
    '#hubAskCard{position:absolute;right:12px;bottom:12px;left:12px;top:12px;max-width:430px;max-height:620px;margin-left:auto;',
    'background:#fff;color:#17213a;border-radius:18px;display:flex;flex-direction:column;overflow:hidden;',
    'box-shadow:0 30px 70px rgba(0,0,0,.45);font:14px/1.45 "Trebuchet MS","Segoe UI",system-ui,sans-serif}',
    '#hubAskHead{display:flex;align-items:center;gap:9px;padding:12px 14px;color:#fff;background:linear-gradient(135deg,' + THEME.deep + ',#0f1830)}',
    '#hubAskHead b{font-size:16px}#hubAskHead small{opacity:.75;font-size:11px;display:block;font-weight:600}',
    '#hubAskX{margin-left:auto;border:0;background:rgba(255,255,255,.16);color:#fff;border-radius:9px;padding:6px 10px;font-weight:800;cursor:pointer}',
    '#hubAskLog{flex:1;overflow-y:auto;padding:13px;background:#eef2f8;display:flex;flex-direction:column;gap:10px}',
    '.hub-msg{max-width:88%;padding:10px 12px;border-radius:14px;box-shadow:0 2px 6px rgba(20,32,63,.08);word-wrap:break-word}',
    '.hub-msg.bot{background:#fff;border-top-left-radius:5px;align-self:flex-start}',
    '.hub-msg.me{background:' + THEME.deep + ';color:#fff;border-top-right-radius:5px;align-self:flex-end}',
    '.hub-msg b.t{display:block;color:' + THEME.deep + ';font-size:13px;letter-spacing:.3px;text-transform:uppercase;margin-bottom:4px}',
    '.hub-msg.bot a{color:#1565c0}',
    '.hub-chips{display:flex;flex-wrap:wrap;gap:6px;padding:9px 11px;background:#f7f9fc;border-top:1px solid #e3e8f2}',
    '.hub-chip{border:1px solid #d6dcea;background:#fff;color:#2b3858;border-radius:999px;padding:6px 11px;font:700 12px inherit;cursor:pointer}',
    '.hub-chip:hover{border-color:' + THEME.accent + ';color:' + THEME.deep + '}',
    '#hubAskForm{display:flex;gap:8px;padding:10px;background:#fff;border-top:1px solid #e3e8f2}',
    '#hubAskIn{flex:1;min-width:0;border:1px solid #d6dcea;border-radius:11px;padding:10px 12px;font:inherit;color:#17213a;background:#fbfcff}',
    '#hubAskIn:focus{outline:2px solid ' + THEME.accent + ';border-color:transparent}',
    '#hubAskGo{border:0;border-radius:11px;padding:10px 15px;font:800 14px inherit;color:#fff;cursor:pointer;background:' + THEME.deep + '}',
    '@media(max-width:520px){#hubAskCard{left:8px;right:8px;top:8px;bottom:8px;max-height:none}}',
    GAME === 'amaan' ? '.toasts{bottom:calc(66px + env(safe-area-inset-bottom,0px))!important}' : ''
  ].join('');

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build() {
    var style = el('style'); style.textContent = css; document.head.appendChild(style);

    var btn = el('button'); btn.id = 'hubAsk'; btn.type = 'button';
    btn.innerHTML = '<span>' + THEME.icon + '</span><span>' + THEME.name + '</span>';
    btn.setAttribute('aria-label', 'Open the in-game assistant');

    var wrap = el('div'); wrap.id = 'hubAskWrap';
    var card = el('div'); card.id = 'hubAskCard';
    var head = el('div'); head.id = 'hubAskHead';
    head.innerHTML = '<span style="font-size:20px">' + THEME.icon + '</span><div><b>' + THEME.name +
      '</b><small>Ask me anything about ' + GAMENAME[GAME] + ' or the hub</small></div>';
    var x = el('button', null, 'Close'); x.id = 'hubAskX'; x.type = 'button';
    head.appendChild(x);

    var log = el('div'); log.id = 'hubAskLog';
    var chips = el('div', 'hub-chips');
    var form = document.createElement('form'); form.id = 'hubAskForm';
    var input = el('input'); input.id = 'hubAskIn'; input.type = 'text';
    input.placeholder = 'Type a question…'; input.autocomplete = 'off';
    var go = el('button', null, 'Ask'); go.id = 'hubAskGo'; go.type = 'submit';
    form.appendChild(input); form.appendChild(go);

    card.appendChild(head); card.appendChild(log); card.appendChild(chips); card.appendChild(form);
    wrap.appendChild(card);
    document.body.appendChild(btn); document.body.appendChild(wrap);

    function bubble(who, html) {
      var m = el('div', 'hub-msg ' + who, html);
      log.appendChild(m); log.scrollTop = log.scrollHeight;
      return m;
    }
    function setChips(list) {
      chips.innerHTML = '';
      list.slice(0, 5).forEach(function (text) {
        var c = el('button', 'hub-chip', text); c.type = 'button';
        c.onclick = function () { ask(text); };
        chips.appendChild(c);
      });
    }
    function ask(q) {
      q = String(q || input.value).trim();
      if (!q) return;
      input.value = '';
      bubble('me', q.replace(/[<>]/g, ''));
      var hit = answer(q);
      if (hit) {
        bubble('bot', '<b class="t">' + hit.title + '</b>' + hit.body);
        remember(q, hit.title + '. ' + hit.body);
        if (hit.also.length) setChips(hit.also.concat(SUGGEST).slice(0, 5));
        else setChips(SUGGEST);
        return;
      }
      var thinking = bubble('bot', 'Let me think…');
      remote(q).then(function (text) {
        if (text) { thinking.innerHTML = text.replace(/[<>]/g, '').replace(/\n/g, '<br>'); remember(q, text); }
        else {
          thinking.innerHTML = '<b class="t">Not sure yet</b>I could not find an answer to that. Try asking it another way, or pick one of these:';
          setChips(SUGGEST);
        }
        log.scrollTop = log.scrollHeight;
      });
    }

    function open() {
      wrap.classList.add('on');
      if (!log.childNodes.length) {
        bubble('bot', '<b class="t">Hello 👋</b>I am the in-game helper for ' +
          GAMENAME[GAME] +
          '. Ask me how something works, what to do next, or how to get better — I can see your own progress, so the answers use your real numbers. I work with no internet connection.');
        setChips(SUGGEST);
      }
      setTimeout(function () { input.focus(); }, 60);
    }
    function close() { wrap.classList.remove('on'); }

    btn.onclick = open; x.onclick = close;
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); ask(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('on')) { close(); e.stopPropagation(); }
    }, true);
    // typing in the assistant must never reach the game's own key handlers
    ['keydown', 'keyup', 'keypress'].forEach(function (evt) {
      card.addEventListener(evt, function (e) { e.stopPropagation(); });
    });

    window.__hubAssistant = { open: open, close: close, ask: ask, answer: answer, game: GAME, kb: KB,
      context: contextFor, stats: stats, history: function () { return HISTORY.slice(); } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
