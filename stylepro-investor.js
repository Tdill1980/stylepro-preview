/* Dedicated stylist screens: import, this-or-that, occasion slots, week chat, prototype community. */
(()=>{ 'use strict';
const Persona=()=>window.StyleProPersona;
const KEY=Persona().storageKey(location.search);
const MAIN='stylepro-style-dna-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const O=()=>window.StyleProOnboarding, F=()=>window.StyleProFormula, V=()=>window.StyleProVoiceWeek, S=()=>window.StyleProSwap, T=()=>window.StyleProTaste, I=()=>window.StyleProImport, B=()=>window.StyleProBackground, P=()=>window.StyleProVoiceTier;
let state={version:1,step:'baseline',onboarded:false,name:'',goals:[],links:[],archetype:'founder',pair:0,profile:null,locked:{},optional:{},events:[],chat:[],swaps:[],shownPrompts:[],persona:null,baseline:null};
let hadSave=false;
const ONBOARD=/(?:^|[?&])onboard=1(?:&|$)/.test(location.search);
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved&&saved.version===1){hadSave=true; state={...state,...saved,profile:saved.profile||null,locked:saved.locked||{},links:saved.links||[],events:saved.events||[],chat:saved.chat||[],persona:saved.persona||null,baseline:saved.baseline||null};}}catch{}
if(!state.profile) state.profile=T().blank();
function blankBaseline(){return {stores:[],custom:'',vibes:[],fits:[],avoids:['khaki'],occasions:[]};}
if(!state.baseline) state.baseline=blankBaseline();
if(ONBOARD||(KEY===MAIN&&!hadSave)){
 state.step='baseline'; state.onboarded=false; state.pair=0; state.baseline=blankBaseline();
 if(!state.persona) state.persona=Persona().propose('founder');
 if(!ONBOARD&&!hadSave) state.name=state.name||'';
 save();
}else if(KEY===MAIN){
 if(state.onboarded==null) state.onboarded=true;
 if(!state.persona) state.persona=Persona().propose(state.archetype||'founder');
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function items(){return wardrobe?.items||[];}
function looks(){return wardrobe?.looks||[];}
function toastLearn(){state.notice='Learning from your rating'; save(); if(typeof toast==='function') toast('Learning from your rating');}
function visual(look){
 if(typeof lookVisual==='function' && look) {try{return lookVisual(look);}catch{}}
 return `<span class="sp-ph">${esc(look?.title||'Look')}</span>`;
}
function chips(list){return `<p class="sp-crumbs">${list.map(x=>`<span>${esc(x)}</span>`).join('<span aria-hidden="true">›</span>')}</p>`;}
function stars(target){
 const current=(state.profile.ratings||[]).filter(r=>r.id===target.id&&(!target.slot||r.slot===target.slot)).at(-1);
 const on=current?.stars||0;
 return `<div class="sp-rate" data-rate-type="${esc(target.type)}" data-rate-id="${esc(target.id)}" data-rate-slot="${esc(target.slot||'')}" data-rate-pieces="${esc((target.pieces||[]).join(','))}"><div role="group" aria-label="Rate ${esc(target.name)}">${[1,2,3,4,5].map(n=>`<button type="button" data-stars="${n}" aria-pressed="${on===n}" aria-label="${n} star${n>1?'s':''}">${n<=on?'★':'☆'}</button>`).join('')}</div><button type="button" class="sp-hate" data-hate>I hate it</button>${state.notice&&state.noticeFor===target.id?'<p class="sp-learn">Learning from your rating</p>':''}</div>`;
}
function liveCard(){
 const arch=O().ARCHETYPES.find(a=>a.id===state.archetype)||O().startingArchetype();
 const slots=O().SLOTS.map(s=>`${s.name}${state.locked[s.id]?' · locked':''}`).join(' · ');
 return `<aside class="sp-live-card"><p class="sp-kicker">Your dedicated AI stylist</p><h2>${esc(state.name||(state.onboarded?'Trish':'You'))}</h2><p>${esc(arch.name)} is the starting archetype. Swipes and ratings personalize color, silhouette, polish, and brand level.</p><p>${esc(slots)}</p><p class="sp-note">Learns on this device from your closet, links, photos, and choices. A live model is not connected.</p></aside>`;
}
function nav(){if(!state.onboarded) return ''; return `<div class="sp-dna-nav"><button type="button" data-go="style-dna" aria-current="${location.hash==='#style-dna'?'page':'false'}">Style DNA</button><button type="button" data-go="agenda">Week</button><button type="button" data-go="community">Community</button><button type="button" data-go="today">Today</button></div>`;}
function applyLock(){document.body.classList.toggle('sp-onboarding', !state.onboarded);}
function choice(list,id,label,featured){const on=(state.baseline[list]||[]).includes(id);return `<button type="button" class="sp-choice${featured?' is-featured':''}" data-base="${list}" data-base-id="${esc(id)}" aria-pressed="${on}">${esc(label)}</button>`;}
function renderBaseline(){
 const stores=Persona().STORES;
 const fav=stores.filter(s=>s.featured), rest=stores.filter(s=>!s.featured);
 const group=(title,buttons)=>`<p class="sp-kicker">${title}</p><div class="sp-chip-grid">${buttons}</div>`;
 return `${nav()}<section class="sp-dna"><p class="sp-kicker">Style DNA · a few taps</p><h1 class="sp-baseline-q">Which stores do you love?</h1><p>Pick any that feel like you. This sets the stylist’s baseline before photos.</p>${group('Favorites',fav.map(s=>choice('stores',s.id,s.name,true)).join(''))}${group('More stores',rest.map(s=>choice('stores',s.id,s.name,false)).join(''))}<label class="sp-field">Type your own<input id="sp-store-custom" maxlength="80" value="${esc(state.baseline.custom||'')}" placeholder="A shop that isn’t listed"></label><h2 class="sp-baseline-q">What feels like you?</h2>${group('Vibe',['polished','playful','romantic','minimal','bold','easy'].map(id=>choice('vibes',id,id[0].toUpperCase()+id.slice(1))).join(''))}${group('Fit',['tailored','relaxed','fitted','flowy'].map(id=>choice('fits',id,id[0].toUpperCase()+id.slice(1))).join(''))}${group('Hard no’s',[['khaki','No khaki'],['neon','No neon'],['logos','No logos'],['heels','No heels'],['mini','No mini'],['animal-print','No animal print']].map(([id,label])=>choice('avoids',id,label)).join(''))}${group('Occasions in your life',['work','filming','dinner','family','travel','everyday'].map(id=>choice('occasions',id,id[0].toUpperCase()+id.slice(1))).join(''))}<button type="button" class="sp-btn primary" data-step="import">Save and add closet photos</button></section>`;
}
function applyBaseline(){
 const taste=Persona().fromBaseline(state.baseline);
 if(!state.persona) state.persona=Persona().propose(state.archetype||'founder');
 state.persona.tone=taste.tone;
 state.persona.rules={...(state.persona.rules||{}),neverKhaki:taste.neverKhaki,noHeelsWeekdays:!!(taste.avoidHeels||state.persona.rules?.noHeelsWeekdays)};
}
function restartOnboarding(){state.step='baseline'; state.onboarded=false; state.pair=0; state.baseline=blankBaseline(); applyBaseline(); save(); applyLock(); open('style-dna');}
function renderImport(){
 return `${nav()}${liveCard()}<section class="sp-dna"><p class="sp-kicker">1 · What you already picked</p><h1>Your dedicated AI stylist</h1><p>Taste comes from the closet, the photos, and the links you already chose. Not from a quiz.</p><form id="sp-import"><label class="sp-field">Closet photos<input name="photos" type="file" accept="image/*" multiple></label><label class="sp-field">Instagram<input name="instagram" type="url" inputmode="url" placeholder="https://instagram.com/…" value="${esc(state.links.find(l=>l.network==='instagram')?.url||'')}"></label><label class="sp-field">Pinterest<input name="pinterest" type="url" inputmode="url" placeholder="https://pinterest.com/…" value="${esc(state.links.find(l=>l.network==='pinterest')?.url||'')}"></label><p class="sp-proto">${esc(I().LABEL)} Past uploads already in this closet stay as they are. Nothing is scraped.</p><div id="sp-import-preview"></div><div class="sp-slot-actions"><button class="sp-btn primary" type="submit">Save links</button><button type="button" class="sp-btn" data-scan-open>Scan closet photos</button><button type="button" class="sp-skip" data-step="swipe">Skip</button></div></form></section>`;
}
function renderSwipe(){
 const list=O().deck(looks(),20), rows=O().pairs(list), pair=rows[state.pair]||null;
 const arch=O().ARCHETYPES.find(a=>a.id===state.archetype)||O().startingArchetype();
 if(!pair) return `${nav()}${liveCard()}<section class="sp-dna"><p class="sp-kicker">2 · This or that</p><h1>That’s enough to personalize ${esc(arch.name)}.</h1><p>${rows.length} pairs from your look library. Optional details are next, or go straight to occasion slots.</p><button type="button" class="sp-btn primary" data-step="optional">A few optional questions</button><button type="button" class="sp-skip" data-step="slots">Skip to occasion slots</button></section>`;
 return `${nav()}${liveCard()}<section class="sp-dna"><p class="sp-kicker">2 · This or that · ${state.pair+1} of ${rows.length}</p><h1>Which would you wear?</h1><p>Starting from ${esc(arch.name)}. ${esc(arch.note)}</p><div class="sp-arch">${O().ARCHETYPES.map(a=>`<button type="button" class="sp-choice" data-arch="${a.id}" aria-pressed="${state.archetype===a.id}">${esc(a.name)}</button>`).join('')}</div><div class="sp-pair">${pair.map(l=>`<button type="button" class="sp-choice" data-wear="${esc(l.id)}"><span>${visual(l)}</span><strong>${esc(l.title)}</strong></button>`).join('')}</div><button type="button" class="sp-skip" data-step="slots">Skip the rest</button></section>`;
}
function renderOptional(){
 return `${nav()}${liveCard()}<section class="sp-dna"><p class="sp-kicker">Optional</p><h1>Only if you want to.</h1><form id="sp-optional"><label class="sp-field">Climate<input name="climate" value="${esc(state.optional.climate||'')}" placeholder="Desert heat, travel, four seasons…"></label><label class="sp-field">Size range<input name="size" value="${esc(state.optional.size||'')}" placeholder="Only used to filter prototype swaps"></label><label class="sp-field"><span>Prototype swaps</span><select name="swap"><option value="">Not now</option><option ${state.optional.swap==='yes'?'selected':''} value="yes">Opt in on this device</option></select></label><div class="sp-slot-actions"><button class="sp-btn primary" type="submit">Continue</button><button type="button" class="sp-skip" data-step="slots">Skip</button></div></form></section>`;
}
function renderSlots(){
 const cards=O().SLOTS.map(slot=>{
  const rec=O().recommend(slot,items(),state.profile,state.locked[slot.id]);
  const outfit=rec.outfit||{pieces:[],title:'Closet gap',description:''};
  const names=outfit.pieces.map(id=>items().find(i=>i.id===id)?.name||id).join(' · ');
  return `<article class="sp-day-card" style="--energy:${F().energyById(slot.energyId)?.color||'#956b80'}"><p class="sp-kicker">${esc(slot.name)}</p><h2>${esc(outfit.title||slot.name)}</h2><p>${esc(names||outfit.description||'No complete look yet.')}</p><p class="sp-note">${state.locked[slot.id]?'Locked as a formula for this slot.':'Approve to lock this as the formula, or reject it.'}</p>${stars({type:'look',id:outfit.id||slot.id,name:slot.name,slot:slot.id,pieces:outfit.pieces})}<div class="sp-slot-actions"><button type="button" data-approve="${slot.id}">Approve</button><button type="button" data-edit="${slot.id}">Edit</button><button type="button" data-hate data-rate-type="look" data-rate-id="${esc(outfit.id||slot.id)}" data-rate-slot="${slot.id}" data-rate-pieces="${esc(outfit.pieces.join(','))}">I hate it</button><button type="button" data-lock="${slot.id}" ${outfit.pieces.length?'':'disabled'}>Lock formula</button></div></article>`;
 }).join('');
 return `${nav()}${liveCard()}<section class="sp-dna"><p class="sp-kicker">3 · Occasion slots</p><h1>One identity. A look for each context.</h1><p>Founder demo, Source podcast, and WrapTV filming each keep their own taste. Stars and “I hate it” update that slot before the next pick.</p>${cards}<button type="button" class="sp-btn primary" data-step="reveal">See the profile</button></section>`;
}
function renderReveal(){
 const bits=O().SLOTS.map(s=>s.name+(state.locked[s.id]?' locked':' ready'));
 return `${nav()}<section class="sp-reveal"><p class="sp-kicker">Your dedicated AI stylist</p><h1>${esc(state.name||'You')}, this is the edit.</h1><p>${esc(bits.join(' · '))}</p><p>Occasion-slot looks can be locked as formulas. A locked slot is what the stylist dresses first for that context.</p><div class="sp-slot-actions"><button type="button" class="sp-btn primary" data-step="plans">Talk to your stylist</button><button type="button" class="sp-skip" data-step="persona">Meet your stylist</button></div></section>`;
}
function planStatus(){
 const pick=state.voiceTier;
 if(!pick) return '';
 const trial=pick.mode==='trial'?` 7-day preview, ${pick.trialMinutes} live minutes. Unused minutes stay here.`:'';
 return `<p class="sp-proto">${esc(pick.name)} is saved on this device.${esc(trial)} Billing is not connected.</p>`;
}
function renderPlans(){
 const plans=P();
 const demo=plans.demo();
 const selected=state.voiceTier?.id||'';
 const cards=plans.TIERS.map(tier=>`<article class="sp-day-card"><p class="sp-kicker">${esc(tier.name)}${tier.recommended?' · Recommended':''}</p><h2>${esc(tier.priceLabel)}</h2><p>${esc(tier.line)}</p><p class="sp-note">${esc(tier.cap)}</p><button type="button" class="sp-choice" data-plan="${tier.id}" aria-pressed="${selected===tier.id}">${tier.id==='plus'?'Choose Plus':tier.id==='premium'?'Choose Premium':'Choose Free'}</button></article>`).join('');
 const preview=state.voiceDemo?`<div class="sp-bubble user"><p>${esc(demo.lines[0].text)}</p></div><div class="sp-bubble stylist"><p>${esc(demo.lines[1].text)}</p></div><p class="sp-note">${esc(demo.privacy)}</p>`:`<p class="sp-note">${esc(demo.privacy)}</p>`;
 return `${nav()}<section class="sp-dna"><p class="sp-kicker">Voice tier</p><h1>Talk to your stylist.</h1><article class="sp-day-card"><p class="sp-kicker">Show me</p><h2>Tuesday, in her own week</h2><p>Danze Jam, then filming, then Toastmasters. One tap plays a scripted outfit change. Voice is not connected.</p><button type="button" class="sp-btn primary" data-voice-demo>Play the Tuesday change</button>${preview}</article><div class="sp-plan-grid">${cards}</div><div class="sp-plan-actions"><button type="button" class="sp-btn primary" data-trial aria-pressed="${state.voiceTier?.mode==='trial'}">Start 7-day Premium trial</button><button type="button" class="sp-skip" data-plan="free">Continue on Free</button></div>${planStatus()}<button type="button" class="sp-btn primary" data-step="persona">Meet your stylist</button></section>`;
}
function renderPersona(){
 if(!state.persona) state.persona=Persona().propose(state.archetype||'founder');
 const p=state.persona;
 const tones=['polished','playful','direct'];
 return `${nav()}<section class="sp-dna"><p class="sp-kicker">Meet your stylist</p><h1>This is who dresses the week.</h1><article class="sp-day-card sp-persona-card"><p class="sp-persona-mark" aria-hidden="true">${esc(p.initial||'L')}</p><h2>${esc(p.name)}</h2><p>${esc(p.line)}</p><label class="sp-field">Name<input id="sp-persona-name" maxlength="40" value="${esc(p.name)}"></label><div class="sp-arch" role="group" aria-label="Tone">${tones.map(t=>`<button type="button" class="sp-choice" data-tone="${t}" aria-pressed="${p.tone===t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div><label class="sp-repeat-toggle"><input type="checkbox" data-rule="neverKhaki" ${p.rules?.neverKhaki?'checked':''}> Never khaki</label><label class="sp-repeat-toggle"><input type="checkbox" data-rule="noHeelsWeekdays" ${p.rules?.noHeelsWeekdays?'checked':''}> No heels on weekdays</label><button type="button" class="sp-btn primary" data-persona-done>Meet your stylist</button></article></section>`;
}
function renderDone(){
 const p=state.persona||Persona().propose(state.archetype||'founder');
 return `${nav()}<section class="sp-reveal"><p class="sp-kicker">Your stylist</p><h1>${esc(p.name)}</h1><p>${esc(p.line)}</p><p class="sp-note">${esc(p.tone)}. ${p.rules?.neverKhaki?'Never khaki. ':''}${p.rules?.noHeelsWeekdays?'No heels on weekdays.':''}</p><button type="button" class="sp-btn primary" data-open-calendar>Open the calendar</button></section>`;
}
function renderDna(){
 const root=document.getElementById('stylepro-dna'); if(!root) return;
 const body={baseline:renderBaseline,import:renderImport,swipe:renderSwipe,optional:renderOptional,slots:renderSlots,reveal:renderReveal,plans:renderPlans,persona:renderPersona,done:renderDone}[state.step]||renderBaseline;
 root.innerHTML=body();
 root.querySelector('#sp-import')?.addEventListener('submit',async ev=>{
  ev.preventDefault();
  const fd=new FormData(ev.target);
  const files=[...ev.target.elements.photos.files].slice(0,7);
  state.links=[];
  if(fd.get('instagram')) state.links.push({network:'instagram',url:String(fd.get('instagram'))});
  if(fd.get('pinterest')) state.links.push({network:'pinterest',url:String(fd.get('pinterest'))});
  const result=await I().importPicked({links:state.links,photos:files});
  state.links=result.links;
  let preview=`<p class="sp-proto">${esc(result.label)} ${result.links.length} link${result.links.length===1?'':'s'} stored. ${result.photos} photo${result.photos===1?'':'s'} kept on this device. Fetched posts: ${result.fetched}.</p>`;
  for(const file of files.slice(0,3)){
   const stripped=await B().stripBackground(file);
   const original=URL.createObjectURL(file);
   preview+=`<div class="sp-pair"><figure><figcaption>Before</figcaption><img alt="Original upload" src="${original}"></figure><figure><figcaption>After · ${esc(stripped.mode)}</figcaption><img alt="Background preview" src="${stripped.strippedUrl||original}"></figure></div><p class="sp-note">${esc(stripped.label)}</p>`;
  }
  root.querySelector('#sp-import-preview').innerHTML=preview;
  save();
 });
 root.querySelector('#sp-optional')?.addEventListener('submit',ev=>{ev.preventDefault(); const fd=new FormData(ev.target); state.optional={climate:String(fd.get('climate')||''),size:String(fd.get('size')||''),swap:String(fd.get('swap')||'')}; state.step='slots'; save(); renderDna();});
 root.querySelectorAll('[data-rule]').forEach(box=>box.addEventListener('change',()=>{if(!state.persona) return; state.persona.rules={...state.persona.rules,[box.dataset.rule]:box.checked}; save();}));
}
function applyRating(button, stars){
  const box=button.closest('[data-rate-id]')||button;
  const id=box.dataset.rateId||button.dataset.rateId;
  const slot=box.dataset.rateSlot||button.dataset.rateSlot||'';
  const type=box.dataset.rateType||button.dataset.rateType||'look';
  const pieceIds=(box.dataset.ratePieces||button.dataset.ratePieces||'').split(',').filter(Boolean);
  const pieceItems=pieceIds.map(pid=>items().find(i=>i.id===pid)).filter(Boolean);
  const hate=button.hasAttribute('data-hate')&&!button.dataset.stars;
  state.profile=T().rate(state.profile,{type,id,slot:slot||undefined,stars:hate?undefined:stars,hate,items:pieceItems,signature:pieceIds.slice().sort().join('|')});
  state.noticeFor=id; toastLearn();
  if(location.hash==='#agenda') renderAgenda(); else if(location.hash==='#community') renderCommunity(); else renderDna();
}
function ensureWeek(){
 if(state.weekSeeded||!window.StyleProWeek) return;
 const dressed=window.StyleProWeek.dress(items(),looks());
 state.week=dressed;
 state.chat=[{role:'user',text:window.StyleProWeek.SPOKEN},{role:'stylist',text:'I’m holding November 16 through 22. Filming stays Founder and on camera, the WrapTV session keeps that camera look and swaps the layer, Danze Jam is active, Toastmasters is polished speaking, and Pumpkins and Planks is family. Friday is a suggestion. Tentative plans are marked.'},{role:'crumbs',crumbs:dressed.filter(e=>e.title&&e.kind!=='reminder'&&e.kind!=='suggested').map(e=>({day:e.date.slice(5),event:e.title,time:window.StyleProWeek.clockLabel(e.start),energy:(F().energyById(e.energyId)||{}).name||''}))}];
 state.reflection='Your week. Monday numbers through Sunday’s stage. That’s a real week, and it looks like you.';
 state.weekSeeded=true; save();
}
function threadHTML(){return (state.chat||[]).map(m=>m.role==='crumbs'?`<div class="sp-bubble stylist">${m.crumbs.map(c=>chips([c.day,c.event,c.time,c.energy])).join('')}</div>`:`<div class="sp-bubble ${m.role==='user'?'user':'stylist'}"><p>${esc(m.text||'')}</p></div>`).join('');}
function weekHTML(){
 ensureWeek();
 const days=window.StyleProWeek.cards(state.week||[]);
 return `<section class="sp-this-week" aria-label="This week"><h2>This week</h2>${days.map(day=>{const energy=F().energyById(day.looks[0]?.energyId)||{};return `<article class="sp-day-card" style="--energy:${energy.color||'#956b80'}"><p class="sp-kicker">${esc(day.date)}</p><ul class="sp-event-lines">${day.events.length?day.events.map(e=>`<li class="${e.tentative?'is-tentative':''}${e.reminder?' is-reminder':''}"><small>${esc(e.time)}</small> <span>${esc(e.name)}</span>${e.venue?`<small class="sp-venue">${esc(e.venue)}</small>`:''}${e.tentative?'<em>Tentative</em>':''}</li>`).join(''):'<li><small>Open</small> <span>Nothing scheduled</span></li>'}</ul>${day.looks.map(l=>{const tone=F().energyById(l.energyId)||{};const names=(l.pieces||[]).map(id=>items().find(i=>i.id===id)?.name||id).join(' · ');return `<div class="sp-look-card" style="--energy:${tone.color||'#956b80'}"><p class="sp-kicker">${esc(tone.name||'Look')} · ${esc(l.mode)}</p><h3>${esc(l.title)}</h3><p>${esc(names)}</p>${l.tentative?'<p class="sp-tentative">Tentative</p>':''}${stars({type:'look',id:l.id,name:l.title,pieces:l.pieces})}</div>`;}).join('')}</article>`;}).join('')}</section>`;
}
function bindPlan(form){if(!form) return; form.onsubmit=ev=>{ev.preventDefault(); hear(new FormData(ev.target).get('words'));}; form.querySelector('[data-mic]')?.addEventListener('click',()=>listen(form.elements.words));}
function weekCount(){return (state.week||[]).filter(e=>e.title&&e.kind!=='reminder'&&e.kind!=='suggested').length;}
function nextReal(){return (state.week||[]).find(e=>e.date>=todayKey()&&e.title&&e.kind!=='reminder'&&e.kind!=='suggested')||null;}
function personaLine(kind,fact){return Persona().speak(state.persona,kind,fact);}
function renderAgenda(){
 const root=document.getElementById('stylepro-agenda'); if(!root) return;
 ensureWeek();
 const next=nextReal();
 const nudge=next?personaLine('nudge',{title:next.title,time:window.StyleProWeek?.clockLabel(next.start)||'',energy:(F().energyById(next.energyId)||{}).name||'Founder Energy'}):'';
 root.innerHTML=`${nav()}<section class="sp-agenda"><p class="sp-kicker">Your dedicated AI stylist</p><h1>This week</h1><p class="sp-note">${esc(personaLine('greet',{count:weekCount()}))}</p>${nudge?`<p class="sp-note">${esc(nudge)}</p>`:''}<div id="sp-thread">${threadHTML()}</div><p class="sp-voice-note">Talk, or type the day if the mic is off.</p><form class="sp-composer" id="sp-plan"><input name="words" aria-label="Talk or type the week" placeholder="Monday networking at 1, PTA board meeting at 5, drinks with hubby at 7" maxlength="2000"><button type="button" data-mic aria-label="Talk" aria-pressed="false">Mic</button><button type="submit" aria-label="Send">↑</button></form>${weekHTML()}${state.reflection?`<article class="sp-reveal"><p>${esc(state.reflection)}</p></article>`:''}</section>`;
 bindPlan(root.querySelector('#sp-plan'));
}
function renderSheet(){
 const sheet=document.getElementById('sp-stylist-sheet'); if(!sheet) return;
 ensureWeek();
 sheet.innerHTML=`<div class="sp-sheet-bar"><h2 id="sp-stylist-title">Your stylist</h2><button type="button" data-close-stylist aria-label="Close stylist">×</button></div><div class="sp-sheet-body"><p class="sp-kicker">Talk to your stylist · she keeps the agenda</p><div id="sp-thread">${threadHTML()}</div><div class="sp-pills sp-stylist-asks" aria-label="Ask your stylist"><button type="button" data-stylist-ask="Holiday fits">Holiday fits</button><button type="button" data-stylist-ask="Plan my week">Plan my week</button><button type="button" data-stylist-ask="Next event look">Next event look</button></div><p class="sp-voice-note">Talk, or type the day if the mic is off.</p><form class="sp-composer" id="sp-plan-sheet"><input name="words" aria-label="Talk to your stylist" placeholder="Tell me what changed" maxlength="2000"><button type="button" data-mic aria-label="Talk">Mic</button><button type="submit" aria-label="Send">↑</button></form>${weekHTML()}</div>`;
 bindPlan(sheet.querySelector('#sp-plan-sheet'));
}
function answerAsk(label){
 ensureWeek();
 const text=String(label||'');
 if(/plan my week/i.test(text)){openSheet(); return;}
 if(/next event/i.test(text)){
  const next=(state.week||[]).find(e=>e.date>=todayKey()&&e.outfit&&e.kind!=='reminder'&&e.kind!=='suggested');
  const names=(next?.outfit.pieces||[]).map(id=>items().find(i=>i.id===id)?.name||id).join(', ');
  state.chat.push({role:'user',text},{role:'stylist',text:next?`Next is ${next.title} on ${next.date}. ${next.outfit.title}: ${names}.`:'Nothing later is on this week.'});
  save(); openSheet(); return;
 }
 const look=F().composeOutfits(items(),{energyId:'gallery',taste:state.profile})[0];
 const names=(look?.pieces||[]).map(id=>items().find(i=>i.id===id)?.name||id).join(', ');
 state.chat.push({role:'user',text:text||'Holiday fits'},{role:'stylist',text:`Holiday fits from what you already own. ${look?.title||'A look'}: ${names}.`});
 save(); openSheet();
}
function openSheet(){ensureWeek(); renderSheet(); const sheet=document.getElementById('sp-stylist-sheet'); if(sheet&&!sheet.open) sheet.showModal();}
function hear(raw){
 if(!state.onboarded) return;
 const text=String(raw||'').trim(); if(!text) return;
 const parsed=V().parse(text,{baseDate:todayKey()});
 state.chat.push({role:'user',text});
 state.chat.push({role:'stylist',text:personaLine('style',{count:parsed.entries.length})});
 parsed.turns.filter(t=>t.role!=='user').forEach(t=>state.chat.push(t));
 if(!parsed.questions.length){
  const dressed=F().dressDay(parsed.entries,{items:items(),taste:rankingPrefs()});
  state.events=dressed.events;
  state.reflection=parsed.reflection;
  importPlans(dressed.events);
  const sheet=document.getElementById('sp-stylist-sheet');
  if(sheet?.open) sheet.close();
  document.querySelector('.app-tabs [data-view="calendar"]')?.click();
 }
 save();
 if(location.hash==='#agenda') renderAgenda();
 if(document.getElementById('sp-stylist-sheet')?.open) renderSheet();
 if(document.body.dataset.spView==='calendar') window.styleProFits?.paintCalendar();
}
function importPlans(events){
 if(!window.wardrobeStylist?.importEvents) return;
 const rows=events.filter(e=>e.date).map(e=>({date:e.date,endDate:e.date,title:e.title,startTime:e.startTime||'',allDay:!e.startTime,kind:e.energyId==='wraptvworld'?'camera':e.energyId==='gallery'?'dinner':e.energyId==='play-date'?'everyday':'work',energyId:e.energyId,itemIds:e.outfit?.pieces||[],status:'planned',timeZone:'America/Phoenix',source:'stylist-conversation'}));
 if(rows.length) window.wardrobeStylist.importEvents(rows);
}
function renderCommunity(){
 const root=document.getElementById('stylepro-community'); if(!root) return;
 const prompts=S().gentlePrompts(state.profile.ratings,items(),{shown:state.shownPrompts});
 const members=S().SAMPLE_MEMBERS.map(m=>({...m,blocked:(state.blocked||[]).includes(m.id)}));
 const found=S().matches({owner:state.profile,members,city:'Phoenix',size:state.optional.size||''});
 let shared=[]; try{shared=JSON.parse(localStorage.getItem('stylepro-community-drafts-v1')||'[]').filter(p=>p&&p.state==='shared-local');}catch{}
 const mine=shared.map(p=>`<article class="sp-match"><h2>${esc(p.title||'A look')}</h2><p>${esc(p.caption||'Shared from this device.')}</p><p class="sp-note">Saved on this device. Not sent to a live board.</p></article>`).join('');
 root.innerHTML=`${nav()}<section class="sp-community"><p class="sp-proto">Prototype · sample members stored on this device. Not a live community. Swaps are not for cash.</p><h1>Someone may be looking.</h1>${mine}${prompts.map(p=>`<button type="button" class="sp-choice" data-prompt="${esc(p.itemId)}">${esc(p.text)}</button>`).join('')}<div>${found.map(m=>`<article class="sp-match"><h2>${esc(m.memberName)} is looking for ${esc(m.want)}.</h2><p>She has ${esc(m.offer)}. Propose a swap?</p><p class="sp-note">Taste fit only. Meet in public. You can report or block.</p><div class="sp-slot-actions"><button type="button" data-propose="${esc(m.memberId)}">Propose a swap</button><button type="button" data-block="${esc(m.memberId)}">Block</button><button type="button" data-report="${esc(m.memberId)}">Report</button></div></article>`).join('')}</div><div id="sp-swap-result"></div></section>`;
}
function portraitOutfit(){const look=looks().find(l=>l.id==='117'); return look?{id:look.id,title:look.title,pieces:look.pieces,source:'portrait'}:null;}
function todayKey(){const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10);}
function weekDays(){const start=todayKey(); return Array.from({length:7},(_,n)=>{const d=new Date(start+'T12:00:00'); d.setDate(d.getDate()+n); const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,10);});}
let recognition=null;
function listen(input){
 const note=input?.closest('section,dialog,#sp-fit-list')?.querySelector('.sp-voice-note')||document.querySelector('.sp-voice-note');
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){if(note) note.textContent='Voice is not available in this browser. Type the day instead.'; input?.focus(); return;}
 if(recognition){recognition.abort(); recognition=null; if(note) note.textContent='Mic off. Type the day, or tap Mic again.'; return;}
 const r=new Speech(); recognition=r; r.lang='en-US';
 r.onresult=ev=>{const text=Array.from(ev.results).map(x=>x[0].transcript).join(' '); if(input) input.value=text; hear(text);};
 r.onerror=()=>{recognition=null; if(note) note.textContent='The mic did not catch that. Type the day instead.'; input?.focus();};
 r.onend=()=>{recognition=null;};
 try{r.start(); if(note) note.textContent='Listening…';}catch{recognition=null; if(note) note.textContent='Voice is not available in this browser. Type the day instead.'; input?.focus();}
}
function open(view){ if(!state.onboarded) view='style-dna'; if(view==='today'){ if(typeof switchView==='function') switchView('today'); history.replaceState(null,'',location.pathname+location.search); return;} history.replaceState(null,'','#'+view); if(typeof switchView==='function') switchView(view); paint(view); }
function paint(view){ if(view==='style-dna') renderDna(); if(view==='agenda') renderAgenda(); if(view==='community') renderCommunity(); }
let mounted=false;
function syncBadge(){
 const btn=document.getElementById('sp-stylist-launch'); if(!btn) return;
 const on=!!state.voiceTier&&state.voiceTier.id==='premium';
 btn.classList.toggle('is-premium',on);
 let badge=btn.querySelector('.sp-stylist-badge');
 if(!badge){badge=document.createElement('span'); badge.className='sp-stylist-badge'; badge.textContent='Premium'; btn.appendChild(badge);}
 btn.setAttribute('aria-label',on?'Talk to your stylist, Premium':'Talk to your stylist');
}
function mount(){
 if(mounted||document.getElementById('stylepro-dna')){mounted=true; return;}
 mounted=true;
 const main=document.getElementById('main'); if(!main) return;
 main.insertAdjacentHTML('beforeend','<section id="stylepro-dna" class="sp-page" hidden></section><section id="stylepro-agenda" class="sp-page" hidden></section><section id="stylepro-community" class="sp-page" hidden></section>');
 document.body.insertAdjacentHTML('beforeend','<button type="button" id="sp-stylist-launch" aria-label="Talk to your stylist" aria-haspopup="dialog" aria-controls="sp-stylist-sheet"><span class="sp-stylist-spark" aria-hidden="true">✨</span><span class="sp-stylist-label">Stylist</span></button><dialog id="sp-stylist-sheet" aria-labelledby="sp-stylist-title"></dialog>');
 document.getElementById('sp-stylist-launch').onclick=ev=>{ev.preventDefault(); if(!state.onboarded) return; openSheet();};
 if(!document.getElementById('sp-redo-dna')){const redo=document.createElement('button'); redo.id='sp-redo-dna'; redo.type='button'; redo.textContent='Style DNA'; redo.setAttribute('aria-label','Redo my Style DNA'); document.getElementById('share')?.before(redo); redo.onclick=ev=>{ev.preventDefault(); restartOnboarding();};}
 syncBadge();
 applyLock();
 const prior=window.switchView;
 window.switchView=function(v){ if(!state.onboarded) v='style-dna'; prior(v); const show={ 'style-dna':'stylepro-dna', agenda:'stylepro-agenda', community:'stylepro-community' }[v]||''; for(const id of ['stylepro-dna','stylepro-agenda','stylepro-community']){const el=document.getElementById(id); if(el) el.hidden=id!==show;} const label={ 'style-dna':'Style DNA', agenda:'This week', community:'Community' }[v]; if(label){const h=document.querySelector('.app-intro h1'); if(h) h.textContent=label; const cur=document.getElementById('sp-current-view'); if(cur) cur.textContent=label;} document.body.dataset.spView=v; applyLock(); if(v==='style-dna'||v==='agenda'||v==='community') paint(v); };
}
document.addEventListener('click',ev=>{
 const ask=ev.target.closest('[data-stylist-ask]');
 if(ask){ev.preventDefault(); answerAsk(ask.dataset.stylistAsk); return;}
 const t=ev.target.closest('button'); if(!t||!t.closest('#stylepro-dna,#stylepro-agenda,#stylepro-community,#sp-stylist-sheet')) return;
 if(t.hasAttribute('data-close-stylist')){document.getElementById('sp-stylist-sheet').close(); return;}
 if(t.hasAttribute('data-open-calendar')){document.querySelector('.app-tabs [data-view="calendar"]')?.click(); return;}
 if(t.dataset.go){open(t.dataset.go); return;}
 if(t.hasAttribute('data-voice-demo')){state.voiceDemo=true; save(); renderDna(); return;}
 if(t.hasAttribute('data-trial')){state.voiceTier=P().startTrial(new Date().toISOString()); save(); syncBadge(); renderDna(); return;}
 if(t.dataset.plan){state.voiceTier=P().choose(t.dataset.plan,new Date().toISOString()); save(); syncBadge(); renderDna(); return;}
 if(t.dataset.tone){const name=document.getElementById('sp-persona-name')?.value.trim(); if(!state.persona) state.persona=Persona().propose(state.archetype||'founder'); if(name){state.persona.name=name; state.persona.initial=name[0].toUpperCase();} state.persona.tone=t.dataset.tone; save(); renderDna(); return;}
 if(t.hasAttribute('data-persona-done')){const name=document.getElementById('sp-persona-name')?.value.trim(); if(!state.persona) state.persona=Persona().propose(state.archetype||'founder'); if(name){state.persona.name=name; state.persona.initial=name[0].toUpperCase();} state.step='done'; state.onboarded=true; save(); applyLock(); document.querySelector('.app-tabs [data-view="calendar"]')?.click(); return;}
 if(t.dataset.base){const key=t.dataset.base, id=t.dataset.baseId, cur=state.baseline[key]||[]; state.baseline[key]=cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]; applyBaseline(); save(); renderDna(); return;}
 if(t.hasAttribute('data-redo-dna')){restartOnboarding(); return;}
 if(t.dataset.step){if(t.dataset.step==='import'){const field=document.getElementById('sp-store-custom'); if(field) state.baseline.custom=field.value.trim();} if(t.dataset.step==='persona'&&!state.persona) state.persona=Persona().propose(state.archetype||'founder'); state.step=t.dataset.step; applyBaseline(); save(); renderDna(); return;}
 if(t.dataset.arch){state.archetype=t.dataset.arch; save(); renderDna(); return;}
 if(t.dataset.wear){
  const rows=O().pairs(O().deck(looks(),20)); const pair=rows[state.pair]||[];
  const chosen=pair.find(l=>l.id===t.dataset.wear), rejected=pair.find(l=>l!==chosen);
  if(chosen) state.profile=O().learnChoice(state.profile,chosen,rejected,items(),state.archetype);
  state.pair+=1; state.noticeFor=chosen?.id; toastLearn(); save(); renderDna(); return;
 }
 if(t.dataset.approve||t.dataset.lock){
  const id=t.dataset.approve||t.dataset.lock; const slot=O().SLOTS.find(s=>s.id===id);
  const rec=O().recommend(slot,items(),state.profile,state.locked[id]);
  if(t.dataset.approve) state.profile=T().rate(state.profile,{type:'look',id:rec.outfit.id,slot:id,stars:5,items:rec.outfit.pieces.map(pid=>items().find(i=>i.id===pid)).filter(Boolean),signature:rec.outfit.pieces.slice().sort().join('|')});
  if(rec.outfit.pieces.length) state.locked[id]=O().lockFormula(slot,rec.outfit);
  toastLearn(); save(); renderDna(); return;
 }
 if(t.dataset.edit){ state.profile=T().rate(state.profile,{type:'look',id:t.dataset.edit,slot:t.dataset.edit,stars:3,items:[]}); save(); renderDna(); return;}
 if(t.hasAttribute('data-hate')||t.dataset.stars){ applyRating(t, t.dataset.stars?Number(t.dataset.stars):1); return;}
 if(t.dataset.propose){
  const member=S().SAMPLE_MEMBERS.find(m=>m.id===t.dataset.propose);
  const item=items().find(i=>i.id==='171')||items().find(i=>S&&i);
  const done=S().completeSwap(item||{id:'171',name:'Beige mini skirt'},member,todayKey());
  state.swaps.push(done); save();
  document.getElementById('sp-swap-result').innerHTML=`<p class="sp-reveal">${esc(done.provenance)}. Prototype only · nothing was sent. Status: ${esc(done.status)}.</p>`;
  return;
 }
 if(t.dataset.block||t.dataset.report){ const id=t.dataset.block||t.dataset.report; state.blocked=[...(state.blocked||[]),id]; save(); document.getElementById('sp-swap-result').innerHTML=`<p class="sp-note">${t.dataset.block?'Blocked':'Reported'} on this device. No message was sent.</p>`; }
 if(t.dataset.prompt){ state.shownPrompts=[...state.shownPrompts,t.dataset.prompt]; save(); renderCommunity(); }
});
function isWeekday(){const n=new Date().getDay(); return n>=1&&n<=5;}
function rankingPrefs(){const base=T().rankingPrefs(state.profile); const extra=Persona().rulePrefs(state.persona,isWeekday()); const taste=Persona().fromBaseline(state.baseline); const excluded=new Set([...(base.excludedItemIds||[]),...(extra.excludedItemIds||[])]); if(taste.neverKhaki) excluded.add('171'); return {...base,excludedItemIds:[...excluded],avoidHeels:!!(extra.avoidHeels||taste.avoidHeels),preferredTags:taste.tags,preferredBrands:taste.brands,avoidTerms:taste.avoidTerms};}
function learn(input){state.profile=T().rate(state.profile,input); state.notice=state.profile.acknowledgment; save(); if(typeof toast==='function') toast(state.profile.acknowledgment); return state.profile;}
const api={open,getProfile:()=>state.profile,rankingPrefs,getState:()=>state,learn,onboarded:()=>!!state.onboarded,persona:()=>state.persona,hear,listen,restartOnboarding};
window.styleProInvestor=api; window.styleProTaste=api;
function catalogReady(){try{return typeof wardrobe!=='undefined'&&!!wardrobe;}catch{return false;}}
function boot(){ if(!catalogReady()) return; mount(); applyLock(); if(!state.onboarded){open('style-dna'); return;} const hash=location.hash.slice(1); if(['style-dna','agenda','community'].includes(hash)) open(hash); }
document.addEventListener('wardrobe-ready',boot); boot();
window.addEventListener('hashchange',()=>{ const hash=location.hash.slice(1); if(['style-dna','agenda','community'].includes(hash)) open(hash); });
})();
