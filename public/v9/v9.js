(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse=matchMedia("(pointer: coarse)").matches;

  function safeExternal(anchor,url){
    if(!anchor||typeof url!=="string"||!url.trim()) return;
    const raw=url.trim();
    if(raw.startsWith("#")){anchor.href=raw;return}
    try{
      const parsed=new URL(raw,location.origin);
      if(!["https:","http:","mailto:","tel:"].includes(parsed.protocol)) return;
      anchor.href=parsed.href;
      if(parsed.protocol==="https:"||parsed.protocol==="http:"){anchor.target="_blank";anchor.rel="noopener noreferrer"}
    }catch{}
  }

  async function loadContent(){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),2200);
    try{
      const response=await fetch("/api/content",{headers:{accept:"application/json"},credentials:"same-origin",signal:controller.signal});
      if(!response.ok) return null;
      const payload=await response.json();
      return payload?.content||null;
    }catch{return null}finally{clearTimeout(timeout)}
  }

  function bindProfile(content){
    const p=content?.profile;
    if(!p) return;
    const values={
      "profile.heroEyebrow":p.heroEyebrow,"profile.firstName":p.firstName,"profile.lastName":p.lastName,
      "profile.heroLede":p.heroLede,"profile.location":p.location,"profile.focus":p.focus,
      "profile.aboutHeading":p.aboutHeading,"profile.aboutIntro":p.aboutIntro
    };
    Object.entries(values).forEach(([key,value])=>{
      if(typeof value!=="string") return;
      qsa(`[data-bind="${key}"]`).forEach(el=>el.textContent=value.trim());
    });
    const cv=qs("#cvLink"); if(cv&&p.cvUrl) safeExternal(cv,p.cvUrl);
    const portrait=qs("#heroPortrait"), fallback=qs("#portraitFallback"), frame=qs("#portraitFrame");
    const url=p.suitImage||p.aboutImage||"";
    if(portrait&&url){
      portrait.onload=()=>{portrait.hidden=false;if(fallback) fallback.hidden=true;if(frame) frame.classList.add("has-image")};
      portrait.onerror=()=>{portrait.hidden=true;if(fallback) fallback.hidden=false};
      portrait.src=url;
    }
  }

  function setupMenu(){
    const button=qs("#menuTrigger"),nav=qs("#primaryNav");
    if(!button||!nav) return;
    const items=()=>qsa("a[href]",nav).filter(el=>!el.hidden);
    const close=(restore=false)=>{
      nav.classList.remove("open");button.setAttribute("aria-expanded","false");document.body.classList.remove("menu-open");
      if(restore) button.focus({preventScroll:true});
    };
    button.addEventListener("click",()=>{
      const opening=button.getAttribute("aria-expanded")!=="true";
      nav.classList.toggle("open",opening);button.setAttribute("aria-expanded",String(opening));document.body.classList.toggle("menu-open",opening);
      if(opening) requestAnimationFrame(()=>items()[0]?.focus({preventScroll:true}));
    });
    qsa("a",nav).forEach(link=>link.addEventListener("click",()=>close(false)));
    document.addEventListener("keydown",event=>{
      if(!nav.classList.contains("open")) return;
      if(event.key==="Escape"){event.preventDefault();close(true);return}
      if(event.key!=="Tab") return;
      const f=items(); if(!f.length) return;
      const first=f[0],last=f[f.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    });
    addEventListener("resize",()=>{if(innerWidth>820) close(false)},{passive:true});
  }

  function setupReveal(){
    const targets=qsa(".project,.photo-preview figure,.timeline article,.capabilities span,.contact-actions a,.gallery-cta");
    if(reduced||!("IntersectionObserver"in window)){targets.forEach(el=>el.classList.add("reveal-in"));return}
    targets.forEach(el=>el.classList.add("reveal-ready"));
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(!entry.isIntersecting)return; entry.target.classList.add("reveal-in");io.unobserve(entry.target)
    }),{threshold:.08,rootMargin:"0px 0px -7% 0px"});
    targets.forEach(el=>io.observe(el));
  }

  function setupSections(){
    const nav=qs("#primaryNav"),sections=qsa("[data-section]");
    if(!nav||!("IntersectionObserver"in window))return;
    const links=qsa('a[href^="#"]',nav);
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(link=>link.toggleAttribute("aria-current",link.getAttribute("href")===`#${visible.target.id}`));
    },{threshold:[.2,.45,.7],rootMargin:"-25% 0px -55% 0px"});
    sections.forEach(section=>io.observe(section));
  }

  function setupProgress(){
    const bar=qs("#progress"); if(!bar)return;
    let frame=0;
    const update=()=>{frame=0;const max=document.documentElement.scrollHeight-innerHeight;const ratio=max>0?scrollY/max:0;bar.style.width=`${Math.max(0,Math.min(1,ratio))*100}%`};
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update)};
    addEventListener("scroll",schedule,{passive:true});addEventListener("resize",schedule,{passive:true});update();
  }

  function setupDepth(){
    if(reduced||coarse)return;
    const stage=qs("#heroStage"); if(!stage)return;
    let frame=0,last=null;
    const render=()=>{frame=0;if(!last)return;const r=stage.getBoundingClientRect();const x=(last.clientX-r.left)/r.width-.5;const y=(last.clientY-r.top)/r.height-.5;stage.style.transform=`perspective(1100px) rotateY(${x*2.6}deg) rotateX(${y*-2}deg)`};
    stage.addEventListener("pointermove",e=>{last=e;if(!frame)frame=requestAnimationFrame(render)});
    stage.addEventListener("pointerleave",()=>{last=null;if(frame)cancelAnimationFrame(frame);frame=0;stage.style.transform=""});
  }

  setupMenu();setupReveal();setupSections();setupProgress();setupDepth();
  loadContent().then(bindProfile);
})();
