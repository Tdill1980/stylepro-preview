/* Ratings become taste signals. Pure, local, no network. */
(function(root){'use strict';
const STARS={1:-2,2:-1,3:0,4:1,5:2};
const WORDS={love:5,like:4,meh:3,'not me':1,'not-me':1,hate:1};
function starsOf(input){
 if(input&&input.hate) return 1;
 if(typeof input==='string'&&Object.hasOwn(WORDS,input.toLowerCase())) return WORDS[input.toLowerCase()];
 const n=Number(input&&input.stars!=null?input.stars:input);
 if(!Number.isInteger(n)||n<1||n>5) throw Error('Choose 1 to 5 stars.');
 return n;
}
function attributesOf(item){
 const blob=`${item?.name||''} ${item?.description||''} ${item?.styleTags||''} ${item?.category||''}`.toLowerCase();
 const color=['khaki','black','pink','navy','burgundy','champagne','lavender','cream','ivory','beige','gold','green','brown','rust','red','white','blue'].find(c=>blob.includes(c))||'';
 const material=['leather','denim','silk','cotton','velvet','satin','linen','suede','knit'].find(m=>blob.includes(m))||'';
 const silhouette=['bootcut','flared','flare','cropped','blazer','mini','skirt','hoodie','wide'].find(s=>blob.includes(s))||'';
 const pattern=['paisley','leopard','floral','striped','stripe','plaid','quilt','camo'].find(p=>blob.includes(p))||'solid';
 const formality=/blazer|satin|silk|cocktail|evening|heel/.test(blob)?'dressy':/sneaker|hoodie|tee|t-shirt|mini|casual/.test(blob)?'casual':'easy';
 const out={color_family:color,silhouette,material,formality,pattern,category:item?.category||''};
 if(item?.brand&&!/unconfirmed|not confirmed|maker/i.test(item.brand)){
  out.brand=item.brand;
  out.brand_level=/chanel|prada|gucci|ysl|saint laurent|louis vuitton|armani|theory/i.test(item.brand)?'luxury':'everyday';
 }
 return out;
}
function dislikedCasual(item){
 const n=`${item?.name||''} ${item?.description||''}`.toLowerCase();
 return /khaki/.test(n)||/beige mini skirt/.test(n)||(/wrinkl/.test(n)&&/skirt/.test(n));
}
function signalsFromStars(item,stars){
 const weight=STARS[stars];
 return Object.entries(attributesOf(item)).filter(([,v])=>v).map(([attribute,value])=>({attribute,value:String(value),weight,itemId:item.id,stars}));
}
function blank(){return {version:1,ratings:[],signals:[],excludedItemIds:[],excludedSignatures:[],boostItemIds:[],weights:{}};}
function applyRate(profile,input){
 const stars=starsOf(input),base=profile&&profile.version===1?profile:blank();
 const items=input.items||(input.item?[input.item]:[]);
 const signals=items.flatMap(item=>item&&item.id?signalsFromStars(item,stars):[]);
 const id=input.id||input.item?.id||'';
 const signature=input.signature||(items.length?[...new Set(items.map(i=>i.id))].sort().join('|'):'');
 const excluded=new Set(base.excludedItemIds||[]),boost=new Set(base.boostItemIds||[]),bannedLooks=new Set(base.excludedSignatures||[]);
 if(input.type==='item'&&id){
  if(stars===1){excluded.add(id);boost.delete(id);}
  else if(stars>=4){boost.add(id);excluded.delete(id);}
  else {excluded.delete(id);boost.delete(id);}
 }
 if(input.type==='look'&&signature){
  if(stars===1) bannedLooks.add(signature);
  else bannedLooks.delete(signature);
  if(stars===1) items.forEach(item=>{if(dislikedCasual(item)) excluded.add(item.id);});
  if(stars>=4) items.forEach(item=>{if(item?.id) boost.add(item.id);});
 }
 const weights={...(base.weights||{})};
 for(const s of signals){const k=s.attribute+':'+s.value;weights[k]=(weights[k]||0)+s.weight;}
 const ratings=[...(base.ratings||[]),{type:input.type||'item',id:id||signature,stars,hate:!!input.hate,slot:input.slot||'',at:input.at||''}];
 return {version:1,ratings,signals:[...(base.signals||[]),...signals],excludedItemIds:[...excluded],excludedSignatures:[...bannedLooks],boostItemIds:[...boost],weights,slots:base.slots||{},acknowledgment:'Learning from your rating'};
}
function rate(profile,input){
 const next=applyRate(profile,input);
 if(input.slot){
  const prev=profile?.slots?.[input.slot]||blank();
  next.slots={...(profile?.slots||{}),[input.slot]:applyRate(prev,input)};
 }
 return next;
}
function rankingPrefs(profile){
 const p=profile&&profile.version===1?profile:blank();
 return {excludedItemIds:[...p.excludedItemIds],boostItemIds:[...p.boostItemIds],excludedSignatures:[...p.excludedSignatures],weights:{...p.weights}};
}
const api={STARS,starsOf,attributesOf,dislikedCasual,signalsFromStars,blank,rate,rankingPrefs};
if(typeof module!=='undefined') module.exports=api;
root.StyleProTaste=api;
})(typeof window!=='undefined'?window:globalThis);
