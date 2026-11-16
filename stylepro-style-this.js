/* Style this / Style me. Selection stays on this device. Existing labels stay put. */
(()=>{ 'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=[], built=[], heading='';
function owned(){return (wardrobe?.items||[]).filter(i=>window.StyleProCore?.owned(i));}
function byId(id){return (wardrobe?.items||[]).find(i=>i.id===id);}
function sheet(){
 let el=document.getElementById('sp-style-sheet');
 if(el) return el;
 el=document.createElement('dialog');
 el.id='sp-style-sheet';
 el.setAttribute('aria-labelledby','sp-style-title');
 document.body.append(el);
 return el;
}
function names(ids){return ids.map(id=>byId(id)?.name||id).join(' · ');}
function paint(){
 const picks=selected.map(byId).filter(Boolean);
 const options=owned().filter(i=>!selected.includes(i.id));
 const cards=built.map(look=>{
  const pieceItems=look.pieces.map(byId).filter(Boolean);
  return `<article class="sp-day-card" data-style-look="${esc(look.id)}"><p class="sp-kicker">${esc(look.source==='catalog'?'From your lookbook':'Built from your closet')}</p><h2>${esc(look.title)}</h2><p>${esc(names(look.pieces))}</p><div class="sp-rate" role="group" aria-label="Rate ${esc(look.title)}">${[1,2,3,4,5].map(n=>`<button type="button" data-style-stars="${n}" data-style-id="${esc(look.id)}" aria-label="${n} star${n>1?'s':''}">${n<=(look.stars||0)?'★':'☆'}</button>`).join('')}<button type="button" class="sp-hate" data-style-hate data-style-id="${esc(look.id)}">I hate it</button></div>${look.note?`<p class="sp-learn">${esc(look.note)}</p>`:''}<div class="sp-slot-actions"><button type="button" data-style-approve="${esc(look.id)}">Approve</button><button type="button" data-style-edit="${esc(look.id)}">Edit</button><button type="button" data-style-reject="${esc(look.id)}">Reject</button></div></article>`;
 }).join('');
 sheet().innerHTML=`<div class="sp-scan-bar"><div><p class="sp-kicker">Style this</p><h2 id="sp-style-title">${esc(heading||'Style me')}</h2></div><button type="button" data-style-close aria-label="Close">×</button></div><div class="sp-style-body"><p>${picks.length?esc(picks.map(i=>i.name).join(' · ')):'Pick a piece you love — we\'ll style it'}</p><div class="sp-scan-chips">${picks.map(i=>`<button type="button" class="sp-choice" data-style-drop="${esc(i.id)}" aria-pressed="true">${esc(i.name)}</button>`).join('')}</div><label class="sp-field">Add another piece<select data-style-add><option value="">Choose a piece you own</option>${options.map(i=>`<option value="${esc(i.id)}">${esc(i.name)}</option>`).join('')}</select></label><button type="button" class="sp-btn primary" data-style-go ${picks.length?'':'disabled'}>Style me</button>${cards||'<p class="sp-note">These looks use only pieces you already own. The wrinkled khaki skirt stays out unless you picked it.</p>'}</div>`;
}
function open(ids, title){
 for(const id of ids||[]) if(id&&!selected.includes(id)) selected.push(id);
 if(title) heading=title;
 built=[];
 document.querySelectorAll('dialog[open]').forEach(d=>{if(d.id!=='sp-style-sheet') d.close();});
 paint();
 const el=sheet();
 if(!el.open) el.showModal();
}
function go(){
 const taste=window.styleProInvestor?.rankingPrefs?.()||{};
 built=window.StyleProStyleThis.styleAround(wardrobe.items, wardrobe.looks, selected, taste);
 const line=window.StyleProPersona?.speak?.(window.styleProInvestor?.persona?.(),'style',{count:built.length});
 if(line) heading=line;
 paint();
}
function learn(look, stars, hate){
 const pieceItems=look.pieces.map(byId).filter(Boolean);
 const profile=window.styleProInvestor?.learn?.({type:'look',id:look.id,signature:look.signature,stars,hate,items:pieceItems});
 look.stars=hate?1:stars;
 look.note=profile?.acknowledgment||'Learning from your rating';
 paint();
}
function decorate(){
 document.querySelectorAll('#catalog-grid .piece-card').forEach(card=>{
  if(card.querySelector('[data-style-this]')) return;
  const id=card.querySelector('[data-piece]')?.dataset.piece;
  if(!id) return;
  const b=document.createElement('button');
  b.type='button'; b.className='sp-btn'; b.dataset.styleThis=id; b.textContent='Style this';
  card.append(b);
 });
}
function hook(){
 if(typeof renderCatalog==='function'&&!renderCatalog._styleThis){
  const old=renderCatalog;
  renderCatalog=function(){const out=old.apply(this,arguments); decorate(); return out;};
  renderCatalog._styleThis=true;
 }
 if(typeof openPiece==='function'&&!openPiece._styleThis){
  const old=openPiece;
  openPiece=function(id){old(id); const actions=document.querySelector('#piece-content .look-actions'); if(!actions||actions.querySelector('[data-style-this]')) return; const b=document.createElement('button'); b.type='button'; b.className='sp-btn'; b.dataset.styleThis=id; b.textContent='Style this'; actions.append(b);};
  openPiece._styleThis=true;
 }
}
document.addEventListener('click',ev=>{
 const t=ev.target.closest('button'); if(!t) return;
 if(t.hasAttribute('data-style-close')){sheet().close(); return;}
 if(t.dataset.styleThis){if(window.styleProInvestor?.onboarded&&!window.styleProInvestor.onboarded()) return; ev.preventDefault(); ev.stopPropagation(); open([t.dataset.styleThis],'Style me'); return;}
 if(!t.closest('#sp-style-sheet')) return;
 ev.preventDefault();
 if(t.dataset.styleDrop){selected=selected.filter(id=>id!==t.dataset.styleDrop); built=[]; paint(); return;}
 if(t.hasAttribute('data-style-go')){go(); return;}
 const id=t.dataset.styleApprove||t.dataset.styleEdit||t.dataset.styleReject||t.dataset.styleId;
 const look=built.find(l=>l.id===id);
 if(!look) return;
 if(t.dataset.styleApprove){learn(look,5,false); window.styleProFits?.remember?.({id:look.id,title:look.title,pieces:look.pieces,source:'style-this'});}
 else if(t.dataset.styleEdit) learn(look,3,false);
 else if(t.dataset.styleReject||t.hasAttribute('data-style-hate')) learn(look,1,true);
 else if(t.dataset.styleStars) learn(look,Number(t.dataset.styleStars),false);
});
document.addEventListener('change',ev=>{
 const sel=ev.target.closest('[data-style-add]');
 if(!sel?.value) return;
 if(!selected.includes(sel.value)) selected.push(sel.value);
 built=[]; paint();
});
document.addEventListener('wardrobe-ready',()=>{hook(); decorate();});
if(typeof wardrobe!=='undefined'&&wardrobe){hook(); decorate();}
window.styleProStyleThis={open,offerFirst(ids){open(ids,'Pick a piece you love — we\'ll style it');}};
})();
