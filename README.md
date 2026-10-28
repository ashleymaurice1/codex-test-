# Midnight Ghost Arcade

A moonlit Halloween arcade with four play styles and four original flowing ghost characters. Play Solo starts with the one-button Moonlit Leap course. Ghostlight Maze adds candy collection and roaming creatures. The original tap races support solo rivals and private multiplayer rooms with up to six humans.

## Run

Node.js 20 or newer (developed with Node 24).

```sh
npm ci --cache /tmp/midnight-npm --no-audit --no-fund
npm start
```

Open the server on port 3000. `PORT` overrides it. `npm run dev` enables Node's file watcher. No accounts, API keys, external databases, or third-party services are needed. Fonts and media are bundled locally. Sound starts after a user gesture; the music button always toggles it.  Full-length instrumental recordings are bundled in `public/assets/audio/recordings/`; no external audio service or keys are required.

```sh
npm test
```

For the optional full browser check, keep `npm start` running and run `npm run test:browser` in another terminal. It uses Playwright and `/usr/bin/chromium`; override `CHROMIUM_PATH` for another installed Chromium executable and `GAME_URL` for a different server URL. This check plays a complete portrait solo race, reaches the podium, and checks rewards survive refresh without duplication.

Tests exercise progression, all six challenge types, timing penalties, item effects, room errors and capacity, shared challenges, reconnects, and host migration through real WebSocket connections.

## Play

Choose Mach the ghost falcon, Slink the ghost serpent, Ember the ghost wolf, or Misty the tiny ghost bat; choosing a character selects its team. You can also answer the pumpkin's three questions. Play Solo begins with jumping; choose Ghostlight Maze for a candy-collecting maze, or Original Tap-Race Courses for the original solo races. Create a room and share its four-letter code with friends for synchronized tap racing. Guests mark themselves ready and the host starts the race. Everyone receives the same timed challenges. Answer in one tap, earn an item every three successes, and tap the item slot to use it. Tombstones require three taps to clear. Level 1 takes five correct taps; later levels increase to eight, twelve, and fifteen. Each solo answer advances to a new challenge after about one second. The final race takes roughly fifteen successful challenges; after two minutes the leader wins if nobody has finished.

The server owns challenge validation, distance, item assignment/effects, placements, and bot decisions. Rooms and reconnect sessions are in memory. Refresh the same browser tab to rejoin. A disconnected racer sleeps while the race continues; another online racer inherits hosting. Server restarts end existing rooms. Coins, cosmetic purchases, personal team points and solo winning best times are saved in local browser storage. Points are personal, not global standings. No cross-device account sync is provided.

## Solo campaign and competition

Solo has four unlockable courses from the original brief: Spiral-Hill Graveyard, Crooked Pumpkin Patch, Leaning Haunted House, and Monster Bash Bell Tower. Earn a top-three finish with at least five correct taps to unlock the next course. Earn one to three stars for podium placement; your best medals and unlocked levels persist in browser storage. Replay earlier levels freely. The shared definitions in `public/levels.js` introduce four, eight, ten and then twelve challenge types, reduce tap timers, and increase rival accuracy and item-use frequency. Room multiplayer uses the final course with all twelve shared challenges and is available immediately.

Bots race under the same server-side answer, progress, item and finish rules as humans. Their personalities differ in reaction speed and accuracy; they can win and attack the player. Bots save targeted attacks while leading and use them once a rival is ahead. Solo competitors are the three other ghost teams, using Mach, Slink, Ember and Misty as their names.

Run `npm run test:campaign-browser` against a running game for a full beginner race, level unlock, persistence after refresh, and start of Level 2. `npm run test:browser` covers a full final-course race with all twelve challenge types. `npm run test:rooms-browser` covers two-browser multiplayer, rejoining, and host transfer.

`docs/competition-entry.md` contains a project description and the supplied competition rules summary; `docs/midnight-zombies-cover.png` is a prepared cover image. No contest entry has been submitted.

## Art and audio direction

Mach's character direction comes from the user's newer reference video: a blue-white ghost falcon with streaming plumes, pointed beak, talons, blue collar, and a round **M** tag. The older reference guides the dark twisting forest opening and supplies the user-provided audio excerpt in `public/assets/opening.m4a`. Videos and their central logos are not embedded in the game. The playable ghost artwork and bioluminescent woodland are original rendered image assets generated from the creator’s video references and written brief. They live in `public/assets/characters/` and `public/assets/moonlit-woodland.webp`. The authored challenge illustrations and character rendering helpers live in `public/art.js`. Fonts are Grenze Gotisch and DM Sans, distributed under their bundled SIL Open Font Licenses. Mach's artwork is an interpretation of the reference, not a frame-by-frame recreation.

## Public hosting

Use a Node host supporting persistent WebSocket connections. `render.yaml` supplies a Render web-service configuration: install with `npm ci`, start with `npm start`, health check `/health`. The server listens on `0.0.0.0` and the host's `PORT`; HTTPS hosts automatically use secure WebSockets. Use a **single instance** for this version because rooms live in memory. A restart or sleeping free instance clears rooms. Multi-instance production hosting needs a shared room store and routing, which are outside this implementation.

No public deployment is created by running the local server or publishing a Codex development environment. Connect this repository to a compatible host and deploy it to obtain a public HTTPS game URL. The local browser and WebSocket checks do not validate that future deployment.

## Validation performed

Twenty-four engine, arcade, progression and real-WebSocket tests passed. Desktop (1440px) and portrait phone (390px) browser checks found no script errors or horizontal overflow. A complete solo browser race encountered all twelve challenge types, reached the podium, earned rewards, and rejoined after refresh without awarding duplicate coins. `npm run test:rooms-browser` runs a separate two-context browser check that verified room creation/joining, ready/start, a shared challenge, refresh/rejoin, and host transfer. The public HTTPS site and secure WebSocket solo/multiplayer connections have also been exercised. A 50% casual-player win rate has not been measured.

## Clear feedback and continuous music

Every challenge explicitly requires one tap except Tombstone Drop, which shows the remaining smash taps. Candle Out displays WAIT while lit and FLAME OUT · TAP ONCE when ready. Correct taps receive varied Halloween encouragement; missed or early taps get a brief, specific nudge. Catch-up hints only appear when the player is materially behind.

The server advances a solo player to the next challenge after a one-second celebration rather than leaving a completed grid on screen. Solo rivals keep independent challenge clocks, so answering faster does not prevent bots from taking their turns. Multiplayer retains shared challenge order and timing, and moves on early once all active racers have answered.

Music uses finished FreePD/CC0 recordings with gentle playback volume. The supplied reference excerpt remains archived as an asset, but synthesized music and short repeating musical clips are no longer used.

## Character choice

Solo, Create Room, and Join Room each include an illustrated **Choose your character** radio selector before entry. Mach, Slink, Ember, and Misty are available immediately; the chosen character also selects the matching team. The form remembers the last submitted choice. The homepage gallery also changes the selected character.

## Solo hearts and score rewards

Each solo race starts with three hearts. An incorrect or timed-out challenge costs one heart; when the last heart is lost, one owned spare life is consumed automatically to keep the player in the race with one heart. Without a spare, the run ends and can be retried with three fresh hearts. Multiplayer races retain their shared racing rules without solo elimination.

Each correct solo answer earns 100 persistent score points. Every 2,500 points earns one spare life; rewards do not repeat after refresh. The ghost shop sells a spare life for 200 coins, up to a stash of 3. Score and unused spare lives persist in the same browser. No cash purchases or accounts are involved.

`npm run test:characters-browser` verifies character choice for solo/create/join, remembered choices, sticky live race positions, life purchases, balance protection, and saved inventory. The mobile full track is expandable; a compact live leaderboard stays visible above the challenge while scrolling.

## Jumping, mazes, and style progression

- **Moonlit Leap** is the default Level 1 solo style. The ghost runs automatically; jump with Space, Arrow Up, the canvas, or the large phone Jump button. Clear roots, pumpkins and tombstones. A witch and sleepy zombie inhabit the woodland.
- **Ghostlight Maze** uses arrows/WASD, phone direction buttons, or swipes. Collect every candy, then enter the glowing house. Mischievous witches, zombies and spiders roam the maze.
- Both solo adventures have five levels and three selectable difficulties: Chill, Spooky, and Fiendish. After a win, replay the same style at a higher difficulty or advance and choose any style. Unlocking an adventure level also opens the corresponding original tap-race course, capped at its final fourth course.
- New solo adventures run locally in the browser; room multiplayer remains the server-synchronized tap race. Original room and race functionality is retained.
- Score, bonus lives, coin rewards, medals and unlocked levels share the browser profile. Nicknames are requested once and reused across all styles, with an explicit Change nickname control.
- Winners perform one slow 2.45-second victory loop with a team-color trail, then settle still. Non-winning podium ghosts remain stationary with slumped poses and little disappointed thoughts. Reduced-motion preferences skip the victory flight.

`npm run test:arcade-browser` plays a complete jumping win using Space and a maze win using arrow keys, checks difficulty increases and next-style progression, verifies the nickname is not requested again, and confirms the victory animation stops. `test/arcade.test.js` checks maze connectivity, achievable jumps, difficulty scaling, pause behavior, collision lives and win rewards.

## Arcade polish and player controls

The homepage separates **Adventure** (a series with level unlocks), **Quick Play** (one standalone game), and live **Friends** rooms. Jump and maze games wait for their art to load and show a 3–2–1–GO countdown, with the board and controls fitted into the phone viewport. Jumping now has a higher arc and forward world movement; the maze uses slower, interpolated movement and buffered turns.

**Moonlight Melody** uses two, three or four arrow-key lanes and five finished instrumental recordings. Beat charts are detected from each audio file, and note judgments share the exact recording playback clock. Pause suspends both audio and game time.

Character atlases animate blinking, wings, breathing and expressions. Winners settle into a happy pose after their one victory flight, and other podium characters show disappointed expressions.

**High scores** saves personal run records by game style in this browser. **Player settings → Reset Player…** requires confirmation and offers a checked-by-default option to keep high scores. Reset clears the nickname, character choice, coins, spare lives, score and level unlocks for this browser; it preserves the audio preference.

`node scripts/profile-rhythm-browser-check.cjs` verifies rhythm gameplay with actual key presses, countdown and mobile viewport, Quick Play progression isolation, and reset cancel/keep/clear behavior. `test/records-rhythm.test.js` checks soundtrack synchronization, rhythm failure/pause, high-score ordering/deduplication and forward jump physics.


The five rhythm recordings are **Magic in the Garden** (Rafael Krux), **Creepy Comedy** (Rafael Krux), **Fright Night Twist** (Bryan Teoh), **Midnight in the Green House** (Kevin MacLeod), and **Night in the Castle** (Kevin MacLeod). The full recordings last over two minutes; rhythm rounds use progressively longer 45–65 second sections, with more arrow lanes and narrower timing windows. Chill uses two arrow lanes on every song, at least 1.5 seconds between notes, a 400 ms timing window and three consecutive misses per lost heart. Charts follow measured audible attacks and skip quiet passages instead of filling a fixed beat grid. Quick Play exposes all five songs with Listen/Pause previews.

Maze settings: Moonlit Woods; **Mexican Graveyard — inspired by Día de los Muertos** with multicolored memorial lights, decorated graves, candles and marigolds; **American Graveyard** with gray stones and fog; **Lantern River Garden**, inspired by Japanese Obon remembrance traditions; and Monster Bash Woodland. Quick Play exposes all settings with preview art. Memorial/lantern levels use roaming light wisps instead of Halloween creatures. These are artistic inspirations, not simulations of ceremonies.

Pose atlases now hold distinct idle, happy and disappointed expressions instead of crossfading unregistered silhouettes, fixing character-picker flicker. Faces blink softly about once every seven seconds, using a localized eye overlay while the body stays fixed.

`npm run test:rhythm-browser` checks all five songs with actual arrow-key input, four-lane controls and transport pause. `npm run test:scenes-browser` checks the new maze art, scene selection, mobile fit and stable character-picker poses.


Life balance now uses shared rules in `public/economy.js`: a spare every **2,500 points**, a maximum stash of **3**, and **200 coins** per shop life. Legacy stashes above three convert surplus lives to coins once at the original 80-coin price. Points beyond the cap do not bank future lives. Server and browser arcade games use the same thresholds.

Facial animation blends only small, feathered eyelid patches onto the registered idle pose, with a gentle half-second blink about every seven seconds. Character bodies stay fixed; happy and disappointed faces remain distinct at results. Reduced-motion preferences disable blinking.


**Start Journey / Continue Journey** now follows a fixed sequence: Jump → Maze → Rhythm → Tap Race in each of five chapters (20 games total). The next result button opens the next style automatically; nickname and journey position persist. Quick Play remains a standalone choice of style and level. Replaying a completed game cannot skip journey stops. The fifth chapter reuses the final Tap Race course.

Maze pursuers now follow actual paths toward the player during chase phases, with shorter scatter breaks, earlier visible encounters, and increasing speed/count on later stages and difficulties. An exclamation mark identifies an active pursuer. Contact costs a heart and disperses pursuers while preserving collected candy and offering a short invulnerable escape window.

`npm run test:journey-browser` checks the rhythm-to-race-to-next-chapter transition with actual inputs and persistence; `npm run test:faces-browser` verifies that only localized facial pixels animate while all body poses remain fixed. The arcade browser suite checks Jump → Maze progression with real keyboard input.


`public/music.js` plays the finished recordings through Web Audio buffer sources. It loads a song before the countdown, keeps at most two decoded recordings cached, and resumes the home-page recording at its previous position after a rhythm round. Background tracks rotate only when the full recording ends. There are no oscillator-generated music parts or single-note sample loops.


**Music & volume**, available in Player Settings and the home-page footer, allows choosing a background recording, listening first, and saving a volume preference. Recording previews silence background playback while listening and stop when their dialog closes. See `/music-credits.html` and the bundled CC0 license for recording provenance and artist credits.

`npm run test:music-transitions-browser` verifies previews, background choice, saved volume/mute settings, recording-clock gameplay, and resuming the previous home recording. `npm run test:music-browser` renders real recordings and verifies audible, unclipped, nonidentical sections. Optional `scripts/analyze-recordings.py` regenerates beat charts with librosa; audio analysis is not a runtime dependency.

Home-page music is a separate pool (Creepy Hallow by default, plus Witch Waltz); neither recording is used by the rhythm game. Jumping has its own full-length Mexican-inspired instrumental, Del Rio Bravo, separate from both pools. Entering a rhythm game immediately stops the home recording. Preview controls expose only Listen/Pause, with no native download menu. Browser audio remains technically capturable; this is a UI choice, not copy protection. HTML and JavaScript use revalidation and versioned entry scripts to ensure a refreshed page receives music updates.

The jumping course uses a dark Día de los Muertos-inspired cemetery with rows of gravestones draped in colorful lights, with painted calaveras, marigold pots and lantern obstacles, with a clear running lane and softly twinkling blue and amber lights below it. Maze backgrounds rotate Creepy Comedy, Fright Night Twist and Night in the Castle rather than the quieter greenhouse theme.

Spooky/Fiendish jumping runs increase speed, obstacle count and height, with closer but jumpable varied spacing. The path lights gently twinkle on an approximately eight-second cycle.

Phone controls jump immediately on pointer contact and disable text selection/callouts on control labels. Music unlocks its output synchronously on touchend/pointerup before asynchronous recording loading; mute preferences remain respected. Touch regression checks use phone emulation; physical iOS device verification is still useful.
