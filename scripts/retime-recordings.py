"""Author rhythm charts from audible attacks, without extrapolating beats into silence.
Optional authoring dependencies: numpy and scipy; ffmpeg decodes the MP3 files.
"""
import json, pathlib, subprocess
import numpy as np
from scipy import signal
p = pathlib.Path('public/recordings.js')
source = p.read_text(); start = source.index('{"songs"'); end = source.index(';if(typeof module', start)
library = json.loads(source[start:end])
authored = json.loads(pathlib.Path('scripts/original-note-charts.json').read_text())
for song in library['songs']:
    if song.get('charts'):
        print(song['title'], 'preserved difficulty-specific recording charts')
        continue
    if song['slug'] in authored:
        candidates = [n for n in authored[song['slug']] if 2.5 <= n['time'] < song['playSeconds']-.6]
        chart=[]
        for n in candidates:
            if not chart or n['time']-chart[-1]['time'] >= .45: chart.append(n)
        song['chart']=chart
        song['chartMethod']='authored-melody-cues-v1'
        print(song['title'],len(chart),'authored melody notes; first:',chart[:2])
        continue
    raw = subprocess.check_output(['ffmpeg','-v','quiet','-i','public'+song['file'],'-t',str(song['playSeconds']),'-f','f32le','-ar','22050','-ac','1','-'])
    y = np.frombuffer(raw, dtype=np.float32)
    _, times, spectrum = signal.stft(y, fs=22050, nperseg=1024, noverlap=804)
    magnitude = np.abs(spectrum)
    flux = np.maximum(0, np.diff(magnitude, axis=1)).sum(axis=0)
    flux = np.r_[0, flux]
    energy = np.sqrt((magnitude**2).sum(axis=0))
    audible = energy > max(float(np.percentile(energy, 90)) * .14, .0001)
    peaks, props = signal.find_peaks(flux, distance=20, prominence=max(float(np.percentile(flux, 85))*.35, .00001))
    # Avoid inferred beats: every note must coincide with a measured attack and audible energy.
    candidates = [i for i in peaks if audible[i] and times[i] >= 2.5 and times[i] < song['playSeconds']-.6 and flux[i] >= np.percentile(flux[audible], 65)]
    kept = []
    for i in candidates:
        if kept and times[i]-times[kept[-1]] < .45:
            if flux[i] > flux[kept[-1]]: kept[-1] = i
        else: kept.append(i)
    song['chart'] = [{'time':round(float(times[i]),4),'tone':round(((n*7+n//4*3)%17)/17,3)} for n,i in enumerate(kept)]
    song['chartMethod'] = 'audible-onsets-v2'
    print(song['title'], len(kept), 'attacks; first:', song['chart'][:2])
p.write_text(source[:start]+json.dumps(library,separators=(',',':'))+source[end:])
