/* Rules-based closet scan. Filename and typed notes only. No model, no invented price. */
(function(root){'use strict';
const COLORS=['burgundy','champagne','lavender','black','white','ivory','cream','beige','brown','coral','navy','olive','gold','silver','grey','gray','pink','blue','green','red','tan','purple','orange','yellow'];
const CATEGORIES=[
 {id:'Handbags',words:['handbag','satchel','clutch','purse','tote','flap','bag']},
 {id:'Shoes',words:['sneaker','sandal','loafer','boot','heel','flat','shoe','samba']},
 {id:'Jewelry',words:['necklace','earring','bracelet','jewelry','jewel','ring']},
 {id:'Dresses',words:['dress','gown']},
 {id:'Knitwear',words:['cardigan','sweater','hoodie','knit']},
 {id:'Jackets & layers',words:['jacket','blazer','trench','coat']},
 {id:'Bottoms',words:['trouser','jean','skirt','short','pant']},
 {id:'Accessories',words:['sunglasses','scarf','belt','hat']},
 {id:'Tops & vests',words:['blouse','shirt','vest','cami','tank','tee','top']}
];
function tokens(text){return String(text||'').toLowerCase().replace(/[_\-.]+/g,' ').replace(/[^a-z0-9&+ ]+/g,' ');}
function hasWord(text,word){const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[^a-z0-9])'+escaped+'(?:$|[^a-z0-9])').test(text);}
function titleFrom(filename){
 const base=String(filename||'').replace(/\.[a-z0-9]+$/i,'').replace(/[_\-.]+/g,' ').replace(/\s+/g,' ').trim();
 if(!base||/^img\s*\d+$/i.test(base)||/^\d+$/.test(base)) return '';
 return base.replace(/\b[a-z]/g,c=>c.toUpperCase());
}
function guess(filename,note,brands){
 const text=tokens(filename+' '+(note||''));
 const color=COLORS.find(c=>hasWord(text,c))||'';
 const category=CATEGORIES.find(row=>row.words.some(w=>hasWord(text,w)))?.id||'';
 const known=(brands||[]).filter(b=>b&&String(b).trim().length>=3).sort((a,b)=>b.length-a.length);
 const brand=known.find(b=>hasWord(text,tokens(b).trim()))||'';
 return {name:titleFrom(filename),color,category,brand,source:'filename'};
}
function readPrice(raw){
 const s=String(raw??'').trim();
 if(!s) return {cents:null,pending:true};
 if(!/^\d{1,7}(\.\d{1,2})?$/.test(s)||Number(s)<=0) return {error:'Enter a dollar estimate, or leave it blank. A blank price stays pending.'};
 return {cents:Math.round(Number(s)*100),pending:false};
}
function interpret({name,note,brands,hash,knownHashes,estimate,category,brand,color}){
 const tags=guess(name,note,brands);
 if(category) tags.category=category;
 if(brand!==undefined) tags.brand=brand;
 if(color!==undefined) tags.color=color;
 const price=readPrice(estimate);
 if(price.error) return {ok:false,error:price.error,tags};
 if(hash&&(knownHashes||[]).includes(hash)) return {ok:true,action:'already-saved',tags,priceCents:null,pending:true};
 return {ok:true,action:'add',tags,priceCents:price.cents,pending:price.pending};
}
const api={COLORS,CATEGORIES,guess,readPrice,interpret,titleFrom};
if(typeof module!=='undefined') module.exports=api;
root.StyleProScan=api;
})(typeof window!=='undefined'?window:globalThis);
