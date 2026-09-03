import fs from "node:fs";

function read(path){return fs.readFileSync(path,"utf8")}
function assert(ok,message){if(!ok)throw new Error(message)}

const home=read("public/v9/index.html");
const css=read("public/v9/v9.css");
const js=read("public/v9/v9.js");
const gallery=read("public/v9/gallery/index.html");
const galleryCss=read("public/v9/gallery/gallery.css");
const galleryJs=read("public/v9/gallery/gallery.js");

assert(/<title>[^<]*V9/i.test(home),"V9 preview title is required.");
assert(/meta name="robots" content="noindex,nofollow"/i.test(home),"V9 preview must remain noindex until release.");
assert(!/PORTRAIT ASSET SLOT/i.test(home+css+js),"Visible portrait-slot placeholder must not return.");
assert(!/AI designer/i.test(home+gallery),"Do not label the portfolio as AI designer.");
assert(/href="\/v9\/gallery\/"/.test(home),"Daily Gaze must link to the internal V9 gallery.");
assert(!/<a[^>]+href="https:\/\/drive\.google\.com/i.test(gallery),"Gallery must not navigate visitors to Google Drive.");
assert((gallery.match(/class="photo-card/g)||[]).length>=3,"Gallery needs the verified starter photographs.");
assert((gallery.match(/\bwidth="\d+"/g)||[]).length>=3 && (gallery.match(/\bheight="\d+"/g)||[]).length>=3,"Gallery images need intrinsic dimensions.");
assert((gallery.match(/\bsrcset=/g)||[]).length>=3 && (gallery.match(/\bsizes=/g)||[]).length>=3,"Gallery images need responsive source hints.");
assert(/<dialog[^>]+id="lightbox"/i.test(gallery),"Gallery lightbox must use a native dialog.");
assert(/ArrowLeft/.test(galleryJs)&&/ArrowRight/.test(galleryJs),"Gallery must support keyboard next/previous navigation.");
assert(/prefers-reduced-motion/.test(css)&&/prefers-reduced-motion/.test(galleryCss),"Both V9 views need reduced-motion fallbacks.");
assert(/forced-colors/.test(css)&&/forced-colors/.test(galleryCss),"Both V9 views need forced-colors fallbacks.");
assert(/max-height:560px/.test(css)&&/orientation:landscape/.test(css),"V9 homepage needs short-height landscape handling.");
assert(/requestAnimationFrame/.test(js),"Pointer/scroll motion should be frame-coordinated.");

console.log("V9 static QA passed: internal gallery, responsive media, progressive motion and preview safety verified.");
