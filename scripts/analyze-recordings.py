import sys,json,subprocess,pathlib
# Optional authoring dependency: librosa. No audio-analysis packages are needed to run the game.
import numpy as np,librosa
songs=[('magic-garden','Magic in the Garden','Rafael Krux','Gentle enchanted garden',45),('creepy-comedy','Creepy Comedy','Rafael Krux','Mischievous haunted-house dance',50),('fright-night-twist','Fright Night Twist','Bryan Teoh','Playful Halloween twist',55),('midnight-greenhouse','Midnight in the Green House','Kevin MacLeod','Mysterious midnight groove',60),('night-castle','Night in the Castle','Kevin MacLeod','Moonlit castle finale',65)]
out=[]
for slug,title,artist,mood,play_seconds in songs:
 p=pathlib.Path('public/assets/audio/recordings')/(slug+'.mp3')
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(p)]))['format']['duration'])
 raw=subprocess.check_output(['ffmpeg','-v','quiet','-i',str(p),'-t',str(play_seconds),'-f','f32le','-ar','22050','-ac','1','-'])
 y=np.frombuffer(raw,dtype=np.float32);sr=22050;hop=256
 onset=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop)
 tempo,frames=librosa.beat.beat_track(onset_envelope=onset,sr=sr,hop_length=hop,trim=False,tightness=80)
 times=librosa.frames_to_time(frames,sr=sr,hop_length=hop)
 times=[float(t) for t in times if .25<t<play_seconds-.5]
 if len(times)<18:
  frames=librosa.onset.onset_detect(onset_envelope=onset,sr=sr,hop_length=hop,wait=10)
  times=[float(t) for t in librosa.frames_to_time(frames,sr=sr,hop_length=hop) if .25<t<play_seconds-.5]
 clean=[]
 for t in times:
  if not clean or t-clean[-1]>.28:clean.append(t)
 chart=[{'time':round(t,4),'tone':round(((i*7+i//4*3)%17)/17,3)} for i,t in enumerate(clean)]
 record={'slug':slug,'title':title,'artist':artist,'mood':mood,'tempo':round(float(np.ravel(tempo)[0])),'duration':round(duration,3),'playSeconds':play_seconds,'file':'/assets/audio/recordings/'+slug+'.mp3','chart':chart}
 out.append(record);print(title,'BPM',record['tempo'],'beats',len(chart),'first',chart[:2],flush=True)
home=[]
for slug,title,artist in [('witch-waltz','Witch Waltz','Kevin MacLeod'),('isolation-waltz','Isolation Waltz','Bryan Teoh')]:
 p=pathlib.Path('public/assets/audio/recordings')/(slug+'.mp3')
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(p)]))['format']['duration'])
 home.append({'slug':slug,'title':title,'artist':artist,'duration':round(duration,3),'file':'/assets/audio/recordings/'+slug+'.mp3'})
library={'songs':out,'homeSongs':home}
pathlib.Path('public/recordings.js').write_text('/* Separate home-page recordings and rhythm songs, with detected beat times. */\n(function(root){const library='+json.dumps(library,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=library;else root.MidnightRecordings=library;})(globalThis);\n')
