# Uthao Dhaka — Stages 4B–4F multiplayer prototype

This package builds on the supplied Stage 4A project. The existing Single Player vs AI path remains the default when no online match has been found.

## Implemented in this prototype
- Stage 4B: the game shell owns a Socket.IO connection, so it remains connected after the title screen closes; opponent helicopter snapshots are rendered on the same Dhaka canvas.
- Stage 4C: local keyboard/touch controls continue to operate only the local helicopter; the opponent is rendered from remote snapshots and cannot be controlled locally. Position snapshots are sent at approximately 20 Hz.
- Stage 4D: each client runs its own passenger simulation and reports its current cash/trip result as a separate score.
- Stage 4E: server starts a shared 180-second clock when both players connect and announces the higher reported score as winner.
- Stage 4F: Socket.IO reconnect is enabled; server retains last position and score in memory and sends the opponent's latest snapshot to a reconnecting player.

## Run locally
1. Copy your existing `.env.local` into this project (do not share it).
2. Copy `.env.server.example` to `.env.server`; set `CLIENT_ORIGIN=http://localhost:3000`.
3. Terminal 1: `npm install` then `npm run dev:server`.
4. Terminal 2: `npm run dev`.
5. Open two browser sessions with two different Google accounts. Find Random Player in both; once matched and both show 2/2 connected, click the green “Start Game / খেলা শুরু করুন” button in each browser session.

## Important prototype limitations — do not deploy publicly as a competitive production game yet
- Matchmaking, room membership, snapshots, scores and reconnect state are stored in process memory. Restarting the server loses active matches; multiple server instances are not coordinated.
- The existing HTTP matchmaking endpoint only checks that an Authorization Bearer header exists. It does not verify the Firebase ID token cryptographically. Socket.IO room membership is also based on the existing in-memory Stage 4A assignment. Add Firebase Admin token verification to both HTTP and Socket.IO before public release.
- Passenger pickup/drop-off is still simulated independently on each client. The server accepts client-reported cash with a monotonic/capped update, but it does not validate passenger identity, route, landing, fare, or trip completion. Therefore the winner is a prototype result, not cheat-resistant or authoritative.
- Reconnection restores the latest helicopter snapshot and score only while the same server process remains alive.
- Both players should start within the same match; this prototype starts its clock once both room connections are present.

## Required production hardening
Use Firebase Admin verification, server-authoritative passenger and scoring rules, a persistent atomic match store (for example Redis), match expiry/cleanup, rate limits, payload validation, and multi-instance Socket.IO coordination before launch.


## Start Game button fix
The matchmaking panel now displays a dedicated green Start Game button after the match room confirms that both players are connected (2/2). It calls the existing game start handler; the normal single-player launch button remains available below.


## Online match rules update (November 2026)

- Online matches have a maximum duration of **10 minutes**.
- The match clock begins only after both players press Start Game.
- The online route map is compacted during online play; the score panel is placed below it on the right side to prevent overlap.
- Using the in-game Finish Session action during an online match forfeits the match.
- If a player closes the tab or loses connection, they have a **20-second reconnection grace period**. If they do not reconnect, they lose by disconnection.
- At 10 minutes, the server compares the latest scores and announces the winner or a draw.

The current prototype still keeps match state in server memory. Restarting the backend ends active matches, and score reports are not yet fully server-authoritative.


## Blank localhost screen fix (November 17, 2026)

A runtime temporal-dead-zone error occurred because `handleOnlineStartGame` and
`handleFinishSession` referenced `startNewGame` / `triggerGameOver` before those
callbacks were initialized. Both handlers have been moved below their dependencies.

The Dhaka mini-map now retains its original full size in online mode, matching
Single Player vs AI. The online scoreboard is smaller and positioned beneath
the map on the right side.


## Online match result handling update

- The in-game **Finish Session** control now sends `match:forfeit` during online play.
- The remaining player receives a win result and is moved to the game-over screen.
- A player who forfeits receives a loss result.
- If a disconnected player fails to reconnect within 20 seconds, the connected opponent wins.
- Online game-over UI now shows **Your score** and **Online opponent score**, with a congratulations message for the winner. It no longer shows the Player-vs-AI scorecard for online results.
- Returning to the match menu clears the finished online match from the local game shell.

The server currently stores matches in memory, and score values are still reported by clients. This is a prototype, not a cheat-resistant production tournament service.


## Rematch / stale match fix

- When a match finishes, the server removes both players' active `playerMatches` mappings so they can enter the random queue again.
- `/matchmaking/join` and `/matchmaking/status` ignore completed matches instead of returning the previous match ID.
- Completed room data is retained for 60 seconds for event delivery, then removed from memory.
- When a new match is found, the client clears the previous result, opponent position, opponent score and old timer before opening the new room.
- The online result screen no longer restarts the completed room through the generic Play Again action; players return to the menu and start a fresh random match.
