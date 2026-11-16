/* Whole-closet valuation DAG. Pure local computation over reviewed evidence. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const M=typeof module!=='undefined'?require('./stylepro-mvp-core.js'):root.StyleProMvpCore;
const V=typeof module!=='undefined'?require('./stylepro-valuation-core.js'):root.StyleProValuation;
const nodes=[
 {id:'owned-inventory',deps:[]},
 {id:'item-valuations',deps:['owned-inventory']},
 {id:'effective-values',deps:['item-valuations']},
 {id:'coverage',deps:['owned-inventory','item-valuations','effective-values']},
 {id:'closet-total',deps:['owned-inventory','effective-values']},
 {id:'curation-output',deps:['coverage','closet-total']}
];
function run({items,research={},savedValues={},asOf}){
 const result=V.execute(nodes,{items,research,savedValues,asOf},{
  'owned-inventory':({items})=>[...new Map(items.filter(C.owned).map(i=>[i.id,i])).values()],
  'item-valuations':({research,asOf},o)=>V.batch(o['owned-inventory'],research,asOf),
  'effective-values':({savedValues},o)=>M.currentValues(o['owned-inventory'],savedValues,o['item-valuations']),
  coverage:({research},o)=>o['owned-inventory'].map(i=>{
   const v=o['effective-values'][i.id],r=o['item-valuations'][i.id];
   const status=M.validValue(v)?'valued':v?.mode==='none'?'excluded-by-owner':Object.hasOwn(savedValues,i.id)&&savedValues[i.id]?.mode==='unvalued'?'awaiting-owner-review':i.category==='Jewelry'&&research[i.id]?.identityConfirmed!==true?'awaiting-identification':'awaiting-comps';
   return {id:i.id,name:i.name,brand:i.brand,category:i.category,status,amountCents:M.validValue(v)?v.amountCents:null,basis:M.validValue(v)?v.source:null,compUrls:r.outputs.resale?.compUrls||[],nodes:r.trace};
  }),
  'closet-total':(_,o)=>M.total(o['owned-inventory'],o['effective-values']),
  'curation-output':({asOf},o)=>({asOf,currency:'USD',status:o['closet-total'].unvalued?'partial':'complete',worth:o['closet-total'],items:o.coverage,evidenceMode:'reviewed-snapshots',externalRequests:0})
 });
 result.trace=result.trace.map(t=>({...t,status:['coverage','closet-total','curation-output'].includes(t.node)&&result.outputs['closet-total'].unvalued?'partial':t.status}));
 return result;
}
const api={nodes,run};if(typeof module!=='undefined')module.exports=api;root.StyleProClosetDag=api;
})(typeof window!=='undefined'?window:globalThis);
