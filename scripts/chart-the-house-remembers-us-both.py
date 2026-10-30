"""Offline audio-derived charts for the supplied finished song.
Authoring dependencies: librosa, numpy, scipy and ffmpeg. No runtime dependencies.
Usage: PYTHONPATH=/tmp/ghost-song-analysis python scripts/chart-the-house-remembers-us-both.py
"""
import json,pathlib,subprocess
import numpy as np
import librosa
from scipy.signal import find_peaks
path=pathlib.Path('public/assets/audio/recordings/the-house-remembers-us-both.mp3')
sr=22050;hop=256
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(sr),'-ac','1','-'])
y=np.frombuffer(raw,dtype=np.float32)
D=librosa.stft(y,n_fft=2048,hop_length=hop)
H,P=librosa.decompose.hpss(D,margin=(2,2))
percussive=librosa.feature.melspectrogram(S=np.abs(P)**2,sr=sr,n_mels=96)
env=librosa.onset.onset_strength(S=librosa.power_to_db(percussive),sr=sr,hop_length=hop)
tempo,frames=librosa.beat.beat_track(onset_envelope=env,sr=sr,hop_length=hop,start_bpm=100,tightness=80,trim=False)
beats=librosa.frames_to_time(frames,sr=sr,hop_length=hop)
peaks=librosa.onset.onset_detect(onset_envelope=env,sr=sr,hop_length=hop,backtrack=False,units='frames',pre_max=3,post_max=3,pre_avg=12,post_avg=12,delta=.07,wait=8)
times=librosa.frames_to_time(peaks,sr=sr,hop_length=hop)
rms=librosa.feature.rms(S=np.abs(D),frame_length=2048,hop_length=hop)[0]
chroma=librosa.feature.chroma_stft(S=np.abs(H)**2,sr=sr,n_fft=2048,hop_length=hop)
duration=len(y)/sr;floor=float(np.percentile(rms,90))*.10
usable=[(float(t),int(frame)) for t,frame in zip(times,peaks) if 2.5<=t<duration-1.2 and rms[min(int(frame),len(rms)-1)]>floor]
period=float(np.median(np.diff(beats)));bpm=60/period
# Associate real attacks with the tracked beat. No notes are invented in rests.
beat_notes=[];used=set()
for i,t in enumerate(beats):
 choices=[(abs(at-t),-float(env[f]),at,f) for at,f in usable if abs(at-t)<=min(.14,period*.25) and f not in used]
 if choices:
  _,_,at,f=min(choices);used.add(f);beat_notes.append((i,at,f))
def event(t,f):
 # Relative harmonic register shapes arrow direction; the game balances active lanes.
 pitch=int(np.argmax(chroma[:,min(f,chroma.shape[1]-1)]))
 return {'time':round(t,4),'tone':round(pitch/12,4),'strength':round(float(env[f]/max(np.percentile(env,95),.001)),3)}
def sparse(items,gap):
 out=[]
 for t,f in sorted(items):
  if not out or t-out[-1][0]>=gap:out.append((t,f))
 return [event(t,f) for t,f in out]
def stride_for(gap):
 stride=1
 while period*stride<gap:stride*=2
 return stride
charts={}
for difficulty,gap in [(0,1.5),(1,.65)]:
 stride=stride_for(gap)
 # Choose the accent phase with the strongest recorded attacks, not a random phase.
 groups=[[(t,f) for i,t,f in beat_notes if i%stride==phase] for phase in range(stride)]
 chosen=max(groups,key=lambda group:sum(float(env[f]) for _,f in group))
 charts[str(difficulty)]=sparse(chosen,gap)
# Hard adds clear offbeats only when a real attack lands near a half-beat.
hard=[(t,f) for _,t,f in beat_notes]
for t,f in usable:
 nearest=int(np.argmin(abs(beats-t)))
 phase=(t-beats[nearest])/period
 if abs(abs(phase)-.5)<.16 and env[f]>=np.percentile(env,70):hard.append((t,f))
charts['2']=sparse(hard,.30)
report={'tempo':round(bpm,2),'duration':round(duration,4),'charts':charts,'method':'percussive-beat-aligned-attacks-v1','beatCount':len(beats),'onsetCount':len(usable),'sampleRate':sr,'hopLength':hop}
pathlib.Path('scripts/the-house-remembers-us-both-note-charts.json').write_text(json.dumps(report,separators=(',',':'))+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='charts'},indent=2))
for key,chart in charts.items():print(key,len(chart),'notes; first',chart[:5],flush=True)
