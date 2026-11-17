/* Should I Buy? Duplicate and outfit checks. No price is invented. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const COLORS=['black','white','navy','blue','red','burgundy','brown','pink','cream','gold','green','gray','grey'];
function colorOf(item){
 const blob=`${item?.name||''} ${item?.color||''}`.toLowerCase();
 return COLORS.find(name=>blob.includes(name))||'';
}
function roleOf(item){
 if(item?.role) return item.role;
 return C.role(item||{});
}
function assess(candidate, items, looks){
 const owned=(items||[]).filter(C.owned);
 const byId=new Map(owned.map(item=>[item.id, item]));
 const color=colorOf(candidate);
 const role=roleOf(candidate);
 const similar=owned.filter(item=>roleOf(item)===role&&color&&colorOf(item)===color);
 const complement=role==='top'||role==='layer'?'bottom':role==='bottom'?'top':role==='dress'?'shoe':'top';
 const partners=owned.filter(item=>roleOf(item)===complement);
 const paired=new Set();
 for(const look of looks||[]){
  const pieces=(look.pieces||[]).map(id=>byId.get(id)).filter(Boolean);
  if(!pieces.some(item=>roleOf(item)===role&&colorOf(item)===color)) continue;
  pieces.filter(item=>roleOf(item)===complement).forEach(item=>paired.add(item.id));
 }
 const unlocks=partners.filter(item=>!paired.has(item.id));
 const price=Number(candidate.priceCents);
 const hasPrice=Number.isSafeInteger(price)&&price>0;
 const wears=Math.max(unlocks.length, 1);
 const costPerWear=hasPrice?Math.round(price/wears):null;
 let verdict='Skip';
 if(similar.length>=2) verdict='You already own this';
 else if(similar.length===0&&unlocks.length>=3) verdict='Buy';
 const saved=verdict==='Buy'||!hasPrice?0:price;
 const label=verdict==='You already own this'?'Already own':verdict;
 return {
  color, role, label,
  similar:similar.map(item=>({id:item.id, name:item.name, image:item.image||''})),
  unlocks:unlocks.length, costPerWear, verdict, savedCents:saved, hasPrice,
  spoken:`You own ${similar.length} similar ${color||'unspecified'} ${role}${role==='top'?'s':''}. ${unlocks.length} owned pieces could make a new pairing. ${hasPrice?`About $${(costPerWear/100).toFixed(2)} per wear if you wear each new pairing once.`:'Add a price to estimate cost per wear.'}`
 };
}
const api={colorOf, roleOf, assess};
if(typeof module!=='undefined') module.exports=api;
root.StyleProBuyCore=api;
})(typeof window!=='undefined'?window:globalThis);
