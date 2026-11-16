'use strict';
/* A small trainable MLP, not a language model. All personal state stays in this browser. */
const StylistCore=(()=>{
 const colors=['black','white','cream','ivory','beige','brown','blue','navy','pink','burgundy','green','gray','gold','silver','orange','lavender'];
 const motifs=['lace','floral','strip','print','leopard','plaid','crystal','ribbed','satin','denim','leather','suede'];
 const personas=['Boss Babe','Old Money','Mob Wife','Barbie','Boho','Maximalist','Sexy','Playful','Pilates Babe'];
 const contexts=['everyday','work','camera','dinner','weekend'];
 const cat=i=>i.category==='Dresses'?'dress':/Bottoms|Pants|Skirts/.test(i.category)?'bottom':i.category==='Jackets & layers'?'layer':i.category==='Handbags'?'bag':i.category==='Jewelry'?'jewel':i.category==='Accessories'?'accessory':i.category==='Shoes'?'shoe':'top';
 const text=i=>(i.name+' '+(i.styleTags||'')).toLowerCase();
 const features=(items,context='everyday')=>{
  const x=Array(80).fill(0),n=Math.max(1,items.length);const roles=['top','bottom','dress','layer','bag','jewel','accessory','shoe'];
  for(const i of items){const t=text(i);roles.forEach((r,j)=>{if(cat(i)===r)x[j]+=.5;});colors.forEach((c,j)=>{if(t.includes(c))x[8+j]+=1/n;});motifs.forEach((c,j)=>{if(t.includes(c))x[24+j]+=1/n;});personas.forEach((c,j)=>{if(t.includes(c.toLowerCase()))x[36+j]+=1/n;});
   // Stable item identity features allow personal feedback to distinguish similar pieces.
   const id=Number(i.id);x[50+id%24]+=1/n;
  }
  contexts.forEach((c,j)=>x[45+j]=context===c?1:0);
  x[74]=items.length/8;x[75]=items.filter(i=>/fitted|cropped|slim/.test(text(i))).length/n;x[76]=items.filter(i=>/loose|wide|flare|drap/.test(text(i))).length/n;x[77]=items.filter(i=>/gold/.test(text(i))).length/n;x[78]=items.filter(i=>/silver/.test(text(i))).length/n;x[79]=1;return x;
 };
 class Network{
  constructor(){let s=771;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296-.5;};this.w=Array.from({length:24},()=>Array.from({length:80},()=>rand()*.3));this.b=Array(24).fill(0);this.v=Array.from({length:24},()=>rand()*.3);this.c=0;this.steps=0;}
  forward(x){const h=this.w.map((row,j)=>Math.tanh(row.reduce((a,w,k)=>a+w*x[k],this.b[j])));const z=h.reduce((a,v,j)=>a+v*this.v[j],this.c);return {h,y:1/(1+Math.exp(-Math.max(-25,Math.min(25,z))))};}
  predict(x){return this.forward(x).y;}
  train(x,target,rate=.025){const {h,y}=this.forward(x),d=y-target,old=this.v.slice();for(let j=0;j<24;j++){this.v[j]-=rate*d*h[j];const dh=d*old[j]*(1-h[j]*h[j]);this.b[j]-=rate*dh;for(let k=0;k<80;k++)this.w[j][k]-=rate*dh*x[k];}this.c-=rate*d;this.steps++;}
 }
 function context(q){return /film|shoot|camera|sema|video/i.test(q)?'camera':/dinner|party|evening|date night|wedding/i.test(q)?'dinner':/office|client|founder|meeting|business|work/i.test(q)?'work':/travel|drive|weekend|walk|vacation/i.test(q)?'weekend':'everyday';}
 const signature=ids=>[...ids].sort().join('-');
 function eligible(i){return !!i.cutout&&!/unconfirmed|considered|skipped/i.test(i.status||'');}
 function styleMatch(i,p){const t=i.name.toLowerCase();const r={'Boss Babe':/tailor|blazer|vest|satin|collared|square-neck|mock-neck/,'Old Money':/cream|navy|cable|classic|tailor/,'Mob Wife':/leopard|leather|black|gold/,'Barbie':/pink|barbie|crystal|playful/,'Boho':/lace|suede|floral|flare|ruffle|boho/,'Maximalist':/print|floral|leopard|crystal|color|plaid/,'Sexy':/fitted|satin|lace|v-neck/,'Playful':/pink|graphic|print|barbie|color/,'Pilates Babe':/jogger|tank|hoodie|fleece|waffle/};return !p||!!r[p]?.test(t);}
 function compatible(items,ctx,q=''){const garments=items.filter(i=>['top','bottom','dress','layer'].includes(cat(i)));if(ctx==='work'&&garments.some(i=>/barbie|graphic|mini|sheer/.test(i.name.toLowerCase())))return false;
  if(ctx==='camera'&&garments.some(i=>/sequined|sheer|striped|mini|rhinestone/.test(i.name.toLowerCase())))return false;
  const brand=/\bwpw\b|we\s*print\s*wraps/i.test(q)?/we print wraps/i:/ink\s*(?:&|and)\s*edge/i.test(q)?/ink.*edge/i:/wrap\s*tv/i.test(q)?/wrap tv/i:null;if(brand&&!garments.some(i=>brand.test(i.name)))return false;
  if(['work','camera'].includes(ctx)&&items.some(i=>cat(i)==='bag'&&/crystal|clutch|money-design|sequin/.test(i.name.toLowerCase())))return false;
  // Avoid stacking busy statements; allow two in maximalist styling at selection time.
  return garments.filter(i=>/leopard|floral|plaid|scarf-print/.test(i.name.toLowerCase())).length<=2;
 }
 return {Network,features,cat,text,context,signature,eligible,styleMatch,compatible,personas};
})();
if(typeof module!=='undefined')module.exports=StylistCore;
if(typeof document!=='undefined'){
 let net,ratings={},created=[],events={},exposure={},ready=false;
 const storage='trish-neural-stylist-v1';
 const read=()=>{try{return JSON.parse(localStorage.getItem(storage)||'{}')}catch{return {}}};
 let state=read();ratings=state.ratings||{};created=Array.isArray(state.created)?state.created:[];events=state.events||{};for(const d of Object.keys(events))if(!Array.isArray(events[d]))events[d]=[events[d]];exposure=state.exposure||{};
 function persist(){try{localStorage.setItem(storage,JSON.stringify({ratings,created,events,exposure}));return true;}catch{toast('Browser storage is full. Export your styling data to keep this session.');return false;}}
 function train(){net=new StylistCore.Network();const seeds=wardrobe.looks.filter(l=>!l.neural),samples=[];for(const l of seeds){const items=l.pieces.map(itemById).filter(Boolean),ctx=l.occasions?.[0]||'everyday';samples.push([StylistCore.features(items,ctx),.8]);const incomplete=items.filter(i=>!['bottom','dress'].includes(StylistCore.cat(i)));if(incomplete.length)samples.push([StylistCore.features(incomplete,ctx),.15]);}
  for(let ep=0;ep<18;ep++)for(const [x,y] of samples)net.train(x,y,.018);
  // Rebuild from the current rating per look: changing a rating does not retain its old label.
  for(let ep=0;ep<45;ep++)for(const [id,r] of Object.entries(ratings)){const l=lookById(id);if(l&&r>=1&&r<=5)net.train(StylistCore.features(l.pieces.map(itemById).filter(Boolean),l.occasions?.[0]),(r-1)/4,.035);}
  status();
 }
 function status(){const el=$('#neural-status');if(el)el.textContent=`Neural network active · ${Object.keys(ratings).length} personal ratings · ${created.length} new looks · saved in this browser`;}
 function ratingMarkup(l){return `<div class="look-rating" role="group" aria-label="Rate ${escapeHTML(l.title)}"><span>Your rating</span>${[1,2,3,4,5].map(n=>`<button data-rate-look="${l.id}" data-stars="${n}" aria-label="${n} stars for ${escapeHTML(l.title)}" aria-pressed="${ratings[l.id]===n}" class="${n<=(ratings[l.id]||0)?'lit':''}">★</button>`).join('')}<button class="doll-look" data-dress-look="${l.id}">Try in box</button></div>`;}
 function decorate(){if(!ready)return;document.querySelectorAll('#outfit-grid .look-card').forEach(c=>{const id=c.querySelector('[data-look]')?.dataset.look,l=lookById(id);if(l&&!c.querySelector('.look-rating'))c.insertAdjacentHTML('beforeend',ratingMarkup(l));});}
 function generate(q,p,count=12){const ctx=StylistCore.context(q),pool=wardrobe.items.filter(StylistCore.eligible),pickRole=r=>pool.filter(i=>StylistCore.cat(i)===r),tops=pickRole('top').filter(i=>!(/\bwpw\b|we\s*print\s*wraps/i.test(q))||/we print wraps/i.test(i.name)).filter(i=>!(/ink\s*(?:&|and)\s*edge/i.test(q))||/ink.*edge/i.test(i.name)).filter(i=>!(/wrap\s*tv/i.test(q))||/wrap tv/i.test(i.name)),bottoms=pickRole('bottom'),dresses=pickRole('dress'),bags=pickRole('bag'),jewels=pickRole('jewel'),layers=pickRole('layer'),shoes=pickRole('shoe'),belts=pickRole('accessory').filter(i=>/belt/.test(i.name));
  const pick=a=>a[Math.floor(Math.random()*a.length)],seen=new Set(wardrobe.looks.map(l=>StylistCore.signature(l.pieces))),candidates=[],oldCores=new Set(wardrobe.looks.map(l=>StylistCore.signature(l.pieces.map(itemById).filter(Boolean).filter(i=>['top','bottom','dress','layer'].includes(StylistCore.cat(i))).map(i=>i.id))));
  for(let k=0;k<2200;k++){const useDress=dresses.length&&Math.random()<.15;let items=useDress?[pick(dresses)]:[pick(tops),pick(bottoms)];if(layers.length&&Math.random()<.33)items.push(pick(layers));if(bags.length)items.push(pick(bags));if(jewels.length)items.push(pick(jewels));if(shoes.length&&ctx!=='dinner')items.push(pick(shoes));if(belts.length&&items.some(i=>i&&StylistCore.cat(i)==='bottom'&&/jean|denim/.test(i.name))&&Math.random()<.4)items.push(pick(belts));items=items.filter(Boolean);
   if(p&&!items.some(i=>['top','bottom','dress','layer'].includes(StylistCore.cat(i))&&StylistCore.styleMatch(i,p)))continue;if(!StylistCore.compatible(items,ctx,q))continue;
   const core=StylistCore.signature(items.filter(i=>['top','bottom','dress','layer'].includes(StylistCore.cat(i))).map(i=>i.id));if(oldCores.has(core))continue;const sig=StylistCore.signature(items.map(i=>i.id));if(seen.has(sig))continue;seen.add(sig);const score=net.predict(StylistCore.features(items,ctx));candidates.push({items,score,sig});
  }
  const batch=Date.now(),result=[],cores=new Set(),used={};for(let n=0;n<count&&candidates.length;n++){
   // Every third choice explores underused pieces; feedback never bans a garment.
   const explore=n%3===2;let best=-1,bestScore=-Infinity;
   candidates.forEach((c,k)=>{const core=StylistCore.signature(c.items.filter(i=>['top','bottom','dress','layer'].includes(StylistCore.cat(i))).map(i=>i.id));if(cores.has(core))return;const repeat=c.items.filter(i=>StylistCore.cat(i)!=='shoe').reduce((s,i)=>s+(used[i.id]||0),0);const novelty=c.items.reduce((s,i)=>s+1/(1+(exposure[i.id]||0)),0)/c.items.length;const val=(explore?.22:.8)*c.score+(explore?.78:.2)*novelty-.2*repeat;if(val>bestScore){bestScore=val;best=k;}});
   if(best<0)break;const c=candidates.splice(best,1)[0],ids=c.items.map(i=>i.id);cores.add(StylistCore.signature(c.items.filter(i=>['top','bottom','dress','layer'].includes(StylistCore.cat(i))).map(i=>i.id)));c.items.forEach(i=>{used[i.id]=(used[i.id]||0)+1;exposure[i.id]=(exposure[i.id]||0)+1;});
   const main=c.items.filter(i=>['top','bottom','dress'].includes(StylistCore.cat(i))),l={id:'N'+Date.now().toString(36)+n,pieces:ids,title:main.map(i=>i.name).join(' + '),type:'assembly',neural:true,occasions:[ctx],styleTags:p?[p]:['Personal edit'],personas:p?[p]:[],priority:batch-n,description:`${q||'Everyday'}: ${main.map(i=>i.name).join(' with ')}. ${c.items.filter(i=>['bag','jewel','accessory','shoe'].includes(StylistCore.cat(i))).map(i=>i.name).join(' and ')} finish the look.`,note:`${explore?'Discovery pick: brings less-used pieces into rotation.':'Ranked by your personal neural network.'} ${ctx==='camera'?'Keep jewelry and bag straps clear of your microphone.':ctx==='work'?'Wear the layer open and check that the outfit allows comfortable movement.':'Adjust the tuck and sleeve styling to your comfort.'} Check fit using the original photos.`,footwear:ctx==='dinner'?'Choose an owned dressy flat or sandal; an exact matching shoe is not yet cataloged.':'Your Adidas Samba Doe sneakers, if already comfortable for the day. Check your comfort and hem length before leaving.'};
   result.push(l);
  }
  created.push(...result);wardrobe.looks.push(...result);persist();status();return result;
 }
 const panel=document.createElement('section');panel.className='neural-panel';panel.innerHTML=`<div><p class="eyebrow">YOUR PERSONAL NEURAL STYLIST</p><h3>More of your wardrobe. More possibilities.</h3><p id="neural-status" role="status">Preparing your network…</p></div><form id="neural-form"><label>Event<input id="neural-event" placeholder="Founder video, dinner, weekend…" required maxlength="160"></label><label>Date<input id="neural-date" type="date" required></label><label>Direction<select id="neural-persona"><option value="">Explore my wardrobe</option>${StylistCore.personas.map(p=>`<option>${p}</option>`).join('')}</select></label><button class="button primary">Style & plan my event</button><button type="button" id="neural-explore" class="button secondary">12 fresh looks</button></form><p class="small-note">The stylist puts its first recommendation on your calendar. Rate any look to teach your taste; one in three new picks explores underused pieces.</p><details><summary>How it learns</summary><p>A real 80 → 24 → 1 neural network trains with backpropagation on your existing curated outfits, incomplete-outfit counterexamples, and your 1–5 star ratings. This is a small personal ranking model, not a pretrained fashion expert or a fit simulator. Structure and event rules keep suggestions usable; discovery is kept separate so your closet does not shrink to favorites.</p><p>Ratings, generated looks, calendar and dress-up layouts are stored only in this browser. They do not sync across devices.</p><button type="button" id="export-style">Export my styling data</button></details>`;
 $('#outfits').prepend(panel);
 const localDate=new Date();localDate.setMinutes(localDate.getMinutes()-localDate.getTimezoneOffset());$('#neural-date').value=localDate.toISOString().slice(0,10);
 function showNew(looks){eventQuery='';activePersona='';activeOccasion='';$('#look-type').value='assembly';$('#style-filter').value='';savedLooksOnly=false;lookLimit=16;renderLooks();if(looks[0])window.dispatchEvent(new CustomEvent('stylepro-card-created',{detail:{lookId:looks[0].id}}));}
 $('#neural-form').addEventListener('submit',e=>{e.preventDefault();if(!ready)return;const q=$('#neural-event').value.trim(),date=$('#neural-date').value;if(!q||!date)return;const out=generate(q,$('#neural-persona').value);if(!out.length){toast('No new eligible combinations found for those constraints. Try another direction.');return;}plan(date,q,out[0].id);showNew(out);window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));toast('New looks created. First recommendation added to '+date+'.');});
 $('#neural-explore').addEventListener('click',()=>{if(!ready)return;const out=generate($('#neural-event').value.trim()||'Everyday',$('#neural-persona').value);showNew(out);toast(`${out.length} new combinations created.`);});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-rate-look]');if(!b)return;ratings[b.dataset.rateLook]=Number(b.dataset.stars);persist();train();renderLooks();window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));toast('Rating learned. Discovery stays on.');});
 $('#export-style').addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,ratings,created,events,exposure,doll:localStorage.getItem('trish-doll-v1')},null,2)],{type:'application/json'}));a.download='Trish-styling-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
 const oldRender=renderLooks;renderLooks=function(){oldRender();decorate();};
 function init(){if(ready||!wardrobe)return;created=created.filter(l=>l&&typeof l.id==='string'&&l.id.startsWith('N')&&Array.isArray(l.pieces)&&l.pieces.every(id=>!!itemById(id)));wardrobe.looks.push(...created);ready=true;train();renderLooks();window.dispatchEvent(new CustomEvent('neural-ready'));}
 document.addEventListener('wardrobe-ready',init);if(typeof wardrobe!=='undefined'&&wardrobe)init();
 function plan(date,title,lookId){const list=events[date]||[],old=list.findIndex(e=>e.title===title),entry={...(old>=0?list[old]:{}),title,lookId};if(old>=0)list[old]=entry;else list.push(entry);events[date]=list;persist();window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));}
 window.wardrobeStylist={generate,importEvents(incoming){const result=StyleProCalendarCore.merge(events,incoming),before=events;events=result.events;if(!persist()){events=before;return null;}window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));return result;},updateEvent(date,id,patch){const ev=(events[date]||[]).find(x=>(x.id||x.title)===id);if(!ev)return;const before={...ev};Object.assign(ev,patch);if(!persist()){Object.assign(ev,before);return;}window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));},get events(){return events},get ready(){return ready},plan,remove(date,title){events[date]=(events[date]||[]).filter(e=>(e.id||e.title)!==title);if(!events[date].length)delete events[date];persist();window.dispatchEvent(new CustomEvent('wardrobe-plan-updated'));},getRating:id=>ratings[id]||0,ratingMarkup};
}
