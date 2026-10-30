// Validation and error handling standard (refs ISSUE-26, contract section on error shape).
// Every API error uses one shape: { error: { code, message, details? } }.
// Status mapping: 400 VALIDATION_ERROR, 401 UNAUTHENTICATED, 403 FORBIDDEN,
// 404 NOT_FOUND, 405 METHOD_NOT_ALLOWED, 500 INTERNAL_ERROR.
// No em dashes are used in this file.
'use strict';

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    if (details) this.details = details;
  }
}

function validationError(details, message) {
  return new ApiError(400, 'VALIDATION_ERROR', message || 'Invalid input.', details || null);
}

function unauthenticated(message) {
  return new ApiError(401, 'UNAUTHENTICATED', message || 'Authentication is required.');
}

function forbidden(message) {
  return new ApiError(403, 'FORBIDDEN', message || 'This resource belongs to another user.');
}

function notFound(message) {
  return new ApiError(404, 'NOT_FOUND', message || 'Resource not found.');
}

function methodNotAllowed(message) {
  return new ApiError(405, 'METHOD_NOT_ALLOWED', message || 'Method not allowed for this path.');
}

function internalError() {
  return new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}

function toErrorBody(error) {
  if (error instanceof ApiError) {
    const body = { error: { code: error.code, message: error.message } };
    if (error.details) body.error.details = error.details;
    return { status: error.status, body };
  }
  // Provider and storage errors carry a code property. Map known codes.
  if (error && error.code === 'NOT_FOUND') {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: error.message || 'Resource not found.' } } };
  }
  if (error && error.code === 'VALIDATION_ERROR') {
    return { status: 400, body: { error: { code: 'VALIDATION_ERROR', message: error.message || 'Invalid input.' } } };
  }
  if (error && error.code === 'FORBIDDEN') {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: error.message || 'This resource belongs to another user.' } } };
  }
  return { status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } } };
}

module.exports = {
  ApiError,
  validationError,
  unauthenticated,
  forbidden,
  notFound,
  methodNotAllowed,
  internalError,
  toErrorBody,
};
