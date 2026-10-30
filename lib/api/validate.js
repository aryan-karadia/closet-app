// Shared field validators (refs ISSUE-26). Each validator returns a plain
// language message string when the value is invalid, or null when valid.
// Callers collect messages into a details object and raise one
// VALIDATION_ERROR with all field problems, so the frontend can show them
// together instead of one at a time. Unknown fields are ignored by callers.
// No em dashes are used in this file.
'use strict';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkString(value, field, options) {
  const opts = options || {};
  if (value === null || value === undefined) {
    if (opts.required) return field + ' is required.';
    return null;
  }
  if (typeof value !== 'string') return field + ' must be a string.';
  if (opts.minLength && value.length < opts.minLength) return field + ' is too short.';
  if (opts.maxLength && value.length > opts.maxLength) return field + ' is too long.';
  if (opts.nonEmpty && value.trim().length === 0) return field + ' must not be empty.';
  return null;
}

function checkRequiredString(value, field, maxLength) {
  const missing = checkString(value, field, { required: true, nonEmpty: true, maxLength: maxLength || 200 });
  return missing;
}

function checkOptionalString(value, field, maxLength) {
  return checkString(value, field, { maxLength: maxLength || 200 });
}

function checkNumber(value, field, options) {
  const opts = options || {};
  if (value === null || value === undefined) {
    if (opts.required) return field + ' is required.';
    return null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) return field + ' must be a number.';
  if (opts.min !== undefined && value < opts.min) return field + ' is below the allowed minimum.';
  if (opts.max !== undefined && value > opts.max) return field + ' is above the allowed maximum.';
  return null;
}

function checkInteger(value, field, options) {
  const opts = options || {};
  const problem = checkNumber(value, field, opts);
  if (problem) return problem;
  if (value !== null && value !== undefined && !Number.isInteger(value)) return field + ' must be an integer.';
  return null;
}

function checkBoolean(value, field) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'boolean') return field + ' must be a boolean.';
  return null;
}

function checkEnum(value, field, allowed, options) {
  const opts = options || {};
  if (value === null || value === undefined) {
    if (opts.required) return field + ' is required.';
    return null;
  }
  if (!allowed.includes(value)) return field + ' must be one of: ' + allowed.join(', ') + '.';
  return null;
}

function checkHex(value, field, options) {
  const opts = options || {};
  if (value === null || value === undefined) {
    if (opts.required) return field + ' is required.';
    return null;
  }
  if (typeof value !== 'string' || !HEX_PATTERN.test(value)) return field + ' must be a hex colour like #12284B.';
  return null;
}

function checkStringArray(value, field, maxItems) {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) return field + ' must be an array of strings.';
  if (maxItems && value.length > maxItems) return field + ' has too many items.';
  for (const entry of value) {
    if (typeof entry !== 'string') return field + ' must be an array of strings.';
  }
  return null;
}

function checkDate(value, field) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return field + ' must be an ISO date string.';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return field + ' must be a valid date.';
  return null;
}

function checkRangePair(body, minField, maxField, details) {
  const min = body[minField];
  const max = body[maxField];
  if (typeof min === 'number' && typeof max === 'number' && min > max) {
    details[maxField] = maxField + ' must be greater than or equal to ' + minField + '.';
  }
}

// Collects details and returns null when there are none, otherwise the details object.
function collectDetails(checks) {
  const details = {};
  for (const [field, problem] of checks) {
    if (problem) details[field] = problem;
  }
  return Object.keys(details).length === 0 ? null : details;
}

function parsePagination(query) {
  const rawPage = query.page;
  const rawSize = query.pageSize;
  let page = 1;
  let pageSize = 20;
  if (rawPage !== undefined) {
    page = Number(rawPage);
    if (!Number.isInteger(page)) {
      const error = new Error('page must be an integer.');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }
  if (rawSize !== undefined) {
    pageSize = Number(rawSize);
    if (!Number.isInteger(pageSize)) {
      const error = new Error('pageSize must be an integer.');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 1;
  if (pageSize > 100) pageSize = 100;
  return { page, pageSize };
}

function paginate(items, pagination) {
  const start = (pagination.page - 1) * pagination.pageSize;
  const data = items.slice(start, start + pagination.pageSize);
  return {
    data,
    pagination: { page: pagination.page, pageSize: pagination.pageSize, total: items.length },
  };
}

function parseBooleanQuery(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

module.exports = {
  HEX_PATTERN,
  isPlainObject,
  checkString,
  checkRequiredString,
  checkOptionalString,
  checkNumber,
  checkInteger,
  checkBoolean,
  checkEnum,
  checkHex,
  checkStringArray,
  checkDate,
  checkRangePair,
  collectDetails,
  parsePagination,
  paginate,
  parseBooleanQuery,
};
