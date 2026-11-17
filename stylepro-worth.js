/* Worth panel. Owner prices stay on this device. Estimates stay labeled. */
(()=>{
'use strict';
const Core=window.StyleProWorthCore;
const KEY='stylepro-worth-edits-v1';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function edits(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}'); return saved&&typeof saved==='object'?saved:{};}catch{return {};}}
function saveEdit(id, row){const all=edits(); all[id]=row; localStorage.setItem(KEY, JSON.stringify(all));}
function report(){return Core.audit(wardrobe.items, window.__worthEvidence||{}, edits());}
async function loadEvidence(){
 if(window.__worthEvidence) return window.__worthEvidence;
 try{const response=await fetch('valuation-evidence.json'); const data=await response.json(); window.__worthEvidence=data.items||{};}catch{window.__worthEvidence={};}
 return window.__worthEvidence;
}
function rowNote(row){
 if(row.kind==='known') return 'Known · the price you entered';
 if(row.source==='reviewed-retail') return 'Estimated · reviewed retail';
 if(row.kind==='excluded') return 'Left out';
 return 'Estimated · '+e(row.brand||'unbranded')+' · '+e(row.category||'piece');
}
function paint(root){
 const box=report();
 let host=document.getElementById('sp-worth-audit');
 if(!host){host=document.createElement('section'); host.id='sp-worth-audit'; host.setAttribute('aria-label','Closet net worth'); root.prepend(host);}
 const rows=box.lines.slice().sort((a,b)=>({known:0,estimated:1,excluded:2}[a.kind]-{known:0,estimated:1,excluded:2}[b.kind])||b.cents-a.cents||a.name.localeCompare(b.name));
 host.innerHTML=`<p class="sp-kicker">Closet net worth</p><h2>${Core.money(box.totalCents)}</h2><div class="sp-worth-split"><div><span>Known</span><strong>${Core.money(box.knownCents)}</strong><small>${box.known} ${box.known===1?'piece':'pieces'}</small></div><div><span>Estimated</span><strong>${Core.money(box.estimatedCents)}</strong><small>${box.estimated} ${box.estimated===1?'piece':'pieces'}</small></div></div><p class="sp-note">${e(box.why)}</p><div class="sp-worth-list">${rows.map(row=>`<button type="button" data-worth-edit="${e(row.id)}"><img src="${e(row.image)}" alt=""> <span><b>${e(row.name)}</b><small>${row.kind==='excluded'?'Left out':Core.money(row.cents)} · ${rowNote(row)}</small></span></button>`).join('')}</div>`;
 host.querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'sp-worth-fallback',textContent:'Photo pending'}));};});
 host.querySelectorAll('[data-worth-edit]').forEach(button=>button.onclick=()=>edit(button.dataset.worthEdit));
}
function edit(id){
 const item=wardrobe.items.find(row=>row.id===id); if(!item) return;
 const dialog=document.getElementById('sp-worth-dialog')||document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'sp-worth-dialog'}));
 dialog.innerHTML=`<form class="sp-see-body"><h2>Price for ${e(item.name)}</h2><p class="sp-note">Enter what you paid, or the retail you trust. Leave it blank to keep the estimate.</p><label class="sp-field">USD<input name="amount" inputmode="decimal" placeholder="129.00"></label><div class="sp-actions"><button class="sp-btn primary" type="submit">Save known price</button><button class="sp-btn" type="button" data-worth-close>Cancel</button></div></form>`;
 dialog.showModal();
 dialog.querySelector('[data-worth-close]').onclick=()=>dialog.close();
 dialog.querySelector('form').onsubmit=ev=>{
  ev.preventDefault();
  const amount=new FormData(ev.target).get('amount');
  if(!String(amount).trim()){dialog.close(); return;}
  const dollars=Number(amount);
  if(!Number.isFinite(dollars)||dollars<=0) return;
  saveEdit(id,{mode:'known', amountCents:Math.round(dollars*100), currency:'USD'});
  dialog.close();
  paint(document.getElementById('sp-worth-audit').parentElement);
 };
}
async function mount(root){await loadEvidence(); paint(root);}
window.StyleProWorth={mount, report};
})();
