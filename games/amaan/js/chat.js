/* Amaan Clicker — Supabase Global Chat */
(function(){
'use strict';
var CFG=(window.HUB_SUPA&&window.HUB_SUPA.chat)||{};
var PROJECT_URL=CFG.url||'https://azmeeaghohopwdwxmvbr.supabase.co';
var PUBLISHABLE_KEY=CFG.key||'sb_publishable_00HcX4jPC-y8_OnwX1kv-g_zU_OPwcw';
var BLOCK_KEY='amaan-chat-blocked-v1';
var q=function(id){return document.getElementById(id)};
var client=null,user=null,profile=null,channel=null,messages=[],started=false,sending=false;
var blocked=new Set();
try{blocked=new Set(JSON.parse(localStorage.getItem(BLOCK_KEY)||'[]'))}catch(e){}

function setStatus(text,kind){var e=q('chatStatus');if(!e)return;e.textContent=text;e.className='chat-status '+(kind||'')}
function showError(message){setStatus('Chat unavailable','bad');q('chatError').hidden=false;q('chatErrorText').textContent=cleanError(message);q('chatRetry').disabled=false}
function cleanError(e){var m=typeof e==='string'?e:(e&&e.message)||'Unknown chat error.';if(/relation .* does not exist|schema cache|function public\./i.test(m))return 'The Supabase chat SQL has not been installed yet. Run supabase-global-chat-setup.sql in the Supabase SQL Editor.';if(/anonymous|provider|signup/i.test(m))return 'Anonymous Sign-Ins are not enabled in Supabase Authentication settings.';return m}
function saveBlocked(){localStorage.setItem(BLOCK_KEY,JSON.stringify(Array.from(blocked)));renderMessages()}
function escTime(x){try{return new Date(x).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}

async function startChat(force){
  if(started&&!force)return;started=true;q('chatError').hidden=true;q('chatRetry').disabled=true;setStatus('Connecting…','wait');
  try{
    if(!window.SupabaseBrowser)throw new Error('The local Supabase chat library did not load.');
    if(!client)client=window.SupabaseBrowser.createClient(PROJECT_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    var s=await client.auth.getSession();if(s.error)throw s.error;var session=s.data.session;
    if(!session){var a=await client.auth.signInAnonymously();if(a.error)throw a.error;session=a.data.session}
    if(!session||!session.user)throw new Error('Anonymous Sign-In failed.');user=session.user;
    await loadProfile();await loadMessages();subscribeRealtime();setStatus('Live','good');q('chatRetry').disabled=false;
  }catch(e){started=false;showError(e)}
}
async function loadProfile(){
  var r=await client.from('chat_profiles').select('display_name,is_banned').eq('user_id',user.id).maybeSingle();if(r.error)throw r.error;profile=r.data||null;
  if(profile&&profile.is_banned){q('chatNameCard').hidden=true;q('chatMain').hidden=true;throw new Error('This chat account is banned.')}
  q('chatNameCard').hidden=!!profile;q('chatMain').hidden=!profile;
  if(profile){q('chatMyName').textContent=profile.display_name;q('chatNameInput').value=profile.display_name}else q('chatNameInput').value='';
  updateBlockedCount();
}
async function saveName(){
  var name=q('chatNameInput').value.trim();q('chatNameError').textContent='';
  if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){q('chatNameError').textContent='Use 3–16 letters, numbers or underscores.';return}
  q('chatSaveName').disabled=true;
  var nameBad=screenMessage(name+' ok');if(nameBad&&/not allowed here/.test(nameBad)){q('chatNameError').textContent='Please choose a cleaner name.';return}
  try{var r=await client.rpc('set_chat_display_name',{p_name:name});if(r.error)throw r.error;profile=Array.isArray(r.data)?r.data[0]:r.data;q('chatNameCard').hidden=true;q('chatMain').hidden=false;q('chatMyName').textContent=name;setStatus('Live','good');await loadMessages();subscribeRealtime()}
  catch(e){q('chatNameError').textContent=cleanError(e)}finally{q('chatSaveName').disabled=false}
}
function editName(){q('chatNameCard').hidden=false;q('chatNameInput').value=profile?profile.display_name:'';q('chatNameInput').focus()}

async function loadMessages(){
  if(!profile){messages=[];renderMessages();return}
  var r=await client.from('chat_messages').select('id,user_id,display_name,body,created_at,deleted_at').is('deleted_at',null).order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;messages=(r.data||[]).reverse();renderMessages(true)
}
function addMessage(m){if(!m||m.deleted_at)return;var i=messages.findIndex(function(x){return String(x.id)===String(m.id)});if(i>=0)messages[i]=m;else messages.push(m);if(messages.length>100)messages=messages.slice(-100);renderMessages(true)}
function removeMessage(id){messages=messages.filter(function(x){return String(x.id)!==String(id)});renderMessages()}
function subscribeRealtime(){
  if(!client||!profile)return;if(channel)client.removeChannel(channel);
  channel=client.channel('amaan-global-chat')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},function(p){addMessage(p.new)})
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'chat_messages'},function(p){if(p.new&&p.new.deleted_at)removeMessage(p.new.id);else addMessage(p.new)})
    .on('postgres_changes',{event:'DELETE',schema:'public',table:'chat_messages'},function(p){removeMessage((p.old||{}).id)})
    .subscribe(function(status){if(status==='SUBSCRIBED')setStatus('Live','good');else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setStatus('Reconnecting…','wait')})
}
function renderMessages(scroll){
  var box=q('chatMessages');if(!box)return;box.innerHTML='';var visible=messages.filter(function(m){return !blocked.has(m.user_id)});
  if(!visible.length){var empty=document.createElement('div');empty.className='chat-empty';empty.textContent=blocked.size?'No unblocked messages yet.':'No messages yet. Say hello to Amaan fans!';box.appendChild(empty)}
  visible.forEach(function(m){
    var own=user&&m.user_id===user.id,row=document.createElement('article');row.className='chat-message'+(own?' own':'');row.dataset.id=m.id;
    var top=document.createElement('div');top.className='chat-message-top';var name=document.createElement('b');name.textContent=m.display_name+(own?' (you)':'');var time=document.createElement('time');time.dateTime=m.created_at;time.textContent=escTime(m.created_at);top.append(name,time);
    var body=document.createElement('p');body.textContent=m.body;row.append(top,body);
    var actions=document.createElement('div');actions.className='chat-message-actions';
    if(own){var del=button('Delete',function(){deleteMessage(m.id)});actions.append(del)}else{actions.append(button('Report',function(){reportMessage(m.id)}),button('Block',function(){blockPlayer(m.user_id,m.display_name)}))}
    row.append(actions);box.appendChild(row)
  });
  if(scroll)requestAnimationFrame(function(){box.scrollTop=box.scrollHeight})
}

/* ---------- client-side message filter ----------------------------------
   First line of defence only: it stops accidents and lazy abuse instantly and
   without a round trip. The authoritative copy of these rules lives in
   supabase/chat-hardening.sql, because anything in this file can be bypassed
   by editing it in the browser. Keep the two lists in sync. */
var BAD_WORDS = ['fuck','shit','bitch','cunt','whore','slut','bastard','dick','pussy','wank',
  'nigger','nigga','paki','chink','spic','kike','faggot','fag','tranny','retard','rape','rapist',
  'kys','kill yourself','pedo','paedo','nonce','cum','blowjob','porn','pornhub','onlyfans',
  'fvck','fuk','fck','phuck','biatch','cnut','azz','wtf','stfu','shag'];
var ALLOW = ['scunthorpe','assembly','class','classic','bass','grass','pass','glass','analysis','shitake','cockpit','dickens'];
function normalise(text){
  return String(text).toLowerCase()
    .replace(/[àáâä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
    .replace(/[òóôö]/g,'o').replace(/[ùúûü]/g,'u')
    .replace(/[0@]/g,'o').replace(/v/g,'u').replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/4/g,'a')
    .replace(/5/g,'s').replace(/7/g,'t').replace(/[^a-z ]+/g,'')
    .replace(/(.)\1{2,}/g,'$1$1');
}
function screenMessage(body){
  var raw=String(body), low=raw.toLowerCase(), flat=normalise(raw), bare=flat.replace(/ /g,'');
  if(raw.trim().length<2) return 'Say a little more than that.';
  if(/(https?:\/\/|www\.|discord\.gg|t\.me|bit\.ly)/i.test(raw)) return 'Links are not allowed in chat.';
  if(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(raw)) return 'Please do not post email addresses.';
  if(/(\+?\d[\d ()-]{8,}\d)/.test(raw)) return 'Please do not post phone numbers.';
  if(/(snap|insta|instagram|whatsapp|telegram|discord)\s*[:@]?\s*[\w.]{3,}/i.test(low)) return 'Please keep social handles out of the public chat.';
  if(raw.replace(/[^A-Za-z]/g,'').length>=12 && raw===raw.toUpperCase() && /[A-Z]/.test(raw)) return 'Please turn off caps lock.';
  if(/(.)\1{9,}/.test(raw)) return 'That looks like spam.';
  var keep=ALLOW.slice();
  for(var i=0;i<BAD_WORDS.length;i++){
    var w=normalise(BAD_WORDS[i]).replace(/ /g,'');
    if(!w) continue;
    if(bare.indexOf(w)!==-1){
      var innocent=false;
      for(var j=0;j<keep.length;j++){ if(bare.indexOf(normalise(keep[j]).replace(/ /g,''))!==-1 && normalise(keep[j]).replace(/ /g,'').indexOf(w)!==-1) innocent=true; }
      if(!innocent) return 'Keep it friendly — that word is not allowed here.';
    }
  }
  return null;
}
var lastSendAt=0, recentBodies=[];
function rateLimit(body){
  var now=Date.now();
  if(now-lastSendAt<2500) return 'Slow down a moment before sending again.';
  if(recentBodies.indexOf(body.toLowerCase())!==-1) return 'You just said that.';
  return null;
}

function button(label,fn){var b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;return b}
async function sendMessage(){
  if(sending||!profile)return;var input=q('chatInput'),body=input.value.trim();q('chatSendError').textContent='';if(!body)return;if(body.length>250){q('chatSendError').textContent='Maximum 250 characters.';return}
  var blockReason=screenMessage(body)||rateLimit(body);
  if(blockReason){q('chatSendError').textContent=blockReason;return}
  sending=true;q('chatSend').disabled=true;
  try{var r=await client.rpc('send_chat_message',{p_body:body});if(r.error)throw r.error;lastSendAt=Date.now();recentBodies.push(body.toLowerCase());if(recentBodies.length>5)recentBodies.shift();input.value='';updateCount();if(r.data)addMessage(Array.isArray(r.data)?r.data[0]:r.data)}catch(e){q('chatSendError').textContent=cleanError(e)}finally{sending=false;setTimeout(function(){q('chatSend').disabled=false},500)}
}
async function deleteMessage(id){if(!confirm('Delete your message?'))return;var r=await client.rpc('delete_own_chat_message',{p_message_id:id});if(r.error)q('chatSendError').textContent=cleanError(r.error);else removeMessage(id)}
async function reportMessage(id){var reason=prompt('Why are you reporting this message?','Inappropriate message');if(reason===null)return;var r=await client.rpc('report_chat_message',{p_message_id:id,p_reason:reason||'Inappropriate message'});if(r.error)q('chatSendError').textContent=cleanError(r.error);else q('chatSendError').textContent='Report submitted. Thank you.'}
function blockPlayer(id,name){if(!confirm('Block '+name+' on this device?'))return;blocked.add(id);saveBlocked();updateBlockedCount()}
function updateBlockedCount(){q('chatBlockedCount').textContent=blocked.size}
function clearBlocks(){if(!blocked.size||confirm('Unblock every locally blocked player?')){blocked.clear();saveBlocked();updateBlockedCount()}}
function updateCount(){var n=q('chatInput').value.length;q('chatCharCount').textContent=n+' / 250';q('chatSend').disabled=sending||n<1||n>250}

function setup(){
  var tab=document.querySelector('[data-tab="chat"]');if(!tab)return;tab.addEventListener('click',function(){startChat(false)});
  q('chatRetry').onclick=function(){started=false;startChat(true)};q('chatSaveName').onclick=saveName;q('chatChangeName').onclick=editName;q('chatClearBlocks').onclick=clearBlocks;q('chatSend').onclick=sendMessage;
  q('chatNameInput').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();saveName()}});
  q('chatInput').addEventListener('input',updateCount);q('chatInput').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});updateCount();updateBlockedCount()
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
window.addEventListener('pagehide',function(){if(client&&channel)client.removeChannel(channel)});
})();
