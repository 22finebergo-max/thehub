/* The Game Hub — one place for every Supabase endpoint.
   Publishable ("anon") keys are meant to be public; all real protection
   lives in Row Level Security + the SQL in /supabase of this repo.

   TWO PROJECTS IS DELIBERATE. Chat and leaderboard share no data; they are
   kept apart on purpose. Both need RLS checked independently, and both free
   projects pause after ~1 week idle. See supabase/README.md before merging.

   If you ever do want ONE project for both features:
     1. create the leaderboard table in the chat project (supabase/leaderboard-schema.sql)
     2. set leaderboard.url/key below to the same values as chat.url/key
     3. redeploy. Old scores stay in the old project unless you migrate them. */
(function () {
  window.HUB_SUPA = {
    chat: {
      url: 'https://azmeeaghohopwdwxmvbr.supabase.co',
      key: 'sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw'
    },
    leaderboard: {
      url: 'https://azmeeaghohopwdwxmvbr.supabase.co',
      key: 'sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw'
    }
  };
})();
