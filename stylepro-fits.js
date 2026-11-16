/* Calendar event cards and curated fits. Local share only. */
(()=>{ 'use strict';
const KEY='stylepro-community-drafts-v1';
const LIBRARY='stylepro-my-wardrobe-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let openKey='', pop=null, pinned=false;
function lookOf(row){
 if(row.look) return row.look;
 if(row.lookId && typeof lookById==='function') return lookById(row.lookId);
 return null;
}
function thumb(look){return look&&typeof lookVisual==='function'?lookVisual(look):'<span class="sp-fit-empty" aria-hidden="true">✧</span>';}
function rowHTML(row){
 const look=lookOf(row);
 const time=row.time?esc(row.time):'';
 const open=openKey===row.key;
 return `<article class="sp-fit-row${open?' is-open':''}" data-fit-key="${esc(row.key)}"><button type="button" class="sp-fit-compact" data-fit-toggle="${esc(row.key)}" aria-expanded="${open}"><span class="sp-fit-thumb">${thumb(look)}</span><span><strong>${esc(row.title)}</strong>${time?`<small>${time}</small>`:''}</span></button><div class="sp-fit-expand">${look?`<div class="sp-fit-full">${thumb(look)}</div><p>${esc((look.pieces||[]).map(id=>itemById(id)?.name||id).join(' · '))}</p>`:'<p>No owned look is ready for this yet.</p>'}<div class="sp-rate" role="group" aria-label="Rate this look">${[1,2,3,4,5].map(n=>`<button type="button" data-fit-stars="${n}" data-fit-rate="${esc(row.key)}">${'★'}</button>`).join('')}<button type="button" class="sp-hate" data-fit-hate data-fit-rate="${esc(row.key)}">I hate it</button></div><button type="button" class="sp-btn" data-fit-share="${esc(row.key)}">Share to community</button><p class="sp-fit-note" data-fit-note="${esc(row.key)}"></p></div></article>`;
}
function energyName(id){return window.StyleProFormula?.energyById(id)?.name||'';}
function clock(t){if(!t) return ''; if(window.StyleProWeek&&/^\d{2}:\d{2}$/.test(t)) return window.StyleProWeek.clockLabel(t); return t;}
function events(){
 const rows=[];
 const stored=window.wardrobeStylist?.events||{};
 Object.entries(stored).forEach(([date,list])=>{(list||[]).forEach(ev=>{
  if(ev.kind==='reminder') return;
  const pieces=Array.isArray(ev.itemIds)?ev.itemIds:[];
  const catalog=ev.lookId&&typeof lookById==='function'?lookById(ev.lookId):null;
  const look=catalog||(pieces.length?{id:'plan:'+date+':'+ev.title,title:ev.title,pieces,type:'assembly'}:null);
  rows.push({key:'cal-'+date+'-'+(ev.id||ev.title), date, title:ev.title, time:clock(ev.startTime||''), sortTime:ev.startTime||'99:99', look, kind:ev.kind||'', energy:energyName(ev.energyId), source:'calendar'});
 });});
 if(window.StyleProWeek&&typeof wardrobe!=='undefined'&&wardrobe){
  window.StyleProWeek.dress(wardrobe.items, wardrobe.looks).forEach(ev=>{
   if(ev.kind==='reminder'||!ev.title||!ev.outfit) return;
   if(rows.some(r=>r.date===ev.date&&r.title===ev.title)) return;
   rows.push({key:ev.id, date:ev.date, title:ev.title, time:window.StyleProWeek.clockLabel(ev.start), sortTime:ev.start||'99:99', look:ev.outfit, kind:ev.kind||'', energy:energyName(ev.energyId), source:'calendar'});
  });
 }
 return rows.sort((a,b)=>a.date.localeCompare(b.date)||String(a.sortTime||'').localeCompare(String(b.sortTime||''))||a.title.localeCompare(b.title));
}
function readLibrary(){try{const rows=JSON.parse(localStorage.getItem(LIBRARY)||'[]'); return Array.isArray(rows)?rows:[];}catch{return [];}}
function remember(entry){
 if(!entry||!Array.isArray(entry.pieces)||!entry.pieces.length) return;
 const id=String(entry.id||entry.title||'look');
 const source=entry.source||'calendar';
 const rows=readLibrary().filter(r=>!(r.id===id&&r.source===source));
 rows.unshift({id,title:entry.title||'A look',pieces:entry.pieces.slice(),source,at:new Date().toISOString()});
 localStorage.setItem(LIBRARY, JSON.stringify(rows.slice(0,80)));
}
function harvestCalendar(){
 events().forEach(row=>{if(row.source==='calendar'&&row.kind!=='suggested'&&row.look?.pieces?.length) remember({id:row.date+':'+row.title, title:row.title, pieces:row.look.pieces, source:'calendar'});});
}
function todayISO(){const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10);}
function paintCalendar(){
 closePop();
 const grid=document.getElementById('calendar-grid'); if(!grid) return;
 let host=document.getElementById('sp-fit-list');
 if(!host){host=document.createElement('section'); host.id='sp-fit-list'; host.className='sp-fit-list'; host.setAttribute('aria-label','Events and outfits'); grid.insertAdjacentElement('afterend', host);}
 if(window.styleProInvestor?.onboarded&&!window.styleProInvestor.onboarded()){host.innerHTML='<p class="sp-note">Finish Style DNA before outfits are suggested.</p>'; return;}
 const rows=events();
 harvestCalendar();
 const persona=window.styleProInvestor?.persona?.()||window.StyleProPersona?.propose('founder');
 const count=rows.filter(r=>r.kind!=='suggested').length;
 const greet=window.StyleProPersona?.speak(persona,'greet',{count})||'';
 const hm=new Date();
 const nowKey=todayISO()+'T'+String(hm.getHours()).padStart(2,'0')+':'+String(hm.getMinutes()).padStart(2,'0');
 const next=rows.find(r=>r.kind!=='suggested'&&r.title&&(r.date+'T'+(r.sortTime||'99:99'))>=nowKey)||rows.find(r=>r.date>=todayISO()&&r.kind!=='suggested'&&r.title);
 const nudge=next&&window.StyleProPersona?window.StyleProPersona.speak(persona,'nudge',{title:next.title,time:next.time,energy:next.energy||'Founder Energy'}):'';
 host.innerHTML=`<p class="sp-voice-note">Talk, or type the day if the mic is off.</p><form class="sp-composer" id="sp-calendar-voice"><input name="words" aria-label="Talk or type the week" placeholder="Monday networking at 1, PTA board meeting at 5, drinks with hubby at 7" maxlength="2000"><button type="button" data-mic aria-label="Talk">Mic</button><button type="submit" aria-label="Send">↑</button></form>${greet?`<p class="sp-note">${esc(greet)}</p>`:''}${nudge?`<p class="sp-note">${esc(nudge)}</p>`:''}${rows.map(rowHTML).join('')||'<p class="sp-note">No occasions on this calendar yet.</p>'}`;
 const form=host.querySelector('#sp-calendar-voice');
 if(form) form.onsubmit=ev=>{ev.preventDefault(); window.styleProInvestor?.hear?.(new FormData(form).get('words'));};
 host.querySelector('[data-mic]')?.addEventListener('click',()=>window.styleProInvestor?.listen?.(form?.elements.words));
}
function myWardrobe(){
 if(window.styleProInvestor?.onboarded&&!window.styleProInvestor.onboarded()) return '';
 harvestCalendar();
 const rows=readLibrary().map(r=>({key:'lib-'+r.source+'-'+r.id, title:r.title, time:r.source==='style-this'?'Style this':r.source==='curated'?'Curated fit':'Calendar', look:{id:r.id,title:r.title,pieces:r.pieces,type:'assembly'}}));
 if(!rows.length) return '<section class="sp-curated-fits" aria-label="My Wardrobe"><p class="sp-kicker">My Wardrobe</p><h2>My Wardrobe</h2><p class="sp-note">Approved outfits from Style this, curated fits, and the calendar land here.</p></section>';
 return `<section class="sp-curated-fits" aria-label="My Wardrobe"><p class="sp-kicker">My Wardrobe</p><h2>My Wardrobe</h2><div class="sp-fit-list">${rows.map(rowHTML).join('')}</div></section>`;
}
function curated(){
 if(window.styleProInvestor?.onboarded&&!window.styleProInvestor.onboarded()) return '';
 if(typeof wardrobe==='undefined'||!wardrobe) return '';
 const looks=wardrobe.looks.filter(l=>l&&!l.neural&&l.type==='assembly'&&Array.isArray(l.pieces)&&l.pieces.every(id=>typeof itemById==='function'&&itemById(id)&&window.StyleProCore?.owned(itemById(id)))).slice(0,8);
 if(!looks.length) return '';
 const rows=looks.map(l=>({key:'fit-'+l.id, title:l.title, time:'', look:l}));
 return `<section class="sp-curated-fits" aria-label="Just want fits"><p class="sp-kicker">Just want fits</p><div class="sp-fit-list">${rows.map(rowHTML).join('')}</div></section>`;
}
function findRow(key){return events().find(r=>r.key===key)||null;}
function lookFromKey(key){
 const ev=findRow(key);
 if(ev) return lookOf(ev);
 if(key.startsWith('fit-')&&typeof lookById==='function') return lookById(key.slice(4));
 if(key.startsWith('lib-')){const row=readLibrary().find(r=>'lib-'+r.source+'-'+r.id===key); return row?{id:row.id,title:row.title,pieces:row.pieces}:null;}
 return null;
}
function rate(key, stars, hate){
 const look=lookFromKey(key); if(!look||!window.styleProInvestor?.learn) return;
 const items=(look.pieces||[]).map(id=>itemById(id)).filter(Boolean);
 if(!hate&&stars>=4) remember({id:look.id, title:look.title, pieces:look.pieces, source:key.startsWith('fit-')?'curated':'calendar'});
 const profile=window.styleProInvestor.learn({type:'look', id:look.id, signature:window.StyleProCore?.signature(look.pieces||[]), stars, hate, items});
 const note=document.querySelector(`[data-fit-note="${CSS.escape(key)}"]`);
 if(note) note.textContent=profile?.acknowledgment||'Learning from your rating';
}
function share(key){
 const look=lookFromKey(key); if(!look) return;
 const ev=findRow(key);
 const row={lookId:look.id, title:ev?.title||look.title, caption:(ev?ev.title+' · ':'')+(look.title||'A look')+' · shared from this device.', state:'shared-local', rating:null, at:new Date().toISOString()};
 let rows=[]; try{rows=JSON.parse(localStorage.getItem(KEY)||'[]');}catch{}
 rows=rows.filter(r=>!(r.lookId===row.lookId&&r.state==='shared-local'&&r.title===row.title));
 rows.push(row);
 localStorage.setItem(KEY, JSON.stringify(rows));
 const note=document.querySelector(`[data-fit-note="${CSS.escape(key)}"]`);
 if(note) note.textContent='Saved on the community board on this device.';
}
let popAnchor=null;
function closePop(){if(pop) pop.hidden=true; pinned=false; popAnchor=null;}
function valueLine(item){
 const label=window.styleProMVP?.valueLabel?.(item.id);
 return label&&label!=='Value hidden'?label:'Valuation pending';
}
function showPop(btn){
 if(!pop){pop=document.createElement('div'); pop.className='sp-icon-pop'; pop.setAttribute('role','dialog'); document.body.append(pop);}
 if(btn.hasAttribute('data-hero-outfit')){
  const bits=['080','156','075'].map(id=>typeof itemById==='function'?itemById(id):null).filter(Boolean);
  pop.innerHTML=`<p>Your outfit of the day</p><p>${esc(bits.map(i=>i.name).join(' · '))}</p><p class="sp-note">Burgundy vest, slim tan belt, and black jeans from your closet.</p>`;
 }else{
  const item=typeof itemById==='function'?itemById(btn.dataset.heroTip):null;
  if(!item) return;
  pop.innerHTML=`<p>${esc(item.name)}</p><p>${esc(item.brand||'Brand not recorded')}</p><p>${esc(valueLine(item))}</p><button type="button" class="sp-btn" data-style-this="${esc(item.id)}">Style this</button>`;
 }
 pop.hidden=false;
 const portrait=document.querySelector('.sp-studio-card .sp-carousel-portrait');
 const avoid=portrait?.getBoundingClientRect();
 const split=document.querySelector('.sp-ootd-split')?.getBoundingClientRect();
 const col=document.querySelector('.sp-hero-pieces')?.getBoundingClientRect();
 const outfit=btn.hasAttribute('data-hero-outfit');
 const width=Math.min(220, Math.max(140, (outfit?avoid?.width:col?.width)||180));
 let top=(split?split.bottom:btn.getBoundingClientRect().bottom)+8;
 let left=outfit?(avoid?avoid.left:8):(col?col.left:btn.getBoundingClientRect().left);
 if(avoid && !(left+width<=avoid.left || left>=avoid.right || top>=avoid.bottom)){
  top=avoid.bottom+8;
  left=Math.max(8, avoid.right-width);
 }
 if(left+width>innerWidth-8) left=Math.max(8, innerWidth-width-8);
 pop.style.width=width+'px';
 pop.style.left=left+'px';
 pop.style.top=Math.max(8, Math.min(top, innerHeight-160))+'px';
}
function toggleFit(key){
 const row=document.querySelector(`[data-fit-key="${CSS.escape(key)}"]`);
 if(!row) return;
 const on=!row.classList.contains('is-open');
 document.querySelectorAll('.sp-fit-row.is-open').forEach(other=>other.classList.remove('is-open'));
 row.classList.toggle('is-open', on);
 row.querySelector('[data-fit-toggle]')?.setAttribute('aria-expanded', String(on));
 if(on) row.scrollIntoView({block:'nearest'});
}
document.addEventListener('click',ev=>{
 const tip=ev.target.closest('[data-hero-tip],[data-hero-outfit]');
 if(tip){ev.preventDefault(); ev.stopPropagation(); if(pinned&&pop&&!pop.hidden&&popAnchor===tip){closePop(); return;} showPop(tip); pinned=true; popAnchor=tip; return;}
 if(ev.target.closest('.sp-icon-pop')) return;
 closePop();
 const toggle=ev.target.closest('[data-fit-toggle]');
 if(toggle){ev.preventDefault(); toggleFit(toggle.dataset.fitToggle); return;}
 const stars=ev.target.closest('[data-fit-stars]');
 if(stars){rate(stars.dataset.fitRate, Number(stars.dataset.fitStars), false); return;}
 const hate=ev.target.closest('[data-fit-hate]');
 if(hate){rate(hate.dataset.fitRate, 1, true); return;}
 const shareBtn=ev.target.closest('[data-fit-share]');
 if(shareBtn){share(shareBtn.dataset.fitShare);}
});
document.addEventListener('mouseover',ev=>{
 if(!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
 const tip=ev.target.closest('[data-hero-tip],[data-hero-outfit]');
 if(tip){pinned=false; showPop(tip);}
 const row=ev.target.closest('.sp-fit-row');
 if(row && !openKey) row.classList.add('is-open');
});
document.addEventListener('mouseout',ev=>{
 if(pinned) return;
 if(!ev.relatedTarget?.closest?.('.sp-icon-pop, [data-hero-tip], [data-hero-outfit]')) closePop();
 const row=ev.target.closest?.('.sp-fit-row');
 if(row && !openKey && !row.contains(ev.relatedTarget)) row.classList.remove('is-open');
});
window.addEventListener('wardrobe-plan-updated',()=>{if(document.body.dataset.spView==='calendar') paintCalendar();});
window.styleProFits={paintCalendar, curated, myWardrobe, remember};
})();
