"""Build selected creator soundtrack metadata from audio-derived charts."""
import json,pathlib
songs=[]
for slug,title in [('four-strange-footsteps','Four Strange Footsteps'),('halloween-belongs-to-our-crew','Halloween Belongs to Our Crew'),('halloween-has-teeth','Halloween Has Teeth'),('cempasuchil-en-la-puerta','Cempasúchil en la Puerta')]:
 report=json.loads(pathlib.Path(f'scripts/{slug}-note-charts.json').read_text())
 songs.append(dict(slug=slug,title=title,artist='Midnight Ghost Arcade',mood='Creator-supplied Halloween song',duration=report['duration'],playSeconds=report['duration'],file=f'/assets/audio/recordings/{slug}.mp3',tempo=report['tempo'],charts=report['charts'],chart=report['charts']['2'],chartMethod=report['method'],sampleRate=44100,creatorSupplied=True))
library=dict(songs=songs,homeSongs=songs,jumpSongs=songs)
pathlib.Path('public/recordings.js').write_text('/* Creator-supplied recordings with audio-derived difficulty charts. */\n(function(root){const library='+json.dumps(library,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=library;else root.MidnightRecordings=library;})(globalThis);\n')
