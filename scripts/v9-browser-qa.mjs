import { chromium } from "playwright";

const base=process.env.BROWSER_QA_BASE_URL||"http://127.0.0.1:4173";
function assert(ok,message){if(!ok)throw new Error(message)}

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of [{width:390,height:844},{width:812,height:375},{width:1363,height:936}]){
    const context=await browser.newContext({viewport});
    const page=await context.newPage();
    await page.goto(base+"/v9/",{waitUntil:"domcontentloaded"});
    const width=await page.locator("body").evaluate(el=>el.scrollWidth);
    assert(width<=viewport.width+2,`V9 horizontal overflow at ${viewport.width}x${viewport.height}: ${width}`);
    assert(await page.locator("h1").isVisible(),"V9 hero heading must be visible.");

    if(viewport.width<=390){
      const trigger=page.locator("#menuTrigger");
      assert(await trigger.isVisible(),"V9 mobile menu trigger must be visible.");
      await trigger.click();
      assert(await trigger.getAttribute("aria-expanded")==="true","V9 menu must expose expanded state.");
      assert(await page.locator("#primaryNav a[href='#work']").isVisible(),"V9 mobile navigation links must be visible.");
      await page.keyboard.press("Escape");
      assert(await trigger.getAttribute("aria-expanded")==="false","Escape must close V9 navigation.");
    }
    await context.close();
  }

  const noJs=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
  const noJsPage=await noJs.newPage();
  await noJsPage.goto(base+"/v9/",{waitUntil:"domcontentloaded"});
  assert(await noJsPage.locator("h1").isVisible(),"V9 content must fail open without JavaScript.");
  assert((await noJsPage.locator(".reveal-ready").count())===0,"No-JS V9 must not start content hidden.");
  await noJs.close();

  const galleryContext=await browser.newContext({viewport:{width:390,height:844}});
  const gallery=await galleryContext.newPage();
  await gallery.goto(base+"/v9/gallery/",{waitUntil:"domcontentloaded"});
  assert((await gallery.locator('a[href^="https://drive.google.com"]').count())===0,"Internal gallery must expose no Google Drive navigation links.");
  const cards=gallery.locator(".photo-card");
  assert(await cards.count()>=3,"Internal gallery must render starter collection.");
  await cards.first().click();
  assert(await gallery.locator("#lightbox").evaluate(el=>el.open===true),"Gallery card must open modal lightbox.");
  await gallery.keyboard.press("ArrowRight");
  assert((await gallery.locator("#lightboxIndex").textContent())?.trim()==="2 / 3","ArrowRight must advance gallery.");
  await gallery.keyboard.press("Escape");
  assert(await gallery.locator("#lightbox").evaluate(el=>el.open===false),"Escape must close gallery lightbox.");
  await galleryContext.close();

  console.log("V9 browser QA passed: responsive layout, menu, no-JS resilience and internal gallery interactions verified.");
}finally{
  await browser.close();
}
