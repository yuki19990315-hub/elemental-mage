/* Small deterministic mechanics, shared by browser and Node tests. */
(function(root) {
  'use strict';
  const ELEMENTS = Object.freeze(['fire','water','ice','lightning','wind','earth','light','dark']);
  const toElement = value => value === 'thunder' ? 'lightning' : value;
  function pairKey(a,b) {
    a = toElement(a); b = toElement(b);
    if (!ELEMENTS.includes(a) || !ELEMENTS.includes(b) || a === b) return null;
    return [a,b].sort().join('|');
  }
  function clamp(n,min,max) { return Math.max(min,Math.min(max,n)); }
  function pointSegmentDistance(px,py,x1,y1,x2,y2) {
    const dx=x2-x1,dy=y2-y1, length=dx*dx+dy*dy;
    const t=length?clamp(((px-x1)*dx+(py-y1)*dy)/length,0,1):0;
    return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
  }
  function dashHitsObstacle(x1,y1,x2,y2,objects,radius) {
    return objects.some(o=>pointSegmentDistance(o.x,o.y,x1,y1,x2,y2)<radius+o.r);
  }
  function steerAngle(from,to,limit) {
    const diff=Math.atan2(Math.sin(to-from),Math.cos(to-from));
    return from+clamp(diff,-limit,limit);
  }
  const api=Object.freeze({ELEMENTS,toElement,pairKey,clamp,pointSegmentDistance,dashHitsObstacle,steerAngle});
  root.ElementalLogic=api;
  if (typeof module!=='undefined'&&module.exports) module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);