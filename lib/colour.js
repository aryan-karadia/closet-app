// Colour conversion helpers (refs ISSUE-01, ISSUE-10).
// Pure functions, no dependencies. Used to derive Lab and HSL values from a
// hex colour when the client supplies only a hex, and by the Delta E rating
// engine. Lab conversion uses sRGB with D65, the standard CIE76 path for
// version 1 (spec section 5.3). No em dashes are used in this file.
'use strict';

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(lightness * 1000) / 10 };
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === rn) hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) hue = ((bn - rn) / delta + 2) * 60;
  else hue = ((rn - gn) / delta + 4) * 60;
  return {
    h: Math.round(hue * 10) / 10,
    s: Math.round(saturation * 1000) / 10,
    l: Math.round(lightness * 1000) / 10,
  };
}

function linearize(channel) {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r, g, b) {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);
  return {
    x: (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) * 100,
    y: (rl * 0.2126 + gl * 0.7152 + bl * 0.0722) * 100,
    z: (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) * 100,
  };
}

function labPivot(value) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

function rgbToLab(r, g, b) {
  const xyz = rgbToXyz(r, g, b);
  const xn = labPivot(xyz.x / 95.047);
  const yn = labPivot(xyz.y / 100.0);
  const zn = labPivot(xyz.z / 108.883);
  return {
    l: Math.round((116 * yn - 16) * 100) / 100,
    a: Math.round(500 * (xn - yn) * 100) / 100,
    b: Math.round(200 * (yn - zn) * 100) / 100,
  };
}

function hexToLab(hex) {
  const rgb = hexToRgb(hex);
  return rgbToLab(rgb.r, rgb.g, rgb.b);
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function deltaE76(lab1, lab2) {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// Family from hue and lightness, used when a family is not supplied by the
// client. Neutral families (white, black, gray) are decided by lightness
// and saturation first, because hue is meaningless for near grays.
function familyFromHsl(hsl, familyHint) {
  if (familyHint) return familyHint;
  const h = hsl.h;
  const s = hsl.s;
  const l = hsl.l;
  if (l >= 92 && s < 20) return 'white';
  if (l <= 12) return 'black';
  if (s < 12) return 'gray';
  if (h >= 200 && h < 250) return l < 30 ? 'navy' : 'blue';
  if (h >= 150 && h < 200) return 'teal';
  if (h >= 120 && h < 150) return 'green';
  if (h >= 80 && h < 120) return 'green';
  if (h >= 45 && h < 80) return 'yellow';
  if (h >= 20 && h < 45) return 'orange';
  if (h >= 10 && h < 20) return 'brown';
  if (h >= 340 || h < 10) return 'red';
  if (h >= 300 && h < 340) return 'pink';
  if (h >= 270 && h < 300) return 'purple';
  if (h >= 250 && h < 270) return 'plum';
  return 'other';
}

function deriveFromHex(hex) {
  const lab = hexToLab(hex);
  const hsl = hexToHsl(hex);
  return { lab, hsl, family: familyFromHsl(hsl, null) };
}

module.exports = {
  hexToRgb,
  rgbToHsl,
  rgbToLab,
  hexToLab,
  hexToHsl,
  deltaE76,
  familyFromHsl,
  deriveFromHex,
};
