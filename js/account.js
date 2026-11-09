/* Shared player account for the games (Supabase). Anonymous by default; an email + password upgrades the same player,
   so existing progress stays with them. Used by games that save progress. */
(function(){
  var URL='https://azmeeaghohopwdwxmvbr.supabase.co';
  var KEY='sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw';
  var sb=null, listeners=[];
  function client(){
    if(!sb && window.SupabaseBrowser) sb=window.SupabaseBrowser.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return sb;
  }
  function emit(){ var s=status(); listeners.forEach(function(f){ try{f(s)}catch(e){} }); }
  function status(){
    var c=client(); if(!c) return {ready:false};
    return {ready:true, user:(window.__hubUser||null)};
  }
  async function refresh(session){
    window.__hubUser = session && session.user ? {id:session.user.id, email:session.user.email||null, anonymous:!!session.user.is_anonymous} : null;
    emit();
  }
  async function ensureUser(){
    var c=client(); if(!c) throw new Error('Supabase library not loaded');
    var s=await c.auth.getSession();
    var session=s.data&&s.data.session;
    if(!session){ var a=await c.auth.signInAnonymously(); if(a.error) throw a.error; session=a.data.session; }
    await refresh(session);
    return session.user.id;
  }
  // Turns the current anonymous player into an email account, keeping their id and progress.
  async function upgrade(email,password){
    await ensureUser();
    var r=await client().auth.updateUser({email:email,password:password});
    if(r.error) throw r.error;
    return {needsConfirm: !(r.data&&r.data.user&&r.data.user.email_confirmed_at)};
  }
  // Signs in to an existing email account on this device (its saved progress loads from that account).
  async function signIn(email,password){
    var r=await client().auth.signInWithPassword({email:email,password:password});
    if(r.error) throw r.error;
    await refresh(r.data.session);
    return true;
  }
  async function signOut(){
    await client().auth.signOut();
    await ensureUser();
  }
  var c=client();
  if(c){ c.auth.onAuthStateChange(function(_e,session){ refresh(session); }); }
  window.HubAccount={client:client, ensureUser:ensureUser, upgrade:upgrade, signIn:signIn, signOut:signOut, status:status,
    onChange:function(f){ listeners.push(f); }};
})();
