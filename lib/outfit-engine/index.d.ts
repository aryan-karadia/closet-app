// Type declarations for lib/outfit-engine/index.js (refs ISSUE-16).
// No em dashes are used in this file.
import type { AdviceRule, Item, Occasion, Season, Slot } from '../types';

export interface EngineItem extends Partial<Item> {
  id: string; name: string; category: string; season: Season; status: string;
  paletteScore?: number | null; paletteVerdict?: string | null; fitTags: string[];
  wearCount: number; primaryColorHex?: string | null;
}
export interface EngineOutfitItem { itemId: string; slot: Slot; item: EngineItem }
export interface EngineOutfit {
  items: EngineOutfitItem[]; missingSlots: Slot[];
  paletteScore: number; fitScore: number; contrastScore: number; rotationScore: number; totalScore: number;
  explanation: string[]; occasion: Occasion; season: Season;
  hasUnratedItems: boolean; unratedItemIds: string[]; allItemsUnrated: boolean;
}
export interface UnratedSummary { hasUnratedItems: boolean; unratedItemIds: string[]; allItemsUnrated: boolean }
export interface BuildInput {
  items: EngineItem[]; occasion: Occasion; season: Season; vibe?: string | null;
  adviceRules?: AdviceRule[]; disliked?: unknown[]; now?: string | null;
}
export type BuildResult = EngineOutfit[] & { diversityMessage?: string | null };
export function buildOutfits(input: BuildInput): BuildResult;
export function build(input: BuildInput): BuildResult;
export interface ShuffleCheck { valid: boolean; reason: string }
export interface ShuffleReplacementInput {
  replacement: EngineItem; outfitItems: EngineOutfitItem[]; slot?: Slot;
  occasion: Occasion; season: Season; disliked?: unknown[]; now?: string | null;
}
export function isInterviewExcluded(item: EngineItem): boolean;
export function seasonMatches(item: EngineItem, season: Season): boolean;
export function verdictAllowed(item: EngineItem, occasion: Occasion): boolean;
export function validateShuffleReplacement(input: ShuffleReplacementInput): ShuffleCheck;
export function isUnrated(item: EngineItem): boolean;
export function unratedSummary(entries: EngineOutfitItem[] | EngineItem[]): UnratedSummary;
export function slotForCategory(category: string, name?: string): Slot | null;
export function combinationKey(itemIds: string[]): string;
export function isDisliked(combinationIds: string[], disliked: unknown[], now?: string | null): boolean;
