"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),data=n=>JSON.parse(fs.readFileSync(path.join(root,"data",n+".json"),"utf8"));
const elements=data("elements"),pairs=data("fusion_recipes");
assert.equal(elements.length,6);assert.equal(pairs.length,15);
const keys=new Set(pairs.map(v=>[...v.elements].sort().join("+")));
assert.equal(keys.size,15);
for(const file of ["prototype/index.html","prototype/game.js","prototype/style.css","assets/previews/mobile_mockup.svg"])assert(fs.existsSync(path.join(root,file)),file);
console.log("PASS: 6 elements, 15 fusion pairs, browser prototype and art previews exist");
