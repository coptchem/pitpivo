import type { CatKey, Met, Sex } from './catalog';
import type { PublicStats } from './calc';

/** Veřejný dokument users/{uid} — čtou ho všichni přihlášení (žebříček). Zapisuje klient jen `name`, `stats` počítá server. */
export interface PublicUser { name: string; emoji?: string; createdAt?: number; stats?: PublicStats; bot?: boolean }
/** Soukromý dokument users/{uid}/private/profile — čte a píše jen majitel. */
export interface PrivateProfile { kg: number; sex: Sex; met: Met; invitedBy?: string }
/** Můj profil v klientu = veřejná + soukromá část. */
export type UserDoc = PublicUser & Partial<PrivateProfile>;
export interface Member extends PublicUser { uid: string }
export interface Session {
  end: number; by: string; byName: string; scope: 'global' | 'pub'; pubId: string; pubName: string; closed: { beers: number; liters: number };
}
export interface PubDirEntry { id: string; name: string; emoji: string; members: number; bot?: boolean }
export interface Pub { id: string; name: string; emoji: string; code: string; ownerId: string; memberIds: string[]; session?: Session | null }
export interface Invite { code: string; name: string; kg: number; sex: Sex; createdBy: string; claimedBy?: string | null; createdAt: number }
export interface InviteFound { name: string; kg: number; sex: Sex }
export interface FeedEvent { id: string; pubId: string; uid: string; type: string; text: string; accent?: boolean; ts: number; aud?: 'all'; members?: string[] }
export interface Def { cat: CatKey; v: string; ml?: number | null }
export interface Toast { id: string; kicker: string; title: string; glyph: string }
export type Tab = 'count' | 'board' | 'game' | 'profile';
export type Range = 'today' | 'week' | 'total';
export type Theme = 'dark' | 'light';
