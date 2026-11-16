/* Outfits built around pieces she picked. Owned closet only. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const T=typeof module!=='undefined'?require('./stylepro-taste-core.js'):root.StyleProTaste;
const ENERGIES=[
 {id:'founder',name:'Founder Energy'},
 {id:'gallery',name:'Gallery'},
 {id:'speaking',name:'Polished speaking'},
 {id:'wraptvworld',name:'Wraptvworld'},
 {id:'play-date',name:'Play date'}
];
function score(item,energyId,taste){
 let s=0;
 if(T.dislikedCasual(item)) s-=12;
 if((taste?.excludedItemIds||[]).includes(item.id)) s-=50;
 if((taste?.boostItemIds||[]).includes(item.id)) s+=8;
 const blob=`${item.name||''} ${item.description||''} ${item.brand||''}`.toLowerCase();
 if(energyId==='founder'&&/black/.test(blob)) s+=1.4;
 if((energyId==='founder'||energyId==='gallery'||energyId==='speaking')&&/chanel|prada|gucci|louis vuitton|armani/.test(blob)) s+=3;
 if(energyId==='gallery'&&/satin|blazer|silk|champagne|quilt/.test(blob)) s+=1.3;
 if(energyId==='wraptvworld'&&/pink|print|logo|wrap/.test(blob)) s+=1.6;
 if(energyId==='play-date'&&/sneaker|samba|jean|tee|knit/.test(blob)) s+=1.2;
 if((energyId==='play-date'||taste?.avoidHeels)&&/heel|stiletto|pump/.test(blob)) s-=6;
 if(energyId==='speaking'&&/blazer|silk|satin|black/.test(blob)) s+=1.6;
 const full=`${blob} ${item.styleTags||''}`.toLowerCase();
 for(const tag of taste?.preferredTags||[]) if(tag&&full.includes(String(tag).toLowerCase())) s+=1.1;
 for(const brand of taste?.preferredBrands||[]) if(brand&&full.includes(String(brand).toLowerCase())) s+=2;
 for(const term of taste?.avoidTerms||[]) if(term&&full.includes(String(term).toLowerCase())) s-=8;
 return s;
}
function complete(items){
 const roles=items.map(C.role);
 return roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom'));
}
function styleAround(items,looks,anchorIds,taste){
 const byId=new Map((items||[]).filter(i=>i&&i.id).map(i=>[i.id,i]));
 const anchors=[...new Set(anchorIds||[])].map(id=>byId.get(id)).filter(i=>i&&C.owned(i));
 if(!anchors.length) return [];
 const anchorSet=new Set(anchors.map(i=>i.id));
 const excluded=new Set(taste?.excludedItemIds||[]);
 anchorSet.forEach(id=>excluded.delete(id));
 const banned=new Set(taste?.excludedSignatures||[]);
 const owned=(items||[]).filter(C.owned);
 const seen=new Set();
 const out=[];
 function push(look){
  const ids=[...new Set(look.pieces)].filter(id=>byId.has(id)&&C.owned(byId.get(id)));
  if(![...anchorSet].every(id=>ids.includes(id))) return;
  const pieces=ids.map(id=>byId.get(id));
  if(!complete(pieces)) return;
  const signature=C.signature(ids);
  if(seen.has(signature)||banned.has(signature)) return;
  const flagged=pieces.some(i=>!anchorSet.has(i.id)&&T.dislikedCasual(i));
  seen.add(signature);
  out.push({id:look.id,title:look.title,pieces:ids,source:look.source,energyId:look.energyId||'',signature,flagged});
 }
 const catalog=(looks||[]).filter(l=>l&&!l.neural&&Array.isArray(l.pieces)&&l.pieces.length&&[...anchorSet].every(id=>l.pieces.includes(id))&&l.pieces.every(id=>byId.get(id)&&C.owned(byId.get(id))));
 catalog.sort((a,b)=>{
  const pen=l=>l.pieces.some(id=>!anchorSet.has(id)&&T.dislikedCasual(byId.get(id)))?1:0;
  return pen(a)-pen(b)||String(a.id).localeCompare(String(b.id));
 });
 for(const l of catalog){if(out.length>=5) break; push({id:l.id,title:l.title,pieces:l.pieces,source:'catalog'});}
 for(const energy of ENERGIES){
  if(out.length>=5) break;
  const pieces=anchors.slice();
  const roles=new Set(pieces.map(C.role));
  const pool=owned.filter(i=>{if(anchorSet.has(i.id)||excluded.has(i.id)||T.dislikedCasual(i)) return false; if(taste?.avoidHeels&&/heel|stiletto|pump/.test(`${i.name||''} ${i.description||''}`.toLowerCase())) return false; return true;});
  const take=role=>{
   if(roles.has(role)) return;
   if(roles.has('dress')&&(role==='top'||role==='bottom')) return;
   if((roles.has('top')||roles.has('bottom'))&&role==='dress') return;
   const choice=pool.filter(i=>C.role(i)===role&&!pieces.some(p=>p.id===i.id)).sort((a,b)=>score(b,energy.id,taste)-score(a,energy.id,taste)||a.id.localeCompare(b.id))[0];
   if(!choice) return;
   pieces.push(choice); roles.add(role);
  };
  if(!(roles.has('dress')||(roles.has('top')&&roles.has('bottom')))){
   take('dress');
   if(!roles.has('dress')){take('top'); take('bottom');}
  }
  take('layer'); take('bag'); take('shoe');
  push({id:'styled:'+energy.id+':'+C.signature(pieces.map(i=>i.id)),title:energy.name,pieces:pieces.map(i=>i.id),source:'composed',energyId:energy.id});
 }
 const clean=out.filter(l=>!l.flagged);
 return (clean.length>=3?clean:out).slice(0,5).map(({flagged,...look})=>look);
}
const api={styleAround,ENERGIES};
if(typeof module!=='undefined') module.exports=api;
root.StyleProStyleThis=api;
})(typeof window!=='undefined'?window:globalThis);
