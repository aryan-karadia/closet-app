// Shared frontend types for the frozen API contract (refs ISSUE-20).
// Field names match docs/api-contract.md exactly (camelCase). No new fields are invented here.
// No em dashes are used in this file.

export type Role = 'core' | 'neutral' | 'avoid';
export type Family = 'blue' | 'green' | 'purple' | 'red' | 'teal' | 'plum' | 'burgundy' | 'black' | 'gray' | 'navy' | 'orange' | 'brown' | 'pink' | 'yellow' | 'white' | 'other';
export type Season = 'winter' | 'spring' | 'autumn' | 'summer' | 'all-season';
export type ItemStatus = 'in rotation' | 'stored' | 'archived';
export type Verdict = 'Perfect' | 'Strong' | 'Works' | 'Avoid';
export type Occasion = 'daily' | 'interview' | 'formal' | 'japan-travel' | 'date-evening';
export type Vibe = 'structured-softboy' | 'clean-minimal' | 'light-old-money' | 'streetwear-minimal';
export type Slot = 'base-top' | 'outer-layer' | 'bottom' | 'shoes' | 'accessory';

export interface PaletteColor {
  id: string; paletteId: string; name: string; hex: string;
  labL?: number | null; labA?: number | null; labB?: number | null;
  hue?: number | null; saturation?: number | null; lightness?: number | null;
  family: Family; role: Role; sourcePage?: number | null; isManual?: boolean;
  createdAt?: string; updatedAt?: string;
  // Local only, never sent to the API as a clothing colour unless the user adds it.
  beauty?: boolean; sourceSection?: string | null;
}

export interface AvoidRule {
  id: string; paletteId: string; name: string;
  hueMin: number; hueMax: number; saturationMin: number; saturationMax: number;
  lightnessMin: number; lightnessMax: number; description?: string | null;
  createdAt?: string; updatedAt?: string;
}

export interface Palette {
  id: string; userId: string; name: string; sourceFileName?: string | null;
  uploadedAt?: string; isActive: boolean; version: number;
  colours?: PaletteColor[]; avoidRules?: AvoidRule[];
  createdAt?: string; updatedAt?: string;
}

export interface ItemColor {
  id?: string; itemId?: string; hex: string;
  labL?: number | null; labA?: number | null; labB?: number | null;
  percentage: number; isPrimary: boolean; family?: string | null;
}

export interface Item {
  id: string; userId?: string; name: string; category: string; season: Season;
  fitTags: string[]; status: ItemStatus; price?: number | null; location?: string | null;
  photoPath?: string | null; thumbnailPath?: string | null;
  photoSignedUrl?: string | null; thumbnailSignedUrl?: string | null;
  primaryColorHex?: string | null; paletteScore?: number | null; paletteVerdict?: Verdict | null;
  nearestPaletteColorId?: string | null; nearestPaletteColorName?: string | null;
  ratingReason?: string | null; autoScore?: number | null;
  manualScore?: number | null; manualScoreNote?: string | null;
  wearCount: number; lastWornAt?: string | null; costPerWear?: number | null;
  deletedAt?: string | null; colours?: ItemColor[];
  createdAt?: string; updatedAt?: string;
}

export interface Profile {
  id: string; userId: string; displayName?: string | null; fitTags: string[];
  styleDirection?: string | null; activePaletteId?: string | null;
  createdAt?: string; updatedAt?: string;
}

export interface AdviceRule {
  id: string; userId?: string; name: string;
  conditionCategory?: string | null; conditionFitTag?: string | null; conditionColourFamily?: string | null;
  action: 'prefer' | 'avoid' | 'require'; weight: number;
  reason: string; source: string; sourceText?: string | null; enabled: boolean;
  createdAt?: string; updatedAt?: string;
}

export interface OutfitItemRef { itemId: string; slot: Slot; itemName?: string | null; item?: Item | null }
export interface Outfit {
  id: string; userId?: string; occasion: Occasion; season: Season; vibe?: Vibe | null;
  items?: OutfitItemRef[]; paletteScore?: number | null; fitScore?: number | null;
  contrastScore?: number | null; rotationScore?: number | null; totalScore?: number | null;
  explanation?: string[]; saved: boolean; createdAt?: string; updatedAt?: string;
}

export interface WearLog {
  id: string; userId?: string; outfitId: string; itemIds: string[];
  itemSnapshots?: { itemId: string; itemName: string }[];
  wornAt: string; occasion?: Occasion | null; note?: string | null;
  createdAt?: string; updatedAt?: string;
}

export interface Paginated<T> { data: T[]; pagination: { page: number; pageSize: number; total: number } }

export interface ApiError { code: string; message: string; details?: Record<string, string> }

export const VERDICTS: Verdict[] = ['Perfect', 'Strong', 'Works', 'Avoid'];
export const SEASONS: Season[] = ['winter', 'spring', 'autumn', 'summer', 'all-season'];
export const OCCASIONS: Occasion[] = ['daily', 'interview', 'formal', 'japan-travel', 'date-evening'];
export const VIBES: Vibe[] = ['structured-softboy', 'clean-minimal', 'light-old-money', 'streetwear-minimal'];
export const SLOTS: Slot[] = ['base-top', 'outer-layer', 'bottom', 'shoes', 'accessory'];
export const SLOT_LABELS: Record<Slot, string> = {
  'base-top': 'Base top', 'outer-layer': 'Outer layer', bottom: 'Bottom', shoes: 'Shoes', accessory: 'Accessory',
};
export const CATEGORIES = [
  'shirt', 'tee', 'sweater', 'knit', 'cardigan', 'jacket', 'coat', 'blazer',
  'trousers', 'jeans', 'chinos', 'shoes', 'boots', 'watch', 'belt', 'bag', 'accessory',
  'hoodie', 'graphic tee',
];
