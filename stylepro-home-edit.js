/* Home carousel: distinct looks from the whole owned closet, not three repeats. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const B=typeof module!=='undefined'?require('./stylepro-outfit-builder.js'):root.StyleProOutfitBuilder;
function colorOf(item){
 const blob=`${item?.name||''} ${item?.description||''} ${item?.styleTags||''}`.toLowerCase();
 return ['burgundy','navy','black','ivory','cream','white','pink','blue','brown','red','olive','lavender','champagne','gold','gray','tan','cognac','chartreuse','coral','rust'].find(name=>blob.includes(name))||'';
}
function statementScore(item){
 const blob=`${item?.name||''} ${item?.brand||''} ${item?.description||''}`.toLowerCase();
 let score=0;
 if(/chanel|prada|gucci|louis|ysl|saint laurent|armani|theory|mackie|vintage|handmade|crystal|embroider|barbie/.test(blob)) score+=3;
 if(C.role(item)==='layer'||C.role(item)==='bag'||C.role(item)==='jewelry') score+=1;
 if(/cap|baseball/.test(blob)) score-=2;
 return score;
}
function eligibleCurated(items, looks){
 const byId=new Map(items.map(item=>[item.id, item]));
 return (looks||[]).filter(look=>{
  if(!look||look.neural||look.type!=='assembly'||!Array.isArray(look.pieces)) return false;
  if(!look.pieces.every(id=>C.owned(byId.get(id)))) return false;
  const roles=look.pieces.map(id=>C.role(byId.get(id)||{}));
  return roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom'));
 });
}
function mainIds(pieces, byId){
 return pieces.filter(id=>['top','bottom','dress'].includes(C.role(byId.get(id)||{})));
}
function audit(items, looks){
 const owned=(items||[]).filter(C.owned);
 const curated=eligibleCurated(items, looks);
 const inCurated=new Set(curated.flatMap(look=>look.pieces));
 const unconfirmed=(items||[]).filter(item=>!C.owned(item));
 const never=owned.filter(item=>!inCurated.has(item.id));
 const byRole={};
 for(const item of never){const role=C.role(item); (byRole[role]=byRole[role]||[]).push(item.id);}
 return {
  records:(items||[]).length,
  owned:owned.length,
  unconfirmed:unconfirmed.map(item=>item.id),
  usableBefore:inCurated.size,
  neverInACuratedLook:never.length,
  neverByRole:byRole,
  usableAfter:owned.length,
  whyUnconfirmed:'Ownership is unconfirmed, so these records stay out of looks.'
 };
}
function blocked(item, preferences){
 if(!item) return true;
 if((preferences?.excludedItemIds||[]).includes(item.id)) return true;
 if(preferences?.neverKhaki&&B.khakiItem(item)) return true;
 if((preferences?.avoidTerms||[]).some(term=>term&&`${item.name} ${item.description||''}`.toLowerCase().includes(String(term).toLowerCase()))) return true;
 return false;
}
function edit(input){
 const items=input.items||[], looks=input.looks||[], preferences=input.preferences||{};
 const byId=new Map(items.map(item=>[item.id, item]));
 const pool=items.filter(item=>C.owned(item)&&!blocked(item, preferences));
 const tops=pool.filter(item=>C.role(item)==='top').sort((a,b)=>a.id.localeCompare(b.id));
 const bottoms=pool.filter(item=>C.role(item)==='bottom').sort((a,b)=>a.id.localeCompare(b.id));
 const dresses=pool.filter(item=>C.role(item)==='dress').sort((a,b)=>a.id.localeCompare(b.id));
 const statements=pool.filter(item=>['layer','bag','jewelry'].includes(C.role(item))).sort((a,b)=>statementScore(b)-statementScore(a)||a.id.localeCompare(b.id));
 const curated=eligibleCurated(items, looks).filter(look=>look.pieces.every(id=>!blocked(byId.get(id), preferences)));
 const usedTop=new Set(), usedBottom=new Set(), usedDress=new Set(), usedStatement=new Set(), usedMain=new Set();
 const out=[];
 function push(look){
  const ids=[...new Set(look.pieces)].filter(id=>byId.has(id)&&!blocked(byId.get(id), preferences));
  const roles=ids.map(id=>C.role(byId.get(id)));
  if(!(roles.includes('dress')||(roles.includes('top')&&roles.includes('bottom')))) return false;
  const top=ids.find(id=>C.role(byId.get(id))==='top');
  const bottom=ids.find(id=>C.role(byId.get(id))==='bottom');
  const dress=ids.find(id=>C.role(byId.get(id))==='dress');
  if(top&&usedTop.has(top)) return false;
  if(bottom&&usedBottom.has(bottom)) return false;
  if(dress&&usedDress.has(dress)) return false;
  const main=C.signature(mainIds(ids, byId));
  if(usedMain.has(main)) return false;
  if(top) usedTop.add(top);
  if(bottom) usedBottom.add(bottom);
  if(dress) usedDress.add(dress);
  usedMain.add(main);
  const pieces=ids.map(id=>byId.get(id));
  const names=pieces.map(item=>item.name);
  out.push({
   id:look.id, title:look.title||names.slice(0,3).join(' · '), description:names.join(' · '),
   pieces:ids, type:'assembly', neural:false, occasions:look.occasions||[], personas:look.personas||[],
   source:look.source||'home-edit'
  });
  return true;
 }
 function freshTop(bottom){
  const bottomColor=colorOf(bottom);
  const unusedFirst=tops.filter(item=>!usedTop.has(item.id));
  const ranked=unusedFirst.sort((a,b)=>{
   const ac=colorOf(a)===bottomColor?1:0, bc=colorOf(b)===bottomColor?1:0;
   return ac-bc||statementScore(b)-statementScore(a)||a.id.localeCompare(b.id);
  });
  return ranked[0]||null;
 }
 function freshStatement(){
  return statements.find(item=>!usedStatement.has(item.id))||null;
 }
 for(const bottom of bottoms){
  const options=curated.filter(look=>look.pieces.includes(bottom.id));
  options.sort((a,b)=>{
   const score=look=>look.pieces.reduce((sum,id)=>sum+(byId.get(id)?statementScore(byId.get(id)):0),0);
   return score(b)-score(a)||a.id.localeCompare(b.id);
  });
  let placed=false;
  for(const look of options) if(push({...look, source:'curated'})) {placed=true; break;}
  if(placed) continue;
  const top=freshTop(bottom);
  if(!top) continue;
  const extra=freshStatement();
  const ids=[top.id, bottom.id].concat(extra?[extra.id]:[]);
  if(extra) usedStatement.add(extra.id);
  const title=`${top.name} · ${bottom.name}`;
  push({id:'home:'+C.signature(ids), title, pieces:ids, source:'composed'});
 }
 for(const dress of dresses){
  const options=curated.filter(look=>look.pieces.includes(dress.id));
  let placed=false;
  for(const look of options) if(push({...look, source:'curated'})) {placed=true; break;}
  if(placed) continue;
  const extra=freshStatement();
  const ids=[dress.id].concat(extra?[extra.id]:[]);
  if(extra) usedStatement.add(extra.id);
  push({id:'home:'+C.signature(ids), title:dress.name, pieces:ids, source:'composed'});
 }
 for(const look of out){
  if(look.pieces.some(id=>C.role(byId.get(id))==='bag')) continue;
  const bag=statements.find(item=>C.role(item)==='bag'&&!usedStatement.has(item.id)&&!look.pieces.includes(item.id));
  if(!bag) continue;
  look.pieces=look.pieces.concat(bag.id);
  look.description=(look.description?look.description+' · ':'')+bag.name;
  usedStatement.add(bag.id);
 }
 const limit=Math.max(20, input.limit||24);
 const offset=((Number(input.offset)||0)%Math.max(1,out.length)+out.length)%Math.max(1,out.length);
 const rotated=out.slice(offset).concat(out.slice(0, offset));
 const selected=rotated.slice(0, Math.min(limit, rotated.length));
 const covered=new Set(selected.flatMap(look=>look.pieces));
 return {looks:selected, count:selected.length, covered:[...covered], audit:{...audit(items, looks), shown:selected.length, piecesInHome:covered.size}};
}
const api={audit, edit, colorOf, statementScore};
if(typeof module!=='undefined') module.exports=api;
root.StyleProHomeEdit=api;
})(typeof window!=='undefined'?window:globalThis);
