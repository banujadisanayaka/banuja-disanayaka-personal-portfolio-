// One-time import of the owner's approved source collection. Never imports private documents.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const source = path.resolve(process.argv[2] || '../v9-source-files');
const out = 'public/assets/v9';
await fs.mkdir(out, {recursive:true});
const labels = `164264|An elephant's gaze|Wildlife|Close portrait of an elephant, showing the texture of its skin.
164359|A corridor of colour|Heritage|Buddhist flags hang along a wooden corridor.
164365|Along the temple path|Heritage|Visitors approach a temple beneath colourful flags.
165544|A quiet presence|Heritage|A white Buddha statue sits beneath a sheltered roof.
167670|Pink on still water|Nature|Pink water lilies rise above green leaves.
168480|Light through incense|Heritage|Incense smoke catches the sunlight beside visitors.
168481|Into the mist|Nature|Tall forest trees disappear into pale mist.
168482|Under a blue sky|City|A wooden building and street beneath a bright blue sky.
168490|First light on water|Nature|Morning light reaches a pond beneath a hillside.
168823|A garden sanctuary|Heritage|A statue of Mary stands among garden plants.
168974|Stillness at sunset|Heritage|A seated Buddha statue beneath a luminous evening sky.
171007|In golden light|Heritage|A statue of Jesus illuminated by warm sunlight.
171008|Through the trees|Heritage|A church tower rises beyond dense green trees.
171009|The garden angel|Heritage|An angel statue stands in a green garden.
171011|Facing the evening|Heritage|A statue of Jesus overlooks the coast at sunset.
171012|A cross against blue|Heritage|A white church cross beneath an open blue sky.
171019|The road into quiet|Nature|A wet road curves through a misty forest.
171051|A place to pause|Nature|A hammock hangs beneath a tree in sunrise light.
171171|At the water's edge|Everyday|A lone person stands beside a lake at golden hour.
171717|White in the night|Heritage|A white stupa illuminated against the night sky.
171724|The golden room|Heritage|A golden Buddha statue surrounded by painted murals.
171744|Morning from the tent|Nature|Sunrise and distant hills seen from inside a tent.
171750|Fields waking slowly|Nature|Terraced fields in soft morning light.
171783|Time in stone|Heritage|A moss-covered stone arch among temple ruins.
171787|Red, white and sky|Heritage|A red-robed Buddha statue above broad steps.
177276|Clouds over the neighbourhood|City|Apartment buildings line a street beneath warm clouds.
177312|The early ride|Everyday|A cyclist passes along a wet lane beside a temple spire.
177307|After dark, above the roofs|City|Rooftops and city lights viewed from above at night.
177336|A table for the evening|Everyday|Long cafe tables beneath strings of warm lights.
177300|Room to breathe|Nature|An open green field beneath deep blue sky and clouds.
177240|Gold after dark|Heritage|A gold-roofed shrine illuminated at night.
177284|Old and new|Heritage|An ornate Hindu temple tower against modern high-rises.
177301|The city turns amber|City|A city skyline beneath an orange sunset.
177262|A moment unguarded|Wildlife|A monkey yawns in a close portrait.
177239|A roof of light|Heritage|Warm light illuminates a golden temple roof.
177231|Below the surface|Wildlife|A turtle swims beneath the water.
177313|Water through the hills|Nature|A waterfall descends a green hillside.
177331|The last light of play|Everyday|A playground in warm evening light.
177245|Before the shutters rise|City|A wet street outside shuttered shops in the morning.
177334|A cool crossing|Wildlife|A water buffalo stands in a shallow stream.
177268|Night traffic|City|Vehicle lights trace a city avenue after dark.
177289|Carrying the day|Everyday|A man carries shopping bags beside a tuk-tuk on a street.
177329|Sun through grass|Nature|Low sunlight shines across a grassy field.
177290|A frame for the sky|City|Tall modern buildings frame a golden patch of sky.
177316|Looking up|City|High-rise buildings viewed from street level.
177317|Kept by the forest|Heritage|A mossy statue stands among forest greenery.
177310|Towers before the storm|City|The Petronas Twin Towers beneath dramatic storm clouds.
177297|Beyond the shade|Everyday|A sports field seen from beneath a shaded roof.
177293|A small city sanctuary|Heritage|A small Hindu shrine among city buildings.
177253|Wings on the water|Wildlife|White birds gather at a pond in golden light.
177235|The evening seller|Everyday|A vendor in silhouette beside the sea at sunset.
177269|A thousand windows|City|A wide view of the city illuminated at night.
177282|A shrine in red|Heritage|A small red shrine beside a walkway.
177256|Kites above the rush|Everyday|Kites float above a busy road and street activity.
177242|Between butterfly wings|City|A butterfly-shaped installation frames the Petronas towers.
177322|The light between us|Everyday|Sunbeams fall across people on a tree-lined road.
177233|The view ahead|Everyday|A woman looks across a green valley from a hillside.
177326|A bridge over green|Nature|A bamboo bridge crosses a stream in dense greenery.
177323|Stillness in the city|Heritage|A white Buddha statue in an urban niche.
177342|From the front seat|Everyday|A street scene viewed through the front of a bus.
177234|Between stations|Everyday|The interior of a commuter train during a journey.
177287|The market in motion|Everyday|People move between fruit stalls on a busy market street.
177250|Lines through the city|City|A highway curves between city buildings in afternoon light.
177255|A small coffee ritual|Everyday|Coffee drinks on a cafe table.
177333|Where the river falls|Nature|A waterfall spills into a rocky river.
177332|Colour behind the wire|Wildlife|A colourful bird photographed behind wire mesh.
177305|Water and weather|Nature|A dam spillway beneath a dramatic cloud-filled sky.
177292|Above the city|Heritage|The back of the Murugan statue overlooks the city at Batu Caves.
177244|A seat by the window|Everyday|Warm light enters a quiet cafe interior.
177228|A sky over the stupa|Heritage|A white stupa beneath dark and textured clouds.
177327|The golden guardian|Heritage|The golden Murugan statue beside the steps at Batu Caves.
177283|The curve after dark|City|An elevated highway curves through the city at night.
177273|Sunset over the hill|City|An evening skyline viewed across a hill.
177319|An opening to the sky|Nature|Daylight enters a tall limestone cave opening.
177279|Blue in the sanctuary|Heritage|A blue Hindu deity statue with ornate sculptural details.
177330|The street is alive|Everyday|A crowd moves through a busy market street.
177270|A courtyard moment|Everyday|A child stands in a sunlit courtyard.
177263|Weather above the roofs|City|Dramatic clouds gather above city rooftops.
177259|The artist's hand|Everyday|A tattoo artist's gloved hand works on an arm.
177291|Riding into the light|Everyday|A cyclist travels along an avenue filled with sunbeams.
177247|Moon between palms|Nature|The moon glows behind clouds and palm silhouettes.
177261|Bubbles by the sea|Everyday|A bubble vendor at the seafront.
177237|Work in warm light|Everyday|A laptop and mug beside a warmly lit window.
177314|A golden avenue|City|Golden light falls along a tree-lined street.
177320|A forest pool|Nature|Still water surrounded by dense forest greenery.
177340|Red among the fields|Everyday|A person in a red shirt walks through a paddy field.
177294|Layers of the city|City|Residential towers stand close together in a city neighbourhood.
177246|Flowers for someone|Everyday|A hand holds a bouquet of pink flowers.
177252|An unexpected drink|Wildlife|A monkey drinks from a discarded can.
177280|Crossing at sunset|City|A bridge and city buildings in sunset light.
177248|A tower in the haze|City|A tall city tower fades into soft haze.
177335|Gold against the sky|Heritage|The golden Murugan statue against an open sky.
177315|At the feet of the towers|City|The Petronas Twin Towers seen from below in golden light.
177264|Angles in blue|City|The OSK building rises against a blue sky.
177274|Twin lights|City|The illuminated Petronas Twin Towers viewed from above at night.
177324|Roots and stone|Heritage|Tree roots grow around old temple stonework.
177271|The illuminated city|City|Brightly lit buildings stand out against the night.
177339|Lines in the land|Nature|Rows of planted crops stretch across the landscape.
177308|The green guardian|Heritage|A tall green Hanuman statue beside temple architecture.
177278|Light finds the pond|Nature|Sunbeams fall through leaves onto a small pond.
177318|A train through the city|City|A train rounds a bend above intersecting roads.
177295|The temple at night|Heritage|A temple illuminated against a cliff after dark.
177254|Feathers and wire|Wildlife|Birds photographed behind cage wire.
177281|A roof among hills|City|A building with an angular roof beneath distant hills.
177341|A world on a leaf|Wildlife|A small insect rests on a green leaf in close-up.
177229|A pause on the pavement|Wildlife|A cat rests on textured paving stones.
177243|A city in soft focus|City|A hazy skyline beneath grey clouds.
177275|The last tower of light|City|A slender city tower catches sunset light.
177304|Stone at golden hour|Nature|A rocky hillside illuminated by late sunlight.
177272|A quiet step|Heritage|A young Buddhist monk sits on temple steps.
177260|A triangular silhouette|City|An angular city tower seen against the sky.
177285|A bridge in violet|City|A purple-lit bridge leads toward the Petronas towers at night.
177230|At ease|Wildlife|A cat rests beside a paved path.
177257|A curious companion|Wildlife|A monkey holds a drink can in a front-facing portrait.
177232|On the way home|Everyday|A passenger seen from behind inside a bus.`;
const map = new Map(labels.split('\n').map(l=>{const [id,title,category,alt]=l.split('|');return[id,{title,category,alt}]}));
const names=(await fs.readdir(source)).filter(n=>/^\d{6}(?:\(\d+\))?\.(png|jpe?g)$/i.test(n)).sort();
const seen=new Set(),gallery=[];
for(const name of names){
 const input=await fs.readFile(path.join(source,name));const hash=crypto.createHash('sha256').update(input).digest('hex').slice(0,12);if(seen.has(hash))continue;seen.add(hash);
 const id=name.slice(0,6),label=map.get(id);if(!label)throw Error('Uncatalogued photograph: '+name);
 const master=await sharp(input).rotate().resize({width:2560,height:2560,fit:'inside',withoutEnlargement:true}).webp({quality:92}).toBuffer({resolveWithObject:true});
 const base=`gaze-${id}-${hash}`,url=`/assets/v9/${base}.webp`;
 await fs.writeFile(`${out}/${base}.webp`,master.data);
 const derivatives=[];
 for(const width of [480,960,1600].filter(w=>w<master.info.width)){const d=await sharp(master.data).resize({width}).webp({quality:84}).toBuffer({resolveWithObject:true});await fs.writeFile(`${out}/${base}-${width}.webp`,d.data);derivatives.push({url:`/assets/v9/${base}-${width}.webp`,width:d.info.width,height:d.info.height});}
 derivatives.push({url,width:master.info.width,height:master.info.height});
 gallery.push({id:`tdg-${id}-${hash}`,slug:`${label.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')}-${id}`,...label,preview:url,download:url,width:master.info.width,height:master.info.height,derivatives,visible:true,downloadable:true,featured:['168481','177310','171744','177327','177235','177341'].includes(id),location:['177310','177242','177315','177274','177285'].includes(id)?'Kuala Lumpur':['177292','177327','177335','177319'].includes(id)?'Batu Caves':'',caption:label.alt});
}
await fs.mkdir('content',{recursive:true});await fs.writeFile('content/gallery.json',JSON.stringify(gallery,null,2));
for(const [prefix,needle,crop] of [['portrait','18260',null],['about','10261',{left:0,top:452,width:628,height:628}],['personal','10079',null]]){
 const name=(await fs.readdir(source)).find(n=>n.includes(needle)&&/\.(jpg|png)$/.test(n));
 let p=sharp(path.join(source,name)).rotate();if(crop)p=p.extract(crop);const input=await p.toBuffer();
 for(const width of [480,960,1440])await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:89}).toFile(`${out}/${prefix}-${width}.webp`);
}
await fs.copyFile('public/v9/assets/banuja-logo-gold.webp',`${out}/banuja-logo-gold.webp`);
console.log(`Prepared ${gallery.length} distinct photographs and responsive portraits.`);
