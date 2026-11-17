/* Should I Buy? Phone camera now. Glasses later. */
(()=>{
'use strict';
const KEY='stylepro-money-saved-v1';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function saved(){try{return JSON.parse(localStorage.getItem(KEY)||'{"cents":0,"skips":0}');}catch{return {cents:0,skips:0};}}
function remember(cents){const row=saved(); if(cents>0){row.cents+=cents; row.skips+=1; localStorage.setItem(KEY, JSON.stringify(row));} return row;}
function speak(text){if(document.body.classList.contains('sp-access')&&window.speechSynthesis){window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));}}
function open(){
 const dialog=document.getElementById('sp-buy-dialog')||document.body.appendChild(Object.assign(document.createElement('dialog'),{id:'sp-buy-dialog'}));
 const row=saved();
 dialog.innerHTML=`<form class="sp-see-body" id="sp-buy-form"><p class="sp-kicker">Before it comes home</p><h2 id="sp-buy-title">Should I Buy?</h2><p>Buy less. Check the closet first.</p><label class="sp-buy-camera">Use the camera<input name="photo" type="file" accept="image/*" capture="environment"></label><label class="sp-field">What is it?<input name="name" required placeholder="black tee"></label><label class="sp-field">Price in USD, if you can see it<input name="price" inputmode="decimal" placeholder="40"></label><button class="sp-btn primary" type="submit">Check my closet</button><div id="sp-buy-result" role="status" aria-live="assertive"></div><p id="sp-buy-saved">Money saved by skipping: $${(row.cents/100).toFixed(2)} across ${row.skips} ${row.skips===1?'skip':'skips'}.</p><button type="button" class="sp-btn" data-buy-close>Close</button></form>`;
 dialog.showModal();
 dialog.querySelector('[data-buy-close]').onclick=()=>dialog.close();
 dialog.querySelector('form').onsubmit=ev=>{
  ev.preventDefault();
  const fd=new FormData(ev.target);
  const dollars=Number(fd.get('price'));
  const result=StyleProBuyCore.assess({name:fd.get('name'), priceCents:Number.isFinite(dollars)&&dollars>0?Math.round(dollars*100):null}, wardrobe.items, wardrobe.looks);
  const book=result.verdict==='Buy'?saved():remember(result.savedCents);
  const thumbs=result.similar.slice(0,6).map(item=>`<figure>${item.image?`<img src="${e(item.image)}" alt="">`:`<span>Photo pending</span>`}<figcaption>${e(item.name)}</figcaption></figure>`).join('');
  const node=dialog.querySelector('#sp-buy-result');
  node.innerHTML=`<article class="sp-buy-card" data-buy-verdict="${e(result.label)}"><p class="sp-kicker">Verdict</p><h3>${e(result.label)}</h3><p>${e(result.spoken)}</p>${thumbs?`<div class="sp-buy-similar">${thumbs}</div>`:''}</article>`;
  node.querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('span'),{textContent:'Photo pending'}));};});
  dialog.querySelector('#sp-buy-saved').textContent=`Money saved by skipping: $${(book.cents/100).toFixed(2)} across ${book.skips} ${book.skips===1?'skip':'skips'}.`;
  speak(`${result.label}. ${result.spoken}`);
 };
}
function mount(root){
 if(document.getElementById('sp-buy-open')) return;
 const button=document.createElement('button');
 button.id='sp-buy-open'; button.type='button'; button.className='sp-btn primary';
 button.textContent='Should I Buy?';
 button.setAttribute('aria-label','Should I Buy? Scan before you buy');
 button.onclick=()=>open();
 root.prepend(button);
}
window.StyleProBuy={open, mount, saved};
})();
