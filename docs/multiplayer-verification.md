# Multiplayer synchronization verification

Six independent Chromium browser contexts, alternating desktop and emulated iPhone layouts, completed a 15-round live Tap Race on the local server. All players joined through the real room UI.

Verified common server countdown timestamp; identical shared state broadcasts (players, progress, rankings, challenge contents and deadlines); matching on-screen instructions and choice order; a phone-layout refresh and session rejoin during the race; identical final winner, placement data and podium; host transfer after the original host left. No browser errors were recorded.

The harness uses the game client’s answer transport to automate all six racers in parallel, avoiding background-tab hit-testing delays. The candle’s changing accessible hint is normalized while comparing choice labels; its shared extinguish timestamp is still compared in the full state payload. Snapshots sharing a millisecond are compared after delivery settles. This tests synchronization and rendering, not six people’s physical touch input.

The public Render host was inaccessible from the execution environment. These results verify the local game server, not public internet latency or real physical iOS devices. They do not imply frame-perfect simultaneity. Network delivery and browser scheduling may produce brief visual delays.

Run: `npm run test:multiplayer-sync-browser`. Set `GAME_URL` to test another reachable host.
