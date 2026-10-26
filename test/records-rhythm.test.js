const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../public/arcade-core');
const S=require('../public/score');
const R=require('../public/records');
test('rhythm notes match the soundtrack clock and accurate playing wins',()=>{
 const s=A.createRhythm(); A.prepareRhythm(s,{time:10,origin:0});
 for(const n of s.notes){assert.equal(n.midi,S.noteAtBeat(n.beat));assert.equal(n.time,n.beat*S.beat);A.stepRhythm(s,n.time);assert.equal(A.hitRhythm(s,n.lane,n.time),true);}
 A.stepRhythm(s,s.endAudio);assert.equal(s.status,'won');assert.equal(s.hits,s.target);assert.ok(S.duration>80);
});
test('rhythm pauses and missed notes cannot win',()=>{
 const s=A.createRhythm();A.prepareRhythm(s,{time:0,origin:0});s.paused=true;A.stepRhythm(s,100);assert.equal(s.misses,0);s.paused=false;A.stepRhythm(s,s.endAudio);assert.equal(s.status,'lost');
});
test('personal records deduplicate runs and sort equal scores by time',()=>{
 const p={};const r={id:'a',mode:'maze',score:500,seconds:12};assert.equal(R.record(p,r),true);R.record(p,r);R.record(p,{...r,id:'b',seconds:10});R.record(p,{...r,id:'c',mode:'jump',score:800});assert.equal(p.highScores.length,3);assert.equal(R.top(p,'maze')[0].id,'b');assert.equal(R.record(p,{...r,id:'bad',score:NaN}),false);
});
test('jump advances through stationary obstacles and has a higher arc',()=>{
 const s=A.createJump();A.stepJump(s,1/60);const x=s.player.x,o=s.obstacles[0].x;A.jump(s);let peak=0;for(let i=0;i<55;i++){A.stepJump(s,1/60);peak=Math.max(peak,s.player.y);}assert.equal(s.obstacles[0].x,o);assert.ok(s.player.x>x);assert.ok(peak>165);
});
