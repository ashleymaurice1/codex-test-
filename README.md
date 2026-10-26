# Midnight Zombies

A browser party racer: one-tap spooky challenges, original stitched zombie puppets, and ghost sidekicks. Solo runs against three bots; private rooms support up to six humans, with optional bots filling to four racers.

## Run

Node.js 20 or newer (developed with Node 24).

```sh
npm ci --cache /tmp/midnight-npm --no-audit --no-fund
npm start
```

Open the server on port 3000. `PORT` overrides it. `npm run dev` enables Node's file watcher. No accounts, API keys, external databases, or third-party services are needed. Fonts and media are bundled locally. Sound starts after a user gesture; the music button always toggles it.

```sh
npm test
```

For the optional full browser check, keep `npm start` running and run `npm run test:browser` in another terminal. It uses Playwright and `/usr/bin/chromium`; override `CHROMIUM_PATH` for another installed Chromium executable and `GAME_URL` for a different server URL. This check plays a complete portrait solo race, reaches the podium, and checks rewards survive refresh without duplication.

Tests exercise progression, all six challenge types, timing penalties, item effects, room errors and capacity, shared challenges, reconnects, and host migration through real WebSocket connections.

## Play

Pick Stumbles, Tutu Tina, Barkley, or Pumpkin Pete; select a team or answer the pumpkin's three questions. Play solo, or create a room and share its four-letter code with friends. Guests mark themselves ready and the host starts the race. Everyone receives the same timed challenges. Answer in one tap, earn an item every three successes, and tap the item slot to use it. Tombstones require three taps to clear. The race takes roughly fifteen successful challenges; after two minutes the leader wins if nobody has finished.

The server owns challenge validation, distance, item assignment/effects, placements, and bot decisions. Rooms and reconnect sessions are in memory. Refresh the same browser tab to rejoin. A disconnected racer sleeps while the race continues; another online racer inherits hosting. Server restarts end existing rooms. Coins, cosmetic purchases, personal team points and solo winning best times are saved in local browser storage. Points are personal, not global standings. No cross-device account sync is provided.

## Solo campaign and competition

Solo has four unlockable courses from the original brief: Spiral-Hill Graveyard, Crooked Pumpkin Patch, Leaning Haunted House, and Monster Bash Bell Tower. Earn a top-three finish with at least five correct taps to unlock the next course. Earn one to three stars for podium placement; your best medals and unlocked levels persist in browser storage. Replay earlier levels freely. The shared definitions in `public/levels.js` introduce three, four, five and then all six challenge types, reduce tap timers, and increase rival accuracy and item-use frequency. Room multiplayer uses the final course with all six shared challenges and is available immediately.

Bots race under the same server-side answer, progress, item and finish rules as humans. Their personalities differ in reaction speed and accuracy; they can win and attack the player. Bots save targeted attacks while leading and use them once a rival is ahead. Solo competitors use the exact racer names from the brief.

Run `npm run test:campaign-browser` against a running game for a full beginner race, level unlock, persistence after refresh, and start of Level 2. `npm run test:browser` covers a full final-course race with all six challenge types. `npm run test:rooms-browser` covers two-browser multiplayer, rejoining, and host transfer.

`docs/competition-entry.md` contains a project description and the supplied competition rules summary; `docs/midnight-zombies-cover.png` is a prepared cover image. No contest entry has been submitted.

## Art and audio direction

Mach's character direction comes from the user's newer reference video: a blue-white ghost falcon with streaming plumes, pointed beak, talons, blue collar, and a round **M** tag. The older reference guides the dark twisting forest opening and supplies the user-provided audio excerpt in `public/assets/opening.m4a`. Videos and their central logos are not embedded in the game. The character artwork and midnight village are original rendered image assets generated from the creator’s video references and written brief. They live in `public/assets/characters/` and `public/assets/midnight-village.webp`. The authored challenge illustrations and character rendering helpers live in `public/art.js`. Fonts are Grenze Gotisch and DM Sans, distributed under their bundled SIL Open Font Licenses. Mach's drawing is an interpretation of the reference, not a frame-by-frame recreation.

## Public hosting

Use a Node host supporting persistent WebSocket connections. `render.yaml` supplies a Render web-service configuration: install with `npm ci`, start with `npm start`, health check `/health`. The server listens on `0.0.0.0` and the host's `PORT`; HTTPS hosts automatically use secure WebSockets. Use a **single instance** for this version because rooms live in memory. A restart or sleeping free instance clears rooms. Multi-instance production hosting needs a shared room store and routing, which are outside this implementation.

No public deployment is created by running the local server or publishing a Codex development environment. Connect this repository to a compatible host and deploy it to obtain a public HTTPS game URL. The local browser and WebSocket checks do not validate that future deployment.

## Validation performed

Thirteen engine, progression and real-WebSocket tests passed. Desktop (1440px) and portrait phone (390px) browser checks found no script errors or horizontal overflow. A complete solo browser race encountered all six challenge types, reached the podium, earned rewards, and rejoined after refresh without awarding duplicate coins. `npm run test:rooms-browser` runs a separate two-context browser check that verified room creation/joining, ready/start, a shared challenge, refresh/rejoin, and host transfer. Public hosting and tuning a 50% casual-player win rate have not been validated.
