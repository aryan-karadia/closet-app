// Type declarations for lib/rating.js (refs ISSUE-10).
export interface Lab { l: number; a: number; b: number; }
export interface Hsl { h: number; s: number; l: number; }
export interface PaletteColourInput {
  id?: string;
  name?: string;
  hex?: string;
  lab?: Lab;
  labL?: number;
  labA?: number;
  labB?: number;
  hue?: number;
  saturation?: number;
  lightness?: number;
  family?: string;
  role?: string;
}
export interface AvoidRuleInput {
  name: string;
  hueMin: number;
  hueMax: number;
  saturationMin: number;
  saturationMax: number;
  lightnessMin: number;
  lightnessMax: number;
  description?: string | null;
}
export interface PaletteInput {
  colours?: PaletteColourInput[];
  avoidRules?: AvoidRuleInput[];
}
export interface ColourInput {
  hex?: string;
  lab?: Lab;
  labL?: number;
  labA?: number;
  labB?: number;
  hue?: number;
  saturation?: number;
  lightness?: number;
  hsl?: Hsl;
  family?: string;
  percentage?: number;
  isPrimary?: boolean;
}
export interface RatingResult {
  score: number | null;
  verdict: string | null;
  nearestPaletteColorId: string | null;
  nearestPaletteColorName: string | null;
  deltaE: number | null;
  reason: string;
  secondaryClash: boolean;
  secondaryClashRule?: string | null;
}
export interface RateItemInput {
  primary?: string | ColourInput;
  primaryHex?: string;
  primaryColour?: ColourInput;
  colours?: ColourInput[];
  secondary?: ColourInput[];
  secondaryColours?: ColourInput[];
  palette?: PaletteInput | PaletteColourInput[];
  paletteColours?: PaletteColourInput[];
}
export const DEFAULT_PALETTE_COLOURS: PaletteColourInput[];
export const DEFAULT_AVOID_RULES: AvoidRuleInput[];
export function clampScore(value: number): number;
export function scoreFromDeltaE(deltaE: number): number;
export function tierForScore(score: number): string;
export function rateItem(input: string | ColourInput | RateItemInput, palette?: PaletteInput | PaletteColourInput[], secondary?: ColourInput[]): RatingResult;
export function rate(input: string | ColourInput | RateItemInput, palette?: PaletteInput | PaletteColourInput[], secondary?: ColourInput[]): RatingResult;
export function rateColour(primaryInput: string | ColourInput, paletteInput?: PaletteInput | PaletteColourInput[], secondaryInputs?: ColourInput[]): RatingResult;
export function normalizeColour(input: unknown): ColourInput | null;
export function normalizePalette(input: unknown): PaletteInput;
export function findNearest(primary: ColourInput, colours: PaletteColourInput[]): { colour: PaletteColourInput; deltaE: number } | null;
export function deltaE76(lab1: Lab, lab2: Lab): number;
export function hexToLab(hex: string): Lab;
export function hexToHsl(hex: string): Hsl;
