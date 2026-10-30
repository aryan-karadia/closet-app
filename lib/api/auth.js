// API auth guard (refs ISSUE-21, contract auth section).
// Every API endpoint requires authentication. The guard runs before routing,
// so even an unknown path returns 401 when unauthenticated, not 404.
// Local and test mode only: when Supabase variables are absent, or when
// CLOSET_TEST_MODE=1, a token of the form "Bearer test:<user-id>" is accepted.
// That mode must never be enabled in production. With Supabase configured,
// the token is validated against the Supabase Auth user endpoint, which
// checks the signature, instead of trusting a decoded payload.
// No service role key is used here, and no service role key may appear in
// client code. No em dashes are used in this file.
'use strict';

const { unauthenticated } = require('./errors');

function isTestMode() {
  if (process.env.CLOSET_TEST_MODE === '1') return true;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

async function getUser(headers) {
  const auth = headers.authorization || headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/.exec(auth);
  if (!match) throw unauthenticated('Authentication is required. Send an Authorization Bearer token.');
  const token = match[1].trim();
  if (!token) throw unauthenticated('Authentication token is missing.');

  if (isTestMode()) {
    const testMatch = /^(test|dev):(.+)$/.exec(token);
    if (!testMatch) {
      throw unauthenticated('In local and test mode, use a token of the form Bearer test:<user-id>.');
    }
    const userId = testMatch[2].trim();
    if (!userId) throw unauthenticated('Test user id is missing.');
    return { id: userId, email: null, token };
  }

  // Production path: validate the Supabase access token with Supabase Auth.
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  try {
    const response = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: {
        apikey: anonKey,
        Authorization: 'Bearer ' + token,
      },
    });
    if (!response.ok) throw unauthenticated('Authentication token is invalid or expired.');
    const data = await response.json();
    if (!data || !data.id) throw unauthenticated('Authentication token is invalid.');
    return { id: data.id, email: data.email || null, token };
  } catch (error) {
    if (error && error.status === 401) throw error;
    throw unauthenticated('Authentication could not be verified.');
  }
}

module.exports = { getUser, isTestMode };
