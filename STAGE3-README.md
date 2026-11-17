# Stage 3 — Random matchmaking (development prototype)

## What is included
- Google-login-gated Random Match panel on the title screen.
- Express matchmaking endpoints: join, status polling, and leave/cancel.
- Two different signed-in UIDs are paired into a match ID.
- The existing single-player / AI game code is not changed.

## Run locally (two separate terminals)
1. Extract this ZIP and open the project folder in VS Code.
2. In Terminal 1 (project root):
   ```bash
   npm install
   npm run dev:server
   ```
   Keep this terminal open. Check `http://localhost:4000/health` — it should show stage 3.
3. In Terminal 2 (same project root):
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in Chrome and sign in with Google account A.
5. Open an Incognito window at the same URL and sign in with a different Google account B.
6. Click **Find Random Player** in both sessions. One should wait; the second should cause both screens to show “opponent found”.
7. Test **খোঁজা বাতিল করুন** by starting a search in one session and cancelling it.

## Important limitations — not production-ready yet
This stage proves queueing and pairing locally. The queue and matches are held in server memory, so restarting the server clears them. The server currently checks that a Firebase bearer token is present but does NOT cryptographically verify it or confirm that its UID matches the submitted UID. Do not deploy this prototype publicly or treat its match IDs/results as secure. Before public launch, Stage 3 hardening must add Firebase Admin token verification, a durable/atomic queue (for example Firestore or Redis), rate limits, and cleanup/expiry. Stage 4 will add live helicopter movement, score synchronization, countdown, disconnect/reconnect and server-authoritative results.
