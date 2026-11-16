/* Inspiration compares recorded details. It does not identify photos or prove fit. */
(function(root){
'use strict';
const C=typeof module!=='undefined'?require('./stylepro-core.js'):root.StyleProCore;
const GROUPS={
 shape:[['trench',/\btrench\b/],['moto',/\bmoto(?:rcycle)?\b/],['blazer',/\bblazer\b/],['cardigan',/\bcardigan\b/],['coat',/\bcoat\b/],['jacket',/\bjacket\b/],['dress',/\bdress\b/],['skirt',/\bskirt\b/],['jeans',/\bjeans|denim\b/],['trousers',/\btrousers|pants|bottoms\b/],['blouse',/\bblouse\b/],['shirt',/\bshirt\b/],['tank',/\btank\b/],['tee',/\btee|t-shirt\b/],['knit',/\bknit|sweater\b/],['tote',/\btote\b/],['shoulder bag',/\bshoulder\b/],['crossbody',/\bcrossbody\b/],['satchel',/\bsatchel\b/],['sneakers',/\bsneakers|trainers\b/],['boots',/\bboots\b/],['sandals',/\bsandals\b/],['earrings',/\bearrings|hoops\b/],['bracelet',/\bbracelet|bangle\b/],['necklace',/\bnecklace\b/],['watch',/\bwatch\b/]],
 color:[['black',/\bblack\b/],['white',/\bwhite\b/],['ivory',/\bivory\b/],['cream',/\bcream\b/],['beige',/\bbeige\b/],['brown',/\bbrown\b/],['tan',/\btan\b/],['camel',/\bcamel\b/],['gray',/\bgr[ae]y\b/],['blue',/\bblue\b/],['navy',/\bnavy\b/],['pink',/\bpink\b/],['burgundy',/\bburgundy\b/],['red',/\bred\b/],['green',/\bgreen\b/],['lavender',/\blavender\b/],['purple',/\bpurple\b/],['gold',/\bgold\b/],['silver',/\bsilver\b/],['teal',/\bteal\b/],['rust',/\brust\b/]],
 pattern:[['leopard',/\bleopard\b/],['floral',/\bfloral|flower|petal\b/],['paisley',/\bpaisley\b/],['plaid',/\bplaid|tartan\b/],['stripe',/\bstrip(?:e|ed|es)\b/],['spotted',/\bspotted|polka\b/]],
 cut:[['flared',/\bflare(?:d|s)?\b/],['straight-leg',/\bstraight(?:-leg)?\b/],['wide-leg',/\bwide[- ]leg\b/],['cropped',/\bcropped\b/],['mini',/\bmini(?:-length)?\b/],['maxi',/\bmaxi\b/],['midi',/\bmidi\b/]]
};
function attributes(item){const name=String(item.name||'').toLowerCase();return Object.fromEntries(Object.entries(GROUPS).map(([key,list])=>[key,list.filter(([,re])=>re.test(name)).map(([label])=>label)]));}
function compare(ref,item){
 if(!C.owned(item)||!ref.category||C.role(ref)!==C.role(item))return null;
 if(ref.closetItemId&&String(ref.closetItemId)===String(item.id))return {itemId:item.id,kind:'exact',score:100,shared:[],differences:[]};
 const wanted=attributes(ref),actual=attributes(item),shared=[],differences=[];let score=0,total=0,matched=0;
 for(const group of Object.keys(GROUPS))for(const value of wanted[group]){total++;if(actual[group].includes(value)){matched++;shared.push(value);score+=group==='pattern'?5:group==='shape'?4:3;}else differences.push(actual[group].length?`${value} differs from ${actual[group].join(' / ')}`:`${value} is not recorded`);}
 if(!matched)return null;
 return {itemId:item.id,kind:total===matched?'similar':'near',score:score-(total-matched),shared,differences};
}
function match(references,items,{differentPieces=false}={}){
 const excluded=new Set(differentPieces?references.map(r=>r.closetItemId).filter(Boolean).map(String):[]),used=new Set();
 const slots=references.map((ref,index)=>({ref,index,candidates:items.filter(i=>!excluded.has(String(i.id))).map(i=>compare(ref,i)).filter(Boolean).sort((a,b)=>({exact:3,similar:2,near:1}[b.kind]-{exact:3,similar:2,near:1}[a.kind])||b.score-a.score||String(a.itemId).localeCompare(String(b.itemId)))}));
 const priority=[...slots].sort((a,b)=>Number(b.candidates[0]?.kind==='exact')-Number(a.candidates[0]?.kind==='exact')||a.candidates.length-b.candidates.length||a.index-b.index);
 for(const slot of priority){slot.match=slot.candidates.find(c=>!used.has(c.itemId))||null;if(slot.match)used.add(slot.match.itemId);}
 return slots.map(({ref,index,match})=>({reference:ref,index,match:match||null}));
}
function recordClick(log,lookId,at){const prior=log[lookId];return {...log,[lookId]:{firstAt:prior?.firstAt||at,lastAt:at,clicks:(Number(prior?.clicks)||0)+1}};}
const api={attributes,compare,match,recordClick};if(typeof module!=='undefined')module.exports=api;root.StyleProInspiration=api;
})(typeof window!=='undefined'?window:globalThis);
