(() => {
  "use strict";
  const grid=document.querySelector("#galleryGrid");
  const cards=Array.from(document.querySelectorAll(".photo-card"));
  const dialog=document.querySelector("#lightbox");
  const image=document.querySelector("#lightboxImage");
  const title=document.querySelector("#lightboxTitle");
  const note=document.querySelector("#lightboxNote");
  const indexLabel=document.querySelector("#lightboxIndex");
  const closeButton=document.querySelector("#lightboxClose");
  const prev=document.querySelector("#prevPhoto");
  const next=document.querySelector("#nextPhoto");
  const toggle=document.querySelector("#viewToggle");
  let index=0;
  let opener=null;

  function render(i){
    if(!cards.length)return;
    index=(i+cards.length)%cards.length;
    const card=cards[index];
    image.src=card.dataset.full||card.querySelector("img")?.src||"";
    image.alt=card.querySelector("img")?.alt||"";
    title.textContent=card.dataset.title||"";
    note.textContent=card.dataset.note||"";
    indexLabel.textContent=`${index+1} / ${cards.length}`;
  }

  function openAt(i,card){
    opener=card;
    render(i);
    if(typeof dialog.showModal==="function"){
      dialog.showModal();
      closeButton.focus({preventScroll:true});
    }
  }

  cards.forEach((card,i)=>card.addEventListener("click",()=>openAt(i,card)));
  closeButton?.addEventListener("click",()=>dialog.close());
  prev?.addEventListener("click",()=>render(index-1));
  next?.addEventListener("click",()=>render(index+1));

  dialog?.addEventListener("click",event=>{
    if(event.target===dialog) dialog.close();
  });
  dialog?.addEventListener("close",()=>{
    image.removeAttribute("src");
    opener?.focus({preventScroll:true});
  });
  dialog?.addEventListener("keydown",event=>{
    if(event.key==="ArrowLeft"){event.preventDefault();render(index-1)}
    if(event.key==="ArrowRight"){event.preventDefault();render(index+1)}
  });

  toggle?.addEventListener("click",()=>{
    const compact=grid.classList.toggle("compact");
    toggle.setAttribute("aria-pressed",String(compact));
    toggle.textContent=compact?"Editorial view":"Compact view";
  });
})();
