"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),data=n=>JSON.parse(fs.readFileSync(path.join(root,"data",n+".json"),"utf8"));
const elements=data("elements"),recipes=data("fusion_recipes"),enemies=data("enemies"),bosses=data("bosses");
assert.equal(elements.length,9);assert.equal(elements.filter(e=>e.id!=="neutral").length,8);
assert.equal(recipes.length,28);
assert.equal(new Set(recipes.map(r=>[...r.elements].sort().join("+"))).size,28);
assert.equal(enemies.length,11);assert.equal(bosses.length,3);
assert.equal(new Set(enemies.map(e=>e.id)).size,11);
for(const file of ["prototype/index.html","prototype/game.js","prototype/style.css","assets/previews/mobile_mockup.svg"])
  assert(fs.existsSync(path.join(root,file)),file);
console.log("PASS: 9 element states, 28 recipes, 11 enemies, 3 bosses, prototype assets exist");
