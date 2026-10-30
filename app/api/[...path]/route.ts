// Next.js API catch-all route (refs ISSUE-21).
// This route adapts a Next.js request to the shared router in lib/api/router.js,
// which is the same router used by scripts/dev-server.js. All backend logic
// lives in lib/api and lib/data, not in this file, so the dev server and the
// Next.js app always serve the same endpoints. No UI pages live here.
// No em dashes are used in this file.
import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleRequest } = require('../../../lib/api/router');

export const dynamic = 'force-dynamic';

async function adapt(request: NextRequest) {
  const url = new URL(request.url);
  const text = await request.text();
  let body: unknown = null;
  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON.' } },
        { status: 400 },
      );
    }
  }
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  const result = await handleRequest({
    method: request.method,
    path: url.pathname,
    query,
    headers,
    body,
  });
  if (result.file) {
    return new NextResponse(result.file, {
      status: result.status,
      headers: { 'Content-Type': result.contentType || 'application/octet-stream' },
    });
  }
  if (result.zip) {
    return new NextResponse(result.zip, {
      status: result.status,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="' + result.filename + '"',
      },
    });
  }
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: NextRequest) {
  return adapt(request);
}
export async function POST(request: NextRequest) {
  return adapt(request);
}
export async function PATCH(request: NextRequest) {
  return adapt(request);
}
export async function DELETE(request: NextRequest) {
  return adapt(request);
}
export async function PUT(request: NextRequest) {
  return adapt(request);
}
