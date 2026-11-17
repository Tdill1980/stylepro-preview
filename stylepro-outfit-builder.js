/* One outfit builder for Surprise Me and calendar occasions. Curated looks only. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const BUILDER='stylepro-outfit-builder';
function khakiItem(item){
 const n=`${item?.name||''} ${item?.description||''}`.toLowerCase();
 return /khaki/.test(n)||/beige mini skirt/.test(n)||(/wrinkl/.test(n)&&/skirt/.test(n));
}
function khakiRule(preferences){
 if(!preferences) return false;
 if(preferences.neverKhaki) return true;
 return (preferences.avoidTerms||[]).some(term=>/khaki/i.test(String(term)));
}
function applyRules(items, preferences){
 const prefs={...(preferences||{}), excludedItemIds:[...((preferences||{}).excludedItemIds||[])], avoidTerms:[...((preferences||{}).avoidTerms||[])]};
 if(!khakiRule(prefs)) return prefs;
 for(const item of items||[]){
  if(khakiItem(item)&&!prefs.excludedItemIds.includes(item.id)) prefs.excludedItemIds.push(item.id);
 }
 prefs.neverKhaki=true;
 return prefs;
}
function mainPieces(look, items){
 const byId=new Map((items||[]).map(item=>[item.id, item]));
 return (look?.pieces||[]).filter(id=>['top','bottom','dress'].includes(C.role(byId.get(id)||{})));
}
function mainSignature(look, items){return C.signature(mainPieces(look, items));}
function build(input){
 const preferences=applyRules(input.items, input.preferences);
 const result=C.run({...input, preferences});
 return {...result, builder:BUILDER};
}
function surprise(input){
 const preferences=applyRules(input.items, input.preferences);
 const blocked=new Set(input.previousMains||[]);
 let seed=Number(input.seed)||0;
 const found=[], mains=[];
 const limit=Math.max(1, input.limit||1);
 for(let n=0;n<80&&found.length<limit;n++, seed++){
  const batch=C.run({...input, q:'', preferences, seed, limit:24, avoidRepeats:input.avoidRepeats!==false});
  for(const look of batch.looks){
   const main=mainSignature(look, input.items);
   if(!main||blocked.has(main)||mains.includes(main)) continue;
   found.push(look);
   mains.push(main);
   blocked.add(main);
   if(found.length>=limit) break;
  }
 }
 return {looks:found, mains, seed, trace:[{node:'surprise', mains, event:false}], context:'', builder:BUILDER};
}
const api={BUILDER, khakiItem, khakiRule, applyRules, mainPieces, mainSignature, build, surprise};
if(typeof module!=='undefined') module.exports=api;
root.StyleProOutfitBuilder=api;
})(typeof window!=='undefined'?window:globalThis);
