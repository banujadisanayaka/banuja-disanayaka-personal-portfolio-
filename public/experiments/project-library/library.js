// Original portfolio interaction code; ThreeUI-derived CSS layers are separately credited.
(() => {
  const dialog=document.querySelector('.detail');
  const layout=dialog.querySelector('.detail-layout');
  const cards=[...document.querySelectorAll('.book-card')];
  const shelf=document.querySelector('.shelf');
  const close=dialog.querySelector('.close');
  const toggle=document.querySelector('.motion-toggle');
  const previous=document.querySelector('.previous'),next=document.querySelector('.next');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  let motionPreference=true,opener=null,oldOverflow='',openFrame=0,positionFrame=0,index=0;
  try{motionPreference=localStorage.getItem('project-library-motion')!=='off';}catch{}
  const motion=()=>motionPreference&&!reduced.matches&&!forced.matches;
  function updateMotion(){document.documentElement.dataset.motion=motion()?'on':'off';toggle.setAttribute('aria-pressed',String(motion()));toggle.textContent=motion()?'Motion on':'Motion off';}
  updateMotion();toggle.hidden=false;
  toggle.addEventListener('click',()=>{motionPreference=!motion();try{localStorage.setItem('project-library-motion',motionPreference?'on':'off');}catch{}updateMotion();});
  reduced.addEventListener('change',updateMotion);forced.addEventListener('change',updateMotion);
  function cleanClose(){cancelAnimationFrame(openFrame);dialog.classList.remove('is-open');document.documentElement.style.overflow=oldOverflow;opener?.focus({preventScroll:true});}
  if(typeof dialog.showModal==='function'){
    cards.forEach(card=>{
      card.setAttribute('aria-haspopup','dialog');
      card.addEventListener('click',event=>{
        if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();if(dialog.open)return;
        opener=card;layout.replaceChildren(document.querySelector(`#project-${card.dataset.book}`).content.cloneNode(true));
        oldOverflow=document.documentElement.style.overflow;
        dialog.showModal();document.documentElement.style.overflow='hidden';dialog.scrollTop=0;close.focus({preventScroll:true});
        openFrame=requestAnimationFrame(()=>{openFrame=requestAnimationFrame(()=>{if(dialog.open)dialog.classList.add('is-open');});});
      });
    });
    function closeProject(){dialog.close();cleanClose();}
    close.addEventListener('click',closeProject);
    dialog.addEventListener('cancel',event=>{event.preventDefault();closeProject();});
    dialog.addEventListener('close',()=>{if(!dialog.open)cleanClose();});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject();});
    // Wrap Tab explicitly, including the browser-chrome focus boundary.
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const stops=[...dialog.querySelectorAll('button,a[href],summary')].filter(el=>!el.disabled&&el.getClientRects().length);
      const first=stops[0],last=stops.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    // Native dialog supplies Escape handling and an inert background.
  }
  function updatePosition(){
    positionFrame=0;
    const center=shelf.getBoundingClientRect().left+shelf.clientWidth/2;
    let distance=Infinity;
    cards.forEach((card,i)=>{const r=card.getBoundingClientRect();const d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;index=i;}});
    document.querySelector('.shelf-position').textContent=`0${index+1} / 05`;
    previous.disabled=index===0;next.disabled=index===cards.length-1;
  }
  function moveTo(i){const card=cards[Math.max(0,Math.min(cards.length-1,i))];const r=card.parentElement.getBoundingClientRect(),s=shelf.getBoundingClientRect();shelf.scrollTo({left:shelf.scrollLeft+r.left-s.left-(shelf.clientWidth-r.width)/2,behavior:motion()?'smooth':'instant'});}
  previous.addEventListener('click',()=>moveTo(index-1));next.addEventListener('click',()=>moveTo(index+1));
  shelf.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();let i=cards.indexOf(document.activeElement);if(i<0)i=index;i=event.key==='Home'?0:event.key==='End'?cards.length-1:i+(event.key==='ArrowRight'?1:-1);i=Math.max(0,Math.min(cards.length-1,i));cards[i].focus({preventScroll:true});moveTo(i);});
  const queuePosition=()=>{if(!positionFrame)positionFrame=requestAnimationFrame(updatePosition);};
  shelf.addEventListener('scroll',queuePosition,{passive:true});window.addEventListener('resize',queuePosition,{passive:true});
  document.querySelector('.shelf-controls').hidden=false;updatePosition();
})();
