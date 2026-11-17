/* Community board on this device. Shared looks stay after refresh. Not a public network. */
(()=>{
'use strict';
const FEED='stylepro-community-feed-v1';
const DRAFTS='stylepro-community-drafts-v1';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(key){try{const rows=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(rows)?rows:[];}catch{return [];}}
function write(key, rows){localStorage.setItem(key, JSON.stringify(rows));}
function seed(){
 if(localStorage.getItem(FEED)) return read(FEED);
 write(FEED, []);
 return [];
}
function publish(look, rating){
 const row={id:'share-'+look.id, lookId:look.id, title:look.title, pieces:[...look.pieces], author:'Trish', state:'shared-local', stars:rating||0, comments:[], createdAt:new Date().toISOString()};
 const feed=seed().filter(item=>item.lookId!==look.id);
 feed.unshift(row);
 write(FEED, feed);
 const drafts=read(DRAFTS).filter(item=>item.lookId!==look.id);
 drafts.unshift({lookId:look.id, rating:rating||null, state:'shared-local', caption:look.title, at:row.createdAt});
 write(DRAFTS, drafts);
 return row;
}
function art(look){
 if(typeof outfitCollage==='function'&&look) return `<div class="sp-community-preview">${outfitCollage(look)}</div>`;
 return '';
}
function card(row){
 const look=typeof lookById==='function'?lookById(row.lookId):null;
 const shown=look||{id:row.lookId, title:row.title, pieces:row.pieces||[]};
 return `<article class="sp-community-card" data-community-card="${e(row.id)}"><div>${art(shown)}</div><div><p class="sp-kicker">${e(row.author)} · on this device</p><h3>${e(shown.title)}</h3><div class="sp-verdict-row" role="group" aria-label="Rate ${e(shown.title)}">${[1,2,3,4,5].map(n=>`<button type="button" data-community-star="${n}" data-community-id="${e(row.id)}" aria-pressed="${row.stars===n}">${n}</button>`).join('')}</div><ul>${(row.comments||[]).map(note=>`<li><strong>${e(note.by)}</strong> ${e(note.text)}</li>`).join('')||'<li>No comments yet.</li>'}</ul><form data-community-comment="${e(row.id)}"><label class="sp-field">Comment<input name="text" maxlength="180" required></label><button class="sp-btn" type="submit">Comment</button></form><div class="sp-actions"><button type="button" class="sp-btn" data-community-inspo="${e(row.lookId)}">Save to inspo</button><button type="button" class="sp-btn" data-community-swap="${e(row.lookId)}">Request a swap</button></div></div></article>`;
}
function mount(root){
 if(!root) return;
 let host=document.getElementById('sp-community');
 if(!host){host=document.createElement('section'); host.id='sp-community'; host.setAttribute('aria-label','Community board'); root.append(host);}
 const rows=seed().filter(row=>row.state==='shared-local');
 host.innerHTML=`<div class="sp-topline"><div><p class="sp-kicker">Community</p><h2>Shared from your closet.</h2><p>${rows.length?rows.length+' look'+(rows.length===1?'':'s')+' on this device. A refresh keeps them.':'Nothing shared yet. Share a look and it stays on this phone.'}</p></div></div><div class="sp-community-list">${rows.map(card).join('')}</div>`;
 host.querySelectorAll('[data-community-star]').forEach(button=>button.onclick=()=>{
  const rows=read(FEED).map(row=>row.id===button.dataset.communityId?{...row, stars:Number(button.dataset.communityStar)}:row);
  write(FEED, rows); mount(root);
 });
 host.querySelectorAll('[data-community-comment]').forEach(form=>form.onsubmit=ev=>{
  ev.preventDefault();
  const text=new FormData(form).get('text').trim(); if(!text) return;
  const rows=read(FEED).map(row=>row.id===form.dataset.communityComment?{...row, comments:[...(row.comments||[]),{by:'You', text, at:new Date().toISOString()}]}:row);
  write(FEED, rows); mount(root);
 });
 host.querySelectorAll('[data-community-inspo]').forEach(button=>button.onclick=()=>{
  if(window.StyleProInspiration&&window.stylePro){/* inspiration clicks are recorded by the existing button path */}
  const key='stylepro-inspo-saves-v1';
  const saved=read(key);
  if(!saved.some(id=>id===button.dataset.communityInspo)) write(key, saved.concat(button.dataset.communityInspo));
  button.textContent='Saved to inspo';
 });
 host.querySelectorAll('[data-community-swap]').forEach(button=>button.onclick=()=>{
  const key='stylepro-swap-requests-v1';
  const saved=read(key);
  saved.unshift({lookId:button.dataset.communitySwap, state:'requested', cash:false, at:new Date().toISOString()});
  write(key, saved);
  button.textContent='Swap requested';
 });
}
window.StyleProCommunity={FEED, DRAFTS, seed, publish, mount, read};
})();
