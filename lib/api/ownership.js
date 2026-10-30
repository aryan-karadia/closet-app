// Ownership helper shared by router and resource handlers (refs ISSUE-01).
// Kept in its own module to avoid a circular require between router.js and
// resource handler modules. Existence is checked first, then ownership, so
// a resource owned by another user is 403 and a missing resource is 404.
// No em dashes are used in this file.
'use strict';

const errors = require('./errors');

function assertOwner(record, userId) {
  if (!record) throw errors.notFound('Resource not found.');
  if (record.userId !== userId) throw errors.forbidden('This resource belongs to another user.');
  return record;
}

module.exports = { assertOwner };
