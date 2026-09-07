(() => {
  'use strict';
  const home = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!home || document.querySelector('.bd-welcome')) return;

  const params = new URLSearchParams(location.search);
  const force = params.has('intro') || params.get('welcome') === '1';
  let seen = false;
  try { seen = sessionStorage.getItem('bd-welcome-seen') === '1'; } catch { /* Optional storage. */ }
  if (seen && !force) return;
  if (navigator.webdriver && !force) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(forced-colors: active)').matches;
  const intro = document.createElement('section');
  intro.className = 'bd-welcome';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-modal', 'true');
  intro.setAttribute('aria-labelledby', 'bd-welcome-title');
  intro.innerHTML = `
    <div class="bd-welcome-shell">
      <div class="bd-welcome-top">
        <div class="bd-welcome-mark"><img src="/assets/v9/banuja-logo-gold.webp" width="42" height="42" alt=""><span>Banuja Disanayaka<br>Portfolio</span></div>
        <div class="bd-welcome-status"><i aria-hidden="true"></i><span>Interactive identity</span><span>V9.1.3 / 2026</span></div>
      </div>
      <div class="bd-welcome-stage">
        <div class="bd-welcome-copy">
          <p class="bd-welcome-index">A multidimensional practice</p>
          <div id="bd-welcome-title" class="bd-welcome-title"><span>Banuja</span><span>Disanayaka.</span></div>
          <p class="bd-welcome-lede">Operations, product, design and photography — connected by one habit: paying attention closely enough to build something useful.</p>
          <div class="bd-welcome-actions">
            <button class="bd-welcome-enter" type="button">Enter portfolio <span aria-hidden="true">↘</span></button>
            <button class="bd-welcome-skip" type="button">Skip introduction</button>
          </div>
        </div>
        <div class="bd-welcome-visual" aria-hidden="true">
          <canvas class="bd-welcome-canvas"></canvas>
          <div class="bd-welcome-fallback"><img width="960" height="1442" alt=""></div>
          <div class="bd-welcome-visual-label"><span>Move / touch to rotate</span><strong>Depth portrait / BD</strong></div>
        </div>
      </div>
      <div class="bd-welcome-bottom">
        <div class="bd-welcome-hint"><span aria-hidden="true"></span><b>${reduced ? 'Static experience' : 'Pointer-reactive WebGL relief'}</b></div>
        <div class="bd-welcome-progress" aria-hidden="true"><i></i></div>
        <span>Sri Lanka · Systems / Design / Image</span>
      </div>
    </div>`;

  document.body.prepend(intro);
  const obscured = [...document.body.children].filter(el => el !== intro).map(el => [el, el.inert]);
  obscured.forEach(([el]) => { el.inert = true; });
  const previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  const enter = intro.querySelector('.bd-welcome-enter');
  const skip = intro.querySelector('.bd-welcome-skip');
  const visual = intro.querySelector('.bd-welcome-visual');
  const canvas = intro.querySelector('.bd-welcome-canvas');
  const fallbackImage = intro.querySelector('.bd-welcome-fallback img');
  let disposed = false;
  let disposeWebGL = () => {};

  function closeIntro() {
    if (disposed) return;
    disposed = true;
    try { sessionStorage.setItem('bd-welcome-seen', '1'); } catch { /* Optional storage. */ }
    intro.classList.add('is-leaving');
    document.documentElement.style.overflow = previousOverflow;
    obscured.forEach(([el, wasInert]) => { el.inert = wasInert; });
    disposeWebGL();
    setTimeout(() => intro.remove(), reduced ? 40 : 680);
    document.querySelector('#main')?.focus({preventScroll:true});
  }

  enter.addEventListener('click', closeIntro);
  skip.addEventListener('click', closeIntro);
  intro.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeIntro(); return; }
    if (e.key === 'Tab') {
      const controls = [enter, skip].filter(el => !el.disabled && !el.hidden);
      if (!controls.length) return;
      const index = controls.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) { e.preventDefault(); controls.at(-1).focus(); }
      else if (!e.shiftKey && index === controls.length - 1) { e.preventDefault(); controls[0].focus(); }
    }
  });
  setTimeout(() => enter.focus({preventScroll:true}), 80);

  function pointFromEvent(event) {
    const r = visual.getBoundingClientRect();
    return {
      x: Math.max(-1, Math.min(1, ((event.clientX - r.left) / Math.max(r.width,1) - .5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - r.top) / Math.max(r.height,1) - .5) * 2))
    };
  }
  function fallbackMove(event) {
    if (reduced) return;
    const p = pointFromEvent(event);
    intro.style.setProperty('--wx', (p.y * -6).toFixed(2) + 'deg');
    intro.style.setProperty('--wy', (p.x * 9).toFixed(2) + 'deg');
  }
  visual.addEventListener('pointermove', fallbackMove, {passive:true});
  visual.addEventListener('pointerleave', () => {
    intro.style.setProperty('--wx','0deg'); intro.style.setProperty('--wy','0deg');
  }, {passive:true});

  function isolatePortrait(source) {
    const naturalWidth = source.naturalWidth || 960;
    const naturalHeight = source.naturalHeight || 1442;
    const width = Math.min(720, naturalWidth);
    const height = Math.max(1, Math.round(naturalHeight * width / naturalWidth));
    const isolated = document.createElement('canvas');
    isolated.width = width;
    isolated.height = height;
    const ctx = isolated.getContext('2d', {willReadFrequently:true});
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.drawImage(source, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;
    const count = width * height;
    const candidates = new Uint8Array(count);
    const background = new Uint8Array(count);
    const queue = new Int32Array(count);

    for (let p = 0; p < count; p++) {
      const i = p * 4;
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const hi = Math.max(r,g,b), lo = Math.min(r,g,b);
      const chroma = hi - lo;
      const luminance = r * .2126 + g * .7152 + b * .0722;
      if ((luminance > .24 && chroma < .13) || (luminance > .58 && chroma < .22) || luminance > .92) candidates[p] = 1;
    }

    let head = 0, tail = 0;
    const enqueue = p => {
      if (p < 0 || p >= count || background[p] || !candidates[p]) return;
      background[p] = 1;
      queue[tail++] = p;
    };
    for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
    for (let y = 1; y < height - 1; y++) { enqueue(y * width); enqueue(y * width + width - 1); }

    while (head < tail) {
      const p = queue[head++];
      const x = p % width;
      if (x > 0) enqueue(p - 1);
      if (x < width - 1) enqueue(p + 1);
      if (p >= width) enqueue(p - width);
      if (p < count - width) enqueue(p + width);
    }

    const removedRatio = tail / count;
    if (removedRatio < .35 || removedRatio > .94) throw new Error(`Unexpected portrait matte ratio ${removedRatio.toFixed(3)}`);

    for (let p = 0; p < count; p++) {
      const i = p * 4;
      if (background[p]) {
        data[i + 3] = 0;
        continue;
      }
      const x = p % width;
      const touchesBackground =
        (x > 0 && background[p - 1]) ||
        (x < width - 1 && background[p + 1]) ||
        (p >= width && background[p - width]) ||
        (p < count - width && background[p + width]);
      if (touchesBackground) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const hi = Math.max(r,g,b), lo = Math.min(r,g,b);
        const chroma = hi - lo;
        const luminance = r * .2126 + g * .7152 + b * .0722;
        data[i + 3] = luminance > .58 && chroma < .18 ? 72 : 205;
      }
    }

    ctx.putImageData(frame, 0, 0);
    intro.dataset.subjectIsolation = 'ready';
    intro.dataset.subjectIsolationRatio = removedRatio.toFixed(3);
    intro.classList.add('bd-welcome-isolated');
    return isolated;
  }

  function startWebGL(textureSource, depthSource) {
    if (reduced || disposed) return;
    const gl = canvas.getContext('webgl', {alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:false});
    if (!gl) { intro.classList.add('bd-welcome-no-webgl'); return; }

    const vertexSource = `
      attribute vec3 a_position;
      attribute vec2 a_uv;
      uniform float u_aspect;
      uniform float u_rx;
      uniform float u_ry;
      uniform float u_scale;
      uniform vec2 u_shift;
      varying vec2 v_uv;
      varying float v_depth;
      void main(){
        vec3 p=a_position;
        float cy=cos(u_ry), sy=sin(u_ry);
        float cx=cos(u_rx), sx=sin(u_rx);
        p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
        p=vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);
        float perspective=1.28/(2.25-p.z);
        vec2 projected=vec2((p.x*perspective/u_aspect)+u_shift.x,(p.y*perspective)+u_shift.y)*u_scale;
        gl_Position=vec4(projected,clamp(p.z*.18,-.9,.9),1.0);
        v_uv=a_uv;
        v_depth=a_position.z;
      }`;
    const fragmentSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec2 u_pointer;
      uniform float u_time;
      varying vec2 v_uv;
      varying float v_depth;
      void main(){
        vec4 tex=texture2D(u_image,v_uv);
        float d=distance(v_uv,u_pointer);
        float glow=smoothstep(.46,0.0,d)*.12;
        float edge=smoothstep(.03,.13,v_uv.x)*smoothstep(.03,.13,1.0-v_uv.x)*smoothstep(.02,.12,v_uv.y)*smoothstep(.02,.12,1.0-v_uv.y);
        vec3 warm=vec3(1.03,.98,.86);
        vec3 color=tex.rgb*(.92+v_depth*.46)+warm*glow;
        float scan=.012*sin((v_uv.y*150.0)+(u_time*.0015));
        color+=scan;
        gl_FragColor=vec4(color,tex.a*edge);
      }`;

    function shader(type, source) {
      const s = gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'Shader compile failed');
      return s;
    }

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program,shader(gl.VERTEX_SHADER,vertexSource));
      gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
    } catch (error) {
      console.warn('Welcome WebGL fallback:', error);
      intro.classList.add('bd-welcome-no-webgl');
      return;
    }

    const cols=54, rows=78, vertexCount=(cols+1)*(rows+1);
    const sample=document.createElement('canvas'); sample.width=cols+1; sample.height=rows+1;
    const sctx=sample.getContext('2d',{willReadFrequently:true});
    sctx.drawImage(depthSource,0,0,sample.width,sample.height);
    const pixels=sctx.getImageData(0,0,sample.width,sample.height).data;
    const vertices=new Float32Array(vertexCount*5);
    let o=0;
    for(let y=0;y<=rows;y++) for(let x=0;x<=cols;x++){
      const u=x/cols, v=y/rows;
      const px=(u-.5)*1.38, py=(.5-v)*2.04;
      const i=(y*(cols+1)+x)*4;
      const lum=pixels[i+3] < 16 ? .5 : (pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
      const nx=(u-.5)/.52, ny=(v-.46)/.6;
      const radial=Math.max(0,1-(nx*nx+ny*ny));
      const headShape=Math.exp(-((u-.5)*(u-.5)/.08 + (v-.31)*(v-.31)/.11));
      const torso=Math.exp(-((u-.5)*(u-.5)/.22 + (v-.72)*(v-.72)/.23));
      const relief=(headShape*.18+torso*.055+radial*.028)+(lum-.5)*.025*radial;
      vertices[o++]=px; vertices[o++]=py; vertices[o++]=relief; vertices[o++]=u; vertices[o++]=v;
    }
    const indices=new Uint16Array(cols*rows*6); o=0;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+1,c=a+(cols+1),d=c+1;
      indices[o++]=a;indices[o++]=c;indices[o++]=b;indices[o++]=b;indices[o++]=c;indices[o++]=d;
    }
    const vb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,vb); gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
    const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    gl.useProgram(program);
    const pos=gl.getAttribLocation(program,'a_position'), uv=gl.getAttribLocation(program,'a_uv');
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos,3,gl.FLOAT,false,20,0);
    gl.enableVertexAttribArray(uv); gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
    const tex=gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,textureSource);
    gl.uniform1i(gl.getUniformLocation(program,'u_image'),0);
    const uAspect=gl.getUniformLocation(program,'u_aspect'),uRx=gl.getUniformLocation(program,'u_rx'),uRy=gl.getUniformLocation(program,'u_ry'),uScale=gl.getUniformLocation(program,'u_scale'),uShift=gl.getUniformLocation(program,'u_shift'),uPointer=gl.getUniformLocation(program,'u_pointer'),uTime=gl.getUniformLocation(program,'u_time');
    let targetX=0,targetY=0,currentX=0,currentY=0,pointerU=.5,pointerV=.42,raf=0;
    function resize(){
      const r=visual.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75);
      const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    }
    function onMove(event){
      const p=pointFromEvent(event); targetY=p.x*.22; targetX=p.y*-.12;
      pointerU=(p.x+1)/2; pointerV=1-((p.y+1)/2);
    }
    function onLeave(){targetX=0;targetY=0;pointerU=.5;pointerV=.42;}
    visual.addEventListener('pointermove',onMove,{passive:true}); visual.addEventListener('pointerleave',onLeave,{passive:true});
    const ro='ResizeObserver' in window?new ResizeObserver(resize):null; ro?.observe(visual); resize();
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0,0,0,0);
    function render(time){
      raf=0;
      if(disposed||document.hidden)return;
      currentX+=(targetX-currentX)*.075; currentY+=(targetY-currentY)*.075;
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.useProgram(program);
      gl.uniform1f(uAspect,Math.max(canvas.width/canvas.height,.65));
      gl.uniform1f(uRx,currentX); gl.uniform1f(uRy,currentY); gl.uniform1f(uScale,1.76);
      gl.uniform2f(uShift,.12,-.015); gl.uniform2f(uPointer,pointerU,pointerV); gl.uniform1f(uTime,time);
      gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      raf=requestAnimationFrame(render);
    }
    const ensureRender=()=>{if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(render)};
    document.addEventListener('visibilitychange',ensureRender);
    intro.classList.add('webgl-ready');
    ensureRender();
    disposeWebGL=()=>{cancelAnimationFrame(raf);raf=0;document.removeEventListener('visibilitychange',ensureRender);ro?.disconnect();visual.removeEventListener('pointermove',onMove);visual.removeEventListener('pointerleave',onLeave);gl.getExtension('WEBGL_lose_context')?.loseContext();};
  }

  const image = new Image();
  image.decoding = 'async';
  image.src = '/assets/v9/portrait-960.webp';
  image.onload = async () => {
    if (disposed) return;
    try { await image.decode?.(); } catch { /* Loaded is sufficient. */ }
    let isolated;
    try {
      isolated = isolatePortrait(image);
      fallbackImage.src = isolated.toDataURL('image/png');
    } catch (error) {
      console.warn('Welcome subject isolation fallback:', error);
      intro.dataset.subjectIsolation = 'fallback';
      fallbackImage.src = image.src;
      intro.classList.add('bd-welcome-isolation-fallback');
    }
    if (reduced) return;
    startWebGL(isolated || image, isolated || image);
  };
  image.onerror = () => {
    fallbackImage.src = '/assets/v9/portrait-960.webp';
    intro.dataset.subjectIsolation = 'error';
    intro.classList.add('bd-welcome-no-webgl','bd-welcome-isolation-fallback');
  };
})();