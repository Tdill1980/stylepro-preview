/* Closet valet. A horizontal belt of the real piece photos. */
(()=>{
'use strict';
const C=window.StyleProCore;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let category='', color='';
function colorOf(item){
 const blob=`${item.name} ${item.description||''}`.toLowerCase();
 return ['black','white','blue','burgundy','brown','pink','navy','cream','gold','red','green'].find(name=>blob.includes(name))||'';
}
function items(){
 return (wardrobe.items||[]).filter(C.owned).filter(item=>!category||item.category===category).filter(item=>!color||colorOf(item)===color);
}
function paint(root){
 let host=document.getElementById('sp-valet');
 if(!host){host=document.createElement('section'); host.id='sp-valet'; host.setAttribute('aria-label','Closet valet'); root.append(host);}
 const categories=[...new Set((wardrobe.items||[]).filter(C.owned).map(item=>item.category))].sort();
 const colors=['black','white','blue','burgundy','brown','pink','navy','cream','gold'];
 host.innerHTML=`<p class="sp-kicker">Closet valet</p><h2>The belt.</h2><p class="sp-note">Drag a piece onto a look or the doll.</p><div class="sp-valet-belt" tabindex="0">${items().map(item=>`<button type="button" class="sp-valet-piece" draggable="true" data-valet-id="${e(item.id)}">${item.image?`<img src="${e(item.image)}" alt="${e(item.name)}">`:`<span class="sp-valet-pending">Photo pending</span>`}<span>${e(item.name)}</span></button>`).join('')}</div><div class="sp-valet-filters" role="group" aria-label="Category">${[''].concat(categories).map(name=>`<button type="button" data-valet-cat="${e(name)}" aria-pressed="${category===name}">${name||'All'}</button>`).join('')}</div><div class="sp-valet-filters" role="group" aria-label="Color">${colors.map(name=>`<button type="button" data-valet-color="${name}" aria-pressed="${color===name}">${name}</button>`).join('')}</div><div class="sp-valet-drops"><div class="sp-valet-drop" data-drop="look">Drop on a look</div><div class="sp-valet-drop" data-drop="doll">Drop on the doll</div></div><div id="sp-valet-look" class="sp-valet-tray"></div>`;
 host.querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{className:'sp-valet-pending',textContent:'Photo pending'}));};});
 host.querySelectorAll('[data-valet-cat]').forEach(button=>button.onclick=()=>{category=button.dataset.valetCat; paint(root);});
 host.querySelectorAll('[data-valet-color]').forEach(button=>button.onclick=()=>{color=color===button.dataset.valetColor?'':button.dataset.valetColor; paint(root);});
 host.querySelectorAll('[data-valet-id]').forEach(button=>{button.ondragstart=ev=>{ev.dataTransfer.setData('text/plain', button.dataset.valetId);};});
 host.querySelectorAll('[data-drop]').forEach(zone=>{
  zone.ondragover=ev=>ev.preventDefault();
  zone.ondrop=ev=>{
   ev.preventDefault();
   const id=ev.dataTransfer.getData('text/plain');
   const item=wardrobe.items.find(row=>row.id===id);
   if(!item) return;
   if(zone.dataset.drop==='doll'){if(window.wardrobeDoll) window.wardrobeDoll.seeOnMe(item.lookIds&&item.lookIds[0]); return;}
   host.querySelector('#sp-valet-look').insertAdjacentHTML('beforeend', `<span>${e(item.name)}</span>`);
  };
 });
}
window.StyleProValet={paint};
})();
