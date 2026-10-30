// Small HTTP helpers shared by the dev server and the Next.js route adapter
// (refs ISSUE-26). Handlers return { status, body } or { status, zip, filename }
// and never write HTTP responses themselves, so the same handler can run in
// both hosts. No em dashes are used in this file.
'use strict';

const { toErrorBody } = require('./errors');

function ok(body, status) {
  return { status: status || 200, body };
}

function created(body) {
  return { status: 201, body };
}

function handleError(error) {
  return toErrorBody(error);
}

function costPerWear(item) {
  if (item.price === null || item.price === undefined) return null;
  if (!item.wearCount || item.wearCount <= 0) return null;
  return Math.round((item.price / item.wearCount) * 100) / 100;
}

module.exports = { ok, created, handleError, costPerWear };
