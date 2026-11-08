(function(){'use strict';
const R=BrawlKingsRules,$=id=>document.getElementById(id),palette={grass:0x439965,grassAlt:0x469d69,line:0x37865a,wall:0xb46a55,wallTop:0xe39b78,water:0x3c9fbe,bush:0x267344,gold:0xffd257,blue:0x54c8f5,red:0xff749f,white:0xffffff,dark:0x172332,gem:0xc69cff};
let selected=R.get('amaan'),mode='gem',game=null,scene=null,paused=false,ended=false,audio=null;const input={x:0,y:0,fire:false,aim:null,keys:{}};
function read(k){try{return Number(localStorage.getItem(k))||0;}catch(e){return 0;}}
function add(k,n){try{localStorage.setItem(k,String(read(k)+n));}catch(e){}}
function sound(freq){if(!HubCore.soundOn())return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.09);}catch(e){}}
function portrait(c,cls){return c.photo?'<img class="'+cls+'" src="'+c.photo+'" alt="'+c.name+'">':'<span class="'+cls+'">'+c.icon+'</span>';}
function paintLobby(){ $('selected').innerHTML=portrait(selected,'portrait')+'<div><h2>'+selected.name+'</h2><p>'+selected.role+' · '+selected.hp+' HP</p><p>Super: <strong>'+selected.super+'</strong></p></div>';document.querySelectorAll('.fighter').forEach(b=>{const active=b.dataset.id===selected.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$('stats').innerHTML='<span>🏆 Wins <b>'+read('brawlKingsWins')+'</b></span><span>⚔ Matches <b>'+read('brawlKingsPlays')+'</b></span><span>ϟ XP <b>'+read('brawlKingsXP')+'</b></span>';}
R.roster.forEach(c=>{const b=document.createElement('button');b.className='fighter';b.dataset.id=c.id;b.setAttribute('aria-label','Choose '+c.name);b.innerHTML='<div class="fighter-art">'+portrait(c,'')+'</div><b>'+c.name+'</b><small>'+c.role+'</small>';b.onclick=()=>{selected=c;paintLobby();sound(500);};$('roster').appendChild(b);});paintLobby();
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;document.querySelectorAll('.mode').forEach(m=>{m.classList.toggle('active',m===b);m.setAttribute('aria-pressed',String(m===b));});$('mode-info').textContent=mode==='gem'?'3v3 vs bots · Hold 10 gems for 15 seconds':mode==='knockout'?'3v3 vs bots · Each fighter has 3 lives. Wipe out the other team.':'6 fighters vs bots · Last fighter standing';});
function paintSound(){$('sound').textContent=HubCore.soundOn()?'🔊':'🔇';}paintSound();$('sound').onclick=()=>{HubCore.setSound(!HubCore.soundOn());paintSound();};window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.hub)paintSound();if(e.data?.hubKey)keyAction(e.data.hubKey);});
function clearInput(){input.x=0;input.y=0;input.fire=false;input.aim=null;input.keys={};$('joystick').firstElementChild.style.transform='';}
function openPause(){if(!scene||ended||paused||inParty)return;paused=true;clearInput();scene.physics.pause();$('modal').hidden=false;$('result-icon').textContent='⏸';$('result-title').textContent='Paused';$('result-copy').textContent='Your arena is waiting.';$('resume').textContent='Resume →';}
function resume(){if(ended){if(inParty){leaveParty();$('exit').click();return;}start();return;}paused=false;$('modal').hidden=true;scene?.physics.resume();}
$('pause').onclick=()=>paused?resume():openPause();$('resume').onclick=resume;$('exit').onclick=()=>{leaveParty();if(game){game.destroy(true);game=null;scene=null;}$('match').hidden=true;$('modal').hidden=true;$('lobby').hidden=false;$('pause').hidden=true;clearInput();paintLobby();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)openPause();});
function keyAction(code){if(code==='Space')scene?.useSuper(scene.player);if(code==='KeyP'||code==='Escape')paused?resume():openPause();}
window.addEventListener('keydown',e=>{if($('match').hidden)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();input.keys[e.code]=true;if(!e.repeat)keyAction(e.code);});window.addEventListener('keyup',e=>delete input.keys[e.code]);window.addEventListener('blur',()=>{clearInput();openPause();});
let stickPointer=null;const stick=$('joystick');function stickMove(e){if(e.pointerId!==stickPointer)return;const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,dist=Math.hypot(x,y),scale=Math.min(1,28/(dist||1));input.x=x*scale/28;input.y=y*scale/28;stick.firstElementChild.style.transform='translate('+x*scale+'px,'+y*scale+'px)';}stick.onpointerdown=e=>{stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);};stick.onpointermove=stickMove;function stickEnd(e){if(e.pointerId===stickPointer){stickPointer=null;input.x=0;input.y=0;stick.firstElementChild.style.transform='';}}stick.onpointerup=stickEnd;stick.onpointercancel=stickEnd;
$('fire').onpointerdown=e=>{e.preventDefault();input.fire=true;$('fire').setPointerCapture(e.pointerId);};$('fire').onpointerup=$('fire').onpointercancel=()=>input.fire=false;$('super').onclick=()=>scene?.useSuper(scene.player);

/* ---------- Party (online 2-player) ----------
   The host's device runs the arena. The guest's device applies the host's snapshots
   and sends its movement and fire inputs back. Each player's own fighter is:
   host = fighter 0 (team 0), guest = fighter 3 (team 1). Bots fill the other slots. */
let party=null,inParty=false,leaving=false;
function isMine(id){return party?(party.isHost?id===0:id===3):id===0;}
function partyRoster(){return [party.hostChar,party.bots[0],party.bots[1],party.guestChar,party.bots[2],party.bots[3]];}
function buildSnap(sc){return{
  f:sc.fighters.map(f=>({i:f.id,x:Math.round(f.sprite.x),y:Math.round(f.sprite.y),h:Math.round(f.hp),a:f.ammo,d:f.dead,o:f.out,l:f.lives,c:Math.round(f.charge),g:f.gems,s:f.shield>0?1:0,w:f.slow>0?1:0})),
  b:sc.bullets.getChildren().map(b=>({x:Math.round(b.x),y:Math.round(b.y),o:b.owner?b.owner.id:0})),
  g:sc.gems.map(g=>({x:Math.round(g.x),y:Math.round(g.y)}))};}
function applySnap(sc,s){
  s.f.forEach(d=>{const f=sc.fighters[d.i];if(!f)return;
    f.hp=d.h;f.ammo=d.a;f.lives=d.l;f.charge=d.c;f.gems=d.g;f.out=d.o;f.shield=d.s;f.slow=d.w;
    if(d.d!==f.dead){f.dead=d.d;
      if(d.d){f.sprite.disableBody(true,true);f.label.setVisible(false);f.shadow?.setVisible(false);}
      else{f.sprite.enableBody(true,d.x,d.y,true,true);f.label.setVisible(true);f.shadow?.setVisible(true);}}
    if(!f.dead){f.sprite.body.reset(d.x,d.y);f.sprite.setAlpha(f.shield?.65:1);}
  });
  sc.bullets.clear(true,true);
  s.b.forEach(d=>{const ow=sc.fighters[d.o],b=sc.bullets.create(d.x,d.y,'bullet');b.setTint(ow?ow.c.color:palette.white).setDepth(30);b.life=99;b.owner=ow||null;});
  sc.gems.forEach(g=>g.destroy());
  sc.gems=s.g.map(g=>sc.add.star(g.x,g.y,4,6,12,palette.gem).setDepth(10));
}
function sendInput(dt){
  party.inT=(party.inT||0)-dt;if(party.inT>0)return;party.inT=.05;
  const k=input.keys,x=input.x+(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),y=input.y+(k.KeyS||k.ArrowDown?1:0)-(k.KeyW||k.ArrowUp?1:0);
  party.room.send('in',{x:+x.toFixed(2),y:+y.toFixed(2),f:!!(input.fire||k.KeyJ),a:input.aim?{x:Math.round(input.aim.x),y:Math.round(input.aim.y)}:null});
}
function partyBegin(p){party=p;inParty=true;mode='knockout';start();}
function leaveParty(){const r=party&&party.room;party=null;inParty=false;if(r){try{r.leave();}catch(e){}}}
function partyEnded(){
  if(!party)return;
  party=null;
  if(scene&&!ended){ended=true;paused=true;clearInput();scene.physics.pause();$('modal').hidden=false;$('result-icon').textContent='👋';$('result-title').textContent='Partner left';$('result-copy').textContent='The party has closed.';$('resume').textContent='Back to lobby →';}
}
function partyStart(room,data){
  if(!room.__brawl){
    room.__brawl=true;
    room.on('in',d=>{if(party&&party.isHost)party.remote={x:d.x||0,y:d.y||0,fire:!!d.f,aim:d.a};});
    room.on('sup',()=>{if(party&&party.isHost&&scene)scene.useSuper(scene.fighters[3]);});
    room.on('snap',d=>{if(party&&!party.isHost)party.snap=d;});
    room.on('hello',d=>{
      if(!room.isHost||room.__begun)return;room.__begun=true;
      const guest=R.get(d.c),pool=R.roster.filter(c=>c.id!==selected.id&&c.id!==guest.id);
      const bots=Phaser.Utils.Array.Shuffle(pool.slice()).slice(0,4);
      room.send('go',{h:selected.id,g:guest.id,b:bots.map(c=>c.id)});
      partyBegin({room:room,isHost:true,hostChar:selected,guestChar:guest,bots:bots});
    });
    room.on('go',d=>{
      if(room.isHost||room.__begun)return;room.__begun=true;
      partyBegin({room:room,isHost:false,hostChar:R.get(d.h),guestChar:selected,bots:d.b.map(R.get)});
    });
  }
  if(!room.isHost){
    room.send('hello',{c:selected.id});
    const t=setInterval(()=>{if(room.__begun){clearInterval(t);return;}room.send('hello',{c:selected.id});},700);
  }
}
$('partyBtn').onclick=()=>{
  if(!window.HubOnline){alert('Party play needs an internet connection.');return;}
  HubOnline.openLobby({game:'brawlkings',title:'Brawl Kings · Party',min:2,max:2,
    onStart:partyStart,onEnd:partyEnded,onClose:()=>{}});
};
function start(){if(game)game.destroy(true);clearInput();paused=false;ended=false;$('lobby').hidden=true;$('match').hidden=false;$('modal').hidden=true;$('pause').hidden=false;$('announcement').textContent='';$('fighter-name').textContent=selected.name;HubCore.markPlayed('brawlkings');const arena=$('arena');game=new Phaser.Game({type:Phaser.AUTO,parent:'arena',width:arena.clientWidth,height:arena.clientHeight,backgroundColor:palette.dark,physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:ArenaScene,audio:{noAudio:true},render:{antialias:true},banner:false});}
$('battle').onclick=start;
class ArenaScene extends Phaser.Scene{
constructor(){super('Arena');}
preload(){R.roster.forEach(c=>{if(c.photo)this.load.image('photo-'+c.id,c.photo);});}
create(){scene=this;this.elapsed=0;this.nextGem=1;this.countdown=[0,0];this.fighters=[];this.gems=[];this.effects=[];this.kills=0;this.shotsFired=0;this.damageDealt=0;this.worldW=1000;this.worldH=740;this.physics.world.setBounds(20,20,960,700);this.map=this.add.graphics();this.buildMap();this.walls=this.physics.add.staticGroup();this.wallRects.forEach(r=>{const z=this.add.zone(r.x+r.w/2,r.y+r.h/2,r.w,r.h);this.physics.add.existing(z,true);this.walls.add(z);});
const dot=this.make.graphics({x:0,y:0,add:false});dot.fillStyle(palette.white);dot.fillCircle(7,7,7);dot.generateTexture('bullet',14,14);dot.destroy();this.bullets=this.physics.add.group();this.physics.add.collider(this.bullets,this.walls,b=>b.destroy());this.physics.add.overlap(this.bullets,this.bullets,()=>{});
const bots=party?null:Phaser.Utils.Array.Shuffle(R.roster.filter(c=>c.id!==selected.id).slice()).slice(0,5);(party?partyRoster():[selected,...bots]).forEach((c,i)=>{const team=mode!=='showdown'?(i<3?0:1):i;const x=mode!=='showdown'?(team===0?170:830):500+Math.cos(i*Math.PI/3)*330,y=mode!=='showdown'?200+(i%3)*170:370+Math.sin(i*Math.PI/3)*255;this.spawnFighter(c,i,team,x,y);});this.player=this.fighters[party&&!party.isHost?3:0];this.physics.add.collider(this.fighters.map(f=>f.sprite),this.walls);this.fighters.forEach(f=>this.physics.add.overlap(f.sprite,this.bullets,(_,b)=>{if(b.active&&b.owner!==f&&b.owner.team!==f.team&&!f.dead){this.hurt(f,b.damage,b.owner);if(b.slow)f.slow=2.5;if(!b.pierce)b.destroy();}}));
this.ui=this.add.graphics().setDepth(80);this.input.on('pointerdown',p=>{input.fire=true;input.aim={x:p.worldX,y:p.worldY};});this.input.on('pointermove',p=>{if(p.isDown)input.aim={x:p.worldX,y:p.worldY};});this.input.on('pointerup',()=>{input.fire=false;input.aim=null;});this.scale.on('resize',()=>this.fit());this.fit();this.announce(mode==='gem'?'GEM RUSH':mode==='knockout'?'KNOCKOUT':'SHOWDOWN');if(party&&!party.isHost)this.physics.pause();}
fit(){const cam=this.cameras.main;cam.setZoom(Math.min(this.scale.width/1000,this.scale.height/740));cam.centerOn(500,370);}
buildMap(){const g=this.map;g.fillStyle(palette.grass);g.fillRoundedRect(10,10,980,720,24);for(let x=20;x<980;x+=50)for(let y=20;y<720;y+=50){g.fillStyle((x+y)%100?palette.grass:palette.grassAlt);g.fillRect(x,y,50,50);}g.lineStyle(4,palette.line);g.strokeRoundedRect(20,20,960,700,20);
this.wallRects=[{x:280,y:130,w:130,h:44},{x:590,y:130,w:130,h:44},{x:280,y:566,w:130,h:44},{x:590,y:566,w:130,h:44},{x:330,y:290,w:44,h:130},{x:626,y:320,w:44,h:130},{x:80,y:330,w:85,h:44},{x:835,y:365,w:85,h:44}];this.wallRects.forEach(r=>{g.fillStyle(palette.dark,.24);g.fillRoundedRect(r.x+5,r.y+8,r.w,r.h,4);g.fillStyle(palette.wall);g.fillRoundedRect(r.x,r.y,r.w,r.h,4);g.fillStyle(palette.wallTop);g.fillRect(r.x+3,r.y+3,r.w-6,9);g.lineStyle(2,palette.wall);for(let x=r.x+22;x<r.x+r.w;x+=26)g.lineBetween(x,r.y,x,r.y+r.h);});
[[210,240],[720,470],[420,610],[470,90]].forEach(([x,y])=>{for(let i=0;i<5;i++){g.fillStyle(palette.bush);g.fillCircle(x+i*17,y,16);g.fillStyle(palette.grass);g.fillCircle(x+i*17-3,y-5,10);}});[[60,65],[845,620]].forEach(([x,y])=>{g.fillStyle(palette.water);g.fillRoundedRect(x,y,95,55,15);g.lineStyle(3,palette.blue,.7);g.lineBetween(x+16,y+25,x+70,y+25);});g.fillStyle(palette.dark,.25);g.fillEllipse(500,375,125,100);g.fillStyle(palette.gem);g.fillTriangle(500,325,477,369,515,373);g.fillStyle(0x9971dd);g.fillTriangle(500,325,525,364,515,373);g.fillStyle(palette.white,.6);g.fillTriangle(500,325,494,355,477,369);
}
spawnFighter(c,id,team,x,y){const key='fighter-'+c.id;if(!this.textures.exists(key)){const tex=this.textures.createCanvas(key,64,72),ctx=tex.context;ctx.fillStyle='#'+c.color.toString(16).padStart(6,'0');ctx.beginPath();ctx.roundRect(9,37,46,30,12);ctx.fill();ctx.strokeStyle='#172332';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#172332';ctx.fillRect(11,60,15,10);ctx.fillRect(38,60,15,10);ctx.save();ctx.beginPath();ctx.arc(32,24,23,0,Math.PI*2);ctx.clip();if(this.textures.exists('photo-'+c.id)){const img=this.textures.get('photo-'+c.id).getSourceImage();const sz=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-sz)/2,Math.max(0,(img.height-sz)*.12),sz,sz,9,1,46,46);}else{ctx.fillStyle='#ffe2b8';ctx.fillRect(9,1,46,46);ctx.fillStyle='#45342e';ctx.fillRect(9,1,46,12);ctx.fillStyle='#172332';ctx.fillRect(20,21,5,6);ctx.fillRect(39,21,5,6);ctx.fillRect(27,34,11,3);}ctx.restore();ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(32,24,23,0,Math.PI*2);ctx.stroke();tex.refresh();}
const sprite=this.physics.add.sprite(x,y,key).setDepth(20).setScale(.82);sprite.body.setCircle(23,9,21);sprite.setCollideWorldBounds(true);const f={id,c,team,sprite,hp:c.hp,ammo:3,lives:3,out:false,reload:0,fireCd:0,charge:0,dead:false,gems:0,slow:0,shield:0,respawn:0,spawnX:x,spawnY:y,lastHurt:-10,aiTimer:0,dir:0};f.label=this.add.text(x,y-39,(isMine(id)?'YOU · ':'')+c.name,{fontFamily:'Trebuchet MS',fontSize:'14px',fontStyle:'bold',color:team===0||id===0?'#d8f5ff':'#ffe1ea',stroke:'#172332',strokeThickness:3}).setOrigin(.5).setDepth(81);f.shadow=this.add.ellipse(x,y+22,46,18,0x000000,.28).setDepth(4);this.fighters.push(f);return f;}
nearest(f){return this.fighters.filter(t=>!t.dead&&t.team!==f.team).sort((a,b)=>Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,a.sprite.x,a.sprite.y)-Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,b.sprite.x,b.sprite.y))[0];}
shoot(f,angle,superShot=false){if(f.dead||paused||ended)return;if(!superShot&&(f.ammo<1||f.fireCd>0))return;const c=f.c;f.dir=angle;if(!superShot){f.ammo--;f.fireCd=c.reload/1000*.65;this.shotsFired+=f.id===0?1:0;if(f.id===0)sound(280);}for(let i=0;i<(superShot?1:c.shots);i++){const a=angle+(i-(c.shots-1)/2)*(superShot?0:c.spread),b=this.bullets.create(f.sprite.x+Math.cos(a)*30,f.sprite.y+Math.sin(a)*30,'bullet');b.setTint(c.color).setDepth(30);b.owner=f;b.damage=superShot?c.damage*2.6:c.damage;b.life=(superShot?800:c.range)/620;b.slow=c.id==='george';b.pierce=superShot;b.setVelocity(Math.cos(a)*620,Math.sin(a)*620);b.body.setCircle(7);}}
hurt(f,damage,owner){if(f.dead)return;if(f.shield>0)damage*=.25;f.hp=Math.max(0,f.hp-damage);f.lastHurt=this.elapsed;f.sprite.setTint(palette.white);this.effects.push({type:'flash',f,life:.08});if(owner){owner.charge=R.charge(owner.charge,damage);if(owner.id===0)this.damageDealt+=damage;}if(f.hp<=0){f.dead=true;f.sprite.body.stop();f.sprite.disableBody(true,true);f.label.setVisible(false);for(let i=0;i<f.gems;i++)this.dropGem(f.sprite.x+Phaser.Math.Between(-28,28),f.sprite.y+Phaser.Math.Between(-28,28));f.gems=0;f.shadow?.setVisible(false);if(mode==='gem')f.respawn=4;else if(mode==='knockout'){f.lives--;if(f.lives>0)f.respawn=4;else f.out=true;}else if(f.id===0){this.finish(false);return;}if(owner?.id===0)this.kills++;}}
dropGem(x=500,y=370){const gem=this.add.star(x,y,4,6,12,palette.gem).setDepth(10);this.gems.push(gem);}
area(f,r,damage,status){this.fighters.forEach(t=>{if(t.team!==f.team&&!t.dead&&Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,t.sprite.x,t.sprite.y)<r){this.hurt(t,damage,f);if(status)t.slow=3;}});}
ring(x,y,r,color){const circle=this.add.circle(x,y,r,color,.2).setStrokeStyle(4,color).setDepth(12);this.effects.push({type:'ring',obj:circle,life:.45});}
useSuper(f){if(party&&!party.isHost){if(f===this.player)party.room.send('sup',{});return;}if(!f||f.dead||f.charge<100||paused||ended)return;f.charge=0;const t=this.nearest(f),a=t?Phaser.Math.Angle.Between(f.sprite.x,f.sprite.y,t.sprite.x,t.sprite.y):f.dir,p=f.c.power,x=f.sprite.x,y=f.sprite.y;this.ring(x,y,90,f.c.color);if(f.id===0){sound(750);this.announce(f.c.super);}
if(p==='shield')f.shield=5;
else if(p==='heal'){this.fighters.filter(t=>t.team===f.team&&!t.dead).forEach(t=>{t.hp=Math.min(t.c.hp,t.hp+2800);this.ring(t.sprite.x,t.sprite.y,65,palette.grass);});}
else if(p==='turret'){const obj=this.add.rectangle(x,y,30,35,f.c.color).setStrokeStyle(3,palette.white).setDepth(15);this.effects.push({type:'turret',obj,owner:f,life:9,cd:0});}
else if(p==='poison'){const obj=this.add.circle(t?.sprite.x||x,t?.sprite.y||y,120,f.c.color,.32).setDepth(11);this.effects.push({type:'poison',obj,owner:f,life:5});}
else if(p==='dash'||p==='kick'){const oldX=x,oldY=y;for(let d=20;d<240;d+=20){const nx=oldX+Math.cos(a)*d,ny=oldY+Math.sin(a)*d;if(nx<40||nx>960||ny<40||ny>700||this.wallRects.some(r=>nx>r.x-25&&nx<r.x+r.w+25&&ny>r.y-25&&ny<r.y+r.h+25))break;f.sprite.setPosition(nx,ny);this.area(f,85,p==='kick'?400:220);}if(p==='dash')f.shield=1.5;}
else if(p==='snipe')this.shoot(f,a,true);
else if(p==='rockets'){for(let i=-2;i<=2;i++)this.shoot(f,a+i*.16,true);}
else if(p==='burst'||p==='nova'){for(let i=0;i<12;i++)this.shoot(f,i*Math.PI/6,true);}
else if(p==='bomb'){const obj=this.add.circle(t?.sprite.x||x,t?.sprite.y||y,130,f.c.color,.3).setStrokeStyle(4,f.c.color);this.effects.push({type:'bomb',obj,owner:f,life:.8});}
else if(p==='quake'){this.ring(x,y,260,f.c.color);this.fighters.forEach(t=>{if(t.team!==f.team&&!t.dead&&Phaser.Math.Distance.Between(x,y,t.sprite.x,t.sprite.y)<260){this.hurt(t,1900,f);t.slow=3;}});}else{const radius=p==='freeze'?240:p==='hammer'?180:220;this.ring(x,y,radius,f.c.color);this.area(f,radius,p==='freeze'?1000:p==='hammer'?3200:2600,p==='freeze');}}
announce(text){$('announcement').textContent=text;this.announceUntil=this.elapsed+2;}
finish(win,draw=false){if(ended)return;ended=true;paused=true;clearInput();this.physics.pause();add('brawlKingsPlays',1);if(win)add('brawlKingsWins',1);const xp=(win?160:60)+this.kills*20;add('brawlKingsXP',xp);$('modal').hidden=false;$('result-icon').textContent=win?'🏆':draw?'⚔':'♛';$('result-title').textContent=win?'VICTORY!':draw?'DRAW':'Good battle';$('result-copy').textContent=selected.name+' · '+this.kills+' eliminations · +'+xp+' XP';$('resume').textContent=inParty?'Back to lobby →':'Battle again →';}
update(_,delta){if(paused||ended)return;const dt=Math.min(delta/1000,.05);this.elapsed+=dt;const timeLimit=mode==='showdown'?100:150;const remote=!!party&&!party.isHost;if(remote){if(party.snap){applySnap(this,party.snap);party.snap=null;}sendInput(dt);}else if(party){party.snapT=(party.snapT||0)+dt;if(party.snapT>=.1){party.snapT=0;party.room.send('snap',buildSnap(this));}}if(this.elapsed>this.announceUntil)$('announcement').textContent='';
this.fighters.forEach(f=>{if(remote){f.label.setPosition(f.sprite.x,f.sprite.y-41);f.shadow?.setPosition(f.sprite.x,f.sprite.y+22);return;}if(f.dead){if(mode!=='showdown'&&!f.out){f.respawn-=dt;if(f.respawn<=0){f.dead=false;f.hp=f.c.hp;f.ammo=3;f.sprite.enableBody(true,f.spawnX,f.spawnY,true,true);f.label.setVisible(true);f.shadow?.setVisible(true);f.shield=1;}}return;}f.fireCd=Math.max(0,f.fireCd-dt);f.slow=Math.max(0,f.slow-dt);f.shield=Math.max(0,f.shield-dt);f.reload+=dt;if(f.reload>=f.c.reload/1000){f.ammo=Math.min(3,f.ammo+1);f.reload=0;}if(this.elapsed-f.lastHurt>4)f.hp=Math.min(f.c.hp,f.hp+dt*500);
let vx=0,vy=0;const target=this.nearest(f);if(isMine(f.id)||(party&&party.isHost&&f.id===3)){const local=isMine(f.id),src=local?input:(party.remote||{x:0,y:0,fire:false,aim:null}),k=local?input.keys:{},fire=local?(input.fire||!!k.KeyJ):!!src.fire,aimPt=local?input.aim:src.aim;vx=src.x+(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);vy=src.y+(k.KeyS||k.ArrowDown?1:0)-(k.KeyW||k.ArrowUp?1:0);if(fire){const aim=aimPt||target?.sprite;if(aim)this.shoot(f,Phaser.Math.Angle.Between(f.sprite.x,f.sprite.y,aim.x,aim.y));}}
else{let goal=target?.sprite;const nearGem=this.gems.slice().sort((a,b)=>Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,a.x,a.y)-Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,b.x,b.y))[0];if(mode==='gem'&&nearGem)goal=nearGem;else if(mode==='gem'&&this.gems.length===0)goal={x:500+Math.cos(f.id)*75,y:370+Math.sin(f.id)*80};if(goal){const dist=Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,goal.x,goal.y),a=Phaser.Math.Angle.Between(f.sprite.x,f.sprite.y,goal.x,goal.y);if(dist>35){vx=Math.cos(a);vy=Math.sin(a);}if(target){const td=Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,target.sprite.x,target.sprite.y);if(td<f.c.range+30){this.shoot(f,Phaser.Math.Angle.Between(f.sprite.x,f.sprite.y,target.sprite.x,target.sprite.y)+Math.sin(this.elapsed*2+f.id)*.12);if(mode==='showdown'&&td<f.c.range*.65&&f.c.range>200){vx=-Math.cos(a);vy=-Math.sin(a);}}}if(f.sprite.body.blocked.left||f.sprite.body.blocked.right){vx=0;vy=goal.y>f.sprite.y?1:-1;if(Math.abs(goal.y-f.sprite.y)<50)vy=Math.sin(this.elapsed+f.id)>0?1:-1;}if(f.sprite.body.blocked.up||f.sprite.body.blocked.down){vy=0;vx=goal.x>f.sprite.x?1:-1;if(Math.abs(goal.x-f.sprite.x)<50)vx=Math.sin(this.elapsed+f.id)>0?1:-1;}}if(f.charge>=100)this.useSuper(f);}
const length=Math.hypot(vx,vy)||1;f.sprite.setVelocity(vx/Math.max(1,length)*f.c.speed*(f.slow>0?.5:1),vy/Math.max(1,length)*f.c.speed*(f.slow>0?.5:1));f.sprite.setDepth(20+f.sprite.y/1000);f.label.setPosition(f.sprite.x,f.sprite.y-41);f.shadow?.setPosition(f.sprite.x,f.sprite.y+22);if(f.shield>0)f.sprite.setAlpha(.65);else f.sprite.setAlpha(1);
if(mode==='showdown'&&this.elapsed>25){const margin=Math.min(280,(this.elapsed-25)*3.4);if(f.sprite.x<margin||f.sprite.x>1000-margin||f.sprite.y<margin*.7||f.sprite.y>740-margin*.7)this.hurt(f,dt*650,null);}
});
this.bullets.getChildren().forEach(b=>{b.life-=dt;if(b.life<=0||b.x<0||b.x>1000||b.y<0||b.y>740)b.destroy();});
for(let i=this.gems.length-1;i>=0;i--){const gem=this.gems[i],f=this.fighters.find(f=>!f.dead&&Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,gem.x,gem.y)<34);if(f){f.gems++;gem.destroy();this.gems.splice(i,1);if(f.id===0)sound(900);}}
if(mode==='gem'&&this.elapsed>=this.nextGem&&this.gems.length<20){this.nextGem=this.elapsed+2;this.dropGem(500+Phaser.Math.Between(-55,55),370+Phaser.Math.Between(-55,55));}
for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;if(e.type==='poison'){this.fighters.filter(f=>!f.dead&&f.team!==e.owner.team&&Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,e.obj.x,e.obj.y)<120).forEach(f=>this.hurt(f,dt*650,e.owner));}if(e.type==='turret'){e.cd-=dt;const t=this.nearest(e.owner);if(t&&e.cd<=0&&Phaser.Math.Distance.Between(e.obj.x,e.obj.y,t.sprite.x,t.sprite.y)<500){e.cd=.5;const b=this.bullets.create(e.obj.x,e.obj.y,'bullet');b.owner=e.owner;b.damage=450;b.life=.8;const a=Phaser.Math.Angle.Between(e.obj.x,e.obj.y,t.sprite.x,t.sprite.y);b.setVelocity(Math.cos(a)*600,Math.sin(a)*600);b.setTint(e.owner.c.color);}}if(e.life<=0){if(e.type==='flash'&&!e.f.dead)e.f.sprite.clearTint();if(e.type==='bomb'){this.ring(e.obj.x,e.obj.y,130,e.owner.c.color);this.fighters.filter(f=>!f.dead&&f.team!==e.owner.team&&Phaser.Math.Distance.Between(f.sprite.x,f.sprite.y,e.obj.x,e.obj.y)<130).forEach(f=>this.hurt(f,3600,e.owner));}e.obj?.destroy();this.effects.splice(i,1);}}
this.ui.clear();this.fighters.filter(f=>!f.dead).forEach(f=>{const x=f.sprite.x,y=f.sprite.y;this.ui.fillStyle(palette.dark);this.ui.fillRoundedRect(x-25,y-32,50,6,2);this.ui.fillStyle(f.team===this.player.team?palette.blue:palette.red);this.ui.fillRoundedRect(x-25,y-32,50*f.hp/f.c.hp,6,2);if(f.gems){this.ui.fillStyle(palette.gem);this.ui.fillCircle(x+27,y-15,8);}});if(mode==='showdown'&&this.elapsed>25){const m=Math.min(280,(this.elapsed-25)*3.4);this.ui.fillStyle(palette.red,.22);this.ui.fillRect(0,0,1000,m*.7);this.ui.fillRect(0,740-m*.7,1000,m*.7);this.ui.fillRect(0,m*.7,m,740-m*1.4);this.ui.fillRect(1000-m,m*.7,m,740-m*1.4);}
$('health').max=this.player.c.hp;$('health').value=this.player.hp;$('ammo').textContent='●'.repeat(this.player.ammo)+'○'.repeat(3-this.player.ammo);$('super').disabled=this.player.charge<100||this.player.dead;$('super').textContent=this.player.charge>=100?'ϟ':Math.floor(this.player.charge)+'%';$('super').title=this.player.c.super+' · Space';
if(mode==='gem'){const blue=R.teamGems(this.fighters,0),red=R.teamGems(this.fighters,1);$('blue-score').textContent='💎 '+blue;$('red-score').textContent=red+' 💎';for(let t=0;t<2;t++){const ours=t===0?blue:red,other=t===0?red:blue;this.countdown[t]=ours>=10&&ours>other?this.countdown[t]+dt:0;if(this.countdown[t]>=15){this.finish(t===0);return;}}const ct=this.countdown[0]||this.countdown[1];$('match-label').textContent=this.player.dead?'RESPAWN IN '+Math.ceil(this.player.respawn):ct?'HOLD · '+Math.ceil(15-ct)+'s':'GEM RUSH · '+Math.ceil(timeLimit-this.elapsed)+'s';if(this.elapsed>=timeLimit)this.finish(blue>red,blue===red);}
else if(mode==='knockout'){const bl=this.fighters.filter(f=>f.team===0&&!f.out),rd=this.fighters.filter(f=>f.team===1&&!f.out);const lb=bl.reduce((n,f)=>n+f.lives,0),lr=rd.reduce((n,f)=>n+f.lives,0);$('blue-score').textContent='❤ '+lb;$('red-score').textContent=lr+' ❤';$('match-label').textContent='KNOCKOUT · '+Math.ceil(timeLimit-this.elapsed)+'s';const mine=this.player.team===0,myA=mine?bl.length:rd.length,thA=mine?rd.length:bl.length,myL=mine?lb:lr,thL=mine?lr:lb;if(!myA||!thA)this.finish(myA>0);else if(this.elapsed>=timeLimit)this.finish(myL>thL,myL===thL);}else{const alive=this.fighters.filter(f=>!f.dead);$('blue-score').textContent='👑 '+alive.length+' alive';$('red-score').textContent=this.kills+' ⚔';$('match-label').textContent='SHOWDOWN · '+Math.ceil(timeLimit-this.elapsed)+'s';if(alive.length===1)this.finish(alive[0].id===0);else if(this.elapsed>=timeLimit)this.finish(false,true);}
}
}
})();
