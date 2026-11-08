(function(root){'use strict';
const roster=[
{id:'amaan',name:'Amaan',role:'Scattershot',icon:'⚡',color:0xffbc39,hp:5200,speed:205,damage:470,shots:3,spread:.22,range:340,reload:720,super:'Thunder burst',power:'burst',photo:'../amaan/amaan.jpg'},
{id:'haider',name:'Haider',role:'Rocket ace',icon:'🚀',color:0x43caff,hp:4600,speed:225,damage:1050,shots:1,spread:0,range:530,reload:900,super:'Rocket storm',power:'rockets',photo:'../angryhaider/haider.png'},
{id:'christian',name:'Christian',role:'Guardian',icon:'🛡',color:0x7fbbfa,hp:6900,speed:185,damage:850,shots:1,spread:0,range:360,reload:700,super:'Iron shield',power:'shield',photo:'../christian/head.png'},
{id:'ariyan',name:'Ariyan',role:'Venom scout',icon:'🐍',color:0x7ae56c,hp:4100,speed:245,damage:700,shots:1,spread:0,range:410,reload:550,super:'Venom field',power:'poison',photo:'../snariyan/ariyan.png'},
{id:'joe',name:'Joe',role:'Hammer king',icon:'🔨',color:0xff9cd2,hp:7200,speed:190,damage:1400,shots:1,spread:0,range:175,reload:650,super:'Hammer time',power:'hammer',photo:'../wackjoe/joe.jpeg'},
{id:'samuel',name:'Samuel',role:'Orb master',icon:'🔴',color:0xff677d,hp:5200,speed:205,damage:1000,shots:1,spread:0,range:430,reload:850,super:'Orb nova',power:'nova',photo:'../connectsamuel/samuel.png'},
{id:'josh',name:'Josh',role:'Engineer',icon:'📚',color:0xbe9dff,hp:5000,speed:195,damage:820,shots:1,spread:0,range:450,reload:650,super:'Stack turret',power:'turret',photo:'../stackjosh/josh.png'},
{id:'austin',name:'Austin',role:'Brawler',icon:'🦶',color:0xff9869,hp:6500,speed:230,damage:1300,shots:1,spread:0,range:185,reload:700,super:'Flying kick',power:'kick',photo:'../kickaustin/austin.png'},
{id:'zach',name:'Zach',role:'Demolition',icon:'💣',color:0xd3de75,hp:4800,speed:200,damage:1100,shots:1,spread:0,range:440,reload:1000,super:'Mega bomb',power:'bomb',photo:'../angryhaider/zach.png'},
{id:'zainab',name:'Zainab',role:'Star healer',icon:'✨',color:0xfab0ee,hp:4500,speed:220,damage:750,shots:1,spread:0,range:410,reload:600,super:'Healing constellation',power:'heal',photo:'../angryhaider/zainab.png'},
{id:'charlie',name:'Charlie',role:'Power chomper',icon:'🟡',color:0xffd257,hp:7400,speed:215,damage:1550,shots:1,spread:0,range:170,reload:750,super:'Power pellet quake',power:'quake',photo:'../paccymatt/charlie.png'}
];
function get(id){return roster.find(c=>c.id===id)||roster[0];}
function charge(current,damage){return Math.min(100,current+damage/55);}
function winner(mode,fighters){if(mode==='showdown'){const alive=fighters.filter(f=>!f.dead);return alive.length===1?alive[0].id:null;}return null;}
function teamGems(fighters,team){return fighters.filter(f=>f.team===team&&!f.dead).reduce((n,f)=>n+f.gems,0);}
root.BrawlKingsRules={roster,get,charge,winner,teamGems};
})(typeof window==='undefined'?globalThis:window);
