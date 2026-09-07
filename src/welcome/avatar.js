import * as T from 'three';

// An illustrated likeness, hand-built from the owner's approved navy-suit portrait.
// These are real closed meshes, with a complete back and sides, not a photo plane.
export function createAvatar() {
  const root = new T.Group(); root.name = 'Banuja — illustrated studio portrait';
  const m = {};
  for (const [name,color,roughness,metalness] of [
    ['skin','#aa6e50',.72,0],['ear','#91543f',.85,0],['lip','#834737',.8,0],
    ['hair','#111719',.86,0],['beard','#242024',.9,0],['suit','#17263c',.74,.04],
    ['lapel','#23364d',.6,.06],['seam','#35475b',.8,0],['shirt','#f6f0df',.78,0],
    ['tie','#122236',.5,.07],['shoe','#121a22',.3,.17],['sole','#090f13',.84,0],
    ['eye','#f6e5cc',.36,0],['iris','#332720',.42,0],['pupil','#101519',.3,0],
    ['gold','#c8ab74',.3,.65]
  ]) m[name] = new T.MeshStandardMaterial({name,color,roughness,metalness});
  const sphere = new T.SphereGeometry(1,32,24);
  const smallSphere = new T.SphereGeometry(1,12,8);
  function ellipsoid(name,material,p,s,parent=root,geo=sphere) {
    const mesh = new T.Mesh(geo,m[material]); mesh.name=name;
    mesh.position.set(...p); mesh.scale.set(...s); mesh.castShadow=true; mesh.receiveShadow=true;
    parent.add(mesh); return mesh;
  }
  function tube(name,points,r,material,parent=root) {
    const curve = new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const mesh = new T.Mesh(new T.TubeGeometry(curve,20,r,8,false),m[material]);
    mesh.name=name; parent.add(mesh); return mesh;
  }
  function patch(name,points,depth,material,parent=root) {
    const shape = new T.Shape(); points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y)); shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.008,bevelThickness:.004});
    const mesh=new T.Mesh(geo,m[material]); mesh.name=name; mesh.position.z=depth; parent.add(mesh); return mesh;
  }
  // Elliptic rings provide a tailored waist, shoulders and hem rather than intersecting spheres.
  function tailored(name,rings,material,parent=root,segments=48) {
    const positions=[],indices=[];
    rings.forEach(([y,rx,rz,cx=0,cz=0])=>{
      for(let j=0;j<=segments;j++){const a=j/segments*Math.PI*2;positions.push(cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz);}
    });
    for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
      const a=i*(segments+1)+j,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new T.Mesh(geo,m[material]);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  // Trousers are subtly asymmetric, grounded in the easy stance of the source photograph.
  for(const side of [-1,1]) {
    const x=side*.165;
    tailored(`${side<0?'Right':'Left'} trouser leg`,[[.12,.001,.001,x],[.16,.115,.12,x],[.32,.12,.13,x],[.60,.132,.14,x-side*.014],[.86,.15,.15,x-side*.025],[.98,.135,.13,x-side*.015],[1.01,.001,.001,x]],'suit');
    const shoe=ellipsoid('Polished derby shoe','shoe',[x,.091,.074],[.125,.092,.225]);
    shoe.rotation.y=side*.075;
    ellipsoid('Shoe sole','sole',[x,.034,.07],[.13,.032,.227]);
    for(let i=0;i<3;i++)tube('Leather lacing',[[x-.052,.156-i*.013,.08+i*.035],[x,.17-i*.011,.10+i*.035],[x+.052,.156-i*.013,.08+i*.035]],.0038,'seam');
    tube('Trouser pressed crease',[[x,.25,.117],[x,.52,.134],[x-side*.014,.83,.149]],.0025,'seam');
  }
  tailored('Tailored two-button navy jacket',[[.83,.001,.001],[.85,.265,.153],[.91,.30,.175],[1.03,.282,.173],[1.20,.277,.164],[1.36,.315,.17],[1.48,.355,.151],[1.54,.295,.125],[1.59,.15,.09],[1.60,.001,.001]],'suit');
  ellipsoid('Neck','skin',[0,1.60,0],[.114,.17,.102]);
  patch('Ivory shirt front',[[-.12,1.58],[-.19,1.44],[0,1.09],[.18,1.44],[.12,1.58]],.166,'shirt');
  patch('Left notched lapel',[[-.135,1.59],[-.282,1.49],[-.22,1.405],[-.265,1.405],[0,1.08],[-.095,1.43]],.186,'lapel');
  patch('Right notched lapel',[[.135,1.59],[.282,1.49],[.22,1.405],[.265,1.405],[.014,1.08],[.095,1.43]],.192,'lapel');
  patch('Left shirt collar',[[-.12,1.60],[0,1.535],[-.065,1.445],[-.145,1.555]],.205,'shirt');
  patch('Right shirt collar',[[.12,1.60],[0,1.535],[.065,1.445],[.145,1.555]],.205,'shirt');
  patch('Tie blade',[[-.024,1.495],[-.043,1.24],[0,1.172],[.043,1.24],[.024,1.495]],.216,'tie');
  ellipsoid('Tie knot','tie',[0,1.507,.227],[.031,.035,.018]);
  for(const y of [1.095,.955])ellipsoid('Jacket button','sole',[.035,y,.191],[.016,.016,.009]);
  tube('Breast welt pocket',[[.155,1.35,.168],[.248,1.357,.141]],.006,'seam');
  tube('Left pocket welt',[[-.258,1.00,.144],[-.165,1.022,.166]],.006,'seam');
  tube('Right pocket welt',[[.165,1.022,.166],[.258,1.00,.144]],.006,'seam');
  ellipsoid('Gold lapel pin','gold',[-.194,1.43,.221],[.012,.012,.007]);
  tube('Rear jacket seam',[[0,.9,-.168],[0,1.18,-.169],[0,1.46,-.151]],.0028,'seam');

  function arm(side) {
    const upper=new T.Group();upper.name=side<0?'Greeting shoulder':'Resting shoulder';upper.position.set(side*.33,1.47,0);root.add(upper);
    upper.rotation.z=side*.13;
    ellipsoid('Jacket shoulder','suit',[side*.025,-.047,0],[.102,.115,.123],upper);
    ellipsoid('Tailored upper sleeve','suit',[side*.04,-.18,0],[.095,.215,.11],upper);
    const elbow=new T.Group();elbow.name='Elbow';elbow.position.set(side*.065,-.34,0);upper.add(elbow);elbow.rotation.x=-.15;
    ellipsoid('Lower sleeve','suit',[0,-.142,.011],[.079,.178,.09],elbow);
    ellipsoid('Ivory cuff','shirt',[0,-.298,.009],[.065,.033,.072],elbow);
    const hand=new T.Group();hand.name='Hand';hand.position.set(0,-.337,.013);elbow.add(hand);
    ellipsoid('Palm','skin',[0,-.034,0],[.056,.074,.033],hand);
    for(let i=0;i<4;i++)ellipsoid('Finger','skin',[(i-1.5)*.022,-.10+Math.abs(i-1.5)*.008,.003],[.012,.046-Math.abs(i-1.5)*.004,.018],hand,smallSphere);
    const thumb=ellipsoid('Thumb','skin',[-side*.05,-.045,.013],[.022,.047,.023],hand,smallSphere);thumb.rotation.z=side*.45;
    return {upper,elbow,hand};
  }
  const greeting=arm(-1);arm(1);

  const head=new T.Group();head.name='Banuja — short curls and shaped beard';head.position.set(0,1.79,0);root.add(head);
  tailored('Sculpted head',[[ -.17,.055,.062,0,.006],[-.155,.13,.121,0,.007],[-.12,.174,.153],[-.05,.205,.172],[.04,.222,.179],[.13,.216,.173],[.23,.194,.151],[.29,.132,.108],[.32,.001,.001]],'skin',head,64);
  for(const side of [-1,1]){
    ellipsoid('Ear','skin',[side*.218,.014,-.004],[.045,.079,.043],head);
    ellipsoid('Inner ear','ear',[side*.239,.014,.032],[.021,.046,.014],head);
  }
  // Close-cropped sideburns and a low beard line leave the actual face readable.
  const beardPositions=[],beardIndices=[],cols=64,rows=10;
  for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++){
    const angle=(col/cols-.5)*Math.PI*1.17,edge=Math.abs(Math.sin(angle));
    const top=-.075+Math.pow(edge,2.2)*.075,bottom=-.169+Math.pow(edge,1.6)*.027;
    const v=row/rows,y=bottom+(top-bottom)*v;
    const rx=.113+v*.074,rz=.127+v*.047;
    beardPositions.push(Math.sin(angle)*rx,y,Math.cos(angle)*rz+.008);
  }
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;beardIndices.push(a,a+1,b,b,a+1,b+1);}
  const beardGeo=new T.BufferGeometry();beardGeo.setAttribute('position',new T.Float32BufferAttribute(beardPositions,3));beardGeo.setIndex(beardIndices);beardGeo.computeVertexNormals();
  const beard=new T.Mesh(beardGeo,m.beard);beard.name='Sculpted short beard';head.add(beard);
  for(const side of [-1,1])ellipsoid('Sideburn','hair',[side*.203,.049,.057],[.026,.096,.047],head);
  ellipsoid('Chin beard','beard',[0,-.136,.114],[.132,.047,.07],head);
  // Almond eyes, restrained catchlights, the brow shape and full lips echo the portrait.
  const pupils=[];
  for(const side of [-1,1]){
    const eye=ellipsoid('Eye socket','ear',[side*.085,.073,.167],[.062,.030,.025],head);eye.rotation.z=side*-.045;
    ellipsoid('Eye white','eye',[side*.084,.071,.185],[.049,.019,.012],head);
    const pupil=new T.Group();pupil.position.set(side*.084,.071,.197);head.add(pupil);pupils.push(pupil);
    ellipsoid('Brown iris','iris',[0,0,0],[.017,.018,.006],pupil,smallSphere);
    ellipsoid('Pupil','pupil',[0,0,.004],[.009,.012,.004],pupil,smallSphere);
    ellipsoid('Eye catchlight','eye',[-.004,.006,.008],[.0037,.0037,.002],pupil,smallSphere);
    tube('Upper eyelid',[[side*.035,.076,.19],[side*.082,.093,.19],[side*.132,.075,.179]],.005,'skin',head);
    tube('Defined eyebrow',[[side*.03,.126,.182],[side*.079,.143,.18],[side*.13,.126,.166]],.011,'hair',head);
  }
  ellipsoid('Nose bridge','skin',[0,.031,.181],[.029,.056,.041],head);
  ellipsoid('Nose tip','skin',[0,-.002,.217],[.040,.026,.033],head);
  for(const side of [-1,1]){
    ellipsoid('Nose wing','skin',[side*.034,-.012,.207],[.023,.019,.025],head,smallSphere);
    ellipsoid('Nostril','ear',[side*.027,-.025,.219],[.010,.005,.008],head,smallSphere);
  }
  tube('Upper lip',[[ -.064,-.077,.171],[-.029,-.071,.186],[0,-.075,.19],[.029,-.071,.186],[.064,-.077,.171]],.009,'lip',head);
  ellipsoid('Lower lip','lip',[0,-.089,.178],[.052,.013,.015],head);
  tube('Moustache left',[[-.065,-.060,.17],[-.035,-.048,.185],[-.008,-.052,.191]],.013,'beard',head);
  tube('Moustache right',[[.008,-.052,.191],[.035,-.048,.185],[.065,-.060,.17]],.013,'beard',head);
  // A single instanced draw call makes the curls inexpensive on a phone.
  const curlGeo=new T.IcosahedronGeometry(1,2);
  const curls=new T.InstancedMesh(curlGeo,m.hair,132);curls.name='Short textured black curls';
  const transform=new T.Object3D();
  for(let i=0;i<132;i++){
    const theta=i*2.399963229728653,level=(i+.5)/132,cos=level*.94;
    const sin=Math.sqrt(1-cos*cos);
    const x=Math.cos(theta)*sin*.208,z=Math.sin(theta)*sin*.171;
    const front=Math.max(0,z/.171);
    const y=.182+cos*.16+front*.018;
    const size=.035+.007*Math.sin(i*13.2);
    transform.position.set(x,y,z);transform.scale.set(size*1.12,size*.84,size);
    transform.rotation.set(i*.61,i*.34,i*.22);transform.updateMatrix();curls.setMatrixAt(i,transform.matrix);
  }
  curls.castShadow=true;head.add(curls);
  ellipsoid('Hair volume','hair',[0,.223,-.006],[.209,.113,.166],head);
  root.userData={description:'Illustrated 3D likeness based on Banuja’s approved navy-suit photograph. Not a biometric scan.',author:'Banuja Disanayaka portfolio'};
  return {root,head,pupils,greeting};
}
