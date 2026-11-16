/* Glass scan for new closet photos. Local only. Sound starts after a tap. */
(()=>{ 'use strict';
const KEY='stylepro-scan-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n%100?2:0}).format(n/100);
let prefs={muted:false};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved&&typeof saved.muted==='boolean') prefs=saved;}catch{}
let dbPromise, audio, queue=[], active=null, urls=new Map(), rollToken=0, batch=[];
function savePrefs(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}}
function database(){
 if(!dbPromise) dbPromise=new Promise((resolve,reject)=>{
  const r=indexedDB.open('stylepro-media-v1',1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('records')) r.result.createObjectStore('records',{keyPath:'id'});};
  r.onsuccess=()=>resolve(r.result);
  r.onerror=()=>reject(Error('Photo storage is unavailable in this browser.'));
 });
 return dbPromise;
}
function dbAll(){return database().then(db=>new Promise((resolve,reject)=>{const q=db.transaction('records').objectStore('records').getAll(); q.onsuccess=()=>resolve(q.result||[]); q.onerror=()=>reject(q.error);}));}
function dbPut(record){return database().then(db=>new Promise((resolve,reject)=>{const t=db.transaction('records','readwrite'); t.objectStore('records').put(record); t.oncomplete=()=>resolve(); t.onerror=()=>reject(Error('Could not save the photo.'));}));}
function unlock(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC) return null;
 if(!audio) audio=new AC();
 if(audio.state==='suspended') audio.resume();
 return audio;
}
function tone(kind){
 try{ toneNow(kind); }catch{}
}
function toneNow(kind){
 if(prefs.muted) return;
 const ctx=audio; if(!ctx) return;
 const now=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain();
 o.type='sine'; g.gain.setValueAtTime(0.0001,now);
 o.connect(g); g.connect(ctx.destination); o.start(now);
 if(kind==='ding'){
  o.frequency.setValueAtTime(784,now);
  o.frequency.setValueAtTime(1046,now+.12);
  g.gain.exponentialRampToValueAtTime(0.05,now+.02);
  g.gain.exponentialRampToValueAtTime(0.0001,now+.36);
  o.stop(now+.38);
 }else{
  o.frequency.setValueAtTime(392,now);
  o.frequency.exponentialRampToValueAtTime(698,now+.42);
  g.gain.exponentialRampToValueAtTime(0.045,now+.05);
  g.gain.exponentialRampToValueAtTime(0.0001,now+.48);
  o.stop(now+.5);
 }
}
function sheet(){
 let el=document.getElementById('sp-scan-sheet');
 if(el) return el;
 el=document.createElement('dialog');
 el.id='sp-scan-sheet';
 el.setAttribute('aria-labelledby','sp-scan-title');
 document.body.append(el);
 return el;
}
function worth(){return window.styleProMVP?.snapshot().worth||{totalCents:0,valued:0,unvalued:0,none:0};}
function paintCount(){
 const w=worth(), line=document.getElementById('sp-scan-count');
 if(!line) return;
 const none=w.none?` · ${w.none} assigned none`:'';
 line.textContent=`${w.valued} priced · ${w.unvalued} pending${none}. A blank price stays pending.`;
}
function paintTotal(cents){
 const el=document.getElementById('sp-scan-total'); if(!el) return;
 el.setAttribute('aria-label','Priced so far '+money(cents));
 if(window.styleProDigitalTicker) window.styleProDigitalTicker.paint(el,cents,cents);
 else el.textContent=money(cents);
}
function roll(from,to){
 const token=++rollToken;
 if(reduced()||from===to){paintTotal(to); return;}
 const start=performance.now();
 const step=now=>{
  if(token!==rollToken) return;
  const p=Math.min(1,(now-start)/900);
  paintTotal(p===1?to:Math.round(from+(to-from)*(1-Math.pow(1-p,3))));
  if(p<1) requestAnimationFrame(step);
 };
 requestAnimationFrame(step);
}
function brands(){return [...new Set((wardrobe?.items||[]).map(i=>i.brand).filter(Boolean))];}
function layout(body){
 rollToken++;
 const w=worth();
 sheet().innerHTML=`<div class="sp-scan-bar"><div><p class="sp-kicker">Add items</p><h2 id="sp-scan-title">Scan your closet.</h2></div><div class="sp-scan-bar-actions"><button type="button" id="sp-scan-mute" aria-pressed="${prefs.muted}">${prefs.muted?'Sound off':'Sound on'}</button><button type="button" data-scan-close aria-label="Close scan">×</button></div></div><div class="sp-scan-body"><section class="sp-scan-worth" aria-label="Priced so far"><span class="sp-worth-label">PRICED SO FAR</span><strong class="sp-worth-number" id="sp-scan-total"></strong><p id="sp-scan-count"></p></section><div class="sp-slot-actions"><button type="button" class="sp-btn primary" id="sp-scan-camera">Use camera</button><button type="button" class="sp-btn" id="sp-scan-library">Choose photos</button></div><input id="sp-scan-camera-input" type="file" accept="image/*" capture="environment" hidden><input id="sp-scan-library-input" type="file" accept="image/*" multiple hidden><div id="sp-scan-stage">${body||'<p class="sp-note">Choose a few photos. Each one gets a glass scan, then you confirm the tags. Photos stay on this device.</p>'}</div><p id="sp-scan-status" role="status"></p></div>`;
 paintTotal(w.totalCents); paintCount();
 document.getElementById('sp-scan-mute').onclick=()=>{prefs.muted=!prefs.muted; savePrefs(); unlock(); document.getElementById('sp-scan-mute').textContent=prefs.muted?'Sound off':'Sound on'; document.getElementById('sp-scan-mute').setAttribute('aria-pressed',String(prefs.muted));};
 document.getElementById('sp-scan-camera').onclick=()=>{unlock(); document.getElementById('sp-scan-camera-input').click();};
 document.getElementById('sp-scan-library').onclick=()=>{unlock(); document.getElementById('sp-scan-library-input').click();};
 document.getElementById('sp-scan-camera-input').onchange=ev=>take(ev.target.files,ev.target);
 document.getElementById('sp-scan-library-input').onchange=ev=>take(ev.target.files,ev.target);
}
function open(files){
 const el=sheet();
 if(!el.open){layout(); el.showModal();}
 if(files&&files.length) take(files);
}
async function hashOf(file){
 const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
 return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function take(fileList,input){
 unlock();
 const files=[...fileList].slice(0,12);
 if(input) input.value='';
 const known=new Set((await dbAll().catch(()=>[])).filter(r=>r.kind==='capture'&&r.hash).map(r=>r.hash));
 for(const file of files){
  if(!file.type.startsWith('image/')||file.size>20*1024*1024){status('Choose an image under 20 MB.'); continue;}
  const hash=await hashOf(file);
  if(known.has(hash)||queue.some(q=>q.hash===hash)||active?.hash===hash){status('That photo is already in this scan. It will not be added twice.'); continue;}
  known.add(hash);
  queue.push({id:crypto.randomUUID(),file,hash,url:URL.createObjectURL(file)});
 }
 if(!active) showNext();
}
function remember(id){if(id&&!batch.includes(id)) batch.push(id);}
function status(text){const el=document.getElementById('sp-scan-status'); if(el) el.textContent=text;}
function showNext(){
 active=queue.shift()||null;
 if(!sheet().open) return;
 if(!active){layout('<p class="sp-note">That set is in. Add more photos, or close this and find them in the closet.</p>'); if(batch.length&&!prefs.prompted){prefs.prompted=true; savePrefs(); const ids=batch.slice(); batch=[]; window.styleProStyleThis?.offerFirst(ids);} return;}
 const tags=window.StyleProScan.guess(active.file.name,'',brands());
 const wait=reduced()?0:1200;
 layout(stageHTML(active,tags,false));
 tone('scan');
 const glass=document.querySelector('.sp-scan-glass');
 if(glass) glass.classList.add('is-scanning');
 setTimeout(()=>{if(!active) return; const box=document.getElementById('sp-scan-stage'); if(!box) return; box.innerHTML=stageHTML(active,tags,true); bindForm();},wait);
}
function stageHTML(item,tags,ready){
 const cats=['Tops & vests','Bottoms','Dresses','Knitwear','Jackets & layers','Handbags','Shoes','Jewelry','Accessories'];
 const chips=[
  ['category',tags.category||'Category pending'],
  ['color',tags.color||'Color pending'],
  ['brand',tags.brand||'Brand pending']
 ];
 return `<article class="sp-scan-card"><div class="sp-scan-frame"><img src="${item.url}" alt="Photo being scanned"><div class="sp-scan-glass${ready?' is-done':' is-scanning'}" aria-hidden="true"><span class="sp-scan-line"></span></div></div>${ready?`<div class="sp-scan-chips" aria-label="Suggested tags">${chips.map(([key,label],n)=>`<button type="button" class="sp-choice sp-scan-chip" data-scan-chip="${key}" style="--delay:${n*80}ms" aria-pressed="${tags[key]?'true':'false'}">${esc(label)}</button>`).join('')}</div><form id="sp-scan-form"><label class="sp-field">Name<input name="name" required maxlength="100" value="${esc(tags.name)}" placeholder="Name this piece"></label><label class="sp-field">Category<select name="category" required><option value="">Choose a category</option>${cats.map(c=>`<option ${c===tags.category?'selected':''}>${c}</option>`).join('')}</select></label><label class="sp-field">Color<input name="color" maxlength="40" value="${esc(tags.color)}" placeholder="Only if you know it"></label><label class="sp-field">Brand<input name="brand" maxlength="80" value="${esc(tags.brand)}" placeholder="Only if you know it"></label><label class="sp-field">Another photo of a piece you already have?<select name="existing"><option value="">No, this is a new piece</option>${(wardrobe?.items||[]).filter(i=>window.StyleProCore?.owned(i)).map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('')}</select></label><label class="sp-field">Your estimate · optional USD<input name="estimate" inputmode="decimal" maxlength="10" placeholder="Leave blank to keep it pending"></label><p class="sp-note">Tags come from the file name and what you type. Nothing is priced until you enter a number.</p><p id="sp-scan-error" role="alert"></p><button class="sp-btn primary" type="submit">Add to closet</button></form>`:'<p class="sp-note">Scanning this photo…</p>'}</article>`;
}
function bindForm(){
 document.querySelectorAll('[data-scan-chip]').forEach(btn=>btn.onclick=()=>{
  const key=btn.dataset.scanChip, form=document.getElementById('sp-scan-form');
  const field=form?.elements[key]; if(field) field.focus();
 });
 const form=document.getElementById('sp-scan-form'); if(!form) return;
 form.elements.existing.onchange=()=>{form.elements.name.required=!form.elements.existing.value;};
 form.onsubmit=async ev=>{
  ev.preventDefault();
  const btn=form.querySelector('button[type=submit]'); btn.disabled=true;
  try{await commit(new FormData(form));}catch(err){document.getElementById('sp-scan-error').textContent=err.message; btn.disabled=false;}
 };
}
async function commit(fd){
 const linked=fd.get('existing')&&wardrobe.items.find(i=>i.id===fd.get('existing'));
 const name=String(fd.get('name')||'').trim();
 if(!linked&&!name) throw Error('Give this piece a name.');
 const plan=window.StyleProScan.interpret({name:active.file.name,note:name,brands:brands(),hash:active.hash,knownHashes:[],estimate:fd.get('estimate'),category:fd.get('category'),brand:String(fd.get('brand')||'').trim(),color:String(fd.get('color')||'').trim()});
 if(!plan.ok) throw Error(plan.error);
 const before=worth().totalCents;
 const record={id:active.id,blob:active.file,hash:active.hash,kind:'capture',confirmed:true,confirmedAt:new Date().toISOString(),itemId:linked?.id||'local-'+active.id,linked:!!linked,source:'scan',item:{name:linked?.name||name,brand:plan.tags.brand||'Brand not recorded',category:plan.tags.category||linked?.category||'',color:plan.tags.color||'',size:linked?.size||'Not recorded'}};
 if(!record.item.category) throw Error('Choose a category.');
 const known=(await dbAll()).some(r=>r.kind==='capture'&&r.hash===active.hash);
 if(known){status('This photo is already saved. It was not added again.'); active=null; showNext(); return;}
 await dbPut(record);
 if(!linked){
  wardrobe.items.push({id:record.itemId,name:record.item.name,brand:record.item.brand,category:record.item.category,size:record.item.size,status:'Personal wardrobe',photoStatus:'Owner scan · original image',description:'Added from a photo on this device. Tags were confirmed by you.',styling:'',styleTags:record.item.color,lookIds:[],image:active.url,latest:true});
 }else{
  linked.image=active.url;
  linked.photoStatus='Owner rescan · original image';
 }
 let priced=false;
 if(plan.priceCents){
  try{window.styleProMVP.setEstimate(record.itemId,(plan.priceCents/100).toFixed(2)); priced=true;}
  catch(err){status(err.message+' The photo is saved. The total did not change.');}
 }
 if(typeof renderCatalog==='function') renderCatalog();
 tone('ding');
 const after=worth().totalCents;
 roll(before,after);
 paintCount();
 remember(record.itemId);
 status(priced?`${record.item.name} is in. Priced so far moved by ${money(after-before)}.`:`${record.item.name} is in. No price yet, so the total stayed put.`);
 if(!(window.styleProInvestor?.onboarded&&!window.styleProInvestor.onboarded())) document.getElementById('sp-scan-status')?.insertAdjacentHTML('afterend',`<button type="button" class="sp-btn" data-style-this="${esc(record.itemId)}">Style this</button>`);
 active=null;
 setTimeout(showNext,reduced()?0:700);
}
function mount(){
 const actions=document.querySelector('#collection .sc-wardrobe-actions');
 if(actions&&!document.getElementById('sp-add-items')){
  const b=document.createElement('button');
  b.type='button'; b.id='sp-add-items'; b.className='sp-btn'; b.dataset.scanOpen=''; b.textContent='Add items';
  actions.append(b);
 }
}
document.addEventListener('click',ev=>{
 const close=ev.target.closest('[data-scan-close]');
 if(close){sheet().close(); return;}
 const openBtn=ev.target.closest('[data-scan-open]');
 if(openBtn){ev.preventDefault(); unlock(); open(); }
});
document.addEventListener('change',ev=>{
 const input=ev.target;
 if(input?.name==='photos'&&input.form?.id==='sp-import'&&input.files?.length){unlock(); open(input.files);}
});
document.addEventListener('wardrobe-ready',mount);
if(typeof wardrobe!=='undefined'&&wardrobe) mount();
window.styleProScan={open,guess:file=>window.StyleProScan.guess(file&&file.name,'',brands())};
})();
