# Stage 4A — Real-time match rooms and player connections

## Added
- Socket.IO server attached to the existing Express backend.
- A paired player can join the Socket.IO room identified by the existing Match ID.
- The server checks that the submitted UID is one of the two players assigned to that match.
- Both clients receive room presence updates and a connected-player count.
- The matchmaking panel shows socket connection state and the two room members.
- Existing Single Player vs AI gameplay code remains untouched.

## Local test
1. Copy your working `.env.local` into this project root. Do not share its contents.
2. In the project root run `npm install`.
3. Terminal 1: `npm run dev:server`
4. Terminal 2: `npm run dev`
5. Open `http://localhost:3000` in normal Chrome and Incognito.
6. Sign in using the two separate Google accounts used for Stage 3.
7. Both users click **Find Random Player**.
8. When paired, each screen should show `Connected` and `2/2 players connected`.
9. Close one browser tab. The other should show `1/2 players connected` after the server presence update. Reopen/rejoin is not yet a full reconnect workflow; that is a later step.

## Important security and deployment note
This is a local development milestone, not production-ready multiplayer infrastructure. The existing matchmaking endpoint only checks that a bearer token string exists; it does not verify the Firebase token cryptographically. The Socket.IO room join currently relies on the in-memory match membership map. Before public deployment, add Firebase Admin token verification to both HTTP and Socket.IO handshakes, rate limits, durable match storage, and robust multi-instance coordination. Do not expose this prototype as a public competitive game.

## Not included yet
No helicopter movement, passenger state, scores, game clock, or winner result is synchronized in Stage 4A. This milestone only proves that both matched players connect to the same live room. Those gameplay events are the next Stage 4 steps.
