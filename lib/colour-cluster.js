// Browser colour clustering and simple background removal (refs ISSUE-09, spec sections 5.1 and 5.2).
// Pure functions, no I/O, no imports from tests. Clustering uses garment
// pixels only, k equals 4, in Lab space. Clusters under 5 percent are
// discarded unless they are a clear accent. Background removal here is a
// local corner colour method for plain backgrounds, with a manual save
// fallback when it fails. No paid API is called. No em dashes are used.
'use strict';

let colour = null;
try { colour = require('./colour'); } catch { colour = null; }

function rgbToHex(r, g, b) {
  const part = (v) => Math.round(v).toString(16).padStart(2, '0');
  return '#' + part(r) + part(g) + part(b);
}
function labOf(r, g, b) {
  if (colour && colour.rgbToLab) return colour.rgbToLab(r, g, b);
  return { l: r, a: g, b };
}
function hslOf(r, g, b) {
  if (colour && colour.rgbToHsl) return colour.rgbToHsl(r, g, b);
  return { h: 0, s: 0, l: 0 };
}

// Background colour from border pixels, then a mask for pixels close to it
// in Lab space. Returns null when too few garment pixels remain, which the
// UI treats as a background removal failure and offers a manual save.
function backgroundMask(pixels, width, height, threshold) {
  const limit = threshold === undefined ? 20 : threshold;
  const border = [];
  for (let x = 0; x < width; x += 1) {
    border.push(pixels[x]); border.push(pixels[(height - 1) * width + x]);
  }
  for (let y = 0; y < height; y += 1) {
    border.push(pixels[y * width]); border.push(pixels[y * width + width - 1]);
  }
  const avg = { r: 0, g: 0, b: 0 };
  for (const p of border) { avg.r += p.r; avg.g += p.g; avg.b += p.b; }
  avg.r /= border.length; avg.g /= border.length; avg.b /= border.length;
  const bgLab = labOf(avg.r, avg.g, avg.b);
  const mask = new Array(pixels.length).fill(false);
  let garment = 0;
  for (let i = 0; i < pixels.length; i += 1) {
    const lab = labOf(pixels[i].r, pixels[i].g, pixels[i].b);
    const dl = lab.l - bgLab.l; const da = lab.a - bgLab.a; const db = lab.b - bgLab.b;
    const distance = Math.sqrt(dl * dl + da * da + db * db);
    const isGarment = distance > limit;
    mask[i] = isGarment;
    if (isGarment) garment += 1;
  }
  if (garment < pixels.length * 0.02) return null;
  return { mask, garmentCount: garment, background: rgbToHex(avg.r, avg.g, avg.b) };
}

// Deterministic k-means in Lab space. Initial centres: first pixel, then the
// pixel farthest from existing centres, repeated. No random seed, so the
// same photo gives the same clusters.
function clusterColours(pixels, k) {
  const count = k === undefined ? 4 : k;
  if (!pixels || pixels.length === 0) return [];
  const labs = pixels.map((p) => ({ lab: labOf(p.r, p.g, p.b), r: p.r, g: p.g, b: p.b }));
  const centres = [{ lab: labs[0].lab, r: labs[0].r, g: labs[0].g, b: labs[0].b }];
  while (centres.length < Math.min(count, labs.length)) {
    let best = null; let bestDistance = -1;
    for (const entry of labs) {
      let nearest = Infinity;
      for (const centre of centres) {
        const dl = entry.lab.l - centre.lab.l; const da = entry.lab.a - centre.lab.a; const db = entry.lab.b - centre.lab.b;
        nearest = Math.min(nearest, dl * dl + da * da + db * db);
      }
      if (nearest > bestDistance) { bestDistance = nearest; best = entry; }
    }
    centres.push({ lab: best.lab, r: best.r, g: best.g, b: best.b });
  }
  let assignment = new Array(labs.length).fill(0);
  for (let round = 0; round < 20; round += 1) {
    let changed = false;
    for (let i = 0; i < labs.length; i += 1) {
      let bestIndex = 0; let bestDistance = Infinity;
      for (let c = 0; c < centres.length; c += 1) {
        const dl = labs[i].lab.l - centres[c].lab.l; const da = labs[i].lab.a - centres[c].lab.a; const db = labs[i].lab.b - centres[c].lab.b;
        const distance = dl * dl + da * da + db * db;
        if (distance < bestDistance) { bestDistance = distance; bestIndex = c; }
      }
      if (assignment[i] !== bestIndex) { assignment[i] = bestIndex; changed = true; }
    }
    if (!changed) break;
    for (let c = 0; c < centres.length; c += 1) {
      const members = labs.filter((_, i) => assignment[i] === c);
      if (!members.length) continue;
      centres[c] = {
        lab: {
          l: members.reduce((s, m) => s + m.lab.l, 0) / members.length,
          a: members.reduce((s, m) => s + m.lab.a, 0) / members.length,
          b: members.reduce((s, m) => s + m.lab.b, 0) / members.length,
        },
        r: members.reduce((s, m) => s + m.r, 0) / members.length,
        g: members.reduce((s, m) => s + m.g, 0) / members.length,
        b: members.reduce((s, m) => s + m.b, 0) / members.length,
      };
    }
  }
  const clusters = centres.map((centre, c) => {
    const members = labs.filter((_, i) => assignment[i] === c);
    return {
      hex: rgbToHex(centre.r, centre.g, centre.b),
      labL: Math.round(centre.lab.l * 100) / 100, labA: Math.round(centre.lab.a * 100) / 100, labB: Math.round(centre.lab.b * 100) / 100,
      percentage: Math.round((members.length / labs.length) * 1000) / 10,
      count: members.length,
    };
  }).filter((c) => c.count > 0).sort((a, b) => b.percentage - a.percentage);
  return clusters;
}

// Keep up to 3 dominant colours. Small clusters under 5 percent are dropped
// unless they are a clear accent: far from the primary cluster in Lab space
// and clearly saturated.
function dominantColours(pixels, k) {
  const clusters = clusterColours(pixels, k === undefined ? 4 : k);
  if (!clusters.length) return [];
  const primary = clusters[0];
  const kept = clusters.filter((c, index) => {
    if (index === 0) return true;
    if (c.percentage >= 5) return true;
    const rgb = c.hex.match(/[0-9a-f]{2}/gi).map((h) => parseInt(h, 16));
    const hsl = hslOf(rgb[0], rgb[1], rgb[2]);
    const dl = c.labL - primary.labL; const da = c.labA - primary.labA; const db = c.labB - primary.labB;
    const distance = Math.sqrt(dl * dl + da * da + db * db);
    return distance > 25 && hsl.s >= 40;
  });
  const total = kept.reduce((s, c) => s + c.percentage, 0) || 1;
  return kept.slice(0, 3).map((c, index) => ({
    hex: c.hex, labL: c.labL, labA: c.labA, labB: c.labB,
    percentage: Math.round((c.percentage / total) * 100 * 10) / 10,
    isPrimary: index === 0,
  }));
}

module.exports = { rgbToHex, backgroundMask, clusterColours, dominantColours };
