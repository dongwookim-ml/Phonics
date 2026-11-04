// Shop actions reuse the ordinary question/reward flow. Only completed math
// orders add to the toy shelf; opening a solution never earns an order.
const MathPlay=(()=>{
  let extras;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const svg=(body,label='')=>`<svg class="math-product" viewBox="0 0 120 100" role="img" aria-label="${esc(label)}">${body}</svg>`;
  function token(type){
    if(type==='scoop')return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 15c0-15 20-15 20 0l-3 4-4-2-4 2-4-2-4 2z" fill="#efb0c1" stroke="#bb879c"/><path d="M7 8q3-4 7-3" fill="none" stroke="#fff2e0" stroke-width="2"/></svg>';
    if(type==='coin')return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#efce87" stroke="#c7a45c"/><circle cx="12" cy="12" r="7" fill="none" stroke="#fff0bb"/><path d="M11 7h2v10h-2z" fill="#ba9656"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#e8b776" stroke="#bc8c5a"/><g fill="#906c62"><circle cx="8" cy="8" r="1.6"/><circle cx="15" cy="7" r="1.4"/><circle cx="12" cy="13" r="1.8"/><circle cx="7" cy="16" r="1.4"/><circle cx="17" cy="16" r="1.5"/></g></svg>';
  }
  function product(shop,n=3){
    if(shop==='icecream'){
      // One scoop per unit, including an honest empty cup when the answer is 0.
      const scoops=Array.from({length:n},(_,i)=>`<circle cx="${36+(i%4)*16}" cy="${57-Math.floor(i/4)*15}" r="11" fill="${['#efb0c1','#b9d5b8','#f3d58f'][i%3]}" stroke="#b19391"/>`).join('');
      return svg(`${scoops}<path d="M29 64h66l-9 29H38z" fill="#b4cfcc" stroke="#8da6a3"/><path d="M36 72h52" stroke="#f7edce" stroke-width="4"/>`,I18n.t('math.product.icecream',n));
    }
    if(shop==='bakery')return svg('<path d="M14 52h92L96 90H25z" fill="#d7ae7c" stroke="#a88361"/><path d="M17 63h86M21 76h78M39 54v33M61 54v36M83 54v35" stroke="#efd1a1" stroke-width="3"/><g fill="#eabf7f" stroke="#b78b58"><ellipse cx="40" cy="44" rx="20" ry="13"/><ellipse cx="76" cy="39" rx="23" ry="16"/></g><path d="M64 30l5 10m5-13l5 10m-47 4l5 8" stroke="#f9dfac" stroke-width="4"/>',I18n.t('math.product.bakery'));
    if(shop==='workshop')return svg('<path d="M17 46L46 17l28 29z" fill="#dba9b8" stroke="#9e8299"/><path d="M22 46h49v42H22z" fill="#ebcb91" stroke="#a9977a"/><rect x="41" y="62" width="15" height="26" fill="#aabed9"/><circle cx="34" cy="55" r="6" fill="#fff3cb"/><rect x="77" y="61" width="32" height="19" rx="3" fill="#9ec8b9"/><path d="M81 61l6-13h14l6 13z" fill="#b9c9e1"/><g fill="#81778a"><circle cx="84" cy="82" r="6"/><circle cx="103" cy="82" r="6"/></g>',I18n.t('math.product.workshop'));
    if(shop==='station')return svg('<path d="M9 78h105" stroke="#ac9e88" stroke-width="5"/><g fill="#e7b8bb" stroke="#a38f99"><rect x="43" y="43" width="30" height="27" rx="5"/><rect x="79" y="43" width="30" height="27" rx="5"/></g><path d="M9 66V31h19v19h10v20H9z" fill="#9ac5b8" stroke="#829e99"/><path d="M4 30h30M16 48v10" stroke="#f4d092" stroke-width="5"/><g fill="#777183"><circle cx="16" cy="72" r="6"/><circle cx="32" cy="72" r="6"/><circle cx="50" cy="72" r="6"/><circle cx="66" cy="72" r="6"/><circle cx="86" cy="72" r="6"/><circle cx="102" cy="72" r="6"/></g>',I18n.t('math.shop.station'));
    return toy(0);
  }
  function toy(i){
    if(i===1)return svg('<g fill="#d6ae81" stroke="#ab8b6d"><circle cx="38" cy="24" r="12"/><circle cx="82" cy="24" r="12"/><ellipse cx="60" cy="65" rx="25" ry="28"/><circle cx="60" cy="39" r="28"/><ellipse cx="36" cy="88" rx="13" ry="9"/><ellipse cx="84" cy="88" rx="13" ry="9"/></g><ellipse cx="60" cy="49" rx="13" ry="10" fill="#f1d9ae"/><g fill="#746674"><circle cx="49" cy="35" r="3"/><circle cx="71" cy="35" r="3"/><ellipse cx="60" cy="44" rx="4" ry="3"/></g>',I18n.t('math.toy.bear'));
    if(i===2)return svg('<path d="M60 7v11" stroke="#a99988" stroke-width="4"/><rect x="31" y="18" width="58" height="37" rx="7" fill="#b3cbdc"/><rect x="38" y="57" width="44" height="29" rx="3" fill="#a9cbbb"/><g fill="#786d88"><circle cx="47" cy="35" r="4"/><circle cx="73" cy="35" r="4"/></g><path d="M50 46h20M26 61v17M94 61v17M47 86v9M73 86v9" stroke="#8fa0ad" stroke-width="6"/><circle cx="60" cy="71" r="6" fill="#f1d092"/>',I18n.t('math.toy.robot'));
    return svg('<path d="M22 54l17-27h40l17 27" fill="#abc6d3" stroke="#869ba5"/><path d="M11 53h98v27H11z" fill="#e4adb8" stroke="#ad899b"/><path d="M42 32h30l12 19H30z" fill="#f7edcf"/><g fill="#786f83"><circle cx="32" cy="82" r="11"/><circle cx="91" cy="82" r="11"/></g><path d="M17 62h13M99 62h7" stroke="#f9d789" stroke-width="5"/>',I18n.t('math.toy.car'));
  }
  function completed(){return Object.entries(state.history||{}).filter(([id,h])=>id.startsWith('math')&&h.completed===1).length;}
  function collection(){
    const n=completed();return `<div class="math-shelf" aria-label="${esc(I18n.t('math.toys.collection'))}">${['car','bear','robot'].map((key,i)=>{
      const need=(i+1)*3,unlocked=n>=need;return `<figure class="${unlocked?'earned':'waiting'}">${toy(i)}<figcaption>${esc(unlocked?I18n.t(`math.toy.${key}`):I18n.t('math.toys.progress',Math.min(n,need),need))}</figcaption></figure>`;
    }).join('')}</div>`;
  }
  function extrasFor(npc){
    if(!extras){extras=document.createElement('div');extras.id='math-extras';extras.className='math-extras';document.getElementById('dlg-text').before(extras);}
    extras.replaceChildren();extras.classList.toggle('hidden',!['station','toys'].includes(npc.mathShop));if(!npc.mathShop)return;
    if(npc.mathShop==='station'){
      const b=document.createElement('button');b.type='button';b.className='math-board';b.textContent=I18n.t('math.ride.board');b.addEventListener('click',()=>{closeDialog();MathTrain.requestRide();});extras.append(b);
    }
    if(npc.mathShop==='toys'){const shelf=document.createElement('div');shelf.className='math-collection';shelf.innerHTML=`<p>${esc(I18n.t('math.toys.explain'))}</p>${collection()}`;extras.append(shelf);}
  }
  function succeed(q){
    if(!q.math||q.reveal)return;
    const h=state.history[q.id];if(h)h.completed=1;
    const shop=mathShopFor(q.entry.topic).key;state.scene.mathOrder={shop,at:performance.now()};
    ui.clue.insertAdjacentHTML('beforeend',`<div class="math-order-done">${product(shop,typeof q.entry.answer==='number'?q.entry.answer:3)}<span>${esc(I18n.t(`math.done.${shop}`))}</span></div>`);
    if(shop==='toys'){const shelf=extras.querySelector('.math-collection');if(shelf)shelf.innerHTML=`<p>${esc(I18n.t('math.toys.explain'))}</p>${collection()}`;}
    if(shop==='station')MathTrain.depart();
  }
  function hide(){extras?.classList.add('hidden');}
  return{extras:extrasFor,succeed,hide,token,product,toy,collection,completed};
})();
