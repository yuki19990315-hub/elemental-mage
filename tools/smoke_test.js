'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8'));
const elements=load('elements'),recipes=load('fusion_recipes'),enemies=load('enemies'),bosses=load('bosses');
assert.equal(elements.length,9);
assert.equal(recipes.length,28);
assert.equal(new Set(recipes.map(x=>[...x.elements].sort().join('|'))).size,28);
assert.equal(enemies.length,11);
assert.equal(bosses.length,3);
for(const p of ['prototype/index.html','prototype/logic.js','prototype/mechanics_v4.js','prototype/game.js','prototype/style.css','assets/previews/mobile_mockup.svg'])assert(fs.existsSync(path.join(root,p)),p);
const L=require('../prototype/logic.js');
assert.equal(L.pairKey('fire','water'),'fire|water');
assert.equal(L.pairKey('water','fire'),'fire|water');
assert.equal(L.pairKey('thunder','lightning'),null);
assert.equal(L.pairKey('thunder','dark'),'dark|lightning');
assert.equal(L.pairKey('neutral','fire'),null);
assert.ok(L.dashHitsObstacle(10,10,100,10,[{x:50,y:11,r:10}],8));
assert.ok(!L.dashHitsObstacle(10,10,100,10,[{x:50,y:90,r:10}],8));
assert.ok(Math.abs(L.pointSegmentDistance(50,10,0,0,100,0)-10)<1e-6);
assert.ok(L.steerAngle(0,Math.PI,0.1)<=0.101);
const game=fs.readFileSync(path.join(root,'prototype/game.js'),'utf8');
for(const feature of ['poison_slime','crystal_golem','abyss_eye','sorcerer_light','phantom_dark','resetRoom(true)','dashHitsObstacle','../data/','preboss','boss_ice_queen']) assert(game.includes(feature),'missing '+feature);
console.log('PASS: 9 element states, 28 fusion recipes, 11 enemies, 3 bosses, prototype mechanics');
// V4 extensions are explicitly loaded, not merely present in the repository.
for(const feature of ['M.randomMutations','M.terrainReact','M.absorb','ENV_THEMES','mode=\'route\'','mode=\'curse\''])assert(game.includes(feature),'missing v4 feature '+feature);

// The browser must prefer the current GBA art pipeline without removing v2 fallbacks.
const gbaGame=fs.readFileSync(path.join(root,'prototype/game.js'),'utf8');
for (const snippet of ["const GBA_ROOT=", "GBA_ROOT+'tiles/'", "GBA_ROOT+'props/'", "GBA_ROOT+'projectiles/'", "GBA_ROOT+'icons/'", "GBA_ROOT+'characters/'"]) {
  assert(gbaGame.includes(snippet), 'GBA art path missing: '+snippet);
}
console.log('PASS: GBA art routing enabled in portrait prototype');
