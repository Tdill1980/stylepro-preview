/* Verdict controls. They remember a rating and tell the stylist. They do not dress a photo. */
(()=>{
'use strict';
const Core=window.StyleProVerdictCore;
function read(){try{const saved=JSON.parse(localStorage.getItem(Core.KEY)||'null'); return saved&&saved.version===1?saved:Core.blank();}catch{return Core.blank();}}
function write(store){localStorage.setItem(Core.KEY, JSON.stringify(store));}
function current(){return read();}
function markup(look){
 const saved=read().records.find(row=>row.lookId===look.id);
 const learning=Core.learning(read());
 const buttons=Object.entries(Core.VERDICTS).map(([id,label])=>`<button type="button" data-verdict="${id}" aria-pressed="${saved&&saved.verdict===id}">${label}</button>`).join('');
 const stars=[1,2,3,4,5].map(n=>`<button type="button" data-stars="${n}" aria-label="${n} star${n>1?'s':''}" aria-pressed="${saved&&saved.stars===n}">${n}</button>`).join('');
 const off=Core.OFF.map(([id,label])=>`<button type="button" data-off="${id}" aria-pressed="${!!(saved&&saved.off.includes(id))}">${label}</button>`).join('');
 return `<form class="sp-verdict" data-verdict-form data-look-id="${look.id}"><h3>Did my stylist nail it?</h3><div class="sp-verdict-row" role="group" aria-label="Verdict">${buttons}</div><div class="sp-verdict-row" role="group" aria-label="Stars, optional">${stars}</div><p class="sp-kicker">What's off, optional</p><div class="sp-verdict-row">${off}</div><button class="sp-btn primary" type="submit">Remember this</button><p class="sp-learning" data-learning ${learning?'':'hidden'}>Your stylist is learning.</p></form>`;
}
function bind(root, look){
 const form=root.querySelector('[data-verdict-form]'); if(!form) return;
 const state={verdict:'', stars:null, off:new Set()};
 form.querySelectorAll('[data-verdict]').forEach(button=>button.onclick=()=>{state.verdict=button.dataset.verdict; form.querySelectorAll('[data-verdict]').forEach(node=>node.setAttribute('aria-pressed', String(node===button)));});
 form.querySelectorAll('[data-stars]').forEach(button=>button.onclick=()=>{state.stars=Number(button.dataset.stars); form.querySelectorAll('[data-stars]').forEach(node=>node.setAttribute('aria-pressed', String(node===button)));});
 form.querySelectorAll('[data-off]').forEach(button=>button.onclick=()=>{const id=button.dataset.off; if(state.off.has(id)) state.off.delete(id); else state.off.add(id); button.setAttribute('aria-pressed', String(state.off.has(id)));});
 form.onsubmit=ev=>{
  ev.preventDefault();
  try{
   const signature=window.StyleProCore?StyleProCore.signature(look.pieces):[...look.pieces].sort().join('|');
   const next=Core.save(read(),{lookId:look.id, signature, title:look.title, pieces:look.pieces, verdict:state.verdict, stars:state.stars, off:[...state.off], at:new Date().toISOString()});
   write(next);
   const note=form.querySelector('[data-learning]'); note.hidden=false; note.textContent='Your stylist is learning.';
  }catch(err){form.querySelector('[data-learning]').hidden=false; form.querySelector('[data-learning]').textContent=err.message;}
 };
}
function preferences(){return Core.preferences(read());}
function promptAddendum(){return Core.promptAddendum(read());}
window.StyleProVerdict={markup, bind, current, preferences, promptAddendum, learning:()=>Core.learning(read())};
})();
