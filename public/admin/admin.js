(() => {
  "use strict";
  const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const state={content:null,version:"empty",dirty:false,authorized:false,mustChangePassword:false,revisionsLoaded:false,uploading:false};
  const loginView=qs("#loginView"),dashboardView=qs("#dashboardView"),publishButton=qs("#publishButton"),saveState=qs("#saveState"),fatal=qs("#fatalMessage");

  async function api(url,options={}){
    const headers={accept:"application/json",...(options.headers||{})};
    if(options.json!==undefined){headers["content-type"]="application/json";options={...options,body:JSON.stringify(options.json)};delete options.json}
    const response=await fetch(url,{credentials:"same-origin",headers,...options});
    let data=null;try{data=await response.json()}catch{}
    if(!response.ok){const error=new Error(data?.message||`Request failed (${response.status}).`);error.status=response.status;throw error}
    return data||{};
  }
  function setStatus(id,message,error=false){const el=qs(id);if(!el)return;el.textContent=message||"";el.classList.toggle("error",Boolean(error))}
  function showFatal(message){if(!fatal)return;fatal.textContent=message;fatal.hidden=false}
  function clearFatal(){if(fatal){fatal.hidden=true;fatal.textContent=""}}
  function setDirty(value=true){state.dirty=value;if(publishButton)publishButton.disabled=!value||state.mustChangePassword;if(saveState)saveState.textContent=value?"Unpublished changes":"No unpublished changes"}
  function getPath(obj,path){return path.split(".").reduce((value,key)=>value?.[key],obj)}
  function setPath(obj,path,value){const parts=path.split(".");let target=obj;parts.slice(0,-1).forEach(key=>{if(!target[key]||typeof target[key]!=="object")target[key]={};target=target[key]});target[parts.at(-1)]=value}
  function blankContent(){return{profile:{heroEyebrow:"",firstName:"BANUJA",lastName:"DISANAYAKA",roles:["DESIGN","SYSTEMS","PHOTOGRAPHY","PRODUCT"],heroLede:"",location:"Sri Lanka",focus:"",suitImage:"",aboutImage:"",cvUrl:"",aboutHeading:"Not built for one box.",aboutIntro:"",aboutCardTitle:"",aboutCardBody:""},career:[],metrics:[],projects:[],dailyGaze:[],ecosystem:[],contact:{email:"banuja2005@gmail.com",whatsappSriLanka:"94760313533",whatsappSriLankaDisplay:"+94 76 031 3533",whatsappMalaysia:"60172240328",whatsappMalaysiaDisplay:"+60 17 224 0328",github:"https://github.com/banujadisanayaka",githubDisplay:"Selected builds & code",whatsappMessage:""},settings:{siteTitle:"Banuja Disanayaka — Creative Systems Builder",metaDescription:"",bootText:"INITIALIZING CREATIVE SYSTEMS",footerLeft:"",footerRight:"",dailyGazeArchive:"",showAbout:true,showWork:true,showCareer:true,showGaze:true,showEcosystem:true,showContact:true}}}

  function bindFields(){
    qsa("[data-path]").forEach(input=>{
      const value=getPath(state.content,input.dataset.path);input.value=value??"";
      input.oninput=()=>{setPath(state.content,input.dataset.path,input.value);setDirty(true)};
    });
    const roles=qs("#rolesInput");if(roles){roles.value=(state.content.profile.roles||[]).join("\n");roles.oninput=()=>{state.content.profile.roles=roles.value.split(/\n+/).map(v=>v.trim()).filter(Boolean).slice(0,8);setDirty(true)}}
  }
  function renderToggles(){
    const root=qs("#sectionToggles");if(!root)return;
    const items=[["showWork","Work"],["showGaze","Photography"],["showEcosystem","VELORIA"],["showAbout","About"],["showCareer","Experience"],["showContact","Contact"]];
    root.replaceChildren(...items.map(([key,label])=>{const wrap=document.createElement("label");wrap.className="toggle";const input=document.createElement("input");input.type="checkbox";input.checked=state.content.settings[key]!==false;input.onchange=()=>{state.content.settings[key]=input.checked;setDirty(true)};wrap.append(input,document.createTextNode(label));return wrap}))
  }
  function renderProjects(){
    const root=qs("#projectEditor");if(!root)return;
    root.replaceChildren(...state.content.projects.map((project,index)=>{
      const box=document.createElement("div");box.className="project-editor";
      const head=document.createElement("div");head.className="project-editor-head";
      const title=document.createElement("strong");title.textContent=`${project.no||String(index+1).padStart(2,"0")} · ${project.title||"Untitled project"}`;
      const remove=document.createElement("button");remove.type="button";remove.className="remove-project";remove.textContent="Remove";remove.onclick=()=>{state.content.projects.splice(index,1);renderProjects();setDirty(true)};head.append(title,remove);
      const grid=document.createElement("div");grid.className="form-grid two";
      [["no","Number"],["title","Title"],["tags","Tags"],["url","URL"]].forEach(([key,label])=>{const l=document.createElement("label");l.append(document.createTextNode(label));const input=document.createElement("input");input.value=project[key]??"";input.oninput=()=>{project[key]=input.value;title.textContent=`${project.no||String(index+1).padStart(2,"0")} · ${project.title||"Untitled project"}`;setDirty(true)};l.append(input);grid.append(l)});
      const descLabel=document.createElement("label");descLabel.append(document.createTextNode("Description"));const desc=document.createElement("textarea");desc.rows=4;desc.value=project.description??"";desc.oninput=()=>{project.description=desc.value;setDirty(true)};descLabel.append(desc);
      const visible=document.createElement("label");visible.className="toggle";const check=document.createElement("input");check.type="checkbox";check.checked=project.visible!==false;check.onchange=()=>{project.visible=check.checked;setDirty(true)};visible.append(check,document.createTextNode("Visible on public site"));box.append(head,grid,descLabel,visible);return box
    }))
  }

  function renderGallery(){
    let root=qs('#galleryEditor');if(!root)return;
    const photos=Array.isArray(state.content.dailyGaze)?state.content.dailyGaze:[];
    root.replaceChildren(...photos.map((photo,index)=>{
      const row=document.createElement('details');row.className='project-editor';
      const summary=document.createElement('summary');summary.textContent=`${index+1}. ${photo.title||'Untitled photograph'}`;row.append(summary);
      const preview=document.createElement('img');preview.src=photo.preview;preview.alt=photo.alt||photo.title;preview.loading='lazy';preview.width=140;preview.style.maxHeight='160px';preview.style.objectFit='contain';row.append(preview);
      for(const [key,label]of[['title','Title'],['category','Category'],['location','Location (optional)'],['caption','Caption'],['alt','Image description'],['preview','Image URL'],['download','Download URL']]){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.value=photo[key]||'';input.oninput=()=>{photo[key]=input.value;if(key==='title')summary.textContent=`${index+1}. ${photo.title}`;if(key==='preview')photo.derivatives=[];setDirty(true)};l.append(input);row.append(l)}
      for(const [key,label]of[['visible','Publish photograph'],['featured','Feature on homepage'],['downloadable','Allow personal download']]){const l=document.createElement('label');l.className='toggle';const input=document.createElement('input');input.type='checkbox';input.checked=photo[key]!==false&&(key!=='featured'||photo.featured===true);input.onchange=()=>{photo[key]=input.checked;setDirty(true)};l.append(input,document.createTextNode(label));row.append(l)}
      return row;
    }));
  }
  function hydrate(){
    const base=blankContent();state.content=state.content||base;state.content.profile=state.content.profile||base.profile;state.content.settings=state.content.settings||base.settings;state.content.contact=state.content.contact||base.contact;state.content.projects=Array.isArray(state.content.projects)?state.content.projects:[];
    bindFields();renderToggles();renderProjects();renderGallery();setDirty(false)
  }
  async function loadContent(){clearFatal();const data=await api("/api/admin-content");state.content=data.content||blankContent();state.version=data.version||"empty";hydrate()}
  function showDashboard(session){state.authorized=true;state.mustChangePassword=Boolean(session.mustChangePassword);loginView.hidden=true;dashboardView.hidden=false;const user=qs("#sessionUser");if(user)user.textContent=session.user?.username||"Authenticated";if(state.mustChangePassword){activatePanel("securityPanel");showFatal("Password rotation is required before publishing content.");if(publishButton)publishButton.disabled=true}}
  function showLogin(){state.authorized=false;dashboardView.hidden=true;loginView.hidden=false}
  async function checkSession(){try{const session=await api("/api/admin-session");showDashboard(session);if(!session.mustChangePassword)await loadContent()}catch{showLogin()}}
  function activatePanel(id){
    qsa(".panel").forEach(panel=>{panel.hidden=panel.id!==id;panel.classList.toggle("active",panel.id===id)});qsa(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.panel===id));const button=qs(`.nav-item[data-panel="${id}"]`);const title=qs("#panelTitle");if(title&&button)title.textContent=button.textContent.trim();
    if(id==="recoveryPanel"&&!state.revisionsLoaded&&!state.mustChangePassword)loadRevisions()
  }

  function formatRevisionDate(value){if(!value)return"Unknown time";const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(date)}
  function renderRevisions(revisions){
    const root=qs("#revisionList");if(!root)return;
    if(!revisions.length){const empty=document.createElement("div");empty.className="empty-state";empty.textContent="No restore points are available yet.";root.replaceChildren(empty);return}
    root.replaceChildren(...revisions.map((revision,index)=>{
      const row=document.createElement("article");row.className="revision-row";
      const meta=document.createElement("div");const number=document.createElement("small");number.textContent=`RESTORE POINT ${String(index+1).padStart(2,"0")}`;const time=document.createElement("strong");time.textContent=formatRevisionDate(revision.at);const reason=document.createElement("span");reason.textContent=revision.reason||"publish";meta.append(number,time,reason);
      const restore=document.createElement("button");restore.type="button";restore.className="ghost";restore.textContent="Restore";restore.onclick=async()=>{
        if(state.dirty&&!window.confirm("You have unpublished edits. Restore anyway and replace them?"))return;
        if(!window.confirm(`Restore the portfolio to ${formatRevisionDate(revision.at)}? A new recovery point will be created first.`))return;
        restore.disabled=true;setStatus("#revisionStatus","Restoring revision…");
        try{const data=await api("/api/admin-revisions",{method:"POST",json:{key:revision.key,baseVersion:state.version}});state.content=data.content||state.content;state.version=data.version||state.version;hydrate();state.revisionsLoaded=false;await loadRevisions();setStatus("#revisionStatus","Revision restored and published.")}catch(error){restore.disabled=false;setStatus("#revisionStatus",error.message,true)}
      };
      row.append(meta,restore);return row
    }))
  }
  async function loadRevisions(){
    setStatus("#revisionStatus","Loading restore points…");
    try{const data=await api("/api/admin-revisions");const rows=Array.isArray(data.revisions)?data.revisions:[];renderRevisions(rows);state.revisionsLoaded=true;setStatus("#revisionStatus",rows.length?`${rows.length} restore point${rows.length===1?"":"s"} available.`:"")}catch(error){setStatus("#revisionStatus",error.message,true)}
  }

  async function uploadMedia(){
    const input=qs("#mediaFile"),button=qs("#uploadMedia");if(!input?.files?.length){setStatus("#mediaStatus","Choose an image first.",true);return}if(state.uploading)return;
    const file=input.files[0];if(file.size>4.5*1024*1024){setStatus("#mediaStatus","Image must be smaller than 4.5 MB.",true);return}
    state.uploading=true;if(button)button.disabled=true;setStatus("#mediaStatus","Uploading, validating and optimizing…");
    try{
      const form=new FormData();form.append("file",file,file.name);
      const response=await fetch("/api/admin-media",{method:"POST",body:form,credentials:"same-origin",headers:{accept:"application/json"}});
      let data=null;try{data=await response.json()}catch{}
      if(!response.ok)throw new Error(data?.message||`Upload failed (${response.status}).`);
      if(!data?.url)throw new Error("Upload completed without a media URL.");
      const result=qs("#mediaResult"),preview=qs("#mediaPreview"),url=qs("#mediaUrl");if(preview)preview.src=data.url;if(url)url.value=data.url;if(result)result.hidden=false;setStatus("#mediaStatus","Image optimized and stored securely.");input.value="";
      let add=qs('#addUploadedPhoto');if(!add){add=document.createElement('button');add.id='addUploadedPhoto';add.type='button';add.className='ghost';add.textContent='Add to The Daily Gaze';result.append(add)}
      add.onclick=()=>{state.content.dailyGaze=state.content.dailyGaze||[];state.content.dailyGaze.push({id:crypto.randomUUID(),slug:'photograph-'+Date.now(),title:'New photograph',category:'Everyday',alt:'',caption:'',location:'',preview:data.url,download:data.url,width:data.width,height:data.height,derivatives:data.derivatives||[],visible:false,featured:false,downloadable:true});renderGallery();setDirty(true);setStatus('#mediaStatus','Added as an unpublished photograph. Add a title and description in Photography, then enable Publish photograph.');add.remove()};
    }catch(error){setStatus("#mediaStatus",error.message,true)}finally{state.uploading=false;if(button)button.disabled=false}
  }

  qs("#loginForm")?.addEventListener("submit",async event=>{event.preventDefault();setStatus("#loginStatus","Signing in…");try{const payload={username:qs("#username").value.trim(),password:qs("#password").value};const data=await api("/api/admin-login",{method:"POST",json:payload});showDashboard(data);qs("#password").value="";setStatus("#loginStatus","");if(!data.mustChangePassword)await loadContent()}catch(error){setStatus("#loginStatus",error.message,true)}});
  qs("#logoutButton")?.addEventListener("click",async()=>{try{await api("/api/admin-logout",{method:"POST",json:{}})}catch{}location.replace("/admin/")});
  qsa(".nav-item").forEach(button=>button.addEventListener("click",()=>activatePanel(button.dataset.panel)));
  qs("#addProject")?.addEventListener("click",()=>{state.content.projects.push({no:String(state.content.projects.length+1).padStart(2,"0"),tags:"",title:"",description:"",url:"",visible:true});renderProjects();setDirty(true)});
  qs("#uploadMedia")?.addEventListener("click",uploadMedia);
  qs("#mediaFile")?.addEventListener("change",()=>setStatus("#mediaStatus",""));
  qs("#copyMediaUrl")?.addEventListener("click",async()=>{const value=qs("#mediaUrl")?.value;if(!value)return;try{await navigator.clipboard.writeText(value);setStatus("#mediaStatus","Media URL copied.")}catch{qs("#mediaUrl")?.select();document.execCommand?.("copy");setStatus("#mediaStatus","Media URL selected for copying.")}});
  qs("#refreshRevisions")?.addEventListener("click",()=>{state.revisionsLoaded=false;loadRevisions()});
  publishButton?.addEventListener("click",async()=>{if(!state.dirty||state.mustChangePassword)return;publishButton.disabled=true;saveState.textContent="Publishing…";clearFatal();try{const data=await api("/api/admin-content",{method:"PUT",json:{content:state.content,baseVersion:state.version}});state.content=data.content||state.content;state.version=data.version||state.version;hydrate();state.revisionsLoaded=false;saveState.textContent="Published";setTimeout(()=>{if(!state.dirty)saveState.textContent="No unpublished changes"},1400)}catch(error){publishButton.disabled=false;saveState.textContent=(error.status===409||error.status===428)?"Reload required":"Publish failed";showFatal(error.message)}});
  qs("#passwordForm")?.addEventListener("submit",async event=>{event.preventDefault();setStatus("#passwordStatus","Updating password…");try{await api("/api/admin-password",{method:"POST",json:{currentPassword:qs("#currentPassword").value,newPassword:qs("#newPassword").value}});setStatus("#passwordStatus","Password changed. Re-authentication required.");setTimeout(()=>location.replace("/admin/"),700)}catch(error){setStatus("#passwordStatus",error.message,true)}});
  window.addEventListener("beforeunload",event=>{if(!state.dirty)return;event.preventDefault();event.returnValue=""});
  checkSession();
})();