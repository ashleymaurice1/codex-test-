"""Build track metadata and charts. Authoring only; requires ffmpeg, numpy, scipy."""
import json, pathlib, subprocess, sys
folder=pathlib.Path('public/assets/audio/recordings')
def track(slug,title,artist,**extra):
 path=folder/((slug+'-piano-strings' if slug=='ghostlight-parade' else slug)+'.mp3')
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',str(path)]))['format']['duration'])
 return dict(slug=slug,title=title,artist=artist,duration=round(duration,3),file='/assets/audio/recordings/'+path.name,**extra)
original='Midnight Ghost Arcade · Original'
songs=[track(slug,title,artist,mood=mood,tempo=tempo,playSeconds=seconds,chart=[]) for slug,title,artist,mood,tempo,seconds in [
 ('la-mesa-puesta-para-ti','La Mesa Puesta Para Ti','Midnight Ghost Arcade','Original song for Midnight Ghost Arcade',101.33,89.96),
 ('midnight-spell-house','Midnight Spell',original,'Witchy house groove',122,50),
 ('lantern-lullaby','Lantern Lullaby',original,'Gentle, eerie flute and choral lullaby',76,55),
 ('velvet-cathedral','Velvet Cathedral',original,'Dark gothic organ, strings and bells',96,60),
 ('night-castle','Night in the Castle','Kevin MacLeod','Moonlit castle finale',140,65)]]
song_chart=json.loads(pathlib.Path('scripts/la-mesa-note-charts.json').read_text())
songs[0].update(charts=song_chart['charts'], chart=song_chart['charts']['2'], chartMethod=song_chart['method'], tempo=song_chart['tempo'], sampleRate=44100, creatorSupplied=True)
home=[track('creepy-hallow','Creepy Hallow','Alexander Nakarada'),track('witch-waltz','Witch Waltz','Kevin MacLeod')]
jump=[track('del-rio-bravo','Del Rio Bravo','Kevin MacLeod')]
library=dict(songs=songs,homeSongs=home,jumpSongs=jump)
pathlib.Path('public/recordings.js').write_text('/* Full recordings with authored melody cues or measured audible attacks. */\n(function(root){const library='+json.dumps(library,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=library;else root.MidnightRecordings=library;})(globalThis);\n')
subprocess.run([sys.executable,'scripts/retime-recordings.py'],check=True)
