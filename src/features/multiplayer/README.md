# Multiplayer client feature

This folder is reserved for the online multiplayer client. The existing single-player
and AI game loop remains in `src/App.tsx` during Stage 1.

Planned modules:

- `auth/` — Firebase Google sign-in and sign-out (Stage 2)
- `profile/` — player profile UI and persistence (Stage 2)
- `matchmaking/` — random opponent search and cancellation (Stage 3)
- `connection/` — WebSocket client and reconnect handling (Stage 4)
- `match/` — online match screen and synchronized player state (Stage 4)

Shared JSON-safe contracts live in `src/types/multiplayer.ts`.
