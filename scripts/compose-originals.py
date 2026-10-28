"""Original game arrangements, rendered offline with FluidSynth and GeneralUser GS.
Usage: python scripts/compose-originals.py /path/to/GeneralUser-GS.sf2
Requires numpy, libfluidsynth and ffmpeg only for authoring. No runtime synthesis.
No reference-song MIDI, melodies, recordings or vocal samples are used.
"""
import ctypes as C, ctypes.util, json, pathlib, random, subprocess, sys, wave
import numpy as np
font=sys.argv[1]
f=C.CDLL(ctypes.util.find_library('fluidsynth'))
def api(name, result, *args):
 fn=getattr(f,name);fn.restype=result;fn.argtypes=list(args);return fn
ptr=C.c_void_p;I=C.c_int;F=C.c_float;D=C.c_double;S=C.c_char_p
settings=api('new_fluid_settings',ptr)()
api('fluid_settings_setnum',I,ptr,S,D)(settings,b'synth.sample-rate',44100)
api('fluid_settings_setnum',I,ptr,S,D)(settings,b'synth.gain',.5)
api('fluid_settings_setnum',I,ptr,S,D)(settings,b'synth.reverb.room-size',.55)
api('fluid_settings_setnum',I,ptr,S,D)(settings,b'synth.reverb.level',.16)
api('fluid_settings_setint',I,ptr,S,I)(settings,b'synth.chorus.active',0)
synth=api('new_fluid_synth',ptr,ptr)(settings)
assert api('fluid_synth_sfload',I,ptr,S,I)(synth,font.encode(),1)>=0
on=api('fluid_synth_noteon',I,ptr,I,I,I);off=api('fluid_synth_noteoff',I,ptr,I,I)
prog=api('fluid_synth_program_change',I,ptr,I,I);cc=api('fluid_synth_cc',I,ptr,I,I,I)
write=api('fluid_synth_write_float',I,ptr,I,ptr,I,I,ptr,I,I)
alloff=api('fluid_synth_all_sounds_off',I,ptr,I)
rate=44100
outdir=pathlib.Path('public/assets/audio/recordings')

def render(slug,bpm,bars,style):
 rng=random.Random(803 if style=='march' else 1901);events=[];beat=60/bpm
 def note(ch,p,t,d,v=65):
  at=max(0,t*beat+rng.uniform(-.007,.007));v=max(1,min(115,v+rng.randint(-4,4)))
  events.extend([(int(at*rate),1,ch,p,v),(int((at+d*beat)*rate),0,ch,p,0)])
 def chord(ch,notes,t,d,v):
  for p in notes:note(ch,p,t,d,v)
 programs=([71,45,48,70,8,60,68] if style=='march' else [73,46,48,70,8,52,11] if style=='lullaby' else [19,6,48,42,14,52,46] if style=='gothic' else [16,38,4,80,8,50,81])
 meter=3 if style=='lullaby' else 4
 for ch,p in enumerate(programs):
  alloff(synth,ch);prog(synth,ch,p);cc(synth,ch,10,[50,78,38,68,85,45,62][ch]);cc(synth,ch,7,100)
 alloff(synth,9);cc(synth,9,7,72)
 # Fully written phrases with recurring, varied refrains rather than a short loop.
 motifs=[[(67,0,.5),(72,.75,.5),(75,1.5,.8),(74,2.5,.5),(72,3.25,.55)],
 [(68,0,.8),(67,1,.5),(65,1.75,.7),(73,3,.65)],
 [(65,0,.5),(68,.75,.5),(72,1.5,1),(70,3,.65)],
 [(71,0,.7),(74,1,.5),(67,2,1.5)],
 [(75,0,1),(79,1.5,.5),(77,2.25,.55),(75,3,.75)],
 [(74,0,.6),(70,1,.6),(77,2,.5),(74,3,.65)],
 [(65,0,.5),(68,.75,.5),(74,1.5,.5),(77,2.5,.8)],
 [(74,0,.6),(71,1,.6),(67,2,.6),(72,3,.8)]]
 house=[[(74,.5,.5),(77,1.25,.4),(76,2,.7),(69,3.25,.5)],
 [(74,0,.5),(81,1,.65),(79,2,.5),(77,3,.75)],
 [(79,.5,.4),(77,1.25,.4),(74,2,.6),(72,3.25,.4)],
 [(73,0,.75),(76,1.5,.5),(69,2.5,1)]]
 for bar in range(bars):
  t=bar*meter
  intro=bar<4;outro=bar>=bars-4
  quiet=36<=bar<44 if style=='march' else 32<=bar<40
  if style=='gothic':
   tones,bass=[([57,60,64],33),([53,57,60],29),([50,57,62],26),([52,56,59,62],28),([55,60,64],36),([55,59,62],31),([53,59,62],35),([52,56,59,62],28)][bar%8]
   note(3,bass,t,3.8,45)
   chord(0,tones,t,3.65,39 if not quiet else 27)
   for j,p in enumerate(tones[:3]):note(1,p+12,t+.5+j,.55,43 if not quiet else 28)
   if bar%2==0:chord(2,[p+12 for p in tones[:2]],t,7.7,36)
   gothic=[[(72,0,1.3),(71,1.5,.7),(68,2.5,1)],[(69,0,2),(64,2.5,1)],[(77,0,1.3),(76,1.5,.7),(73,2.5,1)],[(71,0,1.6),(68,2,1.6)],[(76,0,1),(79,1.5,1),(72,3,.8)],[(74,0,1.6),(71,2,1.6)],[(77,0,1.3),(74,1.5,.7),(71,2.5,1)],[(68,0,1.6),(64,2,1.6)]]
   if not intro and not outro:
    for p,pos,d in gothic[bar%8]:note(6,p,t+pos,d,59 if not quiet else 40)
   if bar%4==0:note(4,tones[0]+12,t,3.5,35)
   if 20<=bar<36:chord(5,[p+12 for p in tones[:2]],t,3.8,29)
  elif style=='lullaby':
   tones,bass=[([64,67,71],40),([60,64,67],36),([57,64,69],33),([59,63,66],35),([64,67,71],40),([62,67,71],43),([62,66,69],38),([59,63,66],35)][(bar//2)%8]
   note(3,bass,t,2.6,35)
   for j,p in enumerate(tones):note(1,p+12,t+j*.65,.9,42 if not quiet else 31)
   if bar%2==0:chord(2,tones,t,5.8,28)
   if 20<=bar<36:chord(5,[p+12 for p in tones[:2]],t,2.8,27)
   melodies=[[(76,0,.8),(79,1,.8),(71,2,.8)],[(74,0,1.6),(78,2,.8)],[(76,0,.8),(71,1,.8),(69,2,.8)],[(75,0,2.7)],[(79,0,1.2),(83,1.5,1.2)],[(81,0,.8),(79,1,1.7)],[(78,0,1.2),(74,1.5,1.2)],[(75,0,1.6),(71,2,.8)]]
   if not intro and not outro:
    for p,pos,d in melodies[(bar-4)%8]:note(0 if not quiet else 6,p if not quiet else p-12,t+pos,d*.94,57 if not quiet else 43)
   elif bar%2==0:note(4,tones[-1]+12,t+1,1.6,39)
  elif style=='march':
   progression=[([48,55,60,63],36),([44,55,60,63],32),([41,53,56,60],29),([43,55,59,62],31),([51,55,58,63],39),([46,53,58,62],34),([50,53,56,62],38),([43,55,59,62],31)]
   tones,bass=progression[(bar-4)%8]
   if intro:
    note(4,[72,79,75,74][bar],t+1,1.2,48);chord(2,tones[1:],t,3.7,30)
    continue
   # Pizzicato offbeats, a low bassoon step and restrained snare create a storybook march.
   for pos in [0,2]:note(3,bass,t+pos,.85,56 if not quiet else 39)
   for pos in ([1,3] if quiet else [.75,1.75,2.75,3.5]):chord(1,tones[1:],t+pos,.3,42 if quiet else 53)
   if bar%2==0:chord(2,[p+12 for p in tones[1:3]],t,7.6,27 if quiet else 35)
   if not quiet and not outro:
    for pos in [1,3]:note(9,38,t+pos,.12,32)
    note(9,36,t,.15,40)
   phrase=motifs[(bar-4)%8]
   if quiet:phrase=[(p-12,pos,d*1.1) for p,pos,d in phrase[:3]]
   for p,pos,d in phrase:
    note(0 if bar<20 or quiet else 6,p,t+pos,d*.86,62 if quiet else 74)
   if bar%4==3 and not quiet:note(4,tones[-1]+24,t+3.5,.55,43)
   if 28<=bar<36 or 44<=bar<52:
    chord(5,tones[1:3],t,1.6,39)
   if outro:chord(2,[60,63,67],t,3.5,35);note(4,72,t+2,1.6,40)
  else:
   tones,bass=[([62,65,69],38),([67,70,74],43),([65,70,74],34),([61,64,69],33)][(bar//2)%4]
   # A dance arrangement with a proper breakdown and return, without vocal samples.
   if not quiet:
    for pos in range(4):note(9,36,t+pos,.16,76 if not intro else 49)
    for pos in [1,3]:note(9,39,t+pos,.14,53 if not intro else 34)
    for pos in [.5,1.5,2.5,3.5]:note(9,42,t+pos,.12,36)
   if intro:
    chord(0,tones,t+1,.6,45);note(4,tones[-1]+12,t+3,.5,36)
    continue
   for pos in ([0,2.5] if quiet else [0,.75,1.5,2.5,3.25]):note(1,bass,t+pos,.42,48 if quiet else 67)
   for pos in ([1.5] if quiet else [.5,1.5,2.5,3.5]):chord(0,tones,t+pos,.28,40 if quiet else 57)
   if bar%2==0:chord(5,tones,t,7.5,24)
   if quiet:
    chord(2,[p+12 for p in tones],t+.25,2.8,46)
    note(4,tones[-1]+12,t+3,.6,34)
   elif not outro:
    for p,pos,d in house[bar%4]:note(2 if bar<24 else 3,p,t+pos,d*.8,62 if bar<24 else 49)
    if bar%4==3:note(4,81,t+3.5,.35,32)
   else:chord(2,tones,t+1,2,38)
 duration=bars*meter*beat+3
 events.sort(key=lambda e:(e[0],e[1]));idx=0;position=0
 path=pathlib.Path('/tmp')/(slug+'.wav')
 with wave.open(str(path),'wb') as wav:
  wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(rate)
  while position<int(duration*rate):
   while idx<len(events) and events[idx][0]<=position:
    _,kind,ch,p,v=events[idx];(on(synth,ch,p,v) if kind else off(synth,ch,p));idx+=1
   count=min(1024,int(duration*rate)-position)
   if idx<len(events):count=min(count,max(1,events[idx][0]-position))
   left=np.empty(count,np.float32);right=np.empty(count,np.float32)
   write(synth,count,left.ctypes.data,0,1,right.ctypes.data,0,1)
   stereo=np.column_stack((left,right));wav.writeframes((np.clip(stereo,-1,1)*32767).astype('<i2').tobytes());position+=count
 for ch in list(range(7))+[9]:alloff(synth,ch)
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(path),'-af',f'afade=t=in:d=1.2,afade=t=out:st={duration-5}:d=5,loudnorm=I=-20:TP=-3:LRA=9','-c:a','libmp3lame','-b:a','128k',str(outdir/(slug+'.mp3'))],check=True)
 lead_channels={'march':{0,6},'house':{2,3},'lullaby':{0,6},'gothic':{6}}[style]
 lead=[{'time':round(e[0]/rate,4),'tone':round(((e[3]-48)%24)/24,3)} for e in events if e[1]==1 and e[2] in lead_channels and e[0]/rate>=2.5]
 charts_path=pathlib.Path('scripts/original-note-charts.json')
 charts=json.loads(charts_path.read_text()) if charts_path.exists() else {}
 charts[slug]=lead;charts_path.write_text(json.dumps(charts,separators=(',',':'))+'\n')
 print(slug,round(duration,2),'seconds',len(events)//2,'arranged notes',flush=True)
render('ghostlight-parade',108,56,'march')
render('midnight-spell-house',122,64,'house')

render('lantern-lullaby',76,56,'lullaby')

render('velvet-cathedral',96,52,'gothic')
