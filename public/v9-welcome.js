(() => {
  'use strict';

  const home = location.pathname === '/' || location.pathname.endsWith('/index.html');
  if (!home || document.querySelector('.bd-welcome')) return;

  const params = new URLSearchParams(location.search);
  const force = params.has('intro') || params.get('welcome') === '1';
  let seen = false;
  try { seen = sessionStorage.getItem('bd-welcome-seen') === '1'; } catch { /* optional storage */ }
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
        <div class="bd-welcome-status"><i aria-hidden="true"></i><span>Interactive identity</span><span>V9.1.5 / 2026</span></div>
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
          <div class="bd-welcome-fallback"><canvas class="bd-welcome-fallback-canvas" width="360" height="540"></canvas></div>
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
  const fallbackCanvas = intro.querySelector('.bd-welcome-fallback-canvas');
  fallbackCanvas.style.cssText = 'width:min(72%,520px);height:auto;max-height:92%;display:block;filter:drop-shadow(0 30px 46px rgba(0,0,0,.62));transform:rotateX(var(--wx)) rotateY(var(--wy)) rotate(1.5deg);transform-origin:center 55%;transition:transform .15s ease-out;';

  let disposed = false;
  let disposeWebGL = () => {};

  function closeIntro() {
    if (disposed) return;
    disposed = true;
    try { sessionStorage.setItem('bd-welcome-seen', '1'); } catch { /* optional storage */ }
    intro.classList.add('is-leaving');
    document.documentElement.style.overflow = previousOverflow;
    obscured.forEach(([el, wasInert]) => { el.inert = wasInert; });
    disposeWebGL();
    setTimeout(() => intro.remove(), reduced ? 40 : 680);
    document.querySelector('#main')?.focus({preventScroll:true});
  }

  enter.addEventListener('click', closeIntro);
  skip.addEventListener('click', closeIntro);
  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeIntro();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = [enter, skip].filter(el => !el.disabled && !el.hidden);
    if (!controls.length) return;
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      controls.at(-1).focus();
    } else if (!event.shiftKey && index === controls.length - 1) {
      event.preventDefault();
      controls[0].focus();
    }
  });
  setTimeout(() => enter.focus({preventScroll:true}), 80);

  function pointFromEvent(event) {
    const rect = visual.getBoundingClientRect();
    return {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / Math.max(rect.width, 1) - .5) * 2)),
      y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / Math.max(rect.height, 1) - .5) * 2))
    };
  }

  function fallbackMove(event) {
    if (reduced) return;
    const point = pointFromEvent(event);
    intro.style.setProperty('--wx', (point.y * -6).toFixed(2) + 'deg');
    intro.style.setProperty('--wy', (point.x * 9).toFixed(2) + 'deg');
  }
  visual.addEventListener('pointermove', fallbackMove, {passive:true});
  visual.addEventListener('pointerleave', () => {
    intro.style.setProperty('--wx', '0deg');
    intro.style.setProperty('--wy', '0deg');
  }, {passive:true});

  function paintFallback(source) {
    fallbackCanvas.width = source.naturalWidth || source.width || 360;
    fallbackCanvas.height = source.naturalHeight || source.height || 540;
    const context = fallbackCanvas.getContext('2d', {alpha:true});
    if (!context) throw new Error('Fallback canvas unavailable');
    context.clearRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
    context.drawImage(source, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
    fallbackCanvas.dataset.render = 'static-cutout';
    intro.dataset.subjectSource = 'static-cutout';
    intro.classList.add('bd-welcome-isolated');
  }

  function startWebGL(textureSource) {
    if (reduced || disposed) return;
    const gl = canvas.getContext('webgl', {
      alpha:true,
      antialias:true,
      premultipliedAlpha:true,
      preserveDrawingBuffer:false
    });
    if (!gl) {
      intro.classList.add('bd-welcome-no-webgl');
      return;
    }

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
        float cy=cos(u_ry), sy=sin(u_ry), cx=cos(u_rx), sx=sin(u_rx);
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
        if(tex.a<.01) discard;
        float d=distance(v_uv,u_pointer);
        float glow=smoothstep(.46,0.0,d)*.10;
        vec3 color=tex.rgb*(.94+v_depth*.34)+vec3(1.03,.98,.86)*glow;
        color+=.008*sin((v_uv.y*150.0)+(u_time*.0015));
        gl_FragColor=vec4(color,tex.a);
      }`;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed');
      }
      return shader;
    }

    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Program link failed');
      }
    } catch (error) {
      console.warn('Welcome WebGL fallback:', error);
      intro.classList.add('bd-welcome-no-webgl');
      return;
    }

    const cols = 54;
    const rows = 78;
    const vertexCount = (cols + 1) * (rows + 1);
    const sample = document.createElement('canvas');
    sample.width = cols + 1;
    sample.height = rows + 1;
    const sampleContext = sample.getContext('2d', {willReadFrequently:true});
    sampleContext.drawImage(textureSource, 0, 0, sample.width, sample.height);
    const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    const vertices = new Float32Array(vertexCount * 5);
    let offset = 0;

    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const u = x / cols;
        const v = y / rows;
        const px = (u - .5) * 1.38;
        const py = (.5 - v) * 2.04;
        const index = (y * (cols + 1) + x) * 4;
        const visible = pixels[index + 3] >= 16;
        const luminance = visible ? (pixels[index] * .2126 + pixels[index + 1] * .7152 + pixels[index + 2] * .0722) / 255 : .5;
        const nx = (u - .5) / .52;
        const ny = (v - .46) / .60;
        const radial = Math.max(0, 1 - (nx * nx + ny * ny));
        const head = Math.exp(-((u - .5) * (u - .5) / .08 + (v - .27) * (v - .27) / .10));
        const torso = Math.exp(-((u - .5) * (u - .5) / .22 + (v - .58) * (v - .58) / .26));
        const relief = visible ? (head * .16 + torso * .055 + radial * .024 + (luminance - .5) * .018 * radial) : 0;
        vertices[offset++] = px;
        vertices[offset++] = py;
        vertices[offset++] = relief;
        vertices[offset++] = u;
        vertices[offset++] = v;
      }
    }

    const indices = new Uint16Array(cols * rows * 6);
    offset = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const a = y * (cols + 1) + x;
        const b = a + 1;
        const c = a + cols + 1;
        const d = c + 1;
        indices[offset++] = a;
        indices[offset++] = c;
        indices[offset++] = b;
        indices[offset++] = b;
        indices[offset++] = c;
        indices[offset++] = d;
      }
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.useProgram(program);

    const position = gl.getAttribLocation(program, 'a_position');
    const uv = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureSource);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    const uAspect = gl.getUniformLocation(program, 'u_aspect');
    const uRx = gl.getUniformLocation(program, 'u_rx');
    const uRy = gl.getUniformLocation(program, 'u_ry');
    const uScale = gl.getUniformLocation(program, 'u_scale');
    const uShift = gl.getUniformLocation(program, 'u_shift');
    const uPointer = gl.getUniformLocation(program, 'u_pointer');
    const uTime = gl.getUniformLocation(program, 'u_time');

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let pointerU = .5;
    let pointerV = .42;
    let raf = 0;

    function resize() {
      const rect = visual.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function onMove(event) {
      const point = pointFromEvent(event);
      targetY = point.x * .22;
      targetX = point.y * -.12;
      pointerU = (point.x + 1) / 2;
      pointerV = 1 - ((point.y + 1) / 2);
    }
    function onLeave() {
      targetX = 0;
      targetY = 0;
      pointerU = .5;
      pointerV = .42;
    }

    visual.addEventListener('pointermove', onMove, {passive:true});
    visual.addEventListener('pointerleave', onLeave, {passive:true});
    const observer = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    observer?.observe(visual);
    resize();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    function render(time) {
      raf = 0;
      if (disposed || document.hidden) return;
      currentX += (targetX - currentX) * .075;
      currentY += (targetY - currentY) * .075;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uAspect, Math.max(canvas.width / canvas.height, .65));
      gl.uniform1f(uRx, currentX);
      gl.uniform1f(uRy, currentY);
      gl.uniform1f(uScale, 1.76);
      gl.uniform2f(uShift, .12, -.015);
      gl.uniform2f(uPointer, pointerU, pointerV);
      gl.uniform1f(uTime, time);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      raf = requestAnimationFrame(render);
    }

    const ensureRender = () => {
      if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(render);
    };
    document.addEventListener('visibilitychange', ensureRender);
    intro.classList.add('webgl-ready');
    ensureRender();

    disposeWebGL = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      document.removeEventListener('visibilitychange', ensureRender);
      observer?.disconnect();
      visual.removeEventListener('pointermove', onMove);
      visual.removeEventListener('pointerleave', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }

  const image = new Image();
  image.decoding = 'async';
  image.src = '/assets/v9/portrait-cutout.webp?v=915-user-cutout';
  image.onload = async () => {
    if (disposed) return;
    try { await image.decode?.(); } catch { /* onload is sufficient */ }
    try {
      paintFallback(image);
    } catch (error) {
      console.warn('Welcome portrait fallback failed:', error);
      intro.dataset.subjectSource = 'error';
      intro.classList.add('bd-welcome-no-webgl');
      return;
    }
    if (!reduced) startWebGL(image);
    else intro.classList.add('bd-welcome-no-webgl');
  };
  image.onerror = () => {
    intro.dataset.subjectSource = 'error';
    intro.classList.add('bd-welcome-no-webgl');
  };
})();
