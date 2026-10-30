// Spec fixtures for the closet app MVP test suite.
// Source: ~/workspace/your_files/closet-app-mvp-build-spec.md, sections 2, 4, 5, 6, 8, 15.
// These fixtures are the spec as test data. They are not production code and
// must not be imported by production code. Production code in lib/ (when it
// lands) must independently satisfy the same expectations. See TEST-PLAN.md
// for the GREEN versus RED distinction.
// No em dashes are used in this file.

'use strict';

// Section 15 and section 2: Deep Winter starting palette.
const CORE_COLOURS = [
  'royal blue',
  'emerald green',
  'rich purple',
  'true red',
  'deep teal',
  'rich plum',
  'dark burgundy',
];

const NEUTRAL_COLOURS = [
  'charcoal gray',
  'navy',
  'cool black',
];

// Section 4.4: avoid rules. Ranges follow the spec examples, not invented hexes.
// Warm orange example in spec: hue 20 to 50, saturation above 40, lightness 30 to 70.
// Light pastel example in spec: lightness above 75, saturation below 45, any hue.
// Muted earthy hues are a named range rule, not a single hex.
const AVOID_RULES = [
  {
    name: 'warm oranges',
    hueMin: 20,
    hueMax: 50,
    saturationMin: 41,
    saturationMax: 100,
    lightnessMin: 30,
    lightnessMax: 70,
    description: 'Warm oranges, warm undertone, saturation above 40, lightness 30 to 70.',
  },
  {
    name: 'light pastels',
    hueMin: 0,
    hueMax: 360,
    saturationMin: 0,
    saturationMax: 44,
    lightnessMin: 76,
    lightnessMax: 100,
    description: 'Light pastels, lightness above 75, saturation below 45, any hue.',
  },
  {
    name: 'muted earthy hues',
    hueMin: 20,
    hueMax: 90,
    saturationMin: 10,
    saturationMax: 45,
    lightnessMin: 25,
    lightnessMax: 65,
    description: 'Muted earthy hues, including muted olive and camel, low saturation and warm.',
  },
];

// Section 4.3, step 1: sections that must be classified as ignore, never saved
// as clothing colours unless the user explicitly adds them.
const BEAUTY_SECTIONS = ['makeup', 'blush', 'lip', 'hair', 'nail', 'facetune'];

const BEAUTY_COLOUR_EXAMPLES = [
  { name: 'blush pink', section: 'blush', sourcePage: 4 },
  { name: 'lip rose', section: 'lip', sourcePage: 5 },
  { name: 'hair brown', section: 'hair', sourcePage: 6 },
  { name: 'makeup nude', section: 'makeup', sourcePage: 4 },
];

// Section 6.5: the 10 starting advice rules. Each is an editable record with
// condition, action, reason, source, and enabled flag. Source values are only
// the two spec sources.
const STARTING_ADVICE_RULES = [
  {
    name: 'Shoulders first',
    conditionCategory: 'top or outer',
    conditionFitTag: 'structured shoulder or fits shoulders',
    action: 'prefer',
    avoidTag: 'dropped shoulder or too tight in shoulders',
    reason: 'Size for wide shoulders and large traps first.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Base layer arms',
    conditionCategory: 'base top',
    conditionFitTag: 'fitted sleeve or fitted arms',
    action: 'prefer',
    reason: 'Tighter fit on arms to show muscles, without sizing down the outer layer.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Outer body',
    conditionCategory: 'outer layer',
    conditionFitTag: 'relaxed body or loose chest and stomach',
    action: 'prefer',
    avoidTag: 'tight chest or boxy all over',
    reason: 'Loose in chest and stomach, but structured at the shoulder, not boxy everywhere.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Trouser cut',
    conditionCategory: 'trousers or jeans',
    conditionFitTag: 'straight or tapered',
    action: 'prefer',
    avoidTag: 'very slim or skinny',
    reason: 'Very slim bottoms make a broad upper body look top heavy, and need room for wide feet and shoes.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Sleeve fit',
    conditionCategory: 'base top',
    conditionFitTag: null,
    action: 'avoid',
    avoidTag: 'billowy sleeve or very loose sleeve',
    reason: 'Loose sleeves hide the arm fit the user prefers.',
    source: 'User stated fit preference',
    enabled: true,
  },
  {
    name: 'Contrast',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    action: 'prefer',
    avoidTag: 'low contrast pastel on pastel',
    reason: 'Deep Winter needs high contrast, and low contrast washes out the palette.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Colour temperature',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    action: 'prefer',
    avoidTag: 'warm oranges and warm browns as main colours',
    reason: 'Deep Winter is a cool palette.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'One detail',
    conditionCategory: 'outfit',
    conditionFitTag: null,
    action: 'prefer',
    reason: 'Structured softboy style, one romantic detail per outfit.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Jewelry and watch',
    conditionCategory: 'accessory',
    conditionFitTag: null,
    action: 'prefer',
    reason: 'Silver fits the cool undertone, and a leather band watch is a priority accessory.',
    source: 'User stated style direction',
    enabled: true,
  },
  {
    name: 'Neckline',
    conditionCategory: 'base top',
    conditionFitTag: null,
    action: 'prefer',
    reason: 'A high closed crew neck under a closed outer can make large traps and a broad neck look more crowded. This rule is a preference, not a hard filter.',
    source: 'User stated fit preference',
    enabled: true,
  },
];

// Section 11.2: concrete rating cases from the spec acceptance criteria.
// expectedVerdict is the spec verdict, not a production output. The
// implementation-gated rating tests require production code to reproduce
// these verdicts for equivalent inputs.
const RATING_CASES = [
  {
    id: 'white-collared-shirt',
    name: 'white collared shirt',
    primaryFamily: 'white',
    isNeutral: true,
    matchesAvoidRule: null,
    expectedVerdict: 'Strong',
    expectedScoreRange: [70, 89],
    note: 'Strong neutral, not Avoid. Spec sections 3 and 11.2.',
  },
  {
    id: 'navy-sweater',
    name: 'navy sweater',
    primaryFamily: 'navy',
    isNeutral: true,
    matchesAvoidRule: null,
    expectedVerdict: 'Perfect or Strong',
    expectedScoreRange: [70, 100],
    note: 'Perfect or Strong. Spec sections 3 and 11.2.',
  },
  {
    id: 'emerald-knit',
    name: 'emerald knit',
    primaryFamily: 'green',
    isNeutral: false,
    matchesAvoidRule: null,
    expectedVerdict: 'Perfect or Strong',
    expectedScoreRange: [70, 100],
    note: 'Perfect or Strong. Spec section 11.2.',
  },
  {
    id: 'warm-orange-hoodie',
    name: 'warm orange hoodie',
    primaryFamily: 'orange',
    isNeutral: false,
    matchesAvoidRule: 'warm oranges',
    expectedVerdict: 'Avoid',
    expectedScoreRange: [0, 40],
    note: 'Avoid, with reason mentioning the warm orange avoid rule.',
  },
  {
    id: 'light-pastel-tee',
    name: 'light pastel tee',
    primaryFamily: 'pink',
    isNeutral: false,
    matchesAvoidRule: 'light pastels',
    expectedVerdict: 'Avoid',
    expectedScoreRange: [0, 40],
    note: 'Avoid, with reason mentioning the pastel avoid rule.',
  },
  {
    id: 'muted-olive-item',
    name: 'muted olive item',
    primaryFamily: 'green',
    isNeutral: false,
    matchesAvoidRule: 'muted earthy hues',
    expectedVerdict: 'Avoid or Works as accent only',
    expectedScoreRange: [0, 69],
    note: 'Avoid or Works as accent only at most, with reason mentioning muted earthy avoid range.',
  },
  {
    id: 'camel-item',
    name: 'camel item',
    primaryFamily: 'brown',
    isNeutral: false,
    matchesAvoidRule: 'muted earthy hues',
    expectedVerdict: 'Avoid or Works as accent only',
    expectedScoreRange: [0, 69],
    note: 'Avoid or Works as accent only at most, same rule as muted olive.',
  },
  {
    id: 'navy-base-warm-orange-stripe',
    name: 'multi colour navy base with warm orange stripe',
    primaryFamily: 'navy',
    isNeutral: true,
    matchesAvoidRule: null,
    secondary: { family: 'orange', percentage: 30, matchesAvoidRule: 'warm oranges' },
    expectedVerdict: 'Reduced with secondary clash',
    expectedScoreRange: [0, 100],
    note: 'Secondary over 25 percent: minus 15 points and flagged secondary clash. Spec section 5.3.',
  },
];

// Section 6.2 and 6.3: slot names used by outfit fixtures.
const OUTFIT_SLOTS = ['base top', 'outer layer', 'bottom', 'shoes', 'accessory'];

// Section 8: resource names from the spec data model. API paths are NOT in
// this list and are NOT final. Paths are to be confirmed against the frozen
// contract in docs/api-contract.md (ISSUE-23, owned by Agent B).
const API_RESOURCES = [
  'palettes',
  'palette colours',
  'avoid rules',
  'items',
  'item colours',
  'advice rules',
  'outfits',
  'outfit items',
  'wear logs',
];

// Section 8 field lists, used by contract schema tests. Field names in the
// spec are suggestions, not a requirement, but the relationships must be
// preserved, so these tests check presence of the concept, not exact spelling
// in a frozen contract that does not exist yet.
const RESOURCE_FIELDS = {
  palettes: ['id', 'name', 'sourceFileName', 'uploadedAt', 'isActive', 'version'],
  'palette colours': ['id', 'paletteId', 'name', 'hex', 'labL', 'labA', 'labB', 'hue', 'saturation', 'lightness', 'family', 'role', 'sourcePage', 'isManual'],
  'avoid rules': ['id', 'paletteId', 'name', 'hueMin', 'hueMax', 'saturationMin', 'saturationMax', 'lightnessMin', 'lightnessMax', 'description'],
  items: ['id', 'category', 'name', 'primaryColorHex', 'paletteScore', 'paletteVerdict', 'nearestPaletteColorId', 'autoScore', 'manualScore', 'season', 'fitTags', 'status', 'price', 'wearCount', 'lastWornAt', 'location'],
  'item colours': ['itemId', 'hex', 'lab', 'percentage', 'isPrimary'],
  'advice rules': ['id', 'name', 'conditionCategory', 'action', 'weight', 'reason', 'source', 'enabled'],
  outfits: ['id', 'occasion', 'season', 'vibe', 'paletteScore', 'fitScore', 'contrastScore', 'rotationScore', 'totalScore', 'explanation', 'saved'],
  'outfit items': ['outfitId', 'itemId', 'slot'],
  'wear logs': ['id', 'outfitId', 'itemIds', 'wornAt', 'occasion', 'note'],
};

// Candidate single JSON error shape for contract skeletons only. This shape
// is NOT frozen and is NOT final. It is proposed here so skeleton tests can
// check consistency, and it must be confirmed or replaced by Agent B in the
// frozen contract (ISSUE-23) through Agent D. Paths are to be confirmed
// against the frozen contract.
const CANDIDATE_ERROR_SHAPE = {
  error: {
    code: 'string, for example VALIDATION_ERROR',
    message: 'string, plain language',
  },
};

const HTTP_ERROR_CASES = [
  { situation: 'invalid input', status: 400 },
  { situation: 'unauthenticated request', status: 401 },
  { situation: 'wrong owner', status: 403 },
  { situation: 'missing resource', status: 404 },
];

module.exports = {
  CORE_COLOURS,
  NEUTRAL_COLOURS,
  AVOID_RULES,
  BEAUTY_SECTIONS,
  BEAUTY_COLOUR_EXAMPLES,
  STARTING_ADVICE_RULES,
  RATING_CASES,
  OUTFIT_SLOTS,
  API_RESOURCES,
  RESOURCE_FIELDS,
  CANDIDATE_ERROR_SHAPE,
  HTTP_ERROR_CASES,
};
