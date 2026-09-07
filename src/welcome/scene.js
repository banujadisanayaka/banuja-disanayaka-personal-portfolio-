import * as T from 'three';
import {createAvatar} from './avatar.js';

export function mountScene(stage, {motion, onError}) {
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.setClearColor(0x000000,0);
  const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');stage.append(canvas);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.1,30);
  const model=createAvatar();scene.add(model.root);
  const hemisphere=new T.HemisphereLight('#dce9f4','#353b2d',2.2);scene.add(hemisphere);
  const key=new T.DirectionalLight('#fff0da',3.1);key.position.set(-3,4,5);scene.add(key);
  const fill=new T.DirectionalLight('#9fbdd8',2.1);fill.position.set(3,2,3);scene.add(fill);
  const rim=new T.DirectionalLight('#e9c38a',3.4);rim.position.set(1,3,-3);scene.add(rim);
  const plinth=new T.Mesh(new T.CylinderGeometry(.71,.74,.09,80),new T.MeshStandardMaterial({color:'#404b42',roughness:.57,metalness:.25}));
  plinth.position.y=-.045;scene.add(plinth);
  const ring=new T.Mesh(new T.TorusGeometry(.72,.008,8,100),new T.MeshStandardMaterial({color:'#d2b478',roughness:.3,metalness:.6}));ring.rotation.x=Math.PI/2;ring.position.y=.003;scene.add(ring);
  const shadow=new T.Mesh(new T.CircleGeometry(.35,48),new T.MeshBasicMaterial({color:'#080e0c',transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,.003,.06);shadow.scale.set(1.2,.6,1);scene.add(shadow);
  const orbit=new T.Mesh(new T.TorusGeometry(1.04,.003,6,120,Math.PI*1.48),new T.MeshBasicMaterial({color:'#c6af79',transparent:true,opacity:.38}));orbit.position.set(0,1.15,-.18);orbit.rotation.set(.15,.24,.36);scene.add(orbit);

  let rotation=-.18,target=-.18,tilt=0,targetTilt=0,look=0,targetLook=0;
  let frame=0,visible=true,disposed=false,waveStart=0,last=0,pointer=null,dragged=false;
  const cleanup=[];const listen=(el,event,fn,options)=>{el.addEventListener(event,fn,options);cleanup.push(()=>el.removeEventListener(event,fn,options));};
  const hint=document.querySelector('#welcome-status');
  const degrees=()=>Math.round(((rotation*180/Math.PI)%360+360)%360);
  function render(time) {
    frame=0;if(disposed||!visible||document.hidden)return;
    const dt=last?Math.min((time-last)/1000,.05):1/60;last=time;
    const ease=motion()?1-Math.exp(-dt*12):1;
    rotation+=(target-rotation)*ease;tilt+=(targetTilt-tilt)*ease;look+=(targetLook-look)*ease;
    model.root.rotation.set(tilt,rotation,0);
    model.head.rotation.y=look*.13;model.pupils.forEach(p=>p.position.x=Math.sign(p.position.x)*.084+look*.008);
    let waving=false;
    if(waveStart){
      const t=(time-waveStart)/1000;
      if(t<2.25&&motion()){
        const ramp=Math.min(1,t/.42)*Math.min(1,(2.25-t)/.45);
        model.greeting.upper.rotation.z=-.13-ramp*2.16;
        model.greeting.elbow.rotation.x=-.15-ramp*.28;
        model.greeting.hand.rotation.z=ramp*Math.sin(t*15)*.22;waving=true;
      }else resetWave();
    }
    renderer.render(scene,camera);
    stage.dataset.rotation=String(degrees());stage.dataset.wave=String(waving);
    if(waving||Math.abs(target-rotation)>.0005||Math.abs(targetTilt-tilt)>.0005||Math.abs(targetLook-look)>.0005)invalidate();
  }
  function resetWave(){waveStart=0;model.greeting.upper.rotation.z=-.13;model.greeting.elbow.rotation.x=-.15;model.greeting.hand.rotation.z=0;}
  function invalidate(){if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;const distance=Math.max(4.4,2.9/camera.aspect);camera.position.set(0,1.29,distance);camera.lookAt(0,1.1,0);camera.updateProjectionMatrix();invalidate();}
  const observer=new ResizeObserver(resize);observer.observe(stage);
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;invalidate();}else{cancelAnimationFrame(frame);frame=0;resetWave();}},{threshold:.03});visibility.observe(stage);
  listen(stage,'pointerdown',e=>{if(!e.isPrimary||e.button>0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,angle:target,tilt:targetTilt};dragged=false;stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');},{passive:true});
  listen(stage,'pointermove',e=>{
    if(pointer&&pointer.id===e.pointerId){const dx=e.clientX-pointer.x;const dy=e.clientY-pointer.y;if(Math.abs(dx)>5)dragged=true;target=pointer.angle+dx*.009;if(e.pointerType==='mouse')targetTilt=T.MathUtils.clamp(pointer.tilt+dy*.002,-.12,.12);targetLook=0;invalidate();}
    else if(e.pointerType==='mouse'&&motion()){const r=stage.getBoundingClientRect();targetLook=T.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);invalidate();}
  },{passive:true});
  const release=()=>{pointer=null;stage.classList.remove('is-dragging');if(hint&&dragged)hint.textContent='A different angle. The same curious mind.';};
  listen(stage,'pointerup',release,{passive:true});listen(stage,'pointercancel',release,{passive:true});
  listen(stage,'pointerleave',()=>{if(!pointer){targetLook=0;invalidate();}},{passive:true});
  function turn(delta){target+=delta;invalidate();if(hint)hint.textContent='Drag to explore, or use the rotation buttons.';}
  function reset(){target=-.18;targetTilt=0;targetLook=0;resetWave();invalidate();if(hint)hint.textContent='Back to the beginning. Make yourself at home.';}
  listen(stage,'keydown',e=>{if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')reset();else turn(e.key==='ArrowLeft'?-.4:.4);}});
  const section=stage.closest('.welcome');
  listen(section.querySelector('[data-turn="left"]'),'click',()=>turn(-Math.PI/6));
  listen(section.querySelector('[data-turn="right"]'),'click',()=>turn(Math.PI/6));
  listen(section.querySelector('[data-reset]'),'click',reset);
  listen(section.querySelector('[data-wave]'),'click',()=>{
    if(hint)hint.textContent='Hello! I’m Banu. Welcome to my corner of the internet.';
    target=-.18;targetTilt=0;waveStart=motion()?performance.now():0;invalidate();
  });
  listen(section.querySelector('[data-light]'),'click',e=>{
    const cool=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(cool));
    key.color.set(cool?'#c8e3ff':'#fff0da');rim.color.set(cool?'#80cbd5':'#e9c38a');section.dataset.light=cool?'cool':'warm';invalidate();
  });
  listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;resetWave();}else{last=0;invalidate();}});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();dispose();onError();});
  function setMotion(){if(!motion()){rotation=target;tilt=targetTilt;look=targetLook=0;resetWave();}invalidate();}
  function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();visibility.disconnect();cleanup.forEach(fn=>fn());const geos=new Set(),mats=new Set();scene.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material)mats.add(o.material);});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());renderer.dispose();canvas.remove();}
  resize();renderer.render(scene,camera);stage.dataset.ready='true';
  return {dispose,setMotion,reset};
}
