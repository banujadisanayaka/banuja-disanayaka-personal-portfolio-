import fs from 'node:fs/promises';
import sharp from 'sharp';
const gallery=JSON.parse(await fs.readFile('content/gallery.json','utf8'));
for(const photo of gallery){
  for(const derivative of photo.derivatives.filter(d=>d.url!==photo.preview)){
    try{await fs.access('public'+derivative.url)}catch{
      try {
        await sharp('public'+photo.preview).resize({width:derivative.width,withoutEnlargement:true}).webp({quality:84}).toFile('public'+derivative.url);
      } catch(error) { throw new Error(`Cannot build ${photo.preview}: ${error.message}`); }
    }
  }
}
console.log('Responsive gallery derivatives ready.');
