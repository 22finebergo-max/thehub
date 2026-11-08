/* "Beat my score" sharing for the hub's games.
   Uses the phone's share sheet when there is one, otherwise copies the message. */
(function () {
  function toast(text) {
    var t = document.createElement('div');
    t.textContent = text;
    t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#14213d;color:#fff;padding:10px 16px;border-radius:14px;font:700 14px system-ui,sans-serif;z-index:99999;max-width:90vw;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.3)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  window.HubShare = function (game, detail) {
    var url = location.hostname.endsWith('itch.io') ? 'https://biggamehub.itch.io/' : (location.origin + '/');
    var text = 'I ' + detail + ' in ' + game + ' on The Game Hub! Can you beat me?';
    if (navigator.share) {
      navigator.share({ title: 'The Game Hub', text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + ' ' + url).then(function () { toast('Copied! Paste it to a friend'); }, function () { toast(text + ' ' + url); });
    } else {
      toast(text + ' ' + url);
    }
  };
})();
