/* Phone behavior that can be checked without a device. */
(function(root){
'use strict';
const COLORS=['black','white','ivory','cream','blue','navy','burgundy','brown','pink','red','green','gold','gray','grey','tan','olive'];
const CATEGORIES=[
 ['dress','Dresses'],
 ['jacket','Jackets & layers'],
 ['coat','Jackets & layers'],
 ['jean','Bottoms'],
 ['pant','Bottoms'],
 ['skirt','Bottoms'],
 ['shoe','Shoes'],
 ['sneaker','Shoes'],
 ['bag','Handbags'],
 ['purse','Handbags'],
 ['earring','Jewelry'],
 ['necklace','Jewelry'],
 ['sweater','Knitwear'],
 ['knit','Knitwear']
];
function weekSlice(looks){
 const list=(looks||[]).filter(look=>look&&look.id);
 return {tomorrow:list[1]||null, week:list.slice(0,7)};
}
function suggestTags(transcript){
 const words=String(transcript||'').toLowerCase();
 const color=COLORS.find(name=>new RegExp('\\b'+name+'\\b').test(words))||'';
 const category=CATEGORIES.find(([word])=>new RegExp('\\b'+word+'\\b').test(words));
 const name=String(transcript||'').replace(/\s+/g,' ').trim().slice(0,80);
 return {name, color, category:category?category[1]:'', sourceWords:words};
}
function glassesFeature(name){
 const shared=['Meta developer account','Organization registered in the Wearables Developer Center','Camera, microphone, and voice-invocation permission review','Paired Ray-Ban Meta or another supported AI glasses pair, or the Mock Device Kit','Wearables Device Access Toolkit linked inside the iOS or Android app'];
 const features={
  'scan-to-closet':{worksOnPhone:true, worksOnGlasses:false, note:'The phone camera can capture a piece, strip the background, and suggest tags. You confirm ownership before it enters My Closet. The glasses camera does not run until the toolkit is linked.'},
  'shopping-second-opinion':{worksOnPhone:false, worksOnGlasses:false, note:'Scaffold only. A live glasses view of a shop piece needs the toolkit and a paired device.'},
  'mirror-check':{worksOnPhone:false, worksOnGlasses:false, note:'Scaffold only. A mirror check needs the glasses camera and a paired device.'},
  'morning-brief-ear':{worksOnPhone:true, worksOnGlasses:false, note:'This phone can read tomorrow’s look aloud. Playing it through the glasses speakers needs the toolkit audio path and a paired device. A morning push needs Apple push and Firebase, which are not connected.'}
 };
 const row=features[name]||{worksOnPhone:false, worksOnGlasses:false, note:'Unknown glasses feature.'};
 return {...row, needs:shared, sdk:'Meta Wearables Device Access Toolkit'};
}
const api={COLORS, weekSlice, suggestTags, glassesFeature};
if(typeof module!=='undefined') module.exports=api;
root.StyleProPhoneCore=api;
})(typeof window!=='undefined'?window:globalThis);
