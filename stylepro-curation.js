/* Digital total driven only by actual eligible item values. Never add a rescan twice. */
(()=>{'use strict';let current=null,lastTarget=null,raf=null,observer=null,lastDelta='',deltaUntil=0,deltaTimer=null;
const paths=['M5 1h22l-4 4H9z','M28 2l3 4v19l-4-3V7z','M27 32l4-3v21l-3 4-1-5z','M9 51h14l4 4H5z','M1 29l4 3v17l-3 5-1-4z','M2 2l3 5v15l-4 3V6z','M6 25h20l4 3-4 3H6l-4-3z'];
const digits=['1111110','0110000','1101101','1111001','0110011','1011011','1011111','1110000','1111111','1111011'];
const money=(v,cents)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:cents?2:0,maximumFractionDigits:cents?2:0}).format(Math.round(v)/100);
function paint(el,value,target){const text=money(value,target%100);el.style.setProperty('--ticker-scale',Math.min(1,7/Math.max(7,text.length)));el.innerHTML='<span class="sp-digital-readout" aria-hidden="true">'+[...text].map(ch=>/\d/.test(ch)?'<svg class="sp-digital-digit" viewBox="0 0 32 56">'+paths.map((p,n)=>'<path d="'+p+'" class="'+(digits[Number(ch)][n]==='1'?'lit':'unlit')+'"/>').join('')+'</svg>':'<span class="sp-digital-symbol '+(ch==='$'?'currency':'separator')+'">'+ch+'</span>').join('')+'</span>';}
window.styleProDigitalTicker={paint};
function render(){const el=document.querySelector('[data-vault-ticker]');if(!el||!window.styleProMVP)return;if(raf){cancelAnimationFrame(raf);raf=null;}
 const hidden=window.styleProMVP.hidden(),s=window.styleProMVP.snapshot(),target=s.worth.totalCents,card=el.closest('.sp-worth-bar'),status=card.querySelector('[data-ticker-status]');
 if(hidden||!s.worth.valued){current=target;lastTarget=target;lastDelta='';deltaUntil=0;el.textContent=hidden?'••••':'Pending';return;}
 if(lastTarget!==null&&lastTarget!==target){const delta=target-lastTarget;lastDelta=(delta>0?'+':'−')+money(Math.abs(delta),Math.abs(delta)%100)+(delta>0?' added':' updated');deltaUntil=Date.now()+8000;if(deltaTimer)clearTimeout(deltaTimer);deltaTimer=setTimeout(()=>{const label=document.querySelector('[data-ticker-status]');if(label){label.textContent='UPDATES AS PIECES ARE VALUED';label.classList.remove('has-delta');}},8000);card.classList.remove('sp-ticker-landed');void card.offsetWidth;card.classList.add('sp-ticker-landed');}
 lastTarget=target;if(status&&Date.now()<deltaUntil){status.textContent=lastDelta;status.classList.add('has-delta');}else if(status){status.classList.remove('has-delta');}
 if(current===null||Math.abs(current-target)<.5||matchMedia('(prefers-reduced-motion: reduce)').matches){current=target;paint(el,target,target);return;}
 const from=current,start=performance.now();const step=t=>{const p=Math.max(0,Math.min(1,(t-start)/1000));current=from+(target-from)*(1-(1-p)**3);paint(el,current,target);if(p<1&&el.isConnected)raf=requestAnimationFrame(step);else{current=target;raf=null;}};raf=requestAnimationFrame(step);
}
window.addEventListener('stylepro-curation-render',()=>{render();if(typeof renderCatalog==='function'&&wardrobe)renderCatalog();});window.addEventListener('stylepro-view',render);document.addEventListener('wardrobe-ready',render);
function observe(){const target=document.querySelector('#stylepro-today');if(target&&!observer){observer=new MutationObserver(render);observer.observe(target,{childList:true});}}observe();document.addEventListener('wardrobe-ready',observe);
})();
