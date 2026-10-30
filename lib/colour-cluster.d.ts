// Type declarations for lib/colour-cluster.js (refs ISSUE-09).
// No em dashes are used in this file.
export interface RgbPixel { r: number; g: number; b: number }
export interface Cluster { hex: string; labL: number; labA: number; labB: number; percentage: number; count: number }
export interface DominantColour { hex: string; labL: number; labA: number; labB: number; percentage: number; isPrimary: boolean }
export function rgbToHex(r: number, g: number, b: number): string;
export function backgroundMask(pixels: RgbPixel[], width: number, height: number, threshold?: number): { mask: boolean[]; garmentCount: number; background: string } | null;
export function clusterColours(pixels: RgbPixel[], k?: number): Cluster[];
export function dominantColours(pixels: RgbPixel[], k?: number): DominantColour[];
