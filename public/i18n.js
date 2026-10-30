/* English/Spanish presentation layer. Game state and player-entered values stay unchanged. */
(function (root) {
  let language = "en";
  try {
    language = localStorage.getItem("midnight-language") === "es" ? "es" : "en";
  } catch {}
  const entries = `
A little spooky. A lot of silly.|Un poquito de miedo. Mucha diversión.
A glowing woodland. Four little spirits.|Un bosque luminoso. Cuatro pequeños espíritus.
Your kind of Halloween adventure.|Tu aventura de Halloween.
THE WITCHING HOUR IS HERE|HA LLEGADO LA HORA MÁGICA
Follow a little moonlight.|Sigue la luz de la luna.
MACH · YOUR GHOST FALCON|MACH · TU HALCÓN FANTASMA
How would you like to play?|¿Cómo quieres jugar?
The Journey takes you through all four games. Quick Play is one standalone game.|La aventura recorre los cuatro juegos. La partida rápida es un solo juego.
How to play →|Cómo jugar →
SERIES OF LEVELS|SERIE DE NIVELES
Start Journey|Comenzar aventura
Continue Journey|Continuar aventura
Jump → Melody → Maze → Tap Race|Saltos → Melodía → Laberinto → Carrera
All four games across five chapters.|Los cuatro juegos en cinco capítulos.
complete.|completados.
ONE GAME|UN SOLO JUEGO
Quick Play|Partida rápida
Quick Play · one game.|Partida rápida · un solo juego.
Pick Jump, Melody, Maze, or Tap Race. Choose your difficulty.|Elige Saltos, Melodía, Laberinto o Carrera y tu dificultad.
Play with Friends|Jugar con amigos
A live tap race. Share a room code.|Una carrera en vivo. Comparte el código de sala.
Create room →|Crear sala →
Join room →|Entrar a una sala →
Your high scores|Tus récords
Your high scores.|Tus récords.
Personal bests for every style, saved on this device.|Tus mejores marcas de cada juego, guardadas en este dispositivo.
View high scores →|Ver récords →
YOUR RACING SPIRIT|TU ESPÍRITU CORREDOR
Ghost shop →|Tienda fantasmal →
Change character →|Cambiar personaje →
YOUR PLAYER|TU JUGADOR
Player settings →|Ajustes del jugador →
Pick a nickname when you start|Elige un apodo al empezar
Made of moonlight & mischief.|Hecho de luz de luna y travesuras.
Music & volume|Música y volumen
Music & volume →|Música y volumen →
Tap-race course map →|Mapa de carreras →
Choose your character.|Elige tu personaje.
Tap a ghost to race as them. Your character also selects your team.|Toca un fantasma para jugar con él. Tu personaje también elige tu equipo.
Ghost falcon|Halcón fantasma
Ghost serpent|Serpiente fantasma
Ghost wolf|Lobo fantasma
Tiny ghost bat|Pequeño murciélago fantasma
THE GHOST FALCON|EL HALCÓN FANTASMA
THE GHOST SERPENT|LA SERPIENTE FANTASMA
THE GHOST WOLF|EL LOBO FANTASMA
THE GHOST BAT|EL MURCIÉLAGO FANTASMA
Fast & fearless|Veloz y valiente
Clever & slippery|Astuto y escurridizo
Loud & loyal|Ruidoso y leal
Chaotic & hyper|Caótico e hiperactivo
Fast and fearless.|Veloz y valiente.
Clever and slippery.|Astuto y escurridizo.
Loud and loyal.|Ruidoso y leal.
Chaotic and hyper.|Caótico e hiperactivo.
PLAYING AS|JUGANDO COMO
Choose|Elegir
Selected ✓|Seleccionado ✓
The Journey|La aventura
Your midnight journey.|Tu aventura de medianoche.
Start your journey|Comienza tu aventura
Continue your journey|Continúa tu aventura
ALL FOUR GAMES · 5 CHAPTERS|LOS CUATRO JUEGOS · 5 CAPÍTULOS
Every midnight conquered!|¡Conquistaste todas las medianoches!
You completed all four game styles across five chapters.|Completaste los cuatro juegos en cinco capítulos.
Play the journey again →|Volver a jugar la aventura →
All 20 games complete!|¡Completaste los 20 juegos!
Adventure|Aventura
QUICK PLAY|PARTIDA RÁPIDA
QUICK PLAY · ONE STANDALONE GAME|PARTIDA RÁPIDA · UN SOLO JUEGO
ADVENTURE · SERIES OF LEVELS|AVENTURA · SERIE DE NIVELES
Choose one standalone game. You still earn coins and score.|Elige un solo juego. También ganas monedas y puntos.
You’re playing a series. Choose a style for this level; a win opens the next.|Estás jugando una serie. Elige un juego para este nivel; al ganar se abre el siguiente.
Moonlight Melody|Melodía lunar
Moonlit Leap|Saltos de luna
Ghostlight Maze|Laberinto fantasmal
Tap Race|Carrera de toques
hit the notes|sigue las notas
jump & dodge|salta y esquiva
collect & escape|recolecta y escapa
quick challenges|retos rápidos
A little adventure between midnights.|Una pequeña aventura entre medianoches.
Start with Melody, then explore the candlelit jumping course.|Empieza con Melodía y después salta por el recorrido iluminado con velas.
Follow the notes through a little Halloween magic.|Sigue las notas y la magia de Halloween.
Jump through a candlelit graveyard inspired by Día de los Muertos.|Salta por un cementerio iluminado con velas e inspirado en el Día de los Muertos.
ARROWS / TAP · START HERE →|FLECHAS / TOCAR · EMPIEZA AQUÍ →
SPACE / TAP · PLAY SECOND →|ESPACIO / TOCAR · SEGUNDO JUEGO →
CHOOSE YOUR CHARACTER|ELIGE TU PERSONAJE
PICK YOUR NICKNAME · WE’LL REMEMBER IT|ELIGE TU APODO · LO RECORDAREMOS
NICKNAME|APODO
YOUR NICKNAME|TU APODO
RACING AS|JUGANDO COMO
Change nickname|Cambiar apodo
Grave guest|Visitante nocturno
DIFFICULTY|DIFICULTAD
Chill · start easy|Tranquilo · empieza fácil
Spooky · a little faster|Escalofriante · un poco más rápido
Fiendish · a real challenge|Diabólico · un verdadero reto
CHILL|TRANQUILO
SPOOKY|ESCALOFRIANTE
FIENDISH|DIABÓLICO
SONG|CANCIÓN
LEVEL|NIVEL
Level|Nivel
Song|Canción
Stage|Etapa
Play selected song|Reproducir canción elegida
Start the midnight dash →|Empezar la aventura →
Let’s make some mischief →|¡A hacer travesuras! →
Gathering a little moonlight…|Reuniendo un poco de luz de luna…
Gathering moonlight…|Reuniendo luz de luna…
Board and controls ready. Your adventure starts after GO!|Todo listo. La aventura empieza después de ¡YA!
GO!|¡YA!
Pause Ⅱ|Pausar Ⅱ
Pause|Pausar
Resume ▶|Continuar ▶
A little moonlit breather.|Un descanso a la luz de la luna.
Tap Pause again, or press Escape, to continue.|Toca Pausa otra vez o pulsa Escape para continuar.
Home|Inicio
← Home|← Inicio
Back home|Volver al inicio
Back|Atrás
Close dialog|Cerrar ventana
Choose a play mode|Elige cómo jugar
Moonlit Woods|Bosque a la luz de la luna
Mexican Graveyard|Cementerio mexicano
American Graveyard|Cementerio estadounidense
Lantern River Garden|Jardín del río de los faroles
Monster Bash Woodland|Bosque de la fiesta de monstruos
Inspired by Día de los Muertos|Inspirado en el Día de los Muertos
Día de los Muertos · Candlelit woodland|Día de los Muertos · Bosque a la luz de las velas
Inspired by Día de los Muertos: a beautiful Mexican graveyard with multicolored memorial lights, decorated graves, candles and marigolds.|Inspirado en el Día de los Muertos: un hermoso cementerio mexicano con luces multicolores, tumbas decoradas, velas y flores de cempasúchil.
A classic American-style cemetery: gray headstones, bare trees and silver moonlit fog.|Un cementerio estadounidense clásico: lápidas grises, árboles sin hojas y niebla plateada bajo la luna.
A peaceful lantern garden inspired by Japanese Obon traditions of remembering ancestors.|Un tranquilo jardín de faroles inspirado en la tradición japonesa del Obon para recordar a los antepasados.
Collect every candy, dodge the pursuers, then reach the glowing house. Arrows / WASD, swipe, or use the arrows below.|Recoge todos los dulces, esquiva a los perseguidores y llega a la casa iluminada. Usa las flechas / WASD, desliza o toca las flechas de abajo.
Collect the candy, avoid woodland creatures, and enter the glowing house. Arrows / WASD or swipe.|Recoge los dulces, evita las criaturas y entra en la casa iluminada. Usa flechas / WASD o desliza.
Tap the JUMP button to clear each obstacle. Keyboard: Space / ↑.|Toca SALTAR para superar cada obstáculo. Teclado: Espacio / ↑.
Run forward through the woods and jump over obstacles. Space or the Jump button.|Avanza por el bosque y salta los obstáculos. Usa Espacio o el botón SALTAR.
Hit the matching glowing notes on the line. Use the matching arrow keys (← ↓ ↑ →). Touch arrows work on phones too.|Toca cada nota cuando llegue a la línea. Usa las flechas correspondientes (← ↓ ↑ →). En el teléfono, toca los botones de flecha.
Hit each glowing note on the line, in time with the Halloween melody. Use the matching arrow keys (← ↓ ↑ →), or touch arrows on your phone. Five levels, five different Halloween instrumentals.|Toca cada nota en la línea al ritmo de la melodía. Usa las flechas (← ↓ ↑ →) o toca los botones en el teléfono. Cinco niveles y cinco temas de Halloween.
Chill: two arrows, fewer notes, forgiving timing.|Tranquilo: dos flechas, menos notas y más margen de tiempo.
JUMP|SALTAR
SPACE / ↑|ESPACIO / ↑
TAP ANYWHERE ON THIS BUTTON|TOCA CUALQUIER PARTE DEL BOTÓN
Maze direction controls|Controles del laberinto
Rhythm note pads|Botones de notas
Move up|Mover arriba
Move down|Mover abajo
Move left|Mover a la izquierda
Move right|Mover a la derecha
Pause to plan your route|Pausar para planear la ruta
Jump over the flower pots, calaveras and lanterns.|Salta las macetas, calaveras y faroles.
Follow the candy glow. The house opens when you have them all.|Sigue los dulces luminosos. La casa se abre cuando los recojas todos.
Follow the arrows. Press when each note meets the glowing line.|Sigue las flechas. Toca cuando cada nota llegue a la línea iluminada.
Follow the arrows. Tap as they meet the glowing line.|Sigue las flechas. Toca cuando lleguen a la línea iluminada.
Watch the first obstacle. One well-timed jump—you’ve got this!|Mira el primer obstáculo. ¡Un salto a tiempo y lo lograrás!
Listen to the intro—the arrows begin with the melody.|Escucha la introducción: las flechas empiezan con la melodía.
Three hearts · spare lives save your glow · +1 life every 2,500 score|Tres corazones · las vidas extra te salvan · +1 vida cada 2500 puntos
Spooktacular jump!|¡Un salto de miedo!
Boo-tiful! Follow the next glow.|¡Fantástico! Sigue la próxima luz.
A-maze-ing move!|¡Un movimiento encantado!
Spellbinding timing! ♪|¡Un ritmo hechizante! ♪
Boo-tiful beat! Keep the melody glowing.|¡Qué buen ritmo! Mantén viva la melodía.
Watch the glowing line. You’ve got the next note.|Mira la línea iluminada. ¡La próxima nota será tuya!
A little wobble. You’ve got this!|Un pequeño tropiezo. ¡Tú puedes!
Time for another midnight.|Hora de otra medianoche.
All candy collected! Follow the glowing house.|¡Recogiste todos los dulces! Ve a la casa iluminada.
A spare life saved your glow!|¡Una vida extra te salvó!
A spare life saved your glow! Keep going.|¡Una vida extra te salvó! Sigue adelante.
2,500 score—an extra life! Spellbinding!|¡2500 puntos: una vida extra! ¡Hechizante!
2,500 points—bonus life! Spooktacular!|¡2500 puntos: una vida extra! ¡De miedo!
A-maze-ing!|¡Laberinto conquistado!
Spellbinding rhythm!|¡Ritmo hechizante!
A leap of moonlight!|¡Un salto de luz de luna!
One more encore?|¿Otra canción?
Out of glow!|¡Se acabó tu energía!
A well-earned win. Your ghost looks rather proud.|Una victoria merecida. Tu fantasma está muy orgulloso.
Three fresh hearts are waiting on your next try.|Tres corazones nuevos te esperan en el próximo intento.
★ NEW PERSONAL HIGH SCORE|★ NUEVO RÉCORD PERSONAL
COINS|MONEDAS
COINS EARNED|MONEDAS GANADAS
SCORE THIS RUN|PUNTOS DE ESTA PARTIDA
SPARE LIVES|VIDAS EXTRA
Continue journey →|Continuar aventura →
Make this style harder →|Aumentar la dificultad →
Next level · choose any style →|Siguiente nivel · elige un juego →
Play this level again|Volver a jugar este nivel
Try again|Intentar de nuevo
View journey route|Ver recorrido de la aventura
Choose another single game|Elegir otro juego
Choose a style at this level|Elegir un juego de este nivel
High scores|Récords
All styles|Todos los juegos
Jump|Saltos
Maze|Laberinto
Rhythm|Ritmo
Race|Carrera
MELODY|MELODÍA
RACE|CARRERA
MAZE|LABERINTO
Run|Partida
Score|Puntos
Time|Tiempo
Saved in this browser. Each run keeps its style, level, score, and time.|Se guarda en este navegador. Cada partida conserva su juego, nivel, puntos y tiempo.
Your first high score is waiting. Play a game to set it!|¡Tu primer récord te espera! Juega para conseguirlo.
Your player.|Tu jugador.
Change your nickname or start fresh on this browser.|Cambia tu apodo o empieza de nuevo en este navegador.
Save nickname|Guardar apodo
Nickname saved.|Apodo guardado.
Reset Player…|Reiniciar jugador…
Reset this player?|¿Reiniciar este jugador?
Reset your player, coins, spare lives, score, and unlocked levels. You can keep your high-score history.|Reinicia tu jugador, monedas, vidas extra, puntos y niveles desbloqueados. Puedes conservar tus récords.
Your nickname, character choice, coins, spare lives, total score, and level progress will start over on this browser. This cannot be undone.|Tu apodo, personaje, monedas, vidas extra, puntos y niveles se reiniciarán en este navegador. Esta acción no se puede deshacer.
Keep my high scores|Conservar mis récords
Yes, start over|Sí, empezar de nuevo
Cancel|Cancelar
A fresh midnight. Your player has been reset.|Una nueva medianoche. Tu jugador se ha reiniciado.
The costume cupboard.|El armario de disfraces.
Dress your ghost or stock up on extra lives.|Viste a tu fantasma o consigue vidas extra.
♥ Extra life|♥ Vida extra
◈ 200 · Buy|◈ 200 · Comprar
Witch hat|Sombrero de bruja
Bow tie|Corbatín
Party hat|Sombrero de fiesta
Moonlit tint|Brillo lunar
Ghost witch hat|Sombrero de bruja fantasmal
Propeller beanie|Gorro con hélice
spare lives|vidas extra
One extra life added to your stash!|¡Una vida extra añadida a tu reserva!
An extra life costs 200 coins. Earn more by racing!|Una vida extra cuesta 200 monedas. ¡Gana más en las carreras!
More races, more coins. Your next look can wait.|Más carreras, más monedas. Tu próximo atuendo puede esperar.
Halloween music|Música de Halloween
Home-page themes are separate from all five rhythm-game songs. Listen before choosing your background music.|La música del inicio es distinta de las cinco canciones de Melodía. Escucha antes de elegir tu música de fondo.
HOME-PAGE MUSIC|MÚSICA DEL INICIO
MUSIC VOLUME ·|VOLUMEN DE MÚSICA ·
The music button in the top corner mutes all sound.|El botón de música de la esquina superior silencia todo el sonido.
Music credits|Créditos musicales
Mute sound|Silenciar sonido
Unmute sound|Activar sonido
▶ Listen|▶ Escuchar
Ⅱ Pause preview|Ⅱ Pausar muestra
Preview background music|Escuchar música de fondo
Tap Listen again to start the preview.|Toca Escuchar otra vez para iniciar la muestra.
Your midnight awaits.|Tu medianoche te espera.
Your kind of haunt.|Tu lugar encantado.
Dead simple.|Así de fácil.
The party waits for no ghost.|La fiesta no espera a ningún fantasma.
Tap the right thing. First to the party wins.|Toca el objeto correcto. Gana quien llegue primero a la fiesta.
Tap the right thing, fast. Every correct tap moves your ghost forward. Grab items to mess with your friends. First to the party wins!|Toca rápido el objeto correcto. Cada acierto hace avanzar a tu fantasma. Usa objetos para sorprender a tus amigos. ¡Gana quien llegue primero!
Solo starts with 3 hearts. A missed challenge costs a heart. Spare lives save you when your hearts run out; earn one every 2,500 score points or buy one for 200 coins. You can carry up to 3 spare lives.|En solitario empiezas con 3 corazones. Fallar un reto cuesta un corazón. Las vidas extra te salvan al quedarte sin corazones; ganas una cada 2500 puntos o puedes comprarla por 200 monedas. Puedes guardar hasta 3 vidas extra.
Each level is a short race. Level 1 takes 5 easy taps; later levels add more challenges and speed. Earn a podium place to open the next gate.|Cada nivel es una carrera corta. El nivel 1 requiere 5 toques fáciles; después aumentan los retos y la velocidad. Sube al podio para abrir el siguiente nivel.
Each challenge has one instruction. Miss one? Pull yourself together and try the next. Earn an item every 3 correct taps from Level 2.|Cada reto tiene una instrucción. ¿Fallaste? Intenta el siguiente. A partir del nivel 2, ganas un objeto cada 3 aciertos.
Every 3 correct taps earns an item.|Cada 3 aciertos ganas un objeto.
Level 1: five easy taps. Items join the fun in Level 2.|Nivel 1: cinco toques fáciles. Los objetos aparecen en el nivel 2.
ORIGINAL TAP-RACE COURSES|RECORRIDOS ORIGINALES DE CARRERA
Prefer the original tap challenges? Your race progress is right here.|¿Prefieres los retos originales? Aquí está tu progreso de carreras.
Spiral-Hill Graveyard|Cementerio de la colina espiral
The Graveyard|El cementerio
Crooked Pumpkin Patch|Calabazal torcido
Pumpkin Patch|Calabazal
Leaning Haunted House|Casa encantada inclinada
Haunted House|Casa encantada
Monster Bash Bell Tower|Campanario de la fiesta de monstruos
The Monster Bash|La fiesta de monstruos
Five easy taps to the finish. Pumpkins, moons, potions and friendly ghosts.|Cinco toques fáciles hasta la meta. Calabazas, lunas, pociones y fantasmas amistosos.
Meet the bat and candle. One tap at the right moment.|Conoce al murciélago y la vela. Un toque en el momento justo.
Watch the candles. Spot the odd ghost. Stay one tap ahead.|Observa las velas. Encuentra al fantasma diferente. Mantén la ventaja.
Twelve challenge types. Faster rivals. One spectacular entrance.|Doce tipos de retos. Rivales más rápidos. Una entrada espectacular.
Complete the previous level to unlock.|Completa el nivel anterior para desbloquearlo.
Pumpkin Pick|Elige la calabaza
Bat Smash|Atrapa al murciélago
Candle Out|Apaga la vela
Haunted Door|Puerta encantada
Candy Count|Cuenta los dulces
Odd One Out|Encuentra al diferente
Moon Match|Busca la luna
Potion Pick|Elige la poción
Spider Spot|Busca la araña
Ghost Peek|Encuentra al fantasma
Lantern Glow|Farol encendido
Candy Corn Hunt|Busca el dulce de maíz
Tap ONE pumpkin. Leave the skulls alone.|Toca UNA calabaza. No toques las calaveras.
Tap the bat ONCE before it escapes.|Toca al murciélago UNA VEZ antes de que escape.
Wait until the flame goes OUT, then tap ONCE.|Espera a que la llama se APAGUE y toca UNA VEZ.
Tap ONCE on the door that is NOT shaking.|Toca UNA VEZ la puerta que NO se mueve.
Tap the biggest candy pile ONCE.|Toca UNA VEZ el montón de dulces más grande.
Tap the ONE tilted ghost.|Toca el ÚNICO fantasma inclinado.
Tap the crescent MOON once—not the sun or star.|Toca UNA VEZ la LUNA creciente; no el sol ni la estrella.
Tap the BLUE potion once.|Toca UNA VEZ la poción AZUL.
Tap the SPIDER once—not an empty web.|Toca UNA VEZ la ARAÑA; no una telaraña vacía.
Tap the friendly GHOST once—not a tombstone.|Toca UNA VEZ al FANTASMA amistoso; no una lápida.
Tap the LIT lantern once.|Toca UNA VEZ el farol ENCENDIDO.
Tap ONE candy corn—not a bone.|Toca UN dulce de maíz; no un hueso.
WAIT… FLAME IS STILL LIT|ESPERA… LA LLAMA SIGUE ENCENDIDA
FLAME OUT · TAP ONCE!|LLAMA APAGADA · ¡TOCA UNA VEZ!
Wait. The flame is still burning. Do not tap yet.|Espera. La llama sigue encendida. Todavía no toques.
Flame out. Tap once now.|Llama apagada. Toca una vez ahora.
Not yet! Wait for the flame to go out, then tap once.|¡Todavía no! Espera a que se apague la llama y toca una vez.
One tap per round. You’ve got this!|Un toque por ronda. ¡Tú puedes!
Spooktacular tap!|¡Un toque de miedo!
Boo-tiful timing!|¡Qué buen momento!
That’s the spirit!|¡Ese es el espíritu!
Fangtastic! Keep glowing.|¡De miedo! Sigue brillando.
A wicked good tap!|¡Un toque embrujadamente bueno!
You’re haunting this race!|¡Estás arrasando en esta carrera!
Ghostly good work!|¡Un trabajo fantasmal estupendo!
Keep that magical momentum!|¡Mantén ese impulso mágico!
A little ghostly wobble. Try the next one!|Un pequeño tropiezo fantasmal. ¡Intenta el siguiente!
Boo! A fresh chance is coming.|¡Buu! Se acerca otra oportunidad.
One slip won’t stop your glow.|Un tropiezo no apagará tu brillo.
A tiny spook-up. You’ve got the next one!|Un pequeño susto. ¡La próxima será tuya!
Shake off the cobwebs. Next round!|Sacúdete las telarañas. ¡Siguiente ronda!
That one drifted away. Watch for the next!|Ese se escapó. ¡Prepárate para el siguiente!
Missed the moment—your next chance is coming.|Pasó el momento, pero viene otra oportunidad.
A fresh round is on its way. You’ve got this!|Se acerca otra ronda. ¡Tú puedes!
A little moonlight hustle—you’ve got this!|¡Un empujoncito de luz de luna! ¡Tú puedes!
One good tap at a time. Close that gap!|Un buen toque a la vez. ¡Acércate a la meta!
Your next boost could turn this race around.|Tu próximo impulso podría cambiar la carrera.
Keep glowing—the party’s still within reach!|¡Sigue brillando! ¡Aún puedes llegar a la fiesta!
Arm Toss|Lanzahuesos
Sugar Rush|Subidón de azúcar
Tombstone Drop|Caída de lápida
Brain Freeze|Congelación fantasmal
Sunrise|Amanecer
Brain freeze!|¡Congelación fantasmal!
Too bright!|¡Demasiada luz!
Smash tombstone|Romper lápida
Show / hide|Mostrar / ocultar
A little magical trouble is ready. Tap to use it!|Tienes una travesura mágica lista. ¡Toca para usarla!
✧ Empty item slot|✧ Sin objeto
✧ Items start in Level 2|✧ Los objetos aparecen en el nivel 2
THE PRE-PARTY|ANTES DE LA FIESTA
Gather your ghouls.|Reúne a tus fantasmas.
Invite your favorite ghouls.|Invita a tus fantasmas favoritos.
Create a room, share its four-letter code, then race together.|Crea una sala, comparte el código de cuatro letras y compitan juntos.
Enter the four-letter code from your host.|Escribe el código de cuatro letras del anfitrión.
ROOM CODE|CÓDIGO DE SALA
Fill empty seats with computer racers|Completar la sala con rivales automáticos
Up to 6 players. Stay on this screen until the host starts.|Hasta 6 jugadores. Quédate aquí hasta que el anfitrión comience.
Copy room code →|Copiar código de sala →
Share this room code with your friends|Comparte este código con tus amigos
Room code copied!|¡Código de sala copiado!
← Leave room|← Salir de la sala
Leave race →|Salir de la carrera →
Ready to race!|¡Listos para correr!
Live race positions|Posiciones en vivo
Full race track|Recorrido completo
The gang’s almost here|El grupo ya casi llega
Waiting for the host to rematch…|Esperando a que el anfitrión reinicie…
Waiting for the other racers…|Esperando a los demás corredores…
Next challenge…|Siguiente reto…
Connection lost. Rejoining your race…|Conexión perdida. Volviendo a la carrera…
Can’t reach the race server. Check your connection.|No se puede conectar al servidor. Revisa tu conexión.
Could not connect. Try again.|No se pudo conectar. Inténtalo de nuevo.
That race has drifted away. Start a new one.|Esa carrera terminó. Inicia otra.
Browser storage is unavailable. Rewards last for this visit.|El almacenamiento no está disponible. Las recompensas durarán esta visita.
The moonlight is taking a moment.|La luz de luna está tardando un poco.
Return home and try again to load the artwork.|Vuelve al inicio e inténtalo de nuevo para cargar las imágenes.
You made an entrance!|¡Qué gran entrada!
SO CLOSE!|¡CASI LO LOGRAS!
Your hearts ran out. Retry with three fresh hearts, or stock up on spare lives in the shop.|Te quedaste sin corazones. Inténtalo con tres corazones nuevos o consigue vidas extra en la tienda.
One more midnight →|Otra medianoche →
Next level →|Siguiente nivel →
TEAM POINTS|PUNTOS DEL EQUIPO
4th place|4.º puesto
You’re in the lead!|¡Vas en primer lugar!
A rival|Un rival
Team|Equipo
YOUR|TU
YOU|TÚ
Your midnight awaits.|Tu medianoche te espera.
Fashionably dead. Right on time.|Con estilo fantasmal. Justo a tiempo.
Four rival teams. One very questionable trophy.|Cuatro equipos rivales. Un trofeo muy peculiar.
Follow the woodland glow to the Monster Bash.|Sigue el resplandor del bosque hasta la fiesta de monstruos.
Race you to the Monster Bash.|Te reto a llegar primero a la fiesta de monstruos.
Skip|Saltar
Start over|Empezar de nuevo
Let the pumpkin decide 🎃|Que decida la calabaza 🎃
🎃 The pumpkin asks…|🎃 La calabaza pregunta…
Pick a midnight snack.|Elige un tentempié de medianoche.
Your ideal superpower?|¿Tu superpoder ideal?
Your party entrance?|¿Tu entrada a la fiesta?
Secret knock?|¿Tu toque secreto?
Moon cheese|Queso lunar
A pickled toad|Un sapo encurtido
Candy corn|Dulce de maíz
A crunchy bone|Un hueso crujiente
Impossible speed|Velocidad imposible
Slipping out of trouble|Escapar de los problemas
A legendary howl|Un aullido legendario
Absolute chaos|Caos absoluto
Dive in first|Entrar volando
Sneak through a window|Colarse por una ventana
Howl from the roof|Aullar desde el tejado
Hang upside down|Colgarse boca abajo
Take off|Despegar
Language|Idioma
Change language|Cambiar idioma
Coins|Monedas
Obstacles|Obstáculos
Collected|Recogidos
Accuracy|Precisión
Combo|Racha
Best|Mejor
Hearts|Corazones
Lives|Vidas
LEFT|IZQUIERDA
RIGHT|DERECHA
UP|ARRIBA
DOWN|ABAJO
`;
  const extra = `
Moonlit piano and strings|Piano y cuerdas bajo la luna
original piano-and-strings Halloween theme|tema original de Halloween con piano y cuerdas

Endless|Sin fin
Marathon|Maratón
the course is getting faster!|¡el recorrido va más rápido!

RUN LENGTH|DURACIÓN DE LA PARTIDA
Classic · short course|Clásico · recorrido corto
Marathon · longer and faster|Maratón · más largo y más rápido
Endless · keep going|Sin fin · sigue saltando
Longer run →|Recorrido más largo →
Endless run →|Partida sin fin →
Wave|Etapa

ROUND|RONDA
CORRECT TAPS TO FINISH|ACIERTOS PARA LLEGAR A LA META
TO THE BASH|HASTA LA FIESTA
to a bonus life|para una vida extra
correct taps until your next item.|aciertos para el próximo objeto.
in a row—spellbinding!|seguidos: ¡hechizante!
Let’s race →|¡A correr! →
Join the party →|Entrar a la fiesta →
selected|seleccionado
ASLEEP|DESCONECTADO
HOST|ANFITRIÓN
READY|LISTO
GETTING READY|PREPARÁNDOSE
Not ready yet|Aún no estoy listo
I’m ready →|Estoy listo →
Room code:|Código de sala:

wins!|¡gana!
You finished|Terminaste en el puesto
There’s always another midnight.|Siempre hay otra medianoche.
So close…|Tan cerca…
Next midnight…|La próxima medianoche…
RUN TIME|TIEMPO DE PARTIDA
WINNING TIME|TIEMPO GANADOR
You made it through every gate. The Monster Bash is yours!|¡Superaste todas las puertas! ¡La fiesta de monstruos es tuya!
Next gate open:|Siguiente puerta abierta:
Place in the top three with 5 correct taps to open the next gate.|Queda entre los tres primeros con 5 aciertos para abrir la siguiente puerta.
(you)|(tú)

place|puesto
Room|Sala
pieces of candy|dulces
Tilted ghost|Fantasma inclinado
pumpkin|calabaza
skull|calavera
bat|murciélago
candle|vela
door|puerta
sun|sol
star|estrella
potion-blue|poción azul
potion-red|poción roja
potion-green|poción verde
spider|araña
web|telaraña
tombstone|lápida
lantern-lit|farol encendido
lantern-dark|farol apagado
candy-corn|dulce de maíz
bone|hueso
Start with jumping, then follow the Halloween melody.|Empieza con los saltos y después sigue la melodía de Halloween.
SPACE / TAP · START HERE →|ESPACIO / TOCAR · EMPIEZA AQUÍ →
ARROWS / TAP →|FLECHAS / TOCAR →

Wear|Usar
You:|Tú:
Out|Fuera
A fresh chance is coming.|Se acerca otra oportunidad.
A little ghostly wobble!|¡Un pequeño tropiezo fantasmal!
You and three delightfully unreliable rivals.|Tú y tres rivales impredecibles.
The graveyard is busy. Try again soon.|El cementerio está lleno. Inténtalo de nuevo pronto.
Room not found. Check those four letters.|No se encontró la sala. Revisa las cuatro letras.
Room not found.|No se encontró la sala.
Room is full. Six souls is the limit.|La sala está llena. El límite es de seis jugadores.
That race has already started.|Esa carrera ya comenzó.
Wait for every racer to get ready.|Espera a que todos los corredores estén listos.
Something went bump. Try again.|Algo salió mal. Inténtalo de nuevo.
No room selected.|No se ha elegido una sala.
No races yet.|Todavía no hay partidas.
View journey route|Ver recorrido de la aventura
Start this adventure level|Empezar este nivel
Play this game|Jugar este juego
start easy|empieza fácil
Game board.|Tablero de juego.
game board.|tablero de juego.
Hits|Aciertos
Misses|Fallos
Final score|Puntuación final
Time to party!|¡Hora de la fiesta!
NEW BEST|NUEVO RÉCORD

Play this game|Jugar este juego
Start this adventure level|Empezar este nivel
Candy|Dulces
Notes|Notas
spare|extra
coins|monedas
pts|pts
points|puntos
points until your next one.|puntos para la siguiente.
to bonus|para la próxima vida
hearts remaining|corazones restantes
Playful theatrical Halloween march|Marcha teatral y divertida de Halloween
Witchy house groove|Ritmo house embrujado
Gentle, eerie flute and choral lullaby|Una nana misteriosa con flauta y coros suaves
Dark gothic organ, strings and bells|Órgano gótico, cuerdas y campanas
Moonlit castle finale|Final en el castillo a la luz de la luna
Original|Original
Listen to|Escuchar
Chapter|Capítulo
Game|Juego
Next:|Siguiente:
Journey|Aventura
Question|Pregunta
of|de
You have|Tienes
One is used automatically when your hearts run out.|Se usa una automáticamente al quedarte sin corazones.
Looking dead good.|¡Un estilo de ultratumba!
Earn a free spare life every 2,500 score points (maximum 3 spares).|Gana una vida extra cada 2500 puntos (máximo 3 vidas extra).
Play again →|Jugar de nuevo →
Back in|Vuelves en
Tap to smash it.|Toca para romperla.
taps left.|toques restantes.
Leading:|En primer lugar:
is raising the roof.|está animando la fiesta.
Start race →|Empezar carrera →
Start race|Empezar carrera
Join race →|Entrar a la carrera →
Your room is ready.|Tu sala está lista.
Waiting for players…|Esperando jugadores…
READY|LISTO
HOST|ANFITRIÓN
Computer|Rival automático
Copied!|¡Copiado!
Equip|Equipar
Equipped|Equipado
Owned|Comprado
Buy|Comprar
Home page|Inicio
Jumping game|Juego de saltos
Rhythm game|Juego de ritmo
original theatrical Halloween march|marcha teatral original de Halloween
original witchy house instrumental|tema house embrujado original
original eerie lullaby|nana misteriosa original
original gothic instrumental|tema gótico original
Back to Midnight Ghost Arcade|Volver a Midnight Ghost Arcade
Instrument library license|Licencia de la biblioteca de instrumentos
Source for the other recordings:|Fuente de las demás grabaciones:
Distributed under|Distribuido bajo
license text|texto de la licencia
permits private and commercial music creation.|permite crear música para uso privado y comercial.
Midnight Ghost Arcade uses these finished instrumental recordings from the game soundtrack:|Midnight Ghost Arcade utiliza estas grabaciones instrumentales de su banda sonora:
A Mexican-inspired instrumental selected for the Día de los Muertos mood; not a traditional ceremonial recording.|Un tema instrumental de inspiración mexicana elegido para el ambiente de Día de los Muertos; no es una grabación ceremonial tradicional.
The four originals were arranged for Midnight Ghost Arcade and rendered with sampled virtual instruments from GeneralUser GS by S. Christian Collins. They use original melodies, without samples or melodies from the reference film songs.|Los cuatro temas originales se crearon para Midnight Ghost Arcade con instrumentos virtuales de GeneralUser GS, de S. Christian Collins. Sus melodías son originales y no contienen muestras ni melodías de las canciones de referencia.
The game copies use gentle loudness normalization and MP3 re-encoding. Rhythm charts use original melody cue times or measured audible attacks; the music itself is played as a full recording rather than synthesized note loops.|Las grabaciones del juego tienen el volumen equilibrado y están en formato MP3. Las notas siguen los tiempos de las melodías originales o los ataques audibles de las grabaciones. La música se reproduce como pistas completas.
`;
  const exactCatalog = new Map(
    (entries + "\n" + extra)
      .trim()
      .split("\n")
      .filter((line) => line.includes("|"))
      .map((line) => line.split("|"))
      .map(([en, es]) => [en, es]),
  );
  const catalog = new Map(
    [...exactCatalog].map(([en, es]) => [en.toLowerCase(), es]),
  );
  const keys = [...catalog.keys()].sort((a, b) => b.length - a.length);
  const escape = (s) =>
    Array.from(s)
      .map((ch) => ("\\^$.*+?()[]{}|".includes(ch) ? "\\" + ch : ch))
      .join("");
  const phrases = new RegExp(
    "(^|[^\\p{L}\\p{N}])(" + keys.map(escape).join("|") + ")(?![\\p{L}\\p{N}])",
    "giu",
  );
  function translateText(value) {
    if (language !== "es") return value;
    if (/^Room code: [A-Z]{4}$/.test(value))
      return "Código de sala: " + value.slice(-4);
    const input = String(value),
      trimmed = input.trim().replace(/\s+/g, " "),
      direct = exactCatalog.get(trimmed) || catalog.get(trimmed.toLowerCase());
    if (direct)
      return (
        input.slice(0, input.search(/\S/)) +
        (trimmed === trimmed.toUpperCase() ? direct.toUpperCase() : direct) +
        input.slice(input.trimEnd().length)
      );
    return input
      .replace(phrases, (full, prefix, match) => {
        const translated =
          exactCatalog.get(match) || catalog.get(match.toLowerCase());
        return (
          prefix +
          (match === match.toUpperCase()
            ? translated.toUpperCase()
            : translated)
        );
      })
      .replace(/\b(\d+)(?:st|nd|rd|th)\b/g, "$1.º");
  }
  const originals = new WeakMap();
  const attrs = new WeakMap();
  const skip =
    "script,style,input,textarea,[data-i18n-skip],.nickname-summary strong,.score-table strong,.brand,.hero h1,.room-code";
  function textNode(node) {
    if (!node.parentElement || node.parentElement.closest(skip)) return;
    const old = originals.get(node);
    const original =
      old && node.data === old.translated ? old.original : node.data;
    const translated = translateText(original);
    if (original !== translated || old)
      originals.set(node, { original, translated });
    if (node.data !== translated) node.data = translated;
  }
  function attributes(el) {
    if (el.matches("script,style") || el.closest("[data-i18n-skip]")) return;
    let saved = attrs.get(el);
    if (!saved) {
      saved = {};
      attrs.set(el, saved);
    }
    for (const key of ["aria-label", "placeholder", "title", "alt"]) {
      if (!el.hasAttribute(key)) continue;
      const current = el.getAttribute(key),
        old = saved[key];
      const original =
        old && current === old.translated ? old.original : current;
      const icon =
        key === "aria-label" && language === "es"
          ? { moon: "luna", ghost: "fantasma" }[original]
          : null;
      const translated = icon || translateText(original);
      saved[key] = { original, translated };
      if (current !== translated) el.setAttribute(key, translated);
    }
  }
  function apply(node = document.body) {
    if (!node) return;
    if (node.nodeType === 3) {
      textNode(node);
      return;
    }
    if (node.nodeType !== 1) return;
    attributes(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNode(walker.currentNode);
    node
      .querySelectorAll("[aria-label],[placeholder],[title],[alt]")
      .forEach(attributes);
  }
  function setLanguage(value) {
    language = value === "es" ? "es" : "en";
    try {
      localStorage.setItem("midnight-language", language);
    } catch {}
    document.documentElement.lang = language;
    apply();
    document
      .querySelectorAll("[data-language]")
      .forEach((e) => (e.value = language));
    const title = document.querySelector("title");
    if (title) textNode(title.firstChild);
    root.dispatchEvent(
      new CustomEvent("midnight-language", { detail: language }),
    );
  }
  const selector = () =>
    `<label class="language-control" data-i18n-skip><span class="sr-only">English / Español</span><select data-language aria-label="English / Español"><option value="en" ${language === "en" ? "selected" : ""}>EN</option><option value="es" ${language === "es" ? "selected" : ""}>ES</option></select></label>`;
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-language]")) setLanguage(e.target.value);
  });
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") textNode(record.target);
      else if (record.type === "attributes") attributes(record.target);
      else for (const node of record.addedNodes) apply(node);
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-label", "placeholder", "title", "alt"],
  });
  root.MidnightI18n = {
    t: translateText,
    setLanguage,
    get language() {
      return language;
    },
    selector,
    apply,
  };
  setLanguage(language);
})(globalThis);
