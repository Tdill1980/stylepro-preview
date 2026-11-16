'use strict';
// Presentation only: retain the existing wardrobe, model, calendar and saved state.
(() => {
 const panel=document.querySelector('.neural-panel');
 if(panel){panel.querySelector('.eyebrow').textContent='YOUR PERSONAL STYLIST';panel.querySelector('h3').textContent='What’s on your calendar?';const detail=panel.querySelector('details');detail.append(document.querySelector('#neural-status'));}
 document.querySelector('#hero-style').addEventListener('click',()=>{document.querySelector('#neural-event').focus({preventScroll:true});panel.scrollIntoView({behavior:'smooth',block:'start'});});
 document.querySelectorAll('[data-premium-view]').forEach(b=>b.addEventListener('click',()=>document.querySelector('.app-tabs [data-view="'+b.dataset.premiumView+'"]').click()));
 const icons={doll:'<rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="7" r="2"/><path d="M8 18v-3a4 4 0 0 1 8 0v3M9 21v-3m6 3v-3"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h2m3 0h2m3 0h1"/>'};
 for(const [view,paths] of Object.entries(icons)){const b=document.querySelector('.app-tabs [data-view="'+view+'"]');if(b)b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+paths+'</svg><span>'+(view==='doll'?'Doll box':'Calendar')+'</span>';}
 const share=document.querySelector('#share');share.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2"/></svg>';
})();
