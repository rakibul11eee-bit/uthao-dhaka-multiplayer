/**
 * Client/server contracts for Uthao Dhaka multiplayer.
 * Keep these payloads JSON-serializable; do not put React or browser objects here.
 */

export type MultiplayerConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export type MatchmakingStatus =
  | 'idle'
  | 'searching'
  | 'matched'
  | 'cancelled'
  | 'error';

export type OnlineMatchStatus =
  | 'waiting'
  | 'countdown'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

export interface PlayerProfile {
  /** Firebase Authentication UID; never use an email address as the player ID. */
  uid: string;
  displayName: string;
  photoURL: string | null;
  createdAt?: number;
}

export interface MatchmakingRequest {
  playerUid: string;
  requestedAt: number;
  /** Reserved for future region / skill matching. */
  region?: string;
}

export interface OnlinePlayerState {
  playerUid: string;
  /** World coordinates from the existing Dhaka map coordinate system. */
  x: number;
  y: number;
  altitude: number;
  headingAngle: number;
  score: number;
  updatedAt: number;
}

export interface OnlineMatch {
  matchId: string;
  status: OnlineMatchStatus;
  playerUids: [string, string];
  createdAt: number;
  startedAt: number | null;
  endsAt: number | null;
  winnerUid: string | null;
}

export interface MatchResult {
  matchId: string;
  status: 'completed' | 'abandoned';
  winnerUid: string | null;
  scores: Record<string, number>;
  completedAt: number;
}
