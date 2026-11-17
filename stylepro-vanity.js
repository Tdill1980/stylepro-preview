/* Vanity is not the closet. Fragrance already scanned stays here. The Guerlain lipstick is demo. */
(()=>{
'use strict';
const KEY='stylepro-vanity-v1';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=[];
function saved(){try{const rows=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(rows)?rows:[];}catch{return [];}}
function write(rows){localStorage.setItem(KEY, JSON.stringify(rows));}
function all(){return catalog.concat(saved());}
function suggest(text){
 const raw=String(text||'');
 const brand=(raw.match(/\b(Guerlain|Chanel|Dior|Prada|NUXE|Gucci)\b/i)||[])[1]||'';
 const shade=(raw.match(/\b(\d{2,4})\b/)||[])[1]||'';
 return {brand, shadeNumber:shade, shadeName:''};
}
async function readLabel(file){
 if(!file||!('TextDetector' in window)) return {text:'', note:'OCR is not available in this browser. Type the label, then confirm.'};
 const img=await createImageBitmap(file);
 const detector=new TextDetector();
 const blocks=await detector.detect(img);
 return {text:blocks.map(block=>block.rawValue).join(' '), note:'Suggested from the label. Confirm before saving.'};
}
function card(row){
 return `<button type="button" class="sp-vanity-card" data-vanity="${e(row.id)}"><strong>${e(row.brand)} ${e(row.shadeName||row.name)}</strong><small>${e(row.shadeNumber||'Shade number not recorded')}${row.demo?' · Demo':''}</small></button>`;
}
function detail(row){
 const host=document.getElementById('sp-vanity-detail');
 host.innerHTML=`<article><p class="sp-kicker">${row.demo?'DEMO · NOT A SCANNED PURCHASE':e(row.kind)}</p><h3>${e(row.brand)} · ${e(row.line||row.name)}</h3><p>Shade ${e(row.shadeName||'not recorded')} · ${e(row.shadeNumber||'no number')}</p><p>${e(row.finish||'')} · ${e(row.purchased||'date not recorded')}</p><p>${e([row.place,row.city,row.country].filter(Boolean).join(', '))}</p><p>${row.priceCents==null?'Price not recorded':'$'+(row.priceCents/100).toFixed(2)}</p><p>${e(row.notes||'')}</p><button type="button" class="sp-btn" data-reorder="${e(row.id)}">Reorder / find in store</button><p data-reorder-note></p></article>`;
 host.querySelector('[data-reorder]').onclick=()=>{host.querySelector('[data-reorder-note]').textContent=`Ask for ${row.brand} ${row.shadeName||row.name}, shade ${row.shadeNumber||'unrecorded'}.`;};
}
function paint(){
 const host=document.getElementById('sp-vanity'); if(!host) return;
 host.innerHTML=`<p class="sp-kicker">MY VANITY</p><h2>Makeup, skincare, perfume.</h2><p>These are not closet garments.</p><div class="sp-vanity-list">${all().map(card).join('')}</div><form id="sp-ask"><label class="sp-field">Ask your vanity or closet<input name="q" placeholder="what Guerlain lipstick do I have?"></label><button class="sp-btn" type="button" data-ask-voice>Speak</button><button class="sp-btn primary" type="submit">Ask</button></form><div id="sp-ask-answer"></div><div id="sp-vanity-detail"></div><form id="sp-vanity-scan"><label class="sp-field">Scan a label<input name="photo" type="file" accept="image/*" capture="environment"></label><label class="sp-field">Or type the label<input name="label" placeholder="Guerlain Rouge G 214"></label><button class="sp-btn primary" type="submit">Suggest, then I'll confirm</button></form><p id="sp-vanity-suggest"></p>`;
 host.querySelectorAll('[data-vanity]').forEach(button=>button.onclick=()=>detail(all().find(row=>row.id===button.dataset.vanity)));
 const answer=query=>{
  const result=ask(query);
  const box=host.querySelector('#sp-ask-answer');
  if(result.ask){box.textContent=result.ask; return;}
  const row=result.matches[0];
  if(!row){box.textContent='Nothing in the vanity or closet matches those words.'; return;}
  box.innerHTML=`<p>${e(row.demo?'Demo match. ':'')}${e(row.brand||'')} ${e(row.shadeName||row.name||'')} · shade ${e(row.shadeNumber||'not recorded')}</p>`;
  if(row.shadeName) detail(row);
 };
 host.querySelector('#sp-ask').onsubmit=ev=>{ev.preventDefault(); answer(new FormData(ev.target).get('q'));};
 host.querySelector('[data-ask-voice]').onclick=()=>{
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  const input=host.querySelector('#sp-ask input');
  if(!Speech){input.focus(); return;}
  const rec=new Speech(); rec.lang='en-US'; rec.onresult=ev=>{input.value=ev.results[0][0].transcript; answer(input.value);}; rec.start();
 };
 host.querySelector('#sp-vanity-scan').onsubmit=async ev=>{
  ev.preventDefault();
  const fd=new FormData(ev.target);
  const file=fd.get('photo');
  const ocr=file&&file.size?await readLabel(file):{text:'', note:''};
  const guess=suggest(`${ocr.text} ${fd.get('label')||''}`);
  const box=host.querySelector('#sp-vanity-suggest');
  box.innerHTML=`<p>${e(ocr.note||'Confirm these fields.')}</p><form id="sp-vanity-confirm"><label class="sp-field">Brand<input name="brand" value="${e(guess.brand)}" required></label><label class="sp-field">Shade number<input name="shadeNumber" value="${e(guess.shadeNumber)}"></label><label class="sp-field">Shade name<input name="shadeName" required></label><button class="sp-btn primary" type="submit">I confirm this vanity item</button></form>`;
  box.querySelector('form').onsubmit=event=>{
   event.preventDefault();
   const fields=Object.fromEntries(new FormData(event.target));
   const row={id:'vanity-'+Date.now(), demo:false, kind:'makeup', brand:fields.brand, name:fields.brand+' '+fields.shadeName, shadeName:fields.shadeName, shadeNumber:fields.shadeNumber, notes:'Confirmed by you from a scan or typed label.', priceCents:null};
   write(saved().concat(row));
   paint();
  };
 };
}
async function mount(root){
 if(!catalog.length){try{catalog=await (await fetch('vanity.json')).json().then(data=>data.items||[]);}catch{catalog=[];}}
 try{
  const fragrance=await (await fetch('fragrance.json')).json();
  for(const row of fragrance){
   if(catalog.some(item=>item.name===row.name)) continue;
   catalog.push({id:'fragrance-'+catalog.length, demo:false, kind:'perfume', brand:row.name.split('·')[0].trim(), name:row.name, notes:row.notes, photo:row.photo, shadeName:'', shadeNumber:'', priceCents:null});
  }
 }catch{}
 let host=document.getElementById('sp-vanity');
 if(!host){host=document.createElement('section'); host.id='sp-vanity'; root.append(host);}
 paint();
}
function ask(query){
 const result=StyleProAskCore.search(query, all().concat((wardrobe&&wardrobe.items||[]).map(item=>({id:item.id, brand:item.brand, name:item.name, category:item.category, notes:item.description||''}))));
 return result;
}
window.StyleProVanity={mount, ask, all, suggest};
})();
