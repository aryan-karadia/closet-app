// Type declarations for lib/palette-ingester.js (refs ISSUE-03).
// No em dashes are used in this file.
import type { PaletteColor } from './types';

export interface ExtractedColour {
  name: string; family: string; role: 'core' | 'neutral' | 'avoid';
  sourcePage: number; beauty: boolean; sourceSection: string | null;
  hex: string | null; isManual: boolean; isAvoidRule?: boolean;
  id?: string;
}
export const BEAUTY_KEYWORDS: string[];
export function isBeautyText(text: string): boolean;
export function isBeautyColour(colour: Partial<PaletteColor> & { beauty?: boolean; sourceSection?: string | null }): boolean;
export function classifySection(text: string): 'core' | 'neutral' | 'avoid' | 'ignore';
export function classifyPage(pageText: string): 'core' | 'neutral' | 'avoid' | 'ignore';
export function extractFromPages(pages: { page: number; text: string }[]): ExtractedColour[];
export function removeBeautyColours(colours: ExtractedColour[]): { kept: ExtractedColour[]; removed: ExtractedColour[]; removedCount: number };
export function summarizeColours(colours: { role: string }[]): { core: number; neutral: number; avoid: number; total: number; warnings: string[] };
