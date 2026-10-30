// Data export ZIP (refs ISSUE-28, spec sections 9.4 and 16.7).
// One tap export of profile, palettes, items, advice rules, outfits, and
// wear logs as JSON, plus stored photos when the provider holds them.
// ZIP is built with stored (uncompressed) entries and a CRC32, using only
// Node builtins, so no paid service and no extra dependency is required.
// No em dashes are used in this file.
'use strict';

const { getStorageProvider } = require('../storage/index');
const { now } = require('./store');
const itemColours = require('./item-colours');
const { paletteWithChildren } = require('./palettes');
const { costPerWear } = require('./http');

// CRC32 table, standard polynomial 0xEDB88320.
const CRC_TABLE = (() => {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(date) {
  const time = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((Math.floor(date.getSeconds() / 2)) & 0x1F);
  const day = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0x0F) << 5) | (date.getDate() & 0x1F);
  return { time, date: day };
}

function buildZip(files) {
  // files: [{ name, data: Buffer }]
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime(new Date());
  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8');
    const crc = crc32(file.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034B50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(stamp.time, 10);
    localHeader.writeUInt16LE(stamp.date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(file.data.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, file.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014B50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(stamp.time, 12);
    centralHeader.writeUInt16LE(stamp.date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(file.data.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + file.data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

async function createExport(ctx) {
  const userId = ctx.user.id;
  const db = ctx.db;
  const profiles = await db.list('profiles', userId);
  const profile = profiles.length > 0 ? profiles[0] : null;
  const palettesRaw = await db.list('palettes', userId);
  const palettes = [];
  for (const palette of palettesRaw) {
    palettes.push(await paletteWithChildren(db, palette));
  }
  const itemsRaw = await db.list('items', userId);
  const items = [];
  for (const item of itemsRaw) {
    const colours = await itemColours.loadColours(db, item.id, userId);
    items.push({ ...item, colours, costPerWear: costPerWear(item) });
  }
  const adviceRules = await db.list('adviceRules', userId);
  const outfitsRaw = await db.list('outfits', userId);
  const outfits = [];
  for (const outfit of outfitsRaw) {
    const entries = (await db.list('outfitItems', userId)).filter((entry) => entry.outfitId === outfit.id);
    outfits.push({ ...outfit, items: entries });
  }
  const wearLogs = await db.list('wearLogs', userId);

  const provider = getStorageProvider();
  const photoFiles = [];
  if (typeof provider.getFile === 'function') {
    for (const item of itemsRaw) {
      for (const path of [item.photoPath, item.thumbnailPath]) {
        if (!path) continue;
        const data = provider.getFile(path);
        if (data) photoFiles.push({ name: 'photos/' + path, data });
      }
    }
  }

  const exportedAt = now();
  const exportMeta = {
    exportedAt,
    userId,
    counts: {
      palettes: palettes.length,
      items: items.length,
      adviceRules: adviceRules.length,
      outfits: outfits.length,
      wearLogs: wearLogs.length,
      photos: photoFiles.length,
    },
    photosNote: photoFiles.length === 0 && typeof provider.getFile !== 'function'
      ? 'Photos are not included from this storage provider. JSON still lists storage paths.'
      : null,
  };
  const files = [
    { name: 'export.json', data: Buffer.from(JSON.stringify(exportMeta, null, 2), 'utf8') },
    { name: 'profile.json', data: Buffer.from(JSON.stringify(profile, null, 2), 'utf8') },
    { name: 'palettes.json', data: Buffer.from(JSON.stringify(palettes, null, 2), 'utf8') },
    { name: 'items.json', data: Buffer.from(JSON.stringify(items, null, 2), 'utf8') },
    { name: 'advice-rules.json', data: Buffer.from(JSON.stringify(adviceRules, null, 2), 'utf8') },
    { name: 'outfits.json', data: Buffer.from(JSON.stringify(outfits, null, 2), 'utf8') },
    { name: 'wear-logs.json', data: Buffer.from(JSON.stringify(wearLogs, null, 2), 'utf8') },
    ...photoFiles,
  ];
  const zip = buildZip(files);
  const datePart = exportedAt.slice(0, 10);
  return { status: 200, zip, filename: 'closet-export-' + datePart + '.zip' };
}

module.exports = { createExport, buildZip, crc32 };
