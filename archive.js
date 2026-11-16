
'use strict';
const sections={collection:['collection'],outfits:['personal-hero','outfits'],tryon:['top','outfits'],saved:['outfits'],stories:['handmade','accessories','fragrance','brief','share-save']};
function switchView(view){
 document.body.dataset.view=view;
 activePersona='';document.querySelectorAll('[data-persona]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.persona==='')));
 document.querySelectorAll('main > section').forEach(s=>{if(!s.classList.contains('app-intro'))s.hidden=!(sections[view]||[]).includes(s.id);});
 document.querySelector('.app-intro h1').innerHTML=({outfits:'The outfit edit',collection:'Your wardrobe',tryon:'On you',saved:'Your saved looks',stories:'The stories'}[view]||'The outfit edit')+'<span>.</span>';
 document.querySelectorAll('.app-tabs [data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 eventQuery='';$('#event-input').value='';$('#event-status').textContent='';
 document.querySelectorAll('[data-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.style==='')));
 $('#look-type').value=view==='tryon'?'tryon':view==='outfits'?'assembly':'';
 $('#event-finder').hidden=view!=='outfits';
 if(wardrobe){savedLooksOnly=view==='saved';$('#saved-looks').setAttribute('aria-pressed',String(savedLooksOnly));activeOccasion='';$('#style-filter').value='';lookLimit=16;renderLooks();}
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.app-tabs [data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
const renderOriginalLooks=renderLooks;
let eventQuery='';
renderLooks=function(){
 if(!eventQuery){renderOriginalLooks();return;}
 const all=wardrobe.looks;
 const q=eventQuery.toLowerCase();
 const occasionRules={work:/meet|office|client|work|business/,dinner:/dinner|evening|date|restaurant|party/,camera:/film|camera|sema|show|present/,weekend:/travel|flight|airport|weekend|walk/,everyday:/errand|coffee|casual|everyday|lunch|shopping/};
 const tags=Object.keys(occasionRules).filter(k=>occasionRules[k].test(q));
 const styles=['preppy','classic','edgy','boho','maximalist','casual','dressy','formal','romantic'].filter(t=>q.includes(t));
 wardrobe.looks=all.filter(l=>{
 const literal=[l.title,l.description,...l.pieces.map(id=>itemById(id).name)].join(' ').toLowerCase().includes(q);
 if(/paint|wwwrap/i.test(q))return (l.eventTags||[]).includes('paint is dead');
 if(/sema/i.test(q))return (l.eventTags||[]).includes('sema');
 return literal || ((tags.length||styles.length)&&(!tags.length||tags.some(t=>l.occasions.includes(t)))&&(!styles.length||styles.some(t=>(l.styleTags||[]).some(s=>s.toLowerCase()===t))));
 });
 try{renderOriginalLooks();$('#event-status').textContent=wardrobe.looks.length?`Matching ready-made looks for “${eventQuery}”. No waiting or generation.`:'No ready-made match yet. Try an occasion like meeting, dinner, travel or filming.';}finally{wardrobe.looks=all;}
};
$('#event-form').addEventListener('submit',e=>{e.preventDefault();eventQuery=$('#event-input').value.trim();activeOccasion='';lookLimit=16;renderLooks();});
$('#event-input').addEventListener('input',()=>{if(!$('#event-input').value.trim()){eventQuery='';$('#event-status').textContent='';if(wardrobe)renderLooks();}});
$('#clear-look-filters').addEventListener('click',()=>{eventQuery='';$('#event-input').value='';$('#event-status').textContent='';renderLooks();});
document.querySelector('#sema-now').addEventListener('click',()=>{$('#event-input').value='SEMA registration and filming';$('#event-form').requestSubmit();});
switchView('outfits');

document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{$('#event-input').value=b.dataset.plan;$('#event-form').requestSubmit();}));
const filterControls=document.querySelector('.lookbook-toolbar .view-controls');
const filterDrawer=document.createElement('details');filterDrawer.className='more-filters';
filterDrawer.innerHTML='<summary>Filters</summary>';filterControls.before(filterDrawer);filterDrawer.append(filterControls);filterDrawer.append($('#occasion-filters'));$('#event-form').after(filterDrawer);


const navIcons={outfits:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="17" width="7" height="4" rx="1.5"/>',collection:'<path d="M9 6a3 3 0 1 1 4 3v3l8 5v3H3v-3l9-5"/>',tryon:'<circle cx="12" cy="5" r="3"/><path d="M5 22v-6a7 7 0 0 1 14 0v6"/>',saved:'<path d="M6 3h12v19l-6-4-6 4z"/>',stories:'<path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15"/>'};
document.querySelectorAll('.app-tabs [data-view]').forEach(b=>b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">'+navIcons[b.dataset.view]+'</svg><span>'+b.textContent+'</span>');
$('.header').append($('.app-tabs'));
document.querySelectorAll('[data-style]').forEach(b=>b.addEventListener('click',()=>{eventQuery='';$('#event-input').value='';$('#event-status').textContent='';$('#style-filter').value=b.dataset.style;activeOccasion='';lookLimit=16;document.querySelectorAll('[data-style]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderLooks();}));
$('#event-input').setAttribute('aria-label','Find outfits for an event');
$('#event-form').addEventListener('submit',()=>{$('.more-filters').open=false;});

const personaPanel=document.createElement('div');personaPanel.className='persona-panel';
personaPanel.innerHTML='<h3>Your stylist edits</h3><p>Romantic boho with a little Western. Lace, soft blouses and warm leather—from your wardrobe.</p><div class="persona-buttons">'+['All', 'Boss Babe','Old Money','Mob Wife','Barbie','Boho','Maximalist','Sexy','Playful','Pilates Babe'].map(n=>'<button type="button" data-persona="'+(n==='All'?'':n)+'" aria-pressed="'+(n==='All')+'">'+n+'</button>').join('')+'</div>';
$('#event-finder').after(personaPanel);
personaPanel.addEventListener('click',e=>{const b=e.target.closest('[data-persona]');if(!b||!wardrobe)return;activePersona=b.dataset.persona;eventQuery='';$('#event-input').value='';$('#event-status').textContent='';activeOccasion='';$('#style-filter').value='';$('#look-type').value='';lookLimit=16;personaPanel.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderLooks();});
$('#clear-look-filters').addEventListener('click',()=>{activePersona='';personaPanel.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.persona==='')));renderLooks();});
