(function(root){
  'use strict';
  var paths={Haider:'angryhaider/haider.png',Amaan:'amaan/amaan.jpg',Josh:'stackjosh/josh.png',Zainab:'angryhaider/zainab.png',Samuel:'connectsamuel/samuel.png',Austin:'kickaustin/austin.png',Charlie:'paccymatt/charlie.png'},images={};
  Object.keys(paths).forEach(function(name){var im=new Image();im.src='../'+paths[name];images[name]=im;});
  root.CrewGame={
    read:function(k){try{return localStorage.getItem(k)}catch(e){return null}},
    save:function(k,v){try{localStorage.setItem(k,String(v))}catch(e){}},
    face:function(ctx,name,x,y,r,fallback){
      var im=images[name];ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
      if(im&&im.complete&&im.naturalWidth){var size=Math.min(im.naturalWidth,im.naturalHeight),sx=(im.naturalWidth-size)/2,sy=(im.naturalHeight-size)*.16;ctx.drawImage(im,sx,sy,size,size,x-r,y-r,r*2,r*2);}
      else{ctx.font=r*1.4+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(fallback||name[0],x,y);}
      ctx.restore();
    }
  };
  var row=document.createElement('div');row.className='crew-roster';row.setAttribute('aria-label','The crew');
  var names=location.pathname.indexOf('amaantd')>=0?['Amaan','Haider','Samuel']:['Haider','Amaan','Zainab','Josh'];
  names.forEach(function(n){var item=document.createElement('span'),im=document.createElement('img');im.src=images[n].src;im.alt=n;item.append(im,document.createTextNode(n));row.append(item)});
  var intro=document.querySelector('#intro .panel');if(intro)intro.insertBefore(row,intro.querySelector('.btn'));
  var pause=document.createElement('button');pause.id='pause';pause.className='pause-button';pause.textContent='⏸';pause.title='Pause game';pause.setAttribute('aria-label','Pause game');document.body.append(pause);
  pause.onclick=function(){document.dispatchEvent(new CustomEvent('crewPause'))};
  document.addEventListener('visibilitychange',function(){if(document.hidden)document.dispatchEvent(new CustomEvent('crewPause',{detail:'auto'}))});
})(window);