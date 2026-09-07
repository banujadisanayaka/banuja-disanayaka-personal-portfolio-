const section=document.querySelector('#welcome');
if(section) {
  const stage=section.querySelector('.welcome-stage');
  const entry=section.querySelector('[data-enter]');
  const replay=document.querySelector('[data-replay-welcome]');
  const loadButton=section.querySelector('[data-load-avatar]');
  const status=section.querySelector('#welcome-status');
  const portfolio=document.querySelector('#portfolio');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const forced=matchMedia('(forced-colors: active)');
  let scene=null,pending=null,closed=false;
  const motion=()=>!reduced.matches&&!forced.matches&&document.documentElement.dataset.motion!=='off';
  const allowed=()=>!closed&&!section.hidden;
  let seen=false;try{seen=sessionStorage.getItem('bd-welcome')==='entered';}catch{}
  if(location.hash!=='#welcome'&&(location.hash||seen)){section.hidden=true;closed=true;}
  replay.hidden=false;

  function fallback(){scene=null;stage.removeAttribute('data-ready');section.dataset.state='fallback';loadButton.hidden=false;stage.tabIndex=-1;section.querySelector('.avatar-controls').hidden=true;status.textContent='The portrait is ready. You can enter the portfolio at any time.';}
  async function load(){
    if(scene||pending||!allowed()||forced.matches)return;
    section.dataset.state='loading';loadButton.hidden=true;
    status.textContent='Preparing your 3D welcome. The portfolio is ready to enter.';
    pending=import('./scene.js');
    try{const {mountScene}=await pending;if(!allowed()||forced.matches)return;
      scene=mountScene(stage,{motion,onError:fallback});
      stage.tabIndex=0;section.dataset.state='ready';section.querySelector('.avatar-controls').hidden=false;
      status.textContent='Drag to turn. Use the arrows for another perspective.';
    }catch{if(allowed())fallback();}finally{pending=null;}
  }
  function enter(e){
    e?.preventDefault();closed=true;section.hidden=true;scene?.dispose();scene=null;
    try{sessionStorage.setItem('bd-welcome','entered');}catch{}
    history.replaceState(null,'','#portfolio');portfolio.scrollIntoView({behavior:'instant',block:'start'});portfolio.focus({preventScroll:true});
  }
  section.querySelectorAll('[data-enter]').forEach(link=>link.addEventListener('click',enter));
  document.querySelector('.skip')?.addEventListener('click',e=>{if(allowed())enter(e);});
  replay.addEventListener('click',()=>{
    closed=false;section.hidden=false;stage.removeAttribute('data-ready');section.querySelector('.avatar-controls').hidden=true;
    history.replaceState(null,'','#welcome');section.scrollIntoView({behavior:'instant',block:'start'});entry.focus({preventScroll:true});
    if(!forced.matches)load();else fallback();
  });
  loadButton.addEventListener('click',load);
  function preferences(){scene?.setMotion();if(forced.matches){scene?.dispose();fallback();loadButton.hidden=true;}else if(!scene&&allowed()&&!pending){loadButton.hidden=false;}}
  reduced.addEventListener('change',preferences);forced.addEventListener('change',preferences);
  const preferenceObserver=new MutationObserver(preferences);preferenceObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});
  window.addEventListener('pagehide',()=>{scene?.dispose();scene=null;stage.removeAttribute('data-ready');section.querySelector('.avatar-controls').hidden=true;stage.tabIndex=-1;loadButton.hidden=forced.matches;});
  window.addEventListener('pageshow',e=>{if(e.persisted&&allowed()){if(motion())load();else{section.dataset.state='poster';status.textContent='Welcome, at your pace. Enter below or explore the 3D portrait.';}}});
  if(allowed()){
    if(motion()&&!navigator.connection?.saveData)load();
    else{section.dataset.state='poster';loadButton.hidden=forced.matches;status.textContent='Welcome, at your pace. Enter below or explore the 3D portrait.';}
  }
}
